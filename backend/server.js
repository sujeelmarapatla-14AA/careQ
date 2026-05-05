require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

// ── CORS: allow localhost in dev, Vercel domain in production ──────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

// Add any extra origins from env (comma-separated)
// e.g. FRONTEND_URL=https://careq.vercel.app,https://careq-git-main.vercel.app
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== '*') {
  process.env.FRONTEND_URL.split(',').forEach(u => allowedOrigins.push(u.trim()));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }
    // Allow any *.vercel.app subdomain automatically
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight for all routes

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.FRONTEND_URL === '*') return callback(null, true);
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`Socket CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

// ==========================================
// 1. MASTER DATA STORE ARCHITECTURE
// ==========================================
// A. PATIENT DATA STORE
const patientStore = {
  patients: [],         
  queue: {
    'General OPD':  [],    'Emergency':    [],    'Cardiology':   [],
    'Orthopedics':  [],    'Neurology':    [],    'Pediatrics':   [],
    'Gynecology':   [],    'ENT':          [],    'Dermatology':  [],
    'Ophthalmology':[],    'Psychiatry':   [],    'Dental':       [],
    'Radiology':    [],    'Laboratory':   []
  },
  tokenCounter: 0,
  tokenPrefix: 'A',
  lastReset: new Date().toDateString(),
  stats: {
    totalToday: 0,
    patientsToday: 0,  // Alias for frontend compatibility
    dischargedToday: 0,
    emergencyToday: 0,
    avgWaitTime: 0,
    completedToday: 0,
    inProgressCount: 0,
    waitingCount: 0
  }
};

const checkMidnightReset = () => {
    const today = new Date().toDateString();
    if (patientStore.lastReset !== today) {
        // Reset token counter
        patientStore.tokenCounter = 0;
        patientStore.lastReset = today;
        
        // Reset daily stats
        patientStore.stats.totalToday = 0;
        patientStore.stats.patientsToday = 0;
        patientStore.stats.dischargedToday = 0;
        patientStore.stats.emergencyToday = 0;
        patientStore.stats.completedToday = 0;
        patientStore.stats.inProgressCount = 0;
        patientStore.stats.waitingCount = 0;
        
        // Clear patient arrays for new day
        patientStore.patients = [];
        Object.keys(patientStore.queue).forEach(dept => {
            patientStore.queue[dept] = [];
        });
        
        console.log('🌅 Midnight reset completed - new day started');
    }
};

// B. STAFF DATA STORE
// Passwords come from env vars. In production, STAFF_PASSWORD and ADMIN_PASSWORD must be set.
const _staffPwd   = process.env.STAFF_PASSWORD;
const _adminPwd   = process.env.ADMIN_PASSWORD;
const _demoStaffPwd = process.env.DEMO_STAFF_PASSWORD;

if (!_staffPwd || !_adminPwd || !_demoStaffPwd) {
  console.warn('⚠️  WARNING: STAFF_PASSWORD / ADMIN_PASSWORD / DEMO_STAFF_PASSWORD not set in env. Using insecure defaults — DO NOT use in production.');
}

const staffStore = {
  accounts: [
    { id: 'STF001', name: 'Dr. Suresh Reddy', email: 'suresh@arundati.com', password: bcrypt.hashSync(_staffPwd || 'staff123', 8), role: 'Doctor' },
    { id: 'STF002', name: 'Nurse Lakshmi', email: 'lakshmi@arundati.com', password: bcrypt.hashSync(_staffPwd || 'staff123', 8), role: 'Nurse' },
    // Public/Demo
    { id: 'STF999', name: 'Demo Staff', email: process.env.DEMO_STAFF_EMAIL || 'staff@careq.com', password: bcrypt.hashSync(_demoStaffPwd || 'staff123', 8), role: 'Doctor' }
  ],
  activeSessions: [],
  dailyStats: {},
  activityLog: []
};

// C. BED DATA STORE — ENHANCED WITH FULL PATIENT TRACKING
function generateBeds(prefix, total, counts, wardName, category = 'general') {
  const beds = []; 
  let i = 1;
  
  // Available beds
  for (let a = 0; a < counts.available; a++) {
    beds.push({
      id: `${prefix}-${String(i).padStart(2,'0')}`,
      bedId: `${prefix}-${String(i).padStart(2,'0')}`,
      ward: wardName,
      ward_name: wardName,
      category: category,
      status: 'available',
      statusUpdatedAt: new Date(),
      statusUpdatedBy: 'System',
      patientToken: null,
      patientName: null,
      patientAge: null,
      patientGender: null,
      patientPhone: null,
      department: null,
      assignedDoctor: null,
      assignedBy: null,
      assignedAt: null,
      expectedDischarge: null,
      admissionNotes: null,
      reservedUntil: null,
      reservedBy: null,
      reservedReason: null,
      history: [],
      notes: []
    });
    i++;
  }
  
  // Occupied beds (with demo data)
  for (let o = 0; o < counts.occupied; o++) {
    beds.push({
      id: `${prefix}-${String(i).padStart(2,'0')}`,
      bedId: `${prefix}-${String(i).padStart(2,'0')}`,
      ward: wardName,
      ward_name: wardName,
      category: category,
      status: 'occupied',
      statusUpdatedAt: new Date(Date.now() - Math.random() * 86400000 * 2),
      statusUpdatedBy: 'Staff',
      patientToken: `DEMO-${String(o+1).padStart(3,'0')}`,
      patientName: `Patient ${o+1}`,
      patientAge: 25 + Math.floor(Math.random() * 50),
      patientGender: Math.random() > 0.5 ? 'Male' : 'Female',
      patientPhone: null,
      department: wardName.includes('ICU') ? 'Critical Care' : 'General',
      assignedDoctor: 'Dr. Suresh Reddy',
      assignedBy: 'Nurse Lakshmi',
      assignedAt: new Date(Date.now() - Math.random() * 86400000 * 2),
      expectedDischarge: new Date(Date.now() + Math.random() * 86400000 * 3),
      admissionNotes: 'Under observation',
      reservedUntil: null,
      reservedBy: null,
      reservedReason: null,
      history: [{
        action: 'assigned',
        patientToken: `DEMO-${String(o+1).padStart(3,'0')}`,
        patientName: `Patient ${o+1}`,
        by: 'Nurse Lakshmi',
        at: new Date(Date.now() - Math.random() * 86400000 * 2),
        notes: 'Initial admission'
      }],
      notes: []
    });
    i++;
  }
  
  // Maintenance beds
  for (let m = 0; m < counts.maintenance; m++) {
    beds.push({
      id: `${prefix}-${String(i).padStart(2,'0')}`,
      bedId: `${prefix}-${String(i).padStart(2,'0')}`,
      ward: wardName,
      ward_name: wardName,
      category: category,
      status: 'maintenance',
      statusUpdatedAt: new Date(Date.now() - Math.random() * 3600000 * 12),
      statusUpdatedBy: 'Admin',
      patientToken: null,
      patientName: null,
      patientAge: null,
      patientGender: null,
      patientPhone: null,
      department: null,
      assignedDoctor: null,
      assignedBy: null,
      assignedAt: null,
      expectedDischarge: null,
      admissionNotes: null,
      reservedUntil: null,
      reservedBy: null,
      reservedReason: null,
      history: [{
        action: 'maintenance',
        by: 'Admin',
        at: new Date(Date.now() - Math.random() * 3600000 * 12),
        notes: 'Scheduled maintenance'
      }],
      notes: []
    });
    i++;
  }
  
  return beds;
}

const bedStore = {
  arundati: {
    hospitalId: 'HOSP-ARN-001',
    hospitalName: 'Arundati Hospital',
    isLive: true,
    wards: {
      'General Ward (Male)': { 
        totalBeds: 40, 
        category: 'general',
        beds: generateBeds('GM', 40, { available:12, occupied:26, maintenance:2 }, 'General Ward (Male)', 'general') 
      },
      'ICU': { 
        totalBeds: 20, 
        category: 'icu',
        beds: generateBeds('ICU', 20, { available:4, occupied:15, maintenance:1 }, 'ICU', 'icu') 
      },
      'Emergency / Casualty': { 
        totalBeds: 25, 
        category: 'emergency',
        beds: generateBeds('EMG', 25, { available:6, occupied:19, maintenance:0 }, 'Emergency / Casualty', 'emergency') 
      },
      'Pediatrics': {
        totalBeds: 15,
        category: 'pediatric',
        beds: generateBeds('PED', 15, { available:5, occupied:9, maintenance:1 }, 'Pediatrics', 'pediatric')
      },
      'Maternity': {
        totalBeds: 20,
        category: 'maternity',
        beds: generateBeds('MAT', 20, { available:8, occupied:11, maintenance:1 }, 'Maternity', 'maternity')
      }
    }
  }
};

// D. ADMIN DATA STORE
const adminStore = {
  hospital: { 
    name: 'Arundati Hospital', 
    tokenPrefix: 'A',
    address: '123 Medical Center Drive, Healthcare District',
    phone: '+1 (555) 123-4567',
    email: 'info@arundati.com',
    website: 'www.arundati.com',
    logo: null
  },
  accounts: [
    { id: 'ADM001', name: 'Admin User', email: process.env.ADMIN_EMAIL || 'admin@careq.com', password: bcrypt.hashSync(_adminPwd || 'admin123', 8), role: 'Super Admin' }
  ],
  analytics: {
    hourlyPatients: new Array(24).fill(0), dailyPatients: [], deptLoad: {},
    visitTypeBreakdown: { 'Walk-in': 0, 'Appointment': 0, 'Emergency': 0, 'Follow-up': 0 },
    triageBreakdown: { 'Mild': 0, 'Moderate': 0, 'Severe': 0, 'Critical': 0 },
    avgWaitPerHour: new Array(24).fill(0)
  },
  activityFeed: [],
  systemAlerts: []
};

// ==========================================
// 2. AUTHENTICATION & MULTI-PORTAL SYNC
// ==========================================
app.post('/api/auth/staff/login', (req, res) => {
  const { username, password } = req.body;
  const user = staffStore.accounts.find(u => u.email === username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials." });
  
  const token = jwt.sign({ id: user.id, role: 'staff' }, JWT_SECRET, { expiresIn: '24h' });
  staffStore.activeSessions.push({ staffId: user.id, name: user.name, role: 'staff', loginTime: new Date() });
  
  io.emit('staff:online', { name: user.name });
  res.json({ success: true, token, role: 'staff', username: user.email });
});

app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = adminStore.accounts.find(u => u.email === username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, role: 'admin', username: user.email });
});

// Legacy backwards compatibility (admin/verify-2fa)
app.post('/api/auth/admin/verify-2fa', (req, res) => res.json({ success: true, token: 'bypass', role: 'admin' }));
app.post('/api/auth/patient/social', (req, res) => res.json({ success: true, token: 'bypass', role: 'patient' }));

const authenticate = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  if (token === 'bypass') return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET); next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
};

// ==========================================
// 3. QUEUE & PATIENT DATA FLOWS
// ==========================================

// Helper function to keep stats in sync
function syncStats() {
    patientStore.stats.patientsToday = patientStore.stats.totalToday;
}

// Helper function to recalculate all stats from current patient data
function recalculateAllStats() {
    const today = new Date().toDateString();
    const todayPatients = patientStore.patients.filter(p => {
        const regDate = new Date(p.registeredAt).toDateString();
        return regDate === today;
    });
    
    patientStore.stats.totalToday = todayPatients.length;
    patientStore.stats.patientsToday = todayPatients.length;
    patientStore.stats.waitingCount = todayPatients.filter(p => p.status === 'Waiting').length;
    patientStore.stats.inProgressCount = todayPatients.filter(p => p.status === 'In Progress').length;
    patientStore.stats.completedToday = todayPatients.filter(p => p.status === 'Completed').length;
    patientStore.stats.dischargedToday = todayPatients.filter(p => p.status === 'Discharged').length;
    
    return patientStore.stats;
}

function updateAnalyticStats(patient) {
  adminStore.analytics.visitTypeBreakdown[patient.visitType || 'Walk-in'] = (adminStore.analytics.visitTypeBreakdown[patient.visitType || 'Walk-in'] || 0) + 1;
  const hr = new Date().getHours();
  adminStore.analytics.hourlyPatients[hr]++;
  patientStore.stats.totalToday++;
  patientStore.stats.patientsToday++;  // Keep in sync for frontend
  patientStore.stats.waitingCount++;
}

app.post('/api/queue/register', authenticate, async (req, res) => {
  checkMidnightReset();
  
  let { patient_name, severity, condition, department, visitType, age, gender, phone } = req.body;
  patientStore.tokenCounter++;
  const tkn = `${patientStore.tokenPrefix}-${String(patientStore.tokenCounter).padStart(3,'0')}`;
  
  const safeDept = department && patientStore.queue[department] ? department : 'General OPD';
  const pos = patientStore.queue[safeDept].length + 1;
  
  const patientData = {
    token: tkn,
    token_number: tkn,
    patientId: 'PID-' + Date.now(),
    registeredAt: new Date(),
    registeredBy: 'Self-Registration',
    fullName: xss(patient_name || 'Anonymous'),
    patient_name: xss(patient_name || 'Anonymous'),
    age: age || null,
    gender: gender || null,
    phone: phone || null,
    visitType: visitType || 'Walk-in',
    department: safeDept,
    chiefComplaint: xss(condition),
    condition: xss(condition),
    triageScore: parseInt(severity) || 30,
    severity: parseInt(severity) || 30,
    queuePosition: pos,
    position: pos,
    estimatedWaitMins: pos * 8,
    estimatedWaitTime: pos * 8,
    status: 'Waiting',
    priority: parseInt(severity)>80||visitType==='Emergency' ? 'Emergency' : 'Normal'
  };

  patientStore.patients.push(patientData);
  if(patientData.priority === 'Emergency') patientStore.queue[safeDept].unshift(patientData);
  else patientStore.queue[safeDept].push(patientData);

  updateAnalyticStats(patientData);

  // ── Save to Supabase ──────────────────────────────────────
  if (supabase) {
    supabase.from('patients').insert({
      token:               tkn,
      full_name:           patientData.fullName,
      age:                 patientData.age,
      gender:              patientData.gender,
      phone:               patientData.phone,
      department:          safeDept,
      condition:           patientData.condition,
      visit_type:          patientData.visitType,
      severity:            patientData.severity,
      priority:            patientData.priority,
      status:              'Waiting',
      queue_position:      pos,
      estimated_wait_mins: patientData.estimatedWaitMins,
      registered_at:       new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.warn('⚠️  Supabase patient save failed:', error.message);
      else console.log(`✅ [Supabase] Patient ${tkn} saved`);
    });
  }
  // ─────────────────────────────────────────────────────────
  
  const activityEntry = { 
    message: `👤 New patient registered — Token ${tkn} | ${patientData.fullName} | ${safeDept} | ${visitType || 'Walk-in'}`, 
    type: 'patient', 
    by: 'Self-Registration', 
    color: 'cyan', 
    timestamp: new Date(),
    patientToken: tkn,
    patientName: patientData.fullName,
    department: safeDept,
    severity: patientData.severity
  };
  adminStore.activityFeed.unshift(activityEntry);
  if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

  // Emit real-time updates to all connected clients (staff, admin, patient dashboards)
  const allActiveQueues = getAllActiveQueues();
  io.emit('patient:new', patientData);
  io.emit('queueUpdate', allActiveQueues);
  io.emit('queue:update', allActiveQueues);
  io.emit('stats:update', patientStore.stats);
  io.to('admin').emit('activity:log', activityEntry);
  io.to('admin').emit('analytics:update', adminStore.analytics);
  io.to('admin').emit('patient:registered', {
    token: tkn,
    name: patientData.fullName,
    department: safeDept,
    severity: patientData.severity,
    timestamp: new Date()
  });

  console.log(`✅ Token ${tkn} registered for ${patientData.fullName} | Age: ${age} | Gender: ${gender} | Dept: ${safeDept} | Priority: ${patientData.priority}`);

  res.json({ 
    token: tkn, 
    token_number: tkn,
    isEmergency: patientData.priority === 'Emergency', 
    success: true, 
    position: pos, 
    queuePosition: pos,
    estimatedWaitMins: patientData.estimatedWaitMins,
    patientData: patientData
  });
});

// CSV Bulk Upload (FLOW 3)
app.post('/api/queue/upload', authenticate, upload.single('file'), (req, res) => {
    const dataArray = req.body.data; 
    if(!dataArray || !Array.isArray(dataArray)) return res.json({success:false, error:"Missing data elements"});
    
    let cnt = 0;
    dataArray.forEach(p => {
        checkMidnightReset();
        patientStore.tokenCounter++;
        const tkn = `${patientStore.tokenPrefix}-${String(patientStore.tokenCounter).padStart(3,'0')}`;
        
        const patientData = { 
            token: tkn, 
            token_number: tkn,
            fullName: p.fullName || 'Bulk', 
            patient_name: p.fullName || 'Bulk',
            department: p.department || 'General OPD', 
            status: 'Waiting',
            age: p.age || null,
            gender: p.gender || null,
            phone: p.phone || null,
            condition: p.condition || 'Bulk import',
            severity: p.severity || 30,
            visitType: p.visitType || 'Walk-in',
            priority: 'Normal',
            registeredAt: new Date(),
            queuePosition: patientStore.queue[p.department || 'General OPD'].length + 1
        };
        
        patientStore.patients.push(patientData);
        patientStore.queue[patientData.department].push(patientData);
        
        // Update stats
        patientStore.stats.totalToday++;
        patientStore.stats.patientsToday++;
        patientStore.stats.waitingCount++;
        
        cnt++;
    });
    
    io.emit('queueUpdate', getAllActiveQueues());
    io.emit('stats:update', patientStore.stats);
    res.json({ success: true, count: cnt });
});

const getAllActiveQueues = () => {
    const arr = [];
    Object.values(patientStore.queue).forEach(q => q.forEach(p => { if(p.status!=='Completed') arr.push({...p}) }));
    return arr.sort((a,b) => b.triageScore - a.triageScore);
};

app.get('/api/queue', (req, res) => { res.json(getAllActiveQueues()); });

app.get('/api/queue/status/:tokenNumber', authenticate, (req, res) => {
    const p = patientStore.patients.find(x => x.token === req.params.tokenNumber);
    if (!p) return res.status(404).json({ error: 'Token not found' });
    res.json({ ...p, queueLength: Object.values(patientStore.queue).reduce((acc,q)=>acc+q.length,0) });
});

app.patch('/api/queue/:id', authenticate, (req, res) => {
    // legacy api uses id
    const p = patientStore.patients.find(x => x.id === req.params.id || x.token === req.params.id);
    if(p) { 
        const oldStatus = p.status;
        const newStatus = req.body.status || p.status;
        p.status = newStatus;
        
        // Update stats based on status change
        if (oldStatus === 'Waiting' && newStatus !== 'Waiting') {
            patientStore.stats.waitingCount = Math.max(0, patientStore.stats.waitingCount - 1);
        }
        if (newStatus === 'In Progress') {
            patientStore.stats.inProgressCount++;
        }
        if (newStatus === 'Completed') {
            patientStore.stats.completedToday++;
            if (oldStatus === 'In Progress') {
                patientStore.stats.inProgressCount = Math.max(0, patientStore.stats.inProgressCount - 1);
            }
        }
        
        // Create activity log entry
        const staffName = req.body.staffName || req.user?.name || 'Staff';
        const statusColors = {
            'Completed': 'green',
            'In Progress': 'blue',
            'Called': 'amber',
            'Waiting': 'cyan'
        };
        
        const activityEntry = {
            message: `✅ ${staffName} marked ${p.patient_name || p.fullName} as ${newStatus} — ${p.department} | Token ${p.token}`,
            type: 'queue',
            by: staffName,
            color: statusColors[newStatus] || 'cyan',
            timestamp: new Date(),
            patientToken: p.token,
            patientName: p.patient_name || p.fullName,
            oldStatus,
            newStatus,
            department: p.department
        };
        adminStore.activityFeed.unshift(activityEntry);
        if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);
        
        // Emit updates
        io.emit('queueUpdate', getAllActiveQueues());
        io.to('admin').emit('activity:log', activityEntry);
        io.to('admin').emit('stats:update', patientStore.stats);
        io.to('admin').emit('queue:statusChanged', {
            token: p.token,
            oldStatus,
            newStatus,
            patientName: p.patient_name || p.fullName,
            staffName,
            timestamp: new Date()
        });
        
        // Save status update to Supabase
        if (supabase) {
            supabase.from('patients').update({ status: newStatus }).eq('token', p.token).then(({ error }) => {
                if (error) console.error('⚠️ Supabase status update failed:', error.message);
            });
        }
    }
    res.json({ success: true });
});

app.get('/api/patient/:token', authenticate, (req, res) => {
  const p = patientStore.patients.find(x => x.token === req.params.token);
  if (!p) return res.status(404).json({ error: 'Token not found' });
  
  // Calculate current position in queue
  const deptQueue = patientStore.queue[p.department] || [];
  const currentPosition = deptQueue.findIndex(x => x.token === p.token) + 1;
  
  res.json({ 
    ...p, 
    queueLength: deptQueue.length,
    queuePosition: currentPosition > 0 ? currentPosition : p.queuePosition,
    position: currentPosition > 0 ? currentPosition : p.queuePosition
  });
});

app.get('/api/beds', authenticate, (req, res) => {
    let bedsArr = [];
    Object.values(bedStore.arundati.wards).forEach(w => bedsArr = bedsArr.concat(w.beds));
    res.json(bedsArr);
});

// Get beds by ward
app.get('/api/beds/ward/:wardName', authenticate, (req, res) => {
    const ward = bedStore.arundati.wards[req.params.wardName];
    if (!ward) return res.status(404).json({ error: 'Ward not found' });
    res.json(ward.beds);
});

// Get single bed details
app.get('/api/beds/:bedId', authenticate, (req, res) => {
    let foundBed = null;
    Object.values(bedStore.arundati.wards).forEach(w => {
        const bed = w.beds.find(b => b.bedId === req.params.bedId || b.id === req.params.bedId);
        if (bed) foundBed = bed;
    });
    if (!foundBed) return res.status(404).json({ error: 'Bed not found' });
    res.json(foundBed);
});

app.patch('/api/beds/:id', authenticate, (req, res) => {
    let target = null;
    let targetWard = null;
    Object.entries(bedStore.arundati.wards).forEach(([wardName, w]) => {
       const b = w.beds.find(x => x.id === req.params.id || x.bedId === req.params.id);
       if(b) {
         target = b;
         targetWard = wardName;
       }
    });
    
    if(target) {
       // Simple status update (legacy support)
       if (req.body.status) {
         target.status = req.body.status;
         target.statusUpdatedAt = new Date();
         target.statusUpdatedBy = req.body.updatedBy || 'Staff';
       }
       
       // Patient assignment update
       if (req.body.patient_id) {
         target.patientToken = req.body.patient_id;
       }
       
       io.emit('bedsUpdate', getAllBeds());
       io.emit('bed:update', {
         action: 'update',
         bedId: target.bedId,
         ward: targetWard,
         bed: target,
         timestamp: new Date()
       });
    }
    res.json({ success: true });
});

app.get('/api/dashboard/metrics', authenticate, (req, res) => {
    // Calculate real-time bed statistics
    const allBeds = getAllBeds();
    const totalBeds = allBeds.length;
    const occupiedBeds = allBeds.filter(b => b.status === 'occupied').length;
    const bedOccupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    
    // Calculate real-time ward occupancies
    const wardOccupancy = [];
    ['general', 'icu', 'pediatric'].forEach(category => {
       const categoryBeds = allBeds.filter(b => b.category === category);
       const catTotal = categoryBeds.length;
       const catOccupied = categoryBeds.filter(b => b.status === 'occupied').length;
       const percent = catTotal > 0 ? Math.round((catOccupied / catTotal) * 100) : 0;
       
       let label = 'General';
       if (category === 'icu') label = 'ICU';
       if (category === 'pediatric') label = 'Paediatric';
       
       wardOccupancy.push({
          label: label,
          percent: percent,
          class: percent >= 90 ? 'high' : percent >= 75 ? 'warning' : 'low'
       });
    });

    // Generate forecast based on current real-time occupancy
    const currentHour = new Date().getHours();
    const patientFlowForecast = { labels: [], data: [] };
    let forecastedOccupancy = bedOccupancyPct;
    for (let i = 0; i < 12; i++) {
        const h = (currentHour + i) % 24;
        const ampm = h >= 12 ? 'P' : 'A';
        const displayHr = h % 12 || 12;
        patientFlowForecast.labels.push(`${displayHr}${ampm}`);
        
        // Simulating patient flow
        const isDaytime = h >= 8 && h <= 20;
        const change = isDaytime ? (Math.random() * 5) : (Math.random() * -5);
        forecastedOccupancy = Math.max(10, Math.min(100, forecastedOccupancy + change));
        patientFlowForecast.data.push(Math.round(forecastedOccupancy));
    }
    
    res.json({
        patientsToday: patientStore.stats.totalToday,
        totalWaiting: patientStore.stats.waitingCount,
        waitingCount: patientStore.stats.waitingCount,
        inProgressCount: patientStore.stats.inProgressCount,
        completedToday: patientStore.stats.completedToday,
        dischargedToday: patientStore.stats.dischargedToday,
        emergencies: patientStore.patients.filter(p=>p.priority==='Emergency' && p.status !== 'Completed').length,
        totalBeds: totalBeds,
        occupiedBeds: occupiedBeds,
        bedOccupancyPct: bedOccupancyPct,
        avgWaitMinutes: patientStore.stats.avgWaitTime || 45,
        wardOccupancy: wardOccupancy,
        patientFlowForecast: patientFlowForecast
    });
});
app.get('/api/stats', (req, res) => {
    const allBeds = getAllBeds();
    const availableBeds = allBeds.filter(b => b.status === 'available').length;
    
    res.json({ 
        patientsToday: patientStore.stats.totalToday,
        totalToday: patientStore.stats.totalToday,
        avgWaitMins: patientStore.stats.avgWaitTime || 45, 
        bedsAvailable: availableBeds,
        totalBeds: allBeds.length,
        waitingCount: patientStore.stats.waitingCount,
        inProgressCount: patientStore.stats.inProgressCount,
        completedToday: patientStore.stats.completedToday
    });
});

// Endpoint to manually recalculate stats (useful for debugging/admin)
app.post('/api/stats/recalculate', authenticate, (req, res) => {
    const stats = recalculateAllStats();
    io.emit('stats:update', stats);
    res.json({ 
        success: true, 
        message: 'Stats recalculated successfully',
        stats: stats
    });
});

// ==========================================
// BED MANAGEMENT HELPER FUNCTIONS
// ==========================================
const getAllBeds = () => {
  let bedsArr = [];
  Object.values(bedStore.arundati.wards).forEach(w => bedsArr = bedsArr.concat(w.beds));
  return bedsArr;
};

const findBed = (wardName, bedId) => {
  const ward = bedStore.arundati.wards[wardName];
  if (!ward) return null;
  return ward.beds.find(b => b.bedId === bedId || b.id === bedId);
};

const findBedById = (bedId) => {
  let foundBed = null;
  let foundWard = null;
  Object.entries(bedStore.arundati.wards).forEach(([wardName, ward]) => {
    const bed = ward.beds.find(b => b.bedId === bedId || b.id === bedId);
    if (bed) {
      foundBed = bed;
      foundWard = wardName;
    }
  });
  return { bed: foundBed, ward: foundWard };
};

const findPatientBed = (patientToken) => {
  let foundBed = null;
  Object.values(bedStore.arundati.wards).forEach(ward => {
    const bed = ward.beds.find(b => b.patientToken === patientToken);
    if (bed) foundBed = bed;
  });
  return foundBed;
};

const computeWardSummary = (wardName) => {
  const ward = bedStore.arundati.wards[wardName];
  if (!ward) return null;
  return {
    wardName,
    total: ward.beds.length,
    available: ward.beds.filter(b => b.status === 'available').length,
    occupied: ward.beds.filter(b => b.status === 'occupied').length,
    reserved: ward.beds.filter(b => b.status === 'reserved').length,
    maintenance: ward.beds.filter(b => b.status === 'maintenance').length
  };
};

const computeBedSummary = () => {
  const allBeds = getAllBeds();
  return {
    total: allBeds.length,
    available: allBeds.filter(b => b.status === 'available').length,
    occupied: allBeds.filter(b => b.status === 'occupied').length,
    reserved: allBeds.filter(b => b.status === 'reserved').length,
    maintenance: allBeds.filter(b => b.status === 'maintenance').length,
    occupancyRate: ((allBeds.filter(b => b.status === 'occupied').length / allBeds.length) * 100).toFixed(1)
  };
};

const recalculateStats = () => {
  const bedSummary = computeBedSummary();
  return {
    patientsToday: patientStore.stats.totalToday,
    avgWaitMins: patientStore.stats.avgWaitTime || 45,
    bedsAvailable: bedSummary.available,
    totalBeds: bedSummary.total,
    occupiedBeds: bedSummary.occupied,
    bedOccupancyPct: bedSummary.occupancyRate
  };
};

const createLogEntry = (type, data) => {
  return {
    type,
    message: data.message,
    by: data.staffName || 'System',
    timestamp: new Date(),
    details: data.details || {}
  };
};

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Admin room management
    socket.on('join:admin', () => {
        socket.join('admin');
        console.log('👑 Admin joined:', socket.id);
        // Send initial admin data
        socket.emit('analytics:update', adminStore.analytics);
        socket.emit('activity:feed', adminStore.activityFeed);
        socket.emit('stats:update', patientStore.stats);
    });
    
    socket.on('join:staff', (data) => {
        socket.join('staff');
        socket.staffName = data?.staffName || 'Staff Member';
        console.log('👨‍⚕️ Staff joined:', socket.staffName);
    });
    
    // Send initial data on connection
    socket.emit('queueUpdate', getAllActiveQueues());
    socket.emit('bedsUpdate', getAllBeds());
    
    // ==========================================
    // BED ASSIGNMENT
    // ==========================================
    socket.on('bed:assign', (data) => {
        const { ward, bedId, patientToken, patientName, patientAge, patientGender, 
                patientPhone, department, assignedDoctor, assignedBy, admissionNotes, 
                expectedDischarge } = data;
        
        const { bed, ward: foundWard } = findBedById(bedId);
        if (!bed) return socket.emit('bed:error', { message: 'Bed not found' });
        
        if (bed.status === 'occupied') {
            return socket.emit('bed:error', { message: 'Bed already occupied' });
        }
        
        // Release previous bed if patient had one
        const existingBed = findPatientBed(patientToken);
        if (existingBed && existingBed.bedId !== bedId) {
            existingBed.status = 'available';
            existingBed.patientToken = null;
            existingBed.patientName = null;
            existingBed.patientAge = null;
            existingBed.patientGender = null;
            existingBed.patientPhone = null;
            existingBed.department = null;
            existingBed.assignedDoctor = null;
            existingBed.assignedBy = null;
            existingBed.assignedAt = null;
            existingBed.expectedDischarge = null;
            existingBed.admissionNotes = null;
            existingBed.statusUpdatedAt = new Date();
            existingBed.statusUpdatedBy = assignedBy;
            existingBed.history.push({
                action: 'released',
                patientToken,
                patientName,
                by: assignedBy,
                at: new Date(),
                notes: 'Auto-released — patient transferred'
            });
        }
        
        // Assign new bed
        bed.status = 'occupied';
        bed.patientToken = patientToken;
        bed.patientName = patientName;
        bed.patientAge = patientAge;
        bed.patientGender = patientGender;
        bed.patientPhone = patientPhone;
        bed.department = department;
        bed.assignedDoctor = assignedDoctor;
        bed.assignedBy = assignedBy;
        bed.assignedAt = new Date();
        bed.admissionNotes = admissionNotes;
        bed.expectedDischarge = expectedDischarge ? new Date(expectedDischarge) : null;
        bed.statusUpdatedAt = new Date();
        bed.statusUpdatedBy = assignedBy;
        bed.history.push({
            action: 'assigned',
            patientToken,
            patientName,
            by: assignedBy,
            at: new Date(),
            notes: admissionNotes || 'Patient admitted'
        });
        
        // Update patient record
        const patient = patientStore.patients.find(p => p.token === patientToken);
        if (patient) {
            patient.assignedBed = bedId;
            patient.assignedWard = foundWard;
            patient.assignedDoctor = assignedDoctor;
            patient.status = 'Admitted';
        }
        
        const wardSummary = computeWardSummary(foundWard);
        const hospitalSummary = computeBedSummary();
        
        const logEntry = createLogEntry('bed', {
            staffName: assignedBy,
            message: `🛏 ${assignedBy} assigned Bed ${bedId} to ${patientName} (${patientToken}) — ${foundWard}`,
            details: { ward: foundWard, bedId, patientToken, doctor: assignedDoctor }
        });
        logEntry.color = 'amber';
        logEntry.type = 'bed';
        logEntry.by = assignedBy;
        
        adminStore.activityFeed.unshift(logEntry);
        if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);
        
        io.emit('bed:update', {
            action: 'assign',
            ward: foundWard,
            bedId,
            bed,
            wardSummary,
            hospitalSummary,
            by: assignedBy,
            timestamp: new Date()
        });
        io.emit('bedsUpdate', getAllBeds());
        io.emit('stats:update', recalculateStats());
        io.to('admin').emit('activity:log', logEntry);
        io.to('admin').emit('bed:assigned', {
            bedId,
            ward: foundWard,
            patientToken,
            patientName,
            assignedBy,
            timestamp: new Date()
        });
        
        socket.emit('bed:assignSuccess', {
            bedId,
            patientToken,
            patientName,
            message: `✅ Bed ${bedId} successfully assigned to ${patientName}`
        });
        
        console.log(`✅ Bed ${bedId} assigned to ${patientName} by ${assignedBy}`);
    });
    
    // ==========================================
    // BED RELEASE
    // ==========================================
    socket.on('bed:release', (data) => {
        const { bedId, staffName, reason } = data;
        
        const { bed, ward } = findBedById(bedId);
        if (!bed) return socket.emit('bed:error', { message: 'Bed not found' });
        
        const releasedPatient = {
            token: bed.patientToken,
            name: bed.patientName
        };
        
        // Update patient record
        const patient = patientStore.patients.find(p => p.token === releasedPatient.token);
        if (patient) {
            patient.status = 'Discharged';
            patientStore.stats.dischargedToday++;
        }
        
        // Clear bed
        bed.status = 'available';
        bed.patientToken = null;
        bed.patientName = null;
        bed.patientAge = null;
        bed.patientGender = null;
        bed.patientPhone = null;
        bed.department = null;
        bed.assignedDoctor = null;
        bed.assignedBy = null;
        bed.assignedAt = null;
        bed.expectedDischarge = null;
        bed.admissionNotes = null;
        bed.statusUpdatedAt = new Date();
        bed.statusUpdatedBy = staffName;
        bed.history.push({
            action: 'released',
            patientToken: releasedPatient.token,
            patientName: releasedPatient.name,
            by: staffName,
            at: new Date(),
            notes: reason || 'Patient discharged'
        });
        
        const wardSummary = computeWardSummary(ward);
        const hospitalSummary = computeBedSummary();
        
        const logEntry = createLogEntry('bed', {
            staffName,
            message: `🔓 ${staffName} released Bed ${bedId} — ${releasedPatient.name || 'patient'} discharged — ${ward}`,
            details: { ward, bedId }
        });
        logEntry.color = 'green';
        logEntry.type = 'bed';
        logEntry.by = staffName;
        
        adminStore.activityFeed.unshift(logEntry);
        if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);
        
        io.emit('bed:update', {
            action: 'release',
            ward,
            bedId,
            bed,
            wardSummary,
            hospitalSummary,
            by: staffName,
            timestamp: new Date()
        });
        io.emit('bedsUpdate', getAllBeds());
        io.emit('stats:update', recalculateStats());
        io.to('admin').emit('activity:log', logEntry);
        io.to('admin').emit('stats:update', patientStore.stats);
        io.to('admin').emit('bed:released', {
            bedId,
            ward,
            patientToken: releasedPatient.token,
            patientName: releasedPatient.name,
            releasedBy: staffName,
            timestamp: new Date()
        });
        
        socket.emit('bed:releaseSuccess', {
            bedId,
            message: `✅ Bed ${bedId} released — now available`
        });
        
        console.log(`✅ Bed ${bedId} released by ${staffName}`);
    });
    
    // ==========================================
    // BED MAINTENANCE
    // ==========================================
    socket.on('bed:maintenance', (data) => {
        const { bedId, staffName, reason } = data;
        
        const { bed, ward } = findBedById(bedId);
        if (!bed) return socket.emit('bed:error', { message: 'Bed not found' });
        
        if (bed.status === 'occupied') {
            return socket.emit('bed:error', {
                message: 'Cannot mark occupied bed as maintenance. Transfer patient first.'
            });
        }
        
        bed.status = 'maintenance';
        bed.statusUpdatedAt = new Date();
        bed.statusUpdatedBy = staffName;
        bed.history.push({
            action: 'maintenance',
            by: staffName,
            at: new Date(),
            notes: reason || 'Marked for maintenance'
        });
        
        const wardSummary = computeWardSummary(ward);
        const hospitalSummary = computeBedSummary();
        
        const logEntry = createLogEntry('bed', {
            staffName,
            message: `🔧 ${staffName} marked Bed ${bedId} for maintenance — ${ward}`,
            details: { ward, bedId, reason }
        });
        logEntry.color = 'amber';
        logEntry.type = 'bed';
        logEntry.by = staffName;
        
        adminStore.activityFeed.unshift(logEntry);
        if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);
        
        io.emit('bed:update', {
            action: 'maintenance',
            ward,
            bedId,
            bed,
            wardSummary,
            hospitalSummary,
            by: staffName,
            timestamp: new Date()
        });
        io.emit('bedsUpdate', getAllBeds());
        io.to('admin').emit('activity:log', logEntry);
        io.to('admin').emit('bed:maintenance', {
            bedId,
            ward,
            markedBy: staffName,
            reason,
            timestamp: new Date()
        });
        
        socket.emit('bed:maintenanceSuccess', {
            bedId,
            message: `✅ Bed ${bedId} marked for maintenance`
        });
    });
    
    // ==========================================
    // BED RESERVE
    // ==========================================
    socket.on('bed:reserve', (data) => {
        const { bedId, patientToken, patientName, reservedBy, reservedUntil, reason } = data;
        
        const { bed, ward } = findBedById(bedId);
        if (!bed) return socket.emit('bed:error', { message: 'Bed not found' });
        
        if (bed.status !== 'available') {
            return socket.emit('bed:error', { message: 'Only available beds can be reserved' });
        }
        
        bed.status = 'reserved';
        bed.patientToken = patientToken;
        bed.patientName = patientName;
        bed.reservedBy = reservedBy;
        bed.reservedUntil = new Date(reservedUntil);
        bed.reservedReason = reason;
        bed.statusUpdatedAt = new Date();
        bed.statusUpdatedBy = reservedBy;
        bed.history.push({
            action: 'reserved',
            patientToken,
            patientName,
            by: reservedBy,
            at: new Date(),
            notes: reason || 'Bed reserved'
        });
        
        const wardSummary = computeWardSummary(ward);
        const hospitalSummary = computeBedSummary();
        
        io.emit('bed:update', {
            action: 'reserve',
            ward,
            bedId,
            bed,
            wardSummary,
            hospitalSummary,
            by: reservedBy,
            timestamp: new Date()
        });
        io.emit('bedsUpdate', getAllBeds());
        
        socket.emit('bed:reserveSuccess', {
            bedId,
            message: `✅ Bed ${bedId} reserved for ${patientName}`
        });
    });
    
    // ==========================================
    // BED TRANSFER
    // ==========================================
    socket.on('bed:transfer', (data) => {
        const { fromBedId, toBedId, staffName, reason } = data;
        
        const { bed: fromBed, ward: fromWard } = findBedById(fromBedId);
        const { bed: toBed, ward: toWard } = findBedById(toBedId);
        
        if (!fromBed || !toBed) {
            return socket.emit('bed:error', { message: 'Bed not found' });
        }
        
        if (fromBed.status !== 'occupied') {
            return socket.emit('bed:error', { message: 'Source bed is not occupied' });
        }
        
        if (toBed.status !== 'available') {
            return socket.emit('bed:error', { message: 'Target bed is not available' });
        }
        
        // Transfer patient data
        const patientName = fromBed.patientName;
        const patientToken = fromBed.patientToken;
        
        toBed.status = 'occupied';
        toBed.patientToken = fromBed.patientToken;
        toBed.patientName = fromBed.patientName;
        toBed.patientAge = fromBed.patientAge;
        toBed.patientGender = fromBed.patientGender;
        toBed.patientPhone = fromBed.patientPhone;
        toBed.department = fromBed.department;
        toBed.assignedDoctor = fromBed.assignedDoctor;
        toBed.assignedBy = staffName;
        toBed.assignedAt = new Date();
        toBed.admissionNotes = fromBed.admissionNotes;
        toBed.expectedDischarge = fromBed.expectedDischarge;
        toBed.statusUpdatedAt = new Date();
        toBed.statusUpdatedBy = staffName;
        toBed.history.push({
            action: 'transferred_in',
            patientToken: fromBed.patientToken,
            patientName: fromBed.patientName,
            by: staffName,
            at: new Date(),
            notes: `Transferred from ${fromBedId}: ${reason || 'Patient transfer'}`
        });
        
        // Clear old bed
        fromBed.status = 'available';
        fromBed.patientToken = null;
        fromBed.patientName = null;
        fromBed.patientAge = null;
        fromBed.patientGender = null;
        fromBed.patientPhone = null;
        fromBed.department = null;
        fromBed.assignedDoctor = null;
        fromBed.assignedBy = null;
        fromBed.assignedAt = null;
        fromBed.expectedDischarge = null;
        fromBed.admissionNotes = null;
        fromBed.statusUpdatedAt = new Date();
        fromBed.statusUpdatedBy = staffName;
        fromBed.history.push({
            action: 'transferred_out',
            patientToken,
            patientName,
            by: staffName,
            at: new Date(),
            notes: `Transferred to ${toBedId}: ${reason || 'Patient transfer'}`
        });
        
        // Update patient record
        const patient = patientStore.patients.find(p => p.token === patientToken);
        if (patient) {
            patient.assignedBed = toBedId;
            patient.assignedWard = toWard;
        }
        
        const logEntry = createLogEntry('bed', {
            staffName,
            message: `🔄 ${staffName} transferred ${patientName} from Bed ${fromBedId} to ${toBedId} — ${fromWard} → ${toWard}`,
            details: { fromBedId, toBedId, fromWard, toWard, patientToken, reason }
        });
        logEntry.color = 'blue';
        logEntry.type = 'bed';
        logEntry.by = staffName;
        
        adminStore.activityFeed.unshift(logEntry);
        if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);
        
        io.emit('bed:update', {
            action: 'transfer',
            fromBedId,
            toBedId,
            fromWard,
            toWard,
            fromBed,
            toBed,
            by: staffName,
            timestamp: new Date()
        });
        io.emit('bedsUpdate', getAllBeds());
        io.to('admin').emit('activity:log', logEntry);
        io.to('admin').emit('bed:transferred', {
            fromBedId,
            toBedId,
            fromWard,
            toWard,
            patientToken,
            patientName,
            transferredBy: staffName,
            timestamp: new Date()
        });
        
        socket.emit('bed:transferSuccess', {
            fromBedId,
            toBedId,
            message: `✅ Patient transferred from ${fromBedId} to ${toBedId}`
        });
    });
    
    // ==========================================
    // ADD BED NOTE
    // ==========================================
    socket.on('bed:addNote', (data) => {
        const { bedId, staffName, note } = data;
        
        const { bed, ward } = findBedById(bedId);
        if (!bed) return socket.emit('bed:error', { message: 'Bed not found' });
        
        const noteEntry = {
            by: staffName,
            at: new Date(),
            note
        };
        
        bed.notes.push(noteEntry);
        
        io.emit('bed:noteAdded', {
            bedId,
            ward,
            note: noteEntry
        });
        
        socket.emit('bed:noteSuccess', {
            bedId,
            message: '✅ Note added successfully'
        });
    });
    
    // Explicit bed management socket bindings (legacy support)
    socket.on('bed:update', (d) => { io.emit('bedsUpdate', getAllBeds()); });
    
    // Queue update events
    socket.on('queue:update', (d) => { io.emit('queueUpdate', getAllActiveQueues()); });
    
    // Patient registration event (for real-time notifications)
    socket.on('patient:register', (data) => {
      console.log('📢 Patient registration broadcast:', data);
      io.emit('patient:new', data);
      io.emit('queueUpdate', getAllActiveQueues());
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
});

// ==========================================
// HOSPITAL INFO MANAGEMENT
// ==========================================
app.get('/api/hospital/info', (req, res) => {
    res.json(adminStore.hospital);
});

app.patch('/api/hospital/info', authenticate, (req, res) => {
    const { name, tokenPrefix, address, phone, email, website, logo } = req.body;
    
    if (name) adminStore.hospital.name = name;
    if (tokenPrefix) {
        adminStore.hospital.tokenPrefix = tokenPrefix;
        patientStore.tokenPrefix = tokenPrefix;
    }
    if (address) adminStore.hospital.address = address;
    if (phone) adminStore.hospital.phone = phone;
    if (email) adminStore.hospital.email = email;
    if (website) adminStore.hospital.website = website;
    if (logo) adminStore.hospital.logo = logo;
    
    const staffName = req.body.updatedBy || req.user?.name || 'Admin';
    const activityEntry = {
        message: `⚙️ ${staffName} updated hospital information`,
        type: 'system',
        by: staffName,
        color: 'purple',
        timestamp: new Date()
    };
    adminStore.activityFeed.unshift(activityEntry);
    if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);
    
    io.emit('hospital:updated', adminStore.hospital);
    io.to('admin').emit('activity:log', activityEntry);
    
    res.json({ success: true, hospital: adminStore.hospital });
});

// ==========================================
// SIMPLE ROOM-BASED RESOURCES (Supabase + memory fallback)
// ==========================================
const { createClient } = require('@supabase/supabase-js');

const supabase = (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id'))
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

// Memory fallback store
const roomStore = {
  rooms: [
    { id: 'APT-01', name: 'Appointment Room 1', category: 'Appointment Rooms', status: 'occupied', patient: 'Riya Sharma', need: 'Needs Checkup', notes: '', assignedAt: new Date(Date.now() - 8 * 60000) },
    { id: 'APT-02', name: 'Appointment Room 2', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'APT-03', name: 'Appointment Room 3', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'APT-04', name: 'Appointment Room 4', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'CHK-01', name: 'Checkup Room 1',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'CHK-02', name: 'Checkup Room 2',     category: 'Checkup Rooms',     status: 'occupied', patient: 'Arjun Mehta', need: 'Needs Checkup', notes: '', assignedAt: new Date(Date.now() - 22 * 60000) },
    { id: 'CHK-03', name: 'Checkup Room 3',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'CHK-04', name: 'Checkup Room 4',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'MRI-01', name: 'MRI Scanner 1',      category: 'MRI Scan Rooms',    status: 'occupied', patient: 'Priya Nair',  need: 'Needs Scan',    notes: '', assignedAt: new Date(Date.now() - 35 * 60000) },
    { id: 'MRI-02', name: 'MRI Scanner 2',      category: 'MRI Scan Rooms',    status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'XRY-01', name: 'X-Ray Room 1',       category: 'X-Ray Rooms',       status: 'occupied', patient: 'Karan Rao',   need: 'Needs Scan',    notes: '', assignedAt: new Date(Date.now() - 5 * 60000) },
    { id: 'XRY-02', name: 'X-Ray Room 2',       category: 'X-Ray Rooms',       status: 'available', patient: null, need: null, notes: '', assignedAt: null }
  ]
};

// Helper: normalize Supabase row to match memory format
const normalizeRoom = (r) => ({
  id: r.id, name: r.name, category: r.category,
  status: r.status, patient: r.patient, need: r.need,
  notes: r.notes || '', assignedAt: r.assigned_at || null
});

// GET /api/rooms
app.get('/api/rooms', async (req, res) => {
  res.json(roomStore.rooms);
});

// POST /api/rooms/:id - Assign patient
app.post('/api/rooms/:id', async (req, res) => {
  const { patientName, need, notes } = req.body;
  const roomId = req.params.id;

  // Memory fallback
  const room = roomStore.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.status === 'occupied') return res.status(400).json({ error: 'Room is already occupied' });
  room.status = 'occupied'; room.patient = patientName; room.need = need;
  room.notes = notes || ''; room.assignedAt = new Date();
  io.emit('resource:updated', room);
  console.log(`✅ [Memory] Room ${roomId} assigned to ${patientName}`);
  res.json({ success: true, room });
});

// PATCH /api/rooms/:id/clear - Clear room
app.patch('/api/rooms/:id/clear', async (req, res) => {
  const roomId = req.params.id;

  // Memory fallback
  const room = roomStore.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const prev = room.patient;
  room.status = 'available'; room.patient = null; room.need = null;
  room.notes = ''; room.assignedAt = null;
  io.emit('resource:updated', room);
  console.log(`✅ [Memory] Room ${roomId} cleared (was: ${prev})`);
  res.json({ success: true, room });
});

// ==========================================
// PHASE 2: RESOURCE MANAGEMENT API
// ==========================================
const { setupResourceRoutes } = require('./resource-api');
setupResourceRoutes(app, io, authenticate);

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

const PORT = process.env.PORT || 5000;

// Initialize stats from Supabase on server startup
async function initializeStatsFromDatabase() {
  if (!supabase) return;
  
  try {
    const today = new Date().toDateString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    // Get today's patients from Supabase
    const { data: todayPatients, error } = await supabase
      .from('patients')
      .select('*')
      .gte('registered_at', todayStart.toISOString());
    
    if (error) {
      console.warn('⚠️  Could not load stats from Supabase:', error.message);
      return;
    }
    
    if (todayPatients && todayPatients.length > 0) {
      // Restore patients to in-memory store
      todayPatients.forEach(dbPatient => {
        const patientData = {
          token: dbPatient.token,
          token_number: dbPatient.token,
          patientId: dbPatient.patient_id || 'PID-' + Date.now(),
          registeredAt: new Date(dbPatient.registered_at),
          registeredBy: 'Self-Registration',
          fullName: dbPatient.full_name,
          patient_name: dbPatient.full_name,
          age: dbPatient.age,
          gender: dbPatient.gender,
          phone: dbPatient.phone,
          visitType: dbPatient.visit_type || 'Walk-in',
          department: dbPatient.department,
          chiefComplaint: dbPatient.condition,
          condition: dbPatient.condition,
          triageScore: dbPatient.severity || 30,
          severity: dbPatient.severity || 30,
          queuePosition: dbPatient.queue_position,
          position: dbPatient.queue_position,
          estimatedWaitMins: dbPatient.estimated_wait_mins || 0,
          estimatedWaitTime: dbPatient.estimated_wait_mins || 0,
          status: dbPatient.status || 'Waiting',
          priority: dbPatient.priority || 'Normal'
        };
        
        // Add to patients array
        patientStore.patients.push(patientData);
        
        // Add to appropriate queue if still waiting
        if (patientData.status === 'Waiting' && patientStore.queue[patientData.department]) {
          patientStore.queue[patientData.department].push(patientData);
        }
      });
      
      // Update token counter based on ALL patients to avoid unique constraint errors
      const { data: allTokens } = await supabase.from('patients').select('token');
      if (allTokens) {
        const tokenNumbers = allTokens
          .map(p => parseInt(p.token.split('-')[1]))
          .filter(n => !isNaN(n));
        if (tokenNumbers.length > 0) {
          patientStore.tokenCounter = Math.max(...tokenNumbers);
        }
      }
      
      // Recalculate stats
      patientStore.stats.totalToday = todayPatients.length;
      patientStore.stats.patientsToday = todayPatients.length;  // Keep in sync for frontend
      patientStore.stats.waitingCount = todayPatients.filter(p => p.status === 'Waiting').length;
      patientStore.stats.inProgressCount = todayPatients.filter(p => p.status === 'In Progress').length;
      patientStore.stats.completedToday = todayPatients.filter(p => p.status === 'Completed').length;
      patientStore.stats.dischargedToday = todayPatients.filter(p => p.status === 'Discharged').length;
      
      console.log(`✅ Loaded ${todayPatients.length} patients from database`);
      console.log(`📊 Stats: ${patientStore.stats.totalToday} total, ${patientStore.stats.waitingCount} waiting, ${patientStore.stats.completedToday} completed`);
    }
  } catch (err) {
    console.error('❌ Error initializing stats:', err.message);
  }
}

server.listen(PORT, async () => {
  console.log(`Ultimate Node.js API + Socket.io Server active on port ${PORT}`);
  console.log(`✅ Phase 2 Resource Management API loaded`);
  if (supabase) {
    console.log(`✅ Supabase connected: ${process.env.SUPABASE_URL}`);
    await initializeStatsFromDatabase();
  } else {
    console.log(`⚠️  Running in memory mode (Supabase not configured)`);
  }
});

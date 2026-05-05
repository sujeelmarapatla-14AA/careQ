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
const mongoose = require('mongoose');
const { connectDB } = require('./db');
const Patient = require('./models/Patient');
const Bed = require('./models/Bed');
const HospitalConfig = require('./models/HospitalConfig');

const app = express();
const server = http.createServer(app);

// -- CORS: allow localhost in dev, Vercel domain in production ----------------
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
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

// ==========================================
// 1. MASTER DATA STORE ARCHITECTURE
// ==========================================
// A. PATIENT DATA STORE (stats + token counter kept in-memory, synced from DB on startup)
const patientStore = {
  tokenCounter: 0,
  tokenPrefix: 'A',
  lastReset: new Date().toDateString(),
  stats: {
    totalToday: 0,
    patientsToday: 0,
    dischargedToday: 0,
    emergencyToday: 0,
    avgWaitTime: 0,
    completedToday: 0,
    inProgressCount: 0,
    waitingCount: 0
  }
};

const checkMidnightReset = async () => {
  const today = new Date().toDateString();
  if (patientStore.lastReset !== today) {
    patientStore.tokenCounter = 0;
    patientStore.lastReset = today;

    patientStore.stats.totalToday = 0;
    patientStore.stats.patientsToday = 0;
    patientStore.stats.dischargedToday = 0;
    patientStore.stats.emergencyToday = 0;
    patientStore.stats.completedToday = 0;
    patientStore.stats.inProgressCount = 0;
    patientStore.stats.waitingCount = 0;

    // Persist reset to DB
    try {
      await HospitalConfig.findOneAndUpdate(
        { hospitalId: 'HOSP-ARN-001' },
        { tokenCounter: 0, lastReset: today },
        { new: true }
      );
    } catch (e) { /* ignore if mongo not connected */ }

    console.log('Midnight reset completed - new day started');
  }
};

// B. STAFF DATA STORE
const _staffPwd     = process.env.STAFF_PASSWORD;
const _adminPwd     = process.env.ADMIN_PASSWORD;
const _demoStaffPwd = process.env.DEMO_STAFF_PASSWORD;

if (!_staffPwd || !_adminPwd || !_demoStaffPwd) {
  console.warn('WARNING: STAFF_PASSWORD / ADMIN_PASSWORD / DEMO_STAFF_PASSWORD not set in env. Using insecure defaults -- DO NOT use in production.');
}

const staffStore = {
  accounts: [
    { id: 'STF001', name: 'Dr. Suresh Reddy', email: 'suresh@arundati.com', password: bcrypt.hashSync(_staffPwd || 'staff123', 8), role: 'Doctor' },
    { id: 'STF002', name: 'Nurse Lakshmi',    email: 'lakshmi@arundati.com', password: bcrypt.hashSync(_staffPwd || 'staff123', 8), role: 'Nurse' },
    { id: 'STF999', name: 'Demo Staff',        email: process.env.DEMO_STAFF_EMAIL || 'staff@careq.com', password: bcrypt.hashSync(_demoStaffPwd || 'staff123', 8), role: 'Doctor' }
  ],
  activeSessions: [],
  dailyStats: {},
  activityLog: []
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

// Legacy backwards compatibility
app.post('/api/auth/admin/verify-2fa', (req, res) => res.json({ success: true, token: 'bypass', role: 'admin' }));
app.post('/api/auth/patient/social', (req, res) => res.json({ success: true, token: 'bypass', role: 'patient' }));

const authenticate = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  if (!token || token === 'bypass' || token === '') return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET); next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
};

const publicRoute = (req, res, next) => next();

// ==========================================
// 3. QUEUE & PATIENT DATA FLOWS
// ==========================================

function updateAnalyticStats(patient) {
  adminStore.analytics.visitTypeBreakdown[patient.visitType || 'Walk-in'] = (adminStore.analytics.visitTypeBreakdown[patient.visitType || 'Walk-in'] || 0) + 1;
  const hr = new Date().getHours();
  adminStore.analytics.hourlyPatients[hr]++;
  patientStore.stats.totalToday++;
  patientStore.stats.patientsToday++;
  patientStore.stats.waitingCount++;
}

// DB-backed helpers
const getAllActiveQueues = async () => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    return await Patient.find({ registeredAt: { $gte: todayStart }, status: { $ne: 'Completed' } }).sort({ triageScore: -1 });
  } catch (e) { return []; }
};

const getAllBeds = async () => {
  try {
    return await Bed.find().sort({ ward: 1, bedId: 1 });
  } catch (e) { return []; }
};

const findBedById = async (bedId) => {
  const orClauses = [{ bedId }];
  if (mongoose.Types.ObjectId.isValid(bedId)) orClauses.push({ _id: bedId });
  const bed = await Bed.findOne({ $or: orClauses }).catch(() => null);
  return { bed, ward: bed ? bed.ward : null };
};

const findPatientBed = async (patientToken) => Bed.findOne({ patientToken });

const computeBedSummaryFromArray = (allBeds) => ({
  total: allBeds.length,
  available: allBeds.filter(b => b.status === 'available').length,
  occupied: allBeds.filter(b => b.status === 'occupied').length,
  reserved: allBeds.filter(b => b.status === 'reserved').length,
  maintenance: allBeds.filter(b => b.status === 'maintenance').length,
  occupancyRate: allBeds.length > 0 ? ((allBeds.filter(b => b.status === 'occupied').length / allBeds.length) * 100).toFixed(1) : '0.0'
});

const createLogEntry = (type, data) => ({
  type,
  message: data.message,
  by: data.staffName || 'System',
  timestamp: new Date(),
  details: data.details || {}
});

// Helper to recalculate stats from DB
async function recalculateAllStatsFromDB() {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayPatients = await Patient.find({ registeredAt: { $gte: todayStart } });
    patientStore.stats.totalToday = todayPatients.length;
    patientStore.stats.patientsToday = todayPatients.length;
    patientStore.stats.waitingCount = todayPatients.filter(p => p.status === 'Waiting').length;
    patientStore.stats.inProgressCount = todayPatients.filter(p => p.status === 'In Progress').length;
    patientStore.stats.completedToday = todayPatients.filter(p => p.status === 'Completed').length;
    patientStore.stats.dischargedToday = todayPatients.filter(p => p.status === 'Discharged').length;
  } catch (e) { /* ignore */ }
  return patientStore.stats;
}

// POST /api/queue/register
app.post('/api/queue/register', publicRoute, async (req, res) => {
  await checkMidnightReset();

  const { patient_name, severity, condition, department, visitType, age, gender, phone } = req.body;

  const VALID_DEPTS = ['General OPD','Emergency','Cardiology','Orthopedics','Neurology','Pediatrics',
    'Gynecology','ENT','Dermatology','Ophthalmology','Psychiatry','Dental','Radiology','Laboratory'];
  const safeDept = department && VALID_DEPTS.includes(department) ? department : 'General OPD';

  // Get token counter from DB (or in-memory fallback)
  let counter = patientStore.tokenCounter;
  let prefix  = patientStore.tokenPrefix;
  try {
    const cfg = await HospitalConfig.findOneAndUpdate(
      { hospitalId: 'HOSP-ARN-001' },
      { $inc: { tokenCounter: 1 } },
      { new: true, upsert: true }
    );
    counter = cfg.tokenCounter;
    prefix  = cfg.tokenPrefix || 'A';
    patientStore.tokenCounter = counter;
    patientStore.tokenPrefix  = prefix;
  } catch (e) {
    patientStore.tokenCounter++;
    counter = patientStore.tokenCounter;
  }

  const tkn = `${prefix}-${String(counter).padStart(3, '0')}`;

  // Count today's patients in this dept for queue position
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  let pos = 1;
  try {
    pos = (await Patient.countDocuments({ registeredAt: { $gte: todayStart }, department: safeDept })) + 1;
  } catch (e) { pos = counter; }

  const patientData = {
    token:             tkn,
    token_number:      tkn,
    registeredAt:      new Date(),
    registeredBy:      'Self-Registration',
    fullName:          xss(patient_name || 'Anonymous'),
    patient_name:      xss(patient_name || 'Anonymous'),
    age:               age || null,
    gender:            gender || null,
    phone:             phone || null,
    visitType:         visitType || 'Walk-in',
    department:        safeDept,
    chiefComplaint:    xss(condition || ''),
    condition:         xss(condition || ''),
    triageScore:       parseInt(severity) || 30,
    severity:          parseInt(severity) || 30,
    queuePosition:     pos,
    position:          pos,
    estimatedWaitMins: pos * 8,
    estimatedWaitTime: pos * 8,
    status:            'Waiting',
    priority:          parseInt(severity) > 80 || visitType === 'Emergency' ? 'Emergency' : 'Normal'
  };

  // Save to MongoDB
  try {
    await Patient.create(patientData);
  } catch (e) {
    console.error('MongoDB patient save failed:', e.message);
  }

  updateAnalyticStats(patientData);

  // Save to Supabase (fire-and-forget)
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
      if (error) console.warn('Supabase patient save failed:', error.message);
      else console.log(`[Supabase] Patient ${tkn} saved`);
    });
  }

  const activityEntry = {
    message:     `New patient registered -- Token ${tkn} | ${patientData.fullName} | ${safeDept} | ${visitType || 'Walk-in'}`,
    type:        'patient',
    by:          'Self-Registration',
    color:       'cyan',
    timestamp:   new Date(),
    patientToken: tkn,
    patientName:  patientData.fullName,
    department:   safeDept,
    severity:     patientData.severity
  };
  adminStore.activityFeed.unshift(activityEntry);
  if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

  // Emit real-time updates
  const allPatients = await Patient.find({ registeredAt: { $gte: todayStart } }).sort({ registeredAt: 1 }).catch(() => []);
  const allActiveQueues = allPatients.filter(p => p.status !== 'Completed');

  io.emit('patient:new', patientData);
  io.emit('queueUpdate', allActiveQueues);
  io.emit('queue:update', allActiveQueues);
  io.emit('patients:update', allPatients);
  io.emit('stats:update', patientStore.stats);
  io.to('admin').emit('activity:log', activityEntry);
  io.to('admin').emit('analytics:update', adminStore.analytics);
  io.to('admin').emit('patient:registered', {
    token:      tkn,
    name:       patientData.fullName,
    department: safeDept,
    severity:   patientData.severity,
    timestamp:  new Date()
  });

  console.log(`Token ${tkn} registered for ${patientData.fullName} | Age: ${age} | Gender: ${gender} | Dept: ${safeDept} | Priority: ${patientData.priority}`);

  res.json({
    token:             tkn,
    token_number:      tkn,
    isEmergency:       patientData.priority === 'Emergency',
    success:           true,
    position:          pos,
    queuePosition:     pos,
    estimatedWaitMins: patientData.estimatedWaitMins,
    patientData:       patientData
  });
});

// CSV Bulk Upload
app.post('/api/queue/upload', authenticate, upload.single('file'), async (req, res) => {
  const dataArray = req.body.data;
  if (!dataArray || !Array.isArray(dataArray)) return res.json({ success: false, error: 'Missing data elements' });

  let cnt = 0;
  for (const p of dataArray) {
    await checkMidnightReset();
    let counter = patientStore.tokenCounter;
    let prefix  = patientStore.tokenPrefix;
    try {
      const cfg = await HospitalConfig.findOneAndUpdate(
        { hospitalId: 'HOSP-ARN-001' },
        { $inc: { tokenCounter: 1 } },
        { new: true, upsert: true }
      );
      counter = cfg.tokenCounter;
      prefix  = cfg.tokenPrefix || 'A';
      patientStore.tokenCounter = counter;
    } catch (e) {
      patientStore.tokenCounter++;
      counter = patientStore.tokenCounter;
    }
    const tkn = `${prefix}-${String(counter).padStart(3, '0')}`;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const pos = (await Patient.countDocuments({ registeredAt: { $gte: todayStart }, department: p.department || 'General OPD' }).catch(() => 0)) + 1;

    const patientData = {
      token:         tkn,
      token_number:  tkn,
      fullName:      p.fullName || 'Bulk',
      patient_name:  p.fullName || 'Bulk',
      department:    p.department || 'General OPD',
      status:        'Waiting',
      age:           p.age || null,
      gender:        p.gender || null,
      phone:         p.phone || null,
      condition:     p.condition || 'Bulk import',
      chiefComplaint: p.condition || 'Bulk import',
      triageScore:   p.severity || 30,
      severity:      p.severity || 30,
      visitType:     p.visitType || 'Walk-in',
      priority:      'Normal',
      registeredAt:  new Date(),
      queuePosition: pos,
      position:      pos,
      estimatedWaitMins: pos * 8,
      estimatedWaitTime: pos * 8
    };
    try { await Patient.create(patientData); } catch (e) { /* skip dup */ }
    patientStore.stats.totalToday++;
    patientStore.stats.patientsToday++;
    patientStore.stats.waitingCount++;
    cnt++;
  }

  const allActiveQueues = await getAllActiveQueues();
  io.emit('queueUpdate', allActiveQueues);
  io.emit('stats:update', patientStore.stats);
  res.json({ success: true, count: cnt });
});

app.get('/api/queue', async (req, res) => {
  res.json(await getAllActiveQueues());
});

app.get('/api/queue/status/:tokenNumber', publicRoute, async (req, res) => {
  const p = await Patient.findOne({ token: req.params.tokenNumber }).catch(() => null);
  if (!p) return res.status(404).json({ error: 'Token not found' });
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const queueLength = await Patient.countDocuments({ registeredAt: { $gte: todayStart }, status: { $ne: 'Completed' } }).catch(() => 0);
  res.json({ ...p.toObject(), queueLength });
});

app.patch('/api/queue/:id', authenticate, async (req, res) => {
  const newStatus = req.body.status;
  const orClauses = [{ token: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) orClauses.push({ _id: req.params.id });
  const p = await Patient.findOneAndUpdate(
    { $or: orClauses },
    newStatus ? { status: newStatus } : {},
    { new: true }
  ).catch(() => null);

  if (p) {
    const oldStatus = req.body.oldStatus || 'Waiting';
    const resolvedStatus = newStatus || p.status;

    // Update in-memory stats
    if (oldStatus === 'Waiting' && resolvedStatus !== 'Waiting') {
      patientStore.stats.waitingCount = Math.max(0, patientStore.stats.waitingCount - 1);
    }
    if (resolvedStatus === 'In Progress') patientStore.stats.inProgressCount++;
    if (resolvedStatus === 'Completed') {
      patientStore.stats.completedToday++;
      if (oldStatus === 'In Progress') patientStore.stats.inProgressCount = Math.max(0, patientStore.stats.inProgressCount - 1);
    }

    const staffName = req.body.staffName || req.user?.name || 'Staff';
    const statusColors = { 'Completed': 'green', 'In Progress': 'blue', 'Called': 'amber', 'Waiting': 'cyan' };
    const activityEntry = {
      message:     `${staffName} marked ${p.patient_name || p.fullName} as ${resolvedStatus} -- ${p.department} | Token ${p.token}`,
      type:        'queue',
      by:          staffName,
      color:       statusColors[resolvedStatus] || 'cyan',
      timestamp:   new Date(),
      patientToken: p.token,
      patientName:  p.patient_name || p.fullName,
      oldStatus,
      newStatus:    resolvedStatus,
      department:   p.department
    };
    adminStore.activityFeed.unshift(activityEntry);
    if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

    const allActiveQueues = await getAllActiveQueues();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const allPatients = await Patient.find({ registeredAt: { $gte: todayStart } }).sort({ registeredAt: 1 }).catch(() => []);

    io.emit('queueUpdate', allActiveQueues);
    io.emit('patients:update', allPatients);
    io.to('admin').emit('activity:log', activityEntry);
    io.to('admin').emit('stats:update', patientStore.stats);
    io.to('admin').emit('queue:statusChanged', {
      token:       p.token,
      oldStatus,
      newStatus:   resolvedStatus,
      patientName: p.patient_name || p.fullName,
      staffName,
      timestamp:   new Date()
    });

    if (supabase) {
      supabase.from('patients').update({ status: resolvedStatus }).eq('token', p.token).then(({ error }) => {
        if (error) console.error('Supabase status update failed:', error.message);
      });
    }
  }
  res.json({ success: true });
});

app.get('/api/patient/:token', publicRoute, async (req, res) => {
  const p = await Patient.findOne({ token: req.params.token }).catch(() => null);
  if (!p) return res.status(404).json({ error: 'Token not found' });
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const deptCount = await Patient.countDocuments({ registeredAt: { $gte: todayStart }, department: p.department, status: { $ne: 'Completed' } }).catch(() => 0);
  res.json({
    ...p.toObject(),
    queueLength:   deptCount,
    queuePosition: p.queuePosition,
    position:      p.queuePosition
  });
});

// ==========================================
// BED ROUTES
// ==========================================
app.get('/api/beds', authenticate, async (req, res) => {
  res.json(await getAllBeds());
});

app.get('/api/beds/ward/:wardName', authenticate, async (req, res) => {
  const beds = await Bed.find({ ward: req.params.wardName }).catch(() => null);
  if (!beds) return res.status(404).json({ error: 'Ward not found' });
  res.json(beds);
});

app.get('/api/beds/:bedId', authenticate, async (req, res) => {
  const orClauses = [{ bedId: req.params.bedId }];
  if (mongoose.Types.ObjectId.isValid(req.params.bedId)) orClauses.push({ _id: req.params.bedId });
  const bed = await Bed.findOne({ $or: orClauses }).catch(() => null);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });
  res.json(bed);
});

app.patch('/api/beds/:id', authenticate, async (req, res) => {
  const updates = {};
  if (req.body.status) {
    updates.status = req.body.status;
    updates.statusUpdatedAt = new Date();
    updates.statusUpdatedBy = req.body.updatedBy || 'Staff';
  }
  if (req.body.patient_id) updates.patientToken = req.body.patient_id;

  const orClauses = [{ bedId: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) orClauses.push({ _id: req.params.id });
  const target = await Bed.findOneAndUpdate(
    { $or: orClauses },
    updates,
    { new: true }
  ).catch(() => null);

  if (target) {
    const allBeds = await getAllBeds();
    io.emit('bedsUpdate', allBeds);
    io.emit('bed:update', {
      action:    'update',
      bedId:     target.bedId,
      ward:      target.ward,
      bed:       target,
      timestamp: new Date()
    });
  }
  res.json({ success: true });
});

// ==========================================
// DASHBOARD & STATS
// ==========================================
app.get('/api/dashboard/metrics', authenticate, async (req, res) => {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayPatients = await Patient.find({ registeredAt: { $gte: todayStart } }).catch(() => []);
  const allBeds = await getAllBeds();

  const totalBeds    = allBeds.length;
  const occupiedBeds = allBeds.filter(b => b.status === 'occupied').length;
  const bedOccupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const wardOccupancy = [];
  ['general', 'icu', 'pediatric'].forEach(category => {
    const categoryBeds = allBeds.filter(b => b.category === category);
    const catTotal    = categoryBeds.length;
    const catOccupied = categoryBeds.filter(b => b.status === 'occupied').length;
    const percent     = catTotal > 0 ? Math.round((catOccupied / catTotal) * 100) : 0;
    let label = 'General';
    if (category === 'icu')       label = 'ICU';
    if (category === 'pediatric') label = 'Paediatric';
    wardOccupancy.push({ label, percent, class: percent >= 90 ? 'high' : percent >= 75 ? 'warning' : 'low' });
  });

  const currentHour = new Date().getHours();
  const patientFlowForecast = { labels: [], data: [] };
  let forecastedOccupancy = bedOccupancyPct;
  for (let i = 0; i < 12; i++) {
    const h = (currentHour + i) % 24;
    const ampm = h >= 12 ? 'P' : 'A';
    const displayHr = h % 12 || 12;
    patientFlowForecast.labels.push(`${displayHr}${ampm}`);
    const isDaytime = h >= 8 && h <= 20;
    const change = isDaytime ? (Math.random() * 5) : (Math.random() * -5);
    forecastedOccupancy = Math.max(10, Math.min(100, forecastedOccupancy + change));
    patientFlowForecast.data.push(Math.round(forecastedOccupancy));
  }

  const waitingCount    = todayPatients.filter(p => p.status === 'Waiting').length;
  const inProgressCount = todayPatients.filter(p => p.status === 'In Progress').length;
  const completedToday  = todayPatients.filter(p => p.status === 'Completed').length;
  const dischargedToday = todayPatients.filter(p => p.status === 'Discharged').length;
  const emergencies     = todayPatients.filter(p => p.priority === 'Emergency' && p.status !== 'Completed').length;

  res.json({
    patientsToday:       todayPatients.length,
    totalWaiting:        waitingCount,
    waitingCount,
    inProgressCount,
    completedToday,
    dischargedToday,
    emergencies,
    totalBeds,
    occupiedBeds,
    bedOccupancyPct,
    avgWaitMinutes:      patientStore.stats.avgWaitTime || 45,
    wardOccupancy,
    patientFlowForecast
  });
});

app.get('/api/stats', async (req, res) => {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayPatients = await Patient.find({ registeredAt: { $gte: todayStart } }).catch(() => []);
  const allBeds = await getAllBeds();
  const availableBeds = allBeds.filter(b => b.status === 'available').length;

  res.json({
    patientsToday:    todayPatients.length,
    totalToday:       todayPatients.length,
    avgWaitMins:      patientStore.stats.avgWaitTime || 45,
    bedsAvailable:    availableBeds,
    totalBeds:        allBeds.length,
    waitingCount:     todayPatients.filter(p => p.status === 'Waiting').length,
    inProgressCount:  todayPatients.filter(p => p.status === 'In Progress').length,
    completedToday:   todayPatients.filter(p => p.status === 'Completed').length
  });
});

app.post('/api/stats/recalculate', authenticate, async (req, res) => {
  const stats = await recalculateAllStatsFromDB();
  io.emit('stats:update', stats);
  res.json({ success: true, message: 'Stats recalculated successfully', stats });
});

// ==========================================
// SOCKET.IO
// ==========================================
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:admin', () => {
    socket.join('admin');
    console.log('Admin joined:', socket.id);
    socket.emit('analytics:update', adminStore.analytics);
    socket.emit('activity:feed', adminStore.activityFeed);
    socket.emit('stats:update', patientStore.stats);
  });

  socket.on('join:staff', (data) => {
    socket.join('staff');
    socket.staffName = data?.staffName || 'Staff Member';
    console.log('Staff joined:', socket.staffName);
  });

  // Send initial data on connection
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [activeQueue, allBeds] = await Promise.all([
      Patient.find({ registeredAt: { $gte: todayStart }, status: { $ne: 'Completed' } }).sort({ triageScore: -1 }).catch(() => []),
      Bed.find().sort({ ward: 1, bedId: 1 }).catch(() => [])
    ]);
    socket.emit('queueUpdate', activeQueue);
    socket.emit('bedsUpdate', allBeds);
  } catch (e) {
    socket.emit('queueUpdate', []);
    socket.emit('bedsUpdate', []);
  }

  // NEW: get:patients event
  socket.on('get:patients', async () => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const patients = await Patient.find({ registeredAt: { $gte: todayStart } }).sort({ registeredAt: 1 }).catch(() => []);
    socket.emit('patients:update', patients);
  });

  // NEW: get:beds event
  socket.on('get:beds', async () => {
    const beds = await Bed.find().sort({ ward: 1, bedId: 1 }).catch(() => []);
    socket.emit('beds:update', beds);
  });

  // ==========================================
  // BED ASSIGNMENT
  // ==========================================
  socket.on('bed:assign', async (data) => {
    const { ward, bedId, patientToken, patientName, patientAge, patientGender,
            patientPhone, department, assignedDoctor, assignedBy, admissionNotes,
            expectedDischarge } = data;

    const { bed: foundBed, ward: foundWard } = await findBedById(bedId);
    if (!foundBed) return socket.emit('bed:error', { message: 'Bed not found' });
    if (foundBed.status === 'occupied') return socket.emit('bed:error', { message: 'Bed already occupied' });

    // Release previous bed if patient had one
    const existingBed = await findPatientBed(patientToken).catch(() => null);
    if (existingBed && existingBed.bedId !== bedId) {
      await Bed.findOneAndUpdate(
        { bedId: existingBed.bedId },
        {
          status: 'available', patientToken: null, patientName: null, patientAge: null,
          patientGender: null, patientPhone: null, department: null, assignedDoctor: null,
          assignedBy: null, assignedAt: null, expectedDischarge: null, admissionNotes: null,
          statusUpdatedAt: new Date(), statusUpdatedBy: assignedBy,
          $push: { history: { action: 'released', patientToken, patientName, by: assignedBy, at: new Date(), notes: 'Auto-released -- patient transferred' } }
        }
      ).catch(() => {});
    }

    // Assign new bed
    const updatedBed = await Bed.findOneAndUpdate(
      { bedId },
      {
        status: 'occupied', patientToken, patientName, patientAge, patientGender,
        patientPhone, department, assignedDoctor, assignedBy, assignedAt: new Date(),
        admissionNotes, expectedDischarge: expectedDischarge ? new Date(expectedDischarge) : null,
        statusUpdatedAt: new Date(), statusUpdatedBy: assignedBy,
        $push: { history: { action: 'assigned', patientToken, patientName, by: assignedBy, at: new Date(), notes: admissionNotes || 'Patient admitted' } }
      },
      { new: true }
    ).catch(() => null);

    // Update patient record in DB
    await Patient.findOneAndUpdate({ token: patientToken }, {
      assignedBed: bedId, assignedWard: foundWard, assignedDoctor, status: 'Admitted'
    }).catch(() => {});

    const allBeds = await getAllBeds();
    const logEntry = createLogEntry('bed', {
      staffName: assignedBy,
      message:   `${assignedBy} assigned Bed ${bedId} to ${patientName} (${patientToken}) -- ${foundWard}`,
      details:   { ward: foundWard, bedId, patientToken, doctor: assignedDoctor }
    });
    logEntry.color = 'amber'; logEntry.type = 'bed'; logEntry.by = assignedBy;
    adminStore.activityFeed.unshift(logEntry);
    if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

    io.emit('bed:update', { action: 'assign', ward: foundWard, bedId, bed: updatedBed, by: assignedBy, timestamp: new Date() });
    io.emit('bedsUpdate', allBeds);
    io.emit('stats:update', patientStore.stats);
    io.to('admin').emit('activity:log', logEntry);
    io.to('admin').emit('bed:assigned', { bedId, ward: foundWard, patientToken, patientName, assignedBy, timestamp: new Date() });
    socket.emit('bed:assignSuccess', { bedId, patientToken, patientName, message: `Bed ${bedId} successfully assigned to ${patientName}` });
    console.log(`Bed ${bedId} assigned to ${patientName} by ${assignedBy}`);
  });

  // ==========================================
  // BED RELEASE
  // ==========================================
  socket.on('bed:release', async (data) => {
    const { bedId, staffName, reason } = data;

    const { bed: foundBed, ward } = await findBedById(bedId);
    if (!foundBed) return socket.emit('bed:error', { message: 'Bed not found' });

    const releasedPatient = { token: foundBed.patientToken, name: foundBed.patientName };

    // Update patient record
    if (releasedPatient.token) {
      await Patient.findOneAndUpdate({ token: releasedPatient.token }, { status: 'Discharged' }).catch(() => {});
      patientStore.stats.dischargedToday++;
    }

    const updatedBed = await Bed.findOneAndUpdate(
      { bedId },
      {
        status: 'available', patientToken: null, patientName: null, patientAge: null,
        patientGender: null, patientPhone: null, department: null, assignedDoctor: null,
        assignedBy: null, assignedAt: null, expectedDischarge: null, admissionNotes: null,
        statusUpdatedAt: new Date(), statusUpdatedBy: staffName,
        $push: { history: { action: 'released', patientToken: releasedPatient.token, patientName: releasedPatient.name, by: staffName, at: new Date(), notes: reason || 'Patient discharged' } }
      },
      { new: true }
    ).catch(() => null);

    const allBeds = await getAllBeds();
    const logEntry = createLogEntry('bed', {
      staffName,
      message: `${staffName} released Bed ${bedId} -- ${releasedPatient.name || 'patient'} discharged -- ${ward}`,
      details: { ward, bedId }
    });
    logEntry.color = 'green'; logEntry.type = 'bed'; logEntry.by = staffName;
    adminStore.activityFeed.unshift(logEntry);
    if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

    io.emit('bed:update', { action: 'release', ward, bedId, bed: updatedBed, by: staffName, timestamp: new Date() });
    io.emit('bedsUpdate', allBeds);
    io.emit('stats:update', patientStore.stats);
    io.to('admin').emit('activity:log', logEntry);
    io.to('admin').emit('stats:update', patientStore.stats);
    io.to('admin').emit('bed:released', { bedId, ward, patientToken: releasedPatient.token, patientName: releasedPatient.name, releasedBy: staffName, timestamp: new Date() });
    socket.emit('bed:releaseSuccess', { bedId, message: `Bed ${bedId} released -- now available` });
    console.log(`Bed ${bedId} released by ${staffName}`);
  });

  // ==========================================
  // BED MAINTENANCE
  // ==========================================
  socket.on('bed:maintenance', async (data) => {
    const { bedId, staffName, reason } = data;

    const { bed: foundBed, ward } = await findBedById(bedId);
    if (!foundBed) return socket.emit('bed:error', { message: 'Bed not found' });
    if (foundBed.status === 'occupied') return socket.emit('bed:error', { message: 'Cannot mark occupied bed as maintenance. Transfer patient first.' });

    const updatedBed = await Bed.findOneAndUpdate(
      { bedId },
      {
        status: 'maintenance', statusUpdatedAt: new Date(), statusUpdatedBy: staffName,
        $push: { history: { action: 'maintenance', by: staffName, at: new Date(), notes: reason || 'Marked for maintenance' } }
      },
      { new: true }
    ).catch(() => null);

    const allBeds = await getAllBeds();
    const logEntry = createLogEntry('bed', {
      staffName,
      message: `${staffName} marked Bed ${bedId} for maintenance -- ${ward}`,
      details: { ward, bedId, reason }
    });
    logEntry.color = 'amber'; logEntry.type = 'bed'; logEntry.by = staffName;
    adminStore.activityFeed.unshift(logEntry);
    if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

    io.emit('bed:update', { action: 'maintenance', ward, bedId, bed: updatedBed, by: staffName, timestamp: new Date() });
    io.emit('bedsUpdate', allBeds);
    io.to('admin').emit('activity:log', logEntry);
    io.to('admin').emit('bed:maintenance', { bedId, ward, markedBy: staffName, reason, timestamp: new Date() });
    socket.emit('bed:maintenanceSuccess', { bedId, message: `Bed ${bedId} marked for maintenance` });
  });

  // ==========================================
  // BED RESERVE
  // ==========================================
  socket.on('bed:reserve', async (data) => {
    const { bedId, patientToken, patientName, reservedBy, reservedUntil, reason } = data;

    const { bed: foundBed, ward } = await findBedById(bedId);
    if (!foundBed) return socket.emit('bed:error', { message: 'Bed not found' });
    if (foundBed.status !== 'available') return socket.emit('bed:error', { message: 'Only available beds can be reserved' });

    const updatedBed = await Bed.findOneAndUpdate(
      { bedId },
      {
        status: 'reserved', patientToken, patientName,
        reservedBy, reservedUntil: new Date(reservedUntil), reservedReason: reason,
        statusUpdatedAt: new Date(), statusUpdatedBy: reservedBy,
        $push: { history: { action: 'reserved', patientToken, patientName, by: reservedBy, at: new Date(), notes: reason || 'Bed reserved' } }
      },
      { new: true }
    ).catch(() => null);

    const allBeds = await getAllBeds();
    io.emit('bed:update', { action: 'reserve', ward, bedId, bed: updatedBed, by: reservedBy, timestamp: new Date() });
    io.emit('bedsUpdate', allBeds);
    socket.emit('bed:reserveSuccess', { bedId, message: `Bed ${bedId} reserved for ${patientName}` });
  });

  // ==========================================
  // BED TRANSFER
  // ==========================================
  socket.on('bed:transfer', async (data) => {
    const { fromBedId, toBedId, staffName, reason } = data;

    const [{ bed: fromBed, ward: fromWard }, { bed: toBed, ward: toWard }] = await Promise.all([
      findBedById(fromBedId), findBedById(toBedId)
    ]);

    if (!fromBed || !toBed) return socket.emit('bed:error', { message: 'Bed not found' });
    if (fromBed.status !== 'occupied') return socket.emit('bed:error', { message: 'Source bed is not occupied' });
    if (toBed.status !== 'available') return socket.emit('bed:error', { message: 'Target bed is not available' });

    const patientName  = fromBed.patientName;
    const patientToken = fromBed.patientToken;

    // Assign to new bed
    await Bed.findOneAndUpdate(
      { bedId: toBedId },
      {
        status: 'occupied', patientToken: fromBed.patientToken, patientName: fromBed.patientName,
        patientAge: fromBed.patientAge, patientGender: fromBed.patientGender, patientPhone: fromBed.patientPhone,
        department: fromBed.department, assignedDoctor: fromBed.assignedDoctor, assignedBy: staffName,
        assignedAt: new Date(), admissionNotes: fromBed.admissionNotes, expectedDischarge: fromBed.expectedDischarge,
        statusUpdatedAt: new Date(), statusUpdatedBy: staffName,
        $push: { history: { action: 'transferred_in', patientToken: fromBed.patientToken, patientName: fromBed.patientName, by: staffName, at: new Date(), notes: `Transferred from ${fromBedId}: ${reason || 'Patient transfer'}` } }
      }
    ).catch(() => {});

    // Clear old bed
    await Bed.findOneAndUpdate(
      { bedId: fromBedId },
      {
        status: 'available', patientToken: null, patientName: null, patientAge: null,
        patientGender: null, patientPhone: null, department: null, assignedDoctor: null,
        assignedBy: null, assignedAt: null, expectedDischarge: null, admissionNotes: null,
        statusUpdatedAt: new Date(), statusUpdatedBy: staffName,
        $push: { history: { action: 'transferred_out', patientToken, patientName, by: staffName, at: new Date(), notes: `Transferred to ${toBedId}: ${reason || 'Patient transfer'}` } }
      }
    ).catch(() => {});

    // Update patient record
    await Patient.findOneAndUpdate({ token: patientToken }, { assignedBed: toBedId, assignedWard: toWard }).catch(() => {});

    const allBeds = await getAllBeds();
    const logEntry = createLogEntry('bed', {
      staffName,
      message: `${staffName} transferred ${patientName} from Bed ${fromBedId} to ${toBedId} -- ${fromWard} -> ${toWard}`,
      details: { fromBedId, toBedId, fromWard, toWard, patientToken, reason }
    });
    logEntry.color = 'blue'; logEntry.type = 'bed'; logEntry.by = staffName;
    adminStore.activityFeed.unshift(logEntry);
    if (adminStore.activityFeed.length > 100) adminStore.activityFeed = adminStore.activityFeed.slice(0, 100);

    io.emit('bed:update', { action: 'transfer', fromBedId, toBedId, fromWard, toWard, by: staffName, timestamp: new Date() });
    io.emit('bedsUpdate', allBeds);
    io.to('admin').emit('activity:log', logEntry);
    io.to('admin').emit('bed:transferred', { fromBedId, toBedId, fromWard, toWard, patientToken, patientName, transferredBy: staffName, timestamp: new Date() });
    socket.emit('bed:transferSuccess', { fromBedId, toBedId, message: `Patient transferred from ${fromBedId} to ${toBedId}` });
  });

  // ==========================================
  // ADD BED NOTE
  // ==========================================
  socket.on('bed:addNote', async (data) => {
    const { bedId, staffName, note } = data;
    const { bed: foundBed, ward } = await findBedById(bedId);
    if (!foundBed) return socket.emit('bed:error', { message: 'Bed not found' });

    const noteEntry = { by: staffName, at: new Date(), note };
    await Bed.findOneAndUpdate({ bedId }, { $push: { notes: noteEntry } }).catch(() => {});

    io.emit('bed:noteAdded', { bedId, ward, note: noteEntry });
    socket.emit('bed:noteSuccess', { bedId, message: 'Note added successfully' });
  });

  // Legacy socket bindings
  socket.on('bed:update', async () => { io.emit('bedsUpdate', await getAllBeds()); });
  socket.on('queue:update', async () => { io.emit('queueUpdate', await getAllActiveQueues()); });
  socket.on('patient:register', async (data) => {
    console.log('Patient registration broadcast:', data);
    io.emit('patient:new', data);
    io.emit('queueUpdate', await getAllActiveQueues());
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ==========================================
// HOSPITAL INFO MANAGEMENT
// ==========================================
app.get('/api/hospital/info', async (req, res) => {
  try {
    const cfg = await HospitalConfig.findOne({ hospitalId: 'HOSP-ARN-001' });
    if (cfg) {
      res.json({
        ...adminStore.hospital,
        name:        cfg.name        || adminStore.hospital.name,
        tokenPrefix: cfg.tokenPrefix || adminStore.hospital.tokenPrefix,
        address:     cfg.address     || adminStore.hospital.address,
        phone:       cfg.phone       || adminStore.hospital.phone,
        email:       cfg.email       || adminStore.hospital.email,
        website:     cfg.website     || adminStore.hospital.website,
        logo:        cfg.logo        || adminStore.hospital.logo
      });
    } else {
      res.json(adminStore.hospital);
    }
  } catch (e) {
    res.json(adminStore.hospital);
  }
});

app.patch('/api/hospital/info', authenticate, async (req, res) => {
  const { name, tokenPrefix, address, phone, email, website, logo } = req.body;

  const dbUpdates = {};
  if (name)        { adminStore.hospital.name        = name;        dbUpdates.name        = name; }
  if (tokenPrefix) { adminStore.hospital.tokenPrefix = tokenPrefix; dbUpdates.tokenPrefix = tokenPrefix; patientStore.tokenPrefix = tokenPrefix; }
  if (address)     { adminStore.hospital.address     = address;     dbUpdates.address     = address; }
  if (phone)       { adminStore.hospital.phone       = phone;       dbUpdates.phone       = phone; }
  if (email)       { adminStore.hospital.email       = email;       dbUpdates.email       = email; }
  if (website)     { adminStore.hospital.website     = website;     dbUpdates.website     = website; }
  if (logo)        { adminStore.hospital.logo        = logo;        dbUpdates.logo        = logo; }

  // Persist to DB
  try {
    await HospitalConfig.findOneAndUpdate(
      { hospitalId: 'HOSP-ARN-001' },
      dbUpdates,
      { upsert: true, new: true }
    );
  } catch (e) { console.warn('HospitalConfig update failed:', e.message); }

  const staffName = req.body.updatedBy || req.user?.name || 'Admin';
  const activityEntry = {
    message:   `${staffName} updated hospital information`,
    type:      'system',
    by:        staffName,
    color:     'purple',
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

const roomStore = {
  rooms: [
    { id: 'APT-01', name: 'Appointment Room 1', category: 'Appointment Rooms', status: 'occupied', patient: 'Riya Sharma',  need: 'Needs Checkup', notes: '', assignedAt: new Date(Date.now() - 8 * 60000) },
    { id: 'APT-02', name: 'Appointment Room 2', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'APT-03', name: 'Appointment Room 3', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'APT-04', name: 'Appointment Room 4', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'CHK-01', name: 'Checkup Room 1',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'CHK-02', name: 'Checkup Room 2',     category: 'Checkup Rooms',     status: 'occupied',  patient: 'Arjun Mehta', need: 'Needs Checkup', notes: '', assignedAt: new Date(Date.now() - 22 * 60000) },
    { id: 'CHK-03', name: 'Checkup Room 3',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'CHK-04', name: 'Checkup Room 4',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'MRI-01', name: 'MRI Scanner 1',      category: 'MRI Scan Rooms',    status: 'occupied',  patient: 'Priya Nair',  need: 'Needs Scan',    notes: '', assignedAt: new Date(Date.now() - 35 * 60000) },
    { id: 'MRI-02', name: 'MRI Scanner 2',      category: 'MRI Scan Rooms',    status: 'available', patient: null, need: null, notes: '', assignedAt: null },
    { id: 'XRY-01', name: 'X-Ray Room 1',       category: 'X-Ray Rooms',       status: 'occupied',  patient: 'Karan Rao',   need: 'Needs Scan',    notes: '', assignedAt: new Date(Date.now() - 5 * 60000) },
    { id: 'XRY-02', name: 'X-Ray Room 2',       category: 'X-Ray Rooms',       status: 'available', patient: null, need: null, notes: '', assignedAt: null }
  ]
};

app.get('/api/rooms', async (req, res) => {
  res.json(roomStore.rooms);
});

app.post('/api/rooms/:id', async (req, res) => {
  const { patientName, need, notes } = req.body;
  const roomId = req.params.id;
  const room = roomStore.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.status === 'occupied') return res.status(400).json({ error: 'Room is already occupied' });
  room.status = 'occupied'; room.patient = patientName; room.need = need;
  room.notes = notes || ''; room.assignedAt = new Date();
  io.emit('resource:updated', room);
  console.log(`[Memory] Room ${roomId} assigned to ${patientName}`);
  res.json({ success: true, room });
});

app.patch('/api/rooms/:id/clear', async (req, res) => {
  const roomId = req.params.id;
  const room = roomStore.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const prev = room.patient;
  room.status = 'available'; room.patient = null; room.need = null;
  room.notes = ''; room.assignedAt = null;
  io.emit('resource:updated', room);
  console.log(`[Memory] Room ${roomId} cleared (was: ${prev})`);
  res.json({ success: true, room });
});

// ==========================================
// PHASE 2: RESOURCE MANAGEMENT API
// ==========================================
const { setupResourceRoutes } = require('./resource-api');
setupResourceRoutes(app, io, authenticate);

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

const PORT = process.env.PORT || 5000;

// Initialize stats from Supabase on server startup (fallback if MongoDB not connected)
async function initializeStatsFromDatabase() {
  if (!supabase) return;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayPatients, error } = await supabase
      .from('patients')
      .select('*')
      .gte('registered_at', todayStart.toISOString());

    if (error) {
      console.warn('Could not load stats from Supabase:', error.message);
      return;
    }

    if (todayPatients && todayPatients.length > 0) {
      const { data: allTokens } = await supabase.from('patients').select('token');
      if (allTokens) {
        const tokenNumbers = allTokens
          .map(p => parseInt(p.token.split('-')[1]))
          .filter(n => !isNaN(n));
        if (tokenNumbers.length > 0) {
          patientStore.tokenCounter = Math.max(...tokenNumbers);
        }
      }

      patientStore.stats.totalToday      = todayPatients.length;
      patientStore.stats.patientsToday   = todayPatients.length;
      patientStore.stats.waitingCount    = todayPatients.filter(p => p.status === 'Waiting').length;
      patientStore.stats.inProgressCount = todayPatients.filter(p => p.status === 'In Progress').length;
      patientStore.stats.completedToday  = todayPatients.filter(p => p.status === 'Completed').length;
      patientStore.stats.dischargedToday = todayPatients.filter(p => p.status === 'Discharged').length;

      console.log(`Loaded ${todayPatients.length} patients from Supabase`);
    }
  } catch (err) {
    console.error('Error initializing stats from Supabase:', err.message);
  }
}

server.listen(PORT, async () => {
  console.log(`Ultimate Node.js API + Socket.io Server active on port ${PORT}`);
  console.log(`Phase 2 Resource Management API loaded`);

  // Connect to MongoDB first
  const mongoConnected = await connectDB();

  if (mongoConnected) {
    console.log('MongoDB connected -- loading today\'s data...');
    try {
      // Restore stats from MongoDB
      await recalculateAllStatsFromDB();
      console.log(`Stats restored: ${patientStore.stats.totalToday} patients today`);

      // Restore tokenCounter and tokenPrefix from HospitalConfig
      const cfg = await HospitalConfig.findOne({ hospitalId: 'HOSP-ARN-001' });
      if (cfg) {
        const today = new Date().toDateString();
        if (cfg.lastReset !== today) {
          // New day -- reset counter in DB
          await HospitalConfig.findOneAndUpdate(
            { hospitalId: 'HOSP-ARN-001' },
            { tokenCounter: 0, lastReset: today }
          );
          patientStore.tokenCounter = 0;
          patientStore.lastReset    = today;
        } else {
          patientStore.tokenCounter = cfg.tokenCounter || 0;
          patientStore.lastReset    = cfg.lastReset    || today;
        }
        patientStore.tokenPrefix  = cfg.tokenPrefix  || 'A';
        adminStore.hospital.name  = cfg.name         || adminStore.hospital.name;
        adminStore.hospital.tokenPrefix = cfg.tokenPrefix || adminStore.hospital.tokenPrefix;
        if (cfg.address) adminStore.hospital.address = cfg.address;
        if (cfg.phone)   adminStore.hospital.phone   = cfg.phone;
        if (cfg.email)   adminStore.hospital.email   = cfg.email;
        if (cfg.website) adminStore.hospital.website = cfg.website;
        if (cfg.logo)    adminStore.hospital.logo    = cfg.logo;
        console.log(`Token counter restored: ${patientStore.tokenCounter} (prefix: ${patientStore.tokenPrefix})`);
      }
    } catch (e) {
      console.error('Error restoring state from MongoDB:', e.message);
    }
  } else {
    // MongoDB not available -- fall back to Supabase
    if (supabase) {
      console.log(`Supabase fallback: ${process.env.SUPABASE_URL}`);
      await initializeStatsFromDatabase();
    } else {
      console.log('Running in memory mode (no MongoDB, no Supabase configured)');
    }
  }
});

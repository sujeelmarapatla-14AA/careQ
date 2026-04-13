require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database'); // Loads the SQLite structure
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } }); // Open CORS for React frontend

app.use(cors());
app.use(express.json());

// RATE LIMITERS & SECURITY PAUSED FOR DEVELOPMENT
// ... will reactivate after project completion

// Serve static files from the React frontend production build
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

// ==========================================
// 1. AUTHENTICATION (JWT Based RBAC system)
// ==========================================
app.post('/api/auth/register', (req, res) => {
  let { username, password, role } = req.body;
  if(!username || !password) return res.status(400).json({ error: "Missing fields" });
  
  username = xss(username);
  role = xss(role || 'patient');

  const hash = bcrypt.hashSync(password, 8);
  db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, hash, role], function(err) {
    if(err) {
      console.error("DB INSERT ERROR:", err);
      return res.status(400).json({ error: `DB Error: ${err.message}` });
    }
    res.json({ success: true, message: "User registered" });
  });
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many attempts', retryAfter: 900 });
  }
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  let { username, password } = req.body;
  username = xss(username);
  
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if(err) {
      console.error("DB SELECT ERROR:", err);
      return res.status(500).json({ error: `DB Error: ${err.message}` });
    }
    if(!user || !bcrypt.compareSync(password, user.password)) 
      return res.status(401).json({ error: "Invalid credentials" });
      
    // Generate Secure JSON Web Token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, role: user.role, username: user.username });
  });
});

app.post('/api/auth/logout', (req, res) => {
  // With stateless JWTs, the server just acknowledges the intention while the client destroys the token.
  res.json({ success: true, message: "Successfully logged out" });
});

// ==========================================
// JWT MIDDLEWARE — protects all /api routes below this line
// ==========================================
const authenticate = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};


// ==========================================
// 2. QUEUE & AI TRIAGE SYSTEM REST API
// ==========================================
app.post('/api/queue/register', authenticate, (req, res) => {
  let { patient_name, severity, condition } = req.body;

  patient_name = xss(patient_name);
  condition = xss(condition || 'General Consultation');
  severity = parseInt(severity, 10);
  if (isNaN(severity) || severity < 1 || severity > 100) severity = 30;

  const token = 'T-' + Math.floor(1000 + Math.random() * 9000);

  db.run(
    `INSERT INTO queue_tokens (token_number, patient_name, severity, condition) VALUES (?, ?, ?, ?)`,
    [token, patient_name, severity, condition],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database Error' });
      broadcastQueueUpdate();
      
      const newId = this.lastID;
      db.all(`SELECT id FROM queue_tokens WHERE status != 'completed' ORDER BY severity DESC, created_at ASC`, (err2, rows) => {
        const position = rows.findIndex(r => r.id === newId) + 1;
        const estimatedWaitMins = position * 8;
        res.json({ token, isEmergency: severity > 80, success: true, position, estimatedWaitMins });
      });
    }
  );
});

app.get('/api/queue', authenticate, (req, res) => {
  db.all(
    `SELECT * FROM queue_tokens WHERE status != 'completed' ORDER BY severity DESC, created_at ASC`,
    (err, rows) => res.json(rows)
  );
});

// Get a single patient's token by token_number
app.get('/api/queue/status/:tokenNumber', authenticate, (req, res) => {
  db.get(
    `SELECT * FROM queue_tokens WHERE token_number = ?`,
    [req.params.tokenNumber],
    (err, row) => {
      if (!row) return res.status(404).json({ error: 'Token not found' });
      // Calculate position in queue
      db.all(
        `SELECT id FROM queue_tokens WHERE status != 'completed' ORDER BY severity DESC, created_at ASC`,
        (err2, rows) => {
          const position = rows.findIndex(r => r.id === row.id) + 1;
          res.json({ ...row, position, queueLength: rows.length });
        }
      );
    }
  );
});

app.patch('/api/queue/:id', authenticate, (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE queue_tokens SET status = ? WHERE id = ?`, [status, req.params.id], () => {
    broadcastQueueUpdate();
    res.json({ success: true });
  });
});


// ==========================================
// 3. BED MANAGEMENT REST API
// ==========================================
app.get('/api/beds', authenticate, (req, res) => {
  db.all(`SELECT * FROM beds`, (err, rows) => res.json(rows));
});

app.patch('/api/beds/:id', authenticate, (req, res) => {
  const { status, patient_id } = req.body;
  db.run(
    `UPDATE beds SET status = ?, patient_id = ? WHERE id = ?`,
    [status, patient_id || null, req.params.id],
    () => {
      broadcastBedsUpdate();
      res.json({ success: true });
    }
  );
});


// ==========================================
// 4. ADMIN DASHBOARD METRICS
// ==========================================
app.get('/api/dashboard/metrics', authenticate, (req, res) => {
  const metrics = {};

  db.get(`SELECT COUNT(*) AS total FROM queue_tokens WHERE date(created_at) = date('now')`, (err, row) => {
    metrics.patientsToday = row ? row.total : 0;

    db.get(`SELECT COUNT(*) AS waiting FROM queue_tokens WHERE status = 'waiting'`, (err2, row2) => {
      metrics.totalWaiting = row2 ? row2.waiting : 0;

      db.get(`SELECT COUNT(*) AS emergencies FROM queue_tokens WHERE severity > 80 AND status != 'completed'`, (err3, row3) => {
        metrics.emergencies = row3 ? row3.emergencies : 0;

        db.get(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='occupied' THEN 1 ELSE 0 END) AS occupied FROM beds`, (err4, row4) => {
          metrics.totalBeds = row4 ? row4.total : 0;
          metrics.occupiedBeds = row4 ? row4.occupied : 0;
          metrics.bedOccupancyPct = metrics.totalBeds > 0
            ? Math.round((metrics.occupiedBeds / metrics.totalBeds) * 100)
            : 0;

          // Avg wait time: rough estimate — 8 min per position
          metrics.avgWaitMinutes = metrics.totalWaiting > 0
            ? Math.round(metrics.totalWaiting * 8)
            : 0;

          res.json(metrics);
        });
      });
    });
  });
});

// ==========================================
// 4b. STATS & UNPROTECTED CLIENT ENDPOINTS
// ==========================================
let statsCache = null;
let statsCacheTime = 0;

app.get('/api/stats', (req, res) => {
  const now = Date.now();
  if (statsCache && (now - statsCacheTime < 10000)) return res.json(statsCache);

  db.get(`SELECT COUNT(*) AS total FROM queue_tokens WHERE date(created_at) = date('now')`, (err, row) => {
    const patientsToday = row ? row.total : 0;
    db.get(`SELECT COUNT(*) AS waiting FROM queue_tokens WHERE status = 'waiting'`, (err2, row2) => {
      const wait = row2 ? row2.waiting : 0;
      db.get(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) AS available FROM beds`, (err4, row4) => {
        const bedsAvailable = row4 ? row4.available : 0;
        const avgWaitMins = wait > 0 ? Math.round(wait * 8) : 0;
        
        statsCache = { patientsToday, avgWaitMins, bedsAvailable };
        statsCacheTime = now;
        res.json(statsCache);
      });
    });
  });
});

app.get('/api/patient/:token', (req, res) => {
  db.get(`SELECT * FROM queue_tokens WHERE token_number = ?`, [req.params.token], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Token not found' });
    db.all(`SELECT id FROM queue_tokens WHERE status != 'completed' ORDER BY severity DESC, created_at ASC`, (err2, rows) => {
      const position = rows.findIndex(r => r.id === row.id) + 1;
      res.json({ ...row, position, queueLength: rows.length, estimatedWaitMins: position * 8 });
    });
  });
});


// ==========================================
// 4. WEBSOCKET REAL-TIME ENGINE
// ==========================================
// Utility functions that suck data from DB and blast it across all connected React browsers instantly
const broadcastQueueUpdate = () => {
  db.all(`SELECT * FROM queue_tokens WHERE status != 'completed' ORDER BY severity DESC, created_at ASC`, (err, rows) => {
    io.emit('queueUpdate', rows);
  });
};

const broadcastBedsUpdate = () => {
  db.all(`SELECT * FROM beds`, (err, rows) => {
    io.emit('bedsUpdate', rows);
  });
};

io.on('connection', (socket) => {
  console.log('[Socket.io Engine] Secure connected client:', socket.id);
  // Send fresh status payload to the client upon initial load
  broadcastQueueUpdate();
  broadcastBedsUpdate();
  
  socket.on('disconnect', () => console.log('Client lost:', socket.id));
});


// Catch-all route to serve the React app bounds on all non-API paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Ultimate Node.js API + Socket.io Server active on port ${PORT}`);
});

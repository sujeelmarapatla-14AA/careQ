const mongoose = require('mongoose');
const Bed = require('./models/Bed');
const HospitalConfig = require('./models/HospitalConfig');

// ── Ward definitions (single source of truth) ──────────────────────────────
const WARD_DEFINITIONS = [
  { prefix: 'GM',  total: 40, counts: { available: 12, occupied: 26, maintenance: 2 }, wardName: 'General Ward (Male)',   category: 'general'   },
  { prefix: 'ICU', total: 20, counts: { available:  4, occupied: 15, maintenance: 1 }, wardName: 'ICU',                   category: 'icu'       },
  { prefix: 'EMG', total: 25, counts: { available:  6, occupied: 19, maintenance: 0 }, wardName: 'Emergency / Casualty',  category: 'emergency' },
  { prefix: 'PED', total: 15, counts: { available:  5, occupied:  9, maintenance: 1 }, wardName: 'Pediatrics',            category: 'pediatric' },
  { prefix: 'MAT', total: 20, counts: { available:  8, occupied: 11, maintenance: 1 }, wardName: 'Maternity',             category: 'maternity' },
];

function buildBedDocs(prefix, counts, wardName, category) {
  const beds = [];
  let i = 1;
  const pad = (n) => String(n).padStart(2, '0');

  for (let a = 0; a < counts.available; a++) {
    beds.push({ bedId: `${prefix}-${pad(i)}`, ward: wardName, ward_name: wardName, category, status: 'available', history: [], notes: [] });
    i++;
  }
  for (let o = 0; o < counts.occupied; o++) {
    beds.push({
      bedId: `${prefix}-${pad(i)}`, ward: wardName, ward_name: wardName, category, status: 'occupied',
      patientToken: `DEMO-${String(o+1).padStart(3,'0')}`,
      patientName: `Patient ${o+1}`,
      patientAge: 25 + Math.floor(Math.random() * 50),
      patientGender: Math.random() > 0.5 ? 'Male' : 'Female',
      department: wardName.includes('ICU') ? 'Critical Care' : 'General',
      assignedDoctor: 'Dr. Suresh Reddy',
      assignedBy: 'Nurse Lakshmi',
      assignedAt: new Date(Date.now() - Math.random() * 86400000 * 2),
      expectedDischarge: new Date(Date.now() + Math.random() * 86400000 * 3),
      admissionNotes: 'Under observation',
      history: [{ action: 'assigned', patientToken: `DEMO-${String(o+1).padStart(3,'0')}`, patientName: `Patient ${o+1}`, by: 'Nurse Lakshmi', notes: 'Initial admission' }],
      notes: [],
    });
    i++;
  }
  for (let m = 0; m < counts.maintenance; m++) {
    beds.push({
      bedId: `${prefix}-${pad(i)}`, ward: wardName, ward_name: wardName, category, status: 'maintenance',
      history: [{ action: 'maintenance', by: 'Admin', notes: 'Scheduled maintenance' }], notes: [],
    });
    i++;
  }
  return beds;
}

// ── Connect and seed ────────────────────────────────────────────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️  MONGODB_URI not set — running in memory-only mode');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB connected');

    // Seed beds if collection is empty
    const bedCount = await Bed.countDocuments();
    if (bedCount === 0) {
      console.log('🌱 Seeding beds...');
      const allBedDocs = [];
      for (const def of WARD_DEFINITIONS) {
        allBedDocs.push(...buildBedDocs(def.prefix, def.counts, def.wardName, def.category));
      }
      await Bed.insertMany(allBedDocs);
      console.log(`✅ Seeded ${allBedDocs.length} beds`);
    }

    // Ensure hospital config exists
    await HospitalConfig.findOneAndUpdate(
      { hospitalId: 'HOSP-ARN-001' },
      { $setOnInsert: { hospitalId: 'HOSP-ARN-001', name: 'Arundati Hospital', tokenPrefix: 'A', tokenCounter: 0, lastReset: new Date().toDateString() } },
      { upsert: true, new: true }
    );

    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    return false;
  }
}

module.exports = { connectDB, WARD_DEFINITIONS };

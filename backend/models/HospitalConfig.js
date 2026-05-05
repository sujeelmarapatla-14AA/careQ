const mongoose = require('mongoose');

// Stores hospital-level config and daily token counter
const hospitalConfigSchema = new mongoose.Schema({
  hospitalId:   { type: String, required: true, unique: true },
  name:         { type: String, default: 'Arundati Hospital' },
  tokenPrefix:  { type: String, default: 'A' },
  address:      { type: String, default: '' },
  phone:        { type: String, default: '' },
  email:        { type: String, default: '' },
  website:      { type: String, default: '' },
  logo:         { type: String, default: null },
  // Daily token counter — reset each day
  tokenCounter: { type: Number, default: 0 },
  lastReset:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('HospitalConfig', hospitalConfigSchema);

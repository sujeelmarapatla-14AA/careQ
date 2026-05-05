const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  token:            { type: String, required: true, unique: true },
  token_number:     { type: String },
  fullName:         { type: String, required: true },
  patient_name:     { type: String },
  age:              { type: Number, default: null },
  gender:           { type: String, default: null },
  phone:            { type: String, default: null },
  visitType:        { type: String, default: 'Walk-in' },
  department:       { type: String, default: 'General OPD' },
  chiefComplaint:   { type: String, default: '' },
  condition:        { type: String, default: '' },
  triageScore:      { type: Number, default: 30 },
  severity:         { type: Number, default: 30 },
  queuePosition:    { type: Number, default: 1 },
  position:         { type: Number, default: 1 },
  estimatedWaitMins:{ type: Number, default: 8 },
  estimatedWaitTime:{ type: Number, default: 8 },
  status:           { type: String, default: 'Waiting', enum: ['Waiting','In Progress','Called','Completed','Discharged','Admitted'] },
  priority:         { type: String, default: 'Normal', enum: ['Normal','Emergency'] },
  assignedBed:      { type: String, default: null },
  assignedWard:     { type: String, default: null },
  assignedDoctor:   { type: String, default: null },
  registeredAt:     { type: Date, default: Date.now },
  registeredBy:     { type: String, default: 'Self-Registration' },
}, { timestamps: true });

// Index for fast daily queries
patientSchema.index({ registeredAt: -1 });
patientSchema.index({ department: 1, status: 1 });
patientSchema.index({ token: 1 });

module.exports = mongoose.model('Patient', patientSchema);

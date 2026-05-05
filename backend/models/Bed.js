const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  action:       String,
  patientToken: String,
  patientName:  String,
  by:           String,
  at:           { type: Date, default: Date.now },
  notes:        String,
}, { _id: false });

const noteEntrySchema = new mongoose.Schema({
  by:   String,
  at:   { type: Date, default: Date.now },
  note: String,
}, { _id: false });

const bedSchema = new mongoose.Schema({
  bedId:            { type: String, required: true, unique: true },
  ward:             { type: String, required: true },
  ward_name:        { type: String },
  category:         { type: String, default: 'general' },
  status:           { type: String, default: 'available', enum: ['available','occupied','reserved','maintenance'] },
  statusUpdatedAt:  { type: Date, default: Date.now },
  statusUpdatedBy:  { type: String, default: 'System' },
  patientToken:     { type: String, default: null },
  patientName:      { type: String, default: null },
  patientAge:       { type: Number, default: null },
  patientGender:    { type: String, default: null },
  patientPhone:     { type: String, default: null },
  department:       { type: String, default: null },
  assignedDoctor:   { type: String, default: null },
  assignedBy:       { type: String, default: null },
  assignedAt:       { type: Date, default: null },
  expectedDischarge:{ type: Date, default: null },
  admissionNotes:   { type: String, default: null },
  reservedUntil:    { type: Date, default: null },
  reservedBy:       { type: String, default: null },
  reservedReason:   { type: String, default: null },
  history:          { type: [historyEntrySchema], default: [] },
  notes:            { type: [noteEntrySchema], default: [] },
}, { timestamps: true });

bedSchema.index({ ward: 1, status: 1 });
bedSchema.index({ patientToken: 1 });

module.exports = mongoose.model('Bed', bedSchema);

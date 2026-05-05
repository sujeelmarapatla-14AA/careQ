import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Activity, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';
import { BASE_URL } from '../api';
import { io } from 'socket.io-client';

const DEPARTMENTS = ['General OPD', 'Emergency', 'Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Gynecology', 'ENT', 'Dermatology', 'Ophthalmology', 'Psychiatry', 'Dental', 'Radiology', 'Laboratory'];
const SYMPTOM_LIST = ['Fever', 'Cough', 'Shortness of Breath', 'Chest Pain', 'Headache', 'Nausea / Vomiting', 'Dizziness', 'Abdominal Pain', 'Back Pain', 'Joint Pain', 'Skin Rash', 'Fatigue', 'Vision Problems', 'Hearing Loss', 'Swelling', 'Bleeding', 'Numbness', 'Anxiety / Depression', 'Other'];
const CONDITIONS_LIST = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Cancer', 'Kidney Disease', 'Thyroid', 'Epilepsy', 'HIV/AIDS', 'None'];

export default function PatientWizard({ onRegistered }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [data, setData] = useState({
    fullName: '', age: '', gender: '', dob: '', phone: '', emergencyName: '', emergencyPhone: '', nationalId: '',
    department: 'General OPD', visitType: 'Walk-in', preferredDoctor: 'No Preference', appointmentDate: new Date().toISOString().split('T')[0], preferredTime: '', complaint: '', previousToken: '',
    symptoms: [], symptomDuration: 'Today', severity: 30, allergies: 'None', medications: '', preExisting: [], prevHospitalization: false, prevHospitalizationDetails: '', pregnant: 'N/A', lifestyle: []
  });

  const isEmergency = data.visitType === 'Emergency';
  const isFollowUp = data.visitType === 'Follow-up';
  const isAppointment = data.visitType === 'Appointment';

  const update = (obj) => setData(prev => ({ ...prev, ...obj }));

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!data.fullName.trim()) return 'Full Name is required.';
      if (!data.phone) return 'Phone number is required.';
      if (!isFollowUp) {
         if (!data.age) return 'Age is required.';
         if (!data.gender) return 'Gender is required.';
      } else {
         if (!data.previousToken) return 'Previous Token / Patient ID is required for follow-ups.';
      }
    }
    if (currentStep === 2) {
      if (!data.visitType) return 'Visit type is required.';
      if (isAppointment && !data.preferredTime) return 'Preferred Time Slot is required for appointments.';
      if (!data.complaint || data.complaint.trim().length < 10) return 'Please provide your reason for visit / notes (min 10 characters).';
    }
    if (currentStep === 3) {
       // All optional
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError('');
    document.getElementById('wizard-top')?.scrollIntoView({ behavior: 'smooth' });
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    document.getElementById('wizard-top')?.scrollIntoView({ behavior: 'smooth' });
    setStep(s => s - 1);
  };

  const submitForm = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(BASE_URL + '/api/queue/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('careq_token') || 'bypass'}` },
        body: JSON.stringify({ 
           patient_name: data.fullName, 
           condition: data.complaint, 
           severity: isEmergency ? data.severity : 30,
           department: data.department,
           visitType: data.visitType
        }),
      });
      const resData = await res.json();
      
      if (resData.token || resData.token_number) {
        const tokenNumber = resData.token || resData.token_number;
        
        try {
          const socket = io(BASE_URL);
          socket.emit('patient:register', { 
            token: tokenNumber, 
            name: data.fullName, 
            dept: data.department, 
            severity: data.severity 
          });
          setTimeout(() => socket.disconnect(), 1000);
        } catch(e) {}

        onRegistered(tokenNumber);
      } else {
        setError(resData.error || 'Registration failed. No token received.');
      }
    } catch(e) {
      setError('Server unreachable. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (arr, item) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} id="wizard-top">
      
      <div className="form-section-card mb-6">
        <div className="flex-between mb-4">
          <h2 className="text-xl" style={{ color: 'var(--text-primary)' }}>Register for Queue</h2>
          <span className="priority-pill normal">Step {step} of 4</span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-overlay)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.4 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: 'var(--accent-primary)', borderRadius: '3px' }} />
        </div>
      </div>

      {error && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--status-danger)', color: 'var(--status-danger)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 'var(--weight-medium)' }}>{error}</motion.div>}

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="form-section-card">
              <div className="form-section-label flex gap-2 items-center"><User size={16} /> Personal Details</div>
              
              <div className="emergency-toggle-card mb-6" onClick={() => update({ visitType: isEmergency ? 'Walk-in' : 'Emergency' })}>
                 <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {isEmergency && <AlertTriangle size={16} color="var(--status-danger)" />}
                       Emergency Case
                    </span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>Toggle if patient requires immediate, life-saving care.</p>
                 </div>
                 <div className={`toggle-switch ${isEmergency ? 'on' : ''}`}>
                    <div className="toggle-knob"></div>
                 </div>
              </div>

              {!isEmergency && (
                <div className="form-group mb-6">
                  <label className="form-label">Visit Type</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['Walk-in', 'Appointment', 'Follow-up'].map(v => (
                      <button key={v} type="button" onClick={() => update({
                          visitType: v, complaint: '', previousToken: '', severity: 30, symptoms: [], allergies: 'None', appointmentDate: new Date().toISOString().split('T')[0], preferredTime: ''
                      })} className={`btn ${data.visitType === v ? 'btn-primary' : 'btn-secondary'}`}>{v}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" value={data.fullName} onChange={e=>update({fullName:e.target.value})} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="tel" className="form-input" value={data.phone} onChange={e=>update({phone:e.target.value})} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              {isFollowUp && (
                 <div className="form-group">
                   <label className="form-label">Previous Token / Patient ID *</label>
                   <input type="text" className="form-input" value={data.previousToken} onChange={e=>update({previousToken:e.target.value})} placeholder="e.g. A-047" />
                 </div>
              )}

              {!isFollowUp && (
                 <div className="grid-2 mt-4">
                  <div className="form-group">
                    <label className="form-label">Age *</label>
                    <input type="number" min="0" className="form-input" value={data.age} onChange={e=>update({age:e.target.value})} placeholder="Years" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-select" value={data.gender} onChange={e=>update({gender:e.target.value})}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                 </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="form-section-card">
              <div className="form-section-label flex gap-2 items-center"><Calendar size={16} /> Visit Information</div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={data.department} onChange={e=>update({department:e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Doctor</label>
                  <select className="form-select" value={data.preferredDoctor} onChange={e=>update({preferredDoctor:e.target.value})}>
                    <option value="No Preference">No Preference</option>
                    <option value="Dr. Smith">Dr. Smith</option>
                    <option value="Dr. Ali">Dr. Ali</option>
                  </select>
                </div>
              </div>

              {isAppointment && (
                <div className="grid-2 mt-4">
                  <div className="form-group">
                    <label className="form-label">Appointment Date *</label>
                    <input type="date" className="form-input" value={data.appointmentDate} onChange={e=>update({appointmentDate:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Time Slot *</label>
                    <select className="form-select" value={data.preferredTime} onChange={e=>update({preferredTime:e.target.value})}>
                      <option value="">Select time...</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group mt-4">
                <label className="form-label">{isFollowUp ? 'Follow-up Notes *' : 'Chief Complaint *'}</label>
                <textarea className="form-textarea" rows="4" value={data.complaint} onChange={e=>update({complaint:e.target.value})} placeholder={isFollowUp ? "Changes since last visit..." : "Describe main symptoms..."}></textarea>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="form-section-card">
              <div className="form-section-label flex gap-2 items-center"><Activity size={16} /> Medical & Triage Data</div>
              
              {isEmergency && (
                <>
                  <div className="form-group mb-6 p-6" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
                    <div className="flex-between mb-4">
                       <label className="form-label mb-0" style={{ color: 'var(--text-primary)' }}>Triage Severity</label>
                       <span className="text-xl font-bold" style={{ color: data.severity >= 80 ? 'var(--status-danger)' : data.severity >= 40 ? 'var(--status-warning)' : 'var(--status-success)' }}>{data.severity}</span>
                    </div>
                    <input type="range" min="1" max="100" value={data.severity} onChange={e=>update({severity:Number(e.target.value)})} />
                  </div>

                  <div className="form-group mb-6">
                    <label className="form-label">Symptoms</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                      {SYMPTOM_LIST.map(sym => (
                        <label key={sym} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                          <input type="checkbox" checked={data.symptoms.includes(sym)} onChange={() => update({ symptoms: toggleArrayItem(data.symptoms, sym) })} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
                          {sym}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!isFollowUp && (
                <div className="form-group mb-6">
                  <label className="form-label">Pre-existing Conditions</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {CONDITIONS_LIST.map(cond => (
                        <button key={cond} type="button" onClick={()=> {
                          if(cond === 'None') update({ preExisting: ['None'] });
                          else {
                            const newArr = toggleArrayItem(data.preExisting.filter(c => c !== 'None'), cond);
                            update({ preExisting: newArr.length ? newArr : ['None'] });
                          }
                        }} className={`btn ${data.preExisting.includes(cond) ? 'btn-primary' : 'btn-secondary'}`}>{cond}</button>
                      ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                 <label className="form-label">Current Medications</label>
                 <input type="text" className="form-input" value={data.medications} onChange={e=>update({medications:e.target.value})} placeholder="Any current medications..." />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="form-section-card">
              <div className="form-section-label flex gap-2 items-center"><CheckCircle size={16} /> Review & Confirm</div>
              
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>Personal Details</h4>
                    <div className="grid-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                       <div><strong style={{ color: 'var(--text-primary)' }}>Name:</strong> {data.fullName}</div>
                       <div><strong style={{ color: 'var(--text-primary)' }}>Age/Gender:</strong> {data.age} / {data.gender}</div>
                       <div><strong style={{ color: 'var(--text-primary)' }}>Phone:</strong> {data.phone}</div>
                    </div>
                 </div>
                 <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>Visit Details</h4>
                    <div className="grid-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                       <div><strong style={{ color: 'var(--text-primary)' }}>Dept:</strong> {data.department}</div>
                       <div><strong style={{ color: 'var(--text-primary)' }}>Type:</strong> {data.visitType}</div>
                       <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {data.complaint}</div>
                    </div>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '2rem' }}>
                <input type="checkbox" id="consent" required style={{ accentColor: 'var(--accent-primary)', width: '20px', height: '20px' }} />
                <label htmlFor="consent" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>I confirm the above information is accurate.</label>
              </div>
              
              <button onClick={submitForm} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }}>
                 {loading ? <Loader2 className="spin-ico" /> : 'Get Queue Token'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-between mt-6">
        <button onClick={prevStep} disabled={step === 1 || loading} className="btn-secondary" style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
           <ChevronLeft size={18} /> Back
        </button>
        {step < 4 && (
          <button onClick={nextStep} className="btn-primary">
             Next <ChevronRight size={18} />
          </button>
        )}
      </div>

    </div>
  );
}

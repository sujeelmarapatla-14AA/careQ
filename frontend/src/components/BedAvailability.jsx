import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, MapPin, Phone, Info, X, User, Calendar, Stethoscope, FileText, AlertCircle, CheckCircle, Wrench, UserX, ArrowRightLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { BASE_URL, apiFetch } from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- STATIC SEED DATA ---
const CITY_CARE = {
  name: 'City Care General Hospital', type: 'Government District Hospital', loc: 'Secunderabad, Telangana', beds: 480, tag: 'Public Health, Public Trust',
  wards: [
    { name: 'General Ward (Male)', tot: 80, a: 15, o: 62, m: 3 }, { name: 'General Ward (Female)', tot: 80, a: 10, o: 66, m: 4 },
    { name: 'ICU', tot: 30, a: 5, o: 23, m: 2 }, { name: 'Emergency', tot: 40, a: 8, o: 30, m: 2 },
    { name: 'Pediatrics', tot: 30, a: 12, o: 17, m: 1 }, { name: 'Maternity', tot: 40, a: 14, o: 24, m: 2 },
    { name: 'Tuberculosis', tot: 30, a: 6, o: 22, m: 2 }, { name: 'Orthopedics', tot: 30, a: 9, o: 19, m: 2 },
    { name: 'Dialysis', tot: 20, a: 4, o: 15, m: 1 }, { name: 'Isolation', tot: 20, a: 5, o: 13, m: 2 },
    { name: 'Surgical', tot: 40, a: 11, o: 27, m: 2 }, { name: 'Ophthalmology', tot: 20, a: 6, o: 13, m: 1 },
    { name: 'Psychiatry', tot: 20, a: 7, o: 12, m: 1 }
  ]
};

const MEDLIFE = {
  name: 'MedLife Super Specialty Centre', type: 'Private Super Specialty Hospital', loc: 'Banjara Hills, Hyderabad', beds: 200, tag: 'Excellence in Advanced Healthcare',
  wards: [
    { name: 'General Ward', tot: 30, a: 11, o: 18, m: 1 }, { name: 'ICU', tot: 20, a: 6, o: 13, m: 1 },
    { name: 'Cardiac ICU', tot: 15, a: 4, o: 10, m: 1 }, { name: 'Neuro ICU', tot: 10, a: 2, o: 8, m: 0 },
    { name: 'Cardiology', tot: 20, a: 7, o: 12, m: 1 }, { name: 'Neurosurgery', tot: 15, a: 4, o: 10, m: 1 },
    { name: 'Spine & Ortho', tot: 15, a: 5, o: 9, m: 1 }, { name: 'Robotic Surgery Unit', tot: 10, a: 3, o: 7, m: 0 },
    { name: 'Oncology', tot: 20, a: 5, o: 14, m: 1 }, { name: 'Transplant Unit', tot: 10, a: 2, o: 8, m: 0 },
    { name: 'Maternity (Premium)', tot: 15, a: 6, o: 8, m: 1 }, { name: 'Executive Suites', tot: 20, a: 9, o: 10, m: 1 }
  ]
};

const getDoughnutOptions = (a, o, m) => {
   const total = a + o + m;
   const occPct = total > 0 ? (o / total) * 100 : 0;
   return {
     data: {
       labels: ['Occupied', 'Available', 'Maintenance'],
       datasets: [{
         data: [o, a, m],
         backgroundColor: ['#ef4444', '#10b981', '#f59e0b'],
         borderWidth: 0,
       }]
     },
     occPct: occPct.toFixed(0)
   };
};

export default function BedAvailability({ isAdmin = false }) {
  const [activeSite, setActiveSite] = useState('arundati');
  const [arundatiBeds, setArundatiBeds] = useState([]);
  const [arundatiWards, setArundatiWards] = useState({});
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Bed Control Modal State
  const [selectedBed, setSelectedBed] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('view'); // view, assign, release, transfer, maintenance
  const [patientQueue, setPatientQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assignDoctor, setAssignDoctor] = useState('Dr. Suresh Reddy');
  const [admissionNotes, setAdmissionNotes] = useState('');
  const [expectedDischarge, setExpectedDischarge] = useState('');
  const [transferTargetBed, setTransferTargetBed] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [toast, setToast] = useState('');
  const [socketRef, setSocketRef] = useState(null);

  // Load Arundati Network
  useEffect(() => {
    const fetchBeds = async () => {
      try {
        const data = await apiFetch('/api/beds');
        if (data && !data.error) processArundati(data);
      } catch (e) {} finally { setLoading(false); }
    };
    
    const fetchQueue = async () => {
      try {
        const data = await apiFetch('/api/queue');
        if (data && Array.isArray(data)) setPatientQueue(data);
      } catch (e) {}
    };
    
    fetchBeds();
    fetchQueue();

    const socket = io(BASE_URL);
    setSocketRef(socket);
    
    socket.on('bedsUpdate', (data) => { if(Array.isArray(data)) processArundati(data); });
    socket.on('bed:update', (data) => { 
      fetchBeds();
      if (data.action === 'assign' || data.action === 'release') {
        fetchQueue();
      }
    });
    socket.on('queueUpdate', (data) => { if(Array.isArray(data)) setPatientQueue(data); });
    
    socket.on('bed:assignSuccess', (data) => {
      showToast(data.message);
      closeModal();
    });
    
    socket.on('bed:releaseSuccess', (data) => {
      showToast(data.message);
      closeModal();
    });
    
    socket.on('bed:transferSuccess', (data) => {
      showToast(data.message);
      closeModal();
    });
    
    socket.on('bed:maintenanceSuccess', (data) => {
      showToast(data.message);
      closeModal();
    });
    
    socket.on('bed:error', (data) => {
      showToast('❌ ' + data.message);
    });

    return () => socket.disconnect();
  }, []);

  const processArundati = (flatBeds) => {
    setArundatiBeds(flatBeds);
    const groups = {};
    flatBeds.forEach(b => {
      const wName = b.ward_name || (b.ward || 'General');
      if (!groups[wName]) groups[wName] = { name: wName, tot: 0, a: 0, o: 0, m: 0, beds: [] };
      groups[wName].tot++;
      if (b.status === 'available') groups[wName].a++;
      else if (b.status === 'occupied') groups[wName].o++;
      else groups[wName].m++;
      groups[wName].beds.push(b);
    });
    setArundatiWards(groups);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const openBedModal = (bed) => {
    if (!isAdmin || activeSite !== 'arundati') return;
    setSelectedBed(bed);
    setShowModal(true);
    setSearchQuery('');
    setSelectedPatient(null);
    setAdmissionNotes('');
    setExpectedDischarge('');
    setTransferTargetBed(null);
    setMaintenanceReason('');
    
    // Determine initial action based on bed status
    if (bed.status === 'available') {
      setModalAction('assign');
    } else if (bed.status === 'occupied') {
      setModalAction('view');
    } else if (bed.status === 'maintenance') {
      setModalAction('maintenance');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBed(null);
    setModalAction('view');
    setSelectedPatient(null);
  };

  const handleAssignBed = () => {
    if (!selectedPatient || !assignDoctor || !socketRef) return;
    
    const staffName = localStorage.getItem('careq_staff_name') || 'Staff Member';
    
    socketRef.emit('bed:assign', {
      bedId: selectedBed.bedId,
      patientToken: selectedPatient.token,
      patientName: selectedPatient.fullName || selectedPatient.patient_name,
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      patientPhone: selectedPatient.phone,
      department: selectedPatient.department,
      assignedDoctor: assignDoctor,
      assignedBy: staffName,
      admissionNotes: admissionNotes,
      expectedDischarge: expectedDischarge || null
    });
  };

  const handleReleaseBed = () => {
    if (!socketRef || !selectedBed) return;
    
    const staffName = localStorage.getItem('careq_staff_name') || 'Staff Member';
    
    socketRef.emit('bed:release', {
      bedId: selectedBed.bedId,
      staffName: staffName,
      reason: 'Patient discharged'
    });
  };

  const handleTransferBed = () => {
    if (!socketRef || !selectedBed || !transferTargetBed) return;
    
    const staffName = localStorage.getItem('careq_staff_name') || 'Staff Member';
    
    socketRef.emit('bed:transfer', {
      fromBedId: selectedBed.bedId,
      toBedId: transferTargetBed.bedId,
      staffName: staffName,
      reason: 'Patient transfer'
    });
  };

  const handleMarkMaintenance = () => {
    if (!socketRef || !selectedBed) return;
    
    const staffName = localStorage.getItem('careq_staff_name') || 'Staff Member';
    
    socketRef.emit('bed:maintenance', {
      bedId: selectedBed.bedId,
      staffName: staffName,
      reason: maintenanceReason || 'Maintenance required'
    });
  };

  const handleMarkAvailable = () => {
    if (!socketRef || !selectedBed) return;
    
    const staffName = localStorage.getItem('careq_staff_name') || 'Staff Member';
    
    socketRef.emit('bed:release', {
      bedId: selectedBed.bedId,
      staffName: staffName,
      reason: 'Maintenance completed - bed ready'
    });
  };

  const filteredPatients = patientQueue.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (p.token && p.token.toLowerCase().includes(query)) ||
      (p.fullName && p.fullName.toLowerCase().includes(query)) ||
      (p.patient_name && p.patient_name.toLowerCase().includes(query)) ||
      (p.phone && p.phone.includes(query))
    );
  });

  const handleAdminAssign = async (bed) => {
    openBedModal(bed);
  };

  // Render logic for different sites
  let renderedWards = [];
  let summary = { tot: 0, a: 0, o: 0, m: 0 };
  let siteInfo = null;

  if (activeSite === 'arundati') {
     renderedWards = Object.values(arundatiWards);
     summary = { tot: arundatiBeds.length, a: arundatiBeds.filter(b=>b.status==='available').length, o: arundatiBeds.filter(b=>b.status==='occupied').length, m: arundatiBeds.filter(b=>b.status!=='available'&&b.status!=='occupied').length };
     siteInfo = { name: 'Arundati Hospital', type: 'Multi-Specialty Teaching Hospital', loc: 'Hyderabad, Telangana', tag: 'Caring for Life, Every Step of the Way' };
  } else if (activeSite === 'citycare') {
     renderedWards = CITY_CARE.wards;
     CITY_CARE.wards.forEach(w => { summary.tot+=w.tot; summary.a+=w.a; summary.o+=w.o; summary.m+=w.m; });
     siteInfo = CITY_CARE;
  } else {
     renderedWards = MEDLIFE.wards;
     MEDLIFE.wards.forEach(w => { summary.tot+=w.tot; summary.a+=w.a; summary.o+=w.o; summary.m+=w.m; });
     siteInfo = MEDLIFE;
  }

  if (activeFilter !== 'All') {
     renderedWards = renderedWards.filter(w => w.name.toLowerCase().includes(activeFilter.toLowerCase()));
  }

  const dnut = getDoughnutOptions(summary.a, summary.o, summary.m);

  // Render Bed Control Modal
  const renderBedModal = () => {
    if (!showModal || !selectedBed) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '0',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--surf)', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ color: 'var(--cyan)', fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>
                    🛏️ Bed {selectedBed.bedId}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    {selectedBed.ward} • {selectedBed.category}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Status Badge */}
              <div style={{ marginTop: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: selectedBed.status === 'available' ? 'rgba(16, 185, 129, 0.2)' :
                             selectedBed.status === 'occupied' ? 'rgba(239, 68, 68, 0.2)' :
                             'rgba(245, 158, 11, 0.2)',
                  color: selectedBed.status === 'available' ? '#10b981' :
                        selectedBed.status === 'occupied' ? '#ef4444' :
                        '#f59e0b',
                  border: `1px solid ${selectedBed.status === 'available' ? '#10b981' :
                                      selectedBed.status === 'occupied' ? '#ef4444' :
                                      '#f59e0b'}`
                }}>
                  {selectedBed.status === 'available' ? '🟢 Available' :
                   selectedBed.status === 'occupied' ? '🔴 Occupied' :
                   '🔧 Maintenance'}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              
              {/* AVAILABLE BED - ASSIGN */}
              {selectedBed.status === 'available' && modalAction === 'assign' && (
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={20} color="var(--cyan)" /> Assign Patient to Bed
                  </h3>
                  
                  {/* Patient Search */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Search Patient from Queue
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by token, name, or phone..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Patient List */}
                  {searchQuery && (
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      {filteredPatients.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No patients found
                        </div>
                      ) : (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.token}
                            onClick={() => setSelectedPatient(patient)}
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer',
                              background: selectedPatient?.token === patient.token ? 'rgba(14,165,233,0.1)' : 'transparent',
                              transition: '0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(14,165,233,0.1)'}
                            onMouseOut={(e) => {
                              if (selectedPatient?.token !== patient.token) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ color: '#fff', fontWeight: 600 }}>
                                  {patient.fullName || patient.patient_name}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  Token: {patient.token} • {patient.department}
                                </div>
                              </div>
                              <div style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: patient.severity >= 80 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                color: patient.severity >= 80 ? '#ef4444' : '#f59e0b'
                              }}>
                                {patient.severity >= 80 ? 'CRITICAL' : 'NORMAL'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Patient Info */}
                  {selectedPatient && (
                    <div style={{
                      background: 'rgba(14,165,233,0.1)',
                      border: '1px solid var(--cyan)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ color: 'var(--cyan)', fontSize: '1rem', marginBottom: '12px' }}>Selected Patient</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                        <div><strong>Token:</strong> {selectedPatient.token}</div>
                        <div><strong>Name:</strong> {selectedPatient.fullName || selectedPatient.patient_name}</div>
                        <div><strong>Age:</strong> {selectedPatient.age}</div>
                        <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>Department:</strong> {selectedPatient.department}</div>
                      </div>
                    </div>
                  )}

                  {/* Doctor Selection */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Assigned Doctor *
                    </label>
                    <select
                      value={assignDoctor}
                      onChange={(e) => setAssignDoctor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="Dr. Suresh Reddy">Dr. Suresh Reddy</option>
                      <option value="Dr. Lakshmi">Dr. Lakshmi</option>
                      <option value="Dr. Rakesh">Dr. Rakesh</option>
                    </select>
                  </div>

                  {/* Expected Discharge */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Expected Discharge Date
                    </label>
                    <input
                      type="date"
                      value={expectedDischarge}
                      onChange={(e) => setExpectedDischarge(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Admission Notes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Admission Notes
                    </label>
                    <textarea
                      value={admissionNotes}
                      onChange={(e) => setAdmissionNotes(e.target.value)}
                      placeholder="Reason for admission, special instructions..."
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Assign Button */}
                  <button
                    onClick={handleAssignBed}
                    disabled={!selectedPatient || !assignDoctor}
                    className="btn-green"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: (!selectedPatient || !assignDoctor) ? 0.5 : 1,
                      cursor: (!selectedPatient || !assignDoctor) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <CheckCircle size={20} /> Assign Bed to Patient
                  </button>
                </div>
              )}

              {/* OCCUPIED BED - VIEW/RELEASE/TRANSFER */}
              {selectedBed.status === 'occupied' && (
                <div>
                  {/* Patient Info */}
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: '#ef4444', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} /> Current Patient
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', color: '#fff' }}>
                      <div><strong>Token:</strong> {selectedBed.patientToken || 'N/A'}</div>
                      <div><strong>Name:</strong> {selectedBed.patientName || 'N/A'}</div>
                      <div><strong>Age:</strong> {selectedBed.patientAge || 'N/A'}</div>
                      <div><strong>Gender:</strong> {selectedBed.patientGender || 'N/A'}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Doctor:</strong> {selectedBed.assignedDoctor || 'N/A'}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Admitted:</strong> {selectedBed.assignedAt ? new Date(selectedBed.assignedAt).toLocaleString() : 'N/A'}</div>
                      {selectedBed.admissionNotes && (
                        <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {selectedBed.admissionNotes}</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {modalAction === 'view' && (
                      <>
                        <button
                          onClick={handleReleaseBed}
                          style={{
                            width: '100%',
                            padding: '14px',
                            background: 'rgba(16,185,129,0.2)',
                            border: '1px solid #10b981',
                            borderRadius: '8px',
                            color: '#10b981',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <UserX size={18} /> Release Bed (Discharge Patient)
                        </button>

                        <button
                          onClick={() => setModalAction('transfer')}
                          style={{
                            width: '100%',
                            padding: '14px',
                            background: 'rgba(14,165,233,0.2)',
                            border: '1px solid var(--cyan)',
                            borderRadius: '8px',
                            color: 'var(--cyan)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <ArrowRightLeft size={18} /> Transfer Patient to Another Bed
                        </button>
                      </>
                    )}

                    {modalAction === 'transfer' && (
                      <div>
                        <h4 style={{ color: '#fff', marginBottom: '12px' }}>Select Target Bed</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                          {arundatiBeds.filter(b => b.status === 'available').map(bed => (
                            <div
                              key={bed.bedId}
                              onClick={() => setTransferTargetBed(bed)}
                              style={{
                                padding: '12px',
                                background: transferTargetBed?.bedId === bed.bedId ? 'rgba(14,165,233,0.2)' : 'rgba(0,0,0,0.2)',
                                border: `1px solid ${transferTargetBed?.bedId === bed.bedId ? 'var(--cyan)' : 'var(--glass-border)'}`,
                                borderRadius: '8px',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                color: '#fff'
                              }}
                            >
                              <strong>{bed.bedId}</strong> - {bed.ward}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setModalAction('view')}
                            style={{
                              flex: 1,
                              padding: '12px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '8px',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleTransferBed}
                            disabled={!transferTargetBed}
                            className="btn-green"
                            style={{
                              flex: 1,
                              padding: '12px',
                              opacity: !transferTargetBed ? 0.5 : 1,
                              cursor: !transferTargetBed ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Confirm Transfer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MAINTENANCE BED - RESTORE */}
              {selectedBed.status === 'maintenance' && (
                <div>
                  <div style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wrench size={18} /> Maintenance Status
                    </h4>
                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                      <div><strong>Marked by:</strong> {selectedBed.statusUpdatedBy || 'Staff'}</div>
                      <div><strong>Marked at:</strong> {selectedBed.statusUpdatedAt ? new Date(selectedBed.statusUpdatedAt).toLocaleString() : 'N/A'}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleMarkAvailable}
                    className="btn-green"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle size={20} /> Mark as Available
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
       
       {/* Toast Notification */}
       <AnimatePresence>
         {toast && (
           <motion.div
             initial={{ opacity: 0, y: -50 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -50 }}
             style={{
               position: 'fixed',
               top: '100px',
               left: '50%',
               transform: 'translateX(-50%)',
               zIndex: 10000,
               background: 'rgba(16,185,129,0.95)',
               color: '#fff',
               padding: '16px 24px',
               borderRadius: '12px',
               boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
               fontWeight: 600,
               fontSize: '1rem'
             }}
           >
             {toast}
           </motion.div>
         )}
       </AnimatePresence>

       {/* Bed Control Modal */}
       {renderBedModal()}
       
       {/* HOSPITAL SELECTOR TABS */}
       <div style={{ display: 'flex', gap: '15px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={()=>setActiveSite('arundati')} className={`h-tab ${activeSite==='arundati'?'active-live':''}`} style={{ padding: '12px 24px', borderRadius: '12px', background: activeSite==='arundati'?'rgba(14,165,233,0.15)':'rgba(0,0,0,0.3)', border: activeSite==='arundati'?'1px solid var(--cyan)':'1px solid var(--glass-border)', color: activeSite==='arundati'?'var(--cyan)':'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
             ⭐ Arundati Hospital {activeSite==='arundati' && <span className="live-pulse">🔴 LIVE</span>}
          </button>
          <button onClick={()=>setActiveSite('citycare')} title="SHOWCASE DATA" className={`h-tab ${activeSite==='citycare'?'active-showcase':''}`} style={{ padding: '12px 24px', borderRadius: '12px', background: activeSite==='citycare'?'rgba(168,85,247,0.15)':'rgba(0,0,0,0.3)', border: activeSite==='citycare'?'1px solid #a855f7':'1px solid var(--glass-border)', color: activeSite==='citycare'?'#a855f7':'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
             City Care General {activeSite==='citycare' && <span style={{ background: '#a855f7', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>PARTNER</span>}
          </button>
          <button onClick={()=>setActiveSite('medlife')} title="SHOWCASE DATA" className={`h-tab ${activeSite==='medlife'?'active-showcase':''}`} style={{ padding: '12px 24px', borderRadius: '12px', background: activeSite==='medlife'?'rgba(168,85,247,0.15)':'rgba(0,0,0,0.3)', border: activeSite==='medlife'?'1px solid #a855f7':'1px solid var(--glass-border)', color: activeSite==='medlife'?'#a855f7':'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
             MedLife Specialty {activeSite==='medlife' && <span style={{ background: '#a855f7', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>PARTNER</span>}
          </button>
       </div>

       {activeSite !== 'arundati' && (
         <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', padding: '12px 20px', borderRadius: '8px', color: '#e9d5ff', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
            <Info size={18} /> This is reference showcase data only. Real-time monitoring and interactivity is available exclusively for Arundati Hospital.
         </motion.div>
       )}

       {/* HEADER & SUMMARY BAR */}
       <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) auto', gap: '2rem', alignItems: 'center' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
               <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 600, margin: 0 }}>{siteInfo.name}</h2>
               {activeSite === 'arundati' && <ShieldCheck color="var(--success-green)" size={20} />}
             </div>
             <p style={{ color: 'var(--cyan)', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 500 }}>{siteInfo.tag}</p>
             <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> {siteInfo.loc}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14}/> {siteInfo.type}</span>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingLeft: '2rem', borderLeft: '1px solid var(--glass-border)' }}>
             <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <Doughnut data={dnut.data} options={{ cutout: '75%', plugins: { legend: {display:false}, tooltip: {enabled:true} } }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{dnut.occPct}%</div>
                </div>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '1.1rem', color: '#fff' }}>Total: <strong>{summary.tot} beds</strong></div>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', fontWeight: 600 }}>
                   <span style={{ color: 'var(--success-green)' }}>🟢 Available: {summary.a}</span>
                   <span style={{ color: 'var(--urgent-red)' }}>🔴 Occupied: {summary.o}</span>
                   <span style={{ color: 'var(--amber)' }}>🟡 Maintenance: {summary.m}</span>
                </div>
             </div>
          </div>
       </div>

       {/* FILTER PILLS */}
       <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {['All', 'ICU', 'General', 'Emergency', 'Pediatric', 'Specialty', 'Maternity'].map(f => (
             <button key={f} onClick={()=>setActiveFilter(f)} style={{ padding: '6px 16px', borderRadius: '30px', background: activeFilter===f ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeFilter===f ? '#fff' : 'var(--text-muted)', border: activeFilter===f ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem' }}>
                {f}
             </button>
          ))}
       </div>

       {/* WARD GRID */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {renderedWards.map((w, i) => (
             <motion.div key={w.name + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
                   <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>{w.name}</h4>
                   <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '8px' }}>{w.tot} Beds</span>
                </div>
                
                {/* Visual Bed Squares */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1rem', minHeight: '60px', alignContent: 'flex-start' }}>
                   {w.beds ? (
                      // Real DB Beds representation (Arundati)
                      w.beds.map(bed => {
                         let color = '#ef4444'; // occupied
                         if (bed.status === 'available') color = '#10b981';
                         else if (bed.status === 'cleaning' || bed.status === 'maintenance') color = '#f59e0b';
                         
                         return (
                            <motion.div 
                              layoutId={`bed-${bed.id}`}
                              key={bed.id} 
                              onClick={() => handleAdminAssign(bed)}
                              title={`Bed ${bed.bedId} - ${bed.status}${bed.patientName ? ' | ' + bed.patientName : ''} ${isAdmin ? '(Click to manage)' : ''}`}
                              style={{ 
                                width: '14px', 
                                height: '14px', 
                                borderRadius: '3px', 
                                background: color, 
                                cursor: isAdmin ? 'pointer' : 'default', 
                                transition: '0.2s', 
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                border: bed.patientName ? '2px solid rgba(255,255,255,0.3)' : 'none'
                              }}
                              whileHover={isAdmin ? { scale: 1.3, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' } : {}}
                              whileTap={isAdmin ? { scale: 0.95 } : {}}
                            />
                         )
                      })
                   ) : (
                      // Static Dummy Array creation (Partners)
                      Array.from({ length: w.tot }).map((_, idx) => {
                         let color = '#ef4444'; // occupied
                         if (idx < w.a) color = '#10b981'; // available
                         else if (idx >= w.tot - w.m) color = '#f59e0b'; // maintenance
                         return <div key={idx} style={{ width: '12px', height: '12px', borderRadius: '2px', background: color, opacity: 0.8 }} />
                      })
                   )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                   <span>🟢 {w.a} Free</span>
                   <span>🔴 {w.o} Occ</span>
                   <span>🟡 {w.m} Maint</span>
                </div>
                {activeSite === 'arundati' && (
                  <div style={{ fontSize: '0.7rem', color: 'gray', marginTop: '10px', textAlign: 'right' }}>
                    Live Updated
                  </div>
                )}
             </motion.div>
          ))}
       </div>

       {renderedWards.length === 0 && (
         <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No wards match this filter.</div>
       )}

       <style dangerouslySetInnerHTML={{__html: `
         .live-pulse { animation: pulseLive 2s infinite; font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; margin-left:8px; }
         @keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
         .h-tab:hover { background: rgba(255,255,255,0.05) !important; }
         .active-live { box-shadow: 0 0 20px rgba(14,165,233,0.2); }
         .active-showcase { box-shadow: 0 0 20px rgba(168,85,247,0.2); }
       `}} />
    </div>
  );
}

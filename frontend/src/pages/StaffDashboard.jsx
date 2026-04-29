import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { AlertTriangle, X, Activity } from 'lucide-react';
import { BASE_URL, apiFetch } from '../api';
import ResourceDashboard from '../components/ResourceDashboard';

export default function StaffDashboard() {
  const [activeView, setActiveView] = useState('queue'); // 'queue' or 'resources'
  const [activeTab, setActiveTab] = useState('General');

  const [queue, setQueue] = useState([]);
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [metrics, setMetrics] = useState({ totalWaiting: 0, occupiedBeds: 0, totalBeds: 0, avgWaitMinutes: 0, emergencies: 0 });
  const [dismissEmergencies, setDismissEmergencies] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentBedId, setAssignmentBedId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showRoomOnlyModal, setShowRoomOnlyModal] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    apiFetch('/api/queue').then(data => { if (Array.isArray(data)) setQueue(data); });
    apiFetch('/api/beds').then(data => { if (Array.isArray(data)) setBeds(normalizeBeds(data)); });
    apiFetch('/api/rooms').then(data => { if (Array.isArray(data)) setRooms(data); });
    apiFetch('/api/stats').then(data => { if (data && !data.error) setMetrics(data); });

    socketRef.current = io(BASE_URL);
    socketRef.current.on('queueUpdate', (data) => { if (Array.isArray(data)) { setQueue(data); fetchStats(); } });
    socketRef.current.on('bedsUpdate', (data) => { if (Array.isArray(data)) { setBeds(normalizeBeds(data)); fetchStats(); } });
    socketRef.current.on('resource:updated', () => { apiFetch('/api/rooms').then(data => { if (Array.isArray(data)) setRooms(data); }); });
    
    const fetchStats = () => apiFetch('/api/stats').then(data => { if(data && !data.error) setMetrics(prev => ({...prev, ...data}))});
    fetchStats();
    
    return () => socketRef.current.disconnect();
  }, []);

  const currentEmergencies = queue.filter(q => q.severity >= 80).length;

  const normalizeBeds = (rows) => rows.map(b => ({
    id: b.id,
    displayId: `B-${String(b.id).padStart(2, '0')}`,
    status: b.status,
    patient: b.patient_id || null,
    ward: b.ward_name?.includes('ICU') ? 'ICU' : b.ward_name?.includes('Paediatric') ? 'Paediatric' : 'General',
  }));

  const updateBedStatus = async (bedId, status) => {
    await apiFetch(`/api/beds/${bedId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if(socketRef.current) socketRef.current.emit('bed:update', { bedId, status });
  };

  const assignPatientToBed = async (bedId, patient) => {
    const staffName = localStorage.getItem('careq_staff_name') || 'Staff Member';
    if(socketRef.current) {
      socketRef.current.emit('bed:assign', {
        bedId: bedId,
        patientToken: patient.token_number || patient.token,
        patientName: patient.patient_name || patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientPhone: patient.phone,
        department: patient.department,
        assignedDoctor: 'Dr. Suresh Reddy',
        assignedBy: staffName,
        admissionNotes: `Assigned from queue - ${patient.condition || 'General consultation'}`,
        expectedDischarge: null
      });
    }
    
    if (selectedRoom) {
      const need = patient.department === 'Radiology' || patient.condition?.toLowerCase().includes('scan') 
        ? 'Needs Scan' : 'Needs Checkup';
      await apiFetch(`/api/rooms/${selectedRoom}`, {
        method: 'POST',
        body: JSON.stringify({
          patientName: patient.patient_name || patient.fullName,
          need: need,
          notes: `Assigned with bed ${bedId}`
        })
      });
    }
    
    setSelectedPatient(null);
    setSelectedRoom('');
    setShowAssignmentModal(false);
  };

  const assignPatientToRoomOnly = async (roomId, patient) => {
    const need = patient.department === 'Radiology' || patient.condition?.toLowerCase().includes('scan') 
      ? 'Needs Scan' : 'Needs Checkup';
    await apiFetch(`/api/rooms/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({
        patientName: patient.patient_name || patient.fullName,
        need: need,
        notes: `Assigned from queue - ${patient.condition || 'General consultation'}`
      })
    });
    
    setSelectedPatient(null);
    setSelectedRoom('');
    setShowRoomOnlyModal(false);
    setShowPatientModal(false);
  };

  const getUrgencyTag = (sev) => {
    if (sev >= 80) return { label: 'Emergency', class: 'emergency' };
    if (sev >= 31) return { label: 'High Priority', class: 'high' };
    return { label: 'Normal', class: 'normal' };
  };

  const showBanner = currentEmergencies > 0 && !dismissEmergencies;
  const filteredBeds = beds.filter(b => b.ward === activeTab);
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const totalWaiting = queue.length;

  return (
    <div className="container">
      
      <AnimatePresence>
        {showBanner && (
           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
             <div style={{ background: 'var(--icu-critical-bg)', border: '1px solid var(--icu-critical-border)', padding: '12px 24px', borderRadius: '12px', color: 'var(--status-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle /> <span>⚠ {currentEmergencies} Emergency patient(s) in queue — severity &gt; 80! Focus immediate medical intervention.</span></div>
               <button onClick={() => setDismissEmergencies(true)} style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}><X size={20} /></button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-6">
        <div className="section-tag">Staff Dashboard</div>
        <h1 className="text-2xl" style={{ color: 'var(--text-primary)' }}>Live Queue & Bed Management</h1>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem', background: 'var(--bg-overlay)', borderRadius: '12px', padding: '6px', width: 'max-content' }}>
          <button onClick={() => setActiveView('queue')} className={`btn ${activeView === 'queue' ? 'btn-secondary' : 'btn-ghost'}`} style={{ border: activeView === 'queue' ? '1px solid var(--accent-primary)' : '1px solid transparent', color: activeView === 'queue' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            Queue & Beds
          </button>
          <button onClick={() => setActiveView('resources')} className={`btn ${activeView === 'resources' ? 'btn-secondary' : 'btn-ghost'}`} style={{ border: activeView === 'resources' ? '1px solid var(--accent-primary)' : '1px solid transparent', color: activeView === 'resources' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            <Activity size={18} /> Resource Availability
          </button>
        </div>
      </header>

      {activeView === 'queue' && (
      <div className="flex-col gap-6">
        
        <div className="dashboard-grid">
          <div className="stat-card">
            <span className="stat-label">Total Waiting</span>
            <div className="stat-value">{totalWaiting}</div>
            <span className="stat-sub">in queue now</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Beds Available</span>
            <div className="stat-value success">{availableBeds}</div>
            <span className="stat-sub">of {beds.length} total</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg Wait</span>
            <div className="stat-value">{metrics.avgWaitMinutes || (totalWaiting * 8)}<span className="text-lg" style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>m</span></div>
            <span className="stat-sub">estimated</span>
          </div>
          <div className={`stat-card ${currentEmergencies > 0 ? 'flash-red' : ''}`} style={currentEmergencies > 0 ? {borderColor: 'var(--status-danger)'} : {}}>
            <span className="stat-label">Emergencies</span>
            <div className={`stat-value ${currentEmergencies > 0 ? 'danger' : ''}`}>{currentEmergencies}</div>
            <span className="stat-sub">severity &gt; 80</span>
          </div>
        </div>

        <div className="grid-2">
          
          <div className="glass-panel flex-col gap-4">
             <div className="section-tag">Live Queue</div>
             
             <div className="queue-list">
               <AnimatePresence>
                 {queue.length === 0 && <div className="text-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Queue is empty.</div>}
                 {queue.map((q, i) => {
                   const tag = getUrgencyTag(q.severity);
                   const isSelected = selectedPatient?.id === q.id;
                   return (
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        key={q.id || i}
                        className={`queue-item ${q.severity >= 80 ? 'emergency' : ''}`}
                        style={{ border: isSelected ? '1px solid var(--accent-primary)' : '' }}
                        onClick={() => {
                          setViewingPatient(q);
                          setShowPatientModal(true);
                        }}
                     >
                       <div className="queue-item-left">
                         <span className={`token-badge ${q.severity >= 80 ? 'emergency' : ''}`}>{q.token_number}</span>
                         <div className="flex-col">
                            <span className="text-base" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{q.patient_name}</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{q.condition || 'Consultation'}</span>
                         </div>
                       </div>
                       
                       <div className="flex-between gap-4">
                         <span className={`priority-pill ${tag.class}`}>{tag.label}</span>
                         <button
                           title={isSelected ? "Selected - Click a bed to assign" : "Click to select patient"}
                           onClick={(e) => {
                             e.stopPropagation();
                             setSelectedPatient(isSelected ? null : q);
                           }}
                           className={isSelected ? 'btn-primary' : 'btn-secondary'}
                           style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                         >
                           {isSelected ? 'Selected' : 'Select'}
                         </button>
                       </div>
                     </motion.div>
                   )
                 })}
               </AnimatePresence>
             </div>
          </div>

          <div className="glass-panel flex-col gap-4">
             <div className="flex-between">
                <div className="section-tag mb-0">Bed Infrastructure Node</div>
                <div style={{ display: 'flex', background: 'var(--bg-overlay)', borderRadius: '8px', padding: '4px' }}>
                   {['General', 'ICU', 'Paediatric'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab)} style={{
                       padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                       background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
                       color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                       border: activeTab === tab ? '1px solid var(--border-default)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s'
                     }}>
                       {tab}
                     </button>
                   ))}
                </div>
             </div>

             {selectedPatient && (
               <div style={{ background: 'rgba(45,126,248,0.1)', border: '1px solid rgba(45,126,248,0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div>
                   <span style={{ color: 'var(--accent-primary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                     Assigning: {selectedPatient.token_number} - {selectedPatient.patient_name}
                   </span>
                   <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                     Click an available bed to assign
                   </p>
                 </div>
                 <button onClick={() => setSelectedPatient(null)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>Cancel</button>
               </div>
             )}

             <div className="bed-grid">
               <AnimatePresence mode="popLayout">
                 {filteredBeds.map((bed) => {
                   return (
                     <motion.div 
                       layout
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                       key={bed.id} 
                       className={`bed-cell ${bed.status}`}
                       style={{
                         opacity: selectedPatient && bed.status !== 'available' ? 0.4 : 1,
                         border: selectedPatient && bed.status === 'available' ? '1px solid var(--accent-primary)' : ''
                       }}
                       onClick={() => {
                         if (selectedPatient && bed.status === 'available') {
                           setAssignmentBedId(bed.id);
                           setShowAssignmentModal(true);
                         } else if (!selectedPatient) {
                           const next = bed.status === 'available' ? 'occupied' : bed.status === 'occupied' ? 'cleaning' : 'available';
                           updateBedStatus(bed.id, next);
                         }
                       }}
                     >
                       <span className="bed-id">{bed.displayId}</span>
                       <span className="bed-status">{bed.status}</span>
                       {bed.patient && <span className="bed-patient">{bed.patient}</span>}
                     </motion.div>
                   )
                 })}
               </AnimatePresence>
             </div>

          </div>

        </div>
      </div>
      )}

      {activeView === 'resources' && <ResourceDashboard />}

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showPatientModal && viewingPatient && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPatientModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="form-section-card flex-col"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '0', position: 'relative' }}
            >
              <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10 }}>
                <div className="flex-between">
                  <div>
                    <h2 className="text-xl" style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Patient Details</h2>
                    <p className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>Token: {viewingPatient.token_number || viewingPatient.token}</p>
                  </div>
                  <button onClick={() => setShowPatientModal(false)} className="btn-ghost" style={{ padding: '8px' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ padding: 'var(--space-6)' }}>
                <div className="mb-6">
                  <span className={`priority-pill ${getUrgencyTag(viewingPatient.severity).class}`} style={{ fontSize: 'var(--text-sm)' }}>
                    Severity: {viewingPatient.severity} ({getUrgencyTag(viewingPatient.severity).label})
                  </span>
                </div>

                <div className="mb-6 p-6" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="text-base mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
                  <div className="grid-2">
                    <div><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Name</span><div className="text-sm font-semibold">{viewingPatient.patient_name || viewingPatient.fullName || 'N/A'}</div></div>
                    <div><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Age</span><div className="text-sm font-semibold">{viewingPatient.age || 'N/A'}</div></div>
                    <div><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Gender</span><div className="text-sm font-semibold">{viewingPatient.gender || 'N/A'}</div></div>
                    <div><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Phone</span><div className="text-sm font-semibold">{viewingPatient.phone || 'N/A'}</div></div>
                  </div>
                </div>

                <div className="mb-6 p-6" style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h3 className="text-base mb-4" style={{ color: 'var(--status-danger)' }}>Medical Information</h3>
                  <div className="flex-col gap-4">
                    <div><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Condition</span><div className="text-sm font-semibold">{viewingPatient.condition || viewingPatient.chiefComplaint || 'Not specified'}</div></div>
                    <div><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Department</span><div className="text-sm font-semibold">{viewingPatient.department || 'General OPD'}</div></div>
                  </div>
                </div>

                <div className="flex-between gap-4">
                  <button onClick={() => { setSelectedPatient(viewingPatient); setShowPatientModal(false); }} className="btn-primary" style={{ flex: 1 }}>🛏️ Assign Bed</button>
                  <button onClick={() => { setShowPatientModal(false); setShowRoomOnlyModal(true); }} className="btn-secondary" style={{ flex: 1 }}>📋 Assign Room</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Modals would follow a similar pattern here, omitting for brevity as they just contain a select dropdown */}
      {/* ... Room assignment modals functionality preserved but simplified ... */}
      
      <AnimatePresence>
        {showAssignmentModal && selectedPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div className="form-section-card p-6" style={{ maxWidth: '500px', width: '100%' }}>
                <h2 className="text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Assign Patient to Bed & Room</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Assigning to Bed {assignmentBedId}</p>
                
                <div className="form-group">
                   <label className="form-label">Select Room (Optional)</label>
                   <select className="form-select" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                      <option value="">No room (Bed only)</option>
                      {rooms.filter(r => r.status === 'available').map(room => (
                         <option key={room.id} value={room.id}>{room.name} ({room.category})</option>
                      ))}
                   </select>
                </div>
                
                <div className="flex-between gap-4 mt-6">
                   <button onClick={() => assignPatientToBed(assignmentBedId, selectedPatient)} className="btn-primary" style={{ flex: 1 }}>Confirm</button>
                   <button onClick={() => setShowAssignmentModal(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showRoomOnlyModal && viewingPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div className="form-section-card p-6" style={{ maxWidth: '500px', width: '100%' }}>
                <h2 className="text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Assign to Room Only</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Assigning {viewingPatient.patient_name}</p>
                
                <div className="form-group">
                   <label className="form-label">Select Room</label>
                   <select className="form-select" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                      <option value="">-- Select a room --</option>
                      {rooms.filter(r => r.status === 'available').map(room => (
                         <option key={room.id} value={room.id}>{room.name} ({room.category})</option>
                      ))}
                   </select>
                </div>
                
                <div className="flex-between gap-4 mt-6">
                   <button onClick={() => selectedRoom && assignPatientToRoomOnly(selectedRoom, viewingPatient)} disabled={!selectedRoom} className={selectedRoom ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }}>Confirm</button>
                   <button onClick={() => setShowRoomOnlyModal(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

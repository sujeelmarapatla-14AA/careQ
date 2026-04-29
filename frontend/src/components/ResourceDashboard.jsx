import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Bed, Stethoscope, Syringe, Heart, Droplet, 
  Truck, Pill, Users, Clock, AlertTriangle, TrendingUp,
  Edit2, Save, X, Plus, Minus, RefreshCw
} from 'lucide-react';
import { apiFetch, BASE_URL } from '../api';
import { io } from 'socket.io-client';

const ResourceDashboard = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // New states for Modal and Patients
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedNeed, setSelectedNeed] = useState('Needs Checkup');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const socketRef = React.useRef(null);

  useEffect(() => {
    loadRooms();
    loadPatients();
    
    // Real-time updates
    socketRef.current = io(BASE_URL);
    socketRef.current.on('resource:updated', () => loadRooms());
    socketRef.current.on('queueUpdate', () => loadPatients());
    
    return () => socketRef.current?.disconnect();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    const data = await apiFetch('/api/rooms');
    if (data && Array.isArray(data)) {
      setResources(data);
    }
    setLoading(false);
  };

  const loadPatients = async () => {
    try {
      const data = await apiFetch('/api/queue');
      if (data && Array.isArray(data)) {
        setPatients(data);
      }
    } catch (err) {
      console.error('Failed to load patients for dropdown:', err);
    }
  };

  const updateResource = async (resourceId, updates) => {
    if (updates.status === 'available') {
      await apiFetch(`/api/rooms/${resourceId}/clear`, {
        method: 'PATCH'
      });
    }
    loadRooms();
    setEditingResource(null);
  };

  const assignPatient = async (roomId, patientName, need, notes) => {
    try {
      const result = await apiFetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        body: JSON.stringify({ patientName, need, notes })
      });
      if (result.error) alert(result.error);
    } catch (err) {
      alert('Failed to assign patient. Ensure you are logged in.');
    }
    loadRooms();
  };

  const handleModalSubmit = () => {
    if (!selectedPatient) return alert('Please select a patient');
    assignPatient(selectedRoom.id, selectedPatient, selectedNeed, assignmentNotes);
    setIsModalOpen(false);
    setSelectedPatient('');
    setAssignmentNotes('');
  };

  const getStatusColor = (status) => {
    if (status === 'available') return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' };
    if (status === 'occupied') return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' };
    return { bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8', text: '#94a3b8' };
  };

  const getNeedColor = (need) => {
    if (need === 'Needs Checkup') return { bg: 'rgba(14, 165, 233, 0.15)', border: '#0ea5e9', text: '#0ea5e9' };
    if (need === 'Needs Scan') return { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#a855f7' };
    return { bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8', text: '#94a3b8' };
  };

  const getTimeSince = (assignedAt) => {
    if (!assignedAt) return '';
    const mins = Math.floor((new Date() - new Date(assignedAt)) / 60000);
    return `${mins} min`;
  };

  // Group rooms by category
  const groupedRooms = resources.reduce((acc, room) => {
    const category = room.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(room);
    return acc;
  }, {});

  // Define category order
  const categoryOrder = ['Appointment Rooms', 'Checkup Rooms', 'MRI Scan Rooms', 'X-Ray Rooms'];
  const categories = categoryOrder.filter(cat => groupedRooms[cat]);

  // Calculate summary stats
  const totalRooms = resources.length;
  const availableCount = resources.filter(r => r.status === 'available').length;
  const occupiedCount = resources.filter(r => r.status === 'occupied').length;
  const needsScanCount = resources.filter(r => r.need === 'Needs Scan').length;

  return (
    <div style={{ padding: '2rem 0' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '0.3rem' }}>
            Resource Availability Dashboard
          </p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Live Hospital Resources
          </h2>
        </div>
        <button
          onClick={loadRooms}
          style={{
            padding: '12px 24px',
            background: 'rgba(14, 165, 233, 0.2)',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            color: '#0ea5e9',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary Bar */}
      {!loading && resources.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #0ea5e9' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Rooms</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalRooms}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Available</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{availableCount}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Occupied</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{occupiedCount}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Needs Scan Today</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}>{needsScanCount}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>Loading resources...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && resources.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#eab308" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Resources Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Resources will appear here once they are added to the system.</p>
        </div>
      )}

      {/* Room Categories */}
      {!loading && categories.map((category, idx) => {
        const categoryRooms = groupedRooms[category];
        const availableInCategory = categoryRooms.filter(r => r.status === 'available').length;
        const occupiedInCategory = categoryRooms.filter(r => r.status === 'occupied').length;
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel"
            style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
          >
            {/* Category Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(14, 165, 233, 0.15)', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Activity size={24} color="#0ea5e9" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>
                    {category}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    {availableInCategory} Available / {occupiedInCategory} Occupied
                  </p>
                </div>
              </div>
            </div>

            {/* Room Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1rem' 
            }}>
              {categoryRooms.map((room) => {
                const statusColors = getStatusColor(room.status);
                const needColors = room.need ? getNeedColor(room.need) : null;
                const timeSince = room.assignedAt ? getTimeSince(room.assignedAt) : '';

                return (
                  <motion.div
                    key={room.id}
                    layout
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      background: 'var(--surf2)',
                      border: `2px solid ${statusColors.border}`,
                      borderLeft: `4px solid ${statusColors.border}`,
                      borderRadius: '12px',
                      position: 'relative',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                  >
                    {/* Room ID & Name */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 700, 
                        color: '#0ea5e9',
                        fontFamily: 'monospace',
                        marginBottom: '4px'
                      }}>
                        {room.id}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {room.name}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      background: statusColors.bg,
                      border: `1px solid ${statusColors.border}`,
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: statusColors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '1rem'
                    }}>
                      {room.status}
                    </div>

                    {/* Occupied State Info */}
                    {room.status === 'occupied' && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          fontSize: '1rem', 
                          fontWeight: 600, 
                          color: 'var(--text-main)',
                          marginBottom: '8px'
                        }}>
                          {room.patient}
                        </div>
                        
                        {room.need && (
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            background: needColors.bg,
                            border: `1px solid ${needColors.border}`,
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: needColors.text,
                            marginBottom: '8px'
                          }}>
                            {room.need}
                          </div>
                        )}
                        
                        {timeSince && (
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-muted)',
                            marginTop: '8px'
                          }}>
                            In progress · {timeSince}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {room.status === 'available' ? (
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          setSelectedPatient(patients.length > 0 ? patients[0].patient_name : '');
                          setSelectedNeed(room.category.includes('Scan') || room.category.includes('X-Ray') ? 'Needs Scan' : 'Needs Checkup');
                          setAssignmentNotes('');
                          setIsModalOpen(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid #10b981',
                          borderRadius: '8px',
                          color: '#10b981',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Assign Patient
                      </button>
                    ) : (
                      <button
                        onClick={() => updateResource(room.id, { status: 'available' })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          color: '#ef4444',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Mark as Available
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

      {/* Assignment Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '16px',
                padding: '2rem',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#F8FAFC' }}>Assign Room {selectedRoom.id}</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="" disabled>-- Select a patient --</option>
                  {patients.map(p => (
                    <option key={p.token} value={p.patient_name}>{p.token_number} - {p.patient_name}</option>
                  ))}
                </select>
                {patients.length === 0 && <p style={{ color: '#eab308', fontSize: '0.8rem', marginTop: '4px' }}>No patients currently in queue.</p>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Primary Need</label>
                <select
                  value={selectedNeed}
                  onChange={e => setSelectedNeed(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="Needs Checkup">Needs Checkup</option>
                  <option value="Needs Scan">Needs Scan</option>
                  <option value="General Observation">General Observation</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Notes (Optional)</label>
                <input
                  type="text"
                  value={assignmentNotes}
                  onChange={e => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Needs immediate attention"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'transparent',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.background = '#1E293B'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  disabled={!selectedPatient}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: selectedPatient ? '#0EA5E9' : '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    color: selectedPatient ? '#fff' : '#64748B',
                    cursor: selectedPatient ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => selectedPatient && (e.target.style.background = '#0284C7')}
                  onMouseLeave={e => selectedPatient && (e.target.style.background = '#0EA5E9')}
                >
                  Confirm Assignment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceDashboard;

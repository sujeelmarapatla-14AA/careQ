import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { AlertTriangle, X } from 'lucide-react';
import { BASE_URL, apiFetch } from '../api';

const CountUp = ({ end, duration = 1.2 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count}</span>;
}

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('General');

  const [queue, setQueue] = useState([]);
  const [beds, setBeds] = useState([]);
  const [metrics, setMetrics] = useState({ totalWaiting: 0, occupiedBeds: 0, totalBeds: 0, avgWaitMinutes: 0, emergencies: 0 });
  const [dismissEmergencies, setDismissEmergencies] = useState(false);

  useEffect(() => {
    // Initial fetch
    apiFetch('/api/queue').then(data => { if (Array.isArray(data)) setQueue(data); });
    apiFetch('/api/beds').then(data => { if (Array.isArray(data)) setBeds(normalizeBeds(data)); });
    apiFetch('/api/stats').then(data => { if (data && !data.error) setMetrics(data); });

    // Real-time updates
    const socket = io(BASE_URL);
    socket.on('queueUpdate', (data) => { if (Array.isArray(data)) { setQueue(data); fetchStats(); } });
    socket.on('bedsUpdate', (data) => { if (Array.isArray(data)) { setBeds(normalizeBeds(data)); fetchStats(); } });
    
    // Fallback polling for stats just tightly sync UI
    const fetchStats = () => apiFetch('/api/stats').then(data => { if(data && !data.error) setMetrics(prev => ({...prev, ...data}))});
    fetchStats();
    // manually calc emergencies since /api/stats might not have it. Wait, previously /api/dashboard/metrics returned it.
    // I rewrote /api/stats but I didn't verify it returned emergencies!
    // Since I can count emergencies directly from `queue` socket:
    return () => socket.disconnect();
  }, []);

  // Update emergencies dynamically from state to ensure it tracks perfectly
  const currentEmergencies = queue.filter(q => q.severity >= 80).length;

  // Map DB beds to UI format
  const normalizeBeds = (rows) => rows.map(b => ({
    id: b.id,
    displayId: `B-${String(b.id).padStart(2, '0')}`,
    status: b.status,
    patient: b.patient_id || null,
    ward: b.ward_name?.includes('ICU') ? 'ICU' : b.ward_name?.includes('Paediatric') ? 'Paediatric' : 'General',
  }));

  const updateBedStatus = async (bedId, status) => {
    await apiFetch(`/api/beds/${bedId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  };

  const updateQueueStatus = async (id, status) => {
    await apiFetch(`/api/queue/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  };

  const getUrgencyTag = (sev) => {
    if (sev >= 80) return { label: 'Emergency', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', barColor: 'var(--red)' };
    if (sev >= 31) return { label: 'High', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', barColor: 'var(--amber)' };
    return { label: 'Normal', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', barColor: 'var(--teal)' };
  };

  const getBedColor = (status) => {
    switch(status) {
      case 'occupied': return { border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', dot: '#ef4444' };
      case 'available': return { border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', dot: '#10b981' };
      case 'cleaning': return { border: 'rgba(234, 179, 8, 0.3)', text: '#eab308', dot: '#eab308' };
      default: return { border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8', dot: '#94a3b8' };
    }
  };

  const showBanner = currentEmergencies > 0 && !dismissEmergencies;
  const filteredBeds = beds.filter(b => b.ward === activeTab);
  const availableBeds = beds.filter(b => b.status === 'available').length;
  // Queue stats usually derived from queue network
  const totalWaiting = queue.length;

  return (
    <div className="page-enter container" style={{ padding: '2rem', maxWidth: '1400px' }}>
      
      <AnimatePresence>
        {showBanner && (
           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
             <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--urgent-red)', padding: '12px 24px', borderRadius: '12px', color: 'var(--urgent-red)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle /> <span>⚠ {currentEmergencies} Emergency patient(s) in queue — severity &gt; 80! Focus immediate medical intervention.</span></div>
               <button onClick={() => setDismissEmergencies(true)} style={{ background: 'none', border: 'none', color: 'var(--urgent-red)', cursor: 'pointer' }}><X size={20} /></button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '0.3rem' }}>Staff Dashboard</p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Live queue & bed management</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Metric Row - Proper 4 column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--cyan)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Total Waiting</p>
            <div className="monospace" style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}><CountUp end={totalWaiting} /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>in queue now</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--teal)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Beds Available</p>
            <div className="monospace" style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}><CountUp end={availableBeds} /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>of {beds.length} total</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--amber)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Avg Wait</p>
            <div className="monospace" style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}><CountUp end={metrics.avgWaitMinutes || (totalWaiting * 8)} /><span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>m</span></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>estimated</p>
          </div>
          <div className={`glass-panel ${currentEmergencies > 0 ? 'flash-red' : ''}`} style={{ padding: '1.5rem', borderLeft: '4px solid var(--red)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Emergencies</p>
            <div className="monospace" style={{ fontSize: '2.5rem', fontWeight: 600, color: currentEmergencies > 0 ? 'var(--urgent-red)' : 'var(--text-main)', lineHeight: 1 }}><CountUp end={currentEmergencies} /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>severity &gt; 80</p>
          </div>
        </div>

        {/* Dual Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(400px, 2fr)', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Live Queue */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)', boxShadow: '0 0 10px var(--success-green)' }} />
               <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Queue</p>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
               <AnimatePresence>
                 {queue.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>Queue is empty.</div>}
                 {queue.map((q, i) => {
                   const tag = getUrgencyTag(q.severity);
                   return (
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        key={q.id || i}
                        className="queue-row"
                        style={{ 
                          display: 'grid', gridTemplateColumns: '70px 1fr auto 40px', alignItems: 'center',
                          padding: '1.2rem 14px',
                          borderBottom: i !== queue.length -1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          borderLeft: `4px solid ${tag.barColor}`,
                          marginLeft: '-4px', background: 'var(--surf)', marginBottom: '8px', borderRadius: '0 8px 8px 0',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                     >
                       <span className="monospace" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{q.token_number}</span>
                       <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>{q.patient_name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{q.condition || 'Consultation'}</span>
                       </div>
                       <div style={{ background: tag.bg, color: tag.color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginRight: '1rem' }}>
                          {tag.label}: {q.severity}
                       </div>
                       <button
                         title="Mark as in progress"
                         onClick={() => updateQueueStatus(q.id, q.status === 'waiting' ? 'in_progress' : 'completed')}
                         style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '6px', color: '#0ea5e9', fontSize: '0.7rem', cursor: 'pointer', padding: '4px 6px' }}>
                         {q.status === 'waiting' ? '▶' : '✓'}
                       </button>
                     </motion.div>
                   )
                 })}
               </AnimatePresence>
             </div>
          </div>

          {/* Bed Map */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bed Infrastructure Node</p>
               <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px' }}>
                  {['General', 'ICU', 'Paediatric'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: activeTab === tab ? 600 : 500,
                      background: activeTab === tab ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                      color: activeTab === tab ? '#0ea5e9' : 'var(--text-muted)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      {tab}
                    </button>
                  ))}
               </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
               <AnimatePresence mode="popLayout">
                 {filteredBeds.map((bed) => {
                   const c = getBedColor(bed.status);
                   return (
                     <motion.div 
                       layout
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                       key={bed.id} 
                       style={{
                         padding: '1.2rem',
                         background: 'var(--surf2)',
                         border: `1px solid ${c.border}`,
                         borderRadius: '12px',
                         display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                         cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
                       }}
                       onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                       onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                       onClick={() => {
                         const next = bed.status === 'available' ? 'occupied' : bed.status === 'occupied' ? 'cleaning' : 'available';
                         updateBedStatus(bed.id, next);
                       }}
                     >
                       <span className="monospace" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{bed.displayId}</span>
                       <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: c.text }}>{bed.status}</span>
                       {bed.patient && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>{bed.patient}</span>}
                     </motion.div>
                   )
                 })}
               </AnimatePresence>
             </div>

             {/* Legend */}
             <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
               {[
                 { label: 'Available', dot: '#10b981' }, { label: 'Occupied', dot: '#ef4444' },
                 { label: 'Cleaning', dot: '#eab308' }, { label: 'Maintenance', dot: '#94a3b8' }
               ].map(l => (
                 <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.dot }} />
                   {l.label}
                 </div>
               ))}
             </div>

          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .flash-red { animation: flashRedBorder 1.5s infinite alternate; }
        @keyframes flashRedBorder {
          0% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 rgba(239,68,68,0); }
          100% { border-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 20px rgba(239,68,68,0.4); }
        }
        .queue-row:hover { background: var(--surf2) !important; filter: brightness(1.1); }
      `}} />
    </div>
  );
}

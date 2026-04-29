import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, Clock, Users, QrCode, LogOut, CheckCircle2, Activity, Loader2 } from 'lucide-react';
import { BASE_URL } from '../api';
import { io } from 'socket.io-client';

export default function TokenCard({ storedToken, onLeave }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchStatus = async (showToast = false) => {
    try {
      const res = await fetch(`${BASE_URL}/api/patient/${storedToken}`, {
        headers: {
          'Authorization': 'Bearer bypass',
          'Content-Type': 'application/json'
        }
      });
      const resData = await res.json();
      if (resData.error) setError(resData.error);
      else {
         setData(resData);
         if (showToast) {
            setToast('Queue position updated');
            setTimeout(() => setToast(''), 3000);
         }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storedToken) return;
    fetchStatus();

    const socket = io(BASE_URL);
    socket.on('queue:update', () => fetchStatus(true));
    socket.on('queueUpdate', () => fetchStatus(true));

    return () => socket.disconnect();
  }, [storedToken]);

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}><Loader2 className="spin-ico" /> Loading token data...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-danger)', textAlign: 'center', padding: '3rem' }}>{error || 'Invalid Token'}</div>;

  const getStatusColor = (st) => {
     if (st === 'in_progress') return { l: 'In Progress', status: 'active' };
     if (st === 'completed') return { l: 'Completed', status: 'done' };
     if (st === 'called') return { l: 'Called', status: 'active' };
     return { l: 'Waiting', status: 'pending' };
  };

  const status = getStatusColor(data.status);
  
  // Steps determination
  const isRegistered = true;
  const isWaiting = data.status === 'waiting' || data.status === 'called' || data.status === 'in_progress' || data.status === 'completed';
  const isCalled = data.status === 'called' || data.status === 'in_progress' || data.status === 'completed';
  const isInProgress = data.status === 'in_progress' || data.status === 'completed';
  const isCompleted = data.status === 'completed';

  return (
    <div style={{ maxWidth: '450px', margin: '0 auto', position: 'relative' }} id="token-print-area">
      
      <AnimatePresence>
         {toast && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ position: 'absolute', top: '-60px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid var(--status-success)', padding: '8px 16px', borderRadius: 'var(--radius-full)', color: 'var(--status-success)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                 <Activity size={16} /> {toast}
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel token-card flex-col" style={{ padding: '0', overflow: 'hidden' }}>
         
         {/* Token Hero Section */}
         <div className="token-hero">
            <div className="section-tag mb-0">Electronic Queue Token</div>
            
            <div className="token-ring">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-overlay)" strokeWidth="6" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" stroke="var(--accent-primary)" strokeWidth="6" 
                  strokeDasharray={`${283 * (100 - (data.position * 10)) / 100} 283`}
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{ strokeDasharray: `${283 * (100 - (data.position * 10)) / 100} 283` }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="token-ring-center">
                <div className="token-number">{data.token || data.token_number || storedToken}</div>
              </div>
            </div>

            <div className="queue-position-pill">
              #{data.queuePosition || data.position || '—'} in queue
            </div>

            <div className="text-center mt-4">
               <h2 className="text-xl" style={{ color: 'var(--text-primary)' }}>{data.fullName || data.patient_name || 'Patient'}</h2>
               <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{data.department || 'Outpatient Department'}</p>
            </div>
         </div>

         {/* Wait Time Bar */}
         <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex-between mb-2">
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Clock size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Estimated Wait</span>
               </div>
               <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>~{data.estimatedWaitMins || data.estimatedWaitTime || '0'}m</span>
            </div>
         </div>

         {/* Progress Steps */}
         <div style={{ padding: 'var(--space-6)' }}>
            <div className="progress-container">
               
               <div className="progress-step">
                 <div className={`step-icon ${isRegistered ? 'done' : 'pending'}`}>✓</div>
                 <div className="step-content">
                   <span className="step-title">Registered</span>
                   <span className="step-sub">Registration completed</span>
                 </div>
               </div>

               <div className="progress-step">
                 <div className={`step-icon ${isWaiting ? (status.status === 'pending' ? 'active' : 'done') : 'pending'}`}>2</div>
                 <div className="step-content">
                   <span className="step-title">Waiting Area</span>
                   <span className={`step-sub ${status.status === 'pending' ? 'active' : ''}`}>Currently in queue</span>
                 </div>
               </div>

               <div className="progress-step">
                 <div className={`step-icon ${isCalled ? (status.status === 'active' ? 'active' : 'done') : 'pending'}`}>3</div>
                 <div className="step-content">
                   <span className="step-title">Consultation</span>
                   <span className={`step-sub ${status.status === 'active' ? 'active' : ''}`}>Doctor is ready</span>
                 </div>
               </div>

               <div className="progress-step">
                 <div className={`step-icon ${isCompleted ? 'done' : 'pending'}`}>✓</div>
                 <div className="step-content">
                   <span className="step-title">Completed</span>
                   <span className="step-sub">Visit finished</span>
                 </div>
               </div>

            </div>
         </div>

         <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 var(--space-6)' }}>
             <div style={{ padding: '10px', background: '#fff', borderRadius: 'var(--radius-md)' }}>
                 <QrCode size={100} color="#000" />
             </div>
         </div>

      </motion.div>

      <div className="print-hide flex-col gap-4 mt-6">
         <div className="flex-between gap-4">
            <button onClick={() => window.print()} className="btn-secondary" style={{ flex: 1, padding: '14px' }}>
              <Printer size={18} /> Print Token
            </button>
            <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1, padding: '14px' }}>
              <Download size={18} /> Save
            </button>
         </div>
         <button onClick={onLeave} className="btn-danger flex-between" style={{ justifyContent: 'center', background: 'transparent' }}>
            <LogOut size={16} /> Discard Token
         </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; background: #fff !important; }
          #root { background: #fff !important; }
          #token-print-area, #token-print-area * { visibility: visible; color: #000 !important; text-shadow: none !important; }
          #token-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          .print-hide { display: none !important; }
          .token-card { background: #fff !important; border: 2px solid #000 !important; box-shadow: none !important; }
        }
        .spin-ico { animation: spin 1s linear infinite; display: inline-block; }
      `}} />

    </div>
  );
}

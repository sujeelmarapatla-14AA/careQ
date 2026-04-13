import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Printer, Activity } from 'lucide-react';
import { io } from 'socket.io-client';
import { BASE_URL, apiFetch } from '../api';

export default function PatientDashboard() {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ avgWaitMins: 0, patientsToday: 0 });

  const storedToken = localStorage.getItem('careq_queue_token');

  useEffect(() => {
    // 1. Fetch Global Stats for Ticker
    fetch(`${BASE_URL}/api/stats`).then(r=>r.json()).then(d => { if(!d.error) setStats(d); }).catch(()=>{});
    const statIntv = setInterval(() => {
      fetch(`${BASE_URL}/api/stats`).then(r=>r.json()).then(d => { if(!d.error) setStats(d); }).catch(()=>{});
    }, 30000);

    // 2. Fetch specific token logic
    if (!storedToken) { setLoading(false); return; }

    const fetchStatus = async () => {
      try {
        // use unprotected route we just created
        const res = await fetch(`${BASE_URL}/api/patient/${storedToken}`);
        const data = await res.json();
        if (data.error) setError(data.error);
        else setTokenData(data);
      } catch {
        setError('Could not reach server.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Polling every 30s as requested
    const pullIntv = setInterval(fetchStatus, 30000);

    // Live updates via Socket.io
    const socket = io(BASE_URL);
    socket.on('queueUpdate', () => fetchStatus());
    
    return () => { 
      clearInterval(statIntv); 
      clearInterval(pullIntv); 
      socket.disconnect(); 
    };
  }, [storedToken]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  if (loading) return <div className="container" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="page-enter container" style={{ padding: '2rem', maxWidth: '1100px', minHeight: '80vh' }}>
      
      {!storedToken || error ? (
        <div style={{ maxWidth: '600px', margin: '0 auto', marginTop: '5vh' }}>
           <RegisterForm onRegistered={(token) => { localStorage.setItem('careq_queue_token', token); window.location.reload(); }} />
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '5vh' }}>
          <div className="glass-panel" style={{ padding: '36px', borderTop: '2px solid var(--cyan)', boxShadow: '0 -4px 20px rgba(14,165,233,0.2), 0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }} id="token-print-area">
             
             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Official Routing Node</p>
             <div className="monospace token-display" style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--cyan)', lineHeight: 1, letterSpacing: '-2px', marginBottom: '1rem', textShadow: '0 0 30px rgba(14,165,233,0.4)' }}>
               {tokenData?.token_number || storedToken}
             </div>
             
             <h2 style={{ color: 'var(--text-main)', fontSize: '1.4rem', marginBottom: '2rem' }}>{tokenData?.patient_name}</h2>
             
             <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success-green)', borderRadius: '30px', fontWeight: 600 }}>
                  Queue Position #{tokenData?.position || '—'}
                </div>
                <div style={{ padding: '8px 20px', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: 'var(--cyan)', borderRadius: '30px', fontWeight: 600 }}>
                  ~{tokenData?.estimatedWaitMins || '0'} min estimated wait
                </div>
             </div>

             <div className="print-hide" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                  <Activity size={18} /> Check My Status
                </button>
                <button onClick={() => window.print()} style={{ padding: '12px 24px', background: 'var(--cyan)', border: 'none', color: '#fff', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 8px 20px rgba(14,165,233,0.3)' }}>
                  <Printer size={18} /> Print Token
                </button>
             </div>
             
             <div className="print-hide" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <button onClick={() => { localStorage.removeItem('careq_queue_token'); window.location.reload(); }} style={{ background: 'none', border: 'none', color: 'var(--urgent-red)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>Leave Queue System</button>
             </div>
          </div>
        </motion.div>
      )}

      {/* LIVE MARQUEE */}
      <div style={{ maxWidth: '600px', margin: '3rem auto 0', overflow: 'hidden', padding: '12px', background: 'var(--surf2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
         <div className="marquee-content" style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            <span>Currently parsing {stats.patientsToday} routing nodes today</span>
            <span>•</span>
            <span>Est Network Avg wait: <strong style={{color: 'var(--cyan)'}}>{stats.avgWaitMins}m</strong></span>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .marquee-content {
          animation: scrollMarquee 15s linear infinite;
        }
        @keyframes scrollMarquee { 
          0% { transform: translateX(100%); } 
          100% { transform: translateX(-100%); } 
        }
        @media print {
          body * { visibility: hidden; background: #fff !important; }
          #root { background: #fff !important; }
          #token-print-area, #token-print-area * { visibility: visible; color: #000 !important; text-shadow: none !important; }
          #token-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          .print-hide { display: none !important; }
        }
      `}} />
    </div>
  );
}

// Inline registration form shown when patient has no token
function RegisterForm({ onRegistered }) {
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('');
  const [severity, setSeverity] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sevColor = severity >= 80 ? 'var(--urgent-red)' : severity >= 60 ? 'var(--amber)' : 'var(--teal)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name.');
    setLoading(true);
    try {
      const { apiFetch } = await import('../api');
      // For creating a token, Patient Portal actually needs to bypass auth in our current system if unregistered, 
      // but earlier we said we won't change auth. Actually, apiFetch checks token. Let's send raw fetch.
      // Wait, POST /api/queue/register expects 'authenticate' middleware!
      const res = await fetch(BASE_URL + '/api/queue/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('careq_token') || 'bypass'
        },
        body: JSON.stringify({ patient_name: name, condition, severity }),
      });
      const data = await res.json();
      
      if (data.token) onRegistered(data.token);
      else setError(data.error || 'Registration failed. (Ensure Staff Auth is bypassed or test mode active).');
    } catch {
      setError('Server offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '36px', borderTop: '2px solid var(--cyan)', boxShadow: '0 -4px 20px rgba(14,165,233,0.2)' }}>
      <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Register for Queue</h2>
      {error && <p style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
          style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: '0.3s' }} 
          onFocus={e=>e.target.style.borderColor='var(--cyan)'} onBlur={e=>e.target.style.borderColor='var(--glass-border)'}
        />
        <input value={condition} onChange={e => setCondition(e.target.value)} placeholder="Reason for visit (optional)"
          style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: '0.3s' }}
          onFocus={e=>e.target.style.borderColor='var(--cyan)'} onBlur={e=>e.target.style.borderColor='var(--glass-border)'}
        />
        
        <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
             <label style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Triage Severity</label>
             <div style={{ fontSize: '2rem', fontWeight: 800, color: sevColor, lineHeight: 1 }}>{severity}</div>
          </div>
          
          <input type="range" min="1" max="100" value={severity} onChange={e => setSeverity(Number(e.target.value))} className="styled-slider" style={{ '--slider-color': sevColor }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
             <span>Mild</span>
             <span>Moderate</span>
             <span>Critical</span>
          </div>
        </div>
        
        <button type="submit" disabled={loading}
          style={{ padding: '16px', background: 'linear-gradient(135deg, var(--cyan), #818cf8)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: '1rem', boxShadow: '0 10px 20px rgba(14,165,233,0.2)', transition: '0.3s' }}
          onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
          {loading ? 'Processing...' : 'Get My Token'}
        </button>
      </form>

      <style dangerouslySetInnerHTML={{__html: `
        .styled-slider {
          -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px;
          background: linear-gradient(90deg, var(--teal) 0%, var(--amber) 50%, var(--urgent-red) 100%);
          outline: none; opacity: 0.9; transition: opacity .2s;
        }
        .styled-slider:hover { opacity: 1; }
        .styled-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%;
          background: var(--slider-color); border: 3px solid #fff; cursor: pointer;
          box-shadow: 0 0 15px var(--slider-color); transition: 0.2s;
        }
        .styled-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
      `}} />
    </div>
  );
}

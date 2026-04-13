import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, LayoutDashboard, HeartPulse, CheckCircle, List, Grid, Brain } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { apiFetch } from '../api';

const CountUp = ({ end, duration = 1.2 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if(!end) return;
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

export default function Landing() {
  const [simQueue, setSimQueue] = useState([
    { id: 1, token: 'T-5421', sev: 85 },
    { id: 2, token: 'T-8123', sev: 60 }
  ]);
  const [simBeds, setSimBeds] = useState([
    { id: 1, name: 'ICU-B1', status: 'occupied' },
    { id: 2, name: 'General-B2', status: 'available' },
    { id: 3, name: 'General-B3', status: 'available' },
    { id: 4, name: 'Pediatrics-B1', status: 'occupied' }
  ]);
  
  const [stats, setStats] = useState({ patientsToday: 0, avgWaitMins: 0, bedsAvailable: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/stats');
        if (data && !data.error) setStats(data);
      } catch (e) {}
    };
    fetchStats();
    const stIntv = setInterval(fetchStats, 30000);
    
    // original hologram grid intervals
    const interval = setInterval(() => {
       setSimQueue(prev => {
          let n = [...prev];
          if(Math.random() > 0.4 && n.length < 5) {
             n.push({ id: Math.random(), token: 'T-'+Math.floor(1000 + Math.random()*9000), sev: Math.floor(Math.random()*100) });
             n.sort((a,b) => b.sev - a.sev);
          } else if(n.length > 2 && Math.random() > 0.5) { 
             n.shift(); 
          }
          return n;
       });
       setSimBeds(prev => prev.map(b => ({
           ...b, 
           status: Math.random() > 0.85 ? (b.status === 'available' ? 'occupied' : 'available') : b.status 
       })));
    }, 2800);
    
    return () => { clearInterval(interval); clearInterval(stIntv); };
  }, []);

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };
  
  const lineAnim = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } };

  return (
    <div className="page-enter" style={{ overflowX: 'hidden', position: 'relative' }}>
      
      {/* Mesh Grid Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -2, pointerEvents: 'none', background: 'var(--bg)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.07, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #fff 39px, #fff 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #fff 39px, #fff 40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)', opacity: 0.08, filter: 'blur(40px)' }} />
      </div>

      {/* HERO SECTION */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: '5vh' }}>
         <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 1fr)', gap: '4rem', alignItems: 'center' }}>
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ zIndex: 2 }}>
               
               <motion.div variants={lineAnim} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(14, 165, 233, 0.1)', padding: '6px 16px', borderRadius: '30px', border: '1px solid var(--primary-blue)', marginBottom: '1.5rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                 <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)' }} />
                 Beta Network Online
               </motion.div>
               
               <motion.h1 className="title-gradient" style={{ fontSize: 'CLAMP(3rem, 5vw, 4.5rem)', lineHeight: '1.1', letterSpacing: '-2px', marginBottom: '1.5rem', textShadow: '0 0 40px rgba(14, 165, 233, 0.3)' }}>
                 <motion.div variants={lineAnim}>End Waiting Chaos.</motion.div>
                 <motion.div variants={lineAnim}>Enter Smart Healthcare Flow.</motion.div>
               </motion.h1>
               
               <motion.p variants={lineAnim} style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginBottom: '3rem', lineHeight: '1.6', maxWidth: '600px' }}>
                 An intelligent, 3D-mapped medical command matrix. Extreme AI-driven triage meets fully synchronized real-time infrastructure mapping, directly on your screen.
               </motion.p>
               
               <motion.div variants={lineAnim} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '3rem' }}>
                  <Link to="/patient"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-green" style={{ padding: '16px 36px', fontSize: '1.1rem', letterSpacing: '1px' }}>Initiate Patient Node</motion.button></Link>
                  <Link to="/login"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" style={{ padding: '16px 36px', fontSize: '1.1rem', background: 'var(--surface-color)', backdropFilter: 'blur(10px)' }}>Access Staff Gateway</motion.button></Link>
               </motion.div>

               {/* Live Stats Bar */}
               <motion.div variants={lineAnim} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                 <div className="stat-pill">
                    <span className="stat-num"><CountUp end={stats.patientsToday} /></span> Patients Served Today
                 </div>
                 <div className="stat-dot" />
                 <div className="stat-pill">
                    <span className="stat-num"><CountUp end={stats.avgWaitMins} />m</span> Avg Wait Time
                 </div>
                 <div className="stat-dot" />
                 <div className="stat-pill">
                    <span className="stat-num"><CountUp end={stats.bedsAvailable} /></span> Beds Available
                 </div>
               </motion.div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} style={{ position: 'relative', zIndex: 1 }}>
               <div className="or-card-wrap">
                 <img src="/team.jpg" alt="Medical Team Sync" style={{ width: '100%', display: 'block' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; }}
                 />
                 <div className="or-shimmer" />
                 <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 }} style={{ position: 'absolute', bottom: '20px', right: '-20px', background: 'rgba(16,185,129,0.95)', padding: '12px 24px', borderRadius: '30px', fontWeight: '800', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
                   All Systems Nominal
                 </motion.div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* NEW FEATURE CARDS ROW */}
      <section className="container" style={{ padding: '0 2rem 10vh' }}>
         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="feature-card">
              <div className="fc-icon" style={{ color: 'var(--cyan)' }}><List size={32} /></div>
              <h3>Real-Time Queue</h3>
              <p>Watch synchronized waiting matrices update dynamically as throughput proceeds.</p>
            </div>
            <div className="feature-card">
              <div className="fc-icon" style={{ color: 'var(--teal)' }}><Grid size={32} /></div>
              <h3>Smart Bed Routing</h3>
              <p>Locate, clean, and assign physical infrastructure nodes instantaneously.</p>
            </div>
            <div className="feature-card">
              <div className="fc-icon" style={{ color: '#8b5cf6' }}><Brain size={32} /></div>
              <h3>AI Triage Insights</h3>
              <p>Machine learning sorts complex medical vectors flawlessly before human intervention.</p>
            </div>
         </motion.div>
      </section>

      {/* SIMULATION SECTION */}
      <section style={{ background: 'var(--surf)', padding: '12vh 0' }}>
        <motion.div className="container" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
           <motion.h2 variants={lineAnim} className="title-gradient" style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>Hologrid Live Simulation</motion.h2>
           <motion.p variants={lineAnim} style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '4rem', fontSize: '1.1rem' }}>Visually monitoring internal logic loops. Zero manual interaction required.</motion.p>
           
           <div className="dashboard-grid">
              <motion.div whileHover={{ scale: 1.01 }} className="glass-panel" style={{ padding: '2.5rem', background: 'var(--surf2)' }}>
                 <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Network Queue Nodes</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {simQueue.map((q) => (
                       <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', transition: 'all 0.5s', borderLeft: q.sev > 80 ? '6px solid var(--urgent-red)' : '6px solid var(--primary-blue)' }}>
                          <strong className="monospace" style={{color: 'var(--text-main)', fontSize: '1.2rem'}}>{q.token}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>Risk: <strong style={{color: q.sev>80?'var(--urgent-red)':'var(--text-main)'}}>{q.sev}</strong></span>
                       </div>
                    ))}
                 </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} className="glass-panel" style={{ padding: '2.5rem', background: 'var(--surf2)' }}>
                 <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Infrastructure Hardware</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                    {simBeds.map(b => (
                       <div key={b.id} style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center', transition: 'all 0.5s', background: b.status === 'available' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${b.status === 'available' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`}}>
                          <h4 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>{b.name}</h4>
                          <div style={{ color: b.status==='available' ? 'var(--success-green)' : 'var(--urgent-red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>{b.status}</div>
                       </div>
                    ))}
                 </div>
              </motion.div>
           </div>
        </motion.div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .pulse-dot {
          animation: pulseGrid 2s infinite ease-out;
        }
        @keyframes pulseGrid {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          50% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .or-card-wrap {
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          border: 1px solid var(--glass-border);
        }
        .or-shimmer {
          position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(20deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-20deg); transition: 0.5s; pointer-events: none;
        }
        .or-card-wrap:hover .or-shimmer {
          left: 150%;
        }
        .stat-pill {
          background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); fontSize: 0.95rem;
          display: flex; align-items: baseline; gap: 8px;
        }
        .stat-num { color: var(--text-main); font-weight: 700; font-size: 1.2rem; }
        .stat-dot { width: 4px; height: 4px; background: var(--glass-border); border-radius: 50%; }
        
        .feature-card {
          background: var(--surf2); border: 1px solid var(--glass-border); border-radius: 16px;
          padding: 2rem; display: flex; flex-direction: column; gap: 1rem;
          height: 200px; transition: all 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.2);
        }
        .fc-icon { padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.2); display: inline-flex; width: fit-content; }
        .feature-card h3 { color: var(--text-main); font-size: 1.25rem; }
        .feature-card p { color: var(--text-muted); line-height: 1.5; font-size: 0.95rem; }
      `}} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    patientsToday: 0, bedOccupancyPct: 0, occupiedBeds: 0, totalBeds: 0,
    avgWaitMinutes: 0, emergencies: 0, totalWaiting: 0,
  });

  useEffect(() => {
    const load = async () => {
      const data = await apiFetch('/api/dashboard/metrics');
      if (data && !data.error) setMetrics(data);
    };
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1400px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '0.3rem' }}>Admin Command Centre</p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Hospital-wide overview & AI insights</h1>
      </header>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Patients Today</p>
            <div style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}>{metrics.patientsToday}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>registered today</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Beds Occupied</p>
            <div style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}>{metrics.bedOccupancyPct}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>%</span></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>{metrics.occupiedBeds} of {metrics.totalBeds} beds</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Avg Wait Time</p>
            <div style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}>{metrics.avgWaitMinutes}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>m</span></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>estimated</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Emergencies Flagged</p>
            <div style={{ fontSize: '3rem', fontWeight: 600, color: metrics.emergencies > 0 ? 'var(--urgent-red)' : 'var(--text-main)', lineHeight: 1 }}>{metrics.emergencies}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>Active right now</p>
          </motion.div>

        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(500px, 2fr)', gap: '1.5rem' }}>
          
          {/* Real-time Capacity */}
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.5rem' }}>Real-time Capacity</p>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {/* Donut Chart Simulation */}
              <div style={{ position: 'relative', width: '180px', height: '180px', marginBottom: '2rem' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  {/* Progress (68%) */}
                  <motion.circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient)" strokeWidth="12"
                    strokeDasharray="251.2" strokeDashoffset="251.2"
                    animate={{ strokeDashoffset: 251.2 - (251.2 * (metrics.bedOccupancyPct / 100)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}>{metrics.bedOccupancyPct}%</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>occupied</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'General', percent: 72, color: '#ef4444' },
                  { label: 'ICU', percent: 95, color: '#ef4444' },
                  { label: 'Paediatric', percent: 40, color: '#10b981' }
                ].map(dept => (
                  <div key={dept.label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 30px', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dept.label}</span>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${dept.percent}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: dept.color, borderRadius: '3px' }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>{dept.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 12-Hour Forecast */}
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>12-Hour Bed Occupancy Forecast</p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }}/> Actual</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.3)' }}/> Projected</span>
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', paddingTop: '20px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              {/* 90% Danger Line */}
              <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, borderTop: '1px dashed #ef4444', opacity: 0.5 }}>
                 <span style={{ position: 'absolute', top: '-18px', right: 0, color: '#ef4444', fontSize: '0.75rem' }}>90% danger</span>
              </div>
              
              <div style={{ position: 'absolute', bottom: '25px', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>

              {/* Bar Chart Data */}
              {[
                { time: '8A', val: 50, act: true }, { time: '9A', val: 55, act: true }, { time: '10A', val: 58, act: true },
                { time: '11A', val: 62, act: true }, { time: '12P', val: 68, act: true }, { time: '1P', val: 68, act: true },
                { time: '2P', val: 72, act: false }, { time: '3P', val: 75, act: false }, { time: '4P', val: 82, act: false },
                { time: '5P', val: 88, act: false }, { time: '6P', val: 92, act: false }, { time: '7P', val: 95, act: false }
              ].map((point, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', padding: '0 4px', zIndex: 1, position: 'relative' }}>
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: `${point.val}%` }} 
                      transition={{ duration: 0.8, delay: idx * 0.05 }}
                      style={{ 
                        width: '100%', 
                        background: point.act ? '#0ea5e9' : (point.val >= 90 ? '#b45309' : 'rgba(14, 165, 233, 0.3)'),
                        opacity: point.act ? 1 : 0.8,
                        borderTopLeftRadius: '4px', borderTopRightRadius: '4px',
                        borderTop: !point.act ? '2px dashed rgba(255,255,255,0.3)' : 'none'
                      }} 
                    />
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '10px', height: '15px' }}>{point.time}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>AI Resource Recommendations</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
             
             <motion.div variants={itemVariants} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
               <div style={{ color: '#ef4444', marginTop: '2px' }}><AlertCircle size={20} /></div>
               <div>
                 <h4 style={{ color: '#f8fafc', marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>ICU reaching critical capacity</h4>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>Projected 95% occupancy by 3PM. Consider discharging 2 stable patients to free beds before peak hours.</p>
               </div>
             </motion.div>

             <motion.div variants={itemVariants} style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
               <div style={{ color: '#eab308', marginTop: '2px' }}><Clock size={20} /></div>
               <div>
                 <h4 style={{ color: '#f8fafc', marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>General ward rising</h4>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>Will exceed 80% by 6PM. Recommend redirecting non-urgent admissions to satellite facility.</p>
               </div>
             </motion.div>

             <motion.div variants={itemVariants} style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
               <div style={{ color: '#10b981', marginTop: '2px' }}><CheckCircle2 size={20} /></div>
               <div>
                 <h4 style={{ color: '#f8fafc', marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>Paediatric has capacity</h4>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>Running at 40%. Equipment reallocation recommended. Available for overflow from General Ward if needed.</p>
               </div>
             </motion.div>

          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default AdminDashboard;

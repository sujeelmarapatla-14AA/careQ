import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { apiFetch, BASE_URL } from '../api';
import BedAvailability from '../components/BedAvailability';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    patientsToday: 0, bedOccupancyPct: 0, occupiedBeds: 0, totalBeds: 0,
    avgWaitMinutes: 0, emergencies: 0, totalWaiting: 0, dischargedToday: 0,
    completedToday: 0, inProgressCount: 0, waitingCount: 0,
    wardOccupancy: [
      { label: 'General', percent: 0, class: 'low' },
      { label: 'ICU', percent: 0, class: 'low' },
      { label: 'Paediatric', percent: 0, class: 'low' }
    ],
    patientFlowForecast: { labels: ['8A', '9A', '10A', '11A', '12P', '1P', '2P', '3P', '4P', '5P', '6P', '7P'], data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  });
  const [logs, setLogs] = useState([{ msg: `System initialized. Admin portal connected.`, time: new Date(), color: 'cyan' }]);
  const [analytics, setAnalytics] = useState({
    hourlyPatients: new Array(24).fill(0),
    deptLoad: {},
    visitTypeBreakdown: { 'Walk-in': 0, 'Appointment': 0, 'Emergency': 0, 'Follow-up': 0 }
  });
  const [hospitalInfo, setHospitalInfo] = useState({ name: 'Arundati Hospital', tokenPrefix: 'A' });

  useEffect(() => {
    const load = async () => {
      const data = await apiFetch('/api/dashboard/metrics');
      if (data && !data.error) setMetrics(data);
      
      const hospData = await apiFetch('/api/hospital/info');
      if (hospData && !hospData.error) setHospitalInfo(hospData);
    };
    load();
    const interval = setInterval(load, 15000); 

    const socket = io(BASE_URL);
    socket.emit('join:admin');
    
    const addLog = (msg, color = 'cyan') => {
      setLogs(prev => [{ msg, time: new Date(), color }, ...prev].slice(0, 20));
    };
    
    socket.on('patient:new', (data) => { 
      load();
      addLog(`👤 New patient: ${data.patient_name || data.fullName} — Token ${data.token} | ${data.department}`, 'cyan');
    });
    
    socket.on('patient:registered', (data) => {
      addLog(`👤 ${data.name} registered — Token ${data.token} | ${data.department} | Severity: ${data.severity}`, 'cyan');
    });
    
    socket.on('queue:statusChanged', (data) => {
      load();
      const colors = { 'Completed': 'green', 'In Progress': 'blue', 'Called': 'amber', 'Waiting': 'cyan' };
      addLog(`✅ ${data.staffName} marked ${data.patientName} as ${data.newStatus} (was ${data.oldStatus})`, colors[data.newStatus] || 'cyan');
    });
    
    socket.on('queueUpdate', () => load());
    socket.on('queue:update', () => load());
    
    socket.on('bed:assigned', (data) => {
      load();
      addLog(`🛏 ${data.assignedBy} assigned Bed ${data.bedId} to ${data.patientName} (${data.patientToken}) — ${data.ward}`, 'amber');
    });
    
    socket.on('bed:released', (data) => {
      load();
      addLog(`🔓 ${data.releasedBy} released Bed ${data.bedId} — ${data.patientName} discharged — ${data.ward}`, 'green');
    });
    
    socket.on('bed:transferred', (data) => {
      load();
      addLog(`🔄 ${data.transferredBy} transferred ${data.patientName} from ${data.fromBedId} to ${data.toBedId} — ${data.fromWard} → ${data.toWard}`, 'blue');
    });
    
    socket.on('bed:maintenance', (data) => {
      load();
      addLog(`🔧 ${data.markedBy} marked Bed ${data.bedId} for maintenance — ${data.ward}`, 'amber');
    });
    
    socket.on('bed:update', () => load());
    socket.on('bedsUpdate', () => load());
    
    socket.on('activity:log', (entry) => {
      addLog(entry.message, entry.color || 'cyan');
    });
    
    socket.on('stats:update', (stats) => {
      setMetrics(prev => ({ ...prev, ...stats }));
    });
    
    socket.on('analytics:update', (data) => {
      setAnalytics(data);
    });
    
    socket.on('hospital:updated', (data) => {
      setHospitalInfo(data);
      addLog(`⚙️ Hospital information updated`, 'purple');
    });

    return () => {
        clearInterval(interval);
        socket.disconnect();
    };
  }, []);

  return (
    <div className="container">
      <header className="flex-between mb-6">
        <div>
          <div className="section-tag">Admin Command Centre</div>
          <h1 className="text-2xl" style={{ color: 'var(--text-primary)' }}>{hospitalInfo.name || 'Hospital'} — Live Overview</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>Token Prefix</div>
          <div className="text-2xl font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>{hospitalInfo.tokenPrefix || 'A'}</div>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-label">Patients Today</span>
          <div className="stat-value">{metrics.patientsToday}</div>
          <span className="stat-sub">registered today</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Waiting</span>
          <div className="stat-value warning">{metrics.waitingCount || metrics.totalWaiting || 0}</div>
          <span className="stat-sub">in queue now</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Progress</span>
          <div className="stat-value accent">{metrics.inProgressCount || 0}</div>
          <span className="stat-sub">being treated</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <div className="stat-value success">{metrics.completedToday || 0}</div>
          <span className="stat-sub">finished today</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Beds Occupied</span>
          <div className="stat-value">{metrics.bedOccupancyPct}<span className="text-lg" style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>%</span></div>
          <span className="stat-sub">{metrics.occupiedBeds} of {metrics.totalBeds} beds</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Wait Time</span>
          <div className="stat-value">{metrics.avgWaitMinutes}<span className="text-lg" style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>m</span></div>
          <span className="stat-sub">estimated</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Emergencies</span>
          <div className={`stat-value ${metrics.emergencies > 0 ? 'danger' : ''}`}>{metrics.emergencies}</div>
          <span className="stat-sub">active now</span>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid-2 mb-6">
        
        {/* Real-time Capacity Ring */}
        <div className="glass-panel flex-col">
          <div className="section-tag">Real-time Capacity</div>
          
          <div className="capacity-ring-container flex-col" style={{ flex: 1, justifyContent: 'center' }}>
            <div className="token-ring" style={{ width: '160px', height: '160px', margin: '0 auto' }}>
              <Doughnut 
                data={{
                  labels: ['Occupied', 'Available'],
                  datasets: [{
                    data: [metrics.bedOccupancyPct, 100 - metrics.bedOccupancyPct],
                    backgroundColor: ['#EF4444', '#22C55E'],
                    borderWidth: 0,
                  }]
                }}
                options={{ cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: true } } }}
              />
              <div className="token-ring-center">
                <div className="ring-percent">{metrics.bedOccupancyPct}%</div>
                <div className="ring-sublabel">occupied</div>
              </div>
            </div>

            <div style={{ width: '100%', marginTop: 'var(--space-6)' }}>
              {metrics.wardOccupancy && metrics.wardOccupancy.map(dept => (
                <div className="ward-row" key={dept.label}>
                  <div className="ward-name">{dept.label}</div>
                  <div className="ward-bar-track">
                    <div className={`ward-bar-fill ${dept.class}`} style={{ width: `${dept.percent}%` }}></div>
                  </div>
                  <div className="ward-pct">{dept.percent}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="glass-panel flex-col">
          <div className="section-tag">Patient Flow Forecast</div>
          <div className="chart-container" style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
            <Bar 
               data={{
                 labels: metrics.patientFlowForecast?.labels || ['8A', '9A', '10A', '11A', '12P', '1P', '2P', '3P', '4P', '5P', '6P', '7P'],
                 datasets: [{
                   label: 'Occupancy %',
                   data: metrics.patientFlowForecast?.data || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   backgroundColor: (context) => {
                     const val = context.raw;
                     return context.dataIndex < 6 ? '#2D7EF8' : (val >= 90 ? '#EF4444' : 'rgba(45, 126, 248, 0.3)');
                   },
                   borderRadius: 4
                 }]
               }}
               options={{ 
                 responsive: true, maintainAspectRatio: false,
                 scales: { 
                   y: { max: 100, border: { dash: [4, 4] }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#A1A1AA' } }, 
                   x: { grid: { display: false }, ticks: { color: '#A1A1AA' } } 
                 }, 
                 plugins: { legend: { display: false } } 
               }}
            />
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mb-6">
        <div className="section-tag">AI Resource Recommendations</div>
        <div className="ai-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
           
           <motion.div className="ai-card critical">
             <div className="ai-card-icon" style={{ color: 'var(--status-danger)' }}><AlertCircle size={20} /></div>
             <div className="ai-card-content">
               <div className="ai-card-title">ICU reaching critical capacity</div>
               <div className="ai-card-body">Projected 95% occupancy by 3PM. Consider discharging 2 stable patients to free beds before peak hours.</div>
             </div>
           </motion.div>

           <motion.div className="ai-card warning">
             <div className="ai-card-icon" style={{ color: 'var(--status-warning)' }}><Clock size={20} /></div>
             <div className="ai-card-content">
               <div className="ai-card-title">General ward rising</div>
               <div className="ai-card-body">Will exceed 80% by 6PM. Recommend redirecting non-urgent admissions to satellite facility.</div>
             </div>
           </motion.div>

           <motion.div className="ai-card success">
             <div className="ai-card-icon" style={{ color: 'var(--status-success)' }}><CheckCircle2 size={20} /></div>
             <div className="ai-card-content">
               <div className="ai-card-title">Paediatric has capacity</div>
               <div className="ai-card-body">Running at 40%. Equipment reallocation recommended. Available for overflow from General Ward if needed.</div>
             </div>
           </motion.div>

        </div>
      </div>

      {/* Global Bed Management & Action Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 'var(--space-6)', alignItems: 'start' }}>
         <div style={{ flex: 1, minWidth: 0 }}>
            <div className="section-tag">Multi-Hospital Registry & Bed Controls</div>
            <BedAvailability isAdmin={true} />
         </div>

         <div className="glass-panel" style={{ padding: 'var(--space-5)', position: 'sticky', top: 'var(--nav-height)', marginTop: '28px' }}>
            <h4 className="text-base" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '15px' }}>Live Action Log</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
               {logs.map((log, i) => {
                  const diffMins = Math.floor((new Date() - log.time) / 60000);
                  const tStr = diffMins < 1 ? 'Just now' : `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                  const borderColors = {
                    cyan: 'var(--accent-primary)',
                    green: 'var(--status-success)',
                    amber: 'var(--status-warning)',
                    blue: 'var(--accent-hover)',
                    purple: '#a855f7',
                    red: 'var(--status-danger)'
                  };
                  return (
                    <div key={i} style={{ paddingLeft: '10px', borderLeft: `2px solid ${borderColors[log.color] || 'var(--accent-primary)'}` }}>
                       <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tStr}</div>
                       <div className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.msg}</div>
                    </div>
                  )
               })}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

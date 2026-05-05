import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2, WifiOff, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { apiFetch, BASE_URL } from '../api';
import BedAvailability from '../components/BedAvailability';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const DEFAULT_METRICS = {
  patientsToday: 0, bedOccupancyPct: 0, occupiedBeds: 0, totalBeds: 0,
  avgWaitMinutes: 0, emergencies: 0, totalWaiting: 0, dischargedToday: 0,
  completedToday: 0, inProgressCount: 0, waitingCount: 0,
  wardOccupancy: [
    { label: 'General',    percent: 0, class: 'low' },
    { label: 'ICU',        percent: 0, class: 'low' },
    { label: 'Paediatric', percent: 0, class: 'low' },
  ],
  patientFlowForecast: {
    labels: ['8A','9A','10A','11A','12P','1P','2P','3P','4P','5P','6P','7P'],
    data:   [0,0,0,0,0,0,0,0,0,0,0,0],
  },
};

const AdminDashboard = () => {
  const [metrics, setMetrics]         = useState(DEFAULT_METRICS);
  const [hospitalInfo, setHospitalInfo] = useState({ name: 'Arundati Hospital', tokenPrefix: 'A' });
  const [logs, setLogs]               = useState([{ msg: 'System initialized. Admin portal connected.', time: new Date(), color: 'cyan' }]);
  const [backendOnline, setBackendOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retrying, setRetrying]       = useState(false);

  const addLog = useCallback((msg, color = 'cyan') => {
    setLogs(prev => [{ msg, time: new Date(), color }, ...prev].slice(0, 30));
  }, []);

  const load = useCallback(async () => {
    const data = await apiFetch('/api/dashboard/metrics');
    if (data && !data.error) {
      setMetrics(prev => ({ ...DEFAULT_METRICS, ...prev, ...data }));
      setBackendOnline(true);
      setLastUpdated(new Date());
    } else {
      setBackendOnline(false);
    }

    const hospData = await apiFetch('/api/hospital/info');
    if (hospData && !hospData.error) setHospitalInfo(hospData);
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await load();
    setRetrying(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);

    let socket;
    try {
      socket = io(BASE_URL, { timeout: 5000, reconnectionAttempts: 3 });

      socket.emit('join:admin');
      // Request fresh DB data immediately
      socket.emit('get:patients');
      socket.emit('get:beds');

      socket.on('connect', () => {
        setBackendOnline(true);
        addLog('🟢 Connected to live server', 'green');
      });

      socket.on('connect_error', () => {
        setBackendOnline(false);
      });

      socket.on('patient:new', (data) => {
        load();
        addLog(`👤 New patient: ${data.patient_name || data.fullName} — Token ${data.token} | ${data.department}`, 'cyan');
      });

      socket.on('patient:registered', (data) => {
        addLog(`👤 ${data.name} registered — Token ${data.token} | ${data.department}`, 'cyan');
      });

      socket.on('queue:statusChanged', (data) => {
        load();
        const colors = { Completed: 'green', 'In Progress': 'blue', Called: 'amber', Waiting: 'cyan' };
        addLog(`✅ ${data.staffName} marked ${data.patientName} as ${data.newStatus}`, colors[data.newStatus] || 'cyan');
      });

      socket.on('queueUpdate',  () => load());
      socket.on('queue:update', () => load());
      socket.on('bed:assigned', (data) => { load(); addLog(`🛏 ${data.assignedBy} assigned Bed ${data.bedId} to ${data.patientName}`, 'amber'); });
      socket.on('bed:released', (data) => { load(); addLog(`🔓 ${data.releasedBy} released Bed ${data.bedId}`, 'green'); });
      socket.on('bed:update',   () => load());
      socket.on('bedsUpdate',   () => load());

      socket.on('activity:log', (entry) => addLog(entry.message, entry.color || 'cyan'));

      socket.on('stats:update', (stats) => {
        setMetrics(prev => ({ ...prev, ...stats }));
        setBackendOnline(true);
        setLastUpdated(new Date());
      });

      socket.on('hospital:updated', (data) => {
        setHospitalInfo(data);
        addLog('⚙️ Hospital information updated', 'purple');
      });
    } catch (e) {
      setBackendOnline(false);
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [load, addLog]);

  const borderColors = {
    cyan: 'var(--accent-primary)', green: 'var(--status-success)',
    amber: 'var(--status-warning)', blue: 'var(--accent-hover)',
    purple: '#a855f7', red: 'var(--status-danger)',
  };

  return (
    <div className="container">

      {/* ── Header ── */}
      <header className="flex-between mb-6">
        <div>
          <div className="section-tag">Admin Command Centre</div>
          <h1 className="text-2xl" style={{ color: 'var(--text-primary)' }}>
            {hospitalInfo.name || 'Hospital'} — Live Overview
          </h1>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>Token Prefix</div>
          <div className="text-2xl font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>{hospitalInfo.tokenPrefix || 'A'}</div>
          {lastUpdated && (
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      {/* ── Backend offline banner ── */}
      {!backendOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid var(--status-danger)',
            borderRadius: 'var(--radius-md)', padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-danger)' }}>
            <WifiOff size={18} />
            <span style={{ fontWeight: 600 }}>Backend server is offline.</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Showing last known data. Deploy your backend to Railway/Render and set{' '}
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>VITE_API_URL</code>{' '}
              in Vercel.
            </span>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              background: 'rgba(239,68,68,0.2)', border: '1px solid var(--status-danger)',
              color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)',
              padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            <RefreshCw size={14} className={retrying ? 'spin-ico' : ''} />
            {retrying ? 'Retrying…' : 'Retry'}
          </button>
        </motion.div>
      )}

      {/* ── Metric Cards ── */}
      <div className="dashboard-grid">
        {[
          { label: 'Patients Today',  value: metrics.patientsToday,                        sub: 'registered today',  cls: '' },
          { label: 'Waiting',         value: metrics.waitingCount || metrics.totalWaiting,  sub: 'in queue now',      cls: 'warning' },
          { label: 'In Progress',     value: metrics.inProgressCount,                       sub: 'being treated',     cls: 'accent' },
          { label: 'Completed',       value: metrics.completedToday,                        sub: 'finished today',    cls: 'success' },
          { label: 'Beds Occupied',   value: `${metrics.bedOccupancyPct}%`,                 sub: `${metrics.occupiedBeds} of ${metrics.totalBeds} beds`, cls: '' },
          { label: 'Avg Wait Time',   value: `${metrics.avgWaitMinutes}m`,                  sub: 'estimated',         cls: '' },
          { label: 'Emergencies',     value: metrics.emergencies,                           sub: 'active now',        cls: metrics.emergencies > 0 ? 'danger' : '' },
        ].map(({ label, value, sub, cls }) => (
          <div className="stat-card" key={label}>
            <span className="stat-label">{label}</span>
            <div className={`stat-value ${cls}`}>{value}</div>
            <span className="stat-sub">{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid-2 mb-6">

        {/* Capacity Ring */}
        <div className="glass-panel flex-col">
          <div className="section-tag">Real-time Capacity</div>
          <div className="capacity-ring-container flex-col" style={{ flex: 1, justifyContent: 'center' }}>
            <div className="token-ring" style={{ width: '160px', height: '160px', margin: '0 auto' }}>
              <Doughnut
                data={{
                  labels: ['Occupied', 'Available'],
                  datasets: [{
                    data: [metrics.bedOccupancyPct, Math.max(0, 100 - metrics.bedOccupancyPct)],
                    backgroundColor: ['#EF4444', '#22C55E'],
                    borderWidth: 0,
                  }],
                }}
                options={{ cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: true } } }}
              />
              <div className="token-ring-center">
                <div className="ring-percent">{metrics.bedOccupancyPct}%</div>
                <div className="ring-sublabel">occupied</div>
              </div>
            </div>
            <div style={{ width: '100%', marginTop: 'var(--space-6)' }}>
              {(metrics.wardOccupancy || DEFAULT_METRICS.wardOccupancy).map(dept => (
                <div className="ward-row" key={dept.label}>
                  <div className="ward-name">{dept.label}</div>
                  <div className="ward-bar-track">
                    <div className={`ward-bar-fill ${dept.class}`} style={{ width: `${dept.percent}%` }} />
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
                labels: metrics.patientFlowForecast?.labels || DEFAULT_METRICS.patientFlowForecast.labels,
                datasets: [{
                  label: 'Occupancy %',
                  data: metrics.patientFlowForecast?.data || DEFAULT_METRICS.patientFlowForecast.data,
                  backgroundColor: (ctx) => {
                    const v = ctx.raw;
                    return ctx.dataIndex < 6 ? '#2D7EF8' : (v >= 90 ? '#EF4444' : 'rgba(45,126,248,0.3)');
                  },
                  borderRadius: 4,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                scales: {
                  y: { max: 100, border: { dash: [4,4] }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#A1A1AA' } },
                  x: { grid: { display: false }, ticks: { color: '#A1A1AA' } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
      </div>

      {/* ── AI Recommendations ── */}
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

      {/* ── Bed Management + Live Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div>
          <div className="section-tag">Multi-Hospital Registry &amp; Bed Controls</div>
          <BedAvailability isAdmin={true} />
        </div>

        <div className="glass-panel" style={{ padding: 'var(--space-5)', position: 'sticky', top: 'var(--nav-height)', marginTop: '28px' }}>
          <h4 className="text-base" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '15px' }}>
            Live Action Log
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
            {logs.map((log, i) => {
              const diffMins = Math.floor((new Date() - log.time) / 60000);
              const tStr = diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
              return (
                <div key={i} style={{ paddingLeft: '10px', borderLeft: `2px solid ${borderColors[log.color] || 'var(--accent-primary)'}` }}>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tStr}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.msg}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .spin-ico { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

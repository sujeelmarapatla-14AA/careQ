import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS } from 'chart.js';
import { BASE_URL } from '../api';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('careq-theme') || 'dark');
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('careq-theme', nextTheme);
    window.dispatchEvent(new Event('theme-change')); // Trigger chart updates if needed
    
    // Update Chart.js instances if they exist
    if (ChartJS && ChartJS.instances) {
      const isDark = nextTheme === 'dark';
      const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
      const labelColor = isDark ? '#94a3b8' : '#475569';
      const accentColor = isDark ? '#00d4ff' : '#0284c7';

      Object.values(ChartJS.instances).forEach(chart => {
        if (chart.options.scales) {
          Object.values(chart.options.scales).forEach(scale => {
            if (scale.grid) scale.grid.color = gridColor;
            if (scale.ticks) scale.ticks.color = labelColor;
          });
        }
        chart.update();
      });
    }
  };

  let loggedInUser = localStorage.getItem('careq_username');
  let userRole = localStorage.getItem('careq_role');
  if (loggedInUser === 'undefined' || loggedInUser === 'null') {
    loggedInUser = null;
    userRole = null;
  }

  const handleLogout = async () => {
    try {
        await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('careq_token');
    localStorage.removeItem('careq_username');
    localStorage.removeItem('careq_role');
    navigate('/login');
  };

  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'Patient Portal', path: '/patient' }
  ];
  
  const staffLinks = [
    { name: 'Dashboard', path: '/staff' }
  ];

  const adminLinks = [
    { name: 'Overview', path: '/admin' }
  ];

  let navLinks = publicLinks;
  if (userRole === 'admin') navLinks = adminLinks;
  else if (userRole === 'staff') navLinks = staffLinks;
  else if (loggedInUser) navLinks = [{ name: 'Home', path: '/' }, { name: 'Patient Portal', path: '/patient' }];

  const isDashboard = ['/staff', '/admin', '/patient'].includes(location.pathname);

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Care<span>Q</span>
      </Link>

      {/* Desktop Nav */}
      <div className="nav-content desktop-nav" style={{ width: 'auto' }}>
        <div className="nav-links">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={isActive ? 'active' : ''}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {isDashboard && (
            <div className="live-badge">
               <div className="live-dot"></div>
               Live
            </div>
          )}
          {loggedInUser ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
               <button onClick={toggleTheme} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }} title="Toggle Theme">
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                 {loggedInUser.split('@')[0]}
               </span>
               <button onClick={handleLogout} className="btn-ghost">Logout</button>
             </div>
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
               <button onClick={toggleTheme} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }} title="Toggle Theme">
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Login</Link>
             </div>
          )}
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="mobile-toggle" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isDashboard && <div className="live-dot"></div>}
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }} aria-label="Menu">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="form-section-card"
            style={{ position: 'absolute', top: '100%', left: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 100 }}
          >
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setMobileOpen(false)}
                style={{ color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}
              >
                {link.name}
              </Link>
            ))}
            {loggedInUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                 <p style={{ color: 'var(--text-primary)', textAlign: 'center', fontWeight: '600' }}>{loggedInUser}</p>
                 <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="btn-danger" style={{ width: '100%' }}>Logout</button>
              </div>
            ) : (
               <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>Login</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}} />
    </nav>
  );
}

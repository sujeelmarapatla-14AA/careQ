import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, ArrowRight, Activity, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS } from 'chart.js';
import { BASE_URL } from '../api';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('careq-theme') || 'light');
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('careq-theme', nextTheme);
    window.dispatchEvent(new Event('theme-change'));
    
    if (ChartJS && ChartJS.instances) {
      const isDark = nextTheme === 'dark';
      const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
      const labelColor = isDark ? '#94a3b8' : '#475569';

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

  const navLinks = [
    { name: '• Home', path: '/' },
    { name: 'About', path: '/#about' },
    { name: 'Services', path: '/#services' },
    { name: 'Our Team', path: '/#team' },
    { name: 'Testimonials', path: '/#testimonials' },
    { name: 'Contact', path: '/#contact' }
  ];

  const portalLinks = [
    { name: 'Patient', path: '/patient' },
    { name: 'Staff', path: '/staff' },
    { name: 'Admin', path: '/admin' }
  ];

  return (
    <nav className="navbar" style={{ padding: '0 2rem', background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}>
      
      {/* MedixWeb Brand Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent-gradient, linear-gradient(135deg, #0EA5E9, #0284C7))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>
          <HeartPulse size={20} />
        </div>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Medix<span style={{ color: 'var(--accent-cyan)' }}>Web</span>
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        
        {/* Pill Nav Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '9999px', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(8px)' }}>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.path}
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '6px 14px',
                borderRadius: '9999px',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Portal Quick Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-overlay)', padding: '3px', borderRadius: '9999px', border: '1px solid var(--border-subtle)' }}>
          {portalLinks.map((p) => {
            const isActive = location.pathname === p.path;
            return (
              <Link
                key={p.name}
                to={p.path}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-cyan)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {p.name}
              </Link>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={toggleTheme} 
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {loggedInUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {loggedInUser.split('@')[0]}
              </span>
              <button onClick={handleLogout} className="btn-medix-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/patient" className="btn-medix" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
              Book Appointment <ArrowRight size={16} />
            </Link>
          )}
        </div>

      </div>

      {/* Mobile Menu Toggle */}
      <div className="mobile-toggle" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '1rem',
              right: '1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              zIndex: 999
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={() => setMobileOpen(false)}
                style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
              >
                {link.name}
              </a>
            ))}
            <hr style={{ borderColor: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {portalLinks.map((p) => (
                <Link
                  key={p.name}
                  to={p.path}
                  onClick={() => setMobileOpen(false)}
                  style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '9999px', background: 'var(--bg-overlay)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {p.name}
                </Link>
              ))}
            </div>
            <Link to="/patient" onClick={() => setMobileOpen(false)} className="btn-medix" style={{ justifyContent: 'center', marginTop: '8px' }}>
              Book Appointment <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}} />

    </nav>
  );
}

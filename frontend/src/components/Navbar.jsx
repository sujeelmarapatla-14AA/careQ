import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, Phone, ChevronDown, Activity, Plus, User, Stethoscope, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS } from 'chart.js';
import { BASE_URL } from '../api';

import { triggerWaveTransition } from './WaveTransition';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('careq-theme') || 'light');
  const location = useLocation();
  const navigate = useNavigate();

  const handlePortalClick = (role, path) => {
    setPortalsOpen(false);
    triggerWaveTransition(role);
    navigate(path);
  };

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
    triggerWaveTransition('logout');
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('careq_token');
    localStorage.removeItem('careq_username');
    localStorage.removeItem('careq_role');
    setTimeout(() => {
      navigate('/login');
    }, 600);
  };

  const navLinks = [
    { name: 'Home ∨', path: '/' },
    { name: 'About', path: '/#about' },
    { name: 'Pages ∨', path: '/#pages' },
    { name: 'Blog ∨', path: '/#blog' },
    { name: 'Contact', path: '/#contact' },
    { name: 'Portals', path: '/#portals' }
  ];

  const portalLinks = [
    { name: 'Patient Kiosk', path: '/patient' },
    { name: 'Staff Matrix', path: '/staff' },
    { name: 'Admin Hub', path: '/admin' }
  ];

  return (
    <header className="floating-glass-navbar">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Brand Logo - Heltro Style */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003B65' }}>
              {/* Heltro 4-bar cross symbol */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 4H18V28H14V4Z" fill="#003B65"/>
                <path d="M4 14H28V18H4V14Z" fill="#003B65"/>
                <path d="M7 7L25 25L22 28L4 10L7 7Z" fill="#0066B2"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#003B65', letterSpacing: '-0.5px', fontFamily: 'var(--font-sans)' }}>
              CareQ
            </span>
          </Link>

          {/* Vertical Divider Line | */}
          <div className="nav-vertical-divider" />

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Home</Link>
            <a href="#about" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#475569', textDecoration: 'none' }}>About</a>
            
            {/* Quick Portals Dropdown Trigger */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setPortalsOpen(true)}
              onMouseLeave={() => setPortalsOpen(false)}
            >
              <button 
                onClick={() => setPortalsOpen(!portalsOpen)}
                className="cursor-target"
                style={{ 
                  background: portalsOpen ? '#F1F5F9' : 'transparent', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  color: '#002B49', 
                  cursor: 'pointer',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <span>Portals</span>
                <ChevronDown size={14} color="#003B65" style={{ transform: portalsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {portalsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      minWidth: '280px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '16px',
                      padding: '12px',
                      boxShadow: '0 12px 32px rgba(0, 43, 73, 0.14)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px 6px' }}>
                      Select Login Portal
                    </div>

                    <button
                      onClick={() => handlePortalClick('patient', '/login')}
                      className="cursor-target"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,102,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0066B2' }}>
                        <User size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#002B49' }}>Patient Portal</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Token registration & status</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePortalClick('staff', '/login')}
                      className="cursor-target"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                        <Stethoscope size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#002B49' }}>Staff Command Matrix</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Live queue & bed controls</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePortalClick('admin', '/login')}
                      className="cursor-target"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                        <Shield size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#002B49' }}>Admin Executive Centre</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Hospital metrics & analytics</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="#metrics" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#475569', textDecoration: 'none' }}>Metrics</a>
            <a href="#facility" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#475569', textDecoration: 'none' }}>Hours</a>
          </nav>

          {/* Contact Call Badge & CTA Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            
            {/* Call me info badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003B65' }}>
                <Phone size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 500 }}>Call me</span>
                <span style={{ fontSize: '0.9rem', color: '#002B49', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>(888) 456-7890</span>
              </div>
            </div>

            {loggedInUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#002B49' }}>
                  {loggedInUser.split('@')[0]}
                </span>
                <button onClick={handleLogout} className="btn-heltro-outline" style={{ height: '44px', padding: '0 18px', fontSize: '0.88rem' }}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/patient" className="btn-heltro">
                Appointment
              </Link>
            )}

          </div>

        </div>

        {/* Mobile Toggle */}
        <div className="mobile-toggle" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: '#003B65', cursor: 'pointer' }}>
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '16px',
              right: '16px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 999
            }}
          >
            <Link to="/" onClick={() => setMobileOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Home</Link>
            <Link to="/patient" onClick={() => { triggerWaveTransition('patient'); setMobileOpen(false); }} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Patient Kiosk</Link>
            <Link to="/staff" onClick={() => { triggerWaveTransition('staff'); setMobileOpen(false); }} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Staff Matrix</Link>
            <Link to="/admin" onClick={() => { triggerWaveTransition('admin'); setMobileOpen(false); }} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Admin Executive</Link>
            <Link to="/patient" onClick={() => { triggerWaveTransition('patient'); setMobileOpen(false); }} className="btn-heltro" style={{ width: '100%', justifyContent: 'center' }}>
              Appointment
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 960px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 959px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}} />

    </header>
  );
}

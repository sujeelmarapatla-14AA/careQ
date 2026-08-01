import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, Phone, ChevronDown, Activity, Plus } from 'lucide-react';
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
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', height: '80px', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
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

        {/* Desktop Navigation Links */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Home</Link>
            <a href="#about" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#475569', textDecoration: 'none' }}>About</a>
            
            {/* Quick Portals Dropdown Trigger */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#475569' }}>Portals</span>
              <ChevronDown size={14} color="#475569" />
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

            <button onClick={toggleTheme} style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#003B65', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

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
            <Link to="/patient" onClick={() => setMobileOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Patient Kiosk</Link>
            <Link to="/staff" onClick={() => setMobileOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Staff Matrix</Link>
            <Link to="/admin" onClick={() => setMobileOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: '#002B49', textDecoration: 'none' }}>Admin Executive</Link>
            <Link to="/patient" onClick={() => setMobileOpen(false)} className="btn-heltro" style={{ width: '100%', justifyContent: 'center' }}>
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

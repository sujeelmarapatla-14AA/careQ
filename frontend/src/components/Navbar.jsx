import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  let loggedInUser = localStorage.getItem('careq_username');
  if (loggedInUser === 'undefined' || loggedInUser === 'null') {
    loggedInUser = null;
  }

  const handleLogout = async () => {
    try {
        await fetch('http://localhost:5000/api/auth/logout', { method: 'POST' });
    } catch (e) {
        // Handle gracefully if backend is offline
    }
    localStorage.removeItem('careq_token');
    localStorage.removeItem('careq_username');
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Patient Portal', path: '/patient' },
    { name: 'Staff Dashboard', path: '/staff' },
    { name: 'Admin Centre', path: '/admin' },
    { name: 'Register Patient', path: '/register' } // dummy path if it doesn't exist
  ];

  const isDashboard = ['/staff', '/admin', '/patient'].includes(location.pathname);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1.2rem 2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: scrolled ? 'var(--nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="CareQ Home">
        <span className="title-gradient" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>CareQ</span>
      </Link>

      {/* Desktop Nav */}
      <nav style={{ display: 'none', gap: '2.5rem', alignItems: 'center' }} className="desktop-nav">
        {navLinks.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.path}
              to={link.path} 
              style={{ 
                color: isActive ? 'var(--primary-blue)' : 'var(--text-muted)', 
                textDecoration: 'none', 
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                transition: 'color 0.2s',
                position: 'relative'
              }}
            >
              {link.name}
              {isActive && (
                 <motion.div layoutId="nav-underline" style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '2px', background: 'var(--primary-blue)', borderRadius: '2px' }} />
              )}
            </Link>
          );
        })}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '1.5rem' }}>
          {isDashboard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)', boxShadow: '0 0 10px var(--success-green)' }}></div>
               Live
            </div>
          )}
          {loggedInUser ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600 }}>{loggedInUser.split('@')[0]}</span>
               <button onClick={handleLogout} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '6px 12px', fontSize: '0.85rem' }}>Logout</button>
             </div>
          ) : (
             <Link to="/login" className="btn" style={{ textDecoration: 'none' }}>Staff Login</Link>
          )}
        </div>
      </nav>

      {/* Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="mobile-toggle">
        {isDashboard && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)', boxShadow: '0 0 10px var(--success-green)' }}></div>}
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }} aria-label="Menu">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="glass-panel"
            style={{ position: 'absolute', top: '100%', left: '1rem', right: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 100 }}
          >
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setMobileOpen(false)}
                style={{ color: location.pathname === link.path ? 'var(--primary-blue)' : 'var(--text-main)', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}
              >
                {link.name}
              </Link>
            ))}
            {loggedInUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                 <p style={{ color: 'var(--text-main)', textAlign: 'center', fontWeight: '600' }}>{loggedInUser}</p>
                 <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Logout</button>
              </div>
            ) : (
               <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-green" style={{ textDecoration: 'none', textAlign: 'center' }}>Staff Login</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        .theme-toggle:hover { background: var(--surface-color) !important; }
      `}} />
    </motion.header>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Activity, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--glass-border)', padding: '4rem 2rem' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
        
        {/* Brand Col */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
             <Activity color="var(--primary-blue)" size={32} style={{ marginRight: '10px' }} />
             <span className="title-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>CareQ Central</span>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
             Next-generation, autonomous 3D-mapped medical triage grid. End the chaos. Embrace the flow.
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Minimal social placeholders */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={20} color="var(--primary-blue)" /></div>
          </div>
        </div>

        {/* Links Col 1 */}
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Architecture</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><Link to="/patient" className="footer-link">Patient Node</Link></li>
            <li><Link to="/staff" className="footer-link">Staff Command Matrix</Link></li>
            <li><Link to="/" className="footer-link">Live Hologrid</Link></li>
          </ul>
        </div>

        {/* Links Col 2 */}
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Emergency Contact</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Phone size={18} style={{ marginRight: '10px', color: 'var(--primary-blue)' }} />
              <span>1-800-CARE-REQ</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Mail size={18} style={{ marginRight: '10px', color: 'var(--primary-blue)' }} />
              <span>sysadmin@careq-grid.net</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
              <MapPin size={18} style={{ marginRight: '10px', color: 'var(--primary-blue)', marginTop: '4px' }} />
              <span>Terminal 4, Neural Medical Center<br/>New San Francisco, CA 94103</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} CareQ Autonomous Systems. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
           <a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>Privacy Policy</a>
           <a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .footer-link { position: relative; color: var(--text-muted); text-decoration: none; padding-bottom: 2px; display: inline-block; transition: color 0.2s; }
        .footer-link:hover { color: var(--cyan) !important; }
        .footer-link::after {
          content: ''; position: absolute; left: 0; bottom: 0;
          width: 0; height: 1px; background: var(--cyan);
          transition: width 0.2s ease-out;
        }
        .footer-link:hover::after { width: 100%; }
      `}} />
    </footer>
  );
}

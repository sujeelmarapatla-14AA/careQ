import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, HeartPulse, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', padding: '4rem 2rem 2rem' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
        
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
             <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent-gradient, linear-gradient(135deg, #0EA5E9, #0284C7))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
               <HeartPulse size={20} />
             </div>
             <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
               Medix<span style={{ color: 'var(--accent-cyan)' }}>Web</span>
             </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
             MedixWeb Clinic connects doctors and patients effortlessly, providing smarter, safer, and compassionate healthcare from diagnosis to full recovery.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="pill-tag-interactive" style={{ fontSize: '0.8rem' }}>
              <ShieldCheck size={14} color="var(--accent-cyan)" /> HIPAA Compliant
            </div>
            <div className="pill-tag-interactive" style={{ fontSize: '0.8rem' }}>
              24/7 Support
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '1.2rem', fontWeight: 700 }}>Quick Navigation</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><a href="/#about" className="footer-link">About MedixWeb</a></li>
            <li><a href="/#services" className="footer-link">Healthcare Services</a></li>
            <li><a href="/#team" className="footer-link">Our Medical Team</a></li>
            <li><a href="/#testimonials" className="footer-link">Patient Testimonials</a></li>
          </ul>
        </div>

        {/* Portals & Systems */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '1.2rem', fontWeight: 700 }}>Clinical Portals</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link to="/patient" className="footer-link">Patient Appointment & Token Portal</Link></li>
            <li><Link to="/staff" className="footer-link">Doctor & Staff Command Portal</Link></li>
            <li><Link to="/admin" className="footer-link">Admin Executive Dashboard</Link></li>
            <li><Link to="/login" className="footer-link">Staff Login</Link></li>
          </ul>
        </div>

        {/* Emergency Hotline */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '1.2rem', fontWeight: 700 }}>Emergency Helpline</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <li style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <Phone size={18} style={{ marginRight: '10px', color: 'var(--accent-cyan)' }} />
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>+1 (800) 555-MEDIX</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <Mail size={18} style={{ marginRight: '10px', color: 'var(--accent-cyan)' }} />
              <span>care@medixweb-clinic.com</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
              <MapPin size={18} style={{ marginRight: '10px', color: 'var(--accent-cyan)', marginTop: '3px' }} />
              <span>MedixWeb Healthcare Center<br/>100 Medical Plaza, Suite 400</span>
            </li>
          </ul>
        </div>

      </div>
      
      <div className="container" style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>
          &copy; {new Date().getFullYear()} MedixWeb Total Care™ Systems. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
           <a href="#" style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', textDecoration: 'none' }}>Privacy Policy</a>
           <a href="#" style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .footer-link { position: relative; color: var(--text-secondary); text-decoration: none; padding-bottom: 2px; display: inline-block; transition: color 0.2s; font-size: 0.92rem; }
        .footer-link:hover { color: var(--accent-cyan) !important; }
        .footer-link::after {
          content: ''; position: absolute; left: 0; bottom: 0;
          width: 0; height: 2px; background: var(--accent-cyan);
          transition: width 0.2s ease-out;
        }
        .footer-link:hover::after { width: 100%; }
      `}} />
    </footer>
  );
}

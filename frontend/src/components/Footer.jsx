import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#002B49', color: '#FFFFFF', padding: '64px 32px 32px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '48px' }}>
        
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
             <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M14 4H18V28H14V4Z" fill="#FFFFFF"/>
               <path d="M4 14H28V18H4V14Z" fill="#FFFFFF"/>
               <path d="M7 7L25 25L22 28L4 10L7 7Z" fill="#0066B2"/>
             </svg>
             <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
               CareQ
             </span>
          </div>
          <p style={{ color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px', fontSize: '0.95rem' }}>
             Reliable medical services focused on patient safety, comfort, and better outcomes with precision triage.
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> 24/7 Active Clinical Operations
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '20px', fontWeight: 700 }}>Navigation</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><a href="/#about" className="heltro-footer-link">About CareQ</a></li>
            <li><a href="/#metrics" className="heltro-footer-link">Medical Metrics</a></li>
            <li><a href="/#facility" className="heltro-footer-link">Clinic Hours & Facility</a></li>
            <li><Link to="/patient" className="heltro-footer-link">Book Appointment</Link></li>
          </ul>
        </div>

        {/* Clinical Portals */}
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '20px', fontWeight: 700 }}>Clinical Portals</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><Link to="/patient" className="heltro-footer-link">Patient Token Kiosk</Link></li>
            <li><Link to="/staff" className="heltro-footer-link">Staff Command Matrix</Link></li>
            <li><Link to="/admin" className="heltro-footer-link">Admin Executive Portal</Link></li>
            <li><Link to="/login" className="heltro-footer-link">Staff Login</Link></li>
          </ul>
        </div>

        {/* Emergency Contact */}
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '20px', fontWeight: 700 }}>Emergency Contact</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', fontSize: '0.95rem' }}>
              <Phone size={18} style={{ marginRight: '12px', color: '#0066B2' }} />
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>(888) 456-7890</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', fontSize: '0.95rem' }}>
              <Mail size={18} style={{ marginRight: '12px', color: '#0066B2' }} />
              <span>info@careq.com</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', color: '#94A3B8', fontSize: '0.95rem' }}>
              <MapPin size={18} style={{ marginRight: '12px', color: '#0066B2', marginTop: '3px' }} />
              <span>CareQ Healthcare Center<br/>100 Medical Plaza, Suite 400</span>
            </li>
          </ul>
        </div>

      </div>
      
      <div className="container" style={{ maxWidth: '1280px', margin: '48px auto 0', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>
          &copy; {new Date().getFullYear()} CareQ Health Technologies. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '24px' }}>
           <a href="#" style={{ color: '#94A3B8', fontSize: '0.88rem', textDecoration: 'none' }}>Privacy Policy</a>
           <a href="#" style={{ color: '#94A3B8', fontSize: '0.88rem', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .heltro-footer-link { color: #94A3B8; text-decoration: none; transition: color 0.2s; font-size: 0.92rem; }
        .heltro-footer-link:hover { color: #FFFFFF !important; }
      `}} />
    </footer>
  );
}

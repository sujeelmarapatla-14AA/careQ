import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, Heart, Award, ThumbsUp, Activity, 
  Phone, Mail, Clock, CheckCircle2, ChevronRight, Star
} from 'lucide-react';
import { apiFetch, BASE_URL } from '../api';
import { io } from 'socket.io-client';
import PatientWizard from '../components/PatientWizard';
import BedAvailability from '../components/BedAvailability';

const CountUp = ({ end, duration = 1.0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!end && end !== 0) return;
    let start = 0;
    const increment = Math.max(1, Math.ceil(end / (duration * 60)));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count}</span>;
};

export default function Landing() {
  const [stats, setStats] = useState({ patientsToday: 0, avgWaitMins: 0, bedsAvailable: 0, totalBeds: 120 });
  const [activeTab, setActiveTab] = useState('wizard');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/stats');
        if (data && !data.error) setStats(data);
      } catch (e) {}
    };
    fetchStats();
    const stIntv = setInterval(fetchStats, 20000);

    const socket = io(BASE_URL);
    socket.on('bed:update', (data) => {
      if (data && Array.isArray(data.beds)) {
        setStats(prev => ({ 
          ...prev, 
          bedsAvailable: data.beds.filter(b => b.status === 'available').length,
          totalBeds: data.beds.length 
        }));
      }
    });

    return () => { clearInterval(stIntv); socket.disconnect(); };
  }, []);

  const featureList = [
    { num: '01', title: 'Reliable medical care' },
    { num: '02', title: 'Patient-focused treatment' },
    { num: '03', title: 'Expert medical guidance' },
    { num: '04', title: 'Long-term health outcomes' }
  ];

  return (
    <div style={{ background: '#FFFFFF', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION - HELTRO IMAGE 1 DESIGN */}
      <section style={{ background: 'linear-gradient(135deg, #7B9DAE 0%, #89A8B6 100%)', minHeight: '85vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 32px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
            
            {/* Left Text Content */}
            <div style={{ zIndex: 2 }}>
              <h1 style={{ fontSize: 'clamp(2.6rem, 4.5vw, 4rem)', fontWeight: 700, color: '#002B49', lineHeight: 1.12, letterSpacing: '-1.5px', marginBottom: '24px' }}>
                Smarter intelligence for better patient care
              </h1>
              
              <p style={{ fontSize: '1.15rem', color: '#002B49', lineHeight: 1.6, marginBottom: '40px', maxWidth: '540px', opacity: 0.9 }}>
                Streamlined clinical workflows boost efficiency, cut wait times, and enable faster, patient-centered care experiences.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/patient" className="btn-heltro" style={{ fontSize: '1rem', height: '52px', padding: '0 36px' }}>
                  Explore more
                </Link>
                <Link to="/staff" className="btn-heltro-outline" style={{ fontSize: '1rem', height: '52px', padding: '0 36px' }}>
                  Staff Portal
                </Link>
              </div>
            </div>

            {/* Right Doctor Visual & Floating Cards */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              
              <div style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
                <img 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80" 
                  alt="Doctor smiling with stethoscope" 
                  style={{ width: '100%', height: 'auto', borderRadius: '24px', display: 'block', objectFit: 'cover' }} 
                />

                {/* Rating Card Overlay Top Right */}
                <div style={{ position: 'absolute', bottom: '180px', right: '-20px', background: '#FFFFFF', padding: '12px 20px', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,43,73,0.12)', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 3 }}>
                  <div style={{ display: 'flex', marginLeft: '-4px' }}>
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff' }} />
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-8px' }} />
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-8px' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', color: '#F59E0B', gap: '2px', fontSize: '0.8rem' }}>★★★★★</div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#002B49' }}>1k+ Satisfied patients</span>
                  </div>
                </div>

                {/* Floating Stat Card 1: 18% Reduced wait times */}
                <div style={{ position: 'absolute', bottom: '60px', right: '160px', background: '#FFFFFF', padding: '16px 24px', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,43,73,0.12)', minWidth: '160px', zIndex: 3 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#003B65', lineHeight: 1 }}>18%</div>
                  <span style={{ fontSize: '0.8rem', color: '#334155', marginTop: '6px', display: 'block', fontWeight: 500 }}>Reduced patient wait times</span>
                </div>

                {/* Floating Stat Card 2: 20% Improved care efficiency */}
                <div style={{ position: 'absolute', bottom: '60px', right: '-20px', background: '#FFFFFF', padding: '16px 24px', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,43,73,0.12)', minWidth: '160px', zIndex: 3 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#003B65', lineHeight: 1 }}>20%</div>
                  <span style={{ fontSize: '0.8rem', color: '#334155', marginTop: '6px', display: 'block', fontWeight: 500 }}>Improved care efficiency</span>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 2. RELIABLE MEDICAL CARE / ABOUT SECTION - HELTRO IMAGE 2 DESIGN */}
      <section id="about" style={{ padding: '80px 32px', background: '#FFFFFF' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '64px', alignItems: 'flex-start' }}>
            
            {/* Left Image Visual */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', height: '100%', minHeight: '440px' }}>
              <img 
                src="https://images.unsplash.com/photo-1581579438747-1dc8d1e05842?w=800&auto=format&fit=crop&q=80" 
                alt="Elderly couple reading album with caregiver" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '440px' }} 
              />
            </div>

            {/* Right Content Column */}
            <div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#002B49', lineHeight: 1.25, marginBottom: '32px' }}>
                Reliable medical services focused on patient safety, comfort, and better outcomes, delivering quality care with compassion and precision
              </h2>

              <div style={{ marginBottom: '40px' }}>
                <Link to="/patient" className="btn-heltro">
                  Explore more
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
                
                {/* Numbered Feature Links */}
                <div>
                  {featureList.map((item) => (
                    <a key={item.num} href="#services" className="heltro-numbered-item">
                      <div>
                        <span className="heltro-numbered-num">{item.num}</span>
                        <span>{item.title}</span>
                      </div>
                      <ArrowUpRight size={18} />
                    </a>
                  ))}
                </div>

                {/* Sub feature card with Doctor consulting patient */}
                <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80" 
                    alt="Doctor consulting patient" 
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} 
                  />
                  <p style={{ fontSize: '0.88rem', color: '#002B49', fontWeight: 600, lineHeight: 1.4 }}>
                    Expert medical care combining innovation, compassion, and clinical excellence
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. WHY CHOOSE US / METRIC GRID SECTION - HELTRO IMAGE 3 DESIGN */}
      <section id="metrics" style={{ padding: '80px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ maxWidth: '800px', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#003B65', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
              Why choose us
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 700, color: '#002B49', lineHeight: 1.2 }}>
              Advanced medical solutions for managing chronic conditions and improving patient outcomes
            </h2>
          </div>

          {/* 4-Column Stat Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            
            {/* Stat 1 */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #CBD5E1' }}>
              <div style={{ color: '#0066B2', marginBottom: '16px' }}>
                <Heart size={36} />
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#002B49', lineHeight: 1, marginBottom: '12px' }}>
                25+
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#002B49', marginBottom: '6px' }}>Medical excellence</h4>
              <p style={{ fontSize: '0.88rem', color: '#64748B' }}>Quality-driven medical excellence</p>
            </div>

            {/* Stat 2 */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #CBD5E1' }}>
              <div style={{ color: '#0066B2', marginBottom: '16px' }}>
                <Award size={36} />
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#002B49', lineHeight: 1, marginBottom: '12px' }}>
                80%
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#002B49', marginBottom: '6px' }}>Successfully treated</h4>
              <p style={{ fontSize: '0.88rem', color: '#64748B' }}>Effective patient treatment results</p>
            </div>

            {/* Stat 3 */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #CBD5E1' }}>
              <div style={{ color: '#0066B2', marginBottom: '16px' }}>
                <ThumbsUp size={36} />
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#002B49', lineHeight: 1, marginBottom: '12px' }}>
                1k
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#002B49', marginBottom: '6px' }}>Clients satisfaction</h4>
              <p style={{ fontSize: '0.88rem', color: '#64748B' }}>High patient satisfaction guaranteed</p>
            </div>

            {/* Stat 4 */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #CBD5E1' }}>
              <div style={{ color: '#0066B2', marginBottom: '16px' }}>
                <Activity size={36} />
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#002B49', lineHeight: 1, marginBottom: '12px' }}>
                42+
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#002B49', marginBottom: '6px' }}>Medical specialties</h4>
              <p style={{ fontSize: '0.88rem', color: '#64748B' }}>Comprehensive medical specialty care</p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. HEALTHCARE FACILITY & HOURS BANNER SECTION - HELTRO IMAGE 4 DESIGN */}
      <section id="facility" style={{ position: 'relative', background: '#FFFFFF', padding: '64px 32px' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', minHeight: '440px' }}>
            <img 
              src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80" 
              alt="Medical surgeon in mask" 
              style={{ width: '100%', height: '480px', objectFit: 'cover', display: 'block' }} 
            />

            {/* Overlay Dual-Card Box */}
            <div style={{ position: 'absolute', top: '50%', right: '40px', transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,43,73,0.15)', maxWidth: '640px' }}>
              
              {/* Left Dark Navy Card (#003B65) */}
              <div style={{ background: '#003B65', color: '#FFFFFF', padding: '32px', flex: 1, minWidth: '280px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Healthcare facility</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>Clinic name :</span>
                    <span style={{ fontWeight: 600 }}>CareQ Medical</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>Appointment :</span>
                    <span style={{ fontWeight: 600 }}>(888) 456-7890</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>Support email :</span>
                    <span style={{ fontWeight: 600 }}>info@careq.com</span>
                  </div>
                </div>
              </div>

              {/* Right White Card (#FFFFFF) */}
              <div style={{ background: '#FFFFFF', color: '#002B49', padding: '32px', flex: 1, minWidth: '280px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Clinic hours</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Monday – Friday :</span>
                    <span style={{ fontWeight: 600 }}>9:00 AM – 6:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Saturday :</span>
                    <span style={{ fontWeight: 600 }}>8:00 AM – 4:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Sunday :</span>
                    <span style={{ fontWeight: 600, color: '#EF4444' }}>Closed</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Large Decorative Text Banner */}
          <div style={{ textAlign: 'center', marginTop: '48px', overflow: 'hidden' }}>
            <span style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 800, color: '#003B65', letterSpacing: '-2px', opacity: 0.9, display: 'block', lineHeight: 1 }}>
              Health checkup
            </span>
          </div>

        </div>
      </section>

      {/* 5. CAREQ LIVE SYSTEMS INTEGRATION HUB */}
      <section style={{ padding: '80px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#003B65', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Live Clinical Matrix
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#002B49', marginBottom: '16px' }}>
              Real-Time Patient Token & Bed Operations Engine
            </h2>
            
            {/* View Switcher Tabs */}
            <div style={{ display: 'inline-flex', gap: '8px', background: '#FFFFFF', padding: '6px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <button 
                onClick={() => setActiveTab('wizard')}
                className={activeTab === 'wizard' ? 'btn-heltro' : 'btn-heltro-outline'}
                style={{ height: '40px', padding: '0 20px', fontSize: '0.88rem' }}
              >
                Patient Token Registration
              </button>
              <button 
                onClick={() => setActiveTab('beds')}
                className={activeTab === 'beds' ? 'btn-heltro' : 'btn-heltro-outline'}
                style={{ height: '40px', padding: '0 20px', fontSize: '0.88rem' }}
              >
                Live Bed Infrastructure Grid
              </button>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,43,73,0.05)' }}>
            {activeTab === 'wizard' ? (
              <PatientWizard />
            ) : (
              <BedAvailability />
            )}
          </div>

        </div>
      </section>

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, HeartPulse, ArrowRight, CheckCircle, Activity, 
  Users, Stethoscope, Award, ChevronRight, Play, Star, Sparkles, Clock, Lock
} from 'lucide-react';
import { apiFetch, BASE_URL } from '../api';
import { io } from 'socket.io-client';
import PatientWizard from '../components/PatientWizard';
import BedAvailability from '../components/BedAvailability';

const CountUp = ({ end, duration = 1.2 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!end) return;
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count}</span>;
};

export default function Landing() {
  const [stats, setStats] = useState({ patientsToday: 48, avgWaitMins: 12, bedsAvailable: 18 });
  const [activeModelTab, setActiveModelTab] = useState('Compassion');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/stats');
        if (data && !data.error) setStats(data);
      } catch (e) {}
    };
    fetchStats();
    const stIntv = setInterval(fetchStats, 30000);

    const socket = io(BASE_URL);
    socket.on('bed:update', (data) => {
      if (data && Array.isArray(data.beds)) {
        setStats(prev => ({ ...prev, bedsAvailable: data.beds.filter(b => b.status === 'available').length }));
      }
    });

    return () => { clearInterval(stIntv); socket.disconnect(); };
  }, []);

  const modelTabs = ['Compassion', 'Collaboration', 'Transparency', 'Flexibility', 'Excellence'];

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const fadeInUp = { hidden: { opacity: 0, y: 25 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

  return (
    <div style={{ background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Dynamic Background Ambient Waves */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0, opacity: 0.5 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(220, 245, 255, 0) 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(2, 132, 199, 0.1) 0%, rgba(240, 249, 255, 0) 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* 1. HERO SECTION */}
        <section style={{ padding: '4rem 2rem 5rem', minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            
            {/* Left Content */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              
              {/* Trust Badge */}
              <motion.div variants={fadeInUp} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.9)', padding: '6px 18px', borderRadius: '9999px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', marginLeft: '-4px' }}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="User" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #fff' }} />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="User" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-8px' }} />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="User" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-8px' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Trusted by <strong style={{ color: 'var(--accent-primary)' }}>135k+</strong> people
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1 variants={fadeInUp} style={{ fontSize: 'clamp(2.5rem, 4vw, 4.2rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1.5px', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Your Trusted Partner in Modern Healthcare
              </motion.h1>

              {/* Subtext */}
              <motion.p variants={fadeInUp} style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '580px' }}>
                Accessible, modern medical care — where technology meets compassion. Book appointments, view live wait tokens, and stay healthy from anywhere.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeInUp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                <button onClick={() => setShowWizard(true)} className="btn-medix">
                  Explore Services <ArrowRight size={18} />
                </button>
                <Link to="/patient" className="btn-medix-outline">
                  Book Appointment
                </Link>
              </motion.div>

              {/* Hero Footer Feature Box */}
              <motion.div variants={fadeInUp} className="medix-card-hero" style={{ background: 'rgba(255, 255, 255, 0.7)', borderRadius: '20px', padding: '1.25rem 1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Comprehensive Care
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Accessible, modern medical care — where technology meets compassion. Book appointments, view reports, and stay healthy from anywhere.
                </p>
              </motion.div>

            </motion.div>

            {/* Right Visual Image Frame matching design reference */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ position: 'relative' }}>
              <div style={{ borderRadius: '36px', overflow: 'hidden', border: '6px solid #FFFFFF', boxShadow: '0 20px 50px rgba(2, 132, 199, 0.15)', position: 'relative' }}>
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&auto=format&fit=crop&q=80" 
                  alt="Father carrying laughing child healthcare" 
                  style={{ width: '100%', height: '520px', objectFit: 'cover', display: 'block' }} 
                />

                {/* Floating Stat Overlay Box 97% */}
                <div style={{ position: 'absolute', bottom: '25px', left: '25px', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)', padding: '1.2rem 1.5rem', borderRadius: '20px', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxWidth: '240px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trusted Care Rate</span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-primary)', margin: '4px 0' }}>
                    <CountUp end={97} />%
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Our patients trust us and are consistently satisfied with our treatment & support.
                  </p>
                </div>

                {/* Floating Interactive Tags Top Right */}
                <div style={{ position: 'absolute', top: '25px', right: '25px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div className="pill-tag-interactive">Caring</div>
                  <div className="pill-tag-interactive active">Personalized</div>
                  <div className="pill-tag-interactive">Reliable</div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* 2. ABOUT US / SMART CARE SECTION */}
        <section id="about" style={{ padding: '5rem 2rem', background: 'rgba(240, 249, 255, 0.5)' }}>
          <div className="container">
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center', marginBottom: '4rem' }}>
              
              {/* Left Headline */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>
                  • ABOUT US
                </span>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  MedixWeb Clinic connects doctors and patients effortlessly, providing smarter, safer, and compassionate healthcare from diagnosis to full recovery.
                </h2>
              </div>

              {/* Doctor Profile Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#FFFFFF', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)', border: '1px solid var(--border-subtle)' }}>
                <div className="doctor-spotlight-frame">
                  <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80" alt="Doctor Specialist" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dr. Suresh Reddy</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>Chief Medical Officer</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Dedicated to intelligent triage & patient-first care models.</p>
                </div>
              </div>

            </div>

            {/* Feature Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* Card 1 */}
              <div className="medix-card-hero" style={{ background: '#FFFFFF' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                  50+
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Healthcare Professionals</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Supporting Lives Worldwide with specialist expertise and round-the-clock emergency support.
                </p>
              </div>

              {/* Card 2 */}
              <div className="medix-card-hero" style={{ background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <HeartPulse size={22} />
                  </div>
                  <span className="pill-tag-interactive" style={{ fontSize: '0.75rem' }}>Connected Care</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Smart Care</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Smart digital health tracking ensures accurate insights and better outcomes every step of your journey.
                </p>
              </div>

              {/* Card 3 */}
              <div className="medix-card-hero" style={{ background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <Lock size={22} />
                  </div>
                  <span className="pill-tag-interactive" style={{ fontSize: '0.75rem' }}>Data Privacy</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Secure Data</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Protecting patient data through secure, HIPAA-compliant digital health systems and encrypted records.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 3. THE MEDIXWEB TOTAL CARE™ MODEL SECTION */}
        <section id="services" style={{ padding: '5rem 2rem' }}>
          <div className="container">
            
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                • APPROACH
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                The MedixWeb Total Care™ Model
              </h2>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Providing patient-centered care through expert guidance, innovative solutions, and personalized support every step of the way.
              </p>
            </div>

            {/* Model Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: '2.5rem', alignItems: 'center' }}>
              
              {/* Left Value Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
                {modelTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveModelTab(tab)}
                    className={`total-care-tab ${activeModelTab === tab ? 'active' : ''}`}
                    style={{ textAlignment: 'left', border: 'none' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Center Model Visual Card */}
              <div style={{ borderRadius: '28px', overflow: 'hidden', position: 'relative', border: '4px solid #FFFFFF', boxShadow: '0 15px 40px rgba(2, 132, 199, 0.12)' }}>
                <img 
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1000&auto=format&fit=crop&q=80" 
                  alt="Doctor checking young patient" 
                  style={{ width: '100%', height: '380px', objectFit: 'cover' }} 
                />

                {/* Pill overlay tags */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {modelTabs.map((t) => (
                    <span 
                      key={t} 
                      className={`pill-tag-interactive ${activeModelTab === t ? 'active' : ''}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Banner Note */}
            <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#FFFFFF', padding: '1.8rem 2.5rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.25)' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6 }}>
                "Our MedixWeb™ model unites doctors, specialists, and wellness experts in one place. From diagnostics to recovery, we ensure holistic healing and long-term wellness."
              </p>
            </div>

          </div>
        </section>

        {/* 4. REAL STORIES, REAL HEALING (TESTIMONIALS) */}
        <section id="testimonials" style={{ padding: '5rem 2rem', background: 'rgba(240, 249, 255, 0.6)' }}>
          <div className="container">
            
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                • TESTIMONIAL
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                Real Stories, Real Healing — From Our Community
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Providing patient-centered care through expert guidance, innovative solutions, and personalized support.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Testimonial 1 */}
              <div className="medix-card-hero" style={{ background: '#FFFFFF' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>Friendly staff review</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  "The team made every step stress-free and supportive. I finally feel confident about my treatment."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="Patient" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Robert Fox</h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Regular Patient</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="medix-card-hero" style={{ background: '#FFFFFF' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>Seamless experience</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  "The live token tracking and instant bed availability matrix made my family's hospital visit completely smooth."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Patient" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cody Fisher</h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Cardiology Patient</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="medix-card-hero" style={{ background: '#FFFFFF' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>Compassionate care</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  "Smart digital health tracking ensures accurate insights and better outcomes. Highly recommended!"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Patient" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Albert Flores</h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>General OPD</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 5. EXPERT INSIGHTS SECTION */}
        <section style={{ padding: '5rem 2rem' }}>
          <div className="container">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  • INSIGHTS
                </span>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Explore Expert Insights for a Healthier Life
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                Discover expert health insights, wellness advice, and medical updates to help you make informed decisions.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* Insight 1 */}
              <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.06)' }}>
                <img src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80" alt="Health Article" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '1.5rem' }}>
                  <span className="pill-tag-interactive" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>Pediatrics</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Essential Pediatric Care Guidance for Parents</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>5 min read • By Dr. Suresh Reddy</p>
                </div>
              </div>

              {/* Insight 2 */}
              <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.06)' }}>
                <img src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80" alt="Health Article" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '1.5rem' }}>
                  <span className="pill-tag-interactive" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>Cardiology</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Understanding Cardiovascular Health & Prevention</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>7 min read • By Cardiology Team</p>
                </div>
              </div>

              {/* Insight 3 */}
              <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.06)' }}>
                <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80" alt="Health Article" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '1.5rem' }}>
                  <span className="pill-tag-interactive" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>Digital Health</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>How Smart AI Triage Reduces Hospital Wait Times</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>4 min read • By MedixWeb Tech</p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 6. INTERACTIVE CAREQ CLINICAL MATRIX WIZARD SHOWCASE */}
        <section style={{ padding: '4rem 2rem 6rem', background: 'linear-gradient(180deg, rgba(240, 249, 255, 0.5) 0%, rgba(224, 242, 254, 0.8) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span className="pill-tag-interactive active" style={{ marginBottom: '0.8rem' }}>
                <Sparkles size={14} /> Real-Time Clinical Matrix
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                Experience Instant Patient Token Registration & Bed Tracking
              </h2>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '32px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 50px rgba(2, 132, 199, 0.12)' }}>
              <PatientWizard />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

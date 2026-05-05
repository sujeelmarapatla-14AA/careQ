import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Fingerprint, AlertCircle, Check, Loader2, User, Phone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../api';

export default function Auth() {
  const [activeTab, setActiveTab] = useState('patient'); // 'patient', 'staff', 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  
  // Admin 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempId, setTempId] = useState('');
  const [authCode, setAuthCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePatientSocialLogin = async (provider) => {
    // left for compatibility, though not directly exposed in the new UI.
    setLoading(true); setError('');
    const mockEmail = provider === 'phone' ? 'otp-user@phone.com' : `user@${provider}.com`;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/patient/social`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockEmail, provider })
      });
      const data = await res.json();
      if(data.success) completeLogin(data);
      else setError(data.error);
    } catch { setError('Connection lost.'); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    // Public Portal Logic (LocalStorage)
    if (activeTab === 'patient') {
      const dbKey = 'careq_users_db';
      let users = {};
      try { users = JSON.parse(localStorage.getItem(dbKey)) || {}; } catch { users = {}; }

      if (isSignUp) {
        if (users[email]) {
          setError('Account already exists.');
          setLoading(false);
          return;
        }
        users[email] = { email, password, name, createdAt: new Date().toISOString() };
        localStorage.setItem(dbKey, JSON.stringify(users));
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsSignUp(false);
        }, 1000);
        setLoading(false);
        return;
      } else {
        const user = users[email];
        if (user && user.password === password) {
          setLoading(false);
          return completeLogin({ success: true, token: 'public-token-' + Date.now(), username: user.name || email.split('@')[0], role: 'patient' });
        } else {
          setError('Invalid credentials.');
          setLoading(false);
          return;
        }
      }
    }

    // Staff/Admin: always go through the real backend — no client-side bypass
    let endpoint = '/api/auth/patient/login';
    if (activeTab === 'staff') endpoint = '/api/auth/staff/login';
    if (activeTab === 'admin') endpoint = '/api/auth/admin/login';
    
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, email: email })
      });
      const data = await res.json();
      
      if(res.status === 403) return setError(data.error); 
      if(res.status === 429) return setError(data.error + ` (Lockout Active)`);

      if(data.success) {
        if(data.requires2FA) {
          setRequires2FA(true);
          setTempId(data.tempId);
        } else {
          completeLogin(data);
        }
      } else { setError(data.error || 'Access Denied / Invalid Credentials.'); }
    } catch { setError('Network failure. Please check your connection and try again.'); }
    setLoading(false);
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/verify-2fa`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempId, code: authCode })
      });
      const data = await res.json();
      if(data.success) completeLogin(data);
      else setError(data.error);
    } catch { setError('Network failure.'); }
    setLoading(false);
  }

  const completeLogin = (data) => {
    setSuccess(true);
    localStorage.setItem('careq_token', data.token); 
    localStorage.setItem('careq_username', data.username);
    localStorage.setItem('careq_role', data.role);
    
    setTimeout(() => {
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'staff') navigate('/staff');
      else navigate('/patient');
    }, 800);
  };

  return (
    <div className="page-enter" style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Background Gradients */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 50%, ${activeTab==='admin'?'rgba(139,92,246,0.1)':'rgba(14,165,233,0.12)'} 0%, transparent 60%)`, zIndex: -1, transition: '1s' }} />
      <div style={{ position: 'absolute', top: '15%', left: '25%', width: '30vh', height: '30vh', background: activeTab==='admin'?'#8b5cf6':'var(--accent-primary)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, transition: 'background 1s' }} />
      
      <motion.div className="auth-card">
        
        {/* Role Tabs */}
        {!requires2FA && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '6px', borderRadius: '12px' }}>
             {[{ id: 'patient', label: 'Patient Node'}, { id: 'staff', label: 'Staff' }, { id: 'admin', label: 'Admin' }].map(tab => (
               <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); setEmail(''); setPassword(''); }} 
                 style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent', color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === tab.id ? 700 : 500, cursor: 'pointer', transition: '0.3s', boxShadow: activeTab === tab.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none' }}>
                 {tab.label}
               </button>
             ))}
          </div>
        )}

        {/* Dynamic Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
             <motion.div whileHover={{ rotate: 5 }} className="shield-wrapper" style={{ background: activeTab==='admin' ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' : 'linear-gradient(135deg, var(--primary-blue), #818cf8)' }}>
                {activeTab === 'patient' ? <User color="white" size={28} /> : activeTab === 'admin' ? <Shield color="white" size={28} /> : <Fingerprint color="white" size={28} />}
             </motion.div>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            {requires2FA ? 'Confirm Identity' : activeTab === 'patient' ? (isSignUp ? 'Create Public Account' : 'Welcome to CareQ') : activeTab === 'staff' ? 'Staff Command Matrix' : 'System Administration'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {requires2FA ? 'Enter your 6-digit TOTP code.' : activeTab === 'patient' ? (isSignUp ? 'Register to access your health grid.' : 'Sign in to access your health grid.') : 'Official hospital credentials required.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-danger)', color: 'var(--status-danger)', padding: '12px', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORMS */}
        <AnimatePresence mode="wait">
          
          {/* Unified Login Form for All Roles */}
          {!requires2FA && (
            <motion.form key="auth-form" onSubmit={handleLogin} initial={{opacity:0, x: 20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} noValidate>
              
              {activeTab === 'patient' && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                   <button type="button" onClick={() => setIsSignUp(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid ' + (!isSignUp ? 'var(--status-success)' : 'var(--border-default)'), background: !isSignUp ? 'rgba(16,185,129,0.1)' : 'transparent', color: !isSignUp ? 'var(--status-success)' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.3s' }}>Sign In</button>
                   <button type="button" onClick={() => setIsSignUp(true)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid ' + (isSignUp ? 'var(--status-success)' : 'var(--border-default)'), background: isSignUp ? 'rgba(16,185,129,0.1)' : 'transparent', color: isSignUp ? 'var(--status-success)' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.3s' }}>Create Account</button>
                </div>
              )}
              
              {activeTab === 'patient' && isSignUp && (
                <div className="floating-input-group">
                  <User className="input-ico" size={18} />
                  <input type="text" id="fname" className="float-input" required value={name} onChange={(e) => setName(e.target.value)} />
                  <label htmlFor="fname" className="float-label">Full Name (Optional)</label>
                </div>
              )}

              <div className="floating-input-group">
                <Mail className="input-ico" size={18} />
                <input type="email" id="femail" className="float-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor="femail" className="float-label">Email Address</label>
              </div>
              
              <div className="floating-input-group">
                <Lock className="input-ico" size={18} />
                <input type={showPassword ? "text" : "password"} id="fpass" className="float-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <label htmlFor="fpass" className="float-label">Password</label>
                <button type="button" className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <motion.button type="submit" className="auth-submit-btn" disabled={loading || success} style={{ background: activeTab==='admin' ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' : 'linear-gradient(135deg, var(--accent-primary), #818cf8)' }}>
                {loading ? <Loader2 className="spin-ico" size={20} /> : success ? <Check size={24} strokeWidth={3}/> : (activeTab === 'patient' && isSignUp ? 'Create Account' : 'Sign In')}
              </motion.button>

            </motion.form>
          )}

          {/* Admin 2FA Requirement Phase */}
          {requires2FA && (
             <motion.form key="2fa" onSubmit={handle2FAVerify} initial={{opacity:0, y: 20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}>
               <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid var(--status-warning)', padding: '16px', borderRadius: '12px', color: '#eab308', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  A second factor is required. For this demo, exact code <strong>123456</strong> is expected.
               </div>
               
               <div className="floating-input-group">
                 <Shield className="input-ico" size={18} />
                 <input type="text" id="ftotp" maxLength={6} className="float-input" style={{ letterSpacing: '4px', fontSize: '1.4rem', textAlign: 'center', paddingLeft: '16px' }} required value={authCode} onChange={(e) => setAuthCode(e.target.value)} />
               </div>

               <motion.button type="submit" className="auth-submit-btn" disabled={loading || success} style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                 {loading ? <Loader2 className="spin-ico" size={20} /> : success ? <Check size={24} strokeWidth={3}/> : 'Verify Security Token'}
               </motion.button>
             </motion.form>
          )}

        </AnimatePresence>

      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-card {
          width: 100%; max-width: 440px; z-index: 10;
          background: var(--bg-surface);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-default);
          border-radius: 24px; padding: 3rem 2.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .shield-wrapper {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .social-btn {
          width: 100%; padding: 14px; background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: 12px; color: var(--text-primary); font-weight: 600; font-size: 1rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.2s;
        }
        .social-btn:hover { background: var(--bg-overlay); border-color: var(--border-strong); transform: translateY(-2px); }
        
        .floating-input-group { position: relative; margin-bottom: 1.5rem; }
        .input-ico { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; z-index: 2; transition: 0.3s; }
        .float-input {
          width: 100%; padding: 22px 16px 10px 46px; background: var(--bg-elevated);
          border: 1px solid var(--border-default); border-radius: 12px; color: var(--text-primary);
          font-size: 1rem; outline: none; transition: 0.3s;
        }
        .float-input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 1px rgba(45,126,248,0.3); }
        .float-input:focus ~ .input-ico { color: var(--accent-primary); }
        .float-label {
          position: absolute; left: 46px; top: 18px; color: var(--text-secondary);
          font-size: 0.95rem; pointer-events: none; transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .float-input:focus ~ .float-label, .float-input:valid ~ .float-label {
          top: 6px; font-size: 0.7rem; color: var(--accent-primary); font-weight: 600;
        }
        .pass-toggle { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
        .pass-toggle:hover { color: var(--text-primary); }
        
        .auth-submit-btn {
          width: 100%; border: none; border-radius: 12px; color: #fff; font-weight: 700; font-size: 1.05rem;
          cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; height: 56px;
        }
        .auth-submit-btn:hover:not(:disabled) { box-shadow: 0 15px 30px rgba(0,0,0,0.4); transform: translateY(-2px); filter: brightness(1.1); }
        .spin-ico { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

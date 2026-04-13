import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Fingerprint, AlertCircle, Check, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPassValid = password.length >= 6;
  const isNameValid = name.trim().length >= 2;

  const validateForm = () => {
    if (!isLogin && !isNameValid) return "Name must be at least 2 characters.";
    if (!isEmailValid) return "Please enter a valid email address.";
    if (!isPassValid) return "Password must be at least 6 characters long.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { username: email, password } : { username: email, password, role: 'staff' };
    
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      
      if (res.status === 429) {
        throw new Error(data.error + ` (Lockout: ${Math.round(data.retryAfter/60)}m)`);
      }
      
      if (data.success) {
        setSuccess(true);
        if (isLogin) { 
          localStorage.setItem('careq_token', data.token); 
          localStorage.setItem('careq_username', data.username || email);
          localStorage.setItem('careq_role', data.role || 'patient');
          
          setTimeout(() => {
            const role = data.role || 'patient';
            if (role === 'admin') navigate('/admin');
            else if (role === 'staff') navigate('/staff');
            else navigate('/patient');
          }, 800);
        } else { 
          setTimeout(() => {
            setIsLogin(true); 
            setPassword(''); 
            setSuccess(false);
            setError('Success! Account created. Please login.'); 
          }, 1500);
        }
      } else { 
        setError(data.error || 'Authentication denied.'); 
      }
    } catch(err) { 
      setError(err.message || 'System network is currently offline.'); 
    }
    setLoading(false);
  };

  // Error Shake Animation
  const shakeAnim = error ? { x: [-8, 8, -8, 8, 0], transition: { duration: 0.4 } } : { x: 0 };

  return (
    <div className="page-enter" style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Background Gradient & Circles */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 0% 50%, rgba(14,165,233,0.12) 0%, transparent 60%)', zIndex: -1 }} />
      <div style={{ position: 'absolute', top: '15%', left: '25%', width: '30vh', height: '30vh', background: 'var(--cyan)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '25%', width: '30vh', height: '30vh', background: 'var(--teal)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '40%', width: '20vh', height: '20vh', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ ...shakeAnim, opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="staff-auth-card"
        role="main" 
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
             <motion.div whileHover={{ rotate: 5 }} className="fingerprint-wrapper">
                <Fingerprint color="white" size={28} />
             </motion.div>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? 'Enter your credentials to access operations.' : 'Join the CareQ unified healthcare network.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
               style={{ background: error.includes('Success') ? 'rgba(16,185,129,0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${error.includes('Success') ? 'var(--success-green)' : 'var(--urgent-red)'}`, color: error.includes('Success') ? 'var(--success-green)' : 'var(--urgent-red)', padding: '12px', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <AlertCircle size={16} />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate>
          <AnimatePresence>
            {!isLogin && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <div className="floating-input-group">
                  <User className="input-ico" size={18} />
                  <input type="text" id="fname" className="float-input" required value={name} onChange={(e) => setName(e.target.value)} />
                  <label htmlFor="fname" className="float-label">Full Name</label>
                  {isNameValid && <Check className="valid-tick" size={16} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="floating-input-group">
            <Mail className="input-ico" size={18} />
            <input type="email" id="femail" className="float-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="femail" className="float-label">Email Address</label>
            {isEmailValid && <Check className="valid-tick" size={16} />}
          </div>
          
          <div className="floating-input-group">
            <Lock className="input-ico" size={18} />
            <input type={showPassword ? "text" : "password"} id="fpass" className="float-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <label htmlFor="fpass" className="float-label">Password</label>
            <button type="button" className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {isPassValid && <Check className="valid-tick" size={16} style={{ right: '45px' }} />}
          </div>
          
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="auth-submit-btn" disabled={loading || success}>
            {loading ? <Loader2 className="spin-ico" size={20} /> : success ? <motion.div initial={{scale:0}} animate={{scale:1}}><Check size={24} strokeWidth={3}/></motion.div> : (isLogin ? 'Sign In' : 'Create account')}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
           <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.95rem', cursor: 'pointer' }}>
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <strong style={{ color: 'var(--primary-blue)', fontWeight: 700, marginLeft: '5px' }}>{isLogin ? "Sign up" : "Log in"}</strong>
           </button>
           <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
             <ExternalLink size={14} /> Staff & Admin access only. Patients use <a href="/patient" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Patient Portal</a>.
           </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .staff-auth-card {
          width: 100%; max-width: 440px; z-index: 10;
          background: rgba(13, 23, 41, 0.75);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(14, 165, 233, 0.15);
          border-radius: 24px; padding: 3.5rem 2.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .fingerprint-wrapper {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, var(--primary-blue), #818cf8);
          display: flex; align-items: center; justifyContent: center;
          animation: breathGlow 3s infinite alternate;
        }
        @keyframes breathGlow {
          0% { box-shadow: 0 0 0px rgba(14,165,233,0); }
          100% { box-shadow: 0 0 20px rgba(14,165,233,0.6); }
        }
        
        .floating-input-group { position: relative; margin-bottom: 1.5rem; }
        .input-ico { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; z-index: 2; transition: 0.3s; }
        .float-input {
          width: 100%; padding: 22px 16px 10px 46px; background: rgba(0,0,0,0.25);
          border: 1px solid var(--glass-border); border-radius: 12px; color: var(--text-main);
          font-size: 1rem; outline: none; transition: 0.3s;
        }
        .float-input:focus { border-color: var(--cyan); box-shadow: 0 0 0 1px rgba(14,165,233,0.3); }
        .float-input:focus ~ .input-ico { color: var(--cyan); }
        .float-label {
          position: absolute; left: 46px; top: 18px; color: var(--text-muted);
          font-size: 0.95rem; pointer-events: none; transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .float-input:focus ~ .float-label, .float-input:valid ~ .float-label {
          top: 6px; font-size: 0.7rem; color: var(--cyan); font-weight: 600;
        }
        .valid-tick { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--success-green); }
        .pass-toggle { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
        .pass-toggle:hover { color: var(--cyan); }
        
        .auth-submit-btn {
          width: 100%; padding: 16px; background: linear-gradient(135deg, var(--cyan), #818cf8);
          border: none; border-radius: 12px; color: #fff; font-weight: 700; font-size: 1.05rem;
          cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2);
          display: flex; justify-content: center; align-items: center; height: 56px;
        }
        .auth-submit-btn:hover:not(:disabled) { box-shadow: 0 15px 30px rgba(14, 165, 233, 0.3); transform: translateY(-2px); }
        .spin-ico { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

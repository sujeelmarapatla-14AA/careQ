import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, Bed, Ticket, Search, UserCircle, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PatientWizard from '../components/PatientWizard';
import TokenCard from '../components/TokenCard';
import BedAvailability from '../components/BedAvailability';
import { BASE_URL } from '../api';

export default function PatientDashboard() {
  const navigate = useNavigate();
  // Tabs: register, beds, my_token, check_token
  const [activeTab, setActiveTab] = useState('register');
  const [checkPhone, setCheckPhone] = useState('');
  const [checkTokenNum, setCheckTokenNum] = useState('');
  const [checkError, setCheckError] = useState('');
  
  const storedToken = localStorage.getItem('careq_queue_token');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!checkTokenNum) return setCheckError('Token number is required');
    setCheckError('');
    try {
      const res = await fetch(`${BASE_URL}/api/patient/${checkTokenNum}`);
      const data = await res.json();
      if (!data || data.error) {
         setCheckError(data.error || 'Token not found');
      } else {
         localStorage.setItem('careq_queue_token', data.token_number || data.token);
         setActiveTab('my_token');
      }
    } catch {
      setCheckError('Server error');
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, link: '/' },
    { id: 'register', label: 'Register', icon: ClipboardList },
    { id: 'beds', label: 'Bed Status', icon: Bed },
    { id: 'my_token', label: 'My Token', icon: Ticket },
    { id: 'check_token', label: 'Check Token', icon: Search },
    { id: 'login', label: 'Login', icon: UserCircle, link: '/login' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', background: 'var(--bg-base)' }}>
      
      {/* Patient Navigation Bar */}
      <div style={{ background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-subtle)', padding: '0 var(--space-8)', position: 'sticky', top: 'var(--nav-height)', zIndex: 50, backdropFilter: 'blur(20px)' }}>
         <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', padding: 'var(--space-3) 0' }} className="hide-scroll">
            {navItems.map(item => {
               if (item.link) {
                 return (
                   <Link key={item.id} to={item.link} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>
                      <item.icon size={18} /> {item.label}
                   </Link>
                 )
               }
               
               const isActive = activeTab === item.id;
               return (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-lg)', background: isActive ? 'var(--bg-elevated)' : 'transparent', border: isActive ? '1px solid var(--border-default)' : '1px solid transparent', color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <item.icon size={18} /> {item.label}
                 </button>
               )
            })}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ padding: 'var(--space-12) var(--space-6)', flex: 1, position: 'relative' }}>
         <AnimatePresence mode="wait">

            {activeTab === 'register' && (
               <motion.div key="register" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <PatientWizard onRegistered={(tk) => { localStorage.setItem('careq_queue_token', tk); setActiveTab('my_token'); }} />
               </motion.div>
            )}

            {activeTab === 'beds' && (
               <motion.div key="beds" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <div className="form-section-card">
                     <div className="form-section-label">Hospital Bed Status</div>
                     <BedAvailability isAdmin={false} />
                  </div>
               </motion.div>
            )}

            {activeTab === 'my_token' && (
               <motion.div key="my_token" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  {!storedToken ? (
                     <div className="form-section-card flex-col" style={{ alignItems: 'center', textAlign: 'center', padding: 'var(--space-12)', maxWidth: '500px', margin: '0 auto' }}>
                        <Ticket size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }} />
                        <h2 className="text-xl" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>No Active Token</h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>You have not registered for a queue yet.</p>
                        <button onClick={()=>setActiveTab('register')} className="btn-primary">Register Now</button>
                     </div>
                  ) : (
                     <TokenCard storedToken={storedToken} onLeave={() => { localStorage.removeItem('careq_queue_token'); setActiveTab('register'); }} />
                  )}
               </motion.div>
            )}

            {activeTab === 'check_token' && (
               <motion.div key="check_token" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <div className="form-section-card flex-col" style={{ maxWidth: '500px', margin: '0 auto', padding: 'var(--space-8)' }}>
                     <h2 className="text-xl" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '10px' }}><Search color="var(--accent-primary)" size={24} /> Check Existing Token</h2>
                     <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Enter your tracking credentials to retrieve your live status card.</p>
                     
                     {checkError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--status-danger)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{checkError}</div>}
                     
                     <form onSubmit={handleLookup} className="flex-col gap-5">
                        <div className="form-group mb-0">
                           <label className="form-label">Phone Number</label>
                           <input type="tel" className="form-input" value={checkPhone} onChange={e=>setCheckPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="form-group mb-0">
                           <label className="form-label">Token Number *</label>
                           <input type="text" className="form-input" value={checkTokenNum} onChange={e=>setCheckTokenNum(e.target.value)} placeholder="e.g. A-047" />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '1rem', marginTop: 'var(--space-4)', justifyContent: 'center' }}>Retrieve Status</button>
                     </form>
                  </div>
               </motion.div>
            )}

         </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

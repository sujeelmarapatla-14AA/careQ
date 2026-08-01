import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WaveTransition() {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState('Authenticating Portal...');

  useEffect(() => {
    const handleTrigger = (e) => {
      if (e.detail && e.detail.title) {
        setTitle(e.detail.title);
      } else {
        setTitle('Entering Portal...');
      }
      setActive(true);
      
      // Auto dismiss after wave sweep cycle finishes
      const timer = setTimeout(() => {
        setActive(false);
      }, 1600);
      return () => clearTimeout(timer);
    };

    window.addEventListener('careq-wave-transition', handleTrigger);
    return () => window.removeEventListener('careq-wave-transition', handleTrigger);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Wave Layer 1 - Deep Ocean Blue */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: ['100%', '0%', '-100%'] }}
            transition={{
              duration: 1.5,
              times: [0, 0.45, 1],
              ease: [0.77, 0, 0.175, 1]
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, #0052CC 0%, #003B65 100%)',
              zIndex: 1
            }}
          >
            <svg
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: '-120px',
                left: 0,
                width: '100%',
                height: '140px'
              }}
            >
              <path
                fill="#0052CC"
                d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </motion.div>

          {/* Wave Layer 2 - Bright Azure Gradient Wave */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: ['100%', '0%', '-100%'] }}
            transition={{
              duration: 1.5,
              delay: 0.08,
              times: [0, 0.45, 1],
              ease: [0.77, 0, 0.175, 1]
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, #0066FF 0%, #0052CC 100%)',
              zIndex: 2
            }}
          >
            <svg
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: '-140px',
                left: 0,
                width: '100%',
                height: '160px'
              }}
            >
              <path
                fill="#0066FF"
                d="M0,96L48,122.7C96,149,192,203,288,208C384,213,480,171,576,138.7C672,107,768,85,864,106.7C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </motion.div>

          {/* Wave Layer 3 - Top Sky Light Blue Curve */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: ['100%', '0%', '-100%'] }}
            transition={{
              duration: 1.5,
              delay: 0.15,
              times: [0, 0.45, 1],
              ease: [0.77, 0, 0.175, 1]
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, #38BDF8 0%, #0066FF 100%)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: '-160px',
                left: 0,
                width: '100%',
                height: '180px'
              }}
            >
              <path
                fill="#38BDF8"
                d="M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,106.7C672,117,768,171,864,186.7C960,203,1056,181,1152,160C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>

            {/* Floating Portal Card inside Wave Center */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1, 0.9], opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.4, 1] }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '20px 36px',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 43, 73, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                zIndex: 10
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#003B65',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800
                }}
              >
                ⚡
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#002B49'
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#0066B2',
                    fontWeight: 600
                  }}
                >
                  CareQ Health Network
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Global Trigger Helper Function
export const triggerWaveTransition = (roleOrTitle) => {
  let title = 'Entering Portal...';
  if (roleOrTitle === 'staff') title = 'Opening Staff Command Matrix...';
  else if (roleOrTitle === 'admin') title = 'Opening Admin Executive Portal...';
  else if (roleOrTitle === 'patient') title = 'Opening Patient Portal...';
  else if (typeof roleOrTitle === 'string') title = roleOrTitle;

  window.dispatchEvent(
    new CustomEvent('careq-wave-transition', {
      detail: { title }
    })
  );
};

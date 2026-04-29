import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-8)' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <AlertTriangle size={80} color="var(--status-warning)" style={{ marginBottom: 'var(--space-6)' }} />
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)', marginBottom: 'var(--space-2)' }}>404 - Sector Not Found</h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', marginBottom: 'var(--space-8)', maxWidth: '500px' }}>
          The hospital grid you are looking for does not exist, has been restricted, or is currently undergoing maintenance.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Home size={20} />
          Return to Hub
        </Link>
      </motion.div>
    </div>
  );
}

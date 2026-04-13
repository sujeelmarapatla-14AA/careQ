import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Eager load critical routes
import Landing from './pages/Landing';
import Auth from './pages/Auth';

// Lazy load Dashboards to optimize initial bundle
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('careq_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Global fallback loader
const PageLoader = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
     <div className="spinner" />
     <style dangerouslySetInnerHTML={{__html: `
       .spinner { width: 50px; height: 50px; border: 4px solid var(--glass-border); border-top: 4px solid var(--primary-blue); border-radius: 50%; animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
       @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
     `}} />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/staff" element={
                  <ProtectedRoute>
                    <StaffDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
export default App;

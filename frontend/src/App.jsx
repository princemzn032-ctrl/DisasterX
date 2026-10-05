import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ReportDisaster from './pages/ReportDisaster';
import Shelters from './pages/Shelters';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { useAuth } from './context/useAuth';
import SafetyAssistant from './components/SafetyAssistant';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MapView = lazy(() => import('./pages/MapView'));

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main key={location.pathname} className="page-frame" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          <Suspense fallback={<div className="content-wrap loading-state"><span className="loader-ring" /> Loading response tools…</div>}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login initialMode="register" />} />
              <Route path="/report" element={<ReportDisaster />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/shelters" element={<Shelters />} />
              <Route path="/sos" element={<ProtectedRoute><Home initialSOS /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <SafetyAssistant />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </>
  );
}

export default function App() {
  return <BrowserRouter><LanguageProvider><AuthProvider><AppRoutes /></AuthProvider></LanguageProvider></BrowserRouter>;
}

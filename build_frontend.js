const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend', 'src');

const files = {
  "api.js": `import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
`,
  "App.jsx": `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportDisaster from './pages/ReportDisaster';
import MapView from './pages/MapView';
import Shelters from './pages/Shelters';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children, role }) {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (!userInfo) return <Navigate to="/login" />;
  if (role && userInfo.role !== role) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/report" element={<ReportDisaster />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/shelters" element={<Shelters />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute role="admin">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
`,
  "components/Navbar.jsx": `import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-danger-500" />
              <span className="font-bold text-xl tracking-tight">Disaster<span className="text-danger-500">X</span></span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/map" className="text-slate-300 hover:text-white font-medium transition">Disaster Map</Link>
            <Link to="/report" className="text-slate-300 hover:text-white font-medium transition">Report Disaster</Link>
            <Link to="/shelters" className="text-slate-300 hover:text-white font-medium transition">Shelters</Link>
            
            {userInfo ? (
              <div className="flex items-center gap-4">
                {userInfo.role === 'admin' && (
                  <Link to="/dashboard" className="text-primary-400 hover:text-primary-300 font-bold">Admin Dashboard</Link>
                )}
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">{userInfo.name}</span>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-danger-400 transition">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium">
                <User className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 shadow-xl">
          <Link to="/map" className="block py-3 text-slate-300 border-b border-slate-700/50">Disaster Map</Link>
          <Link to="/report" className="block py-3 text-slate-300 border-b border-slate-700/50">Report Disaster</Link>
          <Link to="/shelters" className="block py-3 text-slate-300 border-b border-slate-700/50">Shelters</Link>
          {userInfo ? (
            <>
              {userInfo.role === 'admin' && <Link to="/dashboard" className="block py-3 text-primary-400 font-bold border-b border-slate-700/50">Admin Dashboard</Link>}
              <button onClick={handleLogout} className="block w-full text-left py-3 text-danger-400 font-medium">Logout ({userInfo.name})</button>
            </>
          ) : (
            <Link to="/login" className="block py-3 text-primary-400 font-bold">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
`,
  "pages/Home.jsx": `import { Link } from 'react-router-dom';
import { AlertTriangle, Map, Phone, ShieldPlus, ArrowRight, Activity, Users, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Home() {
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosStatus, setSosStatus] = useState(null);
  const [stats, setStats] = useState({ disasters: 0, users: 0, shelters: 0 });
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/disasters');
        setActiveAlerts(data.slice(0, 3));
        setStats({ disasters: data.length, users: 124, shelters: 8 });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSOS = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) {
      toast.error("Please login to use SOS feature");
      setShowSOSModal(false);
      return;
    }

    try {
      setSosStatus('sending');
      // Mock getting location
      const location = { address: "Current Location", lat: 28.6139, lng: 77.2090 };
      
      const { data } = await api.post('/emergency', {
        location,
        emergencyType: 'Critical SOS',
        severity: 'critical'
      });
      
      setSosStatus('sent');
      toast.success(\`SOS Sent Successfully! Request ID: \${data._id.substring(0, 8)}\`);
      setTimeout(() => {
        setShowSOSModal(false);
        setSosStatus(null);
      }, 3000);
    } catch (err) {
      toast.error('Failed to send SOS');
      setSosStatus(null);
      setShowSOSModal(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#0a192f] text-white overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f]"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute top-10 left-10 w-64 h-64 bg-danger-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-0 right-10 w-64 h-64 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-64 h-64 bg-warning-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Disaster Management System
            </h1>
            <p className="mt-4 text-2xl text-slate-300 font-light max-w-3xl mx-auto">
              Smart Emergency Response. Faster Rescue. Safer Communities.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => setShowSOSModal(true)} className="px-8 py-4 bg-danger-600 hover:bg-danger-700 text-white rounded-xl font-bold text-lg transition shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95">
                <Phone className="h-6 w-6 animate-pulse" />
                Emergency SOS
              </button>
              <Link to="/report" className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                Report Disaster
              </Link>
              <Link to="/map" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2">
                <Map className="h-5 w-5" />
                View Live Map
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-12 bg-white border-b border-slate-200 relative z-20 shadow-sm -mt-6 mx-4 rounded-xl max-w-6xl md:mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
            <div className="flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-danger-100 text-danger-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <Activity className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900">{stats.disasters}</h3>
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Active Disasters</p>
            </div>
            <div className="flex flex-col items-center text-center border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0">
                <div className="h-14 w-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <Users className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900">{stats.users}</h3>
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Registered Users</p>
            </div>
            <div className="flex flex-col items-center text-center border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0">
                <div className="h-14 w-14 bg-success-100 text-success-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <HomeIcon className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900">{stats.shelters}</h3>
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Safe Shelters</p>
            </div>
        </div>
      </section>

      {/* Active Alerts */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-danger-500" />
                        Active Disaster Alerts
                    </h2>
                    <p className="text-slate-600 mt-2">Real-time updates on ongoing emergencies.</p>
                </div>
                <Link to="/map" className="hidden md:flex text-primary-600 hover:text-primary-700 font-semibold items-center gap-1">
                    View All on Map <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeAlerts.map(alert => (
                    <div key={alert._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <span className={\`px-3 py-1 rounded-full text-xs font-bold uppercase \${
                                alert.severity === 'critical' ? 'bg-danger-100 text-danger-700' : 
                                alert.severity === 'high' ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'
                            }\`}>
                                {alert.severity}
                            </span>
                            <span className="text-sm text-slate-400">{new Date(alert.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{alert.title}</h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                            <Map className="h-4 w-4" /> {alert.location.address}
                        </div>
                        <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition">
                            View Details
                        </button>
                    </div>
                ))}
                {activeAlerts.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                        No active disasters reported at the moment. Stay safe!
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-danger-100 mb-6">
                  <Phone className="h-10 w-10 text-danger-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Confirm SOS Alert</h3>
                <p className="text-slate-600 mb-8">
                  Are you sure you need emergency assistance? This will instantly share your location and notify rescue teams. False alarms are punishable.
                </p>
                
                {sosStatus === 'sending' ? (
                  <div className="py-3 bg-slate-100 text-slate-600 font-medium rounded-xl mb-3 flex justify-center items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                    Broadcasting Location...
                  </div>
                ) : sosStatus === 'sent' ? (
                  <div className="py-3 bg-success-100 text-success-700 font-bold rounded-xl mb-3">
                    SOS Sent! Rescue teams alerted.
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={() => setShowSOSModal(false)} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                      Cancel
                    </button>
                    <button onClick={handleSOS} className="flex-1 py-3 px-4 bg-danger-600 hover:bg-danger-700 text-white font-bold rounded-xl transition shadow-lg shadow-danger-600/30">
                      Confirm SOS
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
`,
  "pages/MapView.jsx": `import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';

// Custom icons
const createIcon = (color) => new L.Icon({
  iconUrl: \`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-\${color}.png\`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  disaster: createIcon('red'),
  shelter: createIcon('green'),
};

export default function MapView() {
  const [disasters, setDisasters] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const resDis = await api.get('/disasters');
        setDisasters(resDis.data);
        const resShel = await api.get('/shelters');
        setShelters(resShel.data);
      } catch (err) {
        console.error("Failed to load map data");
      }
    };
    fetchMapData();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row relative z-0">
      <div className="w-full md:w-80 bg-white shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-2">Map Filters</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Show All</option>
                <option value="disasters">Active Disasters</option>
                <option value="shelters">Safe Shelters</option>
            </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-2">Legend</h3>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-danger-50 p-3 rounded-lg border border-danger-100">
                <img src={icons.disaster.options.iconUrl} className="h-6 object-contain" /> Disasters
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-success-50 p-3 rounded-lg border border-success-100">
                <img src={icons.shelter.options.iconUrl} className="h-6 object-contain" /> Shelters
            </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <MapContainer center={[28.6139, 77.2090]} zoom={10} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {(filter === 'all' || filter === 'disasters') && disasters.map(d => (
            <Marker key={d._id} position={[d.location.lat, d.location.lng]} icon={icons.disaster}>
              <Popup className="custom-popup">
                <div className="font-bold text-lg text-danger-700 mb-1 capitalize">{d.title}</div>
                <div className="text-sm text-slate-600 mb-2">{d.description}</div>
                <div className="flex gap-2">
                    <span className="px-2 py-1 bg-danger-100 text-danger-800 text-xs font-bold rounded uppercase">{d.severity}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {(filter === 'all' || filter === 'shelters') && shelters.map(s => (
            <Marker key={s._id} position={[s.location.lat, s.location.lng]} icon={icons.shelter}>
              <Popup>
                <div className="font-bold text-lg text-success-700 mb-1">{s.name}</div>
                <div className="text-sm text-slate-600 mb-1">Capacity: {s.occupied}/{s.capacity}</div>
                <div className="text-sm font-medium">Contact: {s.contact}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
`,
  "pages/ReportDisaster.jsx": `import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function ReportDisaster() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'flood',
    severity: 'medium',
    description: '',
    address: '',
    affectedPeople: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
        toast.error("You must be logged in to report a disaster.");
        navigate('/login');
        return;
    }
    setLoading(true);
    try {
        await api.post('/disasters', {
            title: formData.title,
            type: formData.type,
            severity: formData.severity,
            description: formData.description,
            location: { address: formData.address, lat: 28.61, lng: 77.20 }, // Mock coordinates
            affectedPeople: formData.affectedPeople
        });
        toast.success('Disaster reported successfully!');
        navigate('/map');
    } catch (error) {
        toast.error('Failed to report disaster.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Report an Incident</h1>
          <p className="text-slate-500 mt-2">Please provide accurate information to assist emergency response teams.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Incident Title</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition" placeholder="e.g., Major flooding in Downtown" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Disaster Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition">
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
                <option value="cyclone">Cyclone</option>
                <option value="landslide">Landslide</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Severity Level</label>
              <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition">
                <option value="low">Low - Monitor Situation</option>
                <option value="medium">Medium - Needs Attention</option>
                <option value="high">High - Evacuation Needed</option>
                <option value="critical">Critical - Immediate Life Threat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Location / Address</label>
            <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition" placeholder="Enter specific location or landmark" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea required rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition" placeholder="Describe the situation in detail..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estimated Affected People</label>
            <input type="number" required min="0" value={formData.affectedPeople} onChange={(e) => setFormData({...formData, affectedPeople: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition" placeholder="0" />
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-primary-600/30 text-lg disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Emergency Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`,
  "pages/Shelters.jsx": `import { useState, useEffect } from 'react';
import { MapPin, Users, Phone, Navigation } from 'lucide-react';
import api from '../api';

export default function Shelters() {
  const [shelters, setShelters] = useState([]);

  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const { data } = await api.get('/shelters');
        setShelters(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchShelters();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Relief Shelters</h1>
        <p className="text-lg text-slate-600">Find safe locations, track available capacity, and get immediate directions to nearby relief camps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shelters.map(shelter => {
            const isFull = shelter.occupied >= shelter.capacity;
            return (
              <div key={shelter._id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{shelter.name}</h3>
                    <span className={\`px-3 py-1 rounded-full text-xs font-bold uppercase \${isFull ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'}\`}>
                        {isFull ? 'Full' : 'Available Spaces'}
                    </span>
                </div>
                
                <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3 text-slate-600">
                        <MapPin className="h-5 w-5 text-primary-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{shelter.location.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Users className="h-5 w-5 text-primary-500 shrink-0" />
                        <span className="text-sm">Occupancy: <strong>{shelter.occupied}</strong> / {shelter.capacity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="h-5 w-5 text-primary-500 shrink-0" />
                        <span className="text-sm">{shelter.contact}</span>
                    </div>
                </div>

                <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition">
                    <Navigation className="h-5 w-5" />
                    Get Directions
                </button>
              </div>
            );
        })}
      </div>
    </div>
  );
}
`,
  "pages/Login.jsx": `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('userInfo', JSON.stringify(data));
        toast.success('Login successful!');
        if (data.role === 'admin') {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    } catch (error) {
        toast.error(error.response?.data?.message || 'Login failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldAlert className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-slate-500">Demo Accounts: admin@dms.com | john@example.com (Pass: password)</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email address</label>
              <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition" placeholder="admin@dms.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none transition" placeholder="••••••••" />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-primary-600/30 text-lg disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`,
  "pages/Dashboard.jsx": `import { useState, useEffect } from 'react';
import { AlertTriangle, Users, MapPin, Activity, CheckCircle, Clock } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [disasters, setDisasters] = useState([]);

  const fetchData = async () => {
    try {
      const resReq = await api.get('/emergency');
      setRequests(resReq.data);
      const resDis = await api.get('/disasters');
      setDisasters(resDis.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id, status) => {
    try {
        await api.put(\`/emergency/\${id}\`, { status });
        toast.success('Status updated');
        fetchData();
    } catch (err) {
        toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Command Center Dashboard</h1>
        <p className="text-slate-500 mt-2 text-lg">System-wide overview and emergency orchestration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Disasters</p>
            <p className="text-4xl font-black text-slate-900 mt-2">{disasters.length}</p>
          </div>
          <div className="h-14 w-14 bg-danger-100 rounded-2xl flex items-center justify-center text-danger-600 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">SOS Requests</p>
            <p className="text-4xl font-black text-slate-900 mt-2">{requests.length}</p>
          </div>
          <div className="h-14 w-14 bg-warning-100 rounded-2xl flex items-center justify-center text-warning-600 shadow-inner">
            <Activity className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900">Emergency & SOS Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Requester</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type & Severity</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {requests.map(req => (
                <tr key={req._id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{req.userId?.name || 'Unknown User'}</div>
                    <div className="text-sm text-slate-500">{req.userId?.phone || 'No phone'}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{req.emergencyType}</div>
                    <span className={\`px-2 py-1 inline-flex text-xs font-bold rounded-md uppercase mt-1 \${
                        req.severity === 'critical' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'
                    }\`}>
                        {req.severity}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600 max-w-xs truncate">
                    {req.location.address}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                        {req.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-success-600"/> : <Clock className="w-4 h-4"/>}
                        {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm">
                    {req.status !== 'Completed' && (
                        <select 
                            onChange={(e) => updateStatus(req._id, e.target.value)}
                            className="bg-slate-100 border border-slate-200 text-slate-700 rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-primary-500"
                            value={req.status}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accept</option>
                            <option value="Rescue Team Assigned">Assign Team</option>
                            <option value="On The Way">On The Way</option>
                            <option value="Rescued">Rescued</option>
                            <option value="Completed">Mark Completed</option>
                        </select>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                  <tr>
                      <td colSpan="5" className="px-8 py-12 text-center text-slate-500 font-medium">No emergency requests found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`
};

for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}
console.log("Frontend files generated successfully!");

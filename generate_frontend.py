import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\Users\dell\Desktop\DMS\frontend\src"

files = {
    "App.jsx": """import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportDisaster from './pages/ReportDisaster';
import MapView from './pages/MapView';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<ReportDisaster />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
""",
    "components/Navbar.jsx": """import { Link } from 'react-router-dom';
import { ShieldAlert, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-danger-600" />
              <span className="font-bold text-xl text-slate-900 tracking-tight">RescueCore</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/map" className="text-slate-600 hover:text-primary-600 font-medium transition">Live Map</Link>
            <Link to="/report" className="text-slate-600 hover:text-primary-600 font-medium transition">Report Incident</Link>
            <Link to="/login" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium">
              <User className="h-4 w-4" />
              Sign In
            </Link>
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4">
          <Link to="/map" className="block py-2 text-slate-600">Live Map</Link>
          <Link to="/report" className="block py-2 text-slate-600">Report Incident</Link>
          <Link to="/login" className="block py-2 text-primary-600 font-bold">Sign In</Link>
        </div>
      )}
    </nav>
  );
}
""",
    "pages/Home.jsx": """import { Link } from 'react-router-dom';
import { AlertTriangle, Map, Phone, ShieldPlus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-danger-500/20 text-danger-300 font-semibold text-sm mb-6 border border-danger-500/30">
              Emergency Response System Active
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Fast Response. <br/><span className="text-primary-400">Better Coordination.</span> <br/>Saving Lives.
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto font-light">
              A comprehensive disaster management platform for citizens, rescue teams, and emergency services.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/report" className="px-8 py-4 bg-danger-600 hover:bg-danger-700 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-danger-600/30 flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Report Emergency
              </Link>
              <Link to="/map" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition backdrop-blur-sm border border-white/10 flex items-center justify-center gap-2">
                <Map className="h-5 w-5" />
                View Disaster Map
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOS Button Section */}
      <section className="py-12 bg-white -mt-8 relative z-10 mx-4 sm:mx-auto max-w-5xl rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Critical Emergency?</h2>
        <p className="text-slate-600 mb-6">Press the SOS button to instantly alert nearby rescue teams and broadcast your location.</p>
        <button onClick={() => alert('SOS Sent! Rescue teams alerted.')} className="h-32 w-32 rounded-full bg-danger-600 text-white shadow-2xl shadow-danger-600/50 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center mx-auto border-4 border-danger-400">
          <Phone className="h-8 w-8 mb-1" />
          <span className="font-bold text-xl tracking-wider">SOS</span>
        </button>
      </section>
      
      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Comprehensive Emergency Services</h2>
            <p className="mt-4 text-lg text-slate-600">Everything you need during a crisis, in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live Tracking</h3>
              <p className="text-slate-600">Interactive map showing active disasters, rescue teams, and available shelters in real-time.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="h-12 w-12 bg-success-100 text-success-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldPlus className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Shelter & Hospitals</h3>
              <p className="text-slate-600">Find nearby relief camps, hospitals, and emergency services instantly with occupancy details.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="h-12 w-12 bg-warning-100 text-warning-600 rounded-xl flex items-center justify-center mb-6">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Safety Alerts</h3>
              <p className="text-slate-600">Receive instant push notifications for approaching natural disasters and extreme weather.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
""",
    "pages/Login.jsx": """import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('citizen');

  const handleLogin = (e) => {
    e.preventDefault();
    toast.success('Logged in successfully');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input type="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Email address" />
            </div>
            <div>
              <input type="password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Login as</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
              <option value="citizen">Citizen</option>
              <option value="admin">Admin</option>
              <option value="rescue">Rescue Team</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition shadow-md">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
""",
    "pages/Dashboard.jsx": """import { AlertTriangle, Users, MapPin, Activity } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of system activity and emergency status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Disasters</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">12</p>
          </div>
          <div className="h-12 w-12 bg-danger-100 rounded-full flex items-center justify-center text-danger-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Rescue Teams</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">45</p>
          </div>
          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Available Shelters</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">8</p>
          </div>
          <div className="h-12 w-12 bg-success-100 rounded-full flex items-center justify-center text-success-600">
            <MapPin className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pending SOS Requests</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">23</p>
          </div>
          <div className="h-12 w-12 bg-warning-100 rounded-full flex items-center justify-center text-warning-600">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-medium text-slate-900">Recent Emergency Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger-100 text-danger-800">Flood</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Downtown Area</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Team Dispatched</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">10 mins ago</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">Fire</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Industrial Park</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Pending</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">25 mins ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
""",
    "pages/ReportDisaster.jsx": """import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ReportDisaster() {
  const [formData, setFormData] = useState({
    type: 'flood',
    severity: 'medium',
    description: '',
    location: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Disaster reported successfully! Authorities notified.');
    setFormData({ type: 'flood', severity: 'medium', description: '', location: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-bold text-slate-900">Report an Incident</h1>
          <p className="text-slate-600 mt-2">Please provide accurate information. False reporting is a punishable offense.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Disaster Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
                <option value="cyclone">Cyclone</option>
                <option value="landslide">Landslide</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity Level</label>
              <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="low">Low - Monitor Situation</option>
                <option value="medium">Medium - Needs Attention</option>
                <option value="high">High - Evacuation Needed</option>
                <option value="critical">Critical - Immediate Life Threat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location / Address</label>
            <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Enter specific location or landmark" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea required rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Describe the situation, number of affected people, etc."></textarea>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-danger-600 hover:bg-danger-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-danger-600/30 text-lg">
              Submit Emergency Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
""",
    "pages/MapView.jsx": """import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const mockDisasters = [
  { id: 1, pos: [28.6139, 77.2090], type: 'Flood', severity: 'High' },
  { id: 2, pos: [28.5355, 77.3910], type: 'Fire', severity: 'Medium' }
];

export default function MapView() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="bg-white p-4 shadow-sm z-10 border-b flex gap-4">
        <h2 className="font-bold text-lg text-slate-800">Live Disaster Map</h2>
        <div className="flex gap-2 text-sm items-center text-slate-600">
          <span className="w-3 h-3 rounded-full bg-danger-500"></span> Critical
          <span className="w-3 h-3 rounded-full bg-warning-500 ml-2"></span> Warning
          <span className="w-3 h-3 rounded-full bg-success-500 ml-2"></span> Safe Zone
        </div>
      </div>
      <div className="flex-1 relative z-0">
        <MapContainer center={[28.6139, 77.2090]} zoom={11} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mockDisasters.map(d => (
            <Marker key={d.id} position={d.pos}>
              <Popup>
                <div className="font-semibold text-danger-600">{d.type}</div>
                <div className="text-sm">Severity: {d.severity}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
"""
}

for rel_path, content in files.items():
    create_file(os.path.join(base_dir, rel_path), content)
    
print("React files generated successfully!")

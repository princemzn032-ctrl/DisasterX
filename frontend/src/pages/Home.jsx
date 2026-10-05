import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Activity, ArrowRight, HeartPulse, MapPin, Radio, Shield, Siren, Users, Waves, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/useLanguage';

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api').replace(/\/api\/?$/, '');
const copyrightYear = new Date().getFullYear();
const defaultStats = { activeDisasters: 0, peopleRescued: 0, openShelters: 0, volunteersOnline: 0 };
const getDeviceLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('This browser does not support location sharing'));
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, address: 'Current device location' }),
    () => reject(new Error('Location access is required to send an SOS. Enable location and try again.')),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
});

export default function Home({ initialSOS = false }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);
  const [incidents, setIncidents] = useState([]);
  const [sosOpen, setSosOpen] = useState(initialSOS);
  const [sosState, setSosState] = useState('ready');
  const [sosRequest, setSosRequest] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [statsResponse, disastersResponse] = await Promise.all([api.get('/stats'), api.get('/disasters')]);
      setStats(statsResponse.data);
      setIncidents(disastersResponse.data.filter((item) => !['resolved', 'closed'].includes(item.status)).slice(0, 3));
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        toast.error('Live data is unavailable. Start the backend with npm.cmd run dev in the backend folder.');
      } else {
        toast.error(error.response?.data?.message || 'Live data is unavailable.');
      }
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    const socket = io(apiOrigin, { transports: ['websocket', 'polling'], reconnectionAttempts: 3, reconnectionDelay: 5000 });
    socket.on('disaster:new', (incident) => {
      setIncidents((current) => [incident, ...current.filter((item) => item._id !== incident._id)].slice(0, 3));
      setStats((current) => ({ ...current, activeDisasters: current.activeDisasters + 1 }));
      toast('A new incident has been reported', { icon: '⚠️' });
    });
    socket.on('disaster:updated', refresh);
    socket.on('sos:new', () => toast('An SOS request needs attention', { icon: '🆘' }));
    socket.on('sos:updated', (request) => {
      setSosRequest((current) => current?._id === request._id ? request : current);
    });
    return () => socket.disconnect();
  }, [refresh]);

  const sendSOS = async () => {
    if (!user) {
      toast.error('Sign in to share your location with emergency responders');
      setSosOpen(false);
      navigate('/login');
      return;
    }
    try {
      setSosState('sending');
      const location = await getDeviceLocation();
      const { data } = await api.post('/sos', { location });
      setSosRequest(data);
      setSosState('sent');
      toast.success('SOS received by the response network');
    } catch (error) {
      setSosState('ready');
      toast.error(error.response?.data?.message || error.message || 'SOS could not be sent');
    }
  };

  return (
    <>
      <div className="home-page">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{t('heroKicker')}</span>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
              {t('heroLine1')}<br />{t('heroLine2')} <span>{t('heroLine3')}</span>
            </motion.h1>
            <p>{t('heroDescription')}</p>
            <div className="hero-ctas">
              <button className="btn btn-red" onClick={() => setSosOpen(true)}><Siren size={16} /> {t('emergencySOS')}</button>
              <Link to="/report" className="btn btn-plain"><Waves size={15} /> {t('reportIncident')}</Link>
              <Link to="/map" className="btn btn-quiet"><MapPin size={15} /> {t('openMap')}</Link>
            </div>
          </div>
          <div className="hero-art" aria-label="Live incident radar">
            <div className="radar"><i className="radar-point p1" /><i className="radar-point p2" /><i className="radar-point p3" /></div>
            <div className="radar-core"><Activity size={32} /></div>
            <span className="float-label label-a">N 28°36'14" · RESPONSE ZONE</span>
            <span className="float-label label-b">LIVE SIGNAL · 03 ACTIVE</span>
            <span className="float-label label-c">NETWORK STATUS · OPERATIONAL</span>
          </div>
        </section>

        <section className="metrics" aria-label="Live response statistics">
          <Metric icon={<Siren size={18} />} theme="red" value={stats.activeDisasters} label="Active incidents" />
          <Metric icon={<HeartPulse size={18} />} theme="green" value={stats.peopleRescued} label="People rescued" />
          <Metric icon={<Shield size={18} />} theme="cyan" value={stats.openShelters} label="Open shelters" />
          <Metric icon={<Users size={18} />} theme="amber" value={stats.volunteersOnline} label="Volunteers online" />
        </section>

        <div className="ticker"><span className="ticker-label"><Radio size={13} /> LIVE ALERTS</span><div className="ticker-items">{(incidents.length ? incidents : [{ title: 'Response network operational — no new incident alerts' }]).map((item, index) => <span key={item._id || index}>{item.title}</span>)}{incidents.map((item) => <span key={`copy-${item._id}`}>{item.title}</span>)}</div></div>

        <section>
          <div className="section-heading"><div><span className="eyebrow">Situation room</span><h2>{t('latestIncidents')}</h2><p>Verified signals from across the response network.</p></div><Link className="text-link" to="/map">Explore live map <ArrowRight size={14} /></Link></div>
          <div className="incident-grid">
            {incidents.map((incident) => <article className="panel incident-card" key={incident._id}>
              <div className="incident-top"><span className={`pill ${incident.severity}`}>{incident.severity} priority</span><span className="helper">{incident.type}</span></div>
              <h3>{incident.title}</h3><p>{incident.description}</p>
              <div className="incident-meta"><MapPin size={13} /> {incident.location?.address || 'Location unavailable'}</div>
            </article>)}
            {!incidents.length && <div className="panel empty-state">No active incidents are reported. Your community is being monitored.</div>}
          </div>
        </section>

        <section className="two-column">
          <div>
            <div className="section-heading"><div><span className="eyebrow">A clear response</span><h2>Help gets there, faster.</h2></div></div>
            <div className="steps-grid">
              <Step number="01" title="Raise the signal" text="Send a verified incident report or request help with your live location." />
              <Step number="02" title="Coordinate response" text="Response teams see priority, location and community needs in one place." />
              <Step number="03" title="Move to safety" text="Find an open shelter, follow local alerts and stay connected to updates." />
            </div>
          </div>
          <div>
            <div className="section-heading"><div><span className="eyebrow">Community support</span><h2>Emergency contacts</h2></div></div>
            <div className="panel helpline">
              <div className="phone-line"><span>National emergency</span><strong>112</strong></div>
              <div className="phone-line"><span>Disaster management</span><strong>1078</strong></div>
              <div className="phone-line"><span>Ambulance service</span><strong>108</strong></div>
            </div>
          </div>
        </section>

        <section className="two-column">
          <div className="panel map-preview">
            <span className="eyebrow">Field intelligence</span>
            <div className="map-pins"><i className="map-pin" /><i className="map-pin" /><i className="map-pin" /></div>
            <div className="map-caption"><span>INDIA · LIVE RESPONSE NETWORK</span><Link to="/map" className="text-link">Open map <ArrowRight size={13} /></Link></div>
          </div>
          <div className="panel helpline">
            <span className="eyebrow">Ready when needed</span><h2 style={{ fontSize: 21, margin: '12px 0 7px' }}>Every signal matters.</h2>
            <p className="helper" style={{ lineHeight: 1.8 }}>Share accurate information, check nearby shelters, and keep emergency lines clear for urgent requests.</p>
            <Link className="btn btn-plain" to="/shelters" style={{ marginTop: 12 }}>Find a safe shelter <ArrowRight size={14} /></Link>
          </div>
        </section>
      </div>
      <footer className="footer"><span>© {copyrightYear} DisasterX Response Network</span><span>Built for resilient communities · Emergency services: 112</span></footer>

      <AnimatePresence>
        {sosOpen && <div className="modal-backdrop" onClick={() => sosState !== 'sending' && setSosOpen(false)}>
          <motion.div className="panel sos-dialog" initial={{ opacity: 0, scale: .94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }} onClick={(event) => event.stopPropagation()}>
            <button aria-label="Close" className="icon-button dialog-close" onClick={() => setSosOpen(false)}><X size={17} /></button>
            <div className={`sos-emblem ${sosState === 'sending' ? 'sos-emblem-pulse' : ''}`}><Siren size={30} /></div>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Emergency channel</span>
            <h2>{sosState === 'sent' ? 'Help is on the way' : 'Send an SOS signal?'}</h2>
            <p>{sosState === 'sent' ? `Request ${String(sosRequest?._id || '').slice(-8)} is registered. Your location has been shared with response teams.` : 'Your current GPS location will be shared with the response network so nearby teams can locate you.'}</p>
            {sosState === 'sent' ? <div className="status-tracker"><span className="tracker-done">Signal received</span><span className={sosRequest?.status === 'dispatched' ? 'tracker-done' : ''}>Team dispatch</span><span className={sosRequest?.status === 'resolved' ? 'tracker-done' : ''}>Resolved</span></div> : <div className="hero-ctas" style={{ justifyContent: 'center' }}><button className="btn btn-quiet" onClick={() => setSosOpen(false)}>Cancel</button><button className="btn btn-red" onClick={sendSOS} disabled={sosState === 'sending'}>{sosState === 'sending' ? 'Acquiring GPS…' : 'Confirm emergency SOS'}</button></div>}
            {sosState === 'sent' && <button className="btn btn-plain" onClick={() => { setSosOpen(false); setSosState('ready'); }}>Close status</button>}
          </motion.div>
        </div>}
      </AnimatePresence>
    </>
  );
}

function Metric({ icon, theme, value, label }) {
  return <div className="metric-card"><div className={`metric-icon ${theme}`}>{icon}</div><div><motion.div key={value} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="metric-value">{Number(value || 0).toLocaleString()}</motion.div><div className="metric-label">{label}</div></div></div>;
}
function Step({ number, title, text }) {
  return <article className="panel step-card"><span className="step-num">{number} / RESPONSE</span><h3>{title}</h3><p>{text}</p></article>;
}

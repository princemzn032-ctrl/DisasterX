import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, AlertTriangle, Check, Plus, Shield, Siren, Users, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import api from '../api';

const blankShelter = { name: '', address: '', lat: '', lng: '', capacity: '', occupied: '0', contact: '', facilities: '' };
const apiOrigin = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api').replace(/\/api\/?$/, '');
const trendWindow = Array.from({ length: 7 }, (_, index) => {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - (6 - index));
  return { day: day.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }), date: day.toISOString().slice(0, 10) };
});
export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [disasters, setDisasters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [shelterOpen, setShelterOpen] = useState(false);
  const [shelterForm, setShelterForm] = useState(blankShelter);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [statsResponse, disastersResponse, sosResponse, sheltersResponse] = await Promise.all([
        api.get('/stats'), api.get('/disasters'), api.get('/sos'), api.get('/shelters')
      ]);
      setStats(statsResponse.data);
      setDisasters(disastersResponse.data);
      setRequests(sosResponse.data);
      setShelters(sheltersResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load command center data');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    const socket = io(apiOrigin, { transports: ['websocket', 'polling'], reconnectionAttempts: 3, reconnectionDelay: 5000 });
    ['disaster:new', 'disaster:updated', 'sos:new', 'sos:updated'].forEach((event) => socket.on(event, refresh));
    return () => socket.disconnect();
  }, [refresh]);

  const chartData = useMemo(() => {
    const byType = (stats.disasterTypes || []).reduce((result, item) => ({ ...result, [item._id]: item.count }), {});
    return ['flood', 'fire', 'earthquake', 'cyclone', 'landslide', 'other'].map((type) => ({ type, reports: byType[type] || 0 }));
  }, [stats.disasterTypes]);
  const trendData = useMemo(() => {
    return trendWindow.map(({ day, date }) => ({
      day,
      reports: disasters.filter((item) => item.createdAt?.slice(0, 10) === date).length
    }));
  }, [disasters]);
  const updateDisaster = async (id, status) => {
    try { await api.put(`/disasters/${id}`, { status }); toast.success(`Incident ${status}`); await refresh(); }
    catch (error) { toast.error(error.response?.data?.message || 'Incident update failed'); }
  };
  const rejectDisaster = async (id) => {
    try { await api.delete(`/disasters/${id}`); toast.success('Report removed'); await refresh(); }
    catch (error) { toast.error(error.response?.data?.message || 'Report could not be removed'); }
  };
  const updateSOS = async (id, status) => {
    try { await api.put(`/sos/${id}/status`, { status }); toast.success('SOS status updated'); await refresh(); }
    catch (error) { toast.error(error.response?.data?.message || 'SOS status update failed'); }
  };
  const addShelter = async (event) => {
    event.preventDefault();
    try {
      await api.post('/shelters', {
        name: shelterForm.name,
        location: { address: shelterForm.address, lat: Number(shelterForm.lat), lng: Number(shelterForm.lng) },
        capacity: Number(shelterForm.capacity), occupied: Number(shelterForm.occupied),
        contact: shelterForm.contact,
        facilities: shelterForm.facilities.split(',').map((facility) => facility.trim()).filter(Boolean)
      });
      setShelterOpen(false); setShelterForm(blankShelter); toast.success('Shelter added'); await refresh();
    } catch (error) { toast.error(error.response?.data?.message || 'Shelter could not be added'); }
  };
  const removeShelter = async (id) => {
    try { await api.delete(`/shelters/${id}`); toast.success('Shelter removed'); await refresh(); }
    catch (error) { toast.error(error.response?.data?.message || 'Shelter could not be removed'); }
  };
  const updateShelter = async (shelter, occupied) => {
    try { await api.put(`/shelters/${shelter._id}`, { occupied: Number(occupied) }); toast.success('Occupancy updated'); await refresh(); }
    catch (error) { toast.error(error.response?.data?.message || 'Occupancy could not be updated'); }
  };

  return <div className="content-wrap dashboard-wrap">
    <div className="page-title dashboard-title"><div><span className="eyebrow">Operations · Authorized administrator</span><h1>Command center</h1><p>Live response overview, incident triage, and resource coordination.</p></div><span className="live-indicator"><i /> LIVE OPERATIONS</span></div>
    <div className="dashboard-grid">
      <DashboardMetric icon={<AlertTriangle size={17} />} label="Active incidents" value={stats.activeDisasters} theme="red" />
      <DashboardMetric icon={<HeartPulseIcon />} label="People rescued" value={stats.peopleRescued} theme="green" />
      <DashboardMetric icon={<Shield size={17} />} label="Open shelters" value={stats.openShelters} theme="cyan" />
      <DashboardMetric icon={<Users size={17} />} label="Volunteers" value={stats.volunteersOnline} theme="amber" />
    </div>
    <section className="panel chart-panel">
      <div className="section-heading"><div><span className="eyebrow">Situation analysis</span><h2>Incident intelligence</h2></div><Activity size={17} color="var(--cyan)" /></div>
      <div className="chart-grid">
        <div><span className="chart-label">Active reports by type</span><div className="chart-canvas">
          <ResponsiveContainer><BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="type" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 11 }} /><Bar dataKey="reports" fill="#54d4e8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </div></div>
        <div><span className="chart-label">Reports received · last 7 days</span><div className="chart-canvas">
          <ResponsiveContainer><LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 11 }} /><Line type="monotone" dataKey="reports" stroke="#39c99a" strokeWidth={2} dot={{ fill: '#39c99a', r: 3 }} /></LineChart></ResponsiveContainer>
        </div></div>
      </div>
    </section>
    <section className="panel table-panel">
      <div className="table-heading"><div><span className="eyebrow">Review queue</span><h2>Incident reports <span className="count-badge">{disasters.length}</span></h2></div><span className="helper">Approve, resolve or remove reports</span></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Incident</th><th>Priority</th><th>Location</th><th>Reported</th><th>Status</th><th>Review action</th></tr></thead><tbody>
        {disasters.map((item) => <tr key={item._id}><td><b>{item.title}</b><small>{item.type} · {item.reportedBy?.name || 'Community report'}</small></td><td><span className={`pill ${item.severity}`}>{item.severity}</span></td><td>{item.location?.address}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><span className={`pill ${item.status === 'verified' ? 'open' : item.status}`}>{item.status}</span></td><td><div className="row-actions">{item.status !== 'verified' && item.status !== 'resolved' && <button className="table-action approve" onClick={() => updateDisaster(item._id, 'verified')} title="Approve report"><Check size={14} /></button>}{item.status !== 'resolved' && <button className="table-action resolve" onClick={() => updateDisaster(item._id, 'resolved')} title="Resolve report">Resolve</button>}<button className="table-action reject" onClick={() => rejectDisaster(item._id)} title="Remove report"><X size={14} /></button></div></td></tr>)}
        {!loading && !disasters.length && <tr><td colSpan="6" className="empty-state">No incident reports yet.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel table-panel">
      <div className="table-heading"><div><span className="eyebrow">Urgent requests</span><h2>SOS dispatch queue <span className="count-badge">{requests.length}</span></h2></div><Siren size={18} color="var(--red)" /></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Person</th><th>Location</th><th>Received</th><th>Status</th><th>Dispatch</th></tr></thead><tbody>
        {requests.map((request) => <tr key={request._id}><td><b>{request.userId?.name || 'Community member'}</b><small>{request.userId?.phone || request.emergencyType}</small></td><td>{request.location?.address}</td><td>{new Date(request.createdAt).toLocaleString()}</td><td><span className={`pill ${request.status === 'resolved' || request.status === 'Completed' ? 'open' : 'critical'}`}>{request.status}</span></td><td><select className="select-field compact-select" value={['sent', 'dispatched', 'resolved'].includes(request.status) ? request.status : request.status === 'Completed' ? 'resolved' : 'sent'} onChange={(event) => updateSOS(request._id, event.target.value)}><option value="sent">Signal received</option><option value="dispatched">Team dispatched</option><option value="resolved">Resolved</option></select></td></tr>)}
        {!loading && !requests.length && <tr><td colSpan="5" className="empty-state">No SOS requests have been received.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel table-panel">
      <div className="table-heading"><div><span className="eyebrow">Relief capacity</span><h2>Shelter management <span className="count-badge">{shelters.length}</span></h2></div><button className="btn btn-plain" onClick={() => setShelterOpen(true)}><Plus size={14} /> Add shelter</button></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Shelter</th><th>Location</th><th>Capacity</th><th>Occupancy</th><th>Facilities</th><th>Action</th></tr></thead><tbody>
        {shelters.map((shelter) => <tr key={shelter._id}><td><b>{shelter.name}</b></td><td>{shelter.location?.address}</td><td>{shelter.capacity}</td><td><input aria-label={`Occupancy for ${shelter.name}`} className="occupancy-input" type="number" min="0" max={shelter.capacity} defaultValue={shelter.occupied} onBlur={(event) => { if (Number(event.target.value) !== Number(shelter.occupied)) updateShelter(shelter, event.target.value); }} /></td><td>{(shelter.facilities || []).join(', ')}</td><td><button className="table-action reject" onClick={() => removeShelter(shelter._id)} title="Remove shelter"><X size={14} /></button></td></tr>)}
        {!loading && !shelters.length && <tr><td colSpan="6" className="empty-state">No shelters added.</td></tr>}
      </tbody></table></div>
    </section>
    {shelterOpen && <div className="modal-backdrop" onClick={() => setShelterOpen(false)}><div className="panel shelter-dialog" onClick={(event) => event.stopPropagation()}>
      <button className="icon-button dialog-close" aria-label="Close" onClick={() => setShelterOpen(false)}><X size={16} /></button><span className="eyebrow">Resource registry</span><h2>Add a relief shelter</h2>
      <form className="form-grid" onSubmit={addShelter}>{[['name','Shelter name'],['address','Address'],['lat','Latitude'],['lng','Longitude'],['capacity','Capacity'],['occupied','Current occupancy'],['contact','Contact number'],['facilities','Facilities (comma separated)']].map(([key,label]) => <div className="form-field" key={key}><label htmlFor={`shelter-${key}`}>{label}</label><input className="field" id={`shelter-${key}`} type={['lat','lng','capacity','occupied'].includes(key) ? 'number' : 'text'} step={['lat','lng'].includes(key) ? 'any' : undefined} required={key !== 'occupied' && key !== 'facilities'} value={shelterForm[key]} onChange={(e) => setShelterForm((current) => ({ ...current, [key]: e.target.value }))} /></div>)}<div className="form-field full"><button className="btn btn-red">Save shelter</button></div></form>
    </div></div>}
  </div>;
}

function DashboardMetric({ icon, label, value, theme }) {
  return <div className="metric-card"><div className={`metric-icon ${theme}`}>{icon}</div><div><div className="metric-value">{Number(value || 0).toLocaleString()}</div><div className="metric-label">{label}</div></div></div>;
}
function HeartPulseIcon() { return <Activity size={17} />; }

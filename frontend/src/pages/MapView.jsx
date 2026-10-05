import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Crosshair, Layers, MapPin, Search, Shield, Siren, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import api from '../api';
import toast from 'react-hot-toast';

const validPoint = (item) => Number.isFinite(Number(item.location?.lat)) && Number.isFinite(Number(item.location?.lng));
const apiOrigin = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api').replace(/\/api\/?$/, '');
function FocusPoint({ point }) {
  const map = useMap();
  useEffect(() => { if (point) map.flyTo([point.lat, point.lng], 12, { duration: .7 }); }, [map, point]);
  return null;
}

function FitDataBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(points, { padding: [36, 36], maxZoom: 11 });
  }, [map, points]);
  return null;
}

export default function MapView() {
  const [disasters, setDisasters] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [incidentResponse, shelterResponse, hospitalResponse] = await Promise.all([api.get('/disasters'), api.get('/shelters'), api.get('/hospitals')]);
      setDisasters(incidentResponse.data);
      setShelters(shelterResponse.data);
      setHospitals(hospitalResponse.data);
    } catch {
      toast.error('Map data could not be loaded. Check the API connection.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    const socket = io(apiOrigin, { transports: ['websocket', 'polling'], reconnectionAttempts: 3, reconnectionDelay: 5000 });
    socket.on('disaster:new', refresh);
    socket.on('disaster:updated', refresh);
    return () => socket.disconnect();
  }, [refresh]);

  const filteredIncidents = useMemo(() => disasters.filter((item) => validPoint(item) &&
    !['resolved', 'closed'].includes(item.status) &&
    (type === 'all' || item.type === type) &&
    (severity === 'all' || item.severity === severity) &&
    `${item.title} ${item.description} ${item.location?.address}`.toLowerCase().includes(query.toLowerCase())
  ), [disasters, type, severity, query]);
  const filteredShelters = useMemo(() => shelters.filter((item) => validPoint(item) &&
    `${item.name} ${item.location?.address} ${(item.facilities || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ), [shelters, query]);
  const filteredHospitals = useMemo(() => hospitals.filter((item) => validPoint(item) &&
    `${item.name} ${item.location?.address}`.toLowerCase().includes(query.toLowerCase())
  ), [hospitals, query]);
  const allPoints = useMemo(() => [...disasters, ...shelters, ...hospitals]
    .filter(validPoint)
    .map((item) => [Number(item.location.lat), Number(item.location.lng)]), [disasters, shelters, hospitals]);
  const center = selected?.location ? [selected.location.lat, selected.location.lng] : [28.6139, 77.2090];

  return <div className="map-layout">
    <aside className="map-sidebar">
      <span className="eyebrow">Field operations</span><h1 style={{ fontSize: 23, margin: '8px 0' }}>Live response map</h1>
      <p className="helper">Incident signals and safe locations across the network.</p>
      <div className="map-search"><Search size={15} /><input aria-label="Search map" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places or incidents" /></div>
      <div className="toolbar">
        <select aria-label="Filter by incident type" className="select-field" value={type} onChange={(e) => setType(e.target.value)}><option value="all">All incident types</option>{['flood', 'earthquake', 'fire', 'cyclone', 'landslide', 'other'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
        <select aria-label="Filter by severity" className="select-field" value={severity} onChange={(e) => setSeverity(e.target.value)}><option value="all">All priorities</option>{['critical', 'high', 'medium', 'low'].map((x) => <option key={x} value={x}>{x} priority</option>)}</select>
      </div>
      <div className="layer-controls">
        <label><input type="checkbox" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} /><span className="layer-dot red" /><Siren size={14} /> Incidents <b>{filteredIncidents.length}</b></label>
        <label><input type="checkbox" checked={showShelters} onChange={(e) => setShowShelters(e.target.checked)} /><span className="layer-dot green" /><Shield size={14} /> Shelters <b>{filteredShelters.length}</b></label>
        <label><input type="checkbox" checked={showHospitals} onChange={(e) => setShowHospitals(e.target.checked)} /><span className="layer-dot blue" /> Hospitals <b>{filteredHospitals.length}</b></label>
        <div className="map-legend"><Layers size={13} /> Heat rings indicate incident concentration</div>
      </div>
      <div className="map-results">
        <div className="list-label">ACTIVE INCIDENTS <span>{loading ? 'Loading…' : filteredIncidents.length}</span></div>
        {filteredIncidents.map((incident) => <button type="button" className={`map-incident${selected?._id === incident._id ? ' selected' : ''}`} key={incident._id} onClick={() => setSelected(incident)}>
          <span className={`pill ${incident.severity}`}>{incident.severity}</span><strong>{incident.title}</strong><small><MapPin size={11} /> {incident.location.address}</small>
        </button>)}
        {!loading && !filteredIncidents.length && <div className="helper empty-map-list">No matching active incidents.</div>}
      </div>
      {selected && <div className="selected-detail"><div className="list-label">SELECTED INCIDENT <button onClick={() => setSelected(null)}>Clear</button></div><b>{selected.title}</b><p>{selected.description}</p><small><Users size={12} /> {selected.affectedPeople || 0} people potentially affected</small></div>}
    </aside>
    <div className="map-canvas">
      <MapContainer center={center} zoom={10} scrollWheelZoom className="map-element">
        <FitDataBounds points={allPoints} />
        <FocusPoint point={selected?.location ? { lat: Number(selected.location.lat), lng: Number(selected.location.lng) } : null} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
          maxZoom={19}
        />
        {showIncidents && filteredIncidents.map((incident) => <Fragment key={`heat-${incident._id}`}>
          <Circle center={[Number(incident.location.lat), Number(incident.location.lng)]} radius={2200 + ({ low: 400, medium: 1000, high: 1800, critical: 2600 }[incident.severity] || 500)} pathOptions={{ color: '#f05252', fillColor: '#f05252', fillOpacity: .08, weight: 1 }} />
          <CircleMarker center={[Number(incident.location.lat), Number(incident.location.lng)]} radius={incident.severity === 'critical' ? 10 : 7} pathOptions={{ color: '#ff8181', fillColor: '#f05252', fillOpacity: .9, weight: 2 }} eventHandlers={{ click: () => setSelected(incident) }}>
            <Popup><b>{incident.title}</b><br />{incident.severity} priority · {incident.location.address}</Popup>
          </CircleMarker>
        </Fragment>)}
        {showShelters && filteredShelters.map((shelter) => <CircleMarker key={shelter._id} center={[Number(shelter.location.lat), Number(shelter.location.lng)]} radius={7} pathOptions={{ color: '#72e3b5', fillColor: '#39c99a', fillOpacity: .9, weight: 2 }} eventHandlers={{ click: () => setSelected(shelter) }}>
          <Popup><b>{shelter.name}</b><br />{shelter.occupied}/{shelter.capacity} occupants<br />{shelter.location.address}</Popup>
        </CircleMarker>)}
        {showHospitals && filteredHospitals.map((hospital) => <CircleMarker key={hospital._id} center={[Number(hospital.location.lat), Number(hospital.location.lng)]} radius={7} pathOptions={{ color: '#a4a5ff', fillColor: '#7374f2', fillOpacity: .9, weight: 2 }} eventHandlers={{ click: () => setSelected(hospital) }}>
          <Popup><b>{hospital.name}</b><br />{hospital.emergencyAvailable ? 'Emergency services available' : 'Emergency services unavailable'}<br />{hospital.location.address}</Popup>
        </CircleMarker>)}
      </MapContainer>
      <div className="map-live-badge"><span className="live-indicator"><i /> LIVE NETWORK</span><span><Crosshair size={13} /> {filteredIncidents.length} incidents</span></div>
    </div>
  </div>;
}

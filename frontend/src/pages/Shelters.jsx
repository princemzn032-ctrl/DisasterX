import { useEffect, useMemo, useState } from 'react';
import { Bed, Crosshair, MapPin, Navigation, Phone, Search, ShieldCheck, Users } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const distanceKm = (from, to) => {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latDelta = radians(Number(to.lat) - Number(from.lat));
  const lngDelta = radians(Number(to.lng) - Number(from.lng));
  const arc = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(Number(from.lat))) * Math.cos(radians(Number(to.lat))) *
    Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
};

export default function Shelters() {
  const [shelters, setShelters] = useState([]);
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shelters').then(({ data }) => setShelters(data))
      .catch(() => toast.error('Shelters are unavailable. Check the API connection.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleShelters = useMemo(() => shelters.filter((shelter) => {
    const textMatch = `${shelter.name} ${shelter.location?.address} ${(shelter.facilities || []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const available = Number(shelter.occupied) < Number(shelter.capacity) && shelter.status !== 'closed';
    return textMatch && (availability === 'all' || (availability === 'available' ? available : !available));
  }).sort((a, b) => userLocation
    ? distanceKm(a.location, userLocation) - distanceKm(b.location, userLocation)
    : 0), [shelters, query, availability, userLocation]);
  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error('This browser does not support location sharing');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => toast.error('Location access was not granted'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  const directions = (shelter) => {
    const { lat, lng } = shelter.location || {};
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
    } else toast.error('Directions are not available for this shelter yet');
  };

  return <div className="content-wrap">
    <div className="page-title"><span className="eyebrow">Safe locations · Community support</span><h1>Relief shelters</h1><p>Find verified safe locations, check live capacity, and plan a route to nearby support.</p></div>
    <div className="toolbar shelter-toolbar">
      <label className="search-field"><Search size={15} /><input aria-label="Search shelters" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, area or facility" /></label>
      <select className="select-field" aria-label="Filter shelter availability" value={availability} onChange={(e) => setAvailability(e.target.value)}><option value="all">All shelters</option><option value="available">Capacity available</option><option value="full">Full or closed</option></select>
      <button className="btn btn-quiet near-me-button" onClick={locateUser}><Crosshair size={14} /> {userLocation ? 'Sorted by distance' : 'Near me'}</button>
      <span className="helper">{visibleShelters.length} locations listed</span>
    </div>
    <div className="shelter-grid">
      {visibleShelters.map((shelter) => {
        const capacity = Number(shelter.capacity) || 0;
        const occupied = Number(shelter.occupied) || 0;
        const ratio = capacity ? Math.min(100, Math.round(occupied / capacity * 100)) : 0;
        const available = occupied < capacity && shelter.status !== 'closed';
        return <article className="panel shelter-card" key={shelter._id}>
          <div className="incident-top"><span className={`pill ${available ? 'open' : 'critical'}`}>{available ? 'Accepting guests' : 'At capacity'}</span><span className="helper">{shelter.status || 'open'}</span></div>
          <h3>{shelter.name}</h3>
          <div className="incident-meta"><MapPin size={13} /> {shelter.location?.address || 'Address not provided'}</div>
          {userLocation && <div className="incident-meta distance-label"><Navigation size={12} /> {distanceKm(shelter.location, userLocation).toFixed(1)} km from your location</div>}
          <div className="capacity-copy"><span><Users size={13} /> Occupancy</span><strong>{occupied.toLocaleString()} <i>/</i> {capacity.toLocaleString()}</strong></div>
          <div className="capacity-track"><div className="capacity-fill" style={{ width: `${ratio}%`, background: ratio > 85 ? '#f05252' : undefined }} /></div>
          <div className="capacity-caption"><span>{ratio}% occupied</span><span>{Math.max(0, capacity - occupied)} spaces</span></div>
          <div className="facility-list">{(shelter.facilities || []).map((facility) => <span key={facility}>{facility}</span>)}</div>
          <div className="shelter-actions"><a className="btn btn-quiet" href={`tel:${shelter.contact}`}><Phone size={14} /> {shelter.contact || 'Contact'}</a><button className="btn btn-plain" onClick={() => directions(shelter)}><Navigation size={14} /> Directions</button></div>
        </article>;
      })}
      {!loading && !visibleShelters.length && <div className="panel empty-state" style={{ gridColumn: '1/-1' }}><Bed size={22} style={{ margin: '0 auto 10px' }} />No shelters match these filters.</div>}
      {loading && <div className="panel empty-state" style={{ gridColumn: '1/-1' }}><ShieldCheck size={20} /> Loading verified shelter locations…</div>}
    </div>
  </div>;
}

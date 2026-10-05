import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Check, ChevronLeft, ChevronRight, Crosshair, ShieldAlert, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/useAuth';

const types = ['flood', 'earthquake', 'fire', 'cyclone', 'landslide', 'other'];
const maxImageSize = 8 * 1024 * 1024;
const fieldLabels = {
  title: 'Incident title',
  type: 'Incident type',
  severity: 'Severity',
  description: 'Description',
  affectedPeople: 'People affected',
  address: 'Location / landmark',
  lat: 'Latitude',
  lng: 'Longitude',
  images: 'Photos'
};
const getLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by this browser'));
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
    (error) => reject(new Error(
      error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Allow location access in your browser settings or enter coordinates manually.'
        : error.code === error.TIMEOUT
          ? 'Could not get your location in time. Try again or enter coordinates manually.'
          : 'Your current location is unavailable. Enter coordinates manually.'
    )),
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

export default function ReportDisaster() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ title: '', type: 'flood', severity: 'medium', description: '', address: '', lat: '', lng: '', affectedPeople: '0' });
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    return () => previews.forEach((file) => URL.revokeObjectURL(file.url));
  }, [previews]);
  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  const selectPhotos = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const fileError = selectedFiles.length > 4
      ? 'Choose no more than 4 images.'
      : selectedFiles.find((file) => !file.type.startsWith('image/'))
        ? 'Only image files can be uploaded.'
        : selectedFiles.find((file) => file.size > maxImageSize)
          ? 'Each image must be 8 MB or smaller.'
          : undefined;
    if (fileError) {
      event.target.value = '';
      setErrors((current) => ({ ...current, images: fileError }));
      setFiles([]);
      setPreviews([]);
      return;
    }
    setFiles(selectedFiles);
    setErrors((current) => {
      const next = { ...current };
      delete next.images;
      return next;
    });
    setPreviews(selectedFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })));
  };

  const locate = async () => {
    try {
      const { lat, lng } = await getLocation();
      set('lat', lat.toFixed(6));
      set('lng', lng.toFixed(6));
      if (!form.address) set('address', 'Current device location');
      toast.success('Your map pin has been placed');
    } catch (error) { toast.error(error.message); }
  };

  const continueToLocation = () => {
    const stepErrors = {};
    if (form.title.trim().length < 4) stepErrors.title = 'Enter a title with at least 4 characters.';
    if (form.description.trim().length < 10) stepErrors.description = 'Enter a description with at least 10 characters.';
    setErrors((current) => {
      const next = { ...current };
      delete next.title;
      delete next.description;
      return { ...next, ...stepErrors };
    });
    if (Object.keys(stepErrors).length) {
      toast.error(Object.entries(stepErrors).map(([field, message]) => `${fieldLabels[field]}: ${message}`).join('; '));
      return;
    }
    setStep(2);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!user) { toast.error('Sign in before submitting a report'); navigate('/login'); return; }
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        const isNumericField = key === 'lat' || key === 'lng' || key === 'affectedPeople';
        const numericValue = String(value).trim() === '' ? '' : String(Number(value));
        payload.append(key, isNumericField ? numericValue : value);
      });
      files.forEach((file) => payload.append('images', file));
      if (import.meta.env.DEV) {
        console.info('[Report] Submission payload', {
          fields: Object.fromEntries([...payload.entries()].filter(([, value]) => typeof value === 'string')),
          images: files.map(({ name, type, size }) => ({ name, type, size }))
        });
      }
      await api.post('/disasters', payload);
      toast.success('Incident report submitted to the response network');
      navigate('/map');
    } catch (error) {
      const response = error.response;
      if (import.meta.env.DEV) {
        console.error('[Report] Submission failed', {
          status: response?.status ?? null,
          body: response?.data ?? error.message
        });
      }
      const fieldErrors = response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
        setErrors(fieldErrors);
        const details = Object.entries(fieldErrors)
          .map(([field, message]) => `${fieldLabels[field] || field}: ${message}`)
          .join('; ');
        toast.error(details || response.data.message || 'Please check the submitted information');
      } else if (Array.isArray(fieldErrors)) {
        const mappedErrors = Object.fromEntries(fieldErrors.map(({ field, message }) => [field, message]));
        setErrors(mappedErrors);
        toast.error(fieldErrors.map(({ field, message }) => `${fieldLabels[field] || field}: ${message}`).join('; '));
      } else {
        toast.error(response?.data?.message || 'Unable to submit this report');
      }
    } finally { setLoading(false); }
  };
  const fieldMessage = (name) => errors[name] && <small id={`error-${name}`} className="field-error">{errors[name]}</small>;

  return <div className="content-wrap">
    <div className="page-title"><span className="eyebrow">Community intelligence · Report 01</span><h1>Report an incident</h1><p>Share accurate details so response teams can assess and coordinate help quickly.</p></div>
    <div className="panel form-panel">
      <div className="form-steps"><span className={step === 1 ? 'active' : 'done'}><i>{step > 1 ? <Check size={12} /> : '01'}</i> Incident details</span><span className={step === 2 ? 'active' : ''}><i>02</i> Location & evidence</span></div>
      <form onSubmit={submit}>
        {Object.entries(errors).some(([, message]) => message) && <div className="form-error-summary" role="alert">{Object.entries(errors).filter(([, message]) => message).map(([field, message]) => <div key={field}><strong>{fieldLabels[field] || field}:</strong> {message}</div>)}</div>}
        {step === 1 ? <div className="form-grid">
          <div className="form-field full"><label htmlFor="incident-title">Incident title</label><input id="incident-title" className="field" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'error-title' : undefined} required minLength="4" maxLength="120" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Rising water near the central bridge" />{fieldMessage('title')}</div>
          <div className="form-field"><label htmlFor="incident-type">Incident type</label><select id="incident-type" className="select-field" value={form.type} onChange={(e) => set('type', e.target.value)}>{types.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select>{fieldMessage('type')}</div>
          <div className="form-field"><label htmlFor="severity">Severity</label><select id="severity" className="select-field" value={form.severity} onChange={(e) => set('severity', e.target.value)}><option value="low">Low · Monitor</option><option value="medium">Medium · Attention needed</option><option value="high">High · Urgent response</option><option value="critical">Critical · Immediate danger</option></select>{fieldMessage('severity')}</div>
          <div className="form-field full"><label htmlFor="incident-description">What is happening?</label><textarea id="incident-description" className="textarea-field" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'error-description' : undefined} required minLength="10" maxLength="3000" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the situation, immediate risks, and assistance needed." />{fieldMessage('description')}</div>
          <div className="form-field full"><label htmlFor="affected">Estimated people affected (optional)</label><input id="affected" className="field" type="number" min="0" value={form.affectedPeople} onChange={(e) => set('affectedPeople', e.target.value)} />{fieldMessage('affectedPeople')}</div>
        </div> : <div className="form-grid">
          <div className="form-field full"><label htmlFor="address">Incident location / landmark</label><input id="address" className="field" aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'error-address' : undefined} required minLength="3" maxLength="200" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, neighborhood, or nearest landmark" />{fieldMessage('address')}</div>
          <div className="form-field"><label htmlFor="lat">Latitude</label><input id="lat" className="field" aria-invalid={Boolean(errors.lat)} aria-describedby={errors.lat ? 'error-lat' : undefined} type="number" required min="-90" max="90" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="e.g. 28.6139" />{fieldMessage('lat')}</div>
          <div className="form-field"><label htmlFor="lng">Longitude</label><input id="lng" className="field" aria-invalid={Boolean(errors.lng)} aria-describedby={errors.lng ? 'error-lng' : undefined} type="number" required min="-180" max="180" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="e.g. 77.2090" />{fieldMessage('lng')}</div>
          <div className="form-field full"><button type="button" className="btn btn-plain" onClick={locate}><Crosshair size={15} /> Use my current location</button><span className="helper">Your browser will ask permission to access GPS. You can also enter coordinates manually.</span></div>
          <div className="form-field full"><label>Photos (optional, up to 4 images)</label><label className="upload-area" htmlFor="evidence"><Upload size={18} style={{ margin: '0 auto 6px' }} /><div>Choose photos of the incident · 8 MB each max</div><input id="evidence" type="file" accept="image/*" multiple onChange={selectPhotos} /></label>{fieldMessage('images')}{previews.length > 0 && <div className="preview-list">{previews.map((file) => <div key={file.name}><img src={file.url} alt={file.name} /><span>{file.name}</span></div>)}</div>}</div>
        </div>}
        <div className="form-actions">
          {step === 1 ? <span className="helper"><ShieldAlert size={13} /> Reports are reviewed by response teams.</span> : <button type="button" className="btn btn-quiet" onClick={() => setStep(1)}><ChevronLeft size={15} /> Back</button>}
          {step === 1 ? <button type="button" className="btn btn-plain" onClick={continueToLocation}>Location & evidence <ChevronRight size={15} /></button> : <button className="btn btn-red" disabled={loading}>{loading ? 'Submitting report…' : <><Camera size={15} /> Submit incident report</>}</button>}
        </div>
      </form>
    </div>
    {!user && <p className="helper" style={{ textAlign: 'center', marginTop: 15 }}>You’ll need to <Link to="/login" className="text-link">sign in</Link> before submitting your report.</p>}
  </div>;
}

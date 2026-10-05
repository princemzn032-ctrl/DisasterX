import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/useAuth';

export default function Login({ initialMode = 'login' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const registering = initialMode === 'register' || location.pathname === '/register';
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'citizen' });
  const [loading, setLoading] = useState(false);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(registering ? '/auth/register' : '/auth/login', form);
      signIn(data);
      toast.success(registering ? 'Your account is ready' : `Welcome back, ${data.name}`);
      navigate(data.role === 'admin' ? '/dashboard' : '/', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message ||
        (error.code === 'ERR_NETWORK'
          ? 'Cannot reach the API. Start the backend with npm.cmd run dev in the backend folder.'
          : 'Authentication failed. Please check your details and try again.');
      toast.error(message);
    } finally { setLoading(false); }
  };

  return <div className="auth-screen">
    <section className="auth-visual">
      <Link to="/" className="brand"><span className="brand-mark"><Activity size={19} /></span><span>disaster<span className="brand-x">X</span><small>RESPONSE NETWORK</small></span></Link>
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <span className="eyebrow">A safer response starts together</span>
        <h1>Prepared people.<br /><span style={{ color: 'var(--cyan)' }}>Stronger communities.</span></h1>
        <p>One secure place to report emergencies, find support, and coordinate people who are ready to help.</p>
      </motion.div>
      <div className="auth-feature"><span><ShieldCheck size={16} /></span>Secure, role-aware access for communities and responders</div>
    </section>
    <section className="auth-form-wrap"><motion.div className="auth-form" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }}>
      <span className="eyebrow">{registering ? 'Join the response network' : 'Secure access'}</span>
      <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
      <p>{registering ? 'Choose how you’ll contribute. Admin access is provisioned by the system.' : 'Sign in to access your DisasterX account.'}</p>
      <form onSubmit={submit}>
        {registering && <>
          <div className="form-field"><label htmlFor="name">Full name</label><input id="name" className="field" required minLength="2" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" /></div>
          <div className="role-switch" aria-label="Choose account role">{['citizen', 'volunteer'].map((role) => <button type="button" key={role} className={form.role === role ? 'selected' : ''} onClick={() => set('role', role)}>{role === 'citizen' ? 'Community member' : 'Volunteer'}</button>)}</div>
        </>}
        <div className="form-field"><label htmlFor="email">Email address</label><div className="input-with-icon"><Mail size={15} /><input id="email" className="field" type="email" required autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.org" /></div></div>
        {registering && <div className="form-field"><label htmlFor="phone">Phone (optional)</label><input id="phone" className="field" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 00000 00000" /></div>}
        <div className="form-field"><label htmlFor="password">Password</label><div className="input-with-icon"><LockKeyhole size={15} /><input id="password" className="field" type="password" required minLength={registering ? 8 : 1} autoComplete={registering ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={registering ? 'At least 8 characters' : 'Enter your password'} /></div></div>
        <button className="btn btn-red auth-submit" disabled={loading}>{loading ? 'Please wait…' : <>{registering ? 'Create account' : 'Sign in'} <ArrowRight size={15} /></>}</button>
      </form>
      <div className="auth-switch">{registering ? 'Already have an account?' : 'New to DisasterX?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></div>
      {!registering && <div className="demo-access">
        <UserRound size={14} />
        <span>Demo admin · existing project account</span>
        <code>admin@dms.com</code><code>password</code>
        <span className="demo-secondary">New demo account</span>
        <code>admin@disasterx.org</code><code>DisasterX2026!</code>
      </div>}
    </motion.div></section>
  </div>;
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Menu, Moon, Shield, Sun, X, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/useLanguage';

const links = [
  { to: '/map', label: 'Live map' },
  { to: '/report', label: 'Report' },
  { to: '/shelters', label: 'Shelters' }
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(() => localStorage.getItem('theme') === 'light');
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }, [light]);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? 'light' : 'dark';
    localStorage.setItem('theme', next ? 'light' : 'dark');
  };
  const logout = () => {
    signOut();
    toast.success('You have been signed out');
    navigate('/');
    setOpen(false);
  };
  const navClass = ({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark"><Activity size={19} strokeWidth={2.7} /></span>
          <span>disaster<span className="brand-x">X</span><small>RESPONSE NETWORK</small></span>
        </Link>
        <nav className={`nav-links${open ? ' nav-open' : ''}`}>
          <NavLink to="/" end className={navClass} onClick={() => setOpen(false)}>{t('overview')}</NavLink>
          {links.map((link) => <NavLink key={link.to} to={link.to} className={navClass} onClick={() => setOpen(false)}>{t(link.to === '/map' ? 'liveMap' : link.to === '/report' ? 'report' : 'shelters')}</NavLink>)}
          {user?.role === 'admin' && <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>{t('commandCenter')}</NavLink>}
          <div className="mobile-nav-actions">
            {user ? <button className="nav-link" onClick={logout}><LogOut size={16} /> {t('signOut')}</button> : <Link to="/login" className="nav-link" onClick={() => setOpen(false)}>{t('signIn')}</Link>}
          </div>
        </nav>
        <div className="topbar-actions">
          <span className="live-indicator"><i /> {t('live')}</span>
          <button className="language-button" onClick={toggleLanguage} aria-label="Toggle English or Hindi">{language === 'en' ? 'हिं' : 'EN'}</button>
          <button className="icon-button theme-button" aria-label="Toggle color theme" onClick={toggleTheme}>{light ? <Moon size={17} /> : <Sun size={17} />}</button>
          {user ? (
            <div className="user-chip"><span className="user-avatar">{user.name?.charAt(0).toUpperCase()}</span><span>{user.name?.split(' ')[0]}</span><button title="Sign out" onClick={logout}><LogOut size={15} /></button></div>
          ) : <Link to="/login" className="sign-in-button"><Shield size={15} /> {t('signIn')}</Link>}
          <button className="icon-button menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
    </header>
  );
}

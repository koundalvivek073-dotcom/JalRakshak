import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Bell, Camera, Check, ChevronDown, Clock3, Compass, Droplets, FileCheck2, Home, Leaf, LogIn, LogOut, Mail, Map as MapIcon, MapPin, Menu, Moon, Phone, Plus, Radio, Save, ShieldCheck, Sparkles, Sun, Truck, UserRound, X } from 'lucide-react';
import BorewellMap from './components/BorewellMap';
import HealthAlerts from './components/HealthAlerts';
import ImpactStats from './components/ImpactStats';
import Scanner from './components/Scanner';
import TankerRegistry from './components/TankerRegistry';
import PreviousLogs from './components/PreviousLogs';
import { borewells, defaultScan, tankers } from './data';
import { apiUrl } from './api';
import { supabase } from './supabase';

export default function App() {
  const [dark, setDark] = useState(false);
  const [scan, setScan] = useState(defaultScan);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [logOpen, setLogOpen] = useState(false);
  const [logState, setLogState] = useState('idle');
  const [saveNotice, setSaveNotice] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lastLoggedAt, setLastLoggedAt] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authMethod, setAuthMethod] = useState('password');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [waterAlert, setWaterAlert] = useState('');
  const [authForm, setAuthForm] = useState({ identifier: '', password: '', otp: '', fullName: '', username: '', age: '', mobile: '', email: '' });
  const [testForm, setTestForm] = useState({ location: 'Browser scan point', latitude: '', longitude: '', ph: defaultScan.ph, fluoride: defaultScan.fluoride, nitrates: defaultScan.nitrates, hardness: defaultScan.hardness });
  const [locationStatus, setLocationStatus] = useState('');

  const handleScan = (result) => {
    setScan(result);
    setTestForm((current) => ({ ...current, location: result.location || current.location, latitude: result.latitude ?? current.latitude, longitude: result.longitude ?? current.longitude, ph: result.ph, fluoride: result.fluoride, nitrates: result.nitrates, hardness: result.hardness }));
    const scanStatus = result.status || getWaterStatus(result);
    if (scanStatus === 'safe' || scanStatus === 'contaminated') { setWaterAlert(scanStatus); window.setTimeout(() => setWaterAlert(''), 10000); }
  };

  const openLogForm = () => {
    setTestForm((current) => ({ ...current, ph: scan.ph, fluoride: scan.fluoride, nitrates: scan.nitrates, hardness: scan.hardness }));
    setLogOpen(true);
    if (!navigator.geolocation) { setLocationStatus('Enter latitude and longitude manually.'); return; }
    setLocationStatus('Finding your location...');
    navigator.geolocation.getCurrentPosition(({ coords }) => { setTestForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })); setLocationStatus('Location found'); }, () => setLocationStatus('Location unavailable. Enter coordinates manually.'), { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  };

  const updateTestField = (field, value) => setTestForm((current) => ({ ...current, [field]: value }));

  const navigateTo = (destination) => {
    setMenuOpen(false);
    if (destination === 'scan') {
      setActivePage('scan');
      window.location.hash = 'scan';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activePage !== 'home') {
      setActivePage('home');
      history.pushState(null, '', window.location.pathname + (destination === 'home' ? '' : `#${destination}`));
      setTimeout(() => {
        const el = document.getElementById(destination === 'home' ? 'top' : destination);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } else {
      if (destination === 'home') {
        history.pushState(null, '', window.location.pathname);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.hash = destination;
        const el = document.getElementById(destination);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getWaterStatus = (values) => { const contaminated = Number(values.fluoride) > 1.5 || Number(values.ph) < 6.5 || Number(values.ph) > 8.5; if (contaminated) return 'contaminated'; return Number(values.nitrates) > 45 || Number(values.hardness) > 600 ? 'caution' : 'safe'; };

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'scan') {
        setActivePage('scan');
      } else {
        setActivePage('home');
        if (hash === 'map' || hash === 'registry') {
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) setSessionUser(data.session?.user || null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSessionUser(nextSession?.user || null));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const recordAuthEvent = async (user, eventType, provider, metadata = {}) => {
    if (!user) return;
    await supabase.from('auth_events').insert([{ user_id: user.id, event_type: eventType, provider, metadata }]);
  };

  const saveProfile = async (user, extra = {}) => {
    if (!user) return;
    const profile = { id: user.id, email: extra.email || user.email || null, mobile: extra.mobile || user.phone || null, full_name: extra.fullName || user.user_metadata?.full_name || null, username: extra.username || user.user_metadata?.username || null, age: extra.age ? Number(extra.age) : null, avatar_url: user.user_metadata?.avatar_url || null };
    await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
  };

  const openAuth = (mode = 'login') => { setAuthMode(mode); setAuthError(''); setAuthMessage(''); setAuthOpen(true); };
  const updateAuthField = (field, value) => setAuthForm((current) => ({ ...current, [field]: value }));

  const submitAuth = async (event) => {
    event.preventDefault(); setAuthBusy(true); setAuthError(''); setAuthMessage('');
    try {
      if (authMethod === 'oauth') {
        const { error } = await supabase.auth.signInWithOAuth({ provider: authForm.identifier || 'google', options: { redirectTo: window.location.origin } });
        if (error) throw error;
        return;
      }
      if (authMethod === 'phone') {
        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({ phone: authForm.mobile, options: { channel: 'sms' } });
          if (error) throw error;
          setOtpSent(true); setAuthMessage('OTP sent. Enter the code received on your phone.'); await recordAuthEvent(sessionUser, 'otp_requested', 'phone'); return;
        }
        const { data, error } = await supabase.auth.verifyOtp({ phone: authForm.mobile, token: authForm.otp, type: 'sms' });
        if (error) throw error;
        await saveProfile(data.user, authForm); await recordAuthEvent(data.user, 'otp_verified', 'phone'); setSessionUser(data.user); setAuthOpen(false); return;
      }
      const identifier = authForm.identifier.trim();
      let email = identifier;
      if (!identifier.includes('@')) {
        const { data: profile, error: lookupError } = await supabase.from('profiles').select('email').eq('username', identifier).maybeSingle();
        if (lookupError || !profile?.email) throw new Error('Use your email address or a username linked to an email account.');
        email = profile.email;
      }
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password: authForm.password, options: { data: { full_name: authForm.fullName, username: authForm.username } } });
        if (error) throw error;
        if (data.user) { await saveProfile(data.user, authForm); await recordAuthEvent(data.user, 'signup', 'password'); }
        setAuthMessage('Account created. Check your email if confirmation is enabled.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: authForm.password });
        if (error) throw error;
        await saveProfile(data.user, authForm); await recordAuthEvent(data.user, 'login', 'password'); setSessionUser(data.user); setAuthOpen(false);
      }
    } catch (error) { setAuthError(error.message || 'Authentication failed.'); }
    finally { setAuthBusy(false); }
  };

  const logout = async () => { if (sessionUser) await recordAuthEvent(sessionUser, 'logout', 'session'); await supabase.auth.signOut(); setProfileOpen(false); setSessionUser(null); };

  const submitTest = async (event) => {
    event.preventDefault();
    setLogState('saving');

    const status = getWaterStatus(testForm);

    try {
      const payload = {
        location: testForm.location || 'North Bengaluru',
        latitude: parseFloat(testForm.latitude),
        longitude: parseFloat(testForm.longitude),
        ph: parseFloat(testForm.ph) || 7.0,
        fluoride: parseFloat(testForm.fluoride) || 0.0,
        nitrates: parseFloat(testForm.nitrates) || 0.0,
        hardness: parseFloat(testForm.hardness) || 0.0,
        status: status || 'safe',
        safety_score: parseInt(testForm.safety_score, 10) || 80,
      };

      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) || payload.latitude < 6.5 || payload.latitude > 35.7 || payload.longitude < 68 || payload.longitude > 97.5) {
        setLogState('error');
        setLocationStatus('Enter a valid location within India or allow browser location access.');
        return;
      }

      const response = await fetch(apiUrl('/api/tests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          location: payload.location,
        }),
      });
      const savedRecord = await response.json().catch(() => null);

      if (!response.ok || !savedRecord) {
        console.error('Backend save error:', savedRecord);
        setLogState('error');
        return;
      }

      setLogState('saved');
      setSaveNotice('Saved and verified on the community map');
      setLastLoggedAt(new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }));
      setNotificationOpen(true);
      setContributionOpen(true);
      window.dispatchEvent(new CustomEvent('jalrakshak:test-created', { detail: savedRecord }));
      window.setTimeout(() => { setLogOpen(false); setLogState('idle'); }, 700);
      window.setTimeout(() => setSaveNotice(''), 4200);
    } catch (err) {
      console.error('Form execution error:', err);
      setLogState('error');
    }
  };

  return <div className={`app${dark ? ' dark' : ''}${waterAlert ? ` water-alert-${waterAlert}` : ''}`}>
    <div className="water-pour-scene" aria-hidden="true"><span className="water-fill-layer" /><span className="water-source" /><span className="water-stream" /><span className="water-stream-glint" /><span className="water-drop drop-one" /><span className="water-drop drop-two" /><span className="water-drop drop-three" /><span className="water-pool" /></div>
    {waterAlert === 'contaminated' && <div className="water-warning-overlay contaminated-overlay" aria-hidden="true"><AlertTriangle size={112} strokeWidth={1.4} /><strong>CONTAMINATED WATER</strong></div>}
    {waterAlert === 'safe' && <div className="water-warning-overlay safe-overlay" aria-hidden="true"><Leaf size={112} strokeWidth={1.4} /><strong>YOU ARE SAFE</strong></div>}
    <header className="topbar"><button className="brand brand-button" onClick={() => navigateTo('home')}><span className="brand-mark"><Droplets size={19} /></span><span>Jal<span>Rakshak</span></span></button><nav><button className={activePage === 'home' ? 'tab-link active' : 'tab-link'} onClick={() => navigateTo('home')}>Home</button><button className="tab-link" onClick={() => navigateTo('map')}>Community map</button><button className={activePage === 'scan' ? 'tab-link active' : 'tab-link'} onClick={() => navigateTo('scan')}>Scan strip</button><button className="tab-link" onClick={() => navigateTo('registry')}>Tanker registry</button></nav><div className="top-actions"><button className="icon-button" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className={`icon-button notification ${notificationOpen ? 'is-active' : ''}`} title="Notifications" onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={17} />{lastLoggedAt && <i />}</button>{sessionUser ? <button className="profile" title="Open account" onClick={() => setProfileOpen(!profileOpen)}><span>{(sessionUser.user_metadata?.full_name || sessionUser.email || 'U').slice(0, 2).toUpperCase()}</span><strong>{sessionUser.user_metadata?.full_name || sessionUser.email || 'Account'}</strong><ChevronDown size={14} /></button> : <button className="login-button" onClick={() => openAuth('login')}><LogIn size={15} /> Log in</button>}<button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></button></div></header>
    {notificationOpen && <div className="notification-panel"><div className="notification-panel-head"><span>Notifications</span><button className="icon-button" title="Close notifications" onClick={() => setNotificationOpen(false)}><X size={15} /></button></div>{lastLoggedAt ? <button className="notification-item" onClick={() => setContributionOpen(true)}><span className="notification-icon"><FileCheck2 size={17} /></span><span><strong>Log submitted successfully</strong><small>Your water test is now on the community map.</small><em>{lastLoggedAt}</em></span></button> : <p className="notification-empty">Your verified community updates will appear here.</p>}</div>}
    {profileOpen && <div className="profile-panel"><div className="profile-panel-avatar"><UserRound size={18} /></div><div><strong>{sessionUser?.user_metadata?.full_name || sessionUser?.email || 'Community member'}</strong><span>{sessionUser?.phone || sessionUser?.email || 'Verified contributor'}</span></div><button className="icon-button" title="Close account" onClick={() => setProfileOpen(false)}><X size={15} /></button><div className="profile-panel-status"><span className="online-dot" /> Logged in and contributing <button className="profile-logout" onClick={logout}><LogOut size={13} /> Log out</button></div></div>}
    {menuOpen && <div className="mobile-nav"><button className="tab-link" onClick={() => navigateTo('home')}>Home</button><button className="tab-link" onClick={() => navigateTo('map')}>Community map</button><button className="tab-link" onClick={() => navigateTo('scan')}>Scan strip</button><button className="tab-link" onClick={() => navigateTo('registry')}>Tanker registry</button></div>}
    <main id="top">
      {activePage === 'home' && (
        <>
          <section className="hero" id="overview">
            <div>
              <div className="live-label"><Radio size={14} /> Community network live <span>·</span> India</div>
              <h1>Know your water.<br /><em>Protect your neighbourhood.</em></h1>
              <p className="hero-copy">JalRakshak turns everyday water tests into a shared early-warning network for families, farms, and the aquifer below.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => navigateTo('scan')}><Camera size={17} /> Start a water scan</button>
                <button className="secondary-button" onClick={() => navigateTo('map')}><MapIcon size={16} /> Open community map</button>
                <button className="secondary-button" onClick={openLogForm}><Save size={16} /> Log a new test</button>
              </div>
            </div>
            <div className="hero-score">
              <div className="score-ring"><strong>78</strong><span>network<br />health</span></div>
              <div><span>Community network</span><strong className="score-up">Live</strong></div>
            </div>
          </section>

          <ImpactStats />

          <section className="feature-hub">
            <div className="feature-hub-header">
              <div>
                <p className="eyebrow"><Sparkles size={14} /> Features & Modules</p>
                <h2>Choose a feature to open</h2>
              </div>
              <span className="sync-note"><ShieldCheck size={16} /> Verified community data</span>
            </div>

            <div className="feature-cards-grid">
              <article className="feature-card">
                <div className="feature-card-top">
                  <span className="feature-card-badge"><Radio size={12} /> Live Network</span>
                  <div className="feature-card-icon"><MapIcon size={24} /></div>
                  <h3>Community Aquifer Map</h3>
                  <p>Interactive geographic mapping of local borewells, Fluoride plumes, and real-time community water test safety scores.</p>
                </div>
                <div className="feature-card-bottom">
                  <div className="feature-card-meta"><span>5 Active borewells</span><span>·</span><span>82% Coverage</span></div>
                  <button className="feature-card-btn" onClick={() => navigateTo('map')}>
                    <span>Open Community Map</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>

              <article className="feature-card">
                <div className="feature-card-top">
                  <span className="feature-card-badge"><Camera size={12} /> Camera Vision</span>
                  <div className="feature-card-icon coral"><Camera size={24} /></div>
                  <h3>Water Strip Scanner</h3>
                  <p>In-browser RGB colorimetry reader converting ₹5 test strip photos into instant Fluoride, pH, and Nitrate readings.</p>
                </div>
                <div className="feature-card-bottom">
                  <div className="feature-card-meta"><span>Instant calibration</span><span>·</span><span>4 Parameters</span></div>
                  <button className="feature-card-btn" onClick={() => navigateTo('scan')}>
                    <span>Open Water Scanner</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>

              <article className="feature-card">
                <div className="feature-card-top">
                  <span className="feature-card-badge"><ShieldCheck size={12} /> Verified Network</span>
                  <div className="feature-card-icon amber"><Truck size={24} /></div>
                  <h3>Tanker Supply Registry</h3>
                  <p>Crowdsourced directory of private water suppliers with verified quality ratings, contamination reports, and service routes.</p>
                </div>
                <div className="feature-card-bottom">
                  <div className="feature-card-meta"><span>4.8★ Avg rating</span><span>·</span><span>Verified routes</span></div>
                  <button className="feature-card-btn" onClick={() => navigateTo('registry')}>
                    <span>Open Tanker Registry</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            </div>
          </section>
        </>
      )}

      {activePage === 'map' && (
        <div className="feature-page" id="map">
          <div className="subpage-nav-bar">
            <button className="back-home-button" onClick={() => navigateTo('home')} title="Return to Home">
              <ArrowLeft size={16} />
              <span>Return to Home</span>
            </button>
            <div className="subpage-breadcrumb">
              <button className="crumb-link" onClick={() => navigateTo('home')}>Home</button>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Community map</span>
            </div>
          </div>
          <div className="section-grid">
            <BorewellMap locations={borewells} />
            <div className="side-column">
              <HealthAlerts scan={scan} />
              <div className="coverage panel">
                <div><p className="eyebrow">Neighbourhood pulse</p><h2>Coverage this week</h2></div>
                <div className="coverage-number"><strong>82%</strong><span>of mapped homes</span></div>
                <div className="progress"><span /></div>
                <p className="muted-copy">24 new tests logged across 6 streets. Keep the network growing.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePage === 'scan' && (
        <div className="scan-page" id="scan">
          <div className="subpage-nav-bar">
            <button className="back-home-button" onClick={() => navigateTo('home')} title="Return to Home">
              <ArrowLeft size={16} />
              <span>Return to Home</span>
            </button>
            <div className="subpage-breadcrumb">
              <button className="crumb-link" onClick={() => navigateTo('home')}>Home</button>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Scan strip</span>
            </div>
          </div>
          <div className="scan-page-columns">
            <div className="lower-grid">
              <Scanner onScan={handleScan} />
            </div>
            <PreviousLogs />
          </div>
        </div>
      )}

      {activePage === 'registry' && (
        <div className="feature-page" id="registry">
          <div className="subpage-nav-bar">
            <button className="back-home-button" onClick={() => navigateTo('home')} title="Return to Home">
              <ArrowLeft size={16} />
              <span>Return to Home</span>
            </button>
            <div className="subpage-breadcrumb">
              <button className="crumb-link" onClick={() => navigateTo('home')}>Home</button>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Tanker registry</span>
            </div>
          </div>
          <div className="single-page-view">
            <TankerRegistry tankers={tankers} />
          </div>
        </div>
      )}
    </main>
    <footer className="site-footer">
      <div className="footer-nav">
        <button className={`footer-nav-link${activePage === 'home' ? ' active' : ''}`} onClick={() => navigateTo('home')}>Home</button>
        <button className={`footer-nav-link${activePage === 'map' ? ' active' : ''}`} onClick={() => navigateTo('map')}>Community Map</button>
        <button className={`footer-nav-link${activePage === 'scan' ? ' active' : ''}`} onClick={() => navigateTo('scan')}>Scan Strip</button>
        <button className={`footer-nav-link${activePage === 'registry' ? ' active' : ''}`} onClick={() => navigateTo('registry')}>Tanker Registry</button>
      </div>
      <div className="footer-bottom">
        <span>JalRakshak <b>·</b> Community water intelligence</span>
        <span>Data is crowdsourced and should be confirmed by a certified lab.</span>
        <span className="footer-links">Privacy · Guidelines</span>
      </div>
    </footer>
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      <button className={`bottom-nav-item${activePage === 'home' ? ' active' : ''}`} onClick={() => navigateTo('home')}>
        <Home size={18} />
        <span>Home</span>
      </button>
      <button className={`bottom-nav-item${activePage === 'map' ? ' active' : ''}`} onClick={() => navigateTo('map')}>
        <MapIcon size={18} />
        <span>Live Map</span>
      </button>
      <button className={`bottom-nav-item${activePage === 'scan' ? ' active' : ''}`} onClick={() => navigateTo('scan')}>
        <Camera size={18} />
        <span>Scan</span>
      </button>
      <button className={`bottom-nav-item${activePage === 'registry' ? ' active' : ''}`} onClick={() => navigateTo('registry')}>
        <Truck size={18} />
        <span>Registry</span>
      </button>
    </nav>
    {saveNotice && <div className="save-toast" role="status" aria-live="polite"><Check size={18} /><span><strong>Saved</strong>{saveNotice}</span></div>}
    {contributionOpen && <div className="contribution-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContributionOpen(false); }}><article className="contribution-card"><button className="contribution-close icon-button" title="Close contribution note" onClick={() => setContributionOpen(false)}><X size={18} /></button><div className="document-seal"><FileCheck2 size={30} /></div><p className="eyebrow">Community contribution · Verified</p><h2>Thank you for helping protect our water.</h2><p className="contribution-copy">Your contribution means a lot. This water record gives your neighbourhood a clearer view of its aquifer and helps families make informed decisions.</p><div className="contribution-rule" /><div className="contribution-meta"><span><Clock3 size={14} /> Logged {lastLoggedAt}</span><span><MapPin size={14} /> {testForm.location}</span></div><p className="contribution-footer">Logged in as <strong>Ananya K.</strong> · Your voice is part of the network.</p><button className="primary-button contribution-action" onClick={() => setContributionOpen(false)}>Continue to community map <Check size={16} /></button></article></div>}
    {authOpen && <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><form className="auth-modal" onSubmit={submitAuth}><button type="button" className="auth-close icon-button" title="Close login" onClick={() => setAuthOpen(false)}><X size={18} /></button><div className="auth-brand"><span className="brand-mark"><Droplets size={18} /></span><div><p className="eyebrow">JalRakshak account</p><h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2></div></div><p className="auth-copy">Sign in to save your profile, water logs, and contribution history securely.</p><div className="auth-methods"><button type="button" className={authMethod === 'oauth' ? 'auth-method active' : 'auth-method'} onClick={() => { updateAuthField('identifier', 'google'); setAuthMethod('oauth'); }}><span className="provider-letter google">G</span> Google</button><button type="button" className={authMethod === 'oauth' && authForm.identifier === 'facebook' ? 'auth-method active' : 'auth-method'} onClick={() => { updateAuthField('identifier', 'facebook'); setAuthMethod('oauth'); }}><span className="provider-letter facebook">f</span> Facebook</button><button type="button" className={authMethod === 'phone' ? 'auth-method active' : 'auth-method'} onClick={() => { setAuthMethod('phone'); setOtpSent(false); }}><Phone size={15} /> Phone OTP</button></div>{authMethod === 'phone' ? <><label className="form-field"><span><Phone size={14} /> Mobile number</span><input type="tel" value={authForm.mobile} onChange={(event) => updateAuthField('mobile', event.target.value)} placeholder="+91 98765 43210" required /></label>{otpSent && <label className="form-field"><span>One-time password</span><input inputMode="numeric" autoComplete="one-time-code" value={authForm.otp} onChange={(event) => updateAuthField('otp', event.target.value)} placeholder="Enter 6-digit OTP" required /></label>}</> : authMethod === 'oauth' ? <p className="auth-provider-note">Continue with {authForm.identifier === 'facebook' ? 'Facebook' : 'Google'} to complete secure sign-in.</p> : <><label className="form-field"><span><Mail size={14} /> Email or username</span><input value={authForm.identifier} onChange={(event) => updateAuthField('identifier', event.target.value)} autoComplete="username" required /></label>{authMode === 'signup' && <div className="form-grid"><label className="form-field"><span>Full name</span><input value={authForm.fullName} onChange={(event) => updateAuthField('fullName', event.target.value)} required /></label><label className="form-field"><span>Username</span><input value={authForm.username} onChange={(event) => updateAuthField('username', event.target.value)} required /></label><label className="form-field"><span>Age</span><input type="number" min="13" max="120" value={authForm.age} onChange={(event) => updateAuthField('age', event.target.value)} /></label><label className="form-field"><span>Mobile</span><input type="tel" value={authForm.mobile} onChange={(event) => updateAuthField('mobile', event.target.value)} /></label></div>}<label className="form-field"><span>Password</span><input type="password" value={authForm.password} onChange={(event) => updateAuthField('password', event.target.value)} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required /></label></>}{authError && <p className="form-error">{authError}</p>}{authMessage && <p className="auth-message">{authMessage}</p>}<button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait...' : authMethod === 'phone' ? (otpSent ? 'Verify OTP' : 'Send OTP') : authMethod === 'oauth' ? 'Continue securely' : authMode === 'signup' ? 'Create account' : 'Log in'}</button><button type="button" className="auth-switch" onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthMethod('password'); setAuthError(''); }}>{authMode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}</button></form></div>}
    {logOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogOpen(false); }}><form className="log-modal" onSubmit={submitTest}><div className="modal-heading"><div><p className="eyebrow">Community record</p><h2>Log a new test</h2></div><button type="button" className="icon-button" title="Close" onClick={() => setLogOpen(false)}><X size={18} /></button></div><p className="modal-copy">Your scanned values are prefilled. Confirm the location before sharing this result with the neighbourhood.</p><label className="form-field"><span><MapPin size={14} /> Location name</span><input value={testForm.location} onChange={(event) => updateTestField('location', event.target.value)} required /></label><div className="coordinate-fields"><label className="form-field"><span>Latitude</span><input type="number" step="any" min="6.5" max="35.7" value={testForm.latitude} onChange={(event) => updateTestField('latitude', event.target.value)} placeholder="e.g. 28.6139" required /></label><label className="form-field"><span>Longitude</span><input type="number" step="any" min="68" max="97.5" value={testForm.longitude} onChange={(event) => updateTestField('longitude', event.target.value)} placeholder="e.g. 77.2090" required /></label></div>{locationStatus && <p className="location-status">{locationStatus}</p>}<div className="form-grid">{[['ph', 'pH'], ['fluoride', 'Fluoride mg/L'], ['nitrates', 'Nitrates mg/L'], ['hardness', 'Hardness mg/L']].map(([key, label]) => <label className="form-field" key={key}><span>{label}</span><input type="number" step="any" value={testForm[key]} onChange={(event) => updateTestField(key, event.target.value)} required /></label>)}</div>{logState === 'error' && <p className="form-error">Could not save this test. Check the location and API connection.</p>}<button className="primary-button modal-submit" type="submit" disabled={logState === 'saving'}>{logState === 'saved' ? <><Check size={17} /> Saved</> : <><Save size={17} /> {logState === 'saving' ? 'Saving...' : 'Save to community map'}</>}</button></form></div>}
  </div>;
}

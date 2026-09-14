import React, { useEffect, useState } from 'react';
import { Bell, Check, ChevronDown, Clock3, Droplets, FileCheck2, LogIn, LogOut, Mail, MapPin, Menu, Moon, Phone, Plus, Radio, Save, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import BorewellMap from './components/BorewellMap';
import HealthAlerts from './components/HealthAlerts';
import ImpactStats from './components/ImpactStats';
import Scanner from './components/Scanner';
import TankerRegistry from './components/TankerRegistry';
import { borewells, defaultScan, tankers } from './data';
import { apiUrl } from './api';
import { supabase } from './supabase';

export default function App() {
  const [dark, setDark] = useState(false);
  const [scan, setScan] = useState(defaultScan);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [authForm, setAuthForm] = useState({ identifier: '', password: '', otp: '', fullName: '', username: '', age: '', mobile: '', email: '' });
  const [testForm, setTestForm] = useState({ location: 'Browser scan point', ph: defaultScan.ph, fluoride: defaultScan.fluoride, nitrates: defaultScan.nitrates, hardness: defaultScan.hardness });

  const handleScan = (result) => {
    setScan(result);
    setTestForm((current) => ({ ...current, ph: result.ph, fluoride: result.fluoride, nitrates: result.nitrates, hardness: result.hardness }));
  };

  const openLogForm = () => {
    setTestForm((current) => ({ ...current, ph: scan.ph, fluoride: scan.fluoride, nitrates: scan.nitrates, hardness: scan.hardness }));
    setLogOpen(true);
  };

  const updateTestField = (field, value) => setTestForm((current) => ({ ...current, [field]: value }));

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

    const status = Number(testForm.fluoride) > 1.5 || Number(testForm.ph) < 6.5 || Number(testForm.ph) > 8.5 ? 'contaminated' : 'safe';

    try {
      const payload = {
        location: testForm.location || 'North Bengaluru',
        latitude: parseFloat(testForm.latitude) || 12.9716,
        longitude: parseFloat(testForm.longitude) || 77.5946,
        ph: parseFloat(testForm.ph) || 7.0,
        fluoride: parseFloat(testForm.fluoride) || 0.0,
        nitrates: parseFloat(testForm.nitrates) || 0.0,
        hardness: parseFloat(testForm.hardness) || 0.0,
        status: status || 'safe',
        safety_score: parseInt(testForm.safety_score, 10) || 80,
      };

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

  return <div className={dark ? 'app dark' : 'app'}>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Droplets size={19} /></span><span>Jal<span>Rakshak</span></span></a><nav><a className="active" href="#overview">Overview</a><a href="#map">Live map</a><a href="#scan">Scan strip</a><a href="#registry">Registry</a></nav><div className="top-actions"><button className="icon-button" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className={`icon-button notification ${notificationOpen ? 'is-active' : ''}`} title="Notifications" onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={17} />{lastLoggedAt && <i />}</button>{sessionUser ? <button className="profile" title="Open account" onClick={() => setProfileOpen(!profileOpen)}><span>{(sessionUser.user_metadata?.full_name || sessionUser.email || 'U').slice(0, 2).toUpperCase()}</span><strong>{sessionUser.user_metadata?.full_name || sessionUser.email || 'Account'}</strong><ChevronDown size={14} /></button> : <button className="login-button" onClick={() => openAuth('login')}><LogIn size={15} /> Log in</button>}<button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></button></div></header>
    {notificationOpen && <div className="notification-panel"><div className="notification-panel-head"><span>Notifications</span><button className="icon-button" title="Close notifications" onClick={() => setNotificationOpen(false)}><X size={15} /></button></div>{lastLoggedAt ? <button className="notification-item" onClick={() => setContributionOpen(true)}><span className="notification-icon"><FileCheck2 size={17} /></span><span><strong>Log submitted successfully</strong><small>Your water test is now on the community map.</small><em>{lastLoggedAt}</em></span></button> : <p className="notification-empty">Your verified community updates will appear here.</p>}</div>}
    {profileOpen && <div className="profile-panel"><div className="profile-panel-avatar"><UserRound size={18} /></div><div><strong>{sessionUser?.user_metadata?.full_name || sessionUser?.email || 'Community member'}</strong><span>{sessionUser?.phone || sessionUser?.email || 'Verified contributor'}</span></div><button className="icon-button" title="Close account" onClick={() => setProfileOpen(false)}><X size={15} /></button><div className="profile-panel-status"><span className="online-dot" /> Logged in and contributing <button className="profile-logout" onClick={logout}><LogOut size={13} /> Log out</button></div></div>}
    {menuOpen && <div className="mobile-nav"><a href="#overview">Overview</a><a href="#map">Live map</a><a href="#scan">Scan strip</a><a href="#registry">Registry</a></div>}
    <main id="top"><section className="hero" id="overview"><div><div className="live-label"><Radio size={14} /> Community network live <span>·</span> North Bengaluru</div><h1>Know your water.<br /><em>Protect your neighbourhood.</em></h1><p className="hero-copy">JalRakshak turns everyday water tests into a shared early-warning network for families, farms, and the aquifer below.</p><div className="hero-actions"><button className="primary-button" onClick={openLogForm}><Plus size={17} /> Log a new test</button><span className="sync-note"><ShieldCheck size={16} /> 96% data verified</span></div></div><div className="hero-score"><div className="score-ring"><strong>78</strong><span>network<br />health</span></div><div><span>Last 24 hours</span><strong className="score-up">↑ 6.2%</strong></div></div></section>
      <ImpactStats />
      <div className="section-grid" id="map"><BorewellMap locations={borewells} /><div className="side-column"><HealthAlerts scan={scan} /><div className="coverage panel"><div><p className="eyebrow">Neighbourhood pulse</p><h2>Coverage this week</h2></div><div className="coverage-number"><strong>82%</strong><span>of mapped homes</span></div><div className="progress"><span /></div><p className="muted-copy">24 new tests logged across 6 streets. Keep the network growing.</p></div></div></div>
      <div className="lower-grid" id="scan"><Scanner onScan={handleScan} /><div id="registry"><TankerRegistry tankers={tankers} /></div></div>
    </main>
    <footer><span>JalRakshak <b>·</b> Community water intelligence</span><span>Data is crowdsourced and should be confirmed by a certified lab.</span><span className="footer-links">Privacy · Guidelines</span></footer>
    {saveNotice && <div className="save-toast" role="status" aria-live="polite"><Check size={18} /><span><strong>Saved</strong>{saveNotice}</span></div>}
    {contributionOpen && <div className="contribution-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContributionOpen(false); }}><article className="contribution-card"><button className="contribution-close icon-button" title="Close contribution note" onClick={() => setContributionOpen(false)}><X size={18} /></button><div className="document-seal"><FileCheck2 size={30} /></div><p className="eyebrow">Community contribution · Verified</p><h2>Thank you for helping protect our water.</h2><p className="contribution-copy">Your contribution means a lot. This water record gives your neighbourhood a clearer view of its aquifer and helps families make informed decisions.</p><div className="contribution-rule" /><div className="contribution-meta"><span><Clock3 size={14} /> Logged {lastLoggedAt}</span><span><MapPin size={14} /> {testForm.location}</span></div><p className="contribution-footer">Logged in as <strong>Ananya K.</strong> · Your voice is part of the network.</p><button className="primary-button contribution-action" onClick={() => setContributionOpen(false)}>Continue to community map <Check size={16} /></button></article></div>}
    {authOpen && <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><form className="auth-modal" onSubmit={submitAuth}><button type="button" className="auth-close icon-button" title="Close login" onClick={() => setAuthOpen(false)}><X size={18} /></button><div className="auth-brand"><span className="brand-mark"><Droplets size={18} /></span><div><p className="eyebrow">JalRakshak account</p><h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2></div></div><p className="auth-copy">Sign in to save your profile, water logs, and contribution history securely.</p><div className="auth-methods"><button type="button" className={authMethod === 'oauth' ? 'auth-method active' : 'auth-method'} onClick={() => { updateAuthField('identifier', 'google'); setAuthMethod('oauth'); }}><span className="provider-letter google">G</span> Google</button><button type="button" className={authMethod === 'oauth' && authForm.identifier === 'facebook' ? 'auth-method active' : 'auth-method'} onClick={() => { updateAuthField('identifier', 'facebook'); setAuthMethod('oauth'); }}><span className="provider-letter facebook">f</span> Facebook</button><button type="button" className={authMethod === 'phone' ? 'auth-method active' : 'auth-method'} onClick={() => { setAuthMethod('phone'); setOtpSent(false); }}><Phone size={15} /> Phone OTP</button></div>{authMethod === 'phone' ? <><label className="form-field"><span><Phone size={14} /> Mobile number</span><input type="tel" value={authForm.mobile} onChange={(event) => updateAuthField('mobile', event.target.value)} placeholder="+91 98765 43210" required /></label>{otpSent && <label className="form-field"><span>One-time password</span><input inputMode="numeric" autoComplete="one-time-code" value={authForm.otp} onChange={(event) => updateAuthField('otp', event.target.value)} placeholder="Enter 6-digit OTP" required /></label>}</> : authMethod === 'oauth' ? <p className="auth-provider-note">Continue with {authForm.identifier === 'facebook' ? 'Facebook' : 'Google'} to complete secure sign-in.</p> : <><label className="form-field"><span><Mail size={14} /> Email or username</span><input value={authForm.identifier} onChange={(event) => updateAuthField('identifier', event.target.value)} autoComplete="username" required /></label>{authMode === 'signup' && <div className="form-grid"><label className="form-field"><span>Full name</span><input value={authForm.fullName} onChange={(event) => updateAuthField('fullName', event.target.value)} required /></label><label className="form-field"><span>Username</span><input value={authForm.username} onChange={(event) => updateAuthField('username', event.target.value)} required /></label><label className="form-field"><span>Age</span><input type="number" min="13" max="120" value={authForm.age} onChange={(event) => updateAuthField('age', event.target.value)} /></label><label className="form-field"><span>Mobile</span><input type="tel" value={authForm.mobile} onChange={(event) => updateAuthField('mobile', event.target.value)} /></label></div>}<label className="form-field"><span>Password</span><input type="password" value={authForm.password} onChange={(event) => updateAuthField('password', event.target.value)} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required /></label></>}{authError && <p className="form-error">{authError}</p>}{authMessage && <p className="auth-message">{authMessage}</p>}<button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait...' : authMethod === 'phone' ? (otpSent ? 'Verify OTP' : 'Send OTP') : authMethod === 'oauth' ? 'Continue securely' : authMode === 'signup' ? 'Create account' : 'Log in'}</button><button type="button" className="auth-switch" onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthMethod('password'); setAuthError(''); }}>{authMode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}</button></form></div>}
    {logOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogOpen(false); }}><form className="log-modal" onSubmit={submitTest}><div className="modal-heading"><div><p className="eyebrow">Community record</p><h2>Log a new test</h2></div><button type="button" className="icon-button" title="Close" onClick={() => setLogOpen(false)}><X size={18} /></button></div><p className="modal-copy">Your scanned values are prefilled. Confirm the location before sharing this result with the neighbourhood.</p><label className="form-field"><span><MapPin size={14} /> Location</span><input value={testForm.location} onChange={(event) => updateTestField('location', event.target.value)} required /></label><div className="form-grid">{[['ph', 'pH'], ['fluoride', 'Fluoride mg/L'], ['nitrates', 'Nitrates mg/L'], ['hardness', 'Hardness mg/L']].map(([key, label]) => <label className="form-field" key={key}><span>{label}</span><input type="number" step="any" value={testForm[key]} onChange={(event) => updateTestField(key, event.target.value)} required /></label>)}</div>{logState === 'error' && <p className="form-error">Could not save this test. Check that the API is running.</p>}<button className="primary-button modal-submit" type="submit" disabled={logState === 'saving'}>{logState === 'saved' ? <><Check size={17} /> Saved</> : <><Save size={17} /> {logState === 'saving' ? 'Saving...' : 'Save to community map'}</>}</button></form></div>}
  </div>;
}

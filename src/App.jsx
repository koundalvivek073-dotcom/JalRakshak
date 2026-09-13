import React, { useState } from 'react';
import { Bell, Check, ChevronDown, Droplets, MapPin, Menu, Moon, Plus, Radio, Save, ShieldCheck, Sun, X } from 'lucide-react';
import BorewellMap from './components/BorewellMap';
import HealthAlerts from './components/HealthAlerts';
import ImpactStats from './components/ImpactStats';
import Scanner from './components/Scanner';
import TankerRegistry from './components/TankerRegistry';
import { borewells, defaultScan, tankers } from './data';
import { supabase } from './supabase';

export default function App() {
  const [dark, setDark] = useState(false);
  const [scan, setScan] = useState(defaultScan);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logState, setLogState] = useState('idle');
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

  const submitTest = async (event) => {
    event.preventDefault();
    setLogState('saving');
    const status = Number(testForm.fluoride) > 1.5 || Number(testForm.ph) < 6.5 || Number(testForm.ph) > 8.5 ? 'contaminated' : 'safe';
    try {
      const { error } = await supabase.from('water_tests').insert([{ location: testForm.location, ph: Number(testForm.ph), fluoride: Number(testForm.fluoride), nitrates: Number(testForm.nitrates), hardness: Number(testForm.hardness), status }]);
      if (error) throw error;
      setLogState('saved');
      window.dispatchEvent(new CustomEvent('jalrakshak:test-created'));
      window.setTimeout(() => { setLogOpen(false); setLogState('idle'); }, 700);
    } catch {
      setLogState('error');
    }
  };

  return <div className={dark ? 'app dark' : 'app'}>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Droplets size={19} /></span><span>Jal<span>Rakshak</span></span></a><nav><a className="active" href="#overview">Overview</a><a href="#map">Live map</a><a href="#scan">Scan strip</a><a href="#registry">Registry</a></nav><div className="top-actions"><button className="icon-button" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="icon-button notification" title="Notifications"><Bell size={17} /><i /></button><div className="profile"><span>AK</span><strong>Ananya K.</strong><ChevronDown size={14} /></div><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></button></div></header>
    {menuOpen && <div className="mobile-nav"><a href="#overview">Overview</a><a href="#map">Live map</a><a href="#scan">Scan strip</a><a href="#registry">Registry</a></div>}
    <main id="top"><section className="hero" id="overview"><div><div className="live-label"><Radio size={14} /> Community network live <span>·</span> North Bengaluru</div><h1>Know your water.<br /><em>Protect your neighbourhood.</em></h1><p className="hero-copy">JalRakshak turns everyday water tests into a shared early-warning network for families, farms, and the aquifer below.</p><div className="hero-actions"><button className="primary-button" onClick={openLogForm}><Plus size={17} /> Log a new test</button><span className="sync-note"><ShieldCheck size={16} /> 96% data verified</span></div></div><div className="hero-score"><div className="score-ring"><strong>78</strong><span>network<br />health</span></div><div><span>Last 24 hours</span><strong className="score-up">↑ 6.2%</strong></div></div></section>
      <ImpactStats />
      <div className="section-grid" id="map"><BorewellMap locations={borewells} /><div className="side-column"><HealthAlerts scan={scan} /><div className="coverage panel"><div><p className="eyebrow">Neighbourhood pulse</p><h2>Coverage this week</h2></div><div className="coverage-number"><strong>82%</strong><span>of mapped homes</span></div><div className="progress"><span /></div><p className="muted-copy">24 new tests logged across 6 streets. Keep the network growing.</p></div></div></div>
      <div className="lower-grid" id="scan"><Scanner onScan={handleScan} /><div id="registry"><TankerRegistry tankers={tankers} /></div></div>
    </main>
    <footer><span>JalRakshak <b>·</b> Community water intelligence</span><span>Data is crowdsourced and should be confirmed by a certified lab.</span><span className="footer-links">Privacy · Guidelines</span></footer>
    {logOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogOpen(false); }}><form className="log-modal" onSubmit={submitTest}><div className="modal-heading"><div><p className="eyebrow">Community record</p><h2>Log a new test</h2></div><button type="button" className="icon-button" title="Close" onClick={() => setLogOpen(false)}><X size={18} /></button></div><p className="modal-copy">Your scanned values are prefilled. Confirm the location before sharing this result with the neighbourhood.</p><label className="form-field"><span><MapPin size={14} /> Location</span><input value={testForm.location} onChange={(event) => updateTestField('location', event.target.value)} required /></label><div className="form-grid">{[['ph', 'pH'], ['fluoride', 'Fluoride mg/L'], ['nitrates', 'Nitrates mg/L'], ['hardness', 'Hardness mg/L']].map(([key, label]) => <label className="form-field" key={key}><span>{label}</span><input type="number" step="any" value={testForm[key]} onChange={(event) => updateTestField(key, event.target.value)} required /></label>)}</div>{logState === 'error' && <p className="form-error">Could not save this test. Check that the API is running.</p>}<button className="primary-button modal-submit" type="submit" disabled={logState === 'saving'}>{logState === 'saved' ? <><Check size={17} /> Saved</> : <><Save size={17} /> {logState === 'saving' ? 'Saving...' : 'Save to community map'}</>}</button></form></div>}
  </div>;
}

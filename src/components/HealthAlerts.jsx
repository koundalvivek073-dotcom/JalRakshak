import React from 'react';
import { AlertTriangle, ArrowUpRight, Flame, Info } from 'lucide-react';

export default function HealthAlerts({ scan }) {
  const fluorideRisk = scan.fluoride > 1.5;
  return <section className="panel alerts-panel">
    <div className="section-heading"><div><p className="eyebrow">Decision support</p><h2>Health & crop risk</h2></div><span className="live-tag"><span /> Live rules</span></div>
    <div className={`primary-alert ${fluorideRisk ? 'danger-alert' : 'caution-alert'}`}><div className="alert-symbol"><AlertTriangle size={19} /></div><div><strong>{fluorideRisk ? 'High fluoride detected' : 'Water needs review'}</strong><p>{fluorideRisk ? 'Fluoride is above the BIS safe limit of 1.5 mg/L.' : 'One or more values are outside the preferred range.'}</p></div><ArrowUpRight size={17} /></div>
    <div className="guidance"><Flame size={17} /><p><strong>Do not boil for fluoride.</strong> Boiling will not remove fluoride and may concentrate toxicity. Switch to verified municipal or tanker supply.</p></div>
    <div className="mini-alert"><Info size={16} /><span>For crops: avoid irrigating leafy vegetables from this source until a confirmatory lab test.</span></div>
  </section>;
}

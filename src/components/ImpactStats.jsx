import React from 'react';
import { Activity, Droplets, HeartPulse, ShieldCheck, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Borewells monitored', value: '128', change: '+12 this month', icon: Droplets, tone: 'teal' },
  { label: 'Outbreaks flagged', value: '07', change: '2 need attention', icon: Activity, tone: 'coral' },
  { label: 'Families protected', value: '4,260', change: '+8.4% coverage', icon: HeartPulse, tone: 'amber' },
];

export default function ImpactStats() {
  return <div className="stats-grid">{stats.map(({ label, value, change, icon: Icon, tone }) => <article className="stat-card" key={label}>
    <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
    <div><p>{label}</p><strong>{value}</strong><span><TrendingUp size={13} /> {change}</span></div>
    <ShieldCheck className="stat-watermark" size={44} />
  </article>)}</div>;
}

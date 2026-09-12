import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Filter, Search, Star } from 'lucide-react';

export default function TankerRegistry({ tankers }) {
  const [query, setQuery] = useState(''); const [statusFilter, setStatusFilter] = useState('all');
  const filtered = tankers.filter((tanker) => `${tanker.name} ${tanker.route}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || tanker.status === statusFilter));
  return <section className="panel registry-panel">
    <div className="section-heading"><div><p className="eyebrow">Verified supply network</p><h2>Tanker registry</h2></div><button className="ghost-button">View all <ChevronRight size={15} /></button></div>
    <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier or route" /><Filter size={15} /></label><div className="registry-filters" role="group" aria-label="Filter tanker status">{['all', 'verified', 'review'].map((filter) => <button className={statusFilter === filter ? 'active' : ''} key={filter} onClick={() => setStatusFilter(filter)}>{filter === 'all' ? 'All' : filter.toUpperCase()}</button>)}</div>
    <div className="tanker-list">{filtered.map((tanker) => <div className="tanker-row" key={tanker.name}>
      <div className="tanker-avatar">{tanker.initials}</div><div className="tanker-details"><strong>{tanker.name} {tanker.status === 'verified' && <CheckCircle2 size={14} className="verified-icon" />}</strong><span>{tanker.route} · {tanker.scans} scans</span></div>
      <div className="rating"><Star size={13} fill="currentColor" /> {tanker.rating}</div><div className={`status-pill ${tanker.status}`}>{tanker.status === 'verified' ? 'Verified' : 'Review'}</div>
    </div>)}</div>
  </section>;
}

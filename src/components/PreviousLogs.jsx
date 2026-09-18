import React, { useEffect, useState } from 'react';
import { Clock3, MapPin, RefreshCw } from 'lucide-react';
import { apiUrl } from '../api';

const statusLabel = (status) => status === 'contaminated' ? 'Contaminated' : status === 'caution' ? 'Caution' : 'Safe';

export default function PreviousLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/tests'));
      if (!response.ok) throw new Error('Unable to load logs');
      const records = await response.json();
      const enriched = await Promise.all(records.map(async (record) => {
        if (!Number.isFinite(Number(record.latitude)) || !Number.isFinite(Number(record.longitude)) || !String(record.location || '').startsWith('Browser scan point')) return record;
        try {
          const reverse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${record.latitude}&lon=${record.longitude}&zoom=18&addressdetails=1`, { headers: { Accept: 'application/json' } });
          if (!reverse.ok) return record;
          const address = (await reverse.json()).address || {};
          const readable = [address.amenity || address.building || address.road, address.suburb || address.neighbourhood || address.village, address.city || address.town || address.county, address.state].filter(Boolean).join(', ');
          return { ...record, displayLocation: readable || record.location };
        } catch {
          return record;
        }
      }));
      setLogs(enriched);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const refresh = () => loadLogs();
    window.addEventListener('jalrakshak:test-created', refresh);
    return () => window.removeEventListener('jalrakshak:test-created', refresh);
  }, []);

  return <section className="panel previous-logs"><div className="previous-logs-heading"><div><p className="eyebrow">Community history</p><h2>Previous logs</h2></div><button className="icon-button" title="Refresh previous logs" onClick={loadLogs}><RefreshCw size={15} /></button></div>{loading ? <p className="previous-logs-empty">Loading community logs...</p> : logs.length === 0 ? <p className="previous-logs-empty">No submitted logs yet. Your first test will appear here.</p> : <div className="previous-log-list">{logs.map((log) => <article className="previous-log" key={log.id}><span className={`previous-log-status ${log.status || 'safe'}`} /><div className="previous-log-main"><strong>{log.displayLocation || log.location || 'Community test point'}</strong><span><MapPin size={12} /> Location verified from device</span><small><Clock3 size={12} /> {log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently submitted'}</small></div><div className="previous-log-reading"><b className={log.status || 'safe'}>{statusLabel(log.status)}</b><span>pH {log.ph} · F {log.fluoride}</span><small>N {log.nitrates} · H {log.hardness}</small></div></article>)}</div>}</section>;
}

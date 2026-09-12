import React, { useRef, useState } from 'react';
import { Camera, Check, FlipHorizontal2, ScanLine, ShieldAlert } from 'lucide-react';

const metrics = [
  { key: 'fluoride', label: 'Fluoride', unit: 'mg/L', limit: 1.5 },
  { key: 'ph', label: 'pH', unit: 'scale', limit: 8.5 },
  { key: 'nitrates', label: 'Nitrates', unit: 'mg/L', limit: 45 },
  { key: 'hardness', label: 'Hardness', unit: 'mg/L', limit: 600 },
];

export default function Scanner({ onScan }) {
  const videoRef = useRef(null); const [active, setActive] = useState(false); const [captured, setCaptured] = useState(false); const [error, setError] = useState('');
  const startCamera = async () => { try { const stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } } }); if (videoRef.current) videoRef.current.srcObject = stream; setActive(true); setError(''); } catch { setError('Camera unavailable. Use the demo scan to continue.'); } };
  const capture = () => { setCaptured(true); onScan({ fluoride: 1.8, ph: 7.4, nitrates: 29, hardness: 340, score: 54 }); };
  return <section className="panel scanner-panel"><div className="section-heading"><div><p className="eyebrow">Browser vision · RGB strip parse</p><h2>Scan a water strip</h2></div><span className="scan-status"><span /> Ready</span></div><div className="camera-stage">{active && <video ref={videoRef} autoPlay muted playsInline />}{!active && <div className="camera-placeholder"><Camera size={28} /><strong>Align your strip in the frame</strong><span>Use a standard 5-parameter test strip</span></div>}<div className="scan-frame"><span /><span /><span /><span /><div className="scan-line" /></div><div className="camera-hud"><span><ScanLine size={14} /> RGB sampling zone</span><span>1.2 ×</span></div></div><div className="scanner-controls"><button className="round-control" title="Switch camera"><FlipHorizontal2 size={17} /></button><button className="capture-button" onClick={active ? capture : startCamera}><span>{captured ? <Check size={21} /> : <Camera size={21} />}</span>{captured ? 'Captured' : active ? 'Capture frame' : 'Open camera'}</button><span className="secure-note"><ShieldAlert size={14} /> On-device</span></div>{error && <p className="camera-error">{error} <button onClick={capture}>Use demo scan</button></p>}<div className="metric-grid">{metrics.map((metric) => <div className="metric" key={metric.key}><span>{metric.label}</span><strong>{captured ? ({ fluoride: '1.8', ph: '7.4', nitrates: '29', hardness: '340' })[metric.key] : '--'}</strong><small>{metric.unit}</small></div>)}</div></section>;
}

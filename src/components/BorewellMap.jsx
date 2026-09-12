import React, { Fragment } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, LocateFixed, Map as MapIcon } from 'lucide-react';

const colors = { safe: '#18b878', caution: '#f5b940', danger: '#f26d5b' };
const markerIcon = (status) => L.divIcon({ className: 'custom-marker', html: `<span style="background:${colors[status]}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] });

export default function BorewellMap({ locations }) {
  return <section className="panel map-panel"><div className="map-topline"><div><p className="eyebrow">Aquifer intelligence · 5 live points</p><h2>North Bengaluru aquifer</h2></div><div className="map-actions"><button title="Center map"><LocateFixed size={16} /></button><button title="Map layers"><Layers size={16} /></button></div></div><div className="map-wrap"><MapContainer center={[13.021, 77.635]} zoom={14} scrollWheelZoom={true} zoomControl={false}>
    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Polygon positions={[[13.033, 77.625], [13.038, 77.648], [13.014, 77.655], [12.999, 77.641], [13.006, 77.621]]} pathOptions={{ color: '#f26d5b', fillColor: '#f26d5b', fillOpacity: 0.14, weight: 1.5, dashArray: '6 6' }} />
    {locations.map((location) => <Fragment key={location.id}><Circle center={[location.lat, location.lng]} radius={location.status === 'danger' ? 650 : 240} pathOptions={{ color: colors[location.status], fillColor: colors[location.status], fillOpacity: location.status === 'danger' ? 0.1 : 0.06, weight: 1 }} /><Marker position={[location.lat, location.lng]} icon={markerIcon(location.status)}><Popup><strong>{location.name}</strong><br />Safety score: {location.score}/100<br /><small>{location.note}</small></Popup></Marker></Fragment>)}
  </MapContainer><div className="map-legend"><span><i className="dot safe" /> Safe</span><span><i className="dot caution" /> Caution</span><span><i className="dot danger" /> Contaminated plume</span></div><div className="plume-label"><span className="pulse-dot" /> Fluoride plume · expanding</div></div><div className="map-footer"><MapIcon size={15} /><span>Street-level monitoring</span><strong>Last synced 2 min ago</strong></div></section>;
}

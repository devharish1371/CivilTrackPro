import { useEffect, useMemo, useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Filter, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet icon issue in React
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LABEL_STOP_WORDS = new Set(['of', 'the', 'and', 'for', 'to', 'in', 'on', 'with', 'under', 'over', 'via']);

function getShortLabel(name = '') {
  const words = name
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/gi, ''))
    .filter(Boolean);

  const significantWords = words.filter(word => !LABEL_STOP_WORDS.has(word.toLowerCase()));
  if (significantWords.length >= 2) {
    return significantWords.slice(0, 3).map(word => word[0]).join('').toUpperCase();
  }
  if (significantWords.length === 1) {
    return significantWords[0].slice(0, 4).toUpperCase();
  }
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'PRJ';
}

function MapViewportController({ center, zoom, watchKey }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map, center, zoom, watchKey]);

  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

export default function GlobalMap() {
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ constituency: '', scheme: '' });

  const geoProjects = useMemo(() => {
    return projects.filter(p => p.latitude && p.longitude && Number(p.latitude) !== 0);
  }, [projects]);

  const constituencyOptions = useMemo(() => {
    return [...new Set(
      geoProjects
        .filter(p => !filters.scheme || p.scheme === filters.scheme)
        .map(p => p.constituency)
        .filter(Boolean)
    )].sort();
  }, [geoProjects, filters.scheme]);

  const schemeOptions = useMemo(() => {
    return [...new Set(
      geoProjects
        .filter(p => !filters.constituency || p.constituency === filters.constituency)
        .map(p => p.scheme)
        .filter(Boolean)
    )].sort();
  }, [geoProjects, filters.constituency]);

  useEffect(() => {
    if (filters.constituency && !constituencyOptions.includes(filters.constituency)) {
      setFilters(f => ({ ...f, constituency: '' }));
    }
  }, [filters.constituency, constituencyOptions]);

  useEffect(() => {
    if (filters.scheme && !schemeOptions.includes(filters.scheme)) {
      setFilters(f => ({ ...f, scheme: '' }));
    }
  }, [filters.scheme, schemeOptions]);

  const filteredProjects = useMemo(() => {
    return geoProjects.filter(p => {
      if (filters.constituency && p.constituency !== filters.constituency) return false;
      if (filters.scheme && p.scheme !== filters.scheme) return false;
      return true;
    });
  }, [geoProjects, filters]);

  const hasActiveFilters = Boolean(filters.constituency || filters.scheme);

  const center = useMemo(() => {
    const source = filteredProjects.length > 0 ? filteredProjects : geoProjects;
    if (source.length === 0) return [20.5937, 78.9629];
    const lat = source.reduce((sum, p) => sum + Number(p.latitude), 0) / source.length;
    const lng = source.reduce((sum, p) => sum + Number(p.longitude), 0) / source.length;
    return [lat, lng];
  }, [filteredProjects, geoProjects]);

  const zoom = filteredProjects.length === 1 ? 12 : filteredProjects.length > 0 ? 8 : geoProjects.length > 0 ? 7 : 4;
  const clearFilters = () => setFilters({ constituency: '', scheme: '' });

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h1>Global Map</h1>
          <p>
            {filteredProjects.length} geo-tagged projects
            {hasActiveFilters ? ` (filtered from ${geoProjects.length})` : ''}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} /> Map Filters
          </span>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">Constituency</label>
            <select
              className="form-select"
              value={filters.constituency}
              onChange={e => setFilters(f => ({ ...f, constituency: e.target.value }))}
            >
              <option value="">All Constituencies</option>
              {constituencyOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scheme</label>
            <select
              className="form-select"
              value={filters.scheme}
              onChange={e => setFilters(f => ({ ...f, scheme: e.target.value }))}
            >
              <option value="">All Schemes</option>
              {schemeOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
        <p className="map-helper-text">
          Short labels above each marker are generated from the project name. Tap any marker to open the full project details.
        </p>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <MapPin size={48} />
          <h3>{geoProjects.length === 0 ? 'No Geo-Tagged Projects' : 'No Projects Match These Filters'}</h3>
          <p>
            {geoProjects.length === 0
              ? 'Add latitude and longitude in a project to see it on the map.'
              : 'Try changing the constituency or scheme filter.'}
          </p>
        </div>
      ) : (
        <div className="card map-shell">
          <MapContainer center={center} zoom={zoom} className="map-canvas" scrollWheelZoom>
            <MapViewportController
              center={center}
              zoom={zoom}
              watchKey={`${filteredProjects.length}-${filters.constituency}-${filters.scheme}`}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredProjects.map(p => (
              <Marker key={p.id} position={[Number(p.latitude), Number(p.longitude)]}>
                <Tooltip permanent direction="top" offset={[0, -28]} opacity={1} className="map-short-label">
                  {getShortLabel(p.projectName)}
                </Tooltip>
                <Popup>
                  <div style={{ maxWidth: 220 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 14 }}>{p.projectName}</h4>
                    <div className="map-popup-summary">
                      <div><strong>Constituency:</strong> {p.constituency || '-'}</div>
                      <div><strong>Scheme:</strong> {p.scheme || '-'}</div>
                      <div><strong>Status:</strong> <span className={`status-badge ${p.statusOfWork}`} style={{ padding:'2px 4px', fontSize:10 }}>{p.statusOfWork}</span></div>
                      <div><strong>Sanctioned:</strong> ₹{(p.sanctionedAmount || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="map-popup-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/projects/${p.id}`)}>
                        View Project
                      </button>
                      <a
                        className="btn btn-secondary btn-sm"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.latitude},${p.longitude}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} /> Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}

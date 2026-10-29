import { useEffect, useRef } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HARVEST_RADIUS_M } from '../lib/geo.js';

// Keyless OSM raster tiles, darkened via CSS (.dark-tiles). Swap for a keyed provider before heavy/commercial use.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const playerIcon = L.divIcon({
  className: '',
  html: '<div class="player-marker"><div class="ring"></div><div class="ring delay"></div><div class="core"></div></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const sparkIcon = (inRange) =>
  L.divIcon({
    className: '',
    html: `<div class="spark-marker ${inRange ? 'in-range' : ''}"><div class="gem"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

/** Smooth-pans to the player while follow is on; turns off when the user drags. */
function Follower({ pos, follow, onUserPan }) {
  const map = useMap();
  const first = useRef(true);
  const programmatic = useRef(false);

  useMapEvents({
    dragstart: () => {
      if (!programmatic.current) onUserPan();
    },
  });

  useEffect(() => {
    if (!pos || !follow) return;
    programmatic.current = true;
    const target = [pos.lat, pos.lng];
    if (first.current) {
      map.setView(target, 18, { animate: false });
      first.current = false;
    } else {
      map.panTo(target, { animate: true, duration: 0.8, easeLinearity: 0.4 });
    }
    const t = setTimeout(() => (programmatic.current = false), 900);
    return () => clearTimeout(t);
  }, [pos, follow, map]);

  return null;
}

export default function GameMap({ pos, sparks, inRangeId, follow, onUserPan }) {
  return (
    <MapContainer
      center={[pos?.lat ?? 1.2868, pos?.lng ?? 103.8545]}
      zoom={18}
      zoomControl={false}
      className="absolute inset-0 z-0"
      attributionControl
    >
      <TileLayer
        url={TILES}
        attribution={ATTRIBUTION}
        maxZoom={19}
        maxNativeZoom={19}
        className="dark-tiles"
      />
      {pos && (
        <>
          <Circle
            center={[pos.lat, pos.lng]}
            radius={HARVEST_RADIUS_M}
            pathOptions={{
              color: '#00F5D4',
              weight: 1,
              opacity: 0.6,
              fillColor: '#00F5D4',
              fillOpacity: 0.08,
              dashArray: '4 6',
            }}
          />
          <Marker position={[pos.lat, pos.lng]} icon={playerIcon} zIndexOffset={1000} />
        </>
      )}
      {sparks.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={sparkIcon(s.id === inRangeId)} />
      ))}
      <Follower pos={pos} follow={follow} onUserPan={onUserPan} />
    </MapContainer>
  );
}

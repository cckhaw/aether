import { useCallback, useEffect, useRef, useState } from 'react';
import { offsetPoint } from '../lib/geo.js';

const DEMO_START = { lat: 1.2868, lng: 103.8545 };

/**
 * Live GPS via watchPosition, with a demo mode (manual nudges)
 * for desktops or when location permission is denied.
 * status: 'idle' | 'locating' | 'tracking' | 'denied' | 'unsupported' | 'demo'
 */
export function useGeolocation() {
  const [pos, setPos] = useState(null); // { lat, lng }
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState('locating');
  const watchId = useRef(null);

  const stopWatch = () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  };

  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('locating');
    stopWatch();
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setAccuracy(p.coords.accuracy);
        setStatus('tracking');
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'locating'),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    startWatch();
    return stopWatch;
  }, [startWatch]);

  const enterDemo = useCallback(() => {
    stopWatch();
    setPos((p) => p || DEMO_START);
    setAccuracy(5);
    setStatus('demo');
  }, []);

  const exitDemo = useCallback(() => {
    setPos(null);
    startWatch();
  }, [startWatch]);

  const nudge = useCallback((northM, eastM) => {
    setPos((p) => (p ? offsetPoint(p, northM, eastM) : p));
  }, []);

  return { pos, accuracy, status, enterDemo, exitDemo, nudge, retry: startWatch };
}

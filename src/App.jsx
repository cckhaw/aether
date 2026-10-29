import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameMap from './components/GameMap.jsx';
import HUD from './components/HUD.jsx';
import Dock from './components/Dock.jsx';
import DemoControls from './components/DemoControls.jsx';
import LeaderboardModal from './components/LeaderboardModal.jsx';
import AuthSheet from './components/AuthSheet.jsx';
import { useAccount } from './hooks/useAccount.js';
import { useGeolocation } from './hooks/useGeolocation.js';
import { HARVEST_RADIUS_M, RESPAWN_DISTANCE_M, haversine, spawnSparks } from './lib/geo.js';
import { playChime, playPing, unlockAudio, vibrate } from './lib/audio.js';
import { loadIdentity, saveIdentity } from './lib/identity.js';
import { detectRegion } from './lib/region.js';
import { getSeed } from './lib/share.js';

const MAX_SPARKS_ON_MAP = 12;

export default function App() {
  const { pos, accuracy, status, enterDemo, exitDemo, nudge, retry } = useGeolocation();
  const [guest, setGuest] = useState(loadIdentity);
  const [seed] = useState(getSeed);
  const [sparks, setSparks] = useState([]);
  const [run, setRun] = useState({ score: 0, sparks: 0, distanceM: 0 });
  const [follow, setFollow] = useState(true);
  const [showBoard, setShowBoard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const originRef = useRef(null);
  const waveRef = useRef(0);
  const lastPosRef = useRef(null);
  const alertedRef = useRef(null);

  const region = useMemo(() => detectRegion(pos), [pos?.lat > 0, pos?.lng > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const account = useAccount({ guestHandle: guest.handle, country: region.code });
  const signedIn = account.status === 'in' && !!account.profile;
  const identity = signedIn ? { id: account.profile.id, handle: account.profile.handle } : guest;

  // Procedural spawn: on first fix, then whenever the player moves > 50 m from the last spawn origin.
  useEffect(() => {
    if (!pos) return;
    if (originRef.current && haversine(pos, originRef.current) <= RESPAWN_DISTANCE_M) return;
    const wave = waveRef.current++;
    originRef.current = pos;
    const fresh = spawnSparks(pos, seed, wave);
    setSparks((prev) =>
      [...prev.filter((s) => haversine(pos, s) < 200), ...fresh].slice(-MAX_SPARKS_ON_MAP)
    );
  }, [pos, seed]);

  // Distance walked (ignore GPS jitter and teleports).
  useEffect(() => {
    if (!pos) return;
    const last = lastPosRef.current;
    lastPosRef.current = pos;
    if (!last) return;
    const step = haversine(last, pos);
    if (step >= 2 && step < 100) setRun((r) => ({ ...r, distanceM: r.distanceM + step }));
  }, [pos]);

  // Real-time Haversine proximity check.
  const nearest = useMemo(() => {
    if (!pos || sparks.length === 0) return null;
    return sparks.reduce((best, s) => {
      const distance = haversine(pos, s);
      return !best || distance < best.distance ? { spark: s, distance } : best;
    }, null);
  }, [pos, sparks]);

  const inRange = !!nearest && nearest.distance <= HARVEST_RADIUS_M;
  const inRangeId = inRange ? nearest.spark.id : null;

  // Haptic + ping the moment a spark enters range.
  useEffect(() => {
    if (inRangeId && alertedRef.current !== inRangeId) {
      vibrate([60, 40, 60]);
      playPing();
    }
    alertedRef.current = inRangeId;
  }, [inRangeId]);

  const harvest = useCallback(() => {
    if (!inRange) return;
    const { spark } = nearest;
    setSparks((prev) => prev.filter((s) => s.id !== spark.id));
    setRun((r) => ({ ...r, score: r.score + spark.value, sparks: r.sparks + 1 }));
    playChime(spark.value > 10);
    vibrate(spark.value > 10 ? [30, 30, 30, 30, 90] : 80);
  }, [inRange, nearest]);

  // Returns an error message (e.g. handle taken) or null.
  const rename = async (handle) => {
    if (signedIn) return account.rename(handle);
    const next = { ...guest, handle };
    setGuest(next);
    saveIdentity(next);
    return null;
  };

  const openBoard = () => {
    unlockAudio();
    setShowBoard(true);
  };

  return (
    <div className="relative h-full w-full overflow-hidden" onPointerDown={unlockAudio}>
      <GameMap
        pos={pos}
        sparks={sparks}
        inRangeId={inRangeId}
        follow={follow}
        onUserPan={() => setFollow(false)}
      />
      <HUD
        handle={identity.handle}
        signedIn={signedIn}
        onAccount={() => setShowAuth(true)}
        score={run.score}
        sparkCount={run.sparks}
        status={status}
        accuracy={accuracy}
        follow={follow}
        onRecenter={() => setFollow(true)}
      />
      <DemoControls
        status={status}
        demo={status === 'demo'}
        onEnter={enterDemo}
        onExit={exitDemo}
        onNudge={nudge}
        onRetry={retry}
      />
      <Dock
        nearest={nearest}
        inRange={inRange}
        sparkCount={run.sparks}
        walked={run.distanceM}
        onHarvest={harvest}
        onLeaderboard={openBoard}
      />
      {showBoard && (
        <LeaderboardModal
          identity={identity}
          region={region}
          run={run}
          seed={seed}
          account={account}
          onRename={rename}
          onSignIn={() => setShowAuth(true)}
          onClose={() => setShowBoard(false)}
        />
      )}
      {showAuth && <AuthSheet account={account} onClose={() => setShowAuth(false)} />}
    </div>
  );
}

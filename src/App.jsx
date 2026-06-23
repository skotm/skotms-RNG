import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LayoutGrid, Trophy, Settings as SettingsIcon, BarChart3, FastForward, Pause, Lock, X, RotateCcw, CheckCircle2, Circle, Eye, Star } from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Data — rarity accents borrowed from Apple's own system colour palette  */
/* ---------------------------------------------------------------------- */

const TIERS = [
  { name: "Basic", color: "#8E8E93" },
  { name: "Epic", color: "#34C759" },
  { name: "Unique", color: "#007AFF" },
  { name: "Legendary", color: "#AF52DE" },
  { name: "Mythic", color: "#FF9500" },
  { name: "Exalted", color: "#FFCC00" },
  { name: "Glorious", color: "#00C7BE" },
  { name: "Transcendent", color: "#FF2D55" },
  { name: "Dimensional", color: "#000000" },
];

const AURAS = [
  // Basic — 1 to 999
  { id: "common", name: "Common", chance: 2, tier: 0 },
  { id: "uncommon", name: "Uncommon", chance: 8, tier: 0 },
  { id: "breeze", name: "Breeze", chance: 25, tier: 0 },
  { id: "pebble", name: "Pebble", chance: 60, tier: 0 },
  { id: "drizzle", name: "Drizzle", chance: 150, tier: 0 },
  { id: "flicker", name: "Flicker", chance: 400, tier: 0 },
  // Epic — 1,000 to 9,999
  { id: "ember", name: "Ember", chance: 1000, tier: 1 },
  { id: "frostbite", name: "Frostbite", chance: 2200, tier: 1 },
  { id: "voltage", name: "Voltage", chance: 3500, tier: 1 },
  { id: "mossglow", name: "Mossglow", chance: 5200, tier: 1 },
  { id: "cinder", name: "Cinder", chance: 8000, tier: 1 },
  // Unique — 10,000 to 99,999
  { id: "riptide", name: "Riptide", chance: 12000, tier: 2 },
  { id: "permafrost", name: "Permafrost", chance: 22000, tier: 2 },
  { id: "quartzline", name: "Quartzline", chance: 38000, tier: 2 },
  { id: "eclipse_shard", name: "Eclipse Shard", chance: 55000, tier: 2 },
  { id: "stormcaller", name: "Stormcaller", chance: 80000, tier: 2 },
  // Legendary — 100,000 to 999,999
  { id: "wraith", name: "Wraith", chance: 120000, tier: 3 },
  { id: "aurora_veil", name: "Aurora Veil", chance: 250000, tier: 3 },
  { id: "obsidian", name: "Obsidian", chance: 420000, tier: 3 },
  { id: "solstice", name: "Solstice", chance: 600000, tier: 3 },
  { id: "phantom_edge", name: "Phantom Edge", chance: 850000, tier: 3 },
  // Mythic — 1,000,000 to 9,999,999
  { id: "leviathan", name: "Leviathan", chance: 1200000, tier: 4 },
  { id: "seraph_wing", name: "Seraph Wing", chance: 2500000, tier: 4 },
  { id: "inferno_core", name: "Inferno Core", chance: 4200000, tier: 4 },
  { id: "tempest_crown", name: "Tempest Crown", chance: 6000000, tier: 4 },
  { id: "wyrmscale", name: "Wyrmscale", chance: 8500000, tier: 4 },
  // Exalted — 10,000,000 to 99,999,999
  { id: "sovereign", name: "Sovereign", chance: 15000000, tier: 5 },
  { id: "paragon", name: "Paragon", chance: 35000000, tier: 5 },
  { id: "halo_drift", name: "Halo Drift", chance: 55000000, tier: 5 },
  { id: "eternum", name: "Eternum", chance: 80000000, tier: 5 },
  // Glorious — 100,000,000 to 999,999,999
  { id: "genesis", name: "Genesis", chance: 150000000, tier: 6 },
  { id: "zenith_pulse", name: "Zenith Pulse", chance: 350000000, tier: 6 },
  { id: "singularity", name: "Singularity", chance: 600000000, tier: 6 },
  { id: "empyrean", name: "Empyrean", chance: 850000000, tier: 6 },
  // Transcendent — 1,000,000,000 to 7,499,999,999
  { id: "oblivion", name: "Oblivion", chance: 1200000000, tier: 7 },
  { id: "nullspace", name: "Nullspace", chance: 2500000000, tier: 7 },
  { id: "omega", name: "Omega", chance: 4500000000, tier: 7 },
  { id: "voidheart", name: "Voidheart", chance: 7000000000, tier: 7 },
  // Dimensional — 7,500,000,000 and beyond, the single apex aura
  { id: "omniverse", name: "Omniverse", chance: 9000000000, tier: 8 },
];

const colorOf = (aura) => TIERS[aura.tier].color;
const hasTier = (d, tierIdx) => AURAS.some((a) => a.tier === tierIdx && d.inventory[a.id]);

const NORMAL_MS = 3500;
const FAST_MS = 1500;
const FAST_UNLOCK_ROLLS = 10;
const SNAP_OUT_MS = 180; // the abrupt zoom-out, fixed regardless of roll type
const FINISH_BUFFER_MS = 220;
const PEAK_SCALE = 1.45;
const MIN_STEP_MS = 45; // fastest tick, right after pressing roll
const MAX_STEP_MS = 230; // slowest tick, just before the result locks in

const ACHIEVEMENTS_DEF = [
  { id: "roll_10", name: "Getting Started", desc: "Roll 10 times", goal: 10, check: (d) => d.totalRolls >= 10, metric: (d) => Math.min(d.totalRolls, 10) },
  { id: "roll_100", name: "Regular", desc: "Roll 100 times", goal: 100, check: (d) => d.totalRolls >= 100, metric: (d) => Math.min(d.totalRolls, 100) },
  { id: "roll_1000", name: "Dedicated", desc: "Roll 1,000 times", goal: 1000, check: (d) => d.totalRolls >= 1000, metric: (d) => Math.min(d.totalRolls, 1000) },
  { id: "roll_10000", name: "Completionist", desc: "Roll 10,000 times", goal: 10000, check: (d) => d.totalRolls >= 10000, metric: (d) => Math.min(d.totalRolls, 10000) },
  { id: "tier_epic", name: "First Epic", desc: "Pull an Epic-tier aura", goal: 1, check: (d) => hasTier(d, 1), metric: (d) => (hasTier(d, 1) ? 1 : 0) },
  { id: "tier_unique", name: "First Unique", desc: "Pull a Unique-tier aura", goal: 1, check: (d) => hasTier(d, 2), metric: (d) => (hasTier(d, 2) ? 1 : 0) },
  { id: "tier_legendary", name: "First Legendary", desc: "Pull a Legendary-tier aura", goal: 1, check: (d) => hasTier(d, 3), metric: (d) => (hasTier(d, 3) ? 1 : 0) },
  { id: "tier_mythic", name: "First Mythic", desc: "Pull a Mythic-tier aura", goal: 1, check: (d) => hasTier(d, 4), metric: (d) => (hasTier(d, 4) ? 1 : 0) },
  { id: "tier_exalted", name: "First Exalted", desc: "Pull an Exalted-tier aura", goal: 1, check: (d) => hasTier(d, 5), metric: (d) => (hasTier(d, 5) ? 1 : 0) },
  { id: "tier_glorious", name: "First Glorious", desc: "Pull a Glorious-tier aura", goal: 1, check: (d) => hasTier(d, 6), metric: (d) => (hasTier(d, 6) ? 1 : 0) },
  { id: "tier_transcendent", name: "First Transcendent", desc: "Pull a Transcendent-tier aura", goal: 1, check: (d) => hasTier(d, 7), metric: (d) => (hasTier(d, 7) ? 1 : 0) },
  { id: "tier_dimensional", name: "First Dimensional", desc: "Pull the Dimensional aura", goal: 1, check: (d) => hasTier(d, 8), metric: (d) => (hasTier(d, 8) ? 1 : 0) },
  { id: "collect_all", name: "Full Collection", desc: "Find every aura at least once", goal: AURAS.length, check: (d) => AURAS.every((a) => d.inventory[a.id]), metric: (d) => AURAS.filter((a) => d.inventory[a.id]).length },
];

const STORAGE_KEY = "aura-roll:v1";

const defaultData = () => ({
  totalRolls: 0,
  bestAuraId: null,
  inventory: {},
  achievementsUnlocked: [],
  settings: { sound: true },
  playSeconds: 0,
  luckyCounter: 0,
  version: 1,
});

const LUCKY_EVERY = 10;
const LUCKY_MULTIPLIER = 5;

function rollAura(luck = 1) {
  const byRarity = [...AURAS].sort((a, b) => b.chance - a.chance); // rarest first
  for (let pass = 0; pass < 100000; pass++) {
    for (const aura of byRarity) {
      const denom = Math.floor(aura.chance / luck);
      if (denom <= 1) continue; // 確実当選になるオーラは判定対象から外す(Sol's RNG仕様)
      if (Math.floor(Math.random() * denom) === 0) return aura; // オーラごとに毎回新しい乱数
    }
    // 1パスで誰も当選しなければ、最初からやり直す
  }
  return byRarity[byRarity.length - 1]; // フェイルセーフ（実質到達しない）
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatChance(chance) {
  return `1 in ${chance.toLocaleString()}`;
}

function effectFor(tier) {
  if (tier <= 2) return { rings: 0, duration: 450 };
  if (tier === 3) return { rings: 1, duration: 800 };
  if (tier === 4) return { rings: 2, duration: 1100 };
  if (tier === 5) return { rings: 2, duration: 1300 };
  if (tier === 6) return { rings: 3, duration: 1600 };
  if (tier === 7) return { rings: 4, duration: 1900 };
  return { rings: 5, duration: 2300 }; // Dimensional, the apex
}

/* the pre-reveal "confirm" cutscene for sufficiently rare pulls — a jagged
   4-point sparkle, a 5-point star, or a jagged 6-point sparkle, depending
   on how rare the result is */
function cutsceneTypeFor(chance) {
  if (chance >= 1000000) return "six";
  if (chance >= 100000) return "star";
  if (chance >= 10000) return "four";
  return null;
}

const CUTSCENE_DURATIONS = {
  four: { black: 220, spin: 1700, flash: 280 },
  star: { black: 260, spin: 2200, flash: 320 },
  six: { black: 300, spin: 2800, flash: 380 },
};

/* an N-pointed concave burst/sparkle shape — each point is a sharp tip,
   joined to the next by a curve whose control point sits at the center,
   pulling the side inward for the jagged "twinkle" look */
function sparklePath(n, outerR = 46, cx = 50, cy = 50) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    pts.push([cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle)]);
  }
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} `;
  for (let i = 1; i <= n; i++) {
    const [x, y] = pts[i % n];
    d += `Q ${cx},${cy} ${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return d + "Z";
}

/* ---------------------------------------------------------------------- */
/* Sound — a soft tick, like an iOS picker wheel                          */
/* ---------------------------------------------------------------------- */

function useTick(enabledRef) {
  const ctxRef = useRef(null);
  return useCallback(
    (variant = "tick") => {
      if (!enabledRef.current) return;
      try {
        if (!ctxRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ctxRef.current = new AC();
        }
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;
        const len = Math.floor(ctx.sampleRate * (variant === "land" ? 0.045 : 0.02));
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = variant === "land" ? 1100 : 2400;
        const gain = ctx.createGain();
        gain.gain.value = variant === "land" ? 0.32 : 0.12;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now);
      } catch (e) {
        /* audio unavailable */
      }
    },
    [enabledRef]
  );
}

/* ---------------------------------------------------------------------- */
/* Small pieces                                                            */
/* ---------------------------------------------------------------------- */

function Dot({ color, size = 9 }) {
  return <span className="ar-dot" style={{ width: size, height: size, background: color }} />;
}

function AuraVisual({ aura, size = 100 }) {
  const tier = aura.tier;
  const isChromatic = tier === 8;
  const color = isChromatic ? "#FF375F" : colorOf(aura);
  const particleCount = tier <= 1 ? 4 : tier <= 3 ? 6 : tier <= 5 ? 9 : tier === 6 ? 12 : 16;
  const ringCount = tier <= 1 ? 0 : tier <= 3 ? 1 : tier <= 5 ? 2 : 3;

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        left: 18 + Math.random() * 64,
        delay: Math.random() * 3,
        duration: 2.2 + Math.random() * 1.6,
        drift: Math.round((Math.random() - 0.5) * (size * 0.3)),
      })),
    [particleCount, size]
  );

  return (
    <div className={`aura-visual ${isChromatic ? "aura-chromatic" : ""}`} style={{ width: size, height: size, "--aura-color": color }}>
      <div className="aura-glow" />
      {Array.from({ length: ringCount }).map((_, i) => (
        <div key={i} className={`aura-ring aura-ring-${i}`} />
      ))}
      <div className="aura-particle-layer">
        {particles.map((p) => (
          <span
            key={p.id}
            className="aura-particle"
            style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, "--drift": `${p.drift}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function PanelHead({ title, onClose }) {
  return (
    <div className="ar-panel-head">
      <span className="ar-panel-title">{title}</span>
      <button className="ar-panel-close" onClick={onClose} aria-label="Back to roll">
        <X size={16} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* App                                                                      */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [data, setData] = useState(defaultData());
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [rareFind, setRareFind] = useState(null);
  const [view, setView] = useState("roll"); // 'roll' | 'stats' | 'collection' | 'achievements' | 'settings'
  const [resetArmed, setResetArmed] = useState(false);
  const [autoFast, setAutoFast] = useState(false);
  const autoFastRef = useRef(false);
  autoFastRef.current = autoFast;

  const [revealText, setRevealText] = useState("—");
  const [revealAuraId, setRevealAuraId] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [burst, setBurst] = useState(null); // { color, rings, key }
  const [cutscene, setCutscene] = useState(null); // { type: 'four'|'star'|'six', color, stage, key }
  const [shaking, setShaking] = useState(false);
  const [popKey, setPopKey] = useState(0);
  const [currentRollLucky, setCurrentRollLucky] = useState(false);
  const [headerBadgeAuraId, setHeaderBadgeAuraId] = useState(null);
  const currentRollRef = useRef(null);

  // zoom: a single boolean target + the transition duration to reach it.
  // Going to "zoomed" is slow (gradual build-up). Coming back is SNAP_OUT_MS (instant).
  const [zoomed, setZoomed] = useState(false);
  const [zoomDuration, setZoomDuration] = useState(SNAP_OUT_MS);

  const soundRef = useRef(true);
  soundRef.current = data.settings.sound;
  const playTick = useTick(soundRef);

  const spinningRef = useRef(false);
  spinningRef.current = spinning;

  const luckyCounterRef = useRef(0);
  luckyCounterRef.current = data.luckyCounter ?? 0;

  const cycleTimeoutRef = useRef(null);
  const climaxTimeoutRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const burstClearRef = useRef(null);
  const cutsceneTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);

  const rollBtnRef = useRef(null);
  const [btnSize, setBtnSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = rollBtnRef.current;
    if (!el) return;
    const update = () => setBtnSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---- load ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...defaultData(), ...parsed, settings: { ...defaultData().settings, ...(parsed.settings || {}) } };
        setData(merged);
        setHeaderBadgeAuraId(merged.bestAuraId);
      }
    } catch (e) {
      /* nothing saved yet, or storage unavailable */
    }
    setLoaded(true);
  }, []);

  /* ---- save (debounced) ---- */
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        /* storage full or unavailable */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [data, loaded]);

  /* belt-and-suspenders: the debounce above could miss the very last change
     if the tab is closed within that window, so force an immediate save
     the moment the tab is hidden or the page is being torn down */
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current));
      } catch (e) {
        /* ignore */
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  /* ---- play time ---- */
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => setData((prev) => ({ ...prev, playSeconds: prev.playSeconds + 1 })), 1000);
    return () => clearInterval(id);
  }, [loaded]);

  /* ---- cancel any roll animation in progress ---- */
  const clearRollTimers = useCallback(() => {
    clearTimeout(cycleTimeoutRef.current);
    clearTimeout(climaxTimeoutRef.current);
    clearTimeout(finishTimeoutRef.current);
    clearTimeout(burstClearRef.current);
    clearTimeout(cutsceneTimeoutRef.current);
    clearTimeout(shakeTimeoutRef.current);
    setZoomDuration(SNAP_OUT_MS);
    setZoomed(false);
    setSpinning(false);
    setBurst(null);
    setCutscene(null);
    setShaking(false);
  }, []);

  /* the actual data mutation for a roll — deliberately NOT called at press
     time, only once the result is actually revealed (or an interrupted
     roll is force-revealed by cancelRoll below), so the inventory/best-aura
     bookkeeping never gets ahead of what's on screen */
  const applyRollResult = useCallback((aura, isLucky) => {
    setData((prev) => {
      const newInventory = { ...prev.inventory, [aura.id]: (prev.inventory[aura.id] || 0) + 1 };
      const bestChance = prev.bestAuraId ? AURAS.find((a) => a.id === prev.bestAuraId).chance : 0;
      const newBest = aura.chance > bestChance ? aura.id : prev.bestAuraId;
      const newLuckyCounter = isLucky ? 0 : (prev.luckyCounter ?? 0) + 1;
      return { ...prev, inventory: newInventory, bestAuraId: newBest, totalRolls: prev.totalRolls + 1, luckyCounter: newLuckyCounter };
    });
  }, []);

  /* used when something *external* interrupts a roll (nav buttons, reset).
     Only ever reaches a roll that's still mid-flight when it's a blocking
     (normal) roll — auto-rolling never gets cancelled this way. Snaps the
     display to the real result instead of leaving a stale tease behind,
     and applies the (until now deferred) inventory/best-aura update. */
  const cancelRoll = useCallback(() => {
    clearRollTimers();
    setAutoFast(false);
    setCurrentRollLucky(false);
    if (currentRollRef.current) {
      const { aura, isLucky } = currentRollRef.current;
      setRevealText(aura.name);
      setRevealAuraId(aura.id);
      setHeaderBadgeAuraId((prevBest) => {
        const prevChance = prevBest ? AURAS.find((a) => a.id === prevBest).chance : 0;
        return aura.chance > prevChance ? aura.id : prevBest;
      });
      if (aura.tier >= 6) setRareFind({ aura, key: Math.random() });
      applyRollResult(aura, isLucky);
      currentRollRef.current = null;
    }
  }, [clearRollTimers, applyRollResult]);

  /* ---- the roll animation -------------------------------------------------
     Whole screen zooms in continuously from the moment Roll is pressed —
     but only for a normal (blocking) roll. While auto-rolling, the zoom is
     skipped entirely so the screen stays calm and other buttons stay usable.
     The cycling text decelerates (fast → slow) and freezes on a tease as
     the zoom reaches its peak. The true result is only swapped in at the
     very end — for sufficiently rare results, a black-screen "confirm"
     cutscene (spinning sparkle/star, then a white flash + shake) plays
     first, and only then is the real result revealed. */
  const runRollAnimation = useCallback(
    (aura, totalMs, isPreview = false) => {
      clearRollTimers();
      const doZoom = !autoFastRef.current;
      const buildMs = Math.max(totalMs - SNAP_OUT_MS - FINISH_BUFFER_MS, 600);
      const cycleMs = Math.round(buildMs * 0.74);
      const holdMs = buildMs - cycleMs;

      const revealNow = () => {
        setRevealText(aura.name);
        setRevealAuraId(aura.id);
        if (!isPreview) {
          setHeaderBadgeAuraId((prevBest) => {
            const prevChance = prevBest ? AURAS.find((a) => a.id === prevBest).chance : 0;
            return aura.chance > prevChance ? aura.id : prevBest;
          });
        }
        if (aura.tier >= 6) setRareFind({ aura, key: Math.random() });
        if (currentRollRef.current) {
          applyRollResult(currentRollRef.current.aura, currentRollRef.current.isLucky);
          currentRollRef.current = null;
        }
        setPopKey((k) => k + 1);
        playTick("land");
        const fx = effectFor(aura.tier);
        if (fx.rings > 0) {
          setBurst({ color: colorOf(aura), rings: fx.rings, key: Math.random() });
          burstClearRef.current = setTimeout(() => setBurst(null), fx.duration + 200);
        }
        finishTimeoutRef.current = setTimeout(() => {
          setSpinning(false);
          setCurrentRollLucky(false);
        }, SNAP_OUT_MS + FINISH_BUFFER_MS);
      };

      const runCutscene = (ctype) => {
        const dur = CUTSCENE_DURATIONS[ctype];
        const color = colorOf(aura);
        setCutscene({ type: ctype, color, stage: "black", key: Math.random() }); // silent — no click here
        cutsceneTimeoutRef.current = setTimeout(() => {
          setCutscene((c) => c && { ...c, stage: "spin" });
          cutsceneTimeoutRef.current = setTimeout(() => {
            setCutscene((c) => c && { ...c, stage: "flash" });
            // reveal now, while still hidden behind the flash — by the time it
            // clears, the result is already sitting there, and the shake lands
            // right as it becomes visible
            revealNow();
            setShaking(true);
            shakeTimeoutRef.current = setTimeout(() => setShaking(false), 620);
            cutsceneTimeoutRef.current = setTimeout(() => {
              setCutscene(null);
            }, dur.flash);
          }, dur.spin);
        }, dur.black);
      };

      setSpinning(true);
      if (doZoom) {
        setZoomDuration(buildMs);
        setZoomed(true); // gradual zoom-in + vignette fade-in over buildMs
      }

      const startedAt = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startedAt;
        if (elapsed >= cycleMs) {
          // hold on whatever tease is currently showing through the peak zoom —
          // the true result is only revealed once we snap back out
          climaxTimeoutRef.current = setTimeout(() => {
            // peak reached — snap back out instantly
            if (doZoom) {
              setZoomDuration(SNAP_OUT_MS);
              setZoomed(false);
            }
            const ctype = cutsceneTypeFor(aura.chance);
            if (ctype) {
              runCutscene(ctype);
            } else {
              revealNow();
            }
          }, holdMs);
          return;
        }
        const progress = elapsed / cycleMs;
        const eased = Math.pow(progress, 2.1); // quadratic-ish deceleration, like a slowing wheel
        const delay = MIN_STEP_MS + (MAX_STEP_MS - MIN_STEP_MS) * eased;
        const r = AURAS[Math.floor(Math.random() * AURAS.length)];
        setRevealText(r.name);
        setRevealAuraId(r.id);
        playTick("tick");
        cycleTimeoutRef.current = setTimeout(tick, delay);
      };
      tick();
    },
    [clearRollTimers, playTick, applyRollResult]
  );

  /* ---- roll (records result instantly, animation is just presentation) ---- */
  const executeRoll = useCallback(
    (totalMs) => {
      if (spinningRef.current) return;
      const isLucky = luckyCounterRef.current >= LUCKY_EVERY - 1;
      const aura = rollAura(isLucky ? LUCKY_MULTIPLIER : 1);
      currentRollRef.current = { aura, isLucky };
      setCurrentRollLucky(isLucky);
      if (!autoFastRef.current) setView("roll");
      runRollAnimation(aura, totalMs);
    },
    [runRollAnimation]
  );

  const doRoll = useCallback(() => executeRoll(NORMAL_MS), [executeRoll]);

  /* ---- fast roll auto-loop: once toggled on, keep chaining 2s rolls ---- */
  useEffect(() => {
    if (!autoFast) return;
    if (spinning) return;
    if (data.totalRolls < FAST_UNLOCK_ROLLS) {
      setAutoFast(false);
      return;
    }
    const t = setTimeout(() => {
      if (autoFastRef.current) executeRoll(FAST_MS);
    }, 150);
    return () => clearTimeout(t);
  }, [autoFast, spinning, executeRoll, data.totalRolls]);

  const toggleAutoFast = useCallback(() => {
    if (data.totalRolls < FAST_UNLOCK_ROLLS) return;
    setAutoFast((v) => !v);
  }, [data.totalRolls]);

  /* ---- spacebar ---- */
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        doRoll();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doRoll]);

  /* ---- achievements ---- */
  useEffect(() => {
    if (!loaded) return;
    const newly = ACHIEVEMENTS_DEF.filter((a) => !data.achievementsUnlocked.includes(a.id) && a.check(data));
    if (newly.length > 0) {
      setData((prev) => ({ ...prev, achievementsUnlocked: [...prev.achievementsUnlocked, ...newly.map((a) => a.id)] }));
      setToast(newly[0]);
    }
  }, [data.totalRolls, data.inventory, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the toast's own dismiss timer — independent of the effect above, so a
     roll landing moments later (which re-runs that effect for unrelated
     reasons) can never cancel this without replacing it, leaving the toast
     stuck on screen */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!rareFind) return;
    const t = setTimeout(() => setRareFind(null), 4000);
    return () => clearTimeout(t);
  }, [rareFind]);

  const bestAura = data.bestAuraId ? AURAS.find((a) => a.id === data.bestAuraId) : null;
  const badgeAura = headerBadgeAuraId ? AURAS.find((a) => a.id === headerBadgeAuraId) : null;
  const revealAura = revealAuraId ? AURAS.find((a) => a.id === revealAuraId) : null;
  const collectedCount = AURAS.filter((a) => data.inventory[a.id]).length;
  const fastUnlocked = data.totalRolls >= FAST_UNLOCK_ROLLS;
  const luckyChargeRatio = Math.min(data.luckyCounter ?? 0, LUCKY_EVERY - 1) / (LUCKY_EVERY - 1);
  const luckyArmed = (data.luckyCounter ?? 0) >= LUCKY_EVERY - 1;
  const showLucky = luckyArmed || currentRollLucky;
  const blockingRoll = spinning && !autoFast;

  const updateSettings = (patch) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));

  /* debug-only: preview an aura's full reveal sequence (cycling, zoom,
     climax, burst) without rolling for it — no data is touched (no
     inventory, no totalRolls, no best-aura badge) */
  const previewAura = useCallback(
    (aura) => {
      if (spinningRef.current) return;
      setView("roll");
      runRollAnimation(aura, NORMAL_MS, true);
    },
    [runRollAnimation]
  );

  /* navigating away only interrupts a blocking (normal) roll — auto-rolling
     is never stopped by this, and the buttons that would trigger it are
     disabled during a blocking roll anyway, so this guard is a fallback */
  const goToView = useCallback(
    (name) => {
      if (spinningRef.current && !autoFastRef.current) cancelRoll();
      setView((v) => (v === name ? "roll" : name));
    },
    [cancelRoll]
  );

  const handleResetClick = () => {
    if (!resetArmed) {
      setResetArmed(true);
      setTimeout(() => setResetArmed(false), 3000);
      return;
    }
    cancelRoll();
    const fresh = defaultData();
    setData(fresh);
    setRevealText("—");
    setRevealAuraId(null);
    setResetArmed(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="ar-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
          --bg: #ffffff;
          --ink: #1c1c1e;
          --ink-soft: #8e8e93;
          --line: rgba(0,0,0,0.1);
          --fill: #f2f2f3;
        }

        .ar-root {
          min-height: 100vh;
          width: 100%;
          background: var(--bg);
          color: var(--ink);
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
          padding-bottom: 36px;
          overflow-x: hidden;
        }
        .ar-root * { box-sizing: border-box; }

        .ar-stage { transform-origin: 50% 38%; }

        .ar-vignette-fixed {
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 45;
          opacity: 0;
          background: radial-gradient(circle at 50% 38%, rgba(255,255,255,0) 20%, rgba(0,0,0,0.93) 74%);
        }

        .ar-cutscene {
          position: fixed; inset: 0;
          z-index: 70;
          background: #000;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .ar-cutscene-shape { width: 38vmin; height: 38vmin; max-width: 220px; max-height: 220px; opacity: 0; transform: scale(0.5); transition: opacity .2s ease, transform .2s ease; }
        .ar-cutscene-spin .ar-cutscene-shape {
          opacity: 1;
          animation: ar-cs-spin var(--spin-ms) cubic-bezier(0.92, 0, 1, 0.55) forwards;
        }
        .ar-cutscene-flash .ar-cutscene-shape {
          animation: none;
          opacity: 0;
          transform: scale(1.35);
          transition: opacity .15s ease, transform .15s ease;
        }
        @keyframes ar-cs-spin {
          from { transform: scale(1) rotate(0deg); }
          to { transform: scale(1.18) rotate(1080deg); }
        }
        .ar-cutscene-sparkle, .ar-cutscene-star { width: 100%; height: 100%; filter: drop-shadow(0 0 18px var(--cs-color)); }
        .ar-cutscene-flash {
          animation: ar-cs-flash-bg 0.3s ease forwards;
        }
        @keyframes ar-cs-flash-bg { 0% { background: #000; } 65% { background: #fff; } 100% { background: #fff; opacity: 0; } }
        .ar-stage.ar-shake { animation: ar-cs-shake 0.6s ease-out; }
        @keyframes ar-cs-shake {
          0% { transform: translate(0, 0); }
          8% { transform: translate(-9px, 5px); }
          16% { transform: translate(9px, -5px); }
          24% { transform: translate(-8px, 6px); }
          32% { transform: translate(8px, -6px); }
          42% { transform: translate(-6px, 4px); }
          52% { transform: translate(6px, -4px); }
          62% { transform: translate(-4px, 3px); }
          72% { transform: translate(4px, -3px); }
          82% { transform: translate(-2px, 1px); }
          91% { transform: translate(2px, -1px); }
          100% { transform: translate(0, 0); }
        }

        .ar-header { max-width: 460px; margin: 0 auto; padding: 24px 20px 4px; display: flex; align-items: flex-start; justify-content: space-between; }
        .ar-header-left { display: flex; flex-direction: column; gap: 8px; }
        .ar-badge-row { display: flex; align-items: center; gap: 9px; }
        .ar-badge { width: 56px; height: 56px; border-radius: 18px; border: 2px solid var(--ink); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .ar-badge-chance { font-size: 13px; font-weight: 500; color: var(--ink-soft); font-feature-settings: "tnum" 1; }

        .aura-visual { position: relative; border-radius: 50%; flex: 0 0 auto; }
        .aura-glow {
          position: absolute; inset: 6%;
          border-radius: 50%;
          background: radial-gradient(circle, var(--aura-color) 0%, transparent 72%);
          opacity: 0.55;
          animation: aura-pulse 2.3s ease-in-out infinite;
        }
        @keyframes aura-pulse { 0%, 100% { transform: scale(0.9); opacity: 0.4; } 50% { transform: scale(1.08); opacity: 0.7; } }
        .aura-ring { position: absolute; border-radius: 50%; border: 2px solid var(--aura-color); opacity: 0.5; }
        .aura-ring-0 { inset: 0; animation: aura-spin 7s linear infinite; }
        .aura-ring-1 { inset: 12%; opacity: 0.38; animation: aura-spin-rev 5s linear infinite; }
        .aura-ring-2 { inset: -10%; opacity: 0.22; border-style: dashed; animation: aura-spin 10s linear infinite; }
        @keyframes aura-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes aura-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .aura-particle-layer { position: absolute; inset: 0; overflow: hidden; border-radius: 50%; }
        .aura-particle {
          position: absolute; bottom: 4%; width: 6%; height: 6%;
          border-radius: 50%;
          background: var(--aura-color);
          opacity: 0;
          animation-name: aura-float;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes aura-float {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          18% { opacity: 0.9; }
          100% { transform: translate(var(--drift), -340%) scale(1); opacity: 0; }
        }
        .aura-chromatic { animation: aura-hue 3.2s linear infinite; }
        @keyframes aura-hue { from { filter: hue-rotate(0deg) saturate(1.7); } to { filter: hue-rotate(360deg) saturate(1.7); } }

        @media (prefers-reduced-motion: reduce) {
          .aura-glow, .aura-ring, .aura-particle, .aura-chromatic, .ar-roll-lucky-tag, .ar-roll-btn.lucky-glow { animation: none !important; }
        }
        .ar-rolls-caption { font-size: 13px; color: var(--ink-soft); font-weight: 500; }

        .ar-nav { display: flex; gap: 8px; margin-top: 2px; }
        .ar-icon-btn {
          width: 38px; height: 38px;
          border-radius: 19px;
          background: var(--bg);
          border: 1.5px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink);
          cursor: pointer;
        }
        .ar-icon-btn.active { background: var(--ink); color: #fff; border-color: var(--ink); }
        .ar-icon-btn:active { transform: scale(0.94); }
        .ar-icon-btn:disabled { opacity: 0.35; cursor: default; }

        .ar-main { max-width: 460px; margin: 0 auto; padding: 18px 20px 0; display: flex; flex-direction: column; align-items: center; }

        .ar-panel {
          width: 100%;
          border: 2px solid var(--ink);
          border-radius: 32px;
          min-height: 340px;
          max-height: 50vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 16px;
          background: var(--bg);
        }
        .ar-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 12px; border-bottom: 1px solid var(--line); flex: 0 0 auto; }
        .ar-panel-title { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
        .ar-panel-close { width: 30px; height: 30px; border-radius: 15px; border: none; background: var(--fill); color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ar-panel-scroll { flex: 1; overflow-y: auto; padding: 4px 18px 18px; }

        .ar-reveal-area { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .ar-reveal-area .aura-visual { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .ar-ring {
          position: absolute; top: 50%; left: 50%;
          width: 150px; height: 150px; margin: -75px 0 0 -75px;
          border-radius: 50%;
          border: 2.5px solid;
          opacity: 0;
          animation: ar-ring-pulse 1.1s ease-out forwards;
        }
        @keyframes ar-ring-pulse { 0% { transform: scale(0.55); opacity: 0.5; } 70% { opacity: 0.12; } 100% { transform: scale(1.7); opacity: 0; } }
        .ar-reveal-stack { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .ar-reveal-text {
          font-size: clamp(26px, 8vw, 34px);
          font-weight: 800;
          letter-spacing: -0.02em;
          text-align: center;
        }
        .ar-reveal-text.ar-pop { animation: ar-text-pop .4s cubic-bezier(.34,1.56,.64,1); }
        @keyframes ar-text-pop { 0% { transform: scale(0.85); } 55% { transform: scale(1.08); } 100% { transform: scale(1); } }
        .ar-reveal-chance { font-size: 13px; font-weight: 500; color: var(--ink-soft); font-feature-settings: "tnum" 1; }

        .ar-action-row { display: flex; gap: 10px; width: 100%; margin-bottom: 10px; }
        .ar-roll-btn {
          position: relative;
          overflow: hidden;
          flex: 2;
          padding: 18px 0 20px;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
        }
        .ar-roll-label { display: block; line-height: 1.2; }
        .ar-roll-lucky-tag {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: #fff;
          margin-top: 2px;
          animation: ar-lucky-pulse 1s ease-in-out infinite;
        }
        @keyframes ar-lucky-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .ar-roll-ring-svg { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
        .ar-roll-ring-stroke { transition: stroke-dashoffset 0.3s ease; }
        .ar-roll-btn.lucky-glow { animation: ar-lucky-glow 1.1s ease-in-out infinite; }
        @keyframes ar-lucky-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
          50% { box-shadow: 0 0 18px 5px rgba(0,0,0,0.5); }
        }
        .ar-roll-btn:active { transform: scale(0.98); }
        .ar-roll-btn:disabled { opacity: 0.45; cursor: default; }
        .ar-fast-btn {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
          border-radius: 16px;
          border: 2px solid var(--ink);
          background: #fff;
          color: var(--ink);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 4px 2px;
          text-align: center;
        }
        .ar-fast-btn:disabled { opacity: 0.5; cursor: default; }
        .ar-fast-btn.locked { border-style: dashed; color: var(--ink-soft); }
        .ar-fast-btn.on { background: var(--ink); color: #fff; }
        .ar-fast-btn.on:disabled { opacity: 1; }
        .ar-roll-hint { font-size: 12px; color: var(--ink-soft); margin-bottom: 18px; text-align: center; }

        .ar-inventory-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 16px;
          border-radius: 16px;
          border: 2px solid var(--ink);
          background: #fff;
          color: var(--ink);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }
        .ar-inventory-btn.active { background: var(--ink); color: #fff; }
        .ar-inventory-btn:disabled { opacity: 0.4; cursor: default; }

        .ar-dot { display: inline-block; border-radius: 50%; flex: 0 0 auto; }

        .ar-section-label { font-size: 13px; color: var(--ink-soft); font-weight: 500; padding: 10px 2px 8px; }
        .ar-tier-label { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; padding: 4px 2px 8px; }
        .ar-tier-count { margin-left: auto; font-size: 12px; font-weight: 500; color: var(--ink-soft); font-feature-settings: "tnum" 1; }
        .ar-group { border: 1.5px solid var(--line); border-radius: 16px; overflow: hidden; }

        .ar-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 4px; }
        .ar-stat-card { background: var(--bg); border: 1.5px solid var(--line); border-radius: 16px; padding: 14px 16px; }
        .ar-stat-label { font-size: 12px; color: var(--ink-soft); font-weight: 500; margin-bottom: 6px; }
        .ar-stat-value { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; font-feature-settings: "tnum" 1; }

        .ar-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; border-bottom: 1px solid var(--line); }
        .ar-row:last-child { border-bottom: none; }
        .ar-row.locked { opacity: 0.4; }
        .ar-row-main { display: flex; align-items: center; gap: 10px; }
        .ar-row-text { display: flex; flex-direction: column; }
        .ar-row-name { font-size: 14px; font-weight: 600; }
        .ar-row-sub { font-size: 12px; color: var(--ink-soft); margin-top: 1px; }
        .ar-row-trail { font-size: 14px; font-weight: 600; color: var(--ink-soft); font-feature-settings: "tnum" 1; }
        .ar-row-end { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .ar-preview-btn {
          width: 26px; height: 26px;
          border-radius: 8px;
          border: 1.5px solid var(--line);
          background: var(--bg);
          color: var(--ink-soft);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex: 0 0 auto;
        }
        .ar-preview-btn:active { background: var(--fill); color: var(--ink); }

        .ar-ach-row { padding: 13px 14px; border-bottom: 1px solid var(--line); }
        .ar-ach-row:last-child { border-bottom: none; }
        .ar-ach-top { display: flex; align-items: center; gap: 10px; }
        .ar-ach-name { font-size: 14px; font-weight: 600; flex: 1; }
        .ar-ach-desc { font-size: 12px; color: var(--ink-soft); margin: 3px 0 0 26px; }
        .ar-bar-track { height: 4px; background: var(--fill); border-radius: 2px; overflow: hidden; margin: 8px 0 0 26px; }
        .ar-bar-fill { height: 100%; background: var(--ink); border-radius: 2px; }

        .ar-setting-row { display: flex; align-items: center; justify-content: space-between; padding: 14px; border-bottom: 1px solid var(--line); }
        .ar-setting-row:last-child { border-bottom: none; }
        .ar-setting-label { font-size: 14px; font-weight: 600; }
        .ar-setting-desc { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
        .ar-switch { width: 48px; height: 28px; border-radius: 14px; background: var(--fill); position: relative; cursor: pointer; flex: 0 0 auto; border: none; transition: background .15s; }
        .ar-switch.on { background: var(--ink); }
        .ar-switch-knob { position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: left .15s; }
        .ar-switch.on .ar-switch-knob { left: 22px; }

        .ar-reset-btn { display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; padding: 14px; margin-top: 18px; border-radius: 14px; border: none; background: #FFEBEA; color: #FF3B30; font-weight: 700; font-size: 14px; cursor: pointer; }
        .ar-reset-btn.armed { background: #FF3B30; color: #fff; }

        .ar-rarefind {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          background: #fff;
          border: 2px solid;
          border-radius: 16px;
          padding: 10px 22px;
          text-align: center;
          z-index: 61;
          max-width: 90vw;
          box-shadow: 0 12px 30px rgba(0,0,0,0.16);
          animation: ar-rarefind-in .3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes ar-rarefind-in { from { transform: translate(-50%, -20px) scale(0.92); opacity: 0; } to { transform: translate(-50%, 0) scale(1); opacity: 1; } }
        .ar-rarefind-name { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
        .ar-rarefind-chance { font-size: 12px; font-weight: 500; color: var(--ink-soft); margin-top: 1px; font-feature-settings: "tnum" 1; }

        .ar-toast {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          background: var(--ink); color: #fff;
          border-radius: 14px;
          padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          z-index: 60;
          max-width: 90vw;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          animation: ar-toast-in .25s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes ar-toast-in { from { transform: translate(-50%, -16px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .ar-toast-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); }
        .ar-toast-desc { font-size: 13px; font-weight: 600; }

        @media (prefers-reduced-motion: reduce) {
          .ar-ring, .ar-reveal-text.ar-pop, .ar-toast, .ar-rarefind { animation: none !important; }
          .ar-stage, .ar-vignette-fixed { transition: none !important; }
          .ar-cutscene-shape { transition: none !important; animation: none !important; opacity: 1 !important; transform: scale(1) !important; }
          .ar-cutscene-flash { animation: none !important; background: #fff !important; }
          .ar-stage.ar-shake { animation: none !important; }
        }
      `}</style>

      <div
        className="ar-vignette-fixed"
        style={{ opacity: zoomed ? 1 : 0, backdropFilter: zoomed ? "blur(9px)" : "blur(0px)", transitionProperty: "opacity, backdrop-filter", transitionDuration: `${zoomDuration}ms`, transitionTimingFunction: zoomed ? "ease-in" : "ease-out" }}
      />

      {cutscene && (
        <div className={`ar-cutscene ar-cutscene-${cutscene.stage}`} key={cutscene.key}>
          <div
            className="ar-cutscene-shape"
            style={{ "--cs-color": cutscene.color, "--spin-ms": `${CUTSCENE_DURATIONS[cutscene.type].spin}ms` }}
          >
            {cutscene.type === "star" ? (
              <Star className="ar-cutscene-star" fill={cutscene.color} color={cutscene.color} strokeWidth={1} />
            ) : (
              <svg viewBox="0 0 100 100" className="ar-cutscene-sparkle">
                <path d={sparklePath(cutscene.type === "six" ? 6 : 4)} fill={cutscene.color} />
              </svg>
            )}
          </div>
        </div>
      )}

      <div
        className={`ar-stage ${shaking ? "ar-shake" : ""}`}
        style={{ transform: zoomed ? `scale(${PEAK_SCALE})` : "scale(1)", transitionProperty: "transform", transitionDuration: `${zoomDuration}ms`, transitionTimingFunction: zoomed ? "linear" : "ease-out" }}
      >
        <header className="ar-header">
          <div className="ar-header-left">
            <div className="ar-badge-row">
              <div className="ar-badge">{badgeAura && <AuraVisual aura={badgeAura} size={36} />}</div>
              {badgeAura && <span className="ar-badge-chance">{formatChance(badgeAura.chance)}</span>}
            </div>
            <div className="ar-rolls-caption">{data.totalRolls.toLocaleString()} rolls so far</div>
          </div>
          <nav className="ar-nav">
            <button className={`ar-icon-btn ${view === "stats" ? "active" : ""}`} onClick={() => goToView("stats")} aria-label="Stats" disabled={blockingRoll}>
              <BarChart3 size={17} />
            </button>
            <button className={`ar-icon-btn ${view === "collection" ? "active" : ""}`} onClick={() => goToView("collection")} aria-label="Collection" disabled={blockingRoll}>
              <LayoutGrid size={17} />
            </button>
            <button className={`ar-icon-btn ${view === "achievements" ? "active" : ""}`} onClick={() => goToView("achievements")} aria-label="Achievements" disabled={blockingRoll}>
              <Trophy size={17} />
            </button>
            <button className={`ar-icon-btn ${view === "settings" ? "active" : ""}`} onClick={() => goToView("settings")} aria-label="Settings" disabled={blockingRoll}>
              <SettingsIcon size={17} />
            </button>
          </nav>
        </header>

        <main className="ar-main">
          <div className="ar-panel">
            {view === "roll" && (
              <div className="ar-reveal-area">
                {revealAura && <AuraVisual aura={revealAura} size={150} />}
                {burst &&
                  Array.from({ length: burst.rings }).map((_, i) => (
                    <span key={burst.key + "-" + i} className="ar-ring" style={{ borderColor: burst.color, animationDelay: `${i * 140}ms` }} />
                  ))}
                <div className="ar-reveal-stack">
                  <div className="ar-reveal-text ar-pop" key={popKey}>
                    {revealText}
                  </div>
                  {revealAura && <div className="ar-reveal-chance">{formatChance(revealAura.chance)}</div>}
                </div>
              </div>
            )}

            {view === "stats" && (
              <>
                <PanelHead title="Stats" onClose={() => setView("roll")} />
                <div className="ar-panel-scroll">
                  <div className="ar-stats-grid">
                    <div className="ar-stat-card">
                      <div className="ar-stat-label">Total rolls</div>
                      <div className="ar-stat-value">{data.totalRolls.toLocaleString()}</div>
                    </div>
                    <div className="ar-stat-card">
                      <div className="ar-stat-label">Time played</div>
                      <div className="ar-stat-value">{formatTime(data.playSeconds)}</div>
                    </div>
                    <div className="ar-stat-card">
                      <div className="ar-stat-label">Best aura</div>
                      <div className="ar-stat-value">{bestAura ? bestAura.name : "—"}</div>
                    </div>
                    <div className="ar-stat-card">
                      <div className="ar-stat-label">Collected</div>
                      <div className="ar-stat-value">{collectedCount} / {AURAS.length}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {view === "collection" && (
              <>
                <PanelHead title="Collection" onClose={() => setView("roll")} />
                <div className="ar-panel-scroll">
                  <div className="ar-section-label">{collectedCount} of {AURAS.length} found</div>
                  {TIERS.map((tierInfo, tierIdx) => {
                    const tierAuras = AURAS.filter((a) => a.tier === tierIdx);
                    const tierOwned = tierAuras.filter((a) => data.inventory[a.id]).length;
                    return (
                      <div key={tierInfo.name} style={{ marginBottom: 14 }}>
                        <div className="ar-tier-label">
                          <Dot color={tierInfo.color} size={9} />
                          {tierInfo.name}
                          <span className="ar-tier-count">{tierOwned}/{tierAuras.length}</span>
                        </div>
                        <div className="ar-group">
                          {tierAuras.map((a) => {
                            const owned = data.inventory[a.id] || 0;
                            return (
                              <div key={a.id} className={`ar-row ${owned ? "" : "locked"}`}>
                                <div className="ar-row-main">
                                  <Dot color={tierInfo.color} size={11} />
                                  <div className="ar-row-text">
                                    <span className="ar-row-name">{owned ? a.name : "Not found yet"}</span>
                                    <span className="ar-row-sub">{formatChance(a.chance)}</span>
                                  </div>
                                </div>
                                <div className="ar-row-end">
                                  <span className="ar-row-trail">{owned ? `×${owned}` : ""}</span>
                                  <button className="ar-preview-btn" onClick={() => previewAura(a)} aria-label={`Preview ${a.name} effect`}>
                                    <Eye size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {view === "achievements" && (
              <>
                <PanelHead title="Achievements" onClose={() => setView("roll")} />
                <div className="ar-panel-scroll">
                  <div className="ar-group">
                    {ACHIEVEMENTS_DEF.map((a) => {
                      const done = data.achievementsUnlocked.includes(a.id);
                      const progress = Math.min(a.metric(data), a.goal);
                      return (
                        <div className="ar-ach-row" key={a.id}>
                          <div className="ar-ach-top">
                            {done ? <CheckCircle2 size={20} color="#1c1c1e" /> : <Circle size={20} color="#D1D1D6" />}
                            <span className="ar-ach-name">{a.name}</span>
                            <span className="ar-row-trail">{progress}/{a.goal}</span>
                          </div>
                          <div className="ar-ach-desc">{a.desc}</div>
                          {!done && (
                            <div className="ar-bar-track">
                              <div className="ar-bar-fill" style={{ width: `${(progress / a.goal) * 100}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {view === "settings" && (
              <>
                <PanelHead title="Settings" onClose={() => setView("roll")} />
                <div className="ar-panel-scroll">
                  <div className="ar-group">
                    <div className="ar-setting-row">
                      <div>
                        <div className="ar-setting-label">Sound</div>
                        <div className="ar-setting-desc">A soft tick while rolling</div>
                      </div>
                      <button className={`ar-switch ${data.settings.sound ? "on" : ""}`} onClick={() => updateSettings({ sound: !data.settings.sound })}>
                        <span className="ar-switch-knob" />
                      </button>
                    </div>
                  </div>
                  <button className={`ar-reset-btn ${resetArmed ? "armed" : ""}`} onClick={handleResetClick}>
                    <RotateCcw size={15} />
                    {resetArmed ? "Tap again to confirm" : "Reset all progress"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="ar-action-row">
            <button ref={rollBtnRef} className={`ar-roll-btn ${showLucky ? "lucky-glow" : ""}`} onClick={doRoll} disabled={spinning}>
              <span className="ar-roll-label">Roll</span>
              {showLucky && <span className="ar-roll-lucky-tag">Lucky ×{LUCKY_MULTIPLIER}</span>}
              {btnSize.w > 0 && (
                <svg className="ar-roll-ring-svg" width={btnSize.w} height={btnSize.h} viewBox={`0 0 ${btnSize.w} ${btnSize.h}`}>
                  <rect
                    className="ar-roll-ring-stroke"
                    x={2.5}
                    y={2.5}
                    width={Math.max(btnSize.w - 5, 0)}
                    height={Math.max(btnSize.h - 5, 0)}
                    rx={13.5}
                    ry={13.5}
                    fill="none"
                    stroke="#000"
                    strokeWidth={5}
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray={100}
                    strokeDashoffset={100 - luckyChargeRatio * 100}
                  />
                  <rect
                    className="ar-roll-ring-stroke"
                    x={2.5}
                    y={2.5}
                    width={Math.max(btnSize.w - 5, 0)}
                    height={Math.max(btnSize.h - 5, 0)}
                    rx={13.5}
                    ry={13.5}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray={100}
                    strokeDashoffset={100 - luckyChargeRatio * 100}
                  />
                </svg>
              )}
            </button>
            <button
              className={`ar-fast-btn ${!fastUnlocked ? "locked" : ""} ${autoFast ? "on" : ""}`}
              onClick={toggleAutoFast}
              disabled={!fastUnlocked || (spinning && !autoFast)}
            >
              {!fastUnlocked ? <Lock size={16} /> : autoFast ? <Pause size={18} /> : <FastForward size={18} />}
              {!fastUnlocked ? `Unlocks at ${FAST_UNLOCK_ROLLS} rolls` : autoFast ? "Auto-rolling" : "Fast roll"}
            </button>
          </div>
          <div className="ar-roll-hint">or press space</div>

          <button className={`ar-inventory-btn ${view === "collection" ? "active" : ""}`} onClick={() => goToView("collection")} disabled={blockingRoll}>
            <LayoutGrid size={17} />
            Inventory
          </button>
        </main>
      </div>

      {rareFind && (
        <div className="ar-rarefind" key={rareFind.key} style={{ borderColor: colorOf(rareFind.aura) }}>
          <div className="ar-rarefind-name" style={{ color: colorOf(rareFind.aura) }}>
            {rareFind.aura.name}
          </div>
          <div className="ar-rarefind-chance">{formatChance(rareFind.aura.chance)}</div>
        </div>
      )}

      {toast && (
        <div className="ar-toast">
          <Trophy size={16} color="#fff" />
          <div>
            <div className="ar-toast-title">ACHIEVEMENT</div>
            <div className="ar-toast-desc">{toast.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

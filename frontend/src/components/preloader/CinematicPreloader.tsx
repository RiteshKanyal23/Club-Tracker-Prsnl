import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Text, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

type ScenePhase = 1 | 2 | 3 | 4;

const STATUS_STEPS = [
  "Initializing interface",
  "Connecting system modules",
  "Preparing workspace",
  "Loading experience",
  "System ready",
];

function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 8;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(p) * Math.cos(t);
      a[i * 3 + 1] = (Math.random() - 0.5) * 6;
      a[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
    }
    return a;
  }, [count]);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.04;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#67e8f9" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function EnergyStreams() {
  const group = useRef<THREE.Group>(null!);
  const curves = useMemo(() => [
    new THREE.CatmullRomCurve3([new THREE.Vector3(-5,-1,-2), new THREE.Vector3(-1.5,0.4,0), new THREE.Vector3(1.5,0.1,1), new THREE.Vector3(5,0.8,-1)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(4,-1.2,2.5), new THREE.Vector3(1,-0.2,0.8), new THREE.Vector3(-1,0.6,-0.8), new THREE.Vector3(-4,1,1.5)]),
  ], []);
  useFrame((s) => { if (group.current) group.current.rotation.y = s.clock.elapsedTime * 0.06; });
  return (
    <group ref={group}>
      {curves.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 48, 0.028, 6, false]} />
          <meshBasicMaterial color={i === 1 ? "#8b5cf6" : "#22d3ee"} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function HoloPanels({ visible }: { visible: boolean }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((s) => { if (g.current) g.current.rotation.y = s.clock.elapsedTime * 0.1; });
  if (!visible) return null;
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <Float key={i} speed={1.2} floatIntensity={0.3} rotationIntensity={0.15}>
            <mesh position={[Math.cos(a) * 3.1, 0, Math.sin(a) * 3.1]} rotation={[0, -a, 0]}>
              <planeGeometry args={[1.3, 0.8]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[Math.cos(a) * 3.1, 0, Math.sin(a) * 3.1]} rotation={[0, -a, 0]}>
              <planeGeometry args={[1.35, 0.85]} />
              <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.22} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function MathSymbols({ visible }: { visible: boolean }) {
  const g = useRef<THREE.Group>(null!);
  const chars = ["Σ", "π", "Δ", "λ", "∞", "ƒ"];
  useFrame((s) => { if (g.current) g.current.rotation.y = -s.clock.elapsedTime * 0.04; });
  if (!visible) return null;
  return (
    <group ref={g}>
      {chars.map((ch, i) => {
        const a = (i / chars.length) * Math.PI * 2;
        const r = 4.1;
        return (
          <Float key={i} speed={1} floatIntensity={0.4}>
            <Text position={[Math.cos(a) * r, (i % 2 === 0 ? 0.7 : -0.5), Math.sin(a) * r]} fontSize={0.32} color={i % 2 ? "#a78bfa" : "#67e8f9"} anchorX="center" anchorY="middle">
              {ch}
            </Text>
          </Float>
        );
      })}
    </group>
  );
}

function Core({ active }: { active: boolean }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    if (outer.current) outer.current.rotation.y += dt * 0.22;
    if (inner.current) { inner.current.rotation.x = t * 0.5; inner.current.rotation.y = t * 0.7; }
    if (ring1.current) { ring1.current.rotation.x = t * 0.6; ring1.current.rotation.z = t * 0.2; }
    if (ring2.current) { ring2.current.rotation.y = -t * 0.45; ring2.current.rotation.x = Math.PI / 3; }
  });
  const scale = active ? 1 : 0.001;
  return (
    <group ref={outer} scale={scale}>
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#0b1220" emissive="#3b82f6" emissiveIntensity={0.9} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring1}>
        <torusGeometry args={[1.6, 0.03, 10, 64]} />
        <meshStandardMaterial color="#94a3b8" emissive="#67e8f9" emissiveIntensity={0.45} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.0, 0.025, 10, 64]} />
        <meshStandardMaterial color="#a5b4fc" emissive="#8b5cf6" emissiveIntensity={0.4} metalness={0.9} roughness={0.25} />
      </mesh>
      <pointLight intensity={active ? 2 : 0} color="#22d3ee" distance={10} />
    </group>
  );
}

function CameraRig({ phase, reduced }: { phase: ScenePhase; reduced: boolean }) {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const radius = phase >= 3 ? 7.4 : 8.2;
    const speed = reduced ? 0.04 : 0.09;
    const x = Math.sin(t * speed) * radius;
    const z = Math.cos(t * speed) * radius;
    const y = 1.1 + Math.sin(t * 0.16) * 0.35 + (phase === 1 ? -0.6 : 0);
    camera.position.lerp(new THREE.Vector3(x, y, z), 0.04);
    camera.lookAt(0, phase >= 3 ? 0.25 : 0, 0);
  });
  return null;
}

function Scene({ phase, reduced, onReady }: { phase: ScenePhase; reduced: boolean; onReady: () => void }) {
  const { progress } = useProgress();
  const readyRef = useRef(false);
  useEffect(() => {
    if (!readyRef.current && progress >= 100) { readyRef.current = true; onReady(); }
  }, [progress, onReady]);

  const showCore = phase >= 2;
  const showPanels = phase >= 2;
  const showSymbols = phase >= 2;
  const envIntensity = phase === 1 ? 0.2 : phase === 2 ? 0.7 : 1;

  return (
    <>
      <color attach="background" args={["#02040a"]} />
      <fog attach="fog" args={["#02040a", 9, 20]} />
      <ambientLight intensity={0.2 * envIntensity} />
      <directionalLight position={[5, 8, 5]} intensity={0.5 * envIntensity} color="#93c5fd" />
      <pointLight position={[-5, 2, -3]} intensity={0.6} color="#3b82f6" />

      <Particles count={reduced ? 40 : 90} />
      {phase >= 1 && <EnergyStreams />}
      <Core active={showCore} />
      <HoloPanels visible={showPanels} />
      <MathSymbols visible={showSymbols} />

      {/* Futuristic grid floor (lightweight) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#040814" metalness={0.7} roughness={0.35} />
      </mesh>
      <gridHelper args={[30, 30, "#22d3ee", "#0f172a"]} position={[0, -2.59, 0]} />

      <CameraRig phase={phase} reduced={reduced} />
    </>
  );
}

export function CinematicPreloader({ onComplete }: { onComplete: () => void }) {
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [phase, setPhase] = useState<ScenePhase>(1);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const started = useRef(performance.now());
  const doneRef = useRef(false);

  // Scene timeline (auto cinematic, no interaction)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), reduced ? 700 : 2200);
    const t2 = setTimeout(() => setPhase(3), reduced ? 1400 : 4800);
    const t3 = setTimeout(() => setPhase(4), reduced ? 2100 : 7200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [reduced]);

  // Reflect actual loading where possible, but guarantee completion (no indefinite stuck state)
  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    let current = 0;
    const tick = (now: number) => {
      const elapsed = now - started.current;
      const duration = reduced ? 2200 : 6500;
      const target = Math.min(100, (elapsed / duration) * 100);
      const accel = assetsReady ? 2.4 : 1;
      current = Math.min(100, Math.max(current, current + Math.max(0.25, (target - current) * 0.12 * accel)));
      // Throttle React state updates to reduce lag
      if (now - lastUi > 120 || current >= 100) {
        lastUi = now;
        setDisplayProgress(current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [assetsReady, reduced]);

  useEffect(() => {
    const idx = displayProgress >= 99.5 ? 4 : displayProgress >= 75 ? 3 : displayProgress >= 50 ? 2 : displayProgress >= 25 ? 1 : 0;
    setStatusIdx(idx);
  }, [displayProgress]);

  // Failsafe: always complete and enter workspace even if something stalls
  useEffect(() => {
    const maxMs = reduced ? 4500 : 11000;
    const id = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase(4);
      setDisplayProgress(100);
      setExiting(true);
      setTimeout(onComplete, reduced ? 250 : 700);
    }, maxMs);
    return () => clearTimeout(id);
  }, [onComplete, reduced]);

  useEffect(() => {
    if (doneRef.current) return;
    // Auto transition once system ready (phase 4 visuals + progress complete)
    if (phase === 4 && displayProgress >= 99.5) {
      doneRef.current = true;
      setDisplayProgress(100);
      const id = setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, reduced ? 250 : 700);
      }, reduced ? 350 : 1100);
      return () => clearTimeout(id);
    }
  }, [phase, displayProgress, onComplete, reduced]);

  const progressInt = Math.min(100, Math.round(displayProgress));

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#02040a] text-white">
      <div className="absolute inset-0">
        <Canvas dpr={[1, 1.25]} camera={{ position: [0, 1.2, 8.5], fov: 45 }} gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}>
          <Suspense fallback={null}>
            <Scene phase={phase} reduced={!!reduced} onReady={() => setAssetsReady(true)} />
          </Suspense>
        </Canvas>
      </div>

      {/* cinematic overlays (lightweight) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.06),transparent_45%)]" />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.7)" }} />

      {/* Brand reveal (Scene 3+) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: reduced ? 0.25 : 0.8, ease: "easeOut" }} className="text-center relative">
              <div className="relative inline-block">
                <div className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-cyan via-[#3B82F6] to-violet">
                  TEAM ALGEBRA
                </div>
                {!reduced && (
                  <motion.div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 mix-blend-screen" initial={{ x: "-20%" }} animate={{ x: "420%" }} transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }} />
                )}
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0.25 : 0.7, delay: 0.15 }} className="mt-3 text-sm sm:text-base md:text-lg text-slate-200/90 uppercase tracking-[0.35em]">
                CLUB ACTIVITY TRACKER
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* System ready (Scene 4) */}
      <div className="absolute top-[58%] left-0 right-0 flex flex-col items-center pointer-events-none px-6">
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
              <div className="text-cyan tracking-[0.3em] text-xs sm:text-sm font-medium mb-1">SYSTEM INITIALIZED</div>
              <div className="text-slate-300 text-xs sm:text-sm">ENTERING YOUR WORKSPACE</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading interface */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end justify-between mb-2 text-[11px] sm:text-xs tracking-[0.25em] text-slate-300/90 uppercase pointer-events-none">
            <div>
              <div className="text-cyan/90 font-semibold">TEAM ALGEBRA SYSTEM</div>
              <div className="mt-1 text-slate-400 tracking-[0.18em]">{STATUS_STEPS[statusIdx]}...</div>
            </div>
            <div className="text-cyan font-semibold tabular-nums">{progressInt}%</div>
          </div>
          <div className="h-[3px] rounded-full bg-white/10 overflow-hidden border border-white/10 pointer-events-none">
            <div className="h-full bg-gradient-to-r from-[#3B82F6] via-[#22D3EE] to-[#8B5CF6]" style={{ width: `${progressInt}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-500 tracking-widest pointer-events-none">INITIALIZING CORE MODULES</span>
            <button
              type="button"
              onClick={() => { if (!doneRef.current) { doneRef.current = true; } onComplete(); }}
              className="pointer-events-auto px-4 py-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-900/30 hover:opacity-95 active:scale-[0.99] transition"
            >
              Enter Login Portal
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {exiting && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0.2 : 0.5 }} className="absolute inset-0 bg-[#02040a]" />}
      </AnimatePresence>
    </div>
  );
}

export default CinematicPreloader;

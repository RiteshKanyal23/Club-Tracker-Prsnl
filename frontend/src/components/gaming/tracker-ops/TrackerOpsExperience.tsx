import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Sky, Environment, Text } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "loading" | "playing" | "completed" | "exiting";

const MISSION_NAME = "TRACKER OPS – THE MISSION";
const OBJECTIVES = [
  { id: "project", label: "Locate the project" },
  { id: "progress", label: "Collect task progress information" },
  { id: "terminal", label: "Activate the completion terminal" },
];

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function dist2(a: THREE.Vector3, b: THREE.Vector3) { const dx = a.x - b.x, dz = a.z - b.z; return dx * dx + dz * dz; }

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return keys;
}

function Building({ position, size, color = "#9fb3c8", glass = false }: { position: [number, number, number]; size: [number, number, number]; color?: string; glass?: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshPhysicalMaterial color={color} metalness={glass ? 0.1 : 0.2} roughness={glass ? 0.05 : 0.6} transparent={glass} opacity={glass ? 0.45 : 1} transmission={glass ? 0.2 : 0} />
      </mesh>
      {!glass && Array.from({ length: Math.max(2, Math.floor(size[1] / 1.2)) }).map((_, r) => (
        Array.from({ length: Math.max(2, Math.floor(size[0] / 1.1)) }).map((__, c) => (
          <mesh key={`${r}-${c}`} position={[-size[0] / 2 + 0.7 + c * 1.1, -size[1] / 2 + 0.9 + r * 1.2, size[2] / 2 + 0.01]}>
            <planeGeometry args={[0.55, 0.7]} />
            <meshStandardMaterial emissive="#7dd3fc" emissiveIntensity={0.35} color="#0b1220" />
          </mesh>
        ))
      ))}
    </group>
  );
}

function Character({ target, moving, running, jumping }: { target: React.MutableRefObject<THREE.Group | null>; moving: boolean; running: boolean; jumping: boolean }) {
  const t = useRef(0);
  const leftLeg = useRef<THREE.Mesh>(null!);
  const rightLeg = useRef<THREE.Mesh>(null!);
  const leftArm = useRef<THREE.Mesh>(null!);
  const rightArm = useRef<THREE.Mesh>(null!);
  const body = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    t.current += dt * (running ? 10 : 6);
    const swing = moving ? Math.sin(t.current) * (running ? 0.7 : 0.45) : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.8;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.8;
    if (body.current) body.current.position.y = 1.05 + (moving ? Math.abs(Math.sin(t.current)) * 0.03 : Math.sin(t.current * 0.5) * 0.01) + (jumping ? 0.15 : 0);
  });
  return (
    <group ref={target}>
      <group ref={body} position={[0, 1.05, 0]}>
        <mesh castShadow position={[0, 0.45, 0]}><capsuleGeometry args={[0.22, 0.45, 6, 12]} /><meshStandardMaterial color="#1f2937" roughness={0.6} /></mesh>
        <mesh castShadow position={[0, 0.95, 0]}><sphereGeometry args={[0.18, 20, 20]} /><meshStandardMaterial color="#e5c7a1" roughness={0.5} /></mesh>
        <mesh ref={leftArm} castShadow position={[-0.32, 0.5, 0]}><capsuleGeometry args={[0.07, 0.38, 4, 8]} /><meshStandardMaterial color="#334155" /></mesh>
        <mesh ref={rightArm} castShadow position={[0.32, 0.5, 0]}><capsuleGeometry args={[0.07, 0.38, 4, 8]} /><meshStandardMaterial color="#334155" /></mesh>
        <mesh ref={leftLeg} castShadow position={[-0.12, 0.05, 0]}><capsuleGeometry args={[0.08, 0.45, 4, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
        <mesh ref={rightLeg} castShadow position={[0.12, 0.05, 0]}><capsuleGeometry args={[0.08, 0.45, 4, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[0.35, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Marker({ position, color = "#22d3ee", active = true, label }: { position: [number, number, number]; color?: string; active?: boolean; label?: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => { if (ref.current && active) { ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15; ref.current.rotation.y += 0.02; } });
  if (!active) return null;
  return (
    <group position={position}>
      <mesh ref={ref} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.4, 0.55, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {label && <Text position={[0, 1.2, 0]} fontSize={0.22} color="white" anchorX="center" anchorY="middle">{label}</Text>}
    </group>
  );
}

function WorldScene({
  onProgress, onComplete, paused, reducedMotion, mobileInput, requestInteractRef,
}: {
  onProgress: (s: { missionStage: number; objectiveIndex: number; objectivesDone: boolean[]; score: number; nearInteract: string | null; prompt: string; playerPos: THREE.Vector3; timeMs: number }) => void;
  onComplete: (score: number, xp: number, timeMs: number) => void;
  paused: boolean;
  reducedMotion: boolean;
  mobileInput: React.MutableRefObject<{ x: number; y: number; jump: boolean; interact: boolean; run: boolean }>;
  requestInteractRef: React.MutableRefObject<boolean>;
}) {
  const player = useRef<THREE.Group>(null!);
  const camTarget = useRef(new THREE.Vector3(0, 1.5, 18));
  const yaw = useRef(Math.PI);
  const pitch = useRef(0.15);
  const velY = useRef(0);
  const grounded = useRef(true);
  const keys = useKeys();
  const { gl } = useThree();
  const [moving, setMoving] = useState(false);
  const [running, setRunning] = useState(false);
  const [jumpingAnim, setJumpingAnim] = useState(false);

  const [missionStage, setMissionStage] = useState(1);
  const [objectivesDone, setObjectivesDone] = useState([false, false, false]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [cinematic, setCinematic] = useState(false);
  const startTime = useRef(performance.now());
  const finishedRef = useRef(false);
  const lastProgressRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // pointer lock for desktop camera
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      yaw.current -= e.movementX * 0.0025;
      pitch.current = clamp(pitch.current - e.movementY * 0.002, -0.6, 0.8);
    };
    const onClick = () => { if (!/Mobi|Android/i.test(navigator.userAgent)) el.requestPointerLock?.(); };
    el.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMove);
    return () => { el.removeEventListener("click", onClick); document.removeEventListener("mousemove", onMove); };
  }, [gl]);

  const positions = useMemo(() => ({
    spawn: new THREE.Vector3(0, 0, 22),
    entrance: new THREE.Vector3(0, 0, 8),
    opsDoor: new THREE.Vector3(0, 0, -2),
    terminal: new THREE.Vector3(0, 0, -10),
    objProject: new THREE.Vector3(-6, 0.5, -14),
    objProgress: new THREE.Vector3(6, 0.5, -16),
    objActivate: new THREE.Vector3(0, 0.5, -20),
    mainControl: new THREE.Vector3(0, 0, -24),
  }), []);

  useEffect(() => { if (player.current) player.current.position.copy(positions.spawn); }, [positions]);

  const tryInteract = useCallback(() => {
    if (!player.current) return;
    const p = player.current.position.clone();
    const nearTerminal = missionStage >= 3 && dist2(p, positions.terminal) < 6;
    const nearP = missionStage >= 4 && !objectivesDone[0] && dist2(p, positions.objProject) < 5;
    const nearProg = missionStage >= 4 && !objectivesDone[1] && dist2(p, positions.objProgress) < 5;
    const nearAct = missionStage >= 4 && !objectivesDone[2] && dist2(p, positions.objActivate) < 5;
    const nearMain = missionStage >= 5 && dist2(p, positions.mainControl) < 7;

    if (nearTerminal && missionStage === 3) { setMissionStage(4); setScore((s) => s + 150); }
    else if (nearP) { setObjectivesDone((o) => [true, o[1], o[2]]); setScore((s) => s + 120); }
    else if (nearProg) { setObjectivesDone((o) => [o[0], true, o[2]]); setScore((s) => s + 120); }
    else if (nearAct) { setObjectivesDone((o) => [o[0], o[1], true]); setScore((s) => s + 120); }
    else if (nearMain && missionStage >= 5 && objectivesDone.every(Boolean)) {
      setCinematic(true);
      setScore((s) => { const ns = s + 300; scoreRef.current = ns; return ns; });
      setTimeout(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        const t = performance.now() - startTime.current;
        onComplete(scoreRef.current, 500 + Math.max(0, Math.floor((180000 - t) / 1000)), t);
      }, 2200);
    }
  }, [missionStage, objectivesDone, onComplete, positions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "e") requestInteractRef.current = true; };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestInteractRef]);

  useFrame((state, dt) => {
    if (paused || cinematic || !player.current) return;
    const k = keys.current; const m = mobileInput.current;
    const forward = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0) + (-m.y);
    const strafe = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0) + (m.x);
    const run = k["shift"] || m.run;
    const jumpPressed = k[" "] || m.jump;
    const speed = (run ? 7.5 : 4.2) * dt;
    const dir = new THREE.Vector3(strafe, 0, forward);
    if (dir.lengthSq() > 1) dir.normalize();
    const sin = Math.sin(yaw.current), cos = Math.cos(yaw.current);
    const worldMove = new THREE.Vector3(dir.x * cos - dir.z * sin, 0, dir.x * sin + dir.z * cos).multiplyScalar(speed);
    player.current.position.add(worldMove);
    player.current.rotation.y = yaw.current + Math.PI;

    // bounds & simple building collisions
    player.current.position.x = clamp(player.current.position.x, -18, 18);
    player.current.position.z = clamp(player.current.position.z, -28, 24);
    // block outside walls except entrance corridor
    if (player.current.position.z < 8 && player.current.position.z > -2 && Math.abs(player.current.position.x) > 3.2) player.current.position.x = Math.sign(player.current.position.x) * 3.2;
    if (player.current.position.z < -2 && Math.abs(player.current.position.x) > 8.5) player.current.position.x = Math.sign(player.current.position.x) * 8.5;

    if (grounded.current && jumpPressed) { velY.current = 5.2; grounded.current = false; setJumpingAnim(true); }
    velY.current -= 14 * dt;
    player.current.position.y += velY.current * dt;
    if (player.current.position.y <= 0) { player.current.position.y = 0; velY.current = 0; grounded.current = true; setJumpingAnim(false); }

    setMoving(dir.lengthSq() > 0.001); setRunning(run && dir.lengthSq() > 0.001);

    // stage progression by location
    const p = player.current.position;
    if (missionStage === 1 && dist2(p, positions.entrance) < 16) setMissionStage(2);
    if (missionStage === 2 && p.z < -1.5) setMissionStage(3);

    if (objectivesDone.every(Boolean) && missionStage === 4) setMissionStage(5);

    if (requestInteractRef.current || m.interact) { requestInteractRef.current = false; m.interact = false; tryInteract(); }

    // camera follow
    const behind = new THREE.Vector3(Math.sin(yaw.current) * 5.5, 2.2 + pitch.current * 2.2, Math.cos(yaw.current) * 5.5);
    const desired = p.clone().add(new THREE.Vector3(0, 1.6, 0)).add(behind);
    camTarget.current.lerp(desired, 1 - Math.pow(0.001, dt));
    state.camera.position.copy(camTarget.current);
    state.camera.lookAt(p.x, p.y + 1.4, p.z);

    // prompts
    let nearInteract: string | null = null; let prompt = "";
    if (missionStage === 3 && dist2(p, positions.terminal) < 6) { nearInteract = "terminal"; prompt = "PRESS E / TAP TO INTERACT: Access project terminal"; }
    if (missionStage === 4 && !objectivesDone[0] && dist2(p, positions.objProject) < 5) { nearInteract = "obj1"; prompt = "PRESS E / TAP: Locate the project"; }
    if (missionStage === 4 && !objectivesDone[1] && dist2(p, positions.objProgress) < 5) { nearInteract = "obj2"; prompt = "PRESS E / TAP: Collect task progress information"; }
    if (missionStage === 4 && !objectivesDone[2] && dist2(p, positions.objActivate) < 5) { nearInteract = "obj3"; prompt = "PRESS E / TAP: Activate the completion terminal"; }
    if (missionStage >= 5 && objectivesDone.every(Boolean) && dist2(p, positions.mainControl) < 7) { nearInteract = "main"; prompt = "PRESS E / TAP: Activate main control system"; }

    const now = performance.now();
    if (now - lastProgressRef.current > 100 || nearInteract) {
      lastProgressRef.current = now;
      onProgress({ missionStage, objectiveIndex: objectivesDone.filter(Boolean).length, objectivesDone, score: scoreRef.current, nearInteract, prompt, playerPos: p.clone(), timeMs: now - startTime.current });
    }
  });

  const waypoint = missionStage === 1 ? positions.entrance : missionStage === 2 ? positions.opsDoor : missionStage === 3 ? positions.terminal : missionStage === 5 ? positions.mainControl : null;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 28]} fov={60} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[15, 25, 10]} intensity={1.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 6, -12]} intensity={1.2} color="#7dd3fc" />
      <pointLight position={[-6, 4, -16]} intensity={0.8} color="#22d3ee" />
      <pointLight position={[6, 4, -18]} intensity={0.8} color="#8b5cf6" />
      {!reducedMotion && <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} />}

      {/* ground / campus */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[60, 80]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 14]}>
        <planeGeometry args={[6, 20]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -10]}>
        <planeGeometry args={[8, 30]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* landscape */}
      {[[-12,0,16],[-10,0,10],[12,0,15],[10,0,9],[-14,0,4],[14,0,5]].map((p,i)=>(
        <group key={i} position={p as any}>
          <mesh castShadow position={[0,1.2,0]}><cylinderGeometry args={[0.2,0.25,2.4,8]} /><meshStandardMaterial color="#6b4f2a" /></mesh>
          <mesh castShadow position={[0,2.6,0]}><sphereGeometry args={[1.1,12,12]} /><meshStandardMaterial color="#166534" /></mesh>
        </group>
      ))}

      {/* buildings / campus */}
      <Building position={[-10, 3, 2]} size={[8, 6, 8]} color="#94a3b8" />
      <Building position={[10, 3.5, 0]} size={[7, 7, 9]} color="#8fa6bf" />
      <Building position={[0, 4, -14]} size={[18, 8, 24]} color="#64748b" />
      <Building position={[0, 3.5, -14]} size={[16.5, 6.5, 22.5]} color="#93c5fd" glass />

      {/* operations center details */}
      <mesh position={[0,0.5,-10]} castShadow receiveShadow><boxGeometry args={[3,1,1.2]} /><meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0,1.15,-10]}><boxGeometry args={[2.4,0.6,0.1]} /><meshStandardMaterial emissive="#22d3ee" emissiveIntensity={1.2} color="#0ea5e9" /></mesh>
      <Text position={[0,1.7,-10]} fontSize={0.28} color="#a5f3fc" anchorX="center">PROJECT TERMINAL</Text>

      {[[-6,1.2,-14,"PROJECT"],[6,1.2,-16,"PROGRESS"],[0,1.2,-20,"ACTIVATE"]].map((t,i)=>(
        <group key={i} position={[t[0] as number,0.4,t[2] as number]}>
          <mesh castShadow><boxGeometry args={[1.4,0.8,1]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0,0.55,0]}><boxGeometry args={[1.1,0.5,0.05]} /><meshStandardMaterial emissive={objectivesDone[i]?"#22c55e":"#38bdf8"} emissiveIntensity={1.1} color="#0b1220" /></mesh>
          <Text position={[0,1.05,0]} fontSize={0.18} color="white">{String(t[3])}</Text>
        </group>
      ))}

      <group position={[0,0,-24]}>
        <mesh castShadow><cylinderGeometry args={[1.6,1.8,1.2,24]} /><meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.25} /></mesh>
        <mesh position={[0,1.2,0]}><torusGeometry args={[1.2,0.08,16,48]} /><meshStandardMaterial emissive={cinematic||missionStage>=5?"#22d3ee":"#334155"} emissiveIntensity={cinematic?2:0.6} color="#0ea5e9" /></mesh>
        <Text position={[0,1.9,0]} fontSize={0.26} color="#67e8f9">MAIN CONTROL</Text>
      </group>

      {/* player */}
      <Character target={player} moving={moving} running={running} jumping={jumpingAnim} />

      {/* markers */}
      <Marker position={[positions.entrance.x, 1.2, positions.entrance.z]} active={missionStage===1} label="MAIN ENTRANCE" />
      <Marker position={[positions.opsDoor.x, 1.2, positions.opsDoor.z]} active={missionStage===2} color="#a78bfa" label="OPERATIONS CENTER" />
      <Marker position={[positions.terminal.x, 1.4, positions.terminal.z]} active={missionStage===3} color="#22d3ee" label="PROJECT TERMINAL" />
      <Marker position={[positions.objProject.x, 1.1, positions.objProject.z]} active={missionStage>=4 && !objectivesDone[0]} color="#f59e0b" label="PROJECT" />
      <Marker position={[positions.objProgress.x, 1.1, positions.objProgress.z]} active={missionStage>=4 && !objectivesDone[1]} color="#38bdf8" label="PROGRESS" />
      <Marker position={[positions.objActivate.x, 1.1, positions.objActivate.z]} active={missionStage>=4 && !objectivesDone[2]} color="#a78bfa" label="TERMINAL" />
      <Marker position={[positions.mainControl.x, 1.4, positions.mainControl.z]} active={missionStage>=5 && objectivesDone.every(Boolean)} color="#22c55e" label="MAIN CONTROL" />
      {waypoint && missionStage < 4 && <Marker position={[waypoint.x, 0.2, waypoint.z]} active color="#22d3ee" />}

      {/* cinematic ring */}
      {cinematic && (
        <mesh position={[0,2.2,-24]} rotation={[Math.PI/2,0,0]}>
          <ringGeometry args={[1.2, 3.5, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export function TrackerOpsExperience({ onRevealLogin }: { onRevealLogin: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [load, setLoad] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({ missionStage: 1, objectiveIndex: 0, objectivesDone: [false,false,false], score: 0, prompt: "", playerPos: new THREE.Vector3(), timeMs: 0, nearInteract: null as string|null });
  const [result, setResult] = useState<{ score: number; xp: number; timeMs: number } | null>(null);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const mobile = /Mobi|Android|iPhone|iPad/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");
  const mobileInput = useRef({ x: 0, y: 0, jump: false, interact: false, run: false });
  const requestInteractRef = useRef(false);

  useEffect(() => {
    let v = 0; const id = setInterval(() => { v = Math.min(100, v + (reducedMotion ? 20 : 7)); setLoad(v); if (v >= 100) { clearInterval(id); setTimeout(() => setPhase("playing"), reducedMotion ? 100 : 350); } }, 120);
    return () => clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && phase === "playing") setPaused((p) => !p); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const skip = useCallback(() => { setPhase("exiting"); setTimeout(onRevealLogin, 450); }, [onRevealLogin]);
  const onComplete = useCallback((score: number, xp: number, timeMs: number) => { setResult({ score, xp, timeMs }); setPhase("completed"); }, []);
  const enterPortal = useCallback(() => { setPhase("exiting"); setTimeout(onRevealLogin, 500); }, [onRevealLogin]);

  const stageText = hud.missionStage === 1 ? "MISSION 1: ENTER THE CAMPUS - Follow the waypoint to the main entrance."
    : hud.missionStage === 2 ? "MISSION 2: ENTER THE OPERATIONS CENTER - Locate and enter the project operations control room."
    : hud.missionStage === 3 ? "MISSION 3: FIND THE PROJECT TERMINAL - Approach the interactive project terminal."
    : hud.missionStage === 4 ? "MISSION 4: COMPLETE TRACKING OBJECTIVES - Locate project, collect progress, activate completion terminal."
    : "MISSION 5: ACTIVATE THE MAIN CONTROL SYSTEM - Reach and activate the main control station.";

  const mm = (() => {
    const x = ((hud.playerPos.x + 18) / 36) * 100; const y = ((hud.playerPos.z + 28) / 52) * 100;
    return { x: clamp(x, 2, 98), y: clamp(100 - y, 2, 98) };
  })();

  const formatTime = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#07101f] text-white overflow-hidden">
      {phase === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.12),transparent_40%),linear-gradient(180deg,#050814,#0b1024)] p-6">
          <div className="text-xs tracking-[0.35em] text-cyan/80 mb-3">TEAM ALGEBRA PRESENTS</div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide text-center mb-2">TRACKER OPS</h1>
          <div className="text-cyan/90 tracking-[0.25em] mb-8">THE MISSION</div>
          <div className="w-[min(520px,90vw)] h-2 rounded-full bg-white/10 overflow-hidden border border-white/10 mb-3"><div className="h-full bg-gradient-to-r from-accent via-violet to-cyan transition-all" style={{ width: `${load}%` }} /></div>
          <div className="text-sm text-slate-300 mb-6">Loading realistic operations campus... {load}%</div>
          <button onClick={skip} className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-sm">Skip Mission</button>
          {reducedMotion && <div className="mt-3 text-xs text-slate-400">Reduced-motion mode enabled.</div>}
        </div>
      )}

      {(phase === "playing" || phase === "completed") && (
        <>
          <div className="absolute inset-0">
            <Canvas shadows dpr={[1, reducedMotion ? 1.25 : 1.75]} gl={{ antialias: !reducedMotion, powerPreference: "high-performance" }}>
              <Suspense fallback={null}>
                <WorldScene onProgress={setHud} onComplete={onComplete} paused={paused || phase==="completed"} reducedMotion={!!reducedMotion} mobileInput={mobileInput} requestInteractRef={requestInteractRef} />
              </Suspense>
            </Canvas>
          </div>

          {/* HUD */}
          <div className="absolute inset-0 pointer-events-none p-3 md:p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-3">
              <div className="pointer-events-auto glass-strong rounded-xl border border-white/10 p-3 max-w-xl">
                <div className="text-[10px] tracking-[0.25em] text-cyan/80">{MISSION_NAME}</div>
                <div className="font-semibold text-sm md:text-base mt-1">{stageText}</div>
                <div className="mt-2 text-xs text-slate-300">Progress: Stage {hud.missionStage}/5 · Objectives {hud.objectiveIndex}/3 · Score {hud.score} · Time {formatTime(hud.timeMs)}</div>
                <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-accent to-cyan" style={{ width: `${(hud.missionStage/5)*100}%` }} /></div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="pointer-events-auto glass rounded-xl border border-white/10 p-2 w-32 h-32 relative overflow-hidden">
                  <div className="text-[10px] text-slate-300 mb-1">MINI-MAP</div>
                  <div className="absolute inset-2 mt-4 rounded bg-slate-900/70 border border-cyan/20">
                    <div className="absolute left-1/2 top-[15%] w-10 h-10 -translate-x-1/2 border border-white/20 bg-white/5" />
                    <div className="absolute left-1/2 top-[55%] w-14 h-14 -translate-x-1/2 border border-cyan/30 bg-cyan/10" />
                    <div className="absolute w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee]" style={{ left: `${mm.x}%`, top: `${mm.y}%`, transform: "translate(-50%,-50%)" }} />
                  </div>
                </div>
                <div className="pointer-events-auto flex gap-2">
                  <button onClick={() => setPaused((p)=>!p)} className="px-3 py-2 text-xs rounded-lg glass border border-white/15 hover:bg-white/10">{paused ? "Resume" : "Pause"}</button>
                  <button onClick={skip} className="px-3 py-2 text-xs rounded-lg glass border border-amber-300/30 text-amber-200 hover:bg-amber-500/10">Skip Mission</button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end gap-3">
              <div className="pointer-events-auto glass rounded-xl border border-white/10 p-3 text-xs text-slate-200 space-y-1 max-w-md">
                <div className="text-cyan/80 tracking-widest text-[10px]">OBJECTIVES</div>
                {hud.missionStage < 4 ? <div>Progress through mission stages to unlock objectives.</div> : OBJECTIVES.map((o,i)=>(<div key={o.id} className={hud.objectivesDone[i]?"text-emerald-300":"text-slate-300"}>{hud.objectivesDone[i]?"✓":"•"} {o.label}</div>))}
              </div>
              <div className="text-right space-y-2">
                {hud.prompt && <div className="pointer-events-none inline-block px-4 py-2 rounded-xl bg-black/50 border border-cyan/40 text-cyan-100 text-sm">{hud.prompt}</div>}
                <div className="pointer-events-none text-[10px] text-slate-300 glass rounded-lg px-3 py-2 border border-white/10">WASD Move · Mouse Look (click) · Shift Run · Space Jump · E Interact · ESC Pause</div>
              </div>
            </div>
          </div>

          {/* Mobile controls */}
          {mobile && phase === "playing" && (
            <div className="absolute inset-x-0 bottom-3 px-3 flex justify-between items-end pointer-events-none">
              <div className="pointer-events-auto grid grid-cols-3 gap-2">
                <div />
                <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.y=1} onTouchEnd={()=>mobileInput.current.y=0}>▲</button>
                <div />
                <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.x=-1} onTouchEnd={()=>mobileInput.current.x=0}>◀</button>
                <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.y=-1} onTouchEnd={()=>mobileInput.current.y=0}>▼</button>
                <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.x=1} onTouchEnd={()=>mobileInput.current.x=0}>▶</button>
              </div>
              <div className="pointer-events-auto flex flex-col gap-2">
                <button className="px-4 h-12 rounded-xl bg-accent/70 border border-accent/40" onTouchStart={()=>{mobileInput.current.jump=true;}} onTouchEnd={()=>mobileInput.current.jump=false}>Jump</button>
                <button className="px-4 h-12 rounded-xl bg-cyan/30 border border-cyan/40" onTouchStart={()=>{mobileInput.current.interact=true;}} onTouchEnd={()=>mobileInput.current.interact=false}>Interact</button>
                <button className="px-4 h-10 rounded-xl bg-white/10 border border-white/20" onTouchStart={()=>{mobileInput.current.run=true;}} onTouchEnd={()=>mobileInput.current.run=false}>Run</button>
              </div>
            </div>
          )}

          {/* Pause menu */}
          <AnimatePresence>
            {paused && phase === "playing" && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="glass-strong rounded-2xl border border-white/15 p-6 w-full max-w-md text-center">
                  <h2 className="text-2xl font-bold mb-2">Paused</h2>
                  <p className="text-slate-300 mb-5">Mission in progress. Resume to continue Tracker Ops.</p>
                  <div className="grid gap-2">
                    <button onClick={()=>setPaused(false)} className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-cyan font-medium">Resume</button>
                    <button onClick={skip} className="px-4 py-3 rounded-xl border border-white/20 bg-white/5">Skip Mission</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion cinematic */}
          <AnimatePresence>
            {phase === "completed" && result && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-black/50 flex items-center justify-center p-6">
                <motion.div initial={{scale:0.92,y:20}} animate={{scale:1,y:0}} className="glass-strong rounded-3xl border border-cyan/30 p-8 w-full max-w-xl text-center shadow-[0_0_60px_rgba(34,211,238,0.2)]">
                  <div className="text-5xl mb-3">🏆</div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white">MISSION COMPLETED</h1>
                  <div className="text-cyan/90 tracking-[0.2em] mt-2 mb-6">TRACKING SYSTEM ACTIVATED</div>
                  <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-400 text-xs">Mission Score</div><div className="text-xl font-bold">{result.score}</div></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-400 text-xs">Completion</div><div className="text-xl font-bold">100%</div></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-slate-400 text-xs">XP Earned</div><div className="text-xl font-bold text-cyan">{result.xp}</div></div>
                  </div>
                  <button onClick={enterPortal} className="w-full px-5 py-4 rounded-xl font-semibold bg-gradient-to-r from-accent via-violet to-cyan text-white shadow-neon text-lg">ENTER TEAM ALGEBRA</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {phase === "exiting" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-[#050814] z-[10000]" />}
      </AnimatePresence>
    </div>
  );
}

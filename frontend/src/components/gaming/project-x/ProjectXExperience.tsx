import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Sky } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "loading" | "playing" | "victory" | "exiting";
type Platform = { pos: [number, number, number]; size: [number, number, number]; color?: string; glass?: boolean; moving?: { axis: "x" | "z"; amp: number; speed: number; base: number }; type?: "normal" | "slide" | "climb" | "finish" };

const STAGES = [
  { id: 1, name: "STARTING POINT", desc: "Learn the controls and begin the run." },
  { id: 2, name: "ROOFTOP RUN", desc: "Run and jump across rooftop platforms." },
  { id: 3, name: "SKY BRIDGE", desc: "Cross elevated bridges and moving platforms." },
  { id: 4, name: "EXTREME PARKOUR", desc: "Climb, slide, and make precision jumps." },
  { id: 5, name: "FINAL DESTINATION", desc: "Reach TEAM ALGEBRA HQ and activate the portal." },
];

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const d = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; keys.current[e.code] = true; };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; keys.current[e.code] = false; };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);
  return keys;
}

function PlayerModel({ moving, sprinting, jumping, sliding, climbing, falling }: { moving: boolean; sprinting: boolean; jumping: boolean; sliding: boolean; climbing: boolean; falling: boolean }) {
  const g = useRef<THREE.Group>(null!);
  const la = useRef<THREE.Mesh>(null!); const ra = useRef<THREE.Mesh>(null!); const ll = useRef<THREE.Mesh>(null!); const rl = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt * (sprinting ? 13 : moving ? 9 : 3);
    const swing = moving && !sliding ? Math.sin(t.current) * (sprinting ? 0.9 : 0.55) : Math.sin(t.current) * 0.05;
    if (ll.current) ll.current.rotation.x = swing;
    if (rl.current) rl.current.rotation.x = -swing;
    if (la.current) la.current.rotation.x = -swing * 0.8 + (climbing ? -1.2 : 0);
    if (ra.current) ra.current.rotation.x = swing * 0.8 + (climbing ? -1.2 : 0);
    if (g.current) {
      g.current.rotation.x = sliding ? -0.6 : falling ? 0.15 : 0;
      g.current.position.y = sliding ? 0.55 : 1.0 + (moving ? Math.abs(Math.sin(t.current)) * 0.04 : 0) + (jumping ? 0.05 : 0);
    }
  });
  return (
    <group ref={g}>
      <mesh castShadow position={[0, 0.45, 0]}><capsuleGeometry args={[0.22, 0.42, 6, 12]} /><meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.15} /></mesh>
      <mesh castShadow position={[0, 0.95, 0]}><sphereGeometry args={[0.17, 16, 16]} /><meshStandardMaterial color="#f1d3b3" /></mesh>
      <mesh castShadow position={[0, 0.98, 0.12]}><boxGeometry args={[0.18, 0.08, 0.08]} /><meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} /></mesh>
      <mesh ref={la} castShadow position={[-0.31, 0.5, 0]}><capsuleGeometry args={[0.06, 0.36, 4, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
      <mesh ref={ra} castShadow position={[0.31, 0.5, 0]}><capsuleGeometry args={[0.06, 0.36, 4, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
      <mesh ref={ll} castShadow position={[-0.12, 0.08, 0]}><capsuleGeometry args={[0.075, 0.42, 4, 8]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh ref={rl} castShadow position={[0.12, 0.08, 0]}><capsuleGeometry args={[0.075, 0.42, 4, 8]} /><meshStandardMaterial color="#111827" /></mesh>
    </group>
  );
}

function Building({ position, size, color = "#334155", emissive = "#38bdf8" }: { position: [number, number, number]; size: [number, number, number]; color?: string; emissive?: string }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.5} /></mesh>
      {Array.from({ length: Math.max(2, Math.floor(size[1] / 1.5)) }).map((_, r) => (
        Array.from({ length: Math.max(2, Math.floor(size[0] / 1.4)) }).map((__, c) => (
          <mesh key={`${r}-${c}`} position={[-size[0] / 2 + 0.8 + c * 1.4, -size[1] / 2 + 1 + r * 1.5, size[2] / 2 + 0.02]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial emissive={emissive} emissiveIntensity={0.25} color="#020617" />
          </mesh>
        ))
      ))}
    </group>
  );
}

function PlatformMesh({ p, time }: { p: Platform; time: number }) {
  const x = p.moving && p.moving.axis === "x" ? p.moving.base + Math.sin(time * p.moving.speed) * p.moving.amp : p.pos[0];
  const z = p.moving && p.moving.axis === "z" ? p.moving.base + Math.sin(time * p.moving.speed) * p.moving.amp : p.pos[2];
  return (
    <group position={[x, p.pos[1], z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={p.size} />
        <meshPhysicalMaterial color={p.glass ? "#93c5fd" : p.color || "#475569"} metalness={p.glass ? 0.05 : 0.2} roughness={p.glass ? 0.05 : 0.7} transparent={!!p.glass} opacity={p.glass ? 0.35 : 1} transmission={p.glass ? 0.15 : 0} />
      </mesh>
      {p.type === "slide" && <mesh position={[0, p.size[1] / 2 + 0.02, 0]} rotation={[-0.15, 0, 0]}><boxGeometry args={[p.size[0]*0.9, 0.05, p.size[2]*0.9]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} /></mesh>}
      {p.type === "climb" && <mesh position={[0, p.size[1] / 2 + 0.8, -p.size[2]/2 + 0.1]}><boxGeometry args={[p.size[0]*0.8, 1.6, 0.15]} /><meshStandardMaterial color="#334155" emissive="#22d3ee" emissiveIntensity={0.15} /></mesh>}
    </group>
  );
}

function GameScene({ onHud, onWin, paused, quality, mobileInput, interactRef }: { onHud: (h: any) => void; onWin: (score: number, time: number) => void; paused: boolean; quality: "low"|"high"; mobileInput: React.MutableRefObject<any>; interactRef: React.MutableRefObject<boolean> }) {
  const player = useRef<THREE.Group>(null!);
  const keys = useKeys();
  const { gl } = useThree();
  const yaw = useRef(0); const pitch = useRef(0.2);
  const vel = useRef(new THREE.Vector3());
  const grounded = useRef(false); const jumps = useRef(0);
  const sliding = useRef(false); const slideT = useRef(0);
  const [anim, setAnim] = useState({ moving: false, sprinting: false, jumping: false, sliding: false, climbing: false, falling: false });
  const [cpIndex, setCpIndex] = useState(0);
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const start = useRef(performance.now());
  const timeRef = useRef(0);
  const won = useRef(false);

  const checkpoints = useMemo(() => [new THREE.Vector3(0, 2.1, 0), new THREE.Vector3(0, 4.1, -18), new THREE.Vector3(0, 6.1, -38), new THREE.Vector3(0, 8.1, -58), new THREE.Vector3(0, 10.1, -78)], []);
  const platforms: Platform[] = useMemo(() => ([
    { pos:[0,1,0], size:[8,2,8], color:"#334155" },
    { pos:[0,3,-10], size:[6,1,6], color:"#475569" },
    { pos:[3,3.5,-16], size:[4,1,4], color:"#475569" }, { pos:[-3,4,-22], size:[4,1,4], color:"#475569" },
    { pos:[0,5,-30], size:[10,1,3], glass:true }, { pos:[0,5.5,-36], size:[3,1,8], moving:{axis:"x",amp:3,speed:1.2,base:0} },
    { pos:[0,6,-44], size:[6,1,6], color:"#475569" },
    { pos:[-4,6.5,-50], size:[3,1,5], color:"#334155", type:"slide" }, { pos:[4,7,-54], size:[3,2,3], color:"#334155", type:"climb" },
    { pos:[0,8,-62], size:[5,1,5], color:"#475569" }, { pos:[0,8.5,-68], size:[3,1,7], moving:{axis:"z",amp:2.5,speed:1.4,base:-68} },
    { pos:[0,9,-74], size:[4,1,4], color:"#475569" },
    { pos:[0,10,-82], size:[12,2,10], color:"#1e293b", type:"finish" },
  ]), []);

  useEffect(() => { if (player.current) player.current.position.copy(checkpoints[0]); }, [checkpoints]);
  useEffect(() => {
    const el = gl.domElement;
    const mm = (e: MouseEvent) => { if (document.pointerLockElement !== el) return; yaw.current -= e.movementX * 0.0025; pitch.current = clamp(pitch.current - e.movementY * 0.002, -0.5, 0.8); };
    const click = () => { if (!/Mobi|Android/i.test(navigator.userAgent)) el.requestPointerLock?.(); };
    el.addEventListener("click", click); document.addEventListener("mousemove", mm);
    return () => { el.removeEventListener("click", click); document.removeEventListener("mousemove", mm); };
  }, [gl]);
  useEffect(() => { const kd=(e:KeyboardEvent)=>{ if(e.key.toLowerCase()==='e') interactRef.current=true; }; window.addEventListener('keydown',kd); return ()=>window.removeEventListener('keydown',kd); }, [interactRef]);

  const respawn = useCallback(() => {
    if (!player.current) return;
    player.current.position.copy(checkpoints[cpIndex]);
    vel.current.set(0,0,0); grounded.current = false; jumps.current = 0;
  }, [checkpoints, cpIndex]);

  useFrame((state, dt) => {
    timeRef.current += dt;
    if (paused || won.current || !player.current) { onHud({ stage, cpIndex, score, timeMs: performance.now()-start.current, prompt: paused?"Paused":"" , status: "Paused"}); return; }
    const k = keys.current; const m = mobileInput.current;
    const fwd = (k['w']||k['arrowup']?1:0)-(k['s']||k['arrowdown']?1:0)+(-m.y);
    const str = (k['d']||k['arrowright']?1:0)-(k['a']||k['arrowleft']?1:0)+(m.x);
    const sprint = !!(k['shift']||m.sprint);
    const wantSlide = !!(k['control']||k['ctrl']||m.slide);
    const wantJump = !!(k[' ']||m.jump);

    if (wantSlide && grounded.current && !sliding.current) { sliding.current = true; slideT.current = 0.55; }
    if (sliding.current) { slideT.current -= dt; if (slideT.current <= 0) sliding.current = false; }

    const speed = sliding.current ? 8 : sprint ? 7.5 : 4.5;
    const dir = new THREE.Vector3(str, 0, fwd); if (dir.lengthSq()>1) dir.normalize();
    const sin = Math.sin(yaw.current), cos = Math.cos(yaw.current);
    const move = new THREE.Vector3(dir.x*cos - dir.z*sin, 0, dir.x*sin + dir.z*cos).multiplyScalar(speed);

    vel.current.x = move.x; vel.current.z = move.z;
    vel.current.y -= 18 * dt;

    // jump / double jump
    if (wantJump && !k['_jp'] && !m._jp) {
      if (grounded.current) { vel.current.y = 7.2; grounded.current = false; jumps.current = 1; }
      else if (jumps.current < 2) { vel.current.y = 6.4; jumps.current = 2; setScore(s=>s+10); }
      k['_jp'] = true; m._jp = true;
    }
    if (!wantJump) { k['_jp']=false; m._jp=false; }

    player.current.position.addScaledVector(vel.current, dt);

    // platform collisions (simple AABB feet)
    grounded.current = false; let onPlatformY: number | null = null; let climb = false;
    const px = player.current.position.x, pz = player.current.position.z, py = player.current.position.y;
    for (const p of platforms) {
      const ox = p.moving && p.moving.axis === "x" ? p.moving.base + Math.sin(timeRef.current * p.moving.speed) * p.moving.amp : p.pos[0];
      const oz = p.moving && p.moving.axis === "z" ? p.moving.base + Math.sin(timeRef.current * p.moving.speed) * p.moving.amp : p.pos[2];
      const top = p.pos[1] + p.size[1]/2;
      if (Math.abs(px - ox) <= p.size[0]/2 + 0.25 && Math.abs(pz - oz) <= p.size[2]/2 + 0.25) {
        if (py <= top + 0.05 && py >= top - 1.0 && vel.current.y <= 0) { onPlatformY = top; grounded.current = true; jumps.current = 0; }
        if (p.type === 'climb' && Math.abs(px-ox) < p.size[0]/2 && Math.abs(pz - (oz - p.size[2]/2)) < 0.6 && py < top + 2.2) climb = true;
      }
    }
    if (climb && (fwd>0 || wantJump)) { vel.current.y = Math.max(vel.current.y, 2.2); grounded.current = true; }
    if (onPlatformY !== null && py < onPlatformY) { player.current.position.y = onPlatformY; vel.current.y = 0; }

    // fall / respawn
    if (player.current.position.y < -8) { respawn(); setScore(s=>Math.max(0,s-20)); }

    // checkpoints & stages
    checkpoints.forEach((c, i) => {
      if (i > cpIndex && player.current && player.current.position.distanceTo(c) < 2.2) {
        setCpIndex(i); setScore(s=>s+100); setStage(Math.min(5, i+1));
      }
    });

    // finish
    const hq = new THREE.Vector3(0, 11, -82);
    const nearHQ = player.current.position.distanceTo(hq) < 3.5;
    if (nearHQ && (interactRef.current || m.interact)) { interactRef.current = false; m.interact = false; if(!won.current){ won.current=true; onWin(score+300, performance.now()-start.current);} }

    const moving = dir.lengthSq() > 0.001;
    setAnim({ moving, sprinting: sprint && moving, jumping: !grounded.current && vel.current.y > 0.1, sliding: sliding.current, climbing: climb, falling: !grounded.current && vel.current.y < -0.2 });
    player.current.rotation.y = yaw.current + Math.PI;

    const camBehind = new THREE.Vector3(Math.sin(yaw.current)*5.2, 2.4 + pitch.current*2, Math.cos(yaw.current)*5.2);
    const desired = player.current.position.clone().add(new THREE.Vector3(0,1.5,0)).add(camBehind);
    state.camera.position.lerp(desired, 0.12);
    state.camera.lookAt(player.current.position.x, player.current.position.y + 1.3, player.current.position.z);

    const prompt = nearHQ ? "Press E / Tap Interact: ACTIVATE FINAL PORTAL at TEAM ALGEBRA HQ" : stage===1 ? "WASD move · Mouse look · Space jump (double jump) · Shift sprint · Ctrl slide" : "";
    const status = sliding.current ? "Sliding" : climb ? "Climbing" : !grounded.current ? (vel.current.y>0?"Jumping":"Falling") : moving ? (sprint?"Sprinting":"Running") : "Idle";
    onHud({ stage, cpIndex, score, timeMs: performance.now()-start.current, prompt, status });
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0,4,8]} fov={65} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[20,30,10]} intensity={1.7} castShadow={quality==='high'} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0,12,-82]} intensity={2} color="#22d3ee" />
      {quality==='high' && <Sky sunPosition={[100,25,100]} turbidity={6} rayleigh={2} />}
      <fog attach="fog" args={["#0b1024", 20, 120]} />

      {/* city background */}
      {Array.from({length: quality==='high'?14:8}).map((_,i)=>{
        const x=(i%7-3)*18 + (i>6?6:0), z=-40 - Math.floor(i/7)*30 - (i%3)*8, h=20+(i*7)%30;
        return <Building key={i} position={[x, h/2-8, z]} size={[8,h,8]} color="#1f2937" emissive={i%2?"#22d3ee":"#8b5cf6"} />;
      })}

      {/* platforms */}
      {platforms.map((p,i)=><PlatformMesh key={i} p={p} time={timeRef.current} />)}

      {/* checkpoints */}
      {checkpoints.map((c,i)=> (
        <group key={i} position={[c.x, c.y-0.9, c.z]}>
          <mesh><torusGeometry args={[0.7,0.05,12,32]} /><meshStandardMaterial emissive={i<=cpIndex?"#22c55e":"#22d3ee"} emissiveIntensity={i===cpIndex?1.8:0.8} color={i<=cpIndex?"#22c55e":"#22d3ee"} /></mesh>
          <pointLight intensity={i===cpIndex?1.2:0.4} distance={6} color={i<=cpIndex?"#22c55e":"#22d3ee"} />
          {i===4 && <mesh position={[0,2.2,0]}><boxGeometry args={[3.2,0.5,0.2]} /><meshStandardMaterial emissive="#22d3ee" emissiveIntensity={1.2} color="#0ea5e9" /></mesh>}
        </group>
      ))}

      {/* player */}
      <group ref={player}><PlayerModel {...anim} /></group>
    </>
  );
}

class GameErrorBoundary extends React.Component<{onError:()=>void; children:React.ReactNode}, {hasError:boolean}> {
  constructor(p:any){super(p); this.state={hasError:false};}
  static getDerivedStateFromError(){return {hasError:true};}
  componentDidCatch(){this.props.onError();}
  render(){ if(this.state.hasError) return <div className="absolute inset-0 flex items-center justify-center bg-[#050814] text-white p-6 text-center"><div><div className="text-xl font-bold mb-2">Preloader unavailable</div><div className="text-slate-300 mb-4">Continuing to login portal…</div></div></div>; return this.props.children as any; }
}

export function ProjectXExperience({ onRevealLogin }: { onRevealLogin: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [load, setLoad] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({ stage:1, cpIndex:0, score:0, timeMs:0, prompt:"", status:"Idle" });
  const [quality, setQuality] = useState<"low"|"high">(() => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'low':'high'));
  const [sound, setSound] = useState(true);
  const [result, setResult] = useState<{score:number; time:number}|null>(null);
  const mobileInput = useRef({x:0,y:0,jump:false,sprint:false,slide:false,interact:false,_jp:false});
  const interactRef = useRef(false);
  const reduced = useMemo(()=>typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,[]);

  useEffect(()=>{ let v=0; const id=setInterval(()=>{ v=Math.min(100,v+(reduced?20:8)); setLoad(v); if(v>=100){ clearInterval(id); setTimeout(()=>setPhase('playing'), reduced?100:300);} }, 100); return ()=>clearInterval(id); },[reduced]);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape' && phase==='playing') setPaused(p=>!p); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[phase]);

  const reveal = useCallback(()=>{ setPhase('exiting'); setTimeout(onRevealLogin, 450); },[onRevealLogin]);
  const onWin = useCallback((score:number,time:number)=>{ setResult({score,time}); setPhase('victory'); },[]);

  const fmt=(ms:number)=>{ const s=Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
  const stageInfo = STAGES[Math.max(0, Math.min(4, hud.stage-1))];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050814] text-white overflow-hidden select-none">
      {phase==='loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(180deg,#050814,#0b1024)] p-6">
          <div className="text-xs tracking-[0.4em] text-cyan/80 mb-2">PROJECT X</div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-2 text-center">THE FINAL RUN</h1>
          <div className="text-slate-300 mb-8">Rooftop Parkour Preloader · Team Algebra Club Tracker</div>
          <div className="w-[min(520px,90vw)] h-2 rounded-full bg-white/10 overflow-hidden border border-white/10 mb-2"><div className="h-full bg-gradient-to-r from-cyan via-accent to-violet" style={{width:`${load}%`}} /></div>
          <div className="text-sm text-slate-300 mb-6">Loading city environment... {load}%</div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={reveal} className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10">Skip Game</button>
            <button onClick={()=>setQuality(q=>q==='high'?'low':'high')} className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10">Quality: {quality.toUpperCase()}</button>
          </div>
          {reduced && <div className="mt-3 text-xs text-amber-200">Reduced-motion preference detected (low effects).</div>}
        </div>
      )}

      {(phase==='playing' || phase==='victory') && (
        <>
          <div className="absolute inset-0">
            <GameErrorBoundary onError={reveal}>
              <Canvas shadows={quality==='high'} dpr={quality==='high'?[1,1.75]:[1,1.25]} gl={{antialias:quality==='high', powerPreference:'high-performance'}}>
                <Suspense fallback={null}>
                  <GameScene onHud={setHud} onWin={onWin} paused={paused || phase==='victory'} quality={quality} mobileInput={mobileInput} interactRef={interactRef} />
                </Suspense>
              </Canvas>
            </GameErrorBoundary>
          </div>

          {/* HUD */}
          <div className="absolute inset-0 pointer-events-none p-3 md:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="pointer-events-auto glass-strong rounded-xl border border-cyan/20 p-3 max-w-xl">
                <div className="flex items-center justify-between gap-4 mb-1"><span className="text-[10px] tracking-[0.35em] text-cyan font-bold">PROJECT X</span><span className="text-[10px] text-slate-300">STAGE {hud.stage}/5</span></div>
                <div className="font-semibold">{stageInfo.name}</div>
                <div className="text-xs text-slate-300">{stageInfo.desc}</div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                  <div>Progress: {Math.round(((hud.cpIndex)/4)*100)}%</div><div>Checkpoint: {hud.cpIndex+1}/5</div><div>Time: {fmt(hud.timeMs)}</div><div>Score: {hud.score}</div>
                </div>
                <div className="mt-2 h-1.5 bg-white/10 rounded overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan to-violet" style={{width:`${((hud.cpIndex)/4)*100}%`}} /></div>
                <div className="mt-1 text-[11px] text-slate-400">Status: {hud.status}</div>
              </div>
              <div className="pointer-events-auto flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button onClick={()=>setPaused(p=>!p)} className="px-3 py-2 text-xs rounded-lg glass border border-white/15">{paused?'Resume':'Pause'}</button>
                  <button onClick={()=>setSound(s=>!s)} className="px-3 py-2 text-xs rounded-lg glass border border-white/15">Sound {sound?'On':'Off'}</button>
                  <button onClick={reveal} className="px-3 py-2 text-xs rounded-lg glass border border-amber-300/30 text-amber-200">Skip</button>
                </div>
                <button onClick={()=>window.location.reload()} className="px-3 py-1.5 text-[11px] rounded-lg border border-white/10 bg-white/5">Restart</button>
              </div>
            </div>
            <div className="flex justify-between items-end gap-3">
              <div className="glass rounded-xl border border-white/10 p-3 text-[11px] text-slate-200 max-w-md">
                <div className="text-cyan/80 tracking-widest text-[10px] mb-1">CONTROLS</div>
                Desktop: WASD Move · Mouse Look · Space Jump/Double Jump · Shift Sprint · Ctrl Slide · E Interact · Esc Pause
              </div>
              {hud.prompt && <div className="px-4 py-2 rounded-xl bg-black/50 border border-cyan/40 text-cyan-100 text-sm">{hud.prompt}</div>}
            </div>
          </div>

          {/* Mobile controls */}
          <div className="absolute bottom-3 inset-x-3 flex justify-between items-end pointer-events-none md:hidden">
            <div className="pointer-events-auto grid grid-cols-3 gap-2">
              <div /><button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.y=1} onTouchEnd={()=>mobileInput.current.y=0}>▲</button><div />
              <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.x=-1} onTouchEnd={()=>mobileInput.current.x=0}>◀</button>
              <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.y=-1} onTouchEnd={()=>mobileInput.current.y=0}>▼</button>
              <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20" onTouchStart={()=>mobileInput.current.x=1} onTouchEnd={()=>mobileInput.current.x=0}>▶</button>
            </div>
            <div className="pointer-events-auto flex flex-col gap-2">
              <button className="px-4 h-11 rounded-xl bg-accent/70 border border-accent/40" onTouchStart={()=>mobileInput.current.jump=true} onTouchEnd={()=>mobileInput.current.jump=false}>Jump</button>
              <button className="px-4 h-11 rounded-xl bg-violet/50 border border-violet/40" onTouchStart={()=>mobileInput.current.sprint=true} onTouchEnd={()=>mobileInput.current.sprint=false}>Sprint</button>
              <button className="px-4 h-10 rounded-xl bg-amber-500/40 border border-amber-300/40" onTouchStart={()=>mobileInput.current.slide=true} onTouchEnd={()=>mobileInput.current.slide=false}>Slide</button>
              <button className="px-4 h-10 rounded-xl bg-cyan/30 border border-cyan/40" onTouchStart={()=>mobileInput.current.interact=true} onTouchEnd={()=>mobileInput.current.interact=false}>Interact</button>
            </div>
          </div>

          {/* Pause */}
          <AnimatePresence>
            {paused && phase==='playing' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="glass-strong rounded-2xl border border-white/15 p-6 w-full max-w-md text-center">
                  <h2 className="text-2xl font-bold mb-2">Pause Menu</h2>
                  <p className="text-slate-300 mb-5">PROJECT X: THE FINAL RUN</p>
                  <div className="grid gap-2">
                    <button onClick={()=>setPaused(false)} className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-cyan font-medium">Resume</button>
                    <button onClick={()=>{setPaused(false); window.location.reload();}} className="px-4 py-3 rounded-xl border border-white/20 bg-white/5">Restart Run</button>
                    <button onClick={reveal} className="px-4 py-3 rounded-xl border border-amber-300/30 text-amber-200">Skip to Login</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Victory */}
          <AnimatePresence>
            {phase==='victory' && result && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-black/55 flex items-center justify-center p-6">
                <motion.div initial={{scale:0.94,y:18}} animate={{scale:1,y:0}} className="glass-strong rounded-3xl border border-cyan/30 p-8 w-full max-w-xl text-center shadow-[0_0_70px_rgba(34,211,238,0.2)]">
                  <div className="text-xs tracking-[0.35em] text-cyan/80 mb-2">PROJECT X COMPLETED</div>
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-1">MISSION COMPLETED</h1>
                  <div className="text-violet-200 tracking-widest mb-6">TEAM ALGEBRA HQ REACHED</div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs text-slate-400">Score</div><div className="text-xl font-bold">{result.score}</div></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs text-slate-400">Time</div><div className="text-xl font-bold">{fmt(result.time)}</div></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs text-slate-400">Progress</div><div className="text-xl font-bold">100%</div></div>
                  </div>
                  <div className="mb-6 text-slate-300">Welcome to <span className="text-cyan font-semibold">TEAM ALGEBRA</span></div>
                  <button onClick={reveal} className="w-full px-5 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-accent via-violet to-cyan text-white shadow-neon">ENTER TEAM ALGEBRA</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>{phase==='exiting' && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-[#050814]" />}</AnimatePresence>
    </div>
  );
}

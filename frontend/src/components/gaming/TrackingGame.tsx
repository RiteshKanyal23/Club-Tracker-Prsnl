import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX, Target, Timer, Zap, Trophy } from "lucide-react";
import type { GameResult } from "./GamingExperienceGate";

const PreloaderScene = lazy(() => import("../preloader/PreloaderScene"));

type Difficulty = "EASY" | "NORMAL" | "ADVANCED";
type Checkpoint = { id: string; label: string; order: number; x: number; y: number };

const STEPS = ["PROJECT START", "TASK ASSIGNED", "IN PROGRESS", "REVIEW", "COMPLETED"];
const DIFF: Record<Difficulty, { time: number; xpMult: number; scatter: number }> = {
  EASY: { time: 90, xpMult: 1, scatter: 0 },
  NORMAL: { time: 70, xpMult: 1.2, scatter: 1 },
  ADVANCED: { time: 55, xpMult: 1.5, scatter: 2 },
};

function beep(enabled: boolean, freq = 660, duration = 0.08, type: OscillatorType = "sine") {
  if (!enabled) return;
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.03;
    o.start();
    o.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close().catch(() => {}), duration * 1000 + 50);
  } catch {}
}

function generateNodes(difficulty: Difficulty): Checkpoint[] {
  // randomized but spaced positions in percentages within center play area
  const base = [
    { x: 18, y: 70 }, { x: 35, y: 35 }, { x: 55, y: 60 }, { x: 72, y: 30 }, { x: 82, y: 68 },
  ];
  const jitter = difficulty === "EASY" ? 6 : difficulty === "NORMAL" ? 12 : 18;
  const pts = base.map((p, i) => ({
    id: `n${i}`,
    label: STEPS[i],
    order: i,
    x: Math.min(90, Math.max(10, p.x + (Math.random() * 2 - 1) * jitter)),
    y: Math.min(85, Math.max(15, p.y + (Math.random() * 2 - 1) * jitter)),
  }));
  // shuffle positions among nodes for randomized layout while keeping labels/order mapping
  const positions = pts.map((p) => ({ x: p.x, y: p.y })).sort(() => Math.random() - 0.5);
  return pts.map((p, i) => ({ ...p, x: positions[i].x, y: positions[i].y }));
}

export function TrackingGame({ onComplete }: { onComplete: (result: GameResult) => void }) {
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [nodes, setNodes] = useState<Checkpoint[]>(() => generateNodes("NORMAL"));
  const [nextIndex, setNextIndex] = useState(0);
  const [connected, setConnected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DIFF.NORMAL.time);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [completed, setCompleted] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const reset = useCallback((d: Difficulty = difficulty) => {
    setNodes(generateNodes(d));
    setNextIndex(0);
    setConnected([]);
    setScore(0);
    setXp(0);
    setTimeLeft(DIFF[d].time);
    setPaused(false);
    setWarning(null);
    setStartedAt(Date.now());
    setCompleted(false);
  }, [difficulty]);

  useEffect(() => { reset(difficulty); }, [difficulty]); // eslint-disable-line

  useEffect(() => {
    if (paused || completed) return;
    if (timeLeft <= 0) { setPaused(true); setWarning("Time up! You can restart the mission."); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [paused, completed, timeLeft]);

  const progressPct = Math.round((connected.length / STEPS.length) * 100);

  const finish = useCallback((finalScore: number, finalXp: number) => {
    if (completed) return;
    setCompleted(true);
    beep(soundOn, 880, 0.12, "triangle");
    setTimeout(() => beep(soundOn, 1100, 0.14, "triangle"), 120);
    const timeTakenMs = Math.max(0, Date.now() - startedAt);
    setTimeout(() => onComplete({ score: finalScore, xp: finalXp, progress: 100, timeTakenMs, difficulty }), 350);
  }, [completed, difficulty, onComplete, soundOn, startedAt]);

  const onNodeClick = (node: Checkpoint) => {
    if (paused || completed) return;
    if (node.order === nextIndex) {
      const newConnected = [...connected, node.order];
      const gained = 100;
      const newScore = score + gained + (newConnected.length === STEPS.length ? 250 : 0);
      const newXp = xp + Math.round(20 * DIFF[difficulty].xpMult) + (newConnected.length === STEPS.length ? Math.round(50 * DIFF[difficulty].xpMult) : 0);
      setConnected(newConnected);
      setNextIndex((n) => n + 1);
      setScore(newScore);
      setXp(newXp);
      setWarning(null);
      beep(soundOn, 740 + node.order * 60, 0.07, "sine");
      if (newConnected.length === STEPS.length) {
        finish(newScore, newXp);
      }
    } else if (!connected.includes(node.order)) {
      setWarning("Incorrect checkpoint. Follow the mission sequence.");
      beep(soundOn, 220, 0.09, "square");
      setTimeout(() => setWarning((w) => (w === "Incorrect checkpoint. Follow the mission sequence." ? null : w)), 1200);
    }
  };

  const connections = useMemo(() => {
    const pts = connected.map((idx) => nodes.find((n) => n.order === idx)).filter(Boolean) as Checkpoint[];
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 1; i < pts.length; i++) lines.push({ x1: pts[i - 1].x, y1: pts[i - 1].y, x2: pts[i].x, y2: pts[i].y });
    return lines;
  }, [connected, nodes]);

  const activeLabel = STEPS[nextIndex] || "COMPLETE";

  return (
    <div className="fixed inset-0 z-[9998] bg-[#050814] text-white overflow-hidden">
      <div className="absolute inset-0">
        {!reducedMotion ? (
          <Suspense fallback={<div className="w-full h-full bg-[#050814]" />}>
            <PreloaderScene progress={30 + progressPct * 0.7} />
          </Suspense>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 via-violet/10 to-cyan/20" />
        )}
      </div>
      <div className="absolute inset-0 bg-[#050814]/55" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col p-3 md:p-5 gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-cyan/80 uppercase">Tracker Mission</div>
            <div className="text-lg md:text-2xl font-bold">CONNECT THE PROGRESS</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="EASY">EASY</option>
              <option value="NORMAL">NORMAL</option>
              <option value="ADVANCED">ADVANCED</option>
            </select>
            <button onClick={() => setPaused((p) => !p)} className="glass border border-white/15 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">{paused ? <Play size={16}/> : <Pause size={16}/>} {paused ? "Resume" : "Pause"}</button>
            <button onClick={() => reset(difficulty)} className="glass border border-white/15 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2"><RotateCcw size={16}/> Restart</button>
            <button onClick={() => setSoundOn((s) => !s)} className="glass border border-white/15 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">{soundOn ? <Volume2 size={16}/> : <VolumeX size={16}/>} Sound</button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-3 min-h-0">
          <div className="glass-strong rounded-2xl border border-white/10 p-4 space-y-4 overflow-auto">
            <div className="text-xs tracking-[0.2em] text-cyan/80 uppercase">Mission Info</div>
            <p className="text-sm text-slate-300">Connect the 5 project checkpoints in the correct order to complete the mission.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-400 inline-flex items-center gap-2"><Trophy size={14}/>Score</span><span className="font-semibold text-white">{score}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400 inline-flex items-center gap-2"><Zap size={14}/>XP</span><span className="font-semibold text-cyan">{xp}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400 inline-flex items-center gap-2"><Timer size={14}/>Timer</span><span className={`font-semibold ${timeLeft <= 10 ? "text-rose-300" : "text-white"}`}>{timeLeft}s</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400 inline-flex items-center gap-2"><Target size={14}/>Progress</span><span className="font-semibold text-white">{progressPct}%</span></div>
            </div>
            <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-3 text-xs text-slate-300">
              <div className="text-cyan/80 mb-1">Current Objective</div>
              Select: <span className="text-white font-medium">{activeLabel}</span>
            </div>
            {warning && <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">{warning}</div>}
            {paused && timeLeft > 0 && !completed && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">Mission paused.</div>}
          </div>

          <div ref={areaRef} className="relative glass-strong rounded-2xl border border-cyan/20 overflow-hidden min-h-[360px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_55%)]" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((l, i) => (
                <line key={i} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`} stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.9))" }} />
              ))}
            </svg>
            {nodes.map((node) => {
              const isDone = connected.includes(node.order);
              const isActive = node.order === nextIndex && !completed;
              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onClick={() => onNodeClick(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 md:px-4 md:py-3 rounded-2xl border text-[10px] md:text-xs font-semibold tracking-wide shadow-lg backdrop-blur-md transition select-none ${isDone ? "bg-cyan/20 border-cyan/60 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.35)]" : isActive ? "bg-accent/20 border-accent/70 text-white shadow-[0_0_24px_rgba(59,130,246,0.4)]" : "bg-white/5 border-white/20 text-slate-200 hover:border-violet/50"}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  animate={isActive && !reducedMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={{ duration: 1.2, repeat: isActive && !reducedMotion ? Infinity : 0 }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${isDone ? "bg-cyan/40" : isActive ? "bg-accent/50" : "bg-white/10"}`}>{node.order + 1}</span>
                    <span>{node.label}</span>
                  </div>
                </motion.button>
              );
            })}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-slate-300/80 bg-black/20 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur">Tap/click checkpoints in sequence: 1 → 5</div>
          </div>

          <div className="glass-strong rounded-2xl border border-white/10 p-4 space-y-4 overflow-auto">
            <div className="text-xs tracking-[0.2em] text-violet-300 uppercase">Mission Progress</div>
            <div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/10"><div className="h-full bg-gradient-to-r from-accent via-violet to-cyan" style={{ width: `${progressPct}%` }} /></div>
              <div className="mt-2 text-sm text-slate-300">{progressPct}% complete</div>
            </div>
            <div className="space-y-2">
              {STEPS.map((s, i) => {
                const done = connected.includes(i);
                const active = i === nextIndex && !completed;
                return (
                  <div key={s} className={`rounded-xl border px-3 py-2 text-xs flex items-center justify-between ${done ? "border-cyan/40 bg-cyan/10 text-cyan-100" : active ? "border-accent/40 bg-accent/10 text-white" : "border-white/10 bg-white/5 text-slate-400"}`}>
                    <span>{i + 1}. {s}</span>
                    <span>{done ? "DONE" : active ? "ACTIVE" : "PENDING"}</span>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 space-y-1">
              <div className="text-slate-200 font-medium">XP Earned</div>
              <div className="text-cyan font-semibold text-lg">{xp}</div>
              <div>Status: {completed ? "MISSION COMPLETED" : timeLeft <= 0 ? "TIMEOUT" : paused ? "PAUSED" : "IN PROGRESS"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

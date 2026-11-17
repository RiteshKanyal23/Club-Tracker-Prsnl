import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PreloaderScene = lazy(() => import("../preloader/PreloaderScene"));

export function GameIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (reducedMotion) {
      const id = setTimeout(onComplete, 900);
      return () => clearTimeout(id);
    }
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2600),
      setTimeout(() => setPhase(3), 4200),
      setTimeout(() => setPhase(4), 6000),
      setTimeout(onComplete, 6800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete, reducedMotion]);

  const progress = reducedMotion ? 100 : phase === 0 ? 20 : phase === 1 ? 45 : phase === 2 ? 70 : 100;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9999] overflow-hidden bg-[#050814] text-white" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_80%_25%,rgba(139,92,246,0.25),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,#050814_0%,#080D1B_60%,#050814_100%)]" />
        <div className="absolute inset-0 bg-grid opacity-25" />
        <div className="absolute inset-0">
          {!reducedMotion ? (
            <Suspense fallback={<div className="w-full h-full bg-[#050814]" />}>
              <PreloaderScene progress={progress} />
            </Suspense>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 via-violet/10 to-cyan/20" />
          )}
        </div>

        {/* HUD overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 right-8 flex justify-between text-[10px] tracking-[0.25em] text-cyan/70 uppercase">
            <span>Futuristic Tracking Command Center</span>
            <span>System Online</span>
          </div>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <motion.div className="w-[60vmin] h-[60vmin] rounded-full border border-cyan/20" animate={reducedMotion ? {} : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute w-[42vmin] h-[42vmin] rounded-full border border-violet/20" animate={reducedMotion ? {} : { rotate: -360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute w-[75vmin] h-[75vmin] rounded-full border border-accent/10" animate={reducedMotion ? {} : { scale: [1, 1.03, 1] }} transition={{ duration: 4, repeat: Infinity }} />
          </div>
          <div className="absolute bottom-10 left-10 w-40 h-24 border border-cyan/20 rounded-xl bg-white/5 backdrop-blur-sm p-3 text-[10px] text-slate-300/80 space-y-1">
            <div className="text-cyan/80 tracking-widest">HUD // TRACKING</div>
            <div>Grid: ACTIVE</div><div>Nodes: SYNCED</div><div>Radar: SCANNING</div>
          </div>
          <div className="absolute bottom-10 right-10 w-44 h-24 border border-violet/20 rounded-xl bg-white/5 backdrop-blur-sm p-3 text-[10px] text-slate-300/80 space-y-1 text-right">
            <div className="text-violet-300/80 tracking-widest">MISSION LINK</div>
            <div>Particles: FLOWING</div><div>Hologrid: STABLE</div><div>Signal: 100%</div>
          </div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 12 }} transition={{ duration: 0.7 }} className="mb-4">
            <div className="text-5xl sm:text-7xl font-extrabold tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-cyan via-accent to-violet drop-shadow-[0_0_40px_rgba(59,130,246,0.35)]">TEAM ALGEBRA</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0 }} transition={{ duration: 0.7 }} className="space-y-2">
            <div className="text-lg sm:text-2xl tracking-[0.35em] text-slate-200/90">TRACK. MANAGE. ACHIEVE.</div>
            <div className="text-sm sm:text-base text-cyan/90 italic">"Your Mission. Your Progress. Your Success."</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 4 ? 1 : 0.85 }} className="mt-10 w-[min(460px,85vw)]">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden border border-white/10">
              <motion.div className="h-full bg-gradient-to-r from-accent via-violet to-cyan" initial={{ width: "0%" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="mt-3 text-xs tracking-[0.2em] text-slate-400 uppercase">Initializing mission environment...</div>
          </motion.div>
        </div>

        {/* scanning line */}
        {!reducedMotion && <motion.div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" animate={{ top: ["10%", "90%", "10%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />}
      </motion.div>
    </AnimatePresence>
  );
}

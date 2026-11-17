import { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PreloaderScene = lazy(() => import("./PreloaderScene"));

export function Preloader({ onFinish }: { onFinish?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    let current = 0;
    let raf = 0;
    const start = performance.now();
    const duration = reducedMotion ? 400 : 2600;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out progression with small holds
      const eased = 1 - Math.pow(1 - t, 3);
      current = Math.min(100, Math.round(eased * 100));
      setProgress(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setDone(true), reducedMotion ? 50 : 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  useEffect(() => {
    if (done) {
      const id = setTimeout(() => onFinish?.(), reducedMotion ? 50 : 500);
      return () => clearTimeout(id);
    }
  }, [done, onFinish]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-midnight"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
          transition={{ duration: reducedMotion ? 0.2 : 0.6, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-premium-gradient" />
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0">
            {!reducedMotion ? (
              <Suspense fallback={<div className="w-full h-full bg-midnight" />}> 
                <PreloaderScene progress={progress} />
              </Suspense>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 via-violet/10 to-cyan/20" />
            )}
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: progress > 35 ? 1 : 0, y: progress > 35 ? 0 : 20 }}
              transition={{ duration: 0.6 }}
              className="mb-3"
            >
              <div className="text-4xl sm:text-6xl font-extrabold tracking-[0.25em] text-gradient drop-shadow-[0_0_30px_rgba(59,130,246,0.35)]">
                TEAM ALGEBRA
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: progress > 50 ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-sm sm:text-lg text-slate-300/90 mb-8 max-w-xl"
            >
              Empowering Teams. Tracking Progress. Building Excellence.
            </motion.p>

            <div className="w-[min(420px,80vw)]">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/10 backdrop-blur">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-violet to-cyan shadow-neon"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Initializing workspace</span>
                <span className="font-mono text-cyan">{progress}%</span>
              </div>
            </div>
          </div>

          {/* soft particles fallback overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute top-[10%] left-[15%] w-2 h-2 rounded-full bg-cyan blur-[2px] animate-pulse-slow" />
            <div className="absolute top-[30%] right-[20%] w-1.5 h-1.5 rounded-full bg-accent blur-[1px] animate-pulse-slow" />
            <div className="absolute bottom-[25%] left-[25%] w-1.5 h-1.5 rounded-full bg-violet blur-[1px] animate-pulse-slow" />
            <div className="absolute bottom-[15%] right-[30%] w-2 h-2 rounded-full bg-cyan blur-[2px] animate-pulse-slow" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

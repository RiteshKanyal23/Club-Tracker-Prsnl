import { motion } from "framer-motion";
import { Trophy, RotateCcw, ArrowRight, Star } from "lucide-react";
import type { GameResult } from "./GamingExperienceGate";

export function GameVictory({ result, onPlayAgain, onContinue }: { result: GameResult; onPlayAgain: () => void; onContinue: () => void }) {
  const seconds = Math.max(1, Math.round(result.timeTakenMs / 1000));
  return (
    <div className="fixed inset-0 z-[9998] overflow-y-auto bg-[#050814] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.2),transparent_35%),linear-gradient(180deg,#050814,#0b1024)]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, background: i % 3 === 0 ? "#22D3EE" : i % 3 === 1 ? "#3B82F6" : "#8B5CF6", boxShadow: "0 0 12px currentColor" }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }} transition={{ duration: 2 + (i % 5) * 0.4, repeat: Infinity, delay: (i % 7) * 0.2 }} />
        ))}
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative z-10 w-full max-w-2xl glass-strong rounded-3xl border border-cyan/30 p-8 md:p-10 text-center shadow-[0_0_60px_rgba(34,211,238,0.15)]">
        <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-cyan via-accent to-violet flex items-center justify-center shadow-neon">
          <Trophy className="text-white" size={42} />
        </motion.div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs tracking-widest mb-4">ACHIEVEMENT UNLOCKED</div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">MISSION COMPLETED!</h1>
        <p className="text-cyan/90 tracking-[0.2em] text-sm md:text-base mb-8">TEAM ALGEBRA TRACKING SYSTEM ACTIVATED.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Final Score", value: result.score },
            { label: "Total XP", value: result.xp },
            { label: "Completion", value: `${result.progress}%` },
            { label: "Mission Time", value: `${seconds}s` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-400 mb-1">{s.label}</div>
              <div className="text-xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-8 flex items-center justify-center gap-2 text-amber-300">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill="currentColor" className={i < 4 ? "opacity-100" : "opacity-50"} />)}
          <span className="ml-2 text-sm text-slate-300">Mission Badge: Progress Connector</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={onPlayAgain} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium glass border border-white/15 text-white hover:bg-white/10 transition"><RotateCcw size={16} /> PLAY AGAIN</button>
          <button onClick={onContinue} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium bg-gradient-to-r from-accent via-violet to-cyan text-white shadow-neon hover:opacity-95 transition">CONTINUE TO PORTAL <ArrowRight size={16} /></button>
        </div>
      </motion.div>
    </div>
  );
}

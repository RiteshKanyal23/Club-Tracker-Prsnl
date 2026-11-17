import { motion } from "framer-motion";
import { Shield, UserCircle2, ArrowRight, Sparkles } from "lucide-react";

export function PortalSelection({ onProceed }: { onProceed: (path: string) => void }) {
  return (
    <main className="fixed inset-0 z-[9998] overflow-y-auto bg-midnight flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(139,92,246,0.28),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(135deg,#050814_0%,#111B35_100%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative z-10 w-full max-w-6xl py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-cyan/30 text-xs text-cyan mb-4"><Sparkles size={14} /> Mission Control Access</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-wide">WELCOME TO TEAM ALGEBRA</h1>
          <p className="text-slate-300/90 max-w-2xl mx-auto text-lg">SELECT YOUR ACCESS PORTAL</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="group glass-strong rounded-3xl border border-accent/40 p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-accent/25 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-violet to-cyan flex items-center justify-center shadow-neon">
                  <Shield className="text-white" size={30} />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-cyan border border-accent/30">Blue Glow Clearance</span>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-midnight-200/80 to-midnight-300/40 border border-accent/30 p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-accent/40 flex items-center justify-center relative shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                    <Shield size={34} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">ADMIN ACCESS</div>
                    <div className="text-slate-400 text-sm">Futuristic administrator console</div>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">ADMIN PORTAL</h2>
              <p className="text-slate-300 mb-6">Command-level access for system operations, tracking oversight, and management controls.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onProceed("/admin/login")} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent via-violet to-cyan text-white rounded-xl px-4 py-3 font-medium shadow-neon hover:opacity-95 transition">Admin Login <ArrowRight size={16} /></button>
                <button onClick={() => onProceed("/admin/signup")} className="inline-flex items-center justify-center gap-2 glass border border-accent/40 text-white rounded-xl px-4 py-3 font-medium hover:bg-white/10 transition">Admin Signup</button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="group glass-strong rounded-3xl border border-violet/40 p-6 md:p-8 shadow-[0_0_40px_rgba(139,92,246,0.18)] relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-violet/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon">
                  <UserCircle2 className="text-white" size={30} />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet/15 text-violet-200 border border-violet/30">Purple Glow Clearance</span>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#1a1140]/70 to-midnight-300/40 border border-violet/30 p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-violet/40 flex items-center justify-center relative shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                    <UserCircle2 size={34} className="text-violet-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">MEMBER ACCESS</div>
                    <div className="text-slate-400 text-sm">Futuristic team-member interface</div>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">MEMBER PORTAL</h2>
              <p className="text-slate-300 mb-6">Member access for missions, tasks, attendance, collaboration, and progress tracking.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onProceed("/member/login")} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-3 font-medium shadow-neon hover:opacity-95 transition">Member Login <ArrowRight size={16} /></button>
                <button onClick={() => onProceed("/member/signup")} className="inline-flex items-center justify-center gap-2 glass border border-violet/40 text-white rounded-xl px-4 py-3 font-medium hover:bg-white/10 transition">Member Signup</button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

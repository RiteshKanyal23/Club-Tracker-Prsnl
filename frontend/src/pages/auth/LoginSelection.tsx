import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, UserCircle2, ArrowRight, Sparkles } from "lucide-react";

export function LoginSelection() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-midnight flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(139,92,246,0.22),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(135deg,#080D1B_0%,#111B35_100%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative z-10 w-full max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-cyan mb-4"><Sparkles size={14} /> Team Algebra Club Tracker</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Choose Your Portal</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Select the appropriate secure access portal. Admin and member experiences are separate and role-verified.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="group glass-strong rounded-3xl border border-accent/20 p-6 md:p-8 shadow-glass relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-violet to-cyan flex items-center justify-center shadow-neon">
                  <Shield className="text-white" size={30} />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-cyan border border-accent/30">Administrator</span>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-midnight-200/80 to-midnight-300/40 border border-white/10 p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                    <div className="absolute inset-2 rounded-xl border border-accent/30" />
                    <Shield size={34} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">ADMIN ACCESS</div>
                    <div className="text-slate-400 text-sm">Administrator illustration & controls</div>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">ADMIN PORTAL</h2>
              <p className="text-slate-300 mb-6">Secure enterprise access for administrators to manage teams, projects, attendance, approvals, analytics, and system operations.</p>
              <ul className="text-sm text-slate-400 space-y-2 mb-7">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan" />Role-verified administrative login</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan" />Full management & audit capabilities</li>
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/login" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent via-violet to-cyan text-white rounded-xl px-4 py-3 font-medium shadow-neon hover:opacity-95 transition">Admin Login <ArrowRight size={16} /></Link>
                <Link to="/admin/signup" className="inline-flex items-center justify-center gap-2 glass border border-white/15 text-white rounded-xl px-4 py-3 font-medium hover:bg-white/10 transition">Admin Signup</Link>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="group glass-strong rounded-3xl border border-violet/20 p-6 md:p-8 shadow-glass relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-violet/25 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-violet/10 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon">
                  <UserCircle2 className="text-white" size={30} />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet/15 text-violet-200 border border-violet/30">Team Member</span>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#1a1140]/70 to-midnight-300/40 border border-white/10 p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                    <div className="absolute inset-2 rounded-full border border-violet/30" />
                    <UserCircle2 size={34} className="text-violet-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">MEMBER ACCESS</div>
                    <div className="text-slate-400 text-sm">Member illustration & workspace</div>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">MEMBER PORTAL</h2>
              <p className="text-slate-300 mb-6">A modern, welcoming portal for members to view tasks, attendance, meetings, documents, announcements, and collaboration tools.</p>
              <ul className="text-sm text-slate-400 space-y-2 mb-7">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-300" />Role-verified member login</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-300" />Personal dashboard & permitted features</li>
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/member/login" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-3 font-medium shadow-neon hover:opacity-95 transition">Member Login <ArrowRight size={16} /></Link>
                <Link to="/member/signup" className="inline-flex items-center justify-center gap-2 glass border border-white/15 text-white rounded-xl px-4 py-3 font-medium hover:bg-white/10 transition">Member Signup</Link>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-8 text-sm text-slate-400"><Link to="/" className="text-cyan hover:underline">Back to home</Link></div>
      </div>
    </main>
  );
}

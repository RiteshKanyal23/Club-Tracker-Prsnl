import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BarChart3, Users, Shield } from "lucide-react";
import { APP_NAME } from "../../constants";

export function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-midnight text-white flex flex-col items-center justify-center p-6 md:p-10">
      <div className="absolute inset-0 bg-premium-gradient" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-32 -left-20 w-96 h-96 bg-accent/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-violet/20 rounded-full blur-3xl" />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-cyan mb-6">
          <Sparkles size={16} /> Premium 3D Workspace
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
          <span className="text-gradient">{APP_NAME}</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="max-w-2xl mx-auto text-slate-300 text-lg mb-10">
          A unified platform for managing projects, teams, tasks, attendance, meetings, documents, and analytics—crafted with a futuristic, enterprise-grade experience.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="flex flex-wrap justify-center gap-4 mb-14">
          <Link to="/login" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet px-6 py-3 font-medium text-white shadow-neon hover:opacity-95 transition">
            Login to Workspace <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="grid sm:grid-cols-3 gap-4 text-left">
          {[{icon: BarChart3, title:"Real-time Insights", desc:"Analytics, progress tracking, and activity trends."},{icon: Users, title:"Team Collaboration", desc:"Projects, chat, meetings, and shared knowledge."},{icon: Shield, title:"Secure & Role-based", desc:"Authentication, RBAC, and audit-ready workflows."}].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass rounded-2xl p-5 border border-white/10 hover:border-accent/30 hover:shadow-neon transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-violet/30 flex items-center justify-center text-cyan mb-3"><Icon size={18} /></div>
                <div className="font-semibold text-white mb-1">{f.title}</div>
                <div className="text-sm text-slate-400">{f.desc}</div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}

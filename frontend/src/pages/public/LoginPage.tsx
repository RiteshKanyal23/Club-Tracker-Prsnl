import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { apiRequest } from "../../services/apiClient";
import { useAuthStore } from "../../store/auth.store";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      const user = res.data?.user ?? null;
      setUser(user);
      setInitialized(true);
      const role = user?.role;
      const path = role === "ADMIN" ? "/admin" : role === "COORDINATOR" ? "/coordinator" : role === "PROJECT_MANAGER" ? "/project-manager" : role === "TEAM_LEADER" ? "/team-leader" : "/member";
      navigate(path);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-midnight flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-premium-gradient" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-32 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-violet/20 rounded-full blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-cyan mb-3"><Sparkles size={14} /> Team Algebra Workspace</div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-1">Sign in to continue to your dashboard</p>
        </div>
        <form onSubmit={onSubmit} className="glass-strong rounded-2xl p-6 md:p-8 border border-white/10 shadow-glass space-y-4">
          {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Password</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <button className="w-full bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-2.5 font-medium shadow-neon hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60" type="submit" disabled={loading}>
            <LogIn size={16} /> {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="text-center mt-4 text-sm text-slate-400"><Link to="/" className="text-cyan hover:underline">Back to home</Link></div>
      </motion.div>
    </main>
  );
}

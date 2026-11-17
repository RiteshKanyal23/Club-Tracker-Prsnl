import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, Shield, Sparkles } from "lucide-react";
import { apiRequest } from "../../services/apiClient";
import { useAuthStore } from "../../store/auth.store";

export function CeoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
      if (user?.role !== "CEO") {
        setError("CEO credentials are required for this portal.");
        return;
      }
      setUser(user);
      setInitialized(true);
      navigate("/ceo");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-midnight flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.28),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.2),transparent_35%),linear-gradient(135deg,#080D1B_0%,#111B35_100%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div className="relative z-10 w-full max-w-md">
        <form onSubmit={onSubmit} className="glass-strong rounded-2xl p-8 border border-white/10 shadow-glass space-y-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent via-violet to-cyan flex items-center justify-center shadow-neon"><Shield className="text-white" size={22} /></div>
            <span className="text-xs rounded-full border border-violet/30 bg-violet/15 px-2.5 py-1 text-violet-200">Executive Access</span>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs tracking-[0.2em] text-cyan/80"><Sparkles size={13} /> TEAM ALGEBRA</div>
            <h1 className="mt-1 text-2xl font-bold text-white">CEO PORTAL</h1>
            <p className="text-sm text-slate-400">Organization-wide visibility and attendance oversight.</p>
          </div>
          {error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Mail size={16} className="text-slate-400" />
              <input className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-500" type="email" placeholder="CEO email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Lock size={16} className="text-slate-400" />
              <input className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-500" type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShow((v) => !v)} className="text-slate-400 hover:text-white" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button className="w-full rounded-xl bg-gradient-to-r from-accent via-violet to-cyan px-4 py-2.5 font-medium text-white shadow-neon hover:opacity-95 disabled:opacity-60" type="submit" disabled={loading}>
            {loading ? "Authenticating..." : "Secure CEO Login"}
          </button>
          <div className="text-center text-sm text-slate-400"><Link to="/login" className="text-cyan hover:underline">All portals</Link></div>
        </form>
      </motion.div>
    </main>
  );
}

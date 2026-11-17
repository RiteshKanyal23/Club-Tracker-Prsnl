import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { apiRequest } from "../../services/apiClient";
import { useAuthStore } from "../../store/auth.store";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
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
      const res = await apiRequest<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password, portal: "admin" }) });
      const user = res.data?.user ?? null;
      setUser(user);
      setInitialized(true);
      if (user?.role !== "ADMIN") {
        setError("Admin credentials are required for this portal.");
        return;
      }
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-midnight flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(139,92,246,0.25),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(135deg,#080D1B_0%,#111B35_100%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div className="absolute top-20 left-[10%] w-40 h-40 border border-accent/30 rounded-3xl" animate={{ rotate: 360, y: [0, -20, 0] }} transition={{ rotate: { duration: 18, repeat: Infinity, ease: "linear" }, y: { duration: 6, repeat: Infinity } }} style={{ boxShadow: "0 0 40px rgba(59,130,246,0.2)" }} />
      <motion.div className="absolute bottom-24 right-[12%] w-28 h-28 border border-violet/40 rounded-full" animate={{ scale: [1, 1.15, 1], y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity }} />
      <motion.div className="absolute top-1/3 right-[20%] w-20 h-20 bg-cyan/10 backdrop-blur border border-cyan/30 rotate-45" animate={{ rotate: [45, 225, 45], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 12, repeat: Infinity }} />
      <div className="pointer-events-none absolute inset-0">{Array.from({ length: 18 }).map((_, i) => <span key={i} className="absolute w-1 h-1 bg-cyan/60 rounded-full animate-pulse-slow" style={{ top: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%` }} />)}</div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-cyan mb-4"><Sparkles size={14} /> Enterprise Access Control</div>
          <h1 className="text-4xl font-bold text-white mb-3">ADMIN PORTAL</h1>
          <p className="text-slate-300 text-lg mb-8">Secure administrative access for Team Algebra Club Tracker.</p>
          <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-slate-200"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center"><Shield size={18} /></div><div><div className="font-medium">Secure access indicator</div><div className="text-sm text-slate-400">Encrypted session & role-verified backend authentication</div></div></div>
            <div className="flex items-center gap-3 text-slate-200"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center"><Lock size={18} /></div><div><div className="font-medium">Administrative controls</div><div className="text-sm text-slate-400">Access restricted to authorized administrator accounts</div></div></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-auto">
          <form onSubmit={onSubmit} className="glass-strong rounded-2xl p-7 md:p-8 border border-white/10 shadow-glass space-y-4 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent via-violet to-cyan flex items-center justify-center shadow-neon"><Shield size={20} className="text-white" /></div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Secure Access</span>
              </div>
              <div className="text-xs tracking-[0.2em] text-cyan/80 mb-1">TEAM ALGEBRA</div>
              <h2 className="text-2xl font-bold text-white">ADMIN PORTAL</h2>
              <p className="text-slate-400 mb-4">Welcome Back, Administrator</p>
            </div>
            {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Admin email</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40">
                <Mail size={16} className="text-slate-400" />
                <input className="bg-transparent outline-none text-slate-200 placeholder:text-slate-500 w-full" placeholder="Admin email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Password</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40">
                <Lock size={16} className="text-slate-400" />
                <input className="bg-transparent outline-none text-slate-200 placeholder:text-slate-500 w-full" placeholder="Password" type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" onClick={()=>setShow(s=>!s)} className="text-slate-400 hover:text-white" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" className="accent-cyan" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
              <Link to="/admin/forgot-password" className="text-cyan hover:underline">Forgot password</Link>
            </div>
            <button className="w-full bg-gradient-to-r from-accent via-violet to-cyan text-white rounded-xl px-4 py-2.5 font-medium shadow-neon hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Shield size={16} />} {loading ? "Authenticating..." : "Secure Admin Login"}
            </button>
            <div className="text-sm text-slate-400 text-center">Need an admin account? <Link to="/admin/signup" className="text-cyan hover:underline">Admin Signup</Link> · <Link to="/admin/verify-email" className="text-cyan hover:underline">Verify email</Link></div>
            <div className="text-xs text-slate-500 text-center">Admin-only access. Credentials and role verified by backend.</div>
          </form>
          <div className="text-center mt-4 text-sm text-slate-400 flex items-center justify-center gap-3"><Link to="/login" className="text-cyan hover:underline">All portals</Link><span>·</span><Link to="/member/login" className="hover:text-white">Member Portal</Link></div>
        </motion.div>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle2, Eye, EyeOff, Lock, Mail, HeartHandshake } from "lucide-react";
import { apiRequest } from "../../services/apiClient";
import { useAuthStore } from "../../store/auth.store";

export function MemberLogin() {
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
      const res = await apiRequest<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password, portal: "member" }) });
      const user = res.data?.user ?? null;
      setUser(user);
      setInitialized(true);
      if (user?.role !== "MEMBER") {
        setError("Member credentials are required for this portal.");
        return;
      }
      navigate("/member");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0b1024] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(168,85,247,0.35),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.2),transparent_35%),linear-gradient(160deg,#0b1024_0%,#1a1140_50%,#0b1024_100%)]" />
      <motion.div className="absolute top-16 right-[15%] w-44 h-44 rounded-[2rem] bg-gradient-to-br from-accent/20 to-violet/20 backdrop-blur border border-white/10" animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-20 left-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-cyan/20 to-accent/20 border border-white/10" animate={{ y: [0, 14, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity }} />
      <motion.div className="absolute top-1/2 left-[8%] w-20 h-20 rounded-2xl bg-white/5 border border-white/10" animate={{ rotate: [0, 20, 0], y: [0, -10, 0] }} transition={{ duration: 9, repeat: Infinity }} />
      <div className="pointer-events-none absolute inset-0 opacity-40">{Array.from({ length: 14 }).map((_, i) => <span key={i} className="absolute rounded-full bg-white/30 blur-[1px]" style={{ width: 4 + (i%3)*2, height: 4 + (i%3)*2, top: `${(i * 41) % 100}%`, left: `${(i * 29) % 100}%` }} />)}</div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:flex flex-col items-start">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass rounded-3xl p-8 border border-white/10 w-full max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon mb-4"><HeartHandshake className="text-white" size={28} /></div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome, Team Member!</h2>
            <p className="text-slate-300">Access your tasks, attendance, meetings, and collaboration tools in one beautiful workspace.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200">Track progress</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200">View attendance</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200">Stay connected</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200">Grow together</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-auto">
          <form onSubmit={onSubmit} className="glass-strong rounded-3xl p-7 md:p-8 border border-white/10 shadow-glass space-y-4 relative overflow-hidden">
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet/25 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon mb-3"><UserCircle2 size={22} className="text-white" /></div>
              <div className="text-xs tracking-[0.2em] text-cyan/80 mb-1">TEAM ALGEBRA</div>
              <h1 className="text-2xl font-bold text-white">MEMBER PORTAL</h1>
              <p className="text-slate-400 mb-4">Welcome Back, Team Member</p>
            </div>
            {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Member ID / registered email</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-violet/40">
                <Mail size={16} className="text-slate-400" />
                <input className="bg-transparent outline-none text-slate-200 placeholder:text-slate-500 w-full" placeholder="Member ID / registered email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Password</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-violet/40">
                <Lock size={16} className="text-slate-400" />
                <input className="bg-transparent outline-none text-slate-200 placeholder:text-slate-500 w-full" placeholder="Password" type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" onClick={()=>setShow(s=>!s)} className="text-slate-400 hover:text-white" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" className="accent-cyan" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
              <Link to="/member/forgot-password" className="text-cyan hover:underline">Forgot password</Link>
            </div>
            <button className="w-full bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-2.5 font-medium shadow-neon hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UserCircle2 size={16} />} {loading ? "Signing in..." : "Member Login"}
            </button>
            <div className="text-sm text-slate-400 text-center">New member? <Link to="/member/signup" className="text-cyan hover:underline">Member Signup</Link> · <Link to="/member/verify-email" className="text-cyan hover:underline">Verify email</Link></div>
          </form>
          <div className="text-center mt-4 text-sm text-slate-400 flex items-center justify-center gap-3"><Link to="/login" className="text-cyan hover:underline">All portals</Link><span>·</span><Link to="/admin/login" className="hover:text-white">Admin Portal</Link></div>
        </motion.div>
      </div>
    </main>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle2, Eye, EyeOff, Lock, Mail, User, Phone, Users, BadgeCheck } from "lucide-react";
import { apiRequest } from "../../services/apiClient";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function MemberSignup() {
  const [form, setForm] = useState({ fullName: "", memberId: "", email: "", phoneNumber: "", teamName: "", password: "", confirmPassword: "", acceptTerms: false });
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const pwStrength = useMemo(() => strength(form.password), [form.password]);
  const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500"];
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.acceptTerms) { setError("You must accept the terms and conditions."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await apiRequest<any>("/auth/member/register", { method: "POST", body: JSON.stringify({ ...form, phoneNumber: form.phoneNumber || null, teamName: form.teamName || null }) });
      setSuccess(res.message || "Registration successful. Please verify your email.");
      setTimeout(() => navigate(`/member/verify-email?email=${encodeURIComponent(form.email)}`), 1200);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const inputCls = "bg-transparent outline-none text-slate-200 placeholder:text-slate-500 w-full";
  const wrapCls = "flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-violet/40";

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0b1024] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(168,85,247,0.35),transparent_35%),linear-gradient(160deg,#0b1024_0%,#1a1140_50%,#0b1024_100%)]" />
      <motion.div className="absolute top-16 right-[12%] w-36 h-36 rounded-[2rem] bg-accent/10 border border-white/10" animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-16 left-[10%] w-28 h-28 rounded-full bg-violet/15 border border-white/10" animate={{ y: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity }} />
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-cyan mb-4"><UserCircle2 size={14} /> Member Onboarding</div>
          <h1 className="text-4xl font-bold text-white mb-3">MEMBER SIGNUP</h1>
          <p className="text-slate-300 text-lg mb-6">Join Team Algebra Club Tracker with a verified member account.</p>
          <div className="glass rounded-2xl p-6 border border-white/10 space-y-3 text-slate-300 text-sm">
            <div className="flex gap-2"><BadgeCheck size={16} className="text-violet-300 mt-0.5" /> Unique email & Member ID validation</div>
            <div className="flex gap-2"><BadgeCheck size={16} className="text-violet-300 mt-0.5" /> Secure password hashing & email verification</div>
            <div className="flex gap-2"><BadgeCheck size={16} className="text-violet-300 mt-0.5" /> Member access assigned by trusted backend</div>
          </div>
        </motion.div>
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={onSubmit} className="glass-strong rounded-3xl p-7 md:p-8 border border-white/10 shadow-glass space-y-4 max-w-md mx-auto w-full">
          <div><div className="text-xs tracking-[0.2em] text-cyan/80 mb-1">TEAM ALGEBRA</div><h2 className="text-2xl font-bold text-white">Member Registration</h2><p className="text-slate-400 text-sm">Create your member account</p></div>
          {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{success}</p>}
          <div><label className="text-sm text-slate-300">Full Name</label><div className={wrapCls}><User size={16} className="text-slate-400"/><input className={inputCls} placeholder="Full Name" value={form.fullName} onChange={e=>set("fullName",e.target.value)} required /></div></div>
          <div><label className="text-sm text-slate-300">Member ID</label><div className={wrapCls}><BadgeCheck size={16} className="text-slate-400"/><input className={inputCls} placeholder="Member ID" value={form.memberId} onChange={e=>set("memberId",e.target.value)} required /></div></div>
          <div><label className="text-sm text-slate-300">Gmail Address</label><div className={wrapCls}><Mail size={16} className="text-slate-400"/><input className={inputCls} type="email" placeholder="name@gmail.com" value={form.email} onChange={e=>set("email",e.target.value)} required /></div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-slate-300">Phone (optional)</label><div className={wrapCls}><Phone size={16} className="text-slate-400"/><input className={inputCls} placeholder="Phone" value={form.phoneNumber} onChange={e=>set("phoneNumber",e.target.value)} /></div></div>
            <div><label className="text-sm text-slate-300">Team Name</label><div className={wrapCls}><Users size={16} className="text-slate-400"/><input className={inputCls} placeholder="Team (if applicable)" value={form.teamName} onChange={e=>set("teamName",e.target.value)} /></div></div>
          </div>
          <div><label className="text-sm text-slate-300">Password</label><div className={wrapCls}><Lock size={16} className="text-slate-400"/><input className={inputCls} type={show1?"text":"password"} placeholder="Password" value={form.password} onChange={e=>set("password",e.target.value)} required /><button type="button" onClick={()=>setShow1(s=>!s)} className="text-slate-400 hover:text-white">{show1?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            <div className="mt-2"><div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${colors[pwStrength]} transition-all`} style={{width:`${(pwStrength/4)*100}%`}} /></div><div className="text-xs text-slate-400 mt-1">Password strength: {labels[pwStrength]}</div></div></div>
          <div><label className="text-sm text-slate-300">Confirm Password</label><div className={wrapCls}><Lock size={16} className="text-slate-400"/><input className={inputCls} type={show2?"text":"password"} placeholder="Confirm Password" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)} required /><button type="button" onClick={()=>setShow2(s=>!s)} className="text-slate-400 hover:text-white">{show2?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
          <label className="flex items-start gap-2 text-sm text-slate-300"><input type="checkbox" className="mt-1 accent-cyan" checked={form.acceptTerms} onChange={e=>set("acceptTerms",e.target.checked)} /><span>I accept the Terms and Conditions.</span></label>
          <button className="w-full bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-2.5 font-medium shadow-neon hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60" type="submit" disabled={loading}>{loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UserCircle2 size={16} />} {loading ? "Creating account..." : "Create Member Account"}</button>
          <div className="text-sm text-slate-400 text-center">Already registered? <Link to="/member/login" className="text-cyan hover:underline">Member Login</Link></div>
        </motion.form>
      </div>
    </main>
  );
}

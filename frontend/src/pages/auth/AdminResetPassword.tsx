import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { apiRequest } from "../../services/apiClient";

function strength(pw: string) { let s = 0; if (pw.length >= 8) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s; }

export function AdminResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show1, setShow1] = useState(false); const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const pwStrength = useMemo(()=>strength(password),[password]);
  const labels = ["Weak","Fair","Good","Strong","Very strong"]; const colors=["bg-rose-500","bg-orange-500","bg-amber-500","bg-emerald-500","bg-cyan-500"];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!token) { setError("Invalid or missing reset token."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await apiRequest<any>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password, confirmPassword, portal: "admin" }) });
      setSuccess(true);
    } catch (e: any) { setError(e.message || "Unable to reset password"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-midnight flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-premium-gradient" />
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-8 border border-white/10 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon"><Shield className="text-white" size={20}/></div>
        <div className="text-xs tracking-[0.2em] text-cyan/80">ADMIN PORTAL</div>
        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        {success ? (
          <div className="space-y-4">
            <p className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-sm">Your password has been successfully updated.</p>
            <Link to="/admin/login" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-accent via-violet to-cyan text-white rounded-xl px-4 py-2.5 font-medium">Return to Login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
            <div><label className="text-sm text-slate-300">New Password</label><div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"><Lock size={16} className="text-slate-400"/><input className="bg-transparent outline-none text-slate-200 w-full" type={show1?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required /><button type="button" onClick={()=>setShow1(s=>!s)} className="text-slate-400">{show1?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
              <div className="mt-2"><div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${colors[pwStrength]} transition-all`} style={{width:`${(pwStrength/4)*100}%`}} /></div><div className="text-xs text-slate-400 mt-1">Password strength: {labels[pwStrength]}</div></div></div>
            <div><label className="text-sm text-slate-300">Confirm New Password</label><div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"><Lock size={16} className="text-slate-400"/><input className="bg-transparent outline-none text-slate-200 w-full" type={show2?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required /><button type="button" onClick={()=>setShow2(s=>!s)} className="text-slate-400">{show2?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
            <button className="w-full bg-gradient-to-r from-accent via-violet to-cyan text-white rounded-xl px-4 py-2.5 font-medium shadow-neon disabled:opacity-60" disabled={loading}>{loading?"Updating...":"Update Password"}</button>
          </form>
        )}
      </motion.div>
    </main>
  );
}

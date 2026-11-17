import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle2, Mail } from "lucide-react";
import { apiRequest } from "../../services/apiClient";

export function MemberForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setMessage(null); setLoading(true);
    try {
      const res = await apiRequest<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, portal: "member" }) });
      setMessage(res.message || "If an account exists for that email, a secure password reset link has been sent.");
    } catch (e: any) { setError(e.message || "Unable to process request"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#0b1024] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.25),transparent_40%),linear-gradient(160deg,#0b1024,#1a1140)]" />
      <motion.form initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} onSubmit={onSubmit} className="relative z-10 w-full max-w-md glass-strong rounded-3xl p-8 border border-white/10 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon"><UserCircle2 className="text-white" size={20}/></div>
        <div className="text-xs tracking-[0.2em] text-cyan/80">MEMBER PORTAL</div>
        <h1 className="text-2xl font-bold text-white">Forgot Your Password?</h1>
        <p className="text-slate-400 text-sm">Enter your registered email address. We will send you a secure password reset link.</p>
        {message && <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{message}</p>}
        {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
        <div><label className="text-sm text-slate-300">Registered Gmail Address</label><div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"><Mail size={16} className="text-slate-400"/><input className="bg-transparent outline-none text-slate-200 w-full" type="email" placeholder="Registered email" value={email} onChange={e=>setEmail(e.target.value)} required /></div></div>
        <button className="w-full bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-2.5 font-medium shadow-neon disabled:opacity-60" disabled={loading}>{loading?"Sending...":"Send Reset Link"}</button>
        <div className="text-sm text-slate-400 text-center"><Link to="/member/login" className="text-cyan hover:underline">Return to Member Login</Link></div>
      </motion.form>
    </main>
  );
}

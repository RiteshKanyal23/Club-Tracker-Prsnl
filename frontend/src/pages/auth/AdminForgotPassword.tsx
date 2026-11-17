import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail } from "lucide-react";
import { apiRequest } from "../../services/apiClient";

export function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setMessage(null); setLoading(true);
    try {
      const res = await apiRequest<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, portal: "admin" }) });
      setMessage(res.message || "If an account exists for that email, a secure password reset link has been sent.");
    } catch (e: any) { setError(e.message || "Unable to process request"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-midnight flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-premium-gradient" />
      <motion.form initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} onSubmit={onSubmit} className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-8 border border-white/10 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon"><Shield className="text-white" size={20}/></div>
        <div className="text-xs tracking-[0.2em] text-cyan/80">ADMIN PORTAL</div>
        <h1 className="text-2xl font-bold text-white">Forgot Your Password?</h1>
        <p className="text-slate-400 text-sm">Enter your registered email address. We will send you a secure password reset link.</p>
        {message && <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{message}</p>}
        {error && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
        <div><label className="text-sm text-slate-300">Registered Email Address</label><div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"><Mail size={16} className="text-slate-400"/><input className="bg-transparent outline-none text-slate-200 w-full" type="email" placeholder="Registered admin email" value={email} onChange={e=>setEmail(e.target.value)} required /></div></div>
        <button className="w-full bg-gradient-to-r from-accent via-violet to-cyan text-white rounded-xl px-4 py-2.5 font-medium shadow-neon disabled:opacity-60" disabled={loading}>{loading?"Sending...":"Send Reset Link"}</button>
        <div className="text-sm text-slate-400 text-center"><Link to="/admin/login" className="text-cyan hover:underline">Return to Admin Login</Link></div>
      </motion.form>
    </main>
  );
}

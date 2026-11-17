import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, UserCircle2, RefreshCw } from "lucide-react";
import { apiRequest } from "../../services/apiClient";

function friendlyError(err: any, fallback: string) {
  const msg = String(err?.message || "");
  if (!msg || /failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return "Unable to connect to the server. Please try again.";
  }
  return msg || fallback;
}

export function MemberVerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [email, setEmail] = useState(params.get("email") || "");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(token ? "verifying" : "idle");
  const [message, setMessage] = useState<string>(token ? "Verifying your email..." : "Enter your email to resend the verification link.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<any>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token, portal: "member" }) });
        if (cancelled) return;
        setStatus("success");
        setMessage(res.message || "Email verified successfully.");
      } catch (e: any) {
        if (cancelled) return;
        setStatus("error");
        setMessage(friendlyError(e, "Invalid verification link."));
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => navigate("/member/login", { replace: true }), 1800);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const res = await apiRequest<any>("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email, portal: "member" }) });
      setMessage(res.message || "If an eligible account exists, a verification email has been sent.");
      if (status !== "success") setStatus("idle");
    } catch (e: any) {
      setMessage(friendlyError(e, "Unable to resend verification email. Please try again."));
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1024] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.25),transparent_40%),linear-gradient(160deg,#0b1024,#1a1140)]" />
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="relative z-10 w-full max-w-md glass-strong rounded-3xl p-8 border border-white/10 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-neon">{status==="success"?<MailCheck className="text-white"/>:<UserCircle2 className="text-white"/>}</div>
        <div className="text-xs tracking-[0.2em] text-cyan/80">TEAM ALGEBRA · MEMBER</div>
        <h1 className="text-2xl font-bold text-white">Email Verification</h1>
        <p className={`text-sm ${status==="success"?"text-emerald-300":status==="error"?"text-rose-300":"text-slate-300"}`}>{message}</p>
        {status === "success" ? (
          <div className="space-y-2">
            <Link to="/member/login" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-accent to-violet text-white rounded-xl px-4 py-2.5 font-medium">Go to Member Login</Link>
            <p className="text-xs text-slate-400">Redirecting to member login...</p>
          </div>
        ) : (
          <form onSubmit={resend} className="space-y-3 text-left">
            <label className="text-sm text-slate-300">Registered member email</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none" type="email" placeholder="Registered email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <button className="w-full glass border border-white/10 text-slate-200 rounded-xl px-4 py-2.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60" disabled={busy}><RefreshCw size={16}/> {busy?"Sending...":"Resend verification email"}</button>
          </form>
        )}
        <div className="text-sm text-slate-400"><Link to="/login" className="text-cyan hover:underline">Back to portal selection</Link></div>
      </motion.div>
    </main>
  );
}

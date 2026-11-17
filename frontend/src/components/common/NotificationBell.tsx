import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { apiRequest } from "../../services/apiClient";
import { socket } from "../../services/socketClient";
import { useAuthStore } from "../../store/auth.store";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const base = user ? (user.role === "PROJECT_MANAGER" ? "/project-manager" : `/${user.role.toLowerCase().replace("_", "-")}`) : "/";

  const load = async () => {
    try { const r = await apiRequest<any>("/notifications?unread=true&limit=10"); setItems(r.data || []); } catch {}
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const onNew = (n: any) => setItems((prev) => [n, ...prev].slice(0, 10));
    socket.on("notification:new", onNew);
    return () => { socket.off("notification:new", onNew); };
  }, []);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = items.filter((i) => !i.readAt).length;
  return (
    <div className="relative" ref={ref}>
      <button
        className="relative w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-200 hover:text-white hover:shadow-neon transition"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-accent to-violet text-white text-[10px] rounded-full flex items-center justify-center shadow-neon">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-glass z-30 p-3 border border-white/10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-white">Notifications</span>
              <button className="text-xs text-cyan hover:underline" onClick={async()=>{await apiRequest("/notifications/read-all",{method:"POST"}); load();}}>Mark all read</button>
            </div>
            <div className="max-h-64 overflow-auto space-y-2 pr-1">
              {items.length === 0 ? (
                <div className="text-sm text-slate-400 py-4 text-center">No new notifications</div>
              ) : items.map((n)=> (
                <div key={n.id} className="text-sm rounded-xl bg-white/5 border border-white/5 p-2">
                  <div className="font-medium text-white">{n.title}</div>
                  {n.body && <div className="text-slate-400 text-xs mt-0.5 line-clamp-2">{n.body}</div>}
                </div>
              ))}
            </div>
            <div className="mt-2 text-right">
              <Link className="text-sm text-accent hover:text-cyan" to={`${base}/notifications`} onClick={()=>setOpen(false)}>Open center</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

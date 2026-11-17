import { PropsWithChildren, useEffect, useMemo, useState, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, Users, UserSquare2, CheckSquare, CalendarCheck,
  CalendarDays, Video, FileText, MessageSquare, Megaphone, BookOpen, Bell,
  BarChart3, Award, MessageCircleHeart, ShieldCheck, Search, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Sparkles
} from "lucide-react";
import { APP_NAME } from "../../constants";
import { useAuthStore } from "../../store/auth.store";
import { connectSocket, disconnectSocket } from "../../services/socketClient";
import { apiRequest } from "../../services/apiClient";
import { NotificationBell } from "../common/NotificationBell";
import { cn } from "../../utils/cn";

type NavItem = { key: string; label: string; icon: any; path: string; roles?: string[] };

const ALL_ITEMS: Array<Omit<NavItem, "path"> & { segment: string }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, segment: "" },
  { key: "projects", label: "Projects", icon: FolderKanban, segment: "/projects" },
  { key: "teams", label: "Teams", icon: Users, segment: "/teams" },
  { key: "members", label: "Members", icon: UserSquare2, segment: "/members" },
  { key: "tasks", label: "Tasks & Progress", icon: CheckSquare, segment: "/tasks" },
  { key: "attendance", label: "Attendance", icon: CalendarCheck, segment: "/attendance" },
  { key: "leave", label: "Leave", icon: CalendarDays, segment: "/leave" },
  { key: "meetings", label: "Meetings", icon: Video, segment: "/meetings" },
  { key: "documents", label: "Documents", icon: FileText, segment: "/documents" },
  { key: "communication", label: "Chat", icon: MessageSquare, segment: "/communication" },
  { key: "announcements", label: "Announcements", icon: Megaphone, segment: "/announcements" },
  { key: "knowledge", label: "Knowledge", icon: BookOpen, segment: "/knowledge" },
  { key: "notifications", label: "Notifications", icon: Bell, segment: "/notifications" },
  { key: "analytics", label: "Analytics", icon: BarChart3, segment: "/analytics" },
  { key: "achievements", label: "Achievements", icon: Award, segment: "/achievements" },
  { key: "feedback", label: "Feedback", icon: MessageCircleHeart, segment: "/feedback" },
  { key: "audit", label: "Audit", icon: ShieldCheck, segment: "/audit" },
];

const ROLE_SEGMENTS: Record<string, Set<string>> = {
  ADMIN: new Set(ALL_ITEMS.map(i => i.segment)),
  COORDINATOR: new Set(ALL_ITEMS.map(i => i.segment)),
  PROJECT_MANAGER: new Set(["", "/projects", "/tasks", "/meetings", "/documents", "/communication", "/announcements", "/knowledge", "/notifications", "/analytics", "/achievements", "/feedback"]),
  TEAM_LEADER: new Set(["", "/tasks", "/attendance", "/leave", "/meetings", "/documents", "/communication", "/announcements", "/knowledge", "/notifications", "/analytics", "/achievements", "/feedback"]),
  MEMBER: new Set(["", "/tasks", "/attendance", "/leave", "/meetings", "/documents", "/communication", "/announcements", "/knowledge", "/notifications", "/analytics", "/achievements", "/feedback"]),
};

export function AppLayout({ children }: PropsWithChildren) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const base = user ? (user.role === "PROJECT_MANAGER" ? "/project-manager" : `/${user.role.toLowerCase().replace("_", "-")}`) : "/";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => {
    const allowed = ROLE_SEGMENTS[user?.role || ""] || new Set([""]);
    return ALL_ITEMS.filter(i => allowed.has(i.segment)).map(i => ({ ...i, path: `${base}${i.segment}` || base }));
  }, [user?.role, base]);

  useEffect(() => {
    if (user?.id) connectSocket(user.id);
    return () => { /* keep shared socket; disconnect on logout */ };
  }, [user?.id]);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onLogout = async () => {
    const role = user?.role;
    try { await apiRequest("/auth/logout", { method: "POST" }); } catch {}
    disconnectSocket();
    logout();
    if (role === "ADMIN") navigate("/admin/login");
    else if (role === "MEMBER") navigate("/member/login");
    else navigate("/login");
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="h-full flex flex-col">
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-white/10", collapsed && !mobile && "justify-center px-2")}> 
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent via-violet to-cyan flex items-center justify-center shadow-neon shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <div className="font-semibold text-white leading-tight truncate">Team Algebra</div>
            <div className="text-[10px] text-cyan/80 tracking-wider uppercase">Club Tracker</div>
          </div>
        )}
        {mobile && (
          <button className="ml-auto text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.segment === ""}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 relative",
                collapsed && !mobile ? "justify-center px-2" : "",
                isActive
                  ? "bg-gradient-to-r from-accent/25 to-violet/20 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_8px_20px_rgba(59,130,246,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gradient-to-b from-accent to-cyan" />}
                  <Icon size={18} className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-cyan")} />
                  {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      {!mobile && (
        <div className="p-2 border-t border-white/10">
          <button onClick={() => setCollapsed(v => !v)} className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-slate-400 hover:text-white hover:bg-white/5 transition">
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-midnight text-slate-100 bg-premium-gradient relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-violet/15 rounded-full blur-3xl" />

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:flex fixed left-0 top-0 h-screen z-30 glass-strong border-r border-white/10 flex-col transition-all duration-300", collapsed ? "w-[76px]" : "w-[260px]")}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="fixed left-0 top-0 h-screen w-[280px] z-50 glass-strong border-r border-white/10 lg:hidden">
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn("relative z-10 min-h-screen flex flex-col transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]")}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-3">
          <div className="glass rounded-2xl px-3 md:px-4 py-2.5 flex items-center gap-3 border border-white/10">
            <button className="lg:hidden w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-200" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-400">
              <Search size={16} />
              <input className="bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full" placeholder="Search projects, tasks, members..." readOnly />
            </div>
            <div className="ml-auto flex items-center gap-2 md:gap-3">
              {user && <NotificationBell />}
              {user && (
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-2 rounded-xl glass px-2 py-1.5 hover:shadow-neon transition">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-violet flex items-center justify-center text-white text-sm font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="hidden sm:block text-left leading-tight">
                      <div className="text-sm text-white font-medium max-w-[120px] truncate">{user.name}</div>
                      <div className="text-[10px] text-cyan/80 uppercase tracking-wide">{user.role?.replace("_", " ")}</div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 mt-2 w-52 glass-strong rounded-2xl border border-white/10 shadow-glass p-2 z-30">
                        <div className="px-3 py-2 border-b border-white/10 mb-1">
                          <div className="text-sm text-white font-medium truncate">{user.name}</div>
                          <div className="text-xs text-slate-400 truncate">{user.email}</div>
                          <div className="text-[10px] text-cyan mt-0.5">{user.role?.replace("_", " ")} �?" Admin User</div>
                        </div>
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5" onClick={() => { setProfileOpen(false); navigate(base); }}>
                          <Settings size={16} /> Settings
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-300 hover:text-rose-200 hover:bg-rose-500/10" onClick={onLogout}>
                          <LogOut size={16} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 pb-8">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

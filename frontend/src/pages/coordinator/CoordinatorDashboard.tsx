import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Users, UserSquare2, CheckSquare, CalendarCheck, CalendarDays, Video, FileText, BarChart3, Megaphone } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { analyticsApi } from "../../features/analytics/api";

export function CoordinatorDashboard() {
  const [overview, setOverview] = useState<any>(null);
  useEffect(() => { analyticsApi.overview().then(r => setOverview(r.data)).catch(() => {}); }, []);
  const totals = overview?.totals || {};
  const quick = [
    { to: "/coordinator/projects", label: "Projects", icon: FolderKanban }, { to: "/coordinator/teams", label: "Teams", icon: Users },
    { to: "/coordinator/members", label: "Members", icon: UserSquare2 }, { to: "/coordinator/tasks", label: "Tasks", icon: CheckSquare },
    { to: "/coordinator/attendance", label: "Attendance", icon: CalendarCheck }, { to: "/coordinator/leave", label: "Leave", icon: CalendarDays },
    { to: "/coordinator/meetings", label: "Meetings", icon: Video }, { to: "/coordinator/documents", label: "Documents", icon: FileText },
    { to: "/coordinator/analytics", label: "Analytics", icon: BarChart3 }, { to: "/coordinator/announcements", label: "Announcements", icon: Megaphone },
  ];
  return (
    <AppLayout>
      <PageHeader title="Coordinator Dashboard" subtitle="Oversee teams, attendance, leave approvals, announcements, and analytics." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Projects" value={totals.projects ?? 0} icon={<FolderKanban size={20} />} accent="from-accent to-cyan" />
        <StatCard title="Teams" value={totals.teams ?? 0} icon={<Users size={20} />} accent="from-violet to-accent" />
        <StatCard title="Members" value={totals.members ?? 0} icon={<UserSquare2 size={20} />} accent="from-cyan to-accent" />
        <StatCard title="Tasks" value={totals.tasks ?? 0} icon={<CheckSquare size={20} />} accent="from-emerald-500 to-cyan" />
      </div>
      <GlassCard>
        <h2 className="font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quick.map(q => { const Icon = q.icon; return (
            <Link key={q.to} to={q.to} className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-accent/10 hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-violet/30 flex items-center justify-center text-cyan group-hover:shadow-neon"><Icon size={18} /></div>
              <span className="text-sm text-slate-300 group-hover:text-white">{q.label}</span>
            </Link>
          );})}
        </div>
      </GlassCard>
    </AppLayout>
  );
}

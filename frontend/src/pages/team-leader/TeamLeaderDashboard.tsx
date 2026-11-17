import { Link } from "react-router-dom";
import { CheckSquare, CalendarCheck, CalendarDays, Video, FileText, MessageSquare, Megaphone, BookOpen, Bell } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";

export function TeamLeaderDashboard() {
  const quick = [
    { to: "/team-leader/tasks", label: "Tasks & Progress", icon: CheckSquare }, { to: "/team-leader/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/team-leader/leave", label: "Leave", icon: CalendarDays }, { to: "/team-leader/meetings", label: "Meetings", icon: Video },
    { to: "/team-leader/documents", label: "Documents", icon: FileText }, { to: "/team-leader/communication", label: "Chat", icon: MessageSquare },
    { to: "/team-leader/announcements", label: "Announcements", icon: Megaphone }, { to: "/team-leader/knowledge", label: "Knowledge", icon: BookOpen },
    { to: "/team-leader/notifications", label: "Notifications", icon: Bell },
  ];
  return (
    <AppLayout>
      <PageHeader title="Team Leader Dashboard" subtitle="Manage team tasks, attendance, meeting actions, and leave approvals." />
      <GlassCard>
        <h2 className="font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quick.map(q => { const Icon = q.icon; return (
            <Link key={q.to} to={q.to} className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-accent/10 hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-violet/30 flex items-center justify-center text-cyan group-hover:shadow-neon"><Icon size={18} /></div>
              <span className="text-sm text-slate-300 group-hover:text-white text-center">{q.label}</span>
            </Link>
          );})}
        </div>
      </GlassCard>
    </AppLayout>
  );
}

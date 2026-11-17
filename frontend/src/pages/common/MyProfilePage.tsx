import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, UserSquare2 } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../features/attendance/components/StatusBadge";
import { attendanceApi } from "../../features/attendance/api";
import { organizationApi } from "../../features/organization/api";
import { formatDate, formatTime, secondaryButtonCls } from "../../features/organization/ui";

function Detail({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-white">{value || "—"}</div>
    </div>
  );
}

export function MyProfilePage() {
  const [data, setData] = useState<any>({ member: null, assignment: null });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, attendance] = await Promise.all([organizationApi.me(), attendanceApi.list({ limit: 200 })]);
      const member = me.data?.member || null;
      setData({ member, assignment: me.data?.assignment || null });
      const all = (attendance.data?.items || []) as any[];
      setRecords(member ? all.filter((r) => r.memberId === member.id || r.member?.id === member.id) : []);
    } catch (err: any) {
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const member = data.member;
  const assignment = data.assignment;
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;

  return (
    <AppLayout>
      <PageHeader
        title="My Profile"
        subtitle="Your registered lab hierarchy, assignment details, and personal attendance history."
        actions={
          <button className={secondaryButtonCls} onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}
      {loading ? (
        <GlassCard><div className="py-10 text-center text-slate-400">Loading profile...</div></GlassCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <GlassCard>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-accent to-violet flex items-center justify-center text-3xl font-bold text-white shadow-neon">
                {member?.profilePicture ? (
                  <img src={member.profilePicture} alt={member.user?.name || "Profile"} className="h-full w-full object-cover" />
                ) : (
                  (member?.user?.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="mt-4 text-xl font-semibold text-white">{member?.user?.name || "No linked member profile"}</div>
              <div className="text-sm text-slate-400">{member?.user?.email || "Contact an administrator if this is unexpected."}</div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cyan">{member?.user?.role || "—"}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {member?.status || "ACTIVE"}
                </span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail label="Member ID" value={member?.memberId} />
              <Detail label="Contact Number" value={member?.phone} />
              <Detail label="Joining Date" value={formatDate(member?.joiningDate)} />
              <Detail label="Legacy Team Name" value={member?.teamName} />
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><UserSquare2 size={18} className="text-cyan" /> Organizational Assignment</h2>
                {assignment && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${assignment.isValid ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                    {assignment.isValid ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {assignment.isValid ? "Valid" : "Needs attention"}
                  </span>
                )}
              </div>
              {!assignment ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  You do not have an active organizational assignment. Administrators must complete your registration before attendance is enabled.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail label="Designation" value={assignment.designation?.name} />
                    <Detail label="Project" value={assignment.project?.name} />
                    <Detail label="Project Manager" value={assignment.project?.manager?.name || assignment.projectManager?.name} />
                    <Detail label="Team" value={assignment.team?.label} />
                    <Detail label="Team Lead" value={assignment.teamLead?.name} />
                    <Detail label="Effective From" value={formatDate(assignment.effectiveFrom)} />
                  </div>
                  {!!assignment.issues?.length && (
                    <ul className="mt-4 list-disc space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      {assignment.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
                    </ul>
                  )}
                </>
              )}
            </GlassCard>

            <GlassCard hover={false}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">My Attendance</h2>
                <div className="text-sm text-slate-400">{records.length} records · {present} present/late</div>
              </div>
              {records.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No attendance records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400">
                      <tr className="border-b border-white/10">
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Session</th>
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2 pr-3">Team</th>
                        <th className="py-2 pr-3">Designation</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Check-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.slice(0, 50).map((record) => (
                        <tr key={record.id} className="border-b border-white/5 text-slate-300">
                          <td className="py-2 pr-3">{formatDate(record.date)}</td>
                          <td className="py-2 pr-3">{record.sessionName || "—"}</td>
                          <td className="py-2 pr-3">{record.projectName || "—"}</td>
                          <td className="py-2 pr-3">{record.teamName || "—"}</td>
                          <td className="py-2 pr-3">{record.designationName || "—"}</td>
                          <td className="py-2 pr-3"><StatusBadge status={record.status} /></td>
                          <td className="py-2 pr-3">{formatTime(record.checkIn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

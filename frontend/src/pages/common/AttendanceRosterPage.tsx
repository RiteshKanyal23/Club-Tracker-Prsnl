import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Save } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { EmptyState } from "../../components/ui/EmptyState";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../features/attendance/components/StatusBadge";
import { attendanceApi } from "../../features/attendance/api";
import { organizationApi } from "../../features/organization/api";
import { buttonCls, formatDate, formatTime, inputCls, labelCls, secondaryButtonCls, todayInput } from "../../features/organization/ui";
import { useAuthStore } from "../../store/auth.store";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export function AttendanceRosterPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER"].includes(role || "");

  const [date, setDate] = useState(todayInput());
  const [sessionName, setSessionName] = useState("");
  const [roster, setRoster] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [statusByRow, setStatusByRow] = useState<Record<string, string>>({});
  const [notesByRow, setNotesByRow] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, v, a] = await Promise.all([
        organizationApi.roster(),
        organizationApi.validation().catch(() => ({ data: null })),
        attendanceApi.list({ date, sessionName: sessionName || undefined, limit: 200 }),
      ]);
      setRoster(r.data || null);
      setValidation(v.data || null);
      setRecords((a.data?.items || []) as any[]);
    } catch (err: any) {
      setError(err.message || "Unable to load attendance roster");
    } finally {
      setLoading(false);
    }
  }, [date, sessionName]);

  useEffect(() => {
    void load();
  }, [load]);

  const recordByMember = useMemo(() => {
    const map = new Map<string, any>();
    records.forEach((record) => {
      const keys = [record.memberId, record.memberIdText, record.member?.memberId];
      keys.forEach((key) => {
        if (key && !map.has(String(key))) map.set(String(key), record);
      });
    });
    return map;
  }, [records]);

  const recordFor = (row: any) => {
    const direct = recordByMember.get(String(row.memberRecordId || ""));
    if (direct) return direct;
    if (row.memberId) return recordByMember.get(String(row.memberId));
    return undefined;
  };

  const mark = async (row: any) => {
    if (!row.memberRecordId) {
      setError("This member cannot be marked because no database member profile is linked.");
      return;
    }
    setSavingRow(String(row.memberRecordId));
    setError(null);
    setNotice(null);
    try {
      await attendanceApi.create({
        memberId: row.memberRecordId,
        date,
        sessionName: sessionName || undefined,
        status: statusByRow[String(row.memberRecordId)] || "PRESENT",
        notes: notesByRow[String(row.memberRecordId)] || undefined,
      });
      setNotice(`${row.name} marked ${(statusByRow[String(row.memberRecordId)] || "PRESENT").toLowerCase()}.`);
      await load();
    } catch (err: any) {
      setError(err.message || "Unable to mark attendance");
    } finally {
      setSavingRow(null);
    }
  };

  const warnings: any[] = roster?.warnings || [];
  const rows: any[] = roster?.rows || [];

  return (
    <AppLayout>
      <PageHeader
        title="Attendance Roster"
        subtitle="Attendance is driven by the registered hierarchy: Project Manager → Team Lead → Team Members."
        actions={
          <>
            <button className={secondaryButtonCls} onClick={() => void load()} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <a className={secondaryButtonCls} href={attendanceApi.exportCsvUrl({ date })} target="_blank" rel="noreferrer">
              Export CSV
            </a>
          </>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{notice}</div>}

      {!canWrite && (
        <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
          You have view-only access. Attendance writes are limited to Administrators, Coordinators, Project Managers, and Team Leads.
        </div>
      )}

      {validation && !validation.canOpenAttendance && (
        <GlassCard className="mb-4" hover={false}>
          <div className="flex items-start gap-3 text-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Attendance validation found {validation.counts?.issues || 0} issue(s)</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
                {(validation.issues || []).slice(0, 6).map((issue: any, i: number) => (
                  <li key={i}>{issue.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}
      {validation?.canOpenAttendance && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          <CheckCircle2 size={16} /> Hierarchy validation passed. All active members are eligible for attendance.
        </div>
      )}

      <GlassCard className="mb-6" hover={false}>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Attendance Date</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Session Name</label>
            <input className={inputCls} value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Optional, e.g. Lab Session 1" />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-slate-400">
              {rows.length} hierarchy rows · {warnings.length} warning(s)
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading attendance roster...</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No hierarchy rows" description="Register members in Organization Management to populate the roster." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-3">Member ID</th>
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Project</th>
                  <th className="py-3 pr-3">Project Manager</th>
                  <th className="py-3 pr-3">Team</th>
                  <th className="py-3 pr-3">Designation</th>
                  <th className="py-3 pr-3">Team Lead</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Time</th>
                  {canWrite && <th className="py-3 pr-3">Mark Attendance</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, idx: number) => {
                  const key = String(row.memberRecordId || row.memberId || idx);
                  const record = recordFor(row);
                  return (
                    <tr
                      key={key}
                      className={`border-b border-white/5 ${row.attendanceEligible ? "text-slate-300" : "bg-amber-500/5 text-amber-100"}`}
                    >
                      <td className="py-2 pr-3 font-mono text-xs">{row.memberId || "—"}</td>
                      <td className="py-2 pr-3">{row.name || "—"}</td>
                      <td className="py-2 pr-3">{row.project || "—"}</td>
                      <td className="py-2 pr-3">{row.projectManager || "—"}</td>
                      <td className="py-2 pr-3">{row.team || "—"}</td>
                      <td className="py-2 pr-3">{row.designation || "—"}</td>
                      <td className="py-2 pr-3">{row.teamLead || "—"}</td>
                      <td className="py-2 pr-3">
                        {record ? <StatusBadge status={record.status} /> : <span className="text-slate-500">Not marked</span>}
                        {!row.attendanceEligible && <div className="mt-1 text-[11px] text-amber-300">{row.issues?.[0] || "Invalid assignment"}</div>}
                      </td>
                      <td className="py-2 pr-3">{formatTime(record?.checkIn || record?.createdAt)}</td>
                      {canWrite && (
                        <td className="py-2 pr-3">
                          {row.attendanceEligible ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                className={`${inputCls} w-28 py-1`}
                                value={statusByRow[key] || "PRESENT"}
                                onChange={(e) => setStatusByRow((prev) => ({ ...prev, [key]: e.target.value }))}
                              >
                                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                              </select>
                              <input
                                className={`${inputCls} w-28 py-1`}
                                placeholder="Notes"
                                value={notesByRow[key] || ""}
                                onChange={(e) => setNotesByRow((prev) => ({ ...prev, [key]: e.target.value }))}
                              />
                              <button className={`${buttonCls} px-3 py-1.5`} onClick={() => void mark(row)} disabled={savingRow === key || !!record}>
                                <Save size={13} /> {record ? "Marked" : "Mark"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-300">Blocked</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="mt-4 text-xs text-slate-500">Records shown for {formatDate(date)}. Statuses are point-in-time snapshots and remain unchanged after later transfers.</div>
    </AppLayout>
  );
}

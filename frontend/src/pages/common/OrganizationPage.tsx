import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus, RefreshCw, Save, Trash2, UserMinus, Users } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { EmptyState } from "../../components/ui/EmptyState";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { organizationApi } from "../../features/organization/api";
import { buttonCls, formatDate, inputCls, labelCls, secondaryButtonCls } from "../../features/organization/ui";
import { useAuthStore } from "../../store/auth.store";

const emptyForm = {
  name: "",
  memberId: "",
  email: "",
  password: "",
  phone: "",
  profilePicture: "",
  joiningDate: "",
  accountStatus: "ACTIVE",
  designationId: "",
  projectId: "",
  projectManagerId: "",
  teamCategory: "",
  teamLeadId: "",
};

export function OrganizationPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "ADMIN" || role === "COORDINATOR";

  const [hierarchy, setHierarchy] = useState<any>({ ceo: null, projects: [] });
  const [validation, setValidation] = useState<any>(null);
  const [designations, setDesignations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDesignation, setNewDesignation] = useState("");
  const [projectEdits, setProjectEdits] = useState<Record<string, string>>({});
  const [teamEdits, setTeamEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, v, d, p, m] = await Promise.all([
        organizationApi.hierarchy(),
        organizationApi.validation(),
        organizationApi.designations(),
        organizationApi.projects(),
        organizationApi.members(),
      ]);
      setHierarchy(h.data || { ceo: null, projects: [] });
      setValidation(v.data || null);
      setDesignations((d.data || []) as any[]);
      setProjects((p.data || []) as any[]);
      setMembers((m.data?.items || []) as any[]);
      if (!form.designationId && (d.data || []).length) {
        setForm((prev: any) => ({ ...prev, designationId: (d.data || [])[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Unable to load organization data");
    } finally {
      setLoading(false);
    }
  }, [form.designationId]);

  useEffect(() => {
    void load();
  }, []);

  const designationMap = useMemo(() => {
    const map: Record<string, any> = {};
    designations.forEach((d) => (map[d.id] = d));
    return map;
  }, [designations]);

  const selectedDesignation = form.designationId ? designationMap[form.designationId] : null;
  const selectedKey = String(selectedDesignation?.key || "");

  const leadOptions = useMemo(() => {
    const rows: any[] = [];
    (hierarchy.projects || []).forEach((project: any) => {
      (project.teams || []).forEach((team: any) => {
        if (team.leader?.member?.id) {
          rows.push({
            id: team.leader.member.id,
            label: `${team.leader.member.name} · ${project.name} ${team.label}`,
            projectId: project.id,
            category: team.category,
          });
        }
      });
    });
    return rows;
  }, [hierarchy]);

  const filteredLeads = leadOptions.filter(
    (lead) => (!form.projectId || lead.projectId === form.projectId) && (!form.teamCategory || lead.category === form.teamCategory),
  );

  const projectManagerOptions = projects.filter((p) => p.manager);

  const setField = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const onDesignationChange = (id: string) => {
    const designation = designationMap[id];
    const key = String(designation?.key || "");
    setForm((prev: any) => {
      const next = { ...prev, designationId: id };
      if (key === "CEO") {
        next.projectId = "";
        next.projectManagerId = "";
        next.teamCategory = "";
        next.teamLeadId = "";
      } else if (key === "PROJECT_MANAGER") {
        next.teamCategory = "";
        next.teamLeadId = "";
      } else if (key.endsWith("_TEAM_LEAD") || key.endsWith("_DEVELOPER")) {
        next.teamCategory = key.split("_")[0].toLowerCase();
        next.teamCategory = next.teamCategory.charAt(0).toUpperCase() + next.teamCategory.slice(1);
        if (key.endsWith("_TEAM_LEAD")) next.teamLeadId = "";
      }
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, designationId: designations[0]?.id || "" });
  };

  const submitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.projectManagerId) delete payload.projectManagerId;
      if (selectedKey === "PROJECT_MANAGER") {
        delete payload.teamCategory;
        delete payload.teamLeadId;
      }
      if (selectedKey === "CEO") {
        delete payload.projectId;
        delete payload.teamCategory;
        delete payload.teamLeadId;
      }
      if (selectedKey.endsWith("_DEVELOPER") && !payload.teamLeadId) {
        throw new Error("Select the assigned Team Lead before saving a developer");
      }
      if (editingId) await organizationApi.updateMember(editingId, payload);
      else await organizationApi.registerMember(payload);
      setNotice(editingId ? "Member assignment updated." : "Lab member registered and assigned.");
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || "Unable to save member");
    } finally {
      setSaving(false);
    }
  };

  const editMember = (row: any) => {
    const d = row.designation?.id || "";
    const key = String(row.designation?.key || "");
    setEditingId(row.member?.id || null);
    setForm({
      name: row.member?.name || "",
      memberId: row.member?.memberId || "",
      email: row.member?.email || "",
      password: "",
      phone: row.member?.phone || "",
      profilePicture: row.member?.profilePicture || "",
      joiningDate: row.member?.joiningDate ? String(row.member.joiningDate).slice(0, 10) : "",
      accountStatus: row.member?.accountStatus || "ACTIVE",
      designationId: d,
      projectId: row.project?.id || "",
      projectManagerId: row.project?.manager?.id || "",
      teamCategory: row.team?.category ? String(row.team.category).charAt(0).toUpperCase() + String(row.team.category).slice(1).toLowerCase() : "",
      teamLeadId: row.teamLead?.id || "",
    });
    if (key) onDesignationChange(d);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runAction = async (action: () => Promise<any>, message: string) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(message);
      await load();
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const createDesignation = () =>
    runAction(async () => {
      const name = newDesignation.trim();
      if (!name) throw new Error("Enter a designation name");
      await organizationApi.createDesignation({ name });
      setNewDesignation("");
    }, "Custom designation added.");

  const saveProject = (projectId: string) =>
    runAction(() => organizationApi.updateProject(projectId, { name: projectEdits[projectId] }), "Project updated.");

  const saveTeam = (teamId: string) =>
    runAction(() => organizationApi.updateTeam(teamId, { name: teamEdits[teamId] }), "Team updated.");

  return (
    <AppLayout>
      <PageHeader
        title="Organization Management"
        subtitle="Register lab members, assign the reporting hierarchy, and validate readiness before attendance."
        actions={
          <button className={secondaryButtonCls} onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{notice}</div>}

      {validation && (
        <GlassCard className="mb-6" hover={false}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              {validation.canOpenAttendance ? (
                <CheckCircle2 className="mt-0.5 text-emerald-300" size={20} />
              ) : (
                <AlertTriangle className="mt-0.5 text-amber-300" size={20} />
              )}
              <div>
                <div className="font-semibold text-white">
                  {validation.canOpenAttendance ? "Hierarchy is ready for attendance" : "Attendance is locked until the hierarchy is complete"}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {validation.counts?.projects || 0} projects · {validation.counts?.teams || 0} teams · {validation.counts?.activeMembers || 0} active members ·{" "}
                  {validation.counts?.issues || 0} validation issues
                </div>
              </div>
            </div>
            {!canManage && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">View only</span>}
          </div>
          {!!validation.issues?.length && (
            <ul className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
              {validation.issues.slice(0, 12).map((issue: any, i: number) => (
                <li key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-200">
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Organizational Projects" value={validation?.counts?.projects ?? projects.length} icon={<Users size={19} />} />
        <StatCard title="Teams" value={validation?.counts?.teams ?? 18} icon={<Users size={19} />} accent="from-violet to-cyan" />
        <StatCard title="Active Members" value={validation?.counts?.activeMembers ?? members.length} icon={<Users size={19} />} accent="from-cyan to-accent" />
        <StatCard title="Open Issues" value={validation?.counts?.issues ?? 0} icon={<AlertTriangle size={19} />} accent="from-amber-500 to-rose-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {canManage && (
          <div className="space-y-6">
            <GlassCard>
              <div className="mb-4 flex items-center gap-2">
                {editingId ? <Pencil size={17} className="text-cyan" /> : <Plus size={17} className="text-cyan" />}
                <h2 className="text-lg font-semibold text-white">{editingId ? "Edit Member Assignment" : "Register Lab Member"}</h2>
              </div>
              <form onSubmit={submitMember} className="space-y-3">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input className={inputCls} value={form.name} onChange={(e) => setField("name", e.target.value)} required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Member ID</label>
                    <input className={inputCls} value={form.memberId} onChange={(e) => setField("memberId", e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Joining Date</label>
                    <input type="date" className={inputCls} value={form.joiningDate} onChange={(e) => setField("joiningDate", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => setField("email", e.target.value)} required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>{editingId ? "New Password (optional)" : "Password"}</label>
                    <input type="password" className={inputCls} value={form.password} onChange={(e) => setField("password", e.target.value)} required={!editingId} minLength={8} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Number</label>
                    <input className={inputCls} value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Profile Picture URL</label>
                  <input className={inputCls} value={form.profilePicture} onChange={(e) => setField("profilePicture", e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <select className={inputCls} value={form.designationId} onChange={(e) => onDesignationChange(e.target.value)} required>
                    <option value="">Select designation</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}{d.isBuiltIn ? "" : " (custom)"}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Assigned Project</label>
                    <select className={inputCls} value={form.projectId} onChange={(e) => setField("projectId", e.target.value)} disabled={selectedKey === "CEO"}>
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Project Manager</label>
                    <select
                      className={inputCls}
                      value={form.projectManagerId}
                      onChange={(e) => {
                        const pm = projectManagerOptions.find((p) => p.manager.id === e.target.value);
                        setForm((prev: any) => ({ ...prev, projectManagerId: e.target.value, projectId: pm?.id || prev.projectId }));
                      }}
                      disabled={selectedKey === "CEO" || selectedKey === "PROJECT_MANAGER"}
                    >
                      <option value="">Derived from project</option>
                      {projectManagerOptions.map((p) => (
                        <option key={p.manager.id} value={p.manager.id}>{p.manager.name} · {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Team Category</label>
                    <select className={inputCls} value={form.teamCategory} onChange={(e) => setField("teamCategory", e.target.value)} disabled={selectedKey === "CEO" || selectedKey === "PROJECT_MANAGER"}>
                      <option value="">Select category</option>
                      {["Frontend", "Backend", "Database"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Assigned Team Lead</label>
                    <select className={inputCls} value={form.teamLeadId} onChange={(e) => setField("teamLeadId", e.target.value)} disabled={selectedKey === "CEO" || selectedKey === "PROJECT_MANAGER" || selectedKey.endsWith("_TEAM_LEAD")}>
                      <option value="">Select team lead</option>
                      {filteredLeads.map((lead) => (
                        <option key={lead.id} value={lead.id}>{lead.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Account Status</label>
                  <select className={inputCls} value={form.accountStatus} onChange={(e) => setField("accountStatus", e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className={buttonCls} type="submit" disabled={saving}>
                    <Save size={16} /> {saving ? "Saving..." : editingId ? "Update Member" : "Register Member"}
                  </button>
                  {editingId && (
                    <button type="button" className={secondaryButtonCls} onClick={resetForm}>Cancel</button>
                  )}
                </div>
              </form>
            </GlassCard>

            <GlassCard>
              <h2 className="mb-4 text-lg font-semibold text-white">Custom Designations</h2>
              <div className="flex gap-2">
                <input className={inputCls} value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} placeholder="e.g. QA Engineer" />
                <button className={secondaryButtonCls} onClick={() => void createDesignation()} disabled={saving}>
                  <Plus size={15} /> Add
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {designations.filter((d) => !d.isBuiltIn).length === 0 && <span className="text-sm text-slate-500">No custom designations yet.</span>}
                {designations.filter((d) => !d.isBuiltIn).map((d) => (
                  <span key={d.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    {d.name}
                    <button
                      className="text-rose-300 hover:text-rose-200"
                      onClick={() => void runAction(() => organizationApi.removeDesignation(d.id), "Designation removed.")}
                      aria-label={`Delete ${d.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        <div className="space-y-6">
          <GlassCard hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Organization Hierarchy</h2>
              {role === "CEO" && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Full organization view</span>}
            </div>
            {loading ? (
              <div className="py-10 text-center text-slate-400">Loading hierarchy...</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-violet/30 bg-violet/10 p-4">
                  <div className="text-xs uppercase tracking-wide text-violet-200">Chief Executive Officer</div>
                  {hierarchy.ceo ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white">
                      <span className="font-medium">{hierarchy.ceo.member?.name}</span>
                      <span className="text-slate-400">{hierarchy.ceo.member?.memberId}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${hierarchy.ceo.isValid ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                        {hierarchy.ceo.isValid ? "Valid" : "Needs attention"}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-amber-200">No CEO assigned yet.</div>
                  )}
                </div>

                {(hierarchy.projects || []).map((project: any) => (
                  <div key={project.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Project {project.orgSlot} · {project.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Manager: {project.manager?.member?.name || project.managerUser?.name || "Not assigned"}
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <input
                            className={`${inputCls} w-44 py-1`}
                            value={projectEdits[project.id] ?? project.name}
                            onChange={(e) => setProjectEdits((prev) => ({ ...prev, [project.id]: e.target.value }))}
                          />
                          <button className={secondaryButtonCls} onClick={() => void saveProject(project.id)} disabled={saving}>Save</button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
                      {(project.teams || []).map((team: any) => (
                        <div key={team.id} className="rounded-lg border border-white/10 bg-midnight/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-medium text-cyan">{team.label} Team</div>
                            {canManage && (
                              <div className="flex gap-2">
                                <input
                                  className={`${inputCls} w-48 py-1`}
                                  value={teamEdits[team.id] ?? team.name}
                                  onChange={(e) => setTeamEdits((prev) => ({ ...prev, [team.id]: e.target.value }))}
                                />
                                <button className={secondaryButtonCls} onClick={() => void saveTeam(team.id)} disabled={saving}>Rename</button>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-slate-400">
                            Team Lead: {team.leader?.member?.name || <span className="text-amber-300">Not assigned</span>}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(team.members || []).length === 0 && <span className="text-xs text-slate-500">No developers assigned</span>}
                            {(team.members || []).map((member: any) => (
                              <span key={member.id} className={`rounded-full border px-2 py-1 text-xs ${member.isValid ? "border-white/10 bg-white/5 text-slate-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
                                {member.member?.name} · {member.member?.memberId}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {!!project.unassigned?.length && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                          <div className="font-medium">Unassigned or invalid members</div>
                          <div className="mt-1">
                            {project.unassigned.map((a: any) => `${a.member?.name || "Unknown"} (${a.issues?.join(", ") || "No team"})`).join(" · ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {canManage && (
            <GlassCard hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <Users size={17} className="text-cyan" />
                <h2 className="text-lg font-semibold text-white">Registered Members</h2>
              </div>
              {members.length === 0 ? (
                <EmptyState title="No registered members" description="Register members using the form to build the hierarchy." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400">
                      <tr className="border-b border-white/10">
                        <th className="py-2 pr-3">Member ID</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Designation</th>
                        <th className="py-2 pr-3">Project / Team</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Joined</th>
                        <th className="py-2 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((row: any, idx: number) => (
                        <tr key={row.member?.id || idx} className="border-b border-white/5 text-slate-300">
                          <td className="py-2 pr-3 font-mono text-xs">{row.member?.memberId || "—"}</td>
                          <td className="py-2 pr-3">{row.member?.name}<div className="text-xs text-slate-500">{row.member?.email}</div></td>
                          <td className="py-2 pr-3">{row.designation?.name || "—"}</td>
                          <td className="py-2 pr-3">{row.project?.name || "—"} / {row.team?.label || "—"}</td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${row.isValid ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                              {row.member?.accountStatus || "ACTIVE"}
                            </span>
                            {!row.isValid && <div className="mt-1 text-[11px] text-amber-300">{row.issues?.[0]}</div>}
                          </td>
                          <td className="py-2 pr-3">{formatDate(row.member?.joiningDate)}</td>
                          <td className="py-2 pr-3">
                            <div className="flex flex-wrap gap-2">
                              <button className={secondaryButtonCls} onClick={() => editMember(row)}><Pencil size={13} /> Edit</button>
                              <button
                                className={secondaryButtonCls}
                                onClick={() => void runAction(
                                  () => organizationApi.setMemberStatus(row.member.id, row.member.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
                                  "Member status updated.",
                                )}
                                disabled={saving}
                              >
                                {row.member.accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                className={secondaryButtonCls}
                                onClick={() => void runAction(() => organizationApi.removeFromTeam(row.member.id), "Member removed from team.")}
                                disabled={saving}
                              >
                                <UserMinus size={13} /> Unassign
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

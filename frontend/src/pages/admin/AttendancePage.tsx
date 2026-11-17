import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatCard } from "../../components/ui/StatCard";
import { attendanceApi } from "../../features/attendance/api";
import { membersApi } from "../../features/members/api";
import { teamsApi } from "../../features/teams/api";
import { Camera, CameraOff, RefreshCcw, CircleDot, CheckCircle2, AlertTriangle, Users, UserCheck, UserX, Clock3, Percent, Search, Download, Eye } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cls = status === "PRESENT" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : status === "LATE" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : status === "EXCUSED" ? "bg-sky-500/15 text-sky-300 border-sky-500/30" : "bg-rose-500/15 text-rose-300 border-rose-500/30";
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{status}</span>;
}

function SecurePhoto({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let obj: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(attendanceApi.photoUrl(id), { credentials: "include" });
        if (!res.ok) throw new Error("fail");
        const blob = await res.blob();
        if (cancelled) return;
        obj = URL.createObjectURL(blob);
        setUrl(obj);
      } catch { if (!cancelled) setErr(true); }
    })();
    return () => { cancelled = true; if (obj) URL.revokeObjectURL(obj); };
  }, [id]);
  if (err) return <span className="text-slate-500 text-xs">Unavailable</span>;
  if (!url) return <span className="text-slate-500 text-xs">Loading…</span>;
  return <img src={url} alt="Attendance proof" className="w-12 h-12 object-cover rounded-lg border border-white/10" />;
}

export function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [permission, setPermission] = useState<string>("unknown");
  const [camError, setCamError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [captured, setCaptured] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [status, setStatus] = useState("PRESENT");
  const [sessionName, setSessionName] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [filters, setFilters] = useState({ q: "", date: "", teamId: "", status: "" });
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const selectedMember = useMemo(() => members.find((m) => m.id === selectedMemberId), [members, selectedMemberId]);
  const filteredMembers = useMemo(() => {
    const q = memberQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter((m) => (m.user?.name || "").toLowerCase().includes(q) || (m.user?.email || "").toLowerCase().includes(q) || (m.id || "").toLowerCase().includes(q));
  }, [members, memberQuery]);

  const loadCore = async () => {
    try {
      const [s, r, m, t] = await Promise.all([
        attendanceApi.stats().catch(() => ({ data: null })),
        attendanceApi.list({ limit: 100 }),
        membersApi.list({ limit: 500 }).catch(() => ({ data: { items: [] } })),
        teamsApi.list({ limit: 200 }).catch(() => ({ data: { items: [] } })),
      ]);
      setStats(s.data || null);
      setRecords(r.data?.items || r.data || []);
      const mitems = m.data?.items || m.data || [];
      setMembers(mitems);
      setTeams(t.data?.items || t.data || []);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Failed to load attendance data" });
    }
  };
  useEffect(() => { loadCore(); }, []);

  useEffect(() => {
    return () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
  }, []);

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (!deviceId && cams[0]) setDeviceId(cams[0].deviceId);
    } catch {}
  };

  const startCamera = async (nextDeviceId?: string) => {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) { setCamError("Camera not supported on this device/browser."); setPermission("unsupported"); return; }
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      const constraints: MediaStreamConstraints = { video: nextDeviceId || deviceId ? { deviceId: { exact: nextDeviceId || deviceId } } : { facingMode: "user" }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(()=>{}); }
      setCameraOn(true); setPermission("granted");
      await refreshDevices();
    } catch (e: any) {
      setCameraOn(false);
      const name = e?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") { setPermission("denied"); setCamError("Camera permission denied. Please allow camera access in browser settings."); }
      else if (name === "NotFoundError" || name === "DevicesNotFoundError") { setPermission("no-device"); setCamError("No camera device found."); }
      else setCamError(e?.message || "Failed to start camera.");
    }
  };
  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };
  const switchCamera = async () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex(d => d.deviceId === deviceId);
    const next = devices[(idx + 1) % devices.length];
    setDeviceId(next.deviceId);
    if (cameraOn) await startCamera(next.deviceId);
  };
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const w = v.videoWidth || 640, h = v.videoHeight || 480;
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    c.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setCaptured(URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  };
  useEffect(() => () => { if (captured) URL.revokeObjectURL(captured); }, [captured]);

  const resetCapture = () => {
    if (captured) URL.revokeObjectURL(captured);
    setCaptured(null); setCapturedBlob(null);
  };

  const confirmAttendance = async () => {
    setMsg(null);
    if (!selectedMemberId) { setMsg({ type: "error", text: "Select or identify a member before confirming." }); return; }
    if (!capturedBlob) { setMsg({ type: "error", text: "Capture an attendance photo before confirming." }); return; }
    setConfirming(true);
    try {
      const fd = new FormData();
      fd.append("memberId", selectedMemberId);
      fd.append("status", status);
      fd.append("confirm", "true");
      if (sessionName) fd.append("sessionName", sessionName);
      if (notes) fd.append("notes", notes);
      fd.append("photo", capturedBlob, `attendance-${Date.now()}.jpg`);
      await attendanceApi.capture(fd);
      setMsg({ type: "success", text: "Attendance recorded successfully." });
      resetCapture();
      setNotes("");
      await loadCore();
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Failed to record attendance" });
    } finally {
      setConfirming(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const q = filters.q.toLowerCase().trim();
    return records.filter((r) => {
      const name = r.member?.user?.name || "";
      const email = r.member?.user?.email || "";
      const mid = r.memberId || "";
      const dateStr = r.date ? new Date(r.date).toISOString().slice(0, 10) : "";
      if (q && !(name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || mid.toLowerCase().includes(q))) return false;
      if (filters.date && dateStr !== filters.date) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.teamId) {
        const links = r.member?.teamLinks || [];
        if (!links.some((l: any) => l.teamId === filters.teamId || l.team?.id === filters.teamId)) return false;
      }
      return true;
    });
  }, [records, filters]);

  const exportCsv = () => {
    // include filters in export
    const p: any = {};
    if (filters.date) p.date = filters.date;
    window.open(attendanceApi.exportCsvUrl(p), "_blank");
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40";
  const today = new Date().toLocaleString();
  const camStatus = !navigator.mediaDevices ? "unsupported" : cameraOn ? "active" : permission === "denied" ? "denied" : "idle";

  return (
    <AppLayout>
      <PageHeader title="Attendance Management" subtitle="Camera-based attendance capture with secure, confirmed records." />
      {msg && <div className={`mb-4 rounded-xl px-4 py-2 border ${msg.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>{msg.text}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Members" value={stats?.totalMembers ?? 0} icon={<Users size={20} />} accent="from-accent to-violet" />
        <StatCard title="Present Today" value={stats?.presentToday ?? 0} icon={<UserCheck size={20} />} accent="from-emerald-500 to-cyan" />
        <StatCard title="Absent Today" value={stats?.absentToday ?? 0} icon={<UserX size={20} />} accent="from-rose-500 to-orange-500" />
        <StatCard title="Late Arrivals" value={stats?.lateArrivals ?? 0} icon={<Clock3 size={20} />} accent="from-amber-500 to-orange-500" />
        <StatCard title="Attendance %" value={stats?.attendancePercentage ?? 0} icon={<Percent size={20} />} accent="from-violet to-accent" subtitle="today" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2"><Camera size={18} className="text-cyan" /> Camera Capture</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full border ${camStatus === "active" ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10" : camStatus === "denied" ? "border-rose-500/30 text-rose-300 bg-rose-500/10" : "border-white/10 text-slate-400 bg-white/5"}`}>Camera: {camStatus}</span>
              <span className="px-2 py-0.5 rounded-full border border-white/10 text-slate-400 bg-white/5">Permission: {permission}</span>
            </div>
          </div>
          {camError && <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5" />{camError}</div>}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
            <video ref={videoRef} className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`} playsInline muted autoPlay />
            {!cameraOn && !captured && <div className="text-center text-slate-400 p-6"><CameraOff size={32} className="mx-auto mb-2 opacity-60" /><p>Camera is off. Start camera to capture attendance.</p><p className="text-xs mt-1">Camera activates only with your permission.</p></div>}
            {captured && <img src={captured} alt="Captured preview" className="absolute inset-0 w-full h-full object-cover" />}
            {captured && <div className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded-lg border border-white/10">Preview (not saved until confirmed)</div>}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex flex-wrap gap-2">
            {!cameraOn ? <button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon flex items-center gap-2" onClick={() => startCamera()}><Camera size={16}/>Start Camera</button>
              : <button className="glass border border-white/10 text-slate-200 px-4 py-2 rounded-xl flex items-center gap-2" onClick={stopCamera}><CameraOff size={16}/>Stop Camera</button>}
            <button className="glass border border-white/10 text-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-40" onClick={switchCamera} disabled={!cameraOn || devices.length < 2}><RefreshCcw size={16}/>Switch Camera</button>
            <button className="glass border border-cyan/30 text-cyan px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-40" onClick={capturePhoto} disabled={!cameraOn}><CircleDot size={16}/>Capture Photo</button>
            {captured && <button className="text-slate-300 hover:text-white text-sm px-2" onClick={resetCapture}>Retake</button>}
          </div>
          <p className="text-xs text-slate-500">No automatic marking. Select a member, capture a photo, and explicitly confirm to create a record. Stream stops when you leave this page.</p>
        </GlassCard>

        <GlassCard className="space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><CheckCircle2 size={18} className="text-cyan" /> Member Identification & Confirmation</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-300">Find member</label>
              <input className={`${inputCls} w-full mt-1`} placeholder="Search by name, email, or ID" value={memberQuery} onChange={e=>setMemberQuery(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-300">Member (required)</label>
              <select className={`${inputCls} w-full mt-1`} value={selectedMemberId} onChange={e=>setSelectedMemberId(e.target.value)}>
                <option value="">Select member…</option>
                {filteredMembers.map((m:any)=>(<option key={m.id} value={m.id}>{m.user?.name || m.id} — {m.user?.email || "no email"}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300">Attendance status</label>
              <select className={`${inputCls} w-full mt-1`} value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300">Session (optional)</label>
              <input className={`${inputCls} w-full mt-1`} placeholder="e.g. Lab Session" value={sessionName} onChange={e=>setSessionName(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-300">Notes (optional)</label>
              <input className={`${inputCls} w-full mt-1`} placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1 text-sm">
            <div className="text-slate-400">Selected member details</div>
            {selectedMember ? (<>
              <div className="text-white font-medium">{selectedMember.user?.name || "—"}</div>
              <div className="text-slate-300">Member ID: <span className="text-cyan">{selectedMember.id}</span></div>
              <div className="text-slate-300">Email: {selectedMember.user?.email || "—"}</div>
              <div className="text-slate-300">Teams: {(selectedMember.teamLinks||[]).map((l:any)=>l.team?.name).filter(Boolean).join(", ") || "—"}</div>
            </>) : <div className="text-slate-500">No member selected.</div>}
            <div className="text-slate-400 pt-1">Date & time: <span className="text-slate-200">{today}</span></div>
            <div className="text-slate-400">Capture: <span className={capturedBlob?"text-emerald-300":"text-amber-300"}>{capturedBlob?"Photo ready":"No photo captured"}</span></div>
          </div>
          <button className="w-full bg-gradient-to-r from-emerald-500 to-cyan text-white rounded-xl px-4 py-2.5 font-medium shadow-neon disabled:opacity-50 flex items-center justify-center gap-2" onClick={confirmAttendance} disabled={confirming}>
            {confirming ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />} {confirming ? "Saving..." : "Confirm & Save Attendance"}
          </button>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="font-semibold text-white">Attendance Records</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2"><Search size={14} className="text-slate-400"/><input className="bg-transparent outline-none text-sm text-slate-200 w-40" placeholder="Search member..." value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))} /></div>
            <input type="date" className={inputCls} value={filters.date} onChange={e=>setFilters(f=>({...f,date:e.target.value}))} />
            <select className={inputCls} value={filters.teamId} onChange={e=>setFilters(f=>({...f,teamId:e.target.value}))}><option value="">All teams</option>{teams.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <select className={inputCls} value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}><option value="">All statuses</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></select>
            <button className="glass border border-white/10 text-slate-200 px-3 py-2 rounded-xl flex items-center gap-2 hover:text-white" onClick={exportCsv}><Download size={16}/>Export</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead><tr className="text-left text-slate-400 border-b border-white/10">
              <th className="py-2 pr-2">Member</th><th className="py-2 pr-2">Member ID</th><th className="py-2 pr-2">Profile</th><th className="py-2 pr-2">Date</th><th className="py-2 pr-2">Check-in</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Captured Photo</th><th className="py-2 pr-2">Marked By</th><th className="py-2">Action</th>
            </tr></thead>
            <tbody>
              {filteredRecords.map((r:any)=>(
                <tr key={r.id} className="border-b border-white/5 text-slate-200 align-middle">
                  <td className="py-2 pr-2"><div className="font-medium text-white">{r.member?.user?.name || "—"}</div><div className="text-xs text-slate-400">{r.member?.user?.email || ""}</div></td>
                  <td className="py-2 pr-2 text-xs text-slate-300">{r.memberId}</td>
                  <td className="py-2 pr-2"><div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-violet flex items-center justify-center text-white text-xs font-semibold">{(r.member?.user?.name||"?").charAt(0).toUpperCase()}</div></td>
                  <td className="py-2 pr-2">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                  <td className="py-2 pr-2">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}</td>
                  <td className="py-2 pr-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2 pr-2">{r.photoPath ? <SecurePhoto id={r.id} /> : <span className="text-slate-500">—</span>}</td>
                  <td className="py-2 pr-2">{r.markedBy?.name || r.markedBy?.email || "—"}</td>
                  <td className="py-2"><button className="text-cyan hover:underline inline-flex items-center gap-1" onClick={()=>setSelectedRecord(r)}><Eye size={14}/>View</button></td>
                </tr>
              ))}
              {filteredRecords.length===0 && <tr><td colSpan={9} className="py-6 text-slate-400">No attendance records match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setSelectedRecord(null)}>
          <div className="glass-strong border border-white/10 rounded-2xl p-5 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-white font-semibold">Attendance Details</h3><button className="text-slate-400 hover:text-white" onClick={()=>setSelectedRecord(null)}>✕</button></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">Member</div><div className="text-slate-200">{selectedRecord.member?.user?.name || "—"}</div>
              <div className="text-slate-400">Member ID</div><div className="text-slate-200 text-xs">{selectedRecord.memberId}</div>
              <div className="text-slate-400">Date</div><div className="text-slate-200">{selectedRecord.date ? new Date(selectedRecord.date).toLocaleString() : "—"}</div>
              <div className="text-slate-400">Status</div><div><StatusBadge status={selectedRecord.status} /></div>
              <div className="text-slate-400">Check-in</div><div className="text-slate-200">{selectedRecord.checkIn ? new Date(selectedRecord.checkIn).toLocaleTimeString() : "—"}</div>
              <div className="text-slate-400">Check-out</div><div className="text-slate-200">{selectedRecord.checkOut ? new Date(selectedRecord.checkOut).toLocaleTimeString() : "—"}</div>
              <div className="text-slate-400">Session</div><div className="text-slate-200">{selectedRecord.sessionName || "General"}</div>
              <div className="text-slate-400">Marked By</div><div className="text-slate-200">{selectedRecord.markedBy?.name || selectedRecord.markedBy?.email || "—"}</div>
              <div className="text-slate-400">Notes</div><div className="text-slate-200">{selectedRecord.notes || "—"}</div>
            </div>
            {selectedRecord.photoPath && <div className="mt-3"><div className="text-slate-400 text-sm mb-1">Captured Photo</div><SecurePhoto id={selectedRecord.id} /></div>}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

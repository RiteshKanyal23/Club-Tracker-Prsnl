import { useEffect, useRef, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { communicationApi } from "../../features/communication/api";
import { socket } from "../../services/socketClient";
import { useAuthStore } from "../../store/auth.store";
import { apiOrigin } from "../../config/api";

export function CommunicationPage() {
  const user = useAuthStore((s) => s.user);
  const [channels, setChannels] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("GENERAL");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40";

  const loadChannels = async () => { const r = await communicationApi.channels(); setChannels(r.data || []); };
  const loadMessages = async (id: string) => { const r = await communicationApi.messages(id); setMessages(r.data || []); await communicationApi.markRead(id); loadChannels(); };

  useEffect(() => { loadChannels(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const onMsg = (msg: any) => { if (active && msg.channelId === active.id) setMessages((p) => [...p, msg]); loadChannels(); };
    const onTyping = (d: any) => {
      if (active && d.channelId === active.id && d.userId !== user?.id) {
        setTypingUsers((p) => Array.from(new Set([...p, d.name || d.userId])));
        setTimeout(() => setTypingUsers((p) => p.filter((n) => n !== (d.name || d.userId))), 2000);
      }
    };
    socket.on("message:new", onMsg); socket.on("typing", onTyping);
    return () => { socket.off("message:new", onMsg); socket.off("typing", onTyping); };
  }, [active?.id, user?.id]);

  const select = async (ch: any) => {
    if (active?.id) socket.emit("leave:channel", active.id);
    setActive(ch); socket.emit("join:channel", ch.id); await loadMessages(ch.id);
  };

  const baseUrl = apiOrigin();

  return <AppLayout>
    <PageHeader title="Team Chat" subtitle="Collaborate in channels, share files, and stay connected in real time." />
    <div className="grid lg:grid-cols-3 gap-4">
      <GlassCard className="space-y-4 h-fit">
        <div className="font-semibold text-white">Channels</div>
        <div className="space-y-2 max-h-72 overflow-auto pr-1">{channels.map((c)=> (
          <button key={c.id} className={`w-full text-left border rounded-xl px-3 py-2 transition ${active?.id===c.id?"bg-accent/20 border-accent/40 text-white":"bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`} onClick={()=>select(c)}>
            <div className="flex justify-between items-center gap-2"><span className="font-medium">{c.name}</span>{c.unread>0 && <span className="text-xs bg-gradient-to-r from-accent to-violet text-white rounded-full px-2 py-0.5">{c.unread}</span>}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.type}</div>
          </button>
        ))}{channels.length===0 && <div className="text-slate-400 text-sm">No channels yet.</div>}</div>
        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="font-medium text-sm text-white">New Channel</div>
          <input className={`${inputCls} w-full`} placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} />
          <select className={`${inputCls} w-full`} value={newType} onChange={e=>setNewType(e.target.value)}><option value="GENERAL" className="bg-deep">GENERAL</option><option value="TEAM" className="bg-deep">TEAM</option><option value="PROJECT" className="bg-deep">PROJECT</option></select>
          <button className="bg-gradient-to-r from-accent to-violet text-white px-3 py-2 rounded-xl w-full shadow-neon" onClick={async()=>{ if(!newName) return; await communicationApi.createChannel({name:newName,type:newType}); setNewName(""); loadChannels(); }}>Create</button>
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-2 flex flex-col h-[560px]" hover={false}>
        {!active ? <div className="text-slate-400 m-auto">Select or create a channel</div> : <>
          <div className="font-semibold text-white mb-2 border-b border-white/10 pb-2 flex items-center gap-2 flex-wrap">{active.name} <span className="text-sm text-slate-400">({active.type})</span> <button className="text-xs text-cyan hover:underline ml-1" onClick={()=>communicationApi.join(active.id).then(loadChannels)}>Join</button></div>
          <div className="flex-1 overflow-auto space-y-3 pr-1">
            {messages.map((m:any)=> (
              <div key={m.id} className={`max-w-[85%] p-3 rounded-2xl border ${m.senderId===user?.id?"ml-auto bg-accent/20 border-accent/30":"bg-white/5 border-white/10"}`}>
                <div className="text-xs text-slate-400 mb-1">{m.sender?.name || m.senderId} · {new Date(m.createdAt).toLocaleString()}</div>
                <div className="whitespace-pre-wrap text-slate-100">{m.content}</div>
                {m.filePath && <a className="text-xs text-cyan hover:underline mt-1 inline-block" href={`${baseUrl}/uploads/${m.filePath}`} target="_blank" rel="noreferrer">📎 {m.fileName || "file"}</a>}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {typingUsers.length>0 && <div className="text-xs text-slate-400 mt-1">{typingUsers.join(", ")} typing...</div>}
          <div className="mt-3 flex gap-2 items-center flex-wrap">
            <input className={`${inputCls} flex-1 min-w-[180px]`} placeholder="Type a message..." value={text} onChange={e=>{ setText(e.target.value); socket.emit("typing", { channelId: active.id, userId: user?.id, name: user?.name }); }} onKeyDown={async(e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); if(!text.trim() && !file) return; await communicationApi.sendMessage(active.id,{content:text,file}); setText(""); setFile(null); } }} />
            <input type="file" className="text-xs text-slate-400 w-40 file:mr-2 file:py-1.5 file:px-2 file:rounded-lg file:border-0 file:bg-white/10 file:text-slate-200" onChange={e=>setFile(e.target.files?.[0]||null)} />
            <button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon" onClick={async()=>{ if(!text.trim() && !file) return; await communicationApi.sendMessage(active.id,{content:text,file}); setText(""); setFile(null); }}>Send</button>
          </div>
        </>}
      </GlassCard>
    </div>
  </AppLayout>;
}

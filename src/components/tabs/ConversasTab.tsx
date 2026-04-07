import React, { useState, useEffect, useRef } from "react";
import { Client, Lead, Message } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props { client: Client }

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const ConversasTab: React.FC<Props> = ({ client }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingLeads(true);
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      setLeads(data ?? []);
      if (data && data.length > 0) setSelectedLeadId(data[0].id);
      setLoadingLeads(false);
    };
    load();
  }, [client.id]);

  useEffect(() => {
    if (!selectedLeadId) { setMessages([]); return; }
    const load = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", selectedLeadId)
        .order("created_at");
      setMessages(data ?? []);
      setLoadingMessages(false);
    };
    load();
  }, [selectedLeadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const enviar = async () => {
    if (!newMessage.trim() || !selectedLeadId) return;
    setSending(true);
    const payload = {
      lead_id: selectedLeadId,
      client_id: client.id,
      content: newMessage.trim(),
      sender: "sdr",
      is_ai: false,
    };
    const { data, error } = await supabase.from("messages").insert(payload).select().single();
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
    } else {
      setMessages(prev => [...prev, data]);
      setNewMessage("");
    }
    setSending(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Seletor de lead */}
      <div>
        <label className="text-sm text-muted-foreground font-body mb-1.5 block">Selecionar Lead</label>
        {loadingLeads ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-body">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">Nenhum lead cadastrado ainda.</p>
        ) : (
          <select
            value={selectedLeadId}
            onChange={e => setSelectedLeadId(e.target.value)}
            className="w-full max-w-md h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
          >
            {leads.map(l => (
              <option key={l.id} value={l.id}>{l.nome} — {l.empresa}</option>
            ))}
          </select>
        )}
      </div>

      {/* Janela de chat estilo WhatsApp */}
      {selectedLeadId && (
        <div className="rounded-xl overflow-hidden border border-border shadow-card flex flex-col" style={{ height: "600px" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#1f2c34" }}>
            <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm font-body">
                {selectedLead?.nome?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm font-body">{selectedLead?.nome}</p>
              <p className="text-[#8696a0] text-xs font-body">{selectedLead?.empresa} · {selectedLead?.cargo}</p>
            </div>
          </div>

          {/* Área de mensagens */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{
              backgroundColor: "#0b141a",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="px-4 py-2 rounded-lg text-xs font-body" style={{ backgroundColor: "#182229", color: "#8696a0" }}>
                  Nenhuma mensagem ainda
                </div>
              </div>
            ) : (
              messages.map(msg => {
                const isSdr = msg.sender === "sdr";
                return (
                  <div key={msg.id} className={`flex ${isSdr ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[70%] rounded-lg px-3 py-2 relative"
                      style={{
                        backgroundColor: isSdr ? "#005c4b" : "#1f2c34",
                        borderRadius: isSdr ? "8px 0px 8px 8px" : "0px 8px 8px 8px",
                      }}
                    >
                      <p className="text-sm font-body" style={{ color: "#e9edef" }}>{msg.content}</p>
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        <span className="text-[10px]" style={{ color: "#8696a0" }}>{formatTime(msg.created_at)}</span>
                        {isSdr && (
                          <span
                            className="text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5"
                            style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "#8696a0" }}
                          >
                            {msg.is_ai
                              ? <><Bot className="h-2.5 w-2.5 inline" /> IA</>
                              : <><User className="h-2.5 w-2.5 inline" /> Manual</>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input de mensagem */}
          <div className="px-3 py-3 flex items-center gap-2" style={{ backgroundColor: "#1f2c34" }}>
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Digite uma mensagem..."
              className="flex-1 rounded-full border-none font-body text-sm"
              style={{ backgroundColor: "#2a3942", color: "#e9edef" }}
              disabled={sending}
            />
            <button
              onClick={enviar}
              disabled={sending || !newMessage.trim()}
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#00a884" }}
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

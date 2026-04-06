import React, { useState } from "react";
import { Client, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Send, Bot, User } from "lucide-react";

interface Props { client: Client }

const mockMessages: Message[] = [
  { id: "1", lead_id: "1", client_id: "1", content: "Olá Carlos! Vi que a Empresa ABC atua no segmento de tecnologia. Gostaria de compartilhar como podemos ajudar vocês a aumentar as vendas.", sender: "sdr", is_ai: true, created_at: "2024-01-15T10:00:00" },
  { id: "2", lead_id: "1", client_id: "1", content: "Oi! Pode me contar mais sobre o serviço?", sender: "lead", is_ai: false, created_at: "2024-01-15T10:15:00" },
  { id: "3", lead_id: "1", client_id: "1", content: "Claro! Nosso serviço de SDR com IA automatiza a prospecção e qualificação de leads, aumentando em média 3x a taxa de agendamento de reuniões.", sender: "sdr", is_ai: true, created_at: "2024-01-15T10:18:00" },
  { id: "4", lead_id: "1", client_id: "1", content: "Interessante. Qual o investimento?", sender: "lead", is_ai: false, created_at: "2024-01-15T10:25:00" },
];

const mockLeadOptions = [
  { id: "1", nome: "Carlos Silva - Empresa ABC" },
  { id: "2", nome: "Ana Martins - Tech Corp" },
  { id: "3", nome: "Julia Ferreira - Big Corp" },
];

export const ConversasTab: React.FC<Props> = ({ client }) => {
  const [selectedLead, setSelectedLead] = useState("1");
  const [messages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sendAsSdr, setSendAsSdr] = useState(true);

  const formatTime = (date: string) => new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="text-sm text-muted-foreground font-body mb-1.5 block">Selecionar Lead</label>
        <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)} className="w-full max-w-md h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm">
          {mockLeadOptions.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border flex flex-col" style={{ height: "500px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={cn("flex", msg.sender === "sdr" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[70%] rounded-lg p-3", msg.sender === "sdr" ? "bg-surface-secondary" : "bg-card border border-border")}>
                <p className="text-sm text-foreground font-body">{msg.content}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                  {msg.sender === "sdr" && (
                    <span className={cn("text-xs px-1.5 py-0.5 rounded", msg.is_ai ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground")}>
                      {msg.is_ai ? <><Bot className="h-3 w-3 inline mr-0.5" />IA</> : <><User className="h-3 w-3 inline mr-0.5" />Manual</>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Switch checked={sendAsSdr} onCheckedChange={setSendAsSdr} />
            <span className="text-sm text-foreground font-body">{sendAsSdr ? "Enviar como SDR" : "Enviar como você"}</span>
          </div>
          <div className="flex gap-2">
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 bg-secondary border-input"
              onKeyDown={e => { if (e.key === "Enter" && newMessage.trim()) { e.preventDefault(); setNewMessage(""); }}} />
            <Button onClick={() => { if (newMessage.trim()) setNewMessage(""); }} className="font-body gap-2">
              <Send className="h-4 w-4" /> Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

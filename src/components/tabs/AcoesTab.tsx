import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props { client: Client }

export const AcoesTab: React.FC<Props> = ({ client }) => {
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [whatsappNum, setWhatsappNum] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [emailDest, setEmailDest] = useState("");
  const [createCalendar, setCreateCalendar] = useState(false);
  const [registrarMotivo, setRegistrarMotivo] = useState(true);
  const [nutricaoFutura, setNutricaoFutura] = useState(false);
  const [notifReuniao, setNotifReuniao] = useState(true);
  const [confirmLead, setConfirmLead] = useState(true);
  const [notifEncerrada, setNotifEncerrada] = useState(true);
  const [coldEmail, setColdEmail] = useState(false);
  const [crm, setCrm] = useState("nenhum");
  const [accessToken, setAccessToken] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [pipelineId, setPipelineId] = useState("");

  const crmMappings = [
    { resultado: "lead_qualificado", label: "Lead Qualificado" },
    { resultado: "lead_desqualificado", label: "Lead Desqualificado" },
    { resultado: "reuniao_agendada", label: "Reunião Agendada" },
    { resultado: "sem_resposta", label: "Sem Resposta" },
    { resultado: "perdido", label: "Perdido" },
  ];

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card rounded-lg p-6 shadow-card border border-border">
      <h4 className="font-heading text-base font-semibold text-foreground mb-4">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }> = ({ label, checked, onChange, children }) => (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground font-body">{label}</span>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {checked && children && <div className="mt-2">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Section title="Quando lead QUALIFICADO">
        <ToggleRow label="Notificar no WhatsApp" checked={notifWhatsapp} onChange={setNotifWhatsapp}>
          <Input value={whatsappNum} onChange={e => setWhatsappNum(e.target.value)} placeholder="Número WhatsApp" className="bg-secondary border-input" />
        </ToggleRow>
        <ToggleRow label="Enviar resumo por email" checked={notifEmail} onChange={setNotifEmail}>
          <Input value={emailDest} onChange={e => setEmailDest(e.target.value)} placeholder="email@exemplo.com" className="bg-secondary border-input" />
        </ToggleRow>
        <ToggleRow label="Criar evento Google Calendar" checked={createCalendar} onChange={setCreateCalendar} />
      </Section>

      <Section title="Quando lead DESQUALIFICADO">
        <ToggleRow label="Registrar motivo" checked={registrarMotivo} onChange={setRegistrarMotivo} />
        <ToggleRow label="Adicionar em nutrição futura" checked={nutricaoFutura} onChange={setNutricaoFutura} />
      </Section>

      <Section title="Quando REUNIÃO AGENDADA">
        <ToggleRow label="Notificar imediatamente" checked={notifReuniao} onChange={setNotifReuniao} />
        <ToggleRow label="Confirmação para o lead" checked={confirmLead} onChange={setConfirmLead} />
      </Section>

      <Section title="Quando CADÊNCIA ENCERRADA SEM RESPOSTA">
        <ToggleRow label="Notificar" checked={notifEncerrada} onChange={setNotifEncerrada} />
        <ToggleRow label="Mover para cold email" checked={coldEmail} onChange={setColdEmail} />
      </Section>

      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h4 className="font-heading text-base font-semibold text-foreground mb-4">Integração CRM</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">CRM</label>
            <select value={crm} onChange={e => setCrm(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm">
              <option value="nenhum">Nenhum</option><option value="rdstation">RD Station</option><option value="kommo">Kommo</option><option value="pipedrive">Pipedrive</option><option value="hubspot">HubSpot</option>
            </select>
          </div>
          {crm !== "nenhum" && (
            <>
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Access Token</label>
                <Input value={accessToken} onChange={e => setAccessToken(e.target.value)} type="password" className="bg-secondary border-input" />
              </div>
              {crm === "kommo" && (
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-1 block">Subdomain</label>
                  <Input value={subdomain} onChange={e => setSubdomain(e.target.value)} className="bg-secondary border-input" />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Pipeline ID</label>
                <Input value={pipelineId} onChange={e => setPipelineId(e.target.value)} className="bg-secondary border-input" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Mapeamento de Resultados</label>
                <div className="space-y-2">
                  {crmMappings.map(m => (
                    <div key={m.resultado} className="flex items-center gap-3">
                      <span className="w-40 text-sm text-foreground font-body">{m.label}</span>
                      <span className="text-muted-foreground">→</span>
                      <Input placeholder="Etapa no CRM" className="bg-secondary border-input flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Button onClick={() => toast.success("Ações salvas!")} className="font-body">Salvar Ações</Button>
    </div>
  );
};

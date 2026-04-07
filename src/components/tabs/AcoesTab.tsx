import React, { useState, useEffect } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props { client: Client }

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

export const AcoesTab: React.FC<Props> = ({ client }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [crmMap, setCrmMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("client_actions")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (data) {
        setNotifWhatsapp(data.notif_whatsapp ?? true);
        setWhatsappNum(data.notif_whatsapp_numero ?? "");
        setNotifEmail(data.notif_email ?? true);
        setEmailDest(data.notif_email_destino ?? "");
        setCreateCalendar(data.criar_calendar ?? false);
        setRegistrarMotivo(data.registrar_motivo ?? true);
        setNutricaoFutura(data.nutricao_futura ?? false);
        setNotifReuniao(data.notif_reuniao ?? true);
        setConfirmLead(data.confirmar_lead ?? true);
        setNotifEncerrada(data.notif_encerrada ?? true);
        setColdEmail(data.cold_email ?? false);
        setCrm(data.crm ?? "nenhum");
        setAccessToken(data.crm_access_token ?? "");
        setSubdomain(data.crm_subdomain ?? "");
        setPipelineId(data.crm_pipeline_id ?? "");
        setCrmMap(data.crm_mapeamento ?? {});
      }
      setLoading(false);
    };
    load();
  }, [client.id]);

  const salvar = async () => {
    setSaving(true);
    const payload = {
      client_id: client.id,
      notif_whatsapp: notifWhatsapp,
      notif_whatsapp_numero: whatsappNum,
      notif_email: notifEmail,
      notif_email_destino: emailDest,
      criar_calendar: createCalendar,
      registrar_motivo: registrarMotivo,
      nutricao_futura: nutricaoFutura,
      notif_reuniao: notifReuniao,
      confirmar_lead: confirmLead,
      notif_encerrada: notifEncerrada,
      cold_email: coldEmail,
      crm,
      crm_access_token: accessToken,
      crm_subdomain: subdomain,
      crm_pipeline_id: pipelineId,
      crm_mapeamento: crmMap,
    };

    const { error } = await supabase.from("client_actions").upsert(payload, { onConflict: "client_id" });

    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Ações salvas!");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Section title="Quando lead QUALIFICADO">
        <ToggleRow label="Notificar no WhatsApp" checked={notifWhatsapp} onChange={setNotifWhatsapp}>
          <Input value={whatsappNum} onChange={e => setWhatsappNum(e.target.value)} placeholder="Número WhatsApp (ex: 5511999999999)" className="bg-secondary border-input" />
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
              <option value="nenhum">Nenhum</option>
              <option value="rdstation">RD Station</option>
              <option value="kommo">Kommo</option>
              <option value="pipedrive">Pipedrive</option>
              <option value="hubspot">HubSpot</option>
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
                      <span className="w-40 text-sm text-foreground font-body shrink-0">{m.label}</span>
                      <span className="text-muted-foreground">→</span>
                      <Input
                        placeholder="Etapa no CRM"
                        value={crmMap[m.resultado] ?? ""}
                        onChange={e => setCrmMap({ ...crmMap, [m.resultado]: e.target.value })}
                        className="bg-secondary border-input flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Button onClick={salvar} disabled={saving} className="font-body">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Ações"}
      </Button>
    </div>
  );
};

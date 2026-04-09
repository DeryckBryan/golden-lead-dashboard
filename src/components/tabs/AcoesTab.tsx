import React, { useState, useEffect, useRef } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plug, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

interface Props { client: Client }

type ConnectStatus = "idle" | "connecting" | "connected" | "error";
interface CrmOption { id: string; name: string }

// Cada entrada = um momento em que o n8n move o lead no CRM
const crmMappings = [
  { resultado: "tentativa_1", label: "1ª Tentativa de Contato" },
  { resultado: "tentativa_2", label: "2ª Tentativa de Contato" },
  { resultado: "tentativa_3", label: "3ª Tentativa de Contato" },
  { resultado: "em_conversa", label: "Em Conversa (respondeu)" },
  { resultado: "reuniao_agendada", label: "Reunião Agendada" },
  { resultado: "nao_qualificado_ia", label: "Não Qualificado pela IA" },
  { resultado: "sem_resposta_perda", label: "Sem Resposta → Perda" },
];

const maskPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} (${d.slice(2)}`;
  if (d.length <= 9) return `${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4)}`;
  return `${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
};

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

const StageSelect: React.FC<{
  stages: CrmOption[];
  stagesLoading: boolean;
  connected: boolean;
  value: string;
  onChange: (v: string) => void;
}> = ({ stages, stagesLoading, connected, value, onChange }) => {
  if (!connected) {
    return (
      <Input
        placeholder="Conecte ao CRM primeiro"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-secondary border-input flex-1 text-muted-foreground"
        disabled
      />
    );
  }
  if (stagesLoading) {
    return (
      <div className="flex-1 h-10 flex items-center px-3 rounded-lg bg-secondary border border-input">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Carregando etapas...</span>
      </div>
    );
  }
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-1 h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
    >
      <option value="">— Selecionar etapa —</option>
      {stages.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
};

export const AcoesTab: React.FC<Props> = ({ client }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notificações
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

  // CRM
  const [crm, setCrm] = useState("nenhum");
  const [accessToken, setAccessToken] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [crmMap, setCrmMap] = useState<Record<string, string>>({});

  // SDR IA
  const [sdrInstrucoes, setSdrInstrucoes] = useState("");

  // Google Calendar
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleQrUrl, setGoogleQrUrl] = useState<string | null>(null);
  const googlePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CRM dinâmico
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [pipelines, setPipelines] = useState<CrmOption[]>([]);
  const [stages, setStages] = useState<CrmOption[]>([]);
  const [stagesLoading, setStagesLoading] = useState(false);

  const connected = connectStatus === "connected";

  const invokeProxy = async (body: object) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-proxy`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const carregarStages = async (pid: string, crmType = crm, token = accessToken, sub = subdomain) => {
    if (!pid) return;
    setStagesLoading(true);
    try {
      const data = await invokeProxy({ crm: crmType, token, action: "getStages", pipelineId: pid, subdomain: sub });
      if (data?.error) throw new Error(data.error);
      setStages(data.stages ?? []);
    } catch (e: any) {
      toast.error("Erro ao buscar etapas: " + e.message);
    } finally {
      setStagesLoading(false);
    }
  };

  const conectar = async () => {
    if (!accessToken.trim()) { toast.error("Insira o Access Token primeiro"); return; }
    if (crm === "kommo" && !subdomain.trim()) { toast.error("Insira o Subdomain do Kommo"); return; }
    setConnectStatus("connecting");
    setPipelines([]);
    setStages([]);
    try {
      const data = await invokeProxy({ crm, token: accessToken, action: "getPipelines", subdomain });
      if (data?.error) throw new Error(data.error);
      const list: CrmOption[] = data.pipelines ?? [];
      setPipelines(list);
      setConnectStatus("connected");
      toast.success(`Conectado ao CRM — ${list.length} pipeline(s) encontrado(s)`);
      if (pipelineId) await carregarStages(pipelineId);
    } catch (e: any) {
      setConnectStatus("error");
      toast.error("Erro ao conectar: " + e.message);
    }
  };

  const handlePipelineChange = async (pid: string) => {
    setPipelineId(pid);
    setCrmMap({});
    setStages([]);
    if (pid) await carregarStages(pid);
  };

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
        setGoogleConnected(!!data.google_refresh_token);
        setSdrInstrucoes(data.sdr_instrucoes ?? "");

        // Auto-connect silently se já tem token salvo
        if (data.crm && data.crm !== "nenhum" && data.crm_access_token) {
          try {
            const pd = await invokeProxy({ crm: data.crm, token: data.crm_access_token, action: "getPipelines", subdomain: data.crm_subdomain ?? "" });
            if (pd?.pipelines) {
              setPipelines(pd.pipelines);
              setConnectStatus("connected");
              if (data.crm_pipeline_id) {
                const sd = await invokeProxy({ crm: data.crm, token: data.crm_access_token, action: "getStages", pipelineId: data.crm_pipeline_id, subdomain: data.crm_subdomain ?? "" });
                if (sd?.stages) setStages(sd.stages);
              }
            }
          } catch { /* silencioso */ }
        }
      }
      setLoading(false);
    };
    load();
  }, [client.id]);

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => { if (googlePollRef.current) clearInterval(googlePollRef.current); };
  }, []);

  // Reset quando troca de CRM
  useEffect(() => {
    setConnectStatus("idle");
    setPipelines([]);
    setStages([]);
    setPipelineId("");
    setCrmMap({});
  }, [crm]);

  const iniciarGoogleAuth = () => {
    const clientId     = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri  = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-callback`;
    const scope        = "https://www.googleapis.com/auth/calendar";
    const state        = client.id;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(state)}`;

    setGoogleQrUrl(authUrl);

    // Polling: verifica a cada 4s se o token foi salvo
    if (googlePollRef.current) clearInterval(googlePollRef.current);
    googlePollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("client_actions")
        .select("google_refresh_token")
        .eq("client_id", client.id)
        .maybeSingle();

      if (data?.google_refresh_token) {
        clearInterval(googlePollRef.current!);
        setGoogleQrUrl(null);
        setGoogleConnected(true);
        toast.success("Google Calendar conectado com sucesso!");
      }
    }, 4000);
  };

  const desconectarGoogle = async () => {
    await supabase
      .from("client_actions")
      .update({ google_refresh_token: null })
      .eq("client_id", client.id);
    setGoogleConnected(false);
    toast.success("Google Calendar desconectado.");
  };

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
      sdr_instrucoes: sdrInstrucoes || null,
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
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h4 className="font-heading text-base font-semibold text-foreground mb-1">Instruções para o SDR IA</h4>
        <p className="text-xs text-muted-foreground font-body mb-3">
          Escreva aqui as instruções específicas do seu negócio: produto/serviço, horários disponíveis para reunião, tom de voz, restrições, objeções comuns, etc. A IA usa isso em todas as conversas.
        </p>
        <textarea
          value={sdrInstrucoes}
          onChange={e => setSdrInstrucoes(e.target.value)}
          rows={8}
          placeholder={`Exemplos:\n- Somos uma consultoria de marketing digital focada em PMEs do setor de saúde\n- Reuniões disponíveis de segunda a sexta, das 9h às 18h (horário de Brasília)\n- Nunca ofereça desconto sem aprovação do comercial\n- Se o lead mencionar concorrente X, destaque nosso diferencial Y\n- Ticket médio entre R$3.000 e R$10.000/mês`}
          className="w-full rounded-lg bg-secondary border border-input text-foreground font-body text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <Section title="Quando lead QUALIFICADO">
        <ToggleRow label="Notificar no WhatsApp" checked={notifWhatsapp} onChange={setNotifWhatsapp}>
          <Input
            value={maskPhone(whatsappNum)}
            onChange={e => setWhatsappNum(e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder="55 (11) 99999-9999"
            inputMode="numeric"
            className="bg-secondary border-input"
          />
        </ToggleRow>
        <ToggleRow label="Enviar resumo por email" checked={notifEmail} onChange={setNotifEmail}>
          <Input value={emailDest} onChange={e => setEmailDest(e.target.value)} placeholder="email@exemplo.com" className="bg-secondary border-input" />
        </ToggleRow>
        <ToggleRow label="Criar evento Google Calendar" checked={createCalendar} onChange={setCreateCalendar}>
          <div className="mt-3 space-y-3">
            {googleConnected ? (
              <div className="flex items-center justify-between rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2">
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Google Calendar conectado
                </div>
                <button
                  onClick={desconectarGoogle}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Desconectar
                </button>
              </div>
            ) : googleQrUrl ? (
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-secondary border border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Peça ao cliente para escanear o QR Code com o celular e fazer login na conta Google dele
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG value={googleQrUrl} size={180} />
                </div>
                <p className="text-xs text-muted-foreground animate-pulse">Aguardando autorização...</p>
                <button
                  onClick={() => { setGoogleQrUrl(null); if (googlePollRef.current) clearInterval(googlePollRef.current); }}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={iniciarGoogleAuth} className="gap-2 w-full">
                <Calendar className="h-4 w-4" />
                Conectar Google Calendar
              </Button>
            )}
          </div>
        </ToggleRow>
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

      {/* ── CRM ─────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h4 className="font-heading text-base font-semibold text-foreground mb-4">Integração CRM</h4>
        <div className="space-y-4">

          {/* Seletor de CRM */}
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">CRM</label>
            <select
              value={crm}
              onChange={e => setCrm(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
            >
              <option value="nenhum">Nenhum</option>
              <option value="rdstation">RD Station</option>
              <option value="kommo">Kommo</option>
              <option value="pipedrive">Pipedrive</option>
              <option value="hubspot">HubSpot</option>
            </select>
          </div>

          {crm !== "nenhum" && (
            <>
              {/* Access Token + botão Conectar */}
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Access Token</label>
                <div className="flex gap-2">
                  <Input
                    value={accessToken}
                    onChange={e => { setAccessToken(e.target.value); setConnectStatus("idle"); }}
                    type="password"
                    className="bg-secondary border-input flex-1"
                    placeholder="Cole seu token aqui"
                  />
                  <Button
                    variant="outline"
                    onClick={conectar}
                    disabled={connectStatus === "connecting"}
                    className="shrink-0 gap-1.5"
                  >
                    {connectStatus === "connecting" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Conectando...</>
                    ) : connectStatus === "connected" ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" />Reconectar</>
                    ) : connectStatus === "error" ? (
                      <><XCircle className="h-4 w-4 text-red-500" />Tentar novamente</>
                    ) : (
                      <><Plug className="h-4 w-4" />Conectar</>
                    )}
                  </Button>
                </div>
                {connectStatus === "connected" && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado · {pipelines.length} pipeline(s) disponível(is)
                  </p>
                )}
                {connectStatus === "error" && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Falha na conexão — verifique o token
                  </p>
                )}
              </div>

              {/* Subdomain (Kommo) */}
              {crm === "kommo" && (
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-1 block">Subdomain</label>
                  <Input value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="seudominio" className="bg-secondary border-input" />
                </div>
              )}

              {/* Pipeline — dropdown dinâmico */}
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Pipeline</label>
                {!connected ? (
                  <div className="h-10 px-3 flex items-center rounded-lg bg-secondary border border-input text-muted-foreground text-sm">
                    Conecte ao CRM para ver os pipelines
                  </div>
                ) : (
                  <select
                    value={pipelineId}
                    onChange={e => handlePipelineChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
                  >
                    <option value="">— Selecionar pipeline —</option>
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mapeamento de Resultados — dropdowns dinâmicos */}
              {connected && pipelineId && (
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-2 block">Mapeamento de Resultados</label>
                  <div className="space-y-2">
                    {crmMappings.map(m => (
                      <div key={m.resultado} className="flex items-center gap-3">
                        <span className="w-44 text-sm text-foreground font-body shrink-0">{m.label}</span>
                        <span className="text-muted-foreground">→</span>
                        <StageSelect
                          stages={stages}
                          stagesLoading={stagesLoading}
                          connected={connected}
                          value={crmMap[m.resultado] ?? ""}
                          onChange={v => setCrmMap({ ...crmMap, [m.resultado]: v })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

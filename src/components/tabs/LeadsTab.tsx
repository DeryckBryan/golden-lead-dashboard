import React, { useState, useEffect, useCallback } from "react";
import { Client, Lead, SdrLead } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { toast } from "sonner";
import { Plus, ChevronRight, Loader2, Trash2, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface Props { client: Client }

const scoreColor = (score: number) => {
  if (score >= 70) return "text-status-active";
  if (score >= 40) return "text-status-configuring";
  return "text-status-paused";
};

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "desqualificado", label: "Desqualificado" },
  { value: "agendado", label: "Agendado" },
  { value: "nao_respondeu", label: "Não Respondeu" },
];

const maskPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} (${d.slice(2)}`;
  if (d.length <= 9) return `${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4)}`;
  return `${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
};

const emptyLead = (clientId: string): Omit<Lead, "id" | "created_at"> => ({
  client_id: clientId,
  nome: "",
  empresa: "",
  cargo: "",
  icp_score: 0,
  icp_match: false,
  bant_score: 0,
  status: "novo",
  origem: "",
  telefone: "",
});

const sdrEstadoLabel: Record<string, { label: string; color: string }> = {
  tentativa_1:      { label: "Tentativa 1",       color: "text-yellow-400" },
  tentativa_2:      { label: "Tentativa 2",       color: "text-yellow-500" },
  tentativa_3:      { label: "Tentativa 3",       color: "text-orange-400" },
  em_conversa:      { label: "Em conversa",       color: "text-blue-400" },
  qualificado:      { label: "Qualificado",       color: "text-green-400" },
  nao_qualificado:  { label: "Não qualificado",   color: "text-red-400" },
  reuniao_agendada: { label: "Reunião agendada",  color: "text-emerald-400" },
  retornar:         { label: "Retornar",          color: "text-purple-400" },
  descartado:       { label: "Descartado",        color: "text-gray-400" },
  limite_mensagens: { label: "Limite atingido",   color: "text-orange-500" },
};

export const LeadsTab: React.FC<Props> = ({ client }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState(emptyLead(client.id));
  const [saving, setSaving] = useState(false);

  // SDR Leads state
  const [sdrLeads, setSdrLeads] = useState<SdrLead[]>([]);
  const [sdrLoading, setSdrLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar leads");
      else setLeads(data ?? []);
      setLoading(false);
    };
    load();
  }, [client.id]);

  const loadSdrLeads = useCallback(async () => {
    setSdrLoading(true);
    const { data, error } = await supabase
      .from("sdr_leads")
      .select("id,client_id,nome,telefone,email,origem,estado,historico_conversa,created_at,qualificado,reuniao_em,motivo_perda")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar leads SDR");
    else setSdrLeads(data ?? []);
    setSdrLoading(false);
  }, [client.id]);

  useEffect(() => { loadSdrLeads(); }, [loadSdrLeads]);

  const limparHistorico = async (sdrLead: SdrLead) => {
    setClearingId(sdrLead.id);
    const { error } = await supabase
      .from("sdr_leads")
      .update({
        historico_conversa: [],
        estado: "tentativa_1",
        proxima_acao: null,
        proxima_acao_at: null,
        bant_budget: null,
        bant_authority: null,
        bant_need: null,
        bant_timeline: null,
        qualificado: false,
        reuniao_em: null,
        motivo_perda: null,
      })
      .eq("id", sdrLead.id);
    if (error) {
      toast.error("Erro ao limpar histórico: " + error.message);
    } else {
      toast.success(`Histórico de ${sdrLead.nome} limpo com sucesso`);
      setSdrLeads(prev => prev.map(l =>
        l.id === sdrLead.id
          ? { ...l, historico_conversa: [], estado: "tentativa_1", qualificado: false, reuniao_em: undefined, motivo_perda: undefined }
          : l
      ));
    }
    setClearingId(null);
  };

  const filtered = leads.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterScore && l.bant_score < Number(filterScore)) return false;
    return true;
  });

  const openNew = () => {
    setNewLead(emptyLead(client.id));
    setDialogOpen(true);
  };

  const salvarLead = async () => {
    if (!newLead.nome.trim() || !newLead.empresa.trim()) {
      toast.error("Nome e empresa são obrigatórios");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("leads").insert(newLead).select().single();
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      setLeads(prev => [data, ...prev]);
      toast.success("Lead adicionado!");
      setDialogOpen(false);
    }
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
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openNew} className="font-body gap-2">
          <Plus className="h-4 w-4" /> Adicionar Lead
        </Button>
        <div className="flex-1" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Input
          type="number"
          placeholder="BANT mín."
          value={filterScore}
          onChange={e => setFilterScore(e.target.value)}
          className="w-28 bg-secondary border-input"
        />
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Empresa</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Cargo</th>
                <th className="text-center p-3 text-muted-foreground font-medium">ICP</th>
                <th className="text-center p-3 text-muted-foreground font-medium">BANT</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Origem</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    {leads.length === 0 ? "Nenhum lead ainda. Os leads chegam via automação ou podem ser adicionados manualmente." : "Nenhum lead encontrado com esses filtros."}
                  </td>
                </tr>
              ) : filtered.map(lead => (
                <tr
                  key={lead.id}
                  className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="p-3 text-foreground font-medium">{lead.nome}</td>
                  <td className="p-3 text-foreground">{lead.empresa}</td>
                  <td className="p-3 text-muted-foreground">{lead.cargo}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 ${lead.icp_match ? "text-status-active" : "text-status-paused"}`}>
                      {lead.icp_match ? "✓" : "✗"} {lead.icp_score}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${scoreColor(lead.bant_score)}`}>{lead.bant_score}</span>
                  </td>
                  <td className="p-3"><LeadStatusBadge status={lead.status} /></td>
                  <td className="p-3 text-muted-foreground">{lead.origem}</td>
                  <td className="p-3 text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhe do lead */}
      <Sheet open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <SheetContent className="bg-card border-border w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading text-foreground">{selectedLead?.nome}</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-6 space-y-4 text-sm font-body">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Empresa</span><p className="text-foreground mt-1">{selectedLead.empresa}</p></div>
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Cargo</span><p className="text-foreground mt-1">{selectedLead.cargo || "—"}</p></div>
                <div className="p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">ICP Score</span>
                  <p className={`mt-1 font-bold ${selectedLead.icp_match ? "text-status-active" : "text-status-paused"}`}>{selectedLead.icp_score}</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">BANT Score</span>
                  <p className={`mt-1 font-bold ${scoreColor(selectedLead.bant_score)}`}>{selectedLead.bant_score}</p>
                </div>
              </div>
              {selectedLead.justificativa_icp && (
                <div className="p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Justificativa ICP</span>
                  <p className="text-foreground mt-1">{selectedLead.justificativa_icp}</p>
                </div>
              )}
              {selectedLead.bant_breakdown && (
                <div className="p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Breakdown BANT</span>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {Object.entries(selectedLead.bant_breakdown).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-lg font-bold text-primary">{v as number}</div>
                        <div className="text-xs text-muted-foreground capitalize">{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <LeadStatusBadge status={selectedLead.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Origem:</span>
                <span className="text-foreground">{selectedLead.origem || "—"}</span>
              </div>
              {selectedLead.telefone && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="text-foreground font-mono">{maskPhone(selectedLead.telefone)}</span>
                </div>
              )}
              {selectedLead.link_crm && (
                <a href={selectedLead.link_crm} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                  Ver no CRM
                </a>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* SDR Leads (WhatsApp) */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-foreground text-lg">Leads SDR (WhatsApp)</h2>
          <span className="text-muted-foreground text-sm font-body">— {sdrLeads.length} registro{sdrLeads.length !== 1 ? "s" : ""}</span>
        </div>

        {sdrLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Telefone</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Origem</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Msgs</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Cadastro</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sdrLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        Nenhum lead SDR ainda. Os leads chegam via webhook do n8n.
                      </td>
                    </tr>
                  ) : sdrLeads.map(lead => {
                    const estado = sdrEstadoLabel[lead.estado] ?? { label: lead.estado, color: "text-muted-foreground" };
                    const msgCount = Array.isArray(lead.historico_conversa) ? lead.historico_conversa.length : 0;
                    return (
                      <tr key={lead.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="p-3 text-foreground font-medium">{lead.nome}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{maskPhone(lead.telefone)}</td>
                        <td className="p-3 text-muted-foreground">{lead.origem || "—"}</td>
                        <td className="p-3">
                          <span className={`font-medium ${estado.color}`}>{estado.label}</span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{msgCount}</td>
                        <td className="p-3 text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-body text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={clearingId === lead.id}
                            onClick={() => limparHistorico(lead)}
                          >
                            {clearingId === lead.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />}
                            Limpar histórico
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Adicionar lead manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Adicionar Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1 block">Nome *</label>
              <Input value={newLead.nome} onChange={e => setNewLead({ ...newLead, nome: e.target.value })} className="bg-secondary border-input" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1 block">Empresa *</label>
              <Input value={newLead.empresa} onChange={e => setNewLead({ ...newLead, empresa: e.target.value })} className="bg-secondary border-input" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1 block">Cargo</label>
              <Input value={newLead.cargo} onChange={e => setNewLead({ ...newLead, cargo: e.target.value })} className="bg-secondary border-input" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1 block">Telefone (WhatsApp)</label>
              <Input
                value={maskPhone(newLead.telefone ?? "")}
                onChange={e => setNewLead({ ...newLead, telefone: e.target.value.replace(/\D/g, "").slice(0, 13) })}
                placeholder="55 (11) 99999-9999"
                inputMode="numeric"
                className="bg-secondary border-input"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1 block">Origem</label>
              <Input value={newLead.origem} onChange={e => setNewLead({ ...newLead, origem: e.target.value })} placeholder="LinkedIn, Indicação, Lista..." className="bg-secondary border-input" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1 block">Status</label>
              <select
                value={newLead.status}
                onChange={e => setNewLead({ ...newLead, status: e.target.value as Lead["status"] })}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
              >
                {statusOptions.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Button onClick={salvarLead} disabled={saving} className="w-full font-body">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

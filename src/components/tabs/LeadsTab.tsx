import React, { useState } from "react";
import { Client, Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { toast } from "sonner";
import { Plus, Upload, Filter, X, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props { client: Client }

const mockLeads: Lead[] = [
  { id: "1", client_id: "1", nome: "Carlos Silva", empresa: "Empresa ABC", cargo: "CEO", icp_score: 92, icp_match: true, bant_score: 85, status: "qualificado", origem: "LinkedIn", created_at: "2024-01-15", justificativa_icp: "Match perfeito no segmento e faturamento", bant_breakdown: { budget: 28, authority: 25, need: 20, timeline: 12 } },
  { id: "2", client_id: "1", nome: "Ana Martins", empresa: "Tech Corp", cargo: "Diretora", icp_score: 78, icp_match: true, bant_score: 62, status: "em_contato", origem: "Indicação", created_at: "2024-01-18" },
  { id: "3", client_id: "1", nome: "Pedro Santos", empresa: "Startup XYZ", cargo: "Fundador", icp_score: 45, icp_match: false, bant_score: 30, status: "desqualificado", origem: "Cold Email", created_at: "2024-01-20", justificativa_icp: "Faturamento abaixo do mínimo" },
  { id: "4", client_id: "1", nome: "Julia Ferreira", empresa: "Big Corp", cargo: "Gerente", icp_score: 88, icp_match: true, bant_score: 75, status: "agendado", origem: "LinkedIn", created_at: "2024-01-22" },
  { id: "5", client_id: "1", nome: "Ricardo Alves", empresa: "MegaTech", cargo: "VP Vendas", icp_score: 65, icp_match: true, bant_score: 50, status: "nao_respondeu", origem: "Lista", created_at: "2024-01-25" },
];

export const LeadsTab: React.FC<Props> = ({ client }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterScore, setFilterScore] = useState("");

  const filtered = mockLeads.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterScore && l.bant_score < Number(filterScore)) return false;
    return true;
  });

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-status-active";
    if (score >= 40) return "text-status-configuring";
    return "text-status-paused";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="font-body gap-2"><Plus className="h-4 w-4" /> Adicionar Lead</Button>
        <Button variant="outline" className="font-body gap-2 border-primary/40 text-primary"><Upload className="h-4 w-4" /> Importar CSV</Button>
        <div className="flex-1" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm">
          <option value="">Todos os status</option>
          <option value="novo">Novo</option><option value="em_contato">Em Contato</option><option value="qualificado">Qualificado</option>
          <option value="desqualificado">Desqualificado</option><option value="agendado">Agendado</option><option value="nao_respondeu">Não Respondeu</option>
        </select>
        <Input type="number" placeholder="Score mín." value={filterScore} onChange={e => setFilterScore(e.target.value)} className="w-28 bg-secondary border-input" />
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
                <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">Nenhum lead encontrado.</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <td className="p-3 text-foreground font-medium">{lead.nome}</td>
                  <td className="p-3 text-foreground">{lead.empresa}</td>
                  <td className="p-3 text-muted-foreground">{lead.cargo}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 ${lead.icp_match ? "text-status-active" : "text-status-paused"}`}>
                      {lead.icp_match ? "✓" : "✗"} {lead.icp_score}
                    </span>
                  </td>
                  <td className="p-3 text-center"><span className={`font-bold ${scoreColor(lead.bant_score)}`}>{lead.bant_score}</span></td>
                  <td className="p-3"><LeadStatusBadge status={lead.status} /></td>
                  <td className="p-3 text-muted-foreground">{lead.created_at}</td>
                  <td className="p-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <SheetContent className="bg-card border-border w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader><SheetTitle className="font-heading text-foreground">{selectedLead?.nome}</SheetTitle></SheetHeader>
          {selectedLead && (
            <div className="mt-6 space-y-4 text-sm font-body">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Empresa</span><p className="text-foreground mt-1">{selectedLead.empresa}</p></div>
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Cargo</span><p className="text-foreground mt-1">{selectedLead.cargo}</p></div>
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">ICP Score</span><p className={`mt-1 font-bold ${selectedLead.icp_match ? "text-status-active" : "text-status-paused"}`}>{selectedLead.icp_score}</p></div>
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">BANT Score</span><p className={`mt-1 font-bold ${scoreColor(selectedLead.bant_score)}`}>{selectedLead.bant_score}</p></div>
              </div>
              {selectedLead.justificativa_icp && (
                <div className="p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Justificativa ICP</span><p className="text-foreground mt-1">{selectedLead.justificativa_icp}</p></div>
              )}
              {selectedLead.bant_breakdown && (
                <div className="p-3 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Breakdown BANT</span>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {Object.entries(selectedLead.bant_breakdown).map(([k, v]) => (
                      <div key={k} className="text-center"><div className="text-lg font-bold text-primary">{v}</div><div className="text-xs text-muted-foreground capitalize">{k}</div></div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2"><span className="text-muted-foreground">Status:</span><LeadStatusBadge status={selectedLead.status} /></div>
              <div className="flex items-center gap-2"><span className="text-muted-foreground">Origem:</span><span className="text-foreground">{selectedLead.origem}</span></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

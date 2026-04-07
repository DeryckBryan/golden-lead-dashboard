import React, { useState, useEffect } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props { client: Client }

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium text-muted-foreground font-body mb-1.5 block">{label}</label>
    {children}
  </div>
);

const TagInput: React.FC<{
  tags: string[];
  setTags: (v: string[]) => void;
  input: string;
  setInput: (v: string) => void;
  placeholder: string;
}> = ({ tags, setTags, input, setInput, placeholder }) => (
  <div>
    <div className="flex flex-wrap gap-2 mb-2">
      {tags.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs font-body">
          {t}
          <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
        </span>
      ))}
    </div>
    <div className="flex gap-2">
      <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} className="bg-secondary border-input flex-1"
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (input.trim()) { setTags([...tags, input.trim()]); setInput(""); } } }} />
      <Button type="button" variant="outline" size="sm" onClick={() => { if (input.trim()) { setTags([...tags, input.trim()]); setInput(""); } }} className="border-primary/40 text-primary">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const BriefingTab: React.FC<Props> = ({ client }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [briefingId, setBriefingId] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [produto, setProduto] = useState("");
  const [ticket, setTicket] = useState("");
  const [diferencial, setDiferencial] = useState("");
  const [publico, setPublico] = useState("");
  const [regioes, setRegioes] = useState<string[]>([]);
  const [regInput, setRegInput] = useState("");
  const [dores, setDores] = useState<string[]>([]);
  const [doreInput, setDoreInput] = useState("");
  const [temVendas, setTemVendas] = useState(false);
  const [ciclo, setCiclo] = useState("");
  const [canais, setCanais] = useState<string[]>([]);
  const [canalInput, setCanalInput] = useState("");
  const [objecoes, setObjecoes] = useState<string[]>([]);
  const [objInput, setObjInput] = useState("");
  const [tom, setTom] = useState("consultivo");
  const [evitar, setEvitar] = useState("");
  const [meta, setMeta] = useState("");
  const [material, setMaterial] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("client_briefing")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (data) {
        setHasData(true);
        setBriefingId(data.id);
        setDescricao(data.descricao_empresa ?? "");
        setProduto(data.produto_servico ?? "");
        setTicket(data.ticket_medio?.toString() ?? "");
        setDiferencial(data.diferencial ?? "");
        setPublico(data.publico_alvo ?? "");
        setRegioes(data.regioes_atuacao ?? []);
        setDores(data.principais_dores ?? []);
        setTemVendas(data.tem_time_vendas ?? false);
        setCiclo(data.ciclo_venda_dias?.toString() ?? "");
        setCanais(data.canais_atuais ?? []);
        setObjecoes(data.principais_objecoes ?? []);
        setTom(data.tom_comunicacao ?? "consultivo");
        setEvitar(data.evitar_mencionar ?? "");
        setMeta(data.meta_reunioes_mes?.toString() ?? "");
        setMaterial(data.link_material_apoio ?? "");
        setObs(data.observacoes_livres ?? "");
      }
      setLoading(false);
    };
    load();
  }, [client.id]);

  const salvar = async () => {
    setSaving(true);
    const payload = {
      client_id: client.id,
      descricao_empresa: descricao,
      produto_servico: produto,
      ticket_medio: ticket ? Number(ticket) : null,
      diferencial,
      publico_alvo: publico,
      regioes_atuacao: regioes,
      principais_dores: dores,
      tem_time_vendas: temVendas,
      ciclo_venda_dias: ciclo ? Number(ciclo) : null,
      canais_atuais: canais,
      principais_objecoes: objecoes,
      tom_comunicacao: tom,
      evitar_mencionar: evitar,
      meta_reunioes_mes: meta ? Number(meta) : null,
      link_material_apoio: material || null,
      observacoes_livres: obs,
    };

    const { error } = await supabase.from("client_briefing").upsert(payload, { onConflict: "client_id" });

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Briefing salvo!");
      setHasData(true);
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
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Briefing do Cliente</h3>
          <span className={`px-3 py-1 rounded-md text-xs font-body ${hasData ? "bg-green-100 text-green-700" : "bg-status-pending-bg text-status-pending"}`}>
            {hasData ? "Preenchido" : "Aguardando preenchimento"}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-6 p-3 bg-secondary rounded-lg">
          <span className="text-sm text-muted-foreground font-body truncate flex-1">
            {window.location.origin}/briefing/{client.briefing_token}
          </span>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/briefing/${client.briefing_token}`); toast.success("Copiado!"); }} className="border-primary/40 text-primary">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <FormField label="Descrição da empresa"><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="bg-secondary border-input min-h-[80px]" /></FormField>
          <FormField label="Produto/Serviço principal"><Textarea value={produto} onChange={e => setProduto(e.target.value)} className="bg-secondary border-input min-h-[80px]" /></FormField>
          <FormField label="Ticket médio (R$)"><Input type="number" value={ticket} onChange={e => setTicket(e.target.value)} className="bg-secondary border-input" /></FormField>
          <FormField label="Diferencial competitivo"><Textarea value={diferencial} onChange={e => setDiferencial(e.target.value)} className="bg-secondary border-input" /></FormField>
          <FormField label="Público-alvo declarado"><Textarea value={publico} onChange={e => setPublico(e.target.value)} className="bg-secondary border-input" /></FormField>
          <FormField label="Regiões de atuação"><TagInput tags={regioes} setTags={setRegioes} input={regInput} setInput={setRegInput} placeholder="Ex: São Paulo" /></FormField>
          <FormField label="Principais dores que resolve"><TagInput tags={dores} setTags={setDores} input={doreInput} setInput={setDoreInput} placeholder="Adicionar dor..." /></FormField>
          <FormField label="Tem time de vendas?">
            <div className="flex items-center gap-3">
              <Switch checked={temVendas} onCheckedChange={setTemVendas} />
              <span className="text-sm text-foreground font-body">{temVendas ? "Sim" : "Não"}</span>
            </div>
          </FormField>
          <FormField label="Ciclo médio de venda (dias)"><Input type="number" value={ciclo} onChange={e => setCiclo(e.target.value)} className="bg-secondary border-input" /></FormField>
          <FormField label="Canais atuais"><TagInput tags={canais} setTags={setCanais} input={canalInput} setInput={setCanalInput} placeholder="Ex: LinkedIn" /></FormField>
          <FormField label="Principais objeções"><TagInput tags={objecoes} setTags={setObjecoes} input={objInput} setInput={setObjInput} placeholder="Adicionar objeção..." /></FormField>
          <FormField label="Tom de comunicação">
            <div className="flex gap-4">
              {["formal", "consultivo", "descontraido"].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tom" checked={tom === t} onChange={() => setTom(t)} className="accent-primary" />
                  <span className="text-sm text-foreground font-body">{t === "descontraido" ? "Descontraído" : t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Evitar mencionar"><Textarea value={evitar} onChange={e => setEvitar(e.target.value)} className="bg-secondary border-input" /></FormField>
          <FormField label="Meta de reuniões/mês"><Input type="number" value={meta} onChange={e => setMeta(e.target.value)} className="bg-secondary border-input" /></FormField>
          <FormField label="Link de material de apoio"><Input type="url" value={material} onChange={e => setMaterial(e.target.value)} className="bg-secondary border-input" placeholder="https://..." /></FormField>
          <FormField label="Observações livres"><Textarea value={obs} onChange={e => setObs(e.target.value)} className="bg-secondary border-input min-h-[80px]" /></FormField>
        </div>
      </div>

      <Button onClick={salvar} disabled={saving} className="font-body">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Briefing"}
      </Button>
    </div>
  );
};

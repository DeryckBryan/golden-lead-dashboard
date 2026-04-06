import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Plus, X } from "lucide-react";

interface Props { client: Client }

export const BriefingTab: React.FC<Props> = ({ client }) => {
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

  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    if (input.trim()) { setList([...list, input.trim()]); setInput(""); }
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const TagInput: React.FC<{ tags: string[]; setTags: (v: string[]) => void; input: string; setInput: (v: string) => void; placeholder: string }> = ({ tags, setTags, input, setInput, placeholder }) => (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs font-body">
            {t}
            <button onClick={() => removeTag(tags, setTags, i)}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} className="bg-secondary border-input flex-1"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(tags, setTags, input, setInput); }}} />
        <Button variant="outline" size="sm" onClick={() => addTag(tags, setTags, input, setInput)} className="border-primary/40 text-primary">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Briefing do Cliente</h3>
          <span className="px-3 py-1 bg-status-pending-bg text-status-pending rounded-md text-xs font-body">Aguardando preenchimento</span>
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
                  <span className="text-sm text-foreground font-body capitalize">{t === "descontraido" ? "Descontraído" : t.charAt(0).toUpperCase() + t.slice(1)}</span>
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
      <Button onClick={() => toast.success("Briefing salvo!")} className="font-body">Salvar Briefing</Button>
    </div>
  );
};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium text-muted-foreground font-body mb-1.5 block">{label}</label>
    {children}
  </div>
);

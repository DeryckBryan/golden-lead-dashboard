import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface Props { client: Client }

export const ICPTab: React.FC<Props> = ({ client }) => {
  const [segmentos, setSegmentos] = useState<string[]>(["Tecnologia", "SaaS"]);
  const [segInput, setSegInput] = useState("");
  const [fatMin, setFatMin] = useState("50000");
  const [fatMax, setFatMax] = useState("500000");
  const [funcMin, setFuncMin] = useState("10");
  const [funcMax, setFuncMax] = useState("200");
  const [cargos, setCargos] = useState<string[]>(["CEO", "CTO", "Diretor Comercial"]);
  const [cargoInput, setCargoInput] = useState("");
  const [regioes, setRegioes] = useState<string[]>(["São Paulo", "Rio de Janeiro"]);
  const [regInput, setRegInput] = useState("");
  const [dores, setDores] = useState<string[]>(["Baixa conversão", "Falta de leads qualificados"]);
  const [doreInput, setDoreInput] = useState("");
  const [exclusao, setExclusao] = useState<string[]>(["MEI", "Governo"]);
  const [exclInput, setExclInput] = useState("");

  const TagGroup: React.FC<{ tags: string[]; setTags: (v: string[]) => void; input: string; setInput: (v: string) => void; placeholder: string }> = ({ tags, setTags, input, setInput, placeholder }) => (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground rounded-md text-xs font-body border border-primary/30">
            {t}<button onClick={() => setTags(tags.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} className="bg-secondary border-input flex-1"
          onKeyDown={e => { if (e.key === "Enter" && input.trim()) { e.preventDefault(); setTags([...tags, input.trim()]); setInput(""); }}} />
        <Button variant="outline" size="sm" onClick={() => { if (input.trim()) { setTags([...tags, input.trim()]); setInput(""); }}} className="border-primary/40 text-primary"><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Perfil de Cliente Ideal (ICP)</h3>
        <div className="grid grid-cols-1 gap-5">
          <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Segmentos</label><TagGroup tags={segmentos} setTags={setSegmentos} input={segInput} setInput={setSegInput} placeholder="Adicionar segmento..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Faturamento mín. (R$/mês)</label><Input type="number" value={fatMin} onChange={e => setFatMin(e.target.value)} className="bg-secondary border-input" /></div>
            <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Faturamento máx. (R$/mês)</label><Input type="number" value={fatMax} onChange={e => setFatMax(e.target.value)} className="bg-secondary border-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Funcionários mín.</label><Input type="number" value={funcMin} onChange={e => setFuncMin(e.target.value)} className="bg-secondary border-input" /></div>
            <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Funcionários máx.</label><Input type="number" value={funcMax} onChange={e => setFuncMax(e.target.value)} className="bg-secondary border-input" /></div>
          </div>
          <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Cargos alvo</label><TagGroup tags={cargos} setTags={setCargos} input={cargoInput} setInput={setCargoInput} placeholder="Adicionar cargo..." /></div>
          <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Regiões</label><TagGroup tags={regioes} setTags={setRegioes} input={regInput} setInput={setRegInput} placeholder="Adicionar região..." /></div>
          <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Dores que resolve</label><TagGroup tags={dores} setTags={setDores} input={doreInput} setInput={setDoreInput} placeholder="Adicionar dor..." /></div>
          <div><label className="text-sm text-muted-foreground font-body mb-1.5 block">Critérios de exclusão</label><TagGroup tags={exclusao} setTags={setExclusao} input={exclInput} setInput={setExclInput} placeholder="Adicionar critério..." /></div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Preview do Prompt ICP</h3>
        <div className="bg-secondary rounded-lg p-4 text-sm font-mono text-muted-foreground whitespace-pre-wrap">
{`Avalie se o lead corresponde ao ICP:
- Segmentos: ${segmentos.join(", ")}
- Faturamento: R$${fatMin} a R$${fatMax}/mês
- Funcionários: ${funcMin} a ${funcMax}
- Cargos decisores: ${cargos.join(", ")}
- Regiões: ${regioes.join(", ")}
- Dores: ${dores.join(", ")}
- Excluir: ${exclusao.join(", ")}`}
        </div>
      </div>

      <Button onClick={() => toast.success("ICP salvo!")} className="font-body">Salvar ICP</Button>
    </div>
  );
};

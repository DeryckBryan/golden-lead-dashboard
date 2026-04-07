import React, { useState, useEffect } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props { client: Client }

const TagGroup: React.FC<{
  tags: string[];
  setTags: (v: string[]) => void;
  input: string;
  setInput: (v: string) => void;
  placeholder: string;
}> = ({ tags, setTags, input, setInput, placeholder }) => (
  <div>
    <div className="flex flex-wrap gap-2 mb-2">
      {tags.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground rounded-md text-xs font-body border border-primary/30">
          {t}
          <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
    <div className="flex gap-2">
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={placeholder}
        className="bg-secondary border-input flex-1"
        onKeyDown={e => {
          if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            setTags([...tags, input.trim()]);
            setInput("");
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => { if (input.trim()) { setTags([...tags, input.trim()]); setInput(""); } }}
        className="border-primary/40 text-primary"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const ICPTab: React.FC<Props> = ({ client }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [icpId, setIcpId] = useState<string | null>(null);

  const [segmentos, setSegmentos] = useState<string[]>([]);
  const [segInput, setSegInput] = useState("");
  const [fatMin, setFatMin] = useState("");
  const [fatMax, setFatMax] = useState("");
  const [funcMin, setFuncMin] = useState("");
  const [funcMax, setFuncMax] = useState("");
  const [cargos, setCargos] = useState<string[]>([]);
  const [cargoInput, setCargoInput] = useState("");
  const [regioes, setRegioes] = useState<string[]>([]);
  const [regInput, setRegInput] = useState("");
  const [dores, setDores] = useState<string[]>([]);
  const [doreInput, setDoreInput] = useState("");
  const [exclusao, setExclusao] = useState<string[]>([]);
  const [exclInput, setExclInput] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("icp_config")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (data) {
        setIcpId(data.id);
        setSegmentos(data.segmentos ?? []);
        setFatMin(data.faturamento_min?.toString() ?? "");
        setFatMax(data.faturamento_max?.toString() ?? "");
        setFuncMin(data.funcionarios_min?.toString() ?? "");
        setFuncMax(data.funcionarios_max?.toString() ?? "");
        setCargos(data.cargos_alvo ?? []);
        setRegioes(data.regioes ?? []);
        setDores(data.dores ?? []);
        setExclusao(data.criterios_exclusao ?? []);
      }
      setLoading(false);
    };
    load();
  }, [client.id]);

  const salvar = async () => {
    setSaving(true);
    const payload = {
      client_id: client.id,
      segmentos,
      faturamento_min: fatMin ? Number(fatMin) : null,
      faturamento_max: fatMax ? Number(fatMax) : null,
      funcionarios_min: funcMin ? Number(funcMin) : null,
      funcionarios_max: funcMax ? Number(funcMax) : null,
      cargos_alvo: cargos,
      regioes,
      dores,
      criterios_exclusao: exclusao,
    };

    let error;
    if (icpId) {
      ({ error } = await supabase.from("icp_config").update(payload).eq("id", icpId));
    } else {
      const { data, error: err } = await supabase.from("icp_config").insert(payload).select().single();
      error = err;
      if (data) setIcpId(data.id);
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("ICP salvo com sucesso!");
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
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Perfil de Cliente Ideal (ICP)</h3>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Segmentos</label>
            <TagGroup tags={segmentos} setTags={setSegmentos} input={segInput} setInput={setSegInput} placeholder="Ex: Saúde, Tecnologia..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1.5 block">Faturamento mín. (R$/mês)</label>
              <Input type="number" value={fatMin} onChange={e => setFatMin(e.target.value)} placeholder="Ex: 50000" className="bg-secondary border-input" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1.5 block">Faturamento máx. (R$/mês)</label>
              <Input type="number" value={fatMax} onChange={e => setFatMax(e.target.value)} placeholder="Ex: 500000" className="bg-secondary border-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1.5 block">Funcionários mín.</label>
              <Input type="number" value={funcMin} onChange={e => setFuncMin(e.target.value)} placeholder="Ex: 5" className="bg-secondary border-input" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1.5 block">Funcionários máx.</label>
              <Input type="number" value={funcMax} onChange={e => setFuncMax(e.target.value)} placeholder="Ex: 200" className="bg-secondary border-input" />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Cargos alvo (decisores)</label>
            <TagGroup tags={cargos} setTags={setCargos} input={cargoInput} setInput={setCargoInput} placeholder="Ex: CEO, Diretor Comercial..." />
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Regiões</label>
            <TagGroup tags={regioes} setTags={setRegioes} input={regInput} setInput={setRegInput} placeholder="Ex: São Paulo, Sul do Brasil..." />
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Dores que o cliente resolve</label>
            <TagGroup tags={dores} setTags={setDores} input={doreInput} setInput={setDoreInput} placeholder="Ex: Falta de leads, Baixa conversão..." />
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Critérios de exclusão</label>
            <TagGroup tags={exclusao} setTags={setExclusao} input={exclInput} setInput={setExclInput} placeholder="Ex: MEI, Setor público..." />
          </div>
        </div>
      </div>

      {/* Preview do prompt */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Preview do Prompt ICP</h3>
        <div className="bg-secondary rounded-lg p-4 text-sm font-mono text-muted-foreground whitespace-pre-wrap">
{`Avalie se o lead corresponde ao ICP:
- Segmentos: ${segmentos.join(", ") || "—"}
- Faturamento: R$${fatMin || "?"} a R$${fatMax || "?"}/mês
- Funcionários: ${funcMin || "?"} a ${funcMax || "?"}
- Cargos decisores: ${cargos.join(", ") || "—"}
- Regiões: ${regioes.join(", ") || "—"}
- Dores: ${dores.join(", ") || "—"}
- Excluir: ${exclusao.join(", ") || "—"}`}
        </div>
      </div>

      <Button onClick={salvar} disabled={saving} className="font-body">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar ICP"}
      </Button>
    </div>
  );
};

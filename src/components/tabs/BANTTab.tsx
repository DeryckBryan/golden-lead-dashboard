import React, { useState, useEffect } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CurrencyInput } from "@/components/ui/currency-input";

interface Props { client: Client }

interface BudgetFaixa {
  fat_min: number;
  fat_max: number | null;
  score: number;
}

const DEFAULT_BUDGET_PERGUNTAS = [
  "Quantos pacientes ativos você atende hoje?",
  "Qual o ticket médio por paciente por mês?",
];

const DEFAULT_FAIXAS: BudgetFaixa[] = [
  { fat_min: 60000, fat_max: 69999, score: 25 },
  { fat_min: 70000, fat_max: 99999, score: 30 },
  { fat_min: 100000, fat_max: 199999, score: 35 },
  { fat_min: 200000, fat_max: null, score: 40 },
];

export const BANTTab: React.FC<Props> = ({ client }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Budget
  const [budgetPerguntas, setBudgetPerguntas] = useState<string[]>(DEFAULT_BUDGET_PERGUNTAS);
  const [budgetPergInput, setBudgetPergInput] = useState("");
  const [budgetFaixas, setBudgetFaixas] = useState<BudgetFaixa[]>(DEFAULT_FAIXAS);

  // Authority
  const [cargos, setCargos] = useState<string[]>(["CEO", "Diretor", "Gerente"]);
  const [cargoInput, setCargoInput] = useState("");

  // Need
  const [perguntas, setPerguntas] = useState<string[]>(["Qual o principal desafio atual?", "O que motivou a busca por solução?"]);
  const [pergInput, setPergInput] = useState("");

  // Timeline
  const [prazo, setPrazo] = useState("30");

  // Score
  const [scoreMin, setScoreMin] = useState([70]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bant_config")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (data) {
        setBudgetPerguntas(data.budget_perguntas?.length ? data.budget_perguntas : DEFAULT_BUDGET_PERGUNTAS);
        setBudgetFaixas(data.budget_faixas?.length ? data.budget_faixas : DEFAULT_FAIXAS);
        setCargos(data.authority_cargos ?? ["CEO", "Diretor", "Gerente"]);
        setPerguntas(data.need_perguntas ?? ["Qual o principal desafio atual?", "O que motivou a busca por solução?"]);
        setPrazo(data.timeline_max_dias?.toString() ?? "30");
        setScoreMin([data.score_minimo_aprovacao ?? 70]);
      }
      setLoading(false);
    };
    load();
  }, [client.id]);

  const salvar = async () => {
    setSaving(true);
    const payload = {
      client_id: client.id,
      budget_perguntas: budgetPerguntas,
      budget_faixas: budgetFaixas,
      authority_cargos: cargos,
      need_perguntas: perguntas,
      timeline_max_dias: prazo ? Number(prazo) : null,
      score_minimo_aprovacao: scoreMin[0],
    };

    const { error } = await supabase.from("bant_config").upsert(payload, { onConflict: "client_id" });

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("BANT salvo!");
    }
    setSaving(false);
  };

  const addFaixa = () => {
    setBudgetFaixas([...budgetFaixas, { fat_min: 0, fat_max: null, score: 0 }]);
  };

  const updateFaixa = (i: number, field: keyof BudgetFaixa, value: string) => {
    const updated = [...budgetFaixas];
    if (field === "fat_max") {
      updated[i][field] = value === "" ? null : Number(value);
    } else {
      (updated[i] as any)[field] = Number(value);
    }
    setBudgetFaixas(updated);
  };

  const removeFaixa = (i: number) => {
    setBudgetFaixas(budgetFaixas.filter((_, j) => j !== i));
  };

  const maxBudgetScore = Math.max(...budgetFaixas.map(f => f.score), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Budget */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Budget</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">
          O agente estimará o faturamento do lead a partir das respostas (pacientes × ticket médio) e pontuará conforme as faixas abaixo.
        </p>

        <div className="space-y-5">
          {/* Perguntas de budget */}
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Perguntas para estimar faturamento</label>
            <div className="space-y-2 mb-2">
              {budgetPerguntas.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                  <span className="flex-1 text-sm text-foreground font-body">{p}</span>
                  <button type="button" onClick={() => setBudgetPerguntas(budgetPerguntas.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={budgetPergInput}
                onChange={e => setBudgetPergInput(e.target.value)}
                placeholder="Adicionar pergunta..."
                className="bg-secondary border-input flex-1"
                onKeyDown={e => {
                  if (e.key === "Enter" && budgetPergInput.trim()) {
                    e.preventDefault();
                    setBudgetPerguntas([...budgetPerguntas, budgetPergInput.trim()]);
                    setBudgetPergInput("");
                  }
                }}
              />
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => { if (budgetPergInput.trim()) { setBudgetPerguntas([...budgetPerguntas, budgetPergInput.trim()]); setBudgetPergInput(""); } }}
                className="border-primary/40 text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Faixas de pontuação */}
          <div>
            <label className="text-sm text-muted-foreground font-body mb-2 block">Faixas de pontuação por faturamento estimado</label>
            <div className="space-y-2">
              {budgetFaixas.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
                  <div>
                    <span className="text-xs text-muted-foreground font-body block mb-1">Fat. mín. (R$)</span>
                    <CurrencyInput
                      value={f.fat_min.toString()}
                      onChange={v => updateFaixa(i, "fat_min", v)}
                      className="bg-secondary border-input h-8 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-body block mb-1">Fat. máx. (R$) — vazio = sem limite</span>
                    <CurrencyInput
                      value={f.fat_max?.toString() ?? ""}
                      onChange={v => updateFaixa(i, "fat_max", v)}
                      placeholder="Ilimitado"
                      className="bg-secondary border-input h-8 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-body block mb-1">Pontos</span>
                    <Input
                      type="number"
                      value={f.score}
                      onChange={e => updateFaixa(i, "score", e.target.value)}
                      className="bg-secondary border-input h-8 text-sm"
                    />
                  </div>
                  <button type="button" onClick={() => removeFaixa(i)} className="mt-5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFaixa} className="mt-3 border-primary/40 text-primary">
              <Plus className="h-4 w-4 mr-1" /> Adicionar faixa
            </Button>
          </div>
        </div>
      </div>

      {/* Authority + Need + Timeline */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Authority / Need / Timeline</h3>
        <div className="grid grid-cols-1 gap-5">

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Cargos com autoridade de decisão</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {cargos.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground rounded-md text-xs font-body border border-primary/30">
                  {t}<button type="button" onClick={() => setCargos(cargos.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={cargoInput} onChange={e => setCargoInput(e.target.value)} placeholder="Adicionar cargo..." className="bg-secondary border-input flex-1"
                onKeyDown={e => { if (e.key === "Enter" && cargoInput.trim()) { e.preventDefault(); setCargos([...cargos, cargoInput.trim()]); setCargoInput(""); } }} />
              <Button type="button" variant="outline" size="sm" onClick={() => { if (cargoInput.trim()) { setCargos([...cargos, cargoInput.trim()]); setCargoInput(""); } }} className="border-primary/40 text-primary"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Perguntas para identificar necessidade</label>
            <div className="space-y-2 mb-2">
              {perguntas.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                  <span className="flex-1 text-sm text-foreground font-body">{p}</span>
                  <button type="button" onClick={() => setPerguntas(perguntas.filter((_, j) => j !== i))}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={pergInput} onChange={e => setPergInput(e.target.value)} placeholder="Adicionar pergunta..." className="bg-secondary border-input flex-1"
                onKeyDown={e => { if (e.key === "Enter" && pergInput.trim()) { e.preventDefault(); setPerguntas([...perguntas, pergInput.trim()]); setPergInput(""); } }} />
              <Button type="button" variant="outline" size="sm" onClick={() => { if (pergInput.trim()) { setPerguntas([...perguntas, pergInput.trim()]); setPergInput(""); } }} className="border-primary/40 text-primary"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Prazo máximo aceitável (dias)</label>
            <Input type="number" value={prazo} onChange={e => setPrazo(e.target.value)} className="bg-secondary border-input" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Score mínimo para aprovação: {scoreMin[0]}</label>
            <Slider value={scoreMin} onValueChange={setScoreMin} min={0} max={100} step={5} className="mt-2" />
          </div>
        </div>
      </div>

      {/* Pesos */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Pontuação máxima por critério</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary font-heading">até {maxBudgetScore}pts</div>
            <div className="text-sm text-muted-foreground font-body mt-1">Budget</div>
          </div>
          {[{ label: "Authority", pts: 25 }, { label: "Need", pts: 25 }, { label: "Timeline", pts: 20 }].map(({ label, pts }) => (
            <div key={label} className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary font-heading">{pts}pts</div>
              <div className="text-sm text-muted-foreground font-body mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={salvar} disabled={saving} className="font-body">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar BANT"}
      </Button>
    </div>
  );
};

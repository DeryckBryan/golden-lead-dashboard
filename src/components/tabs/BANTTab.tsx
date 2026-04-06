import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface Props { client: Client }

export const BANTTab: React.FC<Props> = ({ client }) => {
  const [budgetMin, setBudgetMin] = useState("5000");
  const [budgetQuestion, setBudgetQuestion] = useState("Qual o orçamento disponível para essa solução?");
  const [cargos, setCargos] = useState<string[]>(["CEO", "Diretor", "Gerente"]);
  const [cargoInput, setCargoInput] = useState("");
  const [perguntas, setPerguntas] = useState<string[]>(["Qual o principal desafio atual?", "O que motivou a busca por solução?"]);
  const [pergInput, setPergInput] = useState("");
  const [prazo, setPrazo] = useState("30");
  const [scoreMin, setScoreMin] = useState([70]);

  const weights = { budget: 30, authority: 25, need: 25, timeline: 20 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Configuração BANT</h3>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Budget mínimo (R$)</label>
            <Input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Pergunta personalizada para budget</label>
            <Textarea value={budgetQuestion} onChange={e => setBudgetQuestion(e.target.value)} className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Cargos com autoridade de decisão</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {cargos.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground rounded-md text-xs font-body border border-primary/30">
                  {t}<button onClick={() => setCargos(cargos.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={cargoInput} onChange={e => setCargoInput(e.target.value)} placeholder="Adicionar cargo..." className="bg-secondary border-input flex-1"
                onKeyDown={e => { if (e.key === "Enter" && cargoInput.trim()) { e.preventDefault(); setCargos([...cargos, cargoInput.trim()]); setCargoInput(""); }}} />
              <Button variant="outline" size="sm" onClick={() => { if (cargoInput.trim()) { setCargos([...cargos, cargoInput.trim()]); setCargoInput(""); }}} className="border-primary/40 text-primary"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Perguntas para identificar necessidade</label>
            <div className="space-y-2 mb-2">
              {perguntas.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                  <span className="flex-1 text-sm text-foreground font-body">{p}</span>
                  <button onClick={() => setPerguntas(perguntas.filter((_, j) => j !== i))}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={pergInput} onChange={e => setPergInput(e.target.value)} placeholder="Adicionar pergunta..." className="bg-secondary border-input flex-1"
                onKeyDown={e => { if (e.key === "Enter" && pergInput.trim()) { e.preventDefault(); setPerguntas([...perguntas, pergInput.trim()]); setPergInput(""); }}} />
              <Button variant="outline" size="sm" onClick={() => { if (pergInput.trim()) { setPerguntas([...perguntas, pergInput.trim()]); setPergInput(""); }}} className="border-primary/40 text-primary"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Prazo máximo (dias)</label>
            <Input type="number" value={prazo} onChange={e => setPrazo(e.target.value)} className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Score mínimo: {scoreMin[0]}</label>
            <Slider value={scoreMin} onValueChange={setScoreMin} min={0} max={100} step={5} className="mt-2" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Pesos dos Critérios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary font-heading">{val}pts</div>
              <div className="text-sm text-muted-foreground font-body capitalize mt-1">{key}</div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => toast.success("BANT salvo!")} className="font-body">Salvar BANT</Button>
    </div>
  );
};

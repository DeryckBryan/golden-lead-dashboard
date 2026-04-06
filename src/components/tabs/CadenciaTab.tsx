import React, { useState } from "react";
import { Client, CadenceStep } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, GripVertical, Bot, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props { client: Client }

const defaultSteps: CadenceStep[] = [
  { id: "1", client_id: "1", step_number: 1, trigger: "inicio", channel: "whatsapp", delay_hours: 0, use_ai: true, template: "Olá {nome}, vi que a {empresa} atua em..." },
  { id: "2", client_id: "1", step_number: 2, trigger: "sem_resposta", channel: "whatsapp", delay_hours: 24, use_ai: true, template: "{nome}, gostaria de retomar nosso contato..." },
  { id: "3", client_id: "1", step_number: 3, trigger: "sem_resposta", channel: "email", delay_hours: 48, use_ai: false, template: "Email de follow-up padrão" },
];

const triggerLabels: Record<string, string> = {
  inicio: "Início", sem_resposta: "Sem Resposta", resposta_positiva: "Resposta Positiva", objecao: "Objeção", agendamento: "Agendamento"
};

export const CadenciaTab: React.FC<Props> = ({ client }) => {
  const [steps, setSteps] = useState<CadenceStep[]>(defaultSteps);
  const [editStep, setEditStep] = useState<CadenceStep | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openNew = () => {
    setEditStep({ id: String(Date.now()), client_id: client.id, step_number: steps.length + 1, trigger: "sem_resposta", channel: "whatsapp", delay_hours: 24, use_ai: true, template: "" });
    setDialogOpen(true);
  };

  const saveStep = () => {
    if (!editStep) return;
    const exists = steps.find(s => s.id === editStep.id);
    if (exists) setSteps(steps.map(s => s.id === editStep.id ? editStep : s));
    else setSteps([...steps, editStep]);
    setDialogOpen(false);
    toast.success("Step salvo!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-foreground">Cadência de Contato</h3>
        <Button onClick={openNew} className="font-body gap-2"><Plus className="h-4 w-4" /> Adicionar Step</Button>
      </div>

      <div className="space-y-3">
        {steps.map(step => (
          <div key={step.id} className="bg-card rounded-lg p-4 shadow-card border border-border flex items-start gap-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setEditStep(step); setDialogOpen(true); }}>
            <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-primary font-body">Step {step.step_number}</span>
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-xs font-body">{triggerLabels[step.trigger]}</span>
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-xs font-body capitalize">{step.channel}</span>
                <span className="text-xs text-muted-foreground font-body">{step.delay_hours}h delay</span>
              </div>
              <p className="text-sm text-foreground/80 font-body truncate">{step.template}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-body ${step.use_ai ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
              {step.use_ai ? <><Bot className="h-3 w-3 inline mr-1" />IA</> : <><FileText className="h-3 w-3 inline mr-1" />Fixo</>}
            </span>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-foreground">Editar Step</DialogTitle></DialogHeader>
          {editStep && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Gatilho</label>
                <select value={editStep.trigger} onChange={e => setEditStep({ ...editStep, trigger: e.target.value as any })} className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm">
                  <option value="inicio">Início</option><option value="sem_resposta">Sem Resposta</option><option value="resposta_positiva">Resposta Positiva</option><option value="objecao">Objeção</option><option value="agendamento">Agendamento</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Canal</label>
                <select value={editStep.channel} onChange={e => setEditStep({ ...editStep, channel: e.target.value as any })} className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm">
                  <option value="whatsapp">WhatsApp</option><option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Delay (horas)</label>
                <Input type="number" value={editStep.delay_hours} onChange={e => setEditStep({ ...editStep, delay_hours: Number(e.target.value) })} className="bg-secondary border-input" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editStep.use_ai} onCheckedChange={v => setEditStep({ ...editStep, use_ai: v })} />
                <span className="text-sm text-foreground font-body">Usar IA</span>
              </div>
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">Template/Contexto</label>
                <Textarea value={editStep.template} onChange={e => setEditStep({ ...editStep, template: e.target.value })} className="bg-secondary border-input min-h-[100px]" placeholder="Variáveis: {nome} {empresa} {cargo} {dor}" />
              </div>
              <Button onClick={saveStep} className="w-full font-body">Salvar Step</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Button onClick={() => toast.success("Cadência salva!")} className="font-body">Salvar Cadência</Button>
    </div>
  );
};

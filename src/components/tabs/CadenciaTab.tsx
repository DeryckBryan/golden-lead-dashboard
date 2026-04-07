import React, { useState, useEffect } from "react";
import { Client, CadenceStep } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, GripVertical, Bot, FileText, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface Props { client: Client }

type DelayUnit = "minutes" | "hours" | "days";

const toHours = (value: number, unit: DelayUnit) => {
  if (unit === "minutes") return value / 60;
  if (unit === "days") return value * 24;
  return value;
};

const fromHours = (hours: number): { value: number; unit: DelayUnit } => {
  if (hours < 1) return { value: Math.round(hours * 60), unit: "minutes" };
  if (hours >= 24 && hours % 24 === 0) return { value: hours / 24, unit: "days" };
  return { value: hours, unit: "hours" };
};

const delayLabel = (hours: number) => {
  const { value, unit } = fromHours(hours);
  const labels: Record<DelayUnit, string> = { minutes: "min", hours: "h", days: "d" };
  return `${value}${labels[unit]} delay`;
};

const triggerLabels: Record<string, string> = {
  inicio: "Início",
  sem_resposta: "Sem Resposta",
  resposta_positiva: "Resposta Positiva",
  objecao: "Objeção",
  agendamento: "Agendamento",
};

const newStep = (clientId: string, stepNumber: number): CadenceStep => ({
  id: "",
  client_id: clientId,
  step_number: stepNumber,
  trigger: "sem_resposta",
  channel: "whatsapp",
  delay_hours: 24,
  use_ai: true,
  template: "",
});

export const CadenciaTab: React.FC<Props> = ({ client }) => {
  const [steps, setSteps] = useState<CadenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editStep, setEditStep] = useState<CadenceStep | null>(null);
  const [delayValue, setDelayValue] = useState(24);
  const [delayUnit, setDelayUnit] = useState<DelayUnit>("hours");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sdr_cadence")
        .select("*")
        .eq("client_id", client.id)
        .order("step_number");
      if (error) toast.error("Erro ao carregar cadência");
      else setSteps(data ?? []);
      setLoading(false);
    };
    load();
  }, [client.id]);

  const openNew = () => {
    setEditStep(newStep(client.id, steps.length + 1));
    setDelayValue(24);
    setDelayUnit("hours");
    setDialogOpen(true);
  };

  const openEdit = (step: CadenceStep) => {
    setEditStep({ ...step });
    const { value, unit } = fromHours(step.delay_hours);
    setDelayValue(value);
    setDelayUnit(unit);
    setDialogOpen(true);
  };

  const saveStep = async () => {
    if (!editStep) return;
    setSaving(true);

    const isNew = !editStep.id;
    const payload = {
      client_id: editStep.client_id,
      step_number: editStep.step_number,
      trigger: editStep.trigger,
      channel: editStep.channel,
      delay_hours: toHours(delayValue, delayUnit),
      use_ai: editStep.use_ai,
      template: editStep.template,
    };

    if (isNew) {
      const { data, error } = await supabase.from("sdr_cadence").insert(payload).select().single();
      if (error) { toast.error("Erro ao salvar: " + error.message); setSaving(false); return; }
      setSteps(prev => [...prev, data].sort((a, b) => a.step_number - b.step_number));
    } else {
      const { error } = await supabase.from("sdr_cadence").update(payload).eq("id", editStep.id);
      if (error) { toast.error("Erro ao salvar: " + error.message); setSaving(false); return; }
      setSteps(prev => prev.map(s => s.id === editStep.id ? { ...editStep } : s).sort((a, b) => a.step_number - b.step_number));
    }

    toast.success("Step salvo!");
    setDialogOpen(false);
    setSaving(false);
  };

  const deleteStep = async (id: string) => {
    if (!confirm("Deletar este step?")) return;
    setDeleting(id);
    const { error } = await supabase.from("sdr_cadence").delete().eq("id", id);
    if (error) { toast.error("Erro ao deletar"); setDeleting(null); return; }
    setSteps(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
    toast.success("Step deletado");
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Cadência de Contato</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Define quando e como o agente aborda cada lead. Cada step é disparado pelo gatilho configurado.
          </p>
        </div>
        <Button onClick={openNew} className="font-body gap-2">
          <Plus className="h-4 w-4" /> Adicionar Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="bg-card rounded-lg p-12 border border-border text-center">
          <p className="text-muted-foreground font-body text-sm">Nenhum step configurado.</p>
          <p className="text-muted-foreground font-body text-xs mt-1">Clique em "Adicionar Step" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map(step => (
            <div
              key={step.id}
              className="bg-card rounded-lg p-4 shadow-card border border-border flex items-start gap-4 hover:border-primary/40 transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(step)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-primary font-body">Step {step.step_number}</span>
                  <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-xs font-body">{triggerLabels[step.trigger]}</span>
                  <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-xs font-body capitalize">{step.channel}</span>
                  <span className="text-xs text-muted-foreground font-body">{delayLabel(step.delay_hours)}</span>
                </div>
                <p className="text-sm text-foreground/80 font-body truncate">{step.template || <span className="italic text-muted-foreground">Sem template</span>}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-body shrink-0 ${step.use_ai ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                {step.use_ai ? <><Bot className="h-3 w-3 inline mr-1" />IA</> : <><FileText className="h-3 w-3 inline mr-1" />Fixo</>}
              </span>
              <button
                onClick={() => deleteStep(step.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                disabled={deleting === step.id}
              >
                {deleting === step.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              {editStep?.id ? "Editar Step" : "Novo Step"}
            </DialogTitle>
          </DialogHeader>
          {editStep && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-1 block">Gatilho</label>
                  <select
                    value={editStep.trigger}
                    onChange={e => setEditStep({ ...editStep, trigger: e.target.value as CadenceStep["trigger"] })}
                    className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
                  >
                    <option value="inicio">Início</option>
                    <option value="sem_resposta">Sem Resposta</option>
                    <option value="resposta_positiva">Resposta Positiva</option>
                    <option value="objecao">Objeção</option>
                    <option value="agendamento">Agendamento</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-1 block">Canal</label>
                  <select
                    value={editStep.channel}
                    onChange={e => setEditStep({ ...editStep, channel: e.target.value as CadenceStep["channel"] })}
                    className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-1 block">Step número</label>
                  <Input
                    type="number"
                    value={editStep.step_number}
                    onChange={e => setEditStep({ ...editStep, step_number: Number(e.target.value) })}
                    className="bg-secondary border-input"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-body mb-1 block">Delay</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={delayValue}
                      onChange={e => setDelayValue(Number(e.target.value))}
                      className="bg-secondary border-input"
                      min={0}
                    />
                    <select
                      value={delayUnit}
                      onChange={e => setDelayUnit(e.target.value as DelayUnit)}
                      className="h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm"
                    >
                      <option value="minutes">minutos</option>
                      <option value="hours">horas</option>
                      <option value="days">dias</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={editStep.use_ai} onCheckedChange={v => setEditStep({ ...editStep, use_ai: v })} />
                <div>
                  <span className="text-sm text-foreground font-body">Usar IA para personalizar</span>
                  <p className="text-xs text-muted-foreground font-body">O agente usa o template como contexto e gera a mensagem</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground font-body mb-1 block">
                  {editStep.use_ai ? "Contexto / instrução para o agente" : "Template fixo"}
                </label>
                <Textarea
                  value={editStep.template}
                  onChange={e => setEditStep({ ...editStep, template: e.target.value })}
                  className="bg-secondary border-input min-h-[120px]"
                  placeholder={editStep.use_ai
                    ? "Ex: Aborde o lead mencionando o segmento de saúde. Use tom consultivo. Variáveis: {nome} {empresa} {cargo}"
                    : "Ex: Olá {nome}, passando para retomar nosso contato sobre a {empresa}..."}
                />
                <p className="text-xs text-muted-foreground font-body mt-1">Variáveis: {"{saudacao}"} {"{nome}"} {"{empresa}"} {"{cargo}"} {"{dor}"}</p>
              </div>

              <Button onClick={saveStep} disabled={saving} className="w-full font-body">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Step"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

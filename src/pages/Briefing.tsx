import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, X, CheckCircle } from "lucide-react";

const FormField: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const TagInput: React.FC<{
  tags: string[];
  setTags: (v: string[]) => void;
  placeholder: string;
}> = ({ tags, setTags, placeholder }) => {
  const [input, setInput] = useState("");
  const add = () => { if (input.trim()) { setTags([...tags, input.trim()]); setInput(""); } };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} className="flex-1"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" size="sm" onClick={add} className="border-amber-300 text-amber-700"><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

const Briefing: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Form fields
  const [descricao, setDescricao] = useState("");
  const [produto, setProduto] = useState("");
  const [ticket, setTicket] = useState("");
  const [diferencial, setDiferencial] = useState("");
  const [publico, setPublico] = useState("");
  const [regioes, setRegioes] = useState<string[]>([]);
  const [dores, setDores] = useState<string[]>([]);
  const [temVendas, setTemVendas] = useState(false);
  const [ciclo, setCiclo] = useState("");
  const [canais, setCanais] = useState<string[]>([]);
  const [objecoes, setObjecoes] = useState<string[]>([]);
  const [tom, setTom] = useState("consultivo");
  const [evitar, setEvitar] = useState("");
  const [meta, setMeta] = useState("");
  const [material, setMaterial] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: client } = await supabase
        .from("clients")
        .select("id, nome_fantasia, razao_social")
        .eq("briefing_token", token)
        .maybeSingle();

      if (!client) { setNotFound(true); setLoading(false); return; }

      setClientId(client.id);
      setClientName(client.nome_fantasia || client.razao_social);

      // Load existing briefing if any
      const { data: briefing } = await supabase
        .from("client_briefing")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (briefing) {
        setDescricao(briefing.descricao ?? "");
        setProduto(briefing.produto ?? "");
        setTicket(briefing.ticket?.toString() ?? "");
        setDiferencial(briefing.diferencial ?? "");
        setPublico(briefing.publico_alvo ?? "");
        setRegioes(briefing.regioes ?? []);
        setDores(briefing.dores ?? []);
        setTemVendas(briefing.tem_time_vendas ?? false);
        setCiclo(briefing.ciclo_venda_dias?.toString() ?? "");
        setCanais(briefing.canais_atuais ?? []);
        setObjecoes(briefing.objecoes ?? []);
        setTom(briefing.tom_comunicacao ?? "consultivo");
        setEvitar(briefing.evitar ?? "");
        setMeta(briefing.meta_reunioes_mes?.toString() ?? "");
        setMaterial(briefing.link_material ?? "");
        setObs(briefing.observacoes ?? "");
      }

      setLoading(false);
    };
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !produto) {
      toast.error("Preencha pelo menos a descrição da empresa e o produto/serviço.");
      return;
    }
    setSaving(true);

    const payload = {
      client_id: clientId,
      descricao,
      produto,
      ticket: ticket ? Number(ticket) : null,
      diferencial,
      publico_alvo: publico,
      regioes,
      dores,
      tem_time_vendas: temVendas,
      ciclo_venda_dias: ciclo ? Number(ciclo) : null,
      canais_atuais: canais,
      objecoes,
      tom_comunicacao: tom,
      evitar,
      meta_reunioes_mes: meta ? Number(meta) : null,
      link_material: material || null,
      observacoes: obs,
    };

    const { error } = await supabase.from("client_briefing").upsert(payload, { onConflict: "client_id" });

    if (error) {
      toast.error("Erro ao enviar: " + error.message);
    } else {
      // Update client status
      await supabase.from("clients").update({ status: "configurando" }).eq("id", clientId);
      setSubmitted(true);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link inválido</h1>
          <p className="text-gray-500">Este link de briefing não existe ou expirou.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Briefing enviado!</h1>
          <p className="text-gray-500">Obrigado, <strong>{clientName}</strong>. Suas informações foram recebidas com sucesso. Entraremos em contato em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-700 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Bryan's & Co
          </h1>
          <p className="text-gray-500 text-sm">Consultoria FVR · Briefing de Onboarding</p>
          {clientName && (
            <div className="mt-3 inline-block px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800 font-medium">
              {clientName}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Preencha as informações abaixo para que possamos entender melhor o seu negócio e personalizar a estratégia SDR para você.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Descreva sua empresa" required>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="O que sua empresa faz, há quanto tempo está no mercado, seu diferencial..." className="min-h-[100px]" required />
            </FormField>

            <FormField label="Produto ou serviço principal" required>
              <Textarea value={produto} onChange={e => setProduto(e.target.value)} placeholder="Descreva o que você vende..." className="min-h-[80px]" required />
            </FormField>

            <FormField label="Ticket médio (R$)">
              <Input type="number" value={ticket} onChange={e => setTicket(e.target.value)} placeholder="Ex: 15000" />
            </FormField>

            <FormField label="Qual é o seu diferencial competitivo?">
              <Textarea value={diferencial} onChange={e => setDiferencial(e.target.value)} placeholder="O que te diferencia dos concorrentes?" className="min-h-[80px]" />
            </FormField>

            <FormField label="Quem é o seu público-alvo?">
              <Textarea value={publico} onChange={e => setPublico(e.target.value)} placeholder="Segmento, porte, cargo dos decisores..." className="min-h-[80px]" />
            </FormField>

            <FormField label="Regiões de atuação">
              <TagInput tags={regioes} setTags={setRegioes} placeholder="Ex: São Paulo — pressione Enter" />
            </FormField>

            <FormField label="Principais dores que você resolve">
              <TagInput tags={dores} setTags={setDores} placeholder="Ex: Falta de clientes novos — pressione Enter" />
            </FormField>

            <FormField label="Possui time de vendas?">
              <div className="flex items-center gap-3 mt-1">
                <Switch checked={temVendas} onCheckedChange={setTemVendas} />
                <span className="text-sm text-gray-600">{temVendas ? "Sim" : "Não"}</span>
              </div>
            </FormField>

            <FormField label="Ciclo médio de venda (em dias)">
              <Input type="number" value={ciclo} onChange={e => setCiclo(e.target.value)} placeholder="Ex: 30" />
            </FormField>

            <FormField label="Canais de aquisição que já usa">
              <TagInput tags={canais} setTags={setCanais} placeholder="Ex: LinkedIn, Indicação — pressione Enter" />
            </FormField>

            <FormField label="Principais objeções dos clientes">
              <TagInput tags={objecoes} setTags={setObjecoes} placeholder="Ex: Preço alto, Não tenho orçamento — pressione Enter" />
            </FormField>

            <FormField label="Tom de comunicação preferido">
              <div className="flex gap-6 mt-1">
                {[
                  { value: "formal", label: "Formal" },
                  { value: "consultivo", label: "Consultivo" },
                  { value: "descontraido", label: "Descontraído" },
                ].map(t => (
                  <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tom" checked={tom === t.value} onChange={() => setTom(t.value)} className="accent-amber-600" />
                    <span className="text-sm text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="O que evitar mencionar nas abordagens?">
              <Textarea value={evitar} onChange={e => setEvitar(e.target.value)} placeholder="Concorrentes, termos técnicos, etc." />
            </FormField>

            <FormField label="Meta de reuniões por mês">
              <Input type="number" value={meta} onChange={e => setMeta(e.target.value)} placeholder="Ex: 10" />
            </FormField>

            <FormField label="Link de material de apoio (opcional)">
              <Input type="url" value={material} onChange={e => setMaterial(e.target.value)} placeholder="https://..." />
            </FormField>

            <FormField label="Observações adicionais">
              <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Qualquer informação extra que achar relevante..." />
            </FormField>

            <Button type="submit" disabled={saving} className="w-full h-12 text-base font-semibold bg-amber-700 hover:bg-amber-800 text-white">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</> : "Enviar Briefing"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Bryan's & Co · Consultoria FVR · Dados protegidos e usados exclusivamente para sua estratégia comercial.</p>
      </div>
    </div>
  );
};

export default Briefing;

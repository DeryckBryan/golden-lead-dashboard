import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Search, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props { client: Client; onUpdated?: (updated: Client) => void; }

function formatCnpj(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatWhatsapp(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export const IdentificacaoTab: React.FC<Props> = ({ client, onUpdated }) => {
  const [cnpj, setCnpj] = useState(formatCnpj(client.cnpj || ""));
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [receita, setReceita] = useState<any>(null);
  const [email, setEmail] = useState(client.email_comercial || "");
  const [whatsapp, setWhatsapp] = useState(client.whatsapp ? formatWhatsapp(client.whatsapp) : "");
  const [site, setSite] = useState(client.site || "");
  const [status, setStatus] = useState(client.status);

  const buscarCnpj = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) { toast.error("CNPJ inválido"); return; }
    setLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setReceita(d);
      toast.success("Dados encontrados!");
    } catch { toast.error("Erro ao buscar CNPJ"); }
    finally { setLoadingCnpj(false); }
  };

  const salvar = async () => {
    setLoadingSave(true);
    const { data, error } = await supabase
      .from("clients")
      .update({
        cnpj: cnpj.replace(/\D/g, "") || null,
        email_comercial: email || null,
        whatsapp: whatsapp || null,
        site: site || null,
        status,
      })
      .eq("id", client.id)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Cliente salvo!");
      onUpdated?.(data as Client);
    }
    setLoadingSave(false);
  };

  const copyBriefingLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/briefing/${client.briefing_token}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CNPJ */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Dados Cadastrais</h3>
        <div className="flex gap-3 mb-4">
          <Input
            value={cnpj}
            onChange={e => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0001-00"
            className="flex-1 bg-secondary border-input font-mono"
          />
          <Button onClick={buscarCnpj} disabled={loadingCnpj} className="gap-2 shrink-0">
            {loadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loadingCnpj ? "Buscando..." : "Buscar na Receita"}
          </Button>
        </div>

        {receita && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
            <Field label="Razão Social" value={receita.razao_social} />
            <Field label="Nome Fantasia" value={receita.nome_fantasia} />
            <Field label="Situação Cadastral">
              <StatusBadge status={receita.descricao_situacao_cadastral === "ATIVA" ? "ativo" : "pausado"} />
            </Field>
            <Field label="Segmento CNAE" value={receita.cnae_fiscal_descricao} />
            <Field label="Porte" value={receita.porte} />
            <Field label="Data de Abertura" value={receita.data_inicio_atividade} />
            <Field label="Endereço" value={`${receita.logradouro}, ${receita.numero} - ${receita.municipio}/${receita.uf}`} className="md:col-span-2" />
            {receita.qsa?.length > 0 && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Sócios:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {receita.qsa.map((s: any, i: number) => (
                    <span key={i} className="px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs">{s.nome_socio}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contato */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">Email Comercial</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">WhatsApp</label>
            <Input
              value={whatsapp}
              onChange={e => setWhatsapp(formatWhatsapp(e.target.value))}
              placeholder="(11) 99999-9999"
              className="bg-secondary border-input"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">Site</label>
            <Input value={site} onChange={e => setSite(e.target.value)} placeholder="https://..." className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground font-body text-sm focus:border-primary outline-none"
            >
              <option value="ativo">Ativo</option>
              <option value="configurando">Configurando</option>
              <option value="briefing_pendente">Briefing Pendente</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={salvar} disabled={loadingSave} className="font-body">
          {loadingSave ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Cliente"}
        </Button>
        <Button variant="outline" onClick={copyBriefingLink} className="gap-2 border-primary/40 text-primary">
          <Copy className="h-4 w-4" /> Copiar Link de Briefing
        </Button>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value?: string; className?: string; children?: React.ReactNode }> = ({ label, value, className, children }) => (
  <div className={className}>
    <span className="text-muted-foreground">{label}:</span>
    <span className="ml-2 text-foreground">{children || value || "—"}</span>
  </div>
);

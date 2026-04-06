import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Search, Copy } from "lucide-react";

interface Props { client: Client }

export const IdentificacaoTab: React.FC<Props> = ({ client }) => {
  const [cnpj, setCnpj] = useState(client.cnpj || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [email, setEmail] = useState(client.email_comercial || "");
  const [whatsapp, setWhatsapp] = useState(client.whatsapp || "");
  const [site, setSite] = useState(client.site || "");
  const [status, setStatus] = useState(client.status);

  const formatCnpj = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 14);
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const buscarCnpj = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) { toast.error("CNPJ inválido"); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      toast.success("Dados encontrados!");
    } catch { toast.error("Erro ao buscar CNPJ"); }
    finally { setLoading(false); }
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
            placeholder="__.___.___/____-__"
            className="flex-1 bg-secondary border-input"
          />
          <Button onClick={buscarCnpj} disabled={loading} className="gap-2">
            <Search className="h-4 w-4" />
            {loading ? "Buscando..." : "Buscar na Receita"}
          </Button>
        </div>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
            <Field label="Razão Social" value={data.razao_social} />
            <Field label="Nome Fantasia" value={data.nome_fantasia} />
            <Field label="Situação Cadastral">
              <StatusBadge status={data.descricao_situacao_cadastral === "ATIVA" ? "ativo" : "pausado"} />
            </Field>
            <Field label="Segmento CNAE" value={data.cnae_fiscal_descricao} />
            <Field label="Porte" value={data.porte} />
            <Field label="Data de Abertura" value={data.data_inicio_atividade} />
            <Field label="Endereço" value={`${data.logradouro}, ${data.numero} - ${data.municipio}/${data.uf}`} className="md:col-span-2" />
            {data.qsa?.length > 0 && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Sócios:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.qsa.map((s: any, i: number) => (
                    <span key={i} className="px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs">{s.nome_socio}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">Email Comercial</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">WhatsApp</label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11999999999" className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1 block">Site</label>
            <Input value={site} onChange={e => setSite(e.target.value)} className="bg-secondary border-input" />
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

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => toast.success("Cliente salvo!")} className="font-body">Salvar Cliente</Button>
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

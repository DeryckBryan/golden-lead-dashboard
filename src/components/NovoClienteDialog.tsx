import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, Search } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SEGMENTOS = [
  "Tecnologia", "Saúde", "Construção Civil", "Alimentação", "Consultoria",
  "Educação", "Varejo", "Serviços", "Indústria", "Outro"
];

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

const NovoClienteDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [cnpj, setCnpj] = useState("");
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [saving, setSaving] = useState(false);

  const [razao, setRazao] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [segmento, setSegmento] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const buscarCnpj = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      toast.error("CNPJ inválido. Digite os 14 dígitos.");
      return;
    }
    setLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      setRazao(data.razao_social ?? "");
      setFantasia(data.nome_fantasia || data.razao_social || "");
      setEmail(data.email ?? "");
      // Segmento por CNAE
      const cnae = (data.cnae_fiscal_descricao ?? "").toLowerCase();
      if (cnae.includes("saúde") || cnae.includes("médic") || cnae.includes("clínica")) setSegmento("Saúde");
      else if (cnae.includes("tecnologia") || cnae.includes("software") || cnae.includes("informática")) setSegmento("Tecnologia");
      else if (cnae.includes("construção") || cnae.includes("engenharia")) setSegmento("Construção Civil");
      else if (cnae.includes("alimento") || cnae.includes("restaurante") || cnae.includes("alimentação")) setSegmento("Alimentação");
      else if (cnae.includes("consultoria")) setSegmento("Consultoria");
      else if (cnae.includes("educação") || cnae.includes("ensino")) setSegmento("Educação");
      else if (cnae.includes("varejo") || cnae.includes("comércio")) setSegmento("Varejo");
      toast.success("Dados preenchidos automaticamente!");
    } catch {
      toast.error("CNPJ não encontrado na base de dados.");
    }
    setLoadingCnpj(false);
  };

  const handleSave = async () => {
    if (!razao || !fantasia || !segmento) {
      toast.error("Preencha Razão Social, Nome Fantasia e Segmento.");
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("clients").insert({
      cnpj: cnpj.replace(/\D/g, "") || null,
      razao_social: razao,
      nome_fantasia: fantasia,
      segmento,
      email_comercial: email || null,
      whatsapp: whatsapp || null,
      status: "configurando",
      briefing_token: generateToken(),
    });

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Cliente criado com sucesso!");
      onCreated();
      handleClose();
    }
    setSaving(false);
  };

  const handleClose = () => {
    setCnpj(""); setRazao(""); setFantasia(""); setSegmento(""); setEmail(""); setWhatsapp("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary">Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* CNPJ com busca */}
          <div>
            <Label className="font-body text-sm">CNPJ</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0001-00"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={buscarCnpj}
                disabled={loadingCnpj}
                className="shrink-0 border-primary/40 text-primary hover:bg-accent"
              >
                {loadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="font-body text-sm">Razão Social</Label>
            <Input value={razao} onChange={e => setRazao(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label className="font-body text-sm">Nome Fantasia</Label>
            <Input value={fantasia} onChange={e => setFantasia(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label className="font-body text-sm">Segmento</Label>
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-body text-sm">Email Comercial</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" placeholder="opcional" />
          </div>

          <div>
            <Label className="font-body text-sm">WhatsApp</Label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="mt-1.5" placeholder="11999999999" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="font-body">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Criar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NovoClienteDialog;

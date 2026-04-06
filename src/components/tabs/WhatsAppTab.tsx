import React, { useState } from "react";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wifi, WifiOff, QrCode, Send } from "lucide-react";

interface Props { client: Client }

export const WhatsAppTab: React.FC<Props> = ({ client }) => {
  const [status, setStatus] = useState<"connected" | "disconnected" | "qr_pending">("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const slug = client.nome_fantasia.toLowerCase().replace(/\s+/g, "-");

  const statusBadge = {
    connected: { label: "Conectado", className: "text-status-active bg-status-active-bg" },
    disconnected: { label: "Desconectado", className: "text-status-paused bg-status-paused-bg" },
    qr_pending: { label: "QR Pendente", className: "text-status-configuring bg-status-configuring-bg" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Instância WhatsApp</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Nome da instância</label>
            <Input value={slug} readOnly className="bg-secondary border-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Status</label>
            <div className="flex items-center gap-2 h-10">
              {status === "connected" ? <Wifi className="h-4 w-4 text-status-active" /> : <WifiOff className="h-4 w-4 text-status-paused" />}
              <span className={`px-2.5 py-1 rounded-md text-xs font-body ${statusBadge[status].className}`}>
                {statusBadge[status].label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={() => { setStatus("qr_pending"); toast.success("Instância criada!"); }} className="font-body gap-2">
            <Wifi className="h-4 w-4" /> Criar Instância
          </Button>
          <Button variant="outline" onClick={() => { setQrCode("placeholder"); setStatus("qr_pending"); }} className="font-body gap-2 border-primary/40 text-primary">
            <QrCode className="h-4 w-4" /> Gerar QR Code
          </Button>
          <Button variant="outline" onClick={() => { setStatus("disconnected"); setQrCode(null); toast.info("Desconectado"); }} className="font-body gap-2 border-destructive/40 text-destructive">
            <WifiOff className="h-4 w-4" /> Desconectar
          </Button>
        </div>

        {qrCode && (
          <div className="flex justify-center p-8 bg-secondary rounded-lg border border-border">
            <div className="w-48 h-48 bg-background rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
              <QrCode className="h-16 w-16 text-primary/50" />
            </div>
          </div>
        )}

        {status === "connected" && (
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-body">
              <div className="p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">Número:</span>
                <span className="ml-2 text-foreground">+55 11 99999-9999</span>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">LID:</span>
                <span className="ml-2 text-foreground">lid_abc123</span>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">JID:</span>
                <span className="ml-2 text-foreground">5511999999999@s.whatsapp.net</span>
              </div>
            </div>
            <Button variant="outline" className="font-body gap-2 border-primary/40 text-primary">
              <Send className="h-4 w-4" /> Testar envio
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

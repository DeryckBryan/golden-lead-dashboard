import React, { useState, useEffect, useRef } from "react";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wifi, WifiOff, QrCode, RefreshCw, Loader2, Trash2 } from "lucide-react";

interface Props { client: Client }

const EVO_URL = import.meta.env.VITE_EVOLUTION_URL as string;
const EVO_KEY = import.meta.env.VITE_EVOLUTION_KEY as string;

const evoFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${EVO_URL}${path}`, {
    ...options,
    headers: { "apikey": EVO_KEY, "Content-Type": "application/json", ...options.headers },
  });

type Status = "disconnected" | "connecting" | "connected" | "loading";

export const WhatsAppTab: React.FC<Props> = ({ client }) => {
  const instanceName = client.nome_fantasia.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const [status, setStatus] = useState<Status>("loading");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const checkStatus = async () => {
    try {
      const res = await evoFetch(`/instance/connectionState/${instanceName}`);
      if (!res.ok) { setStatus("disconnected"); return; }
      const data = await res.json();
      const state = data?.instance?.state ?? data?.state;
      if (state === "open") {
        setStatus("connected");
        setQrBase64(null);
        stopPolling();
        // fetch phone info
        const infoRes = await evoFetch(`/instance/fetchInstances?instanceName=${instanceName}`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          const inst = Array.isArray(info) ? info[0] : info;
          setPhone(inst?.instance?.owner ?? inst?.owner ?? null);
        }
      } else if (state === "connecting" || state === "qr") {
        setStatus("connecting");
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  };

  const fetchQr = async () => {
    const res = await evoFetch(`/instance/connect/${instanceName}`);
    if (!res.ok) return;
    const data = await res.json();
    const base64 = data?.base64 ?? data?.qrcode?.base64;
    if (base64) setQrBase64(base64);
  };

  // On mount: check if instance exists and its status
  useEffect(() => {
    const init = async () => {
      setStatus("loading");
      await checkStatus();
    };
    init();
    return () => stopPolling();
  }, [instanceName]);

  const handleCriar = async () => {
    setStatus("loading");
    try {
      const res = await evoFetch("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Instance may already exist
        if (data?.message?.includes("already") || data?.error?.includes("already")) {
          toast.info("Instância já existe, buscando QR Code...");
        } else {
          toast.error("Erro ao criar instância: " + (data?.message ?? res.statusText));
          setStatus("disconnected");
          return;
        }
      } else {
        toast.success("Instância criada!");
      }
      setStatus("connecting");
      await fetchQr();
      pollRef.current = setInterval(async () => {
        await checkStatus();
        if (status !== "connecting") stopPolling();
        else await fetchQr();
      }, 8000);
    } catch (e) {
      toast.error("Erro ao conectar à Evolution API");
      setStatus("disconnected");
    }
  };

  const handleConectar = async () => {
    setStatus("connecting");
    await fetchQr();
    stopPolling();
    pollRef.current = setInterval(async () => {
      await checkStatus();
      await fetchQr();
    }, 8000);
  };

  const handleDesconectar = async () => {
    stopPolling();
    await evoFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
    setQrBase64(null);
    setPhone(null);
    setStatus("disconnected");
    toast.info("WhatsApp desconectado");
  };

  const handleDeletar = async () => {
    if (!confirm("Deletar instância permanentemente?")) return;
    stopPolling();
    await evoFetch(`/instance/delete/${instanceName}`, { method: "DELETE" });
    setQrBase64(null);
    setPhone(null);
    setStatus("disconnected");
    toast.success("Instância deletada");
  };

  const statusConfig = {
    loading:       { label: "Verificando...", className: "text-muted-foreground bg-secondary" },
    disconnected:  { label: "Desconectado",  className: "text-status-paused bg-status-paused-bg" },
    connecting:    { label: "Aguardando QR", className: "text-status-configuring bg-status-configuring-bg" },
    connected:     { label: "Conectado",     className: "text-status-active bg-status-active-bg" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card rounded-lg p-6 shadow-card border border-border">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Instância WhatsApp</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Nome da instância</label>
            <div className="h-10 px-3 flex items-center bg-secondary rounded-md border border-input text-sm font-mono text-foreground">
              {instanceName}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-body mb-1.5 block">Status</label>
            <div className="flex items-center gap-2 h-10">
              {status === "connected"
                ? <Wifi className="h-4 w-4 text-status-active" />
                : status === "loading"
                ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                : <WifiOff className="h-4 w-4 text-status-paused" />}
              <span className={`px-2.5 py-1 rounded-md text-xs font-body ${statusConfig[status].className}`}>
                {statusConfig[status].label}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          {status === "disconnected" && (
            <>
              <Button onClick={handleCriar} className="font-body gap-2">
                <Wifi className="h-4 w-4" /> Criar e Conectar
              </Button>
            </>
          )}
          {status === "connecting" && (
            <Button variant="outline" onClick={handleConectar} className="font-body gap-2 border-primary/40 text-primary">
              <RefreshCw className="h-4 w-4" /> Novo QR Code
            </Button>
          )}
          {status === "connected" && (
            <Button variant="outline" onClick={handleDesconectar} className="font-body gap-2 border-destructive/40 text-destructive">
              <WifiOff className="h-4 w-4" /> Desconectar
            </Button>
          )}
          {(status === "connected" || status === "disconnected" || status === "connecting") && (
            <Button variant="outline" onClick={handleDeletar} className="font-body gap-2 border-destructive/40 text-destructive">
              <Trash2 className="h-4 w-4" /> Deletar instância
            </Button>
          )}
        </div>

        {/* QR Code */}
        {status === "connecting" && (
          <div className="flex flex-col items-center gap-4 p-8 bg-secondary rounded-lg border border-border">
            {qrBase64 ? (
              <>
                <img src={qrBase64} alt="QR Code WhatsApp" className="w-56 h-56 rounded-lg" />
                <p className="text-sm text-muted-foreground font-body text-center">
                  Abra o WhatsApp no celular → <strong>Dispositivos Conectados</strong> → <strong>Conectar dispositivo</strong>
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-body">Gerando QR Code...</p>
              </div>
            )}
          </div>
        )}

        {/* Connected info */}
        {status === "connected" && (
          <div className="p-4 bg-secondary rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-status-active-bg flex items-center justify-center">
                <Wifi className="h-5 w-5 text-status-active" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground font-body">WhatsApp conectado</p>
                {phone && <p className="text-xs text-muted-foreground font-body">{phone}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

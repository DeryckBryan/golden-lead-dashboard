import React from "react";
import { cn } from "@/lib/utils";
import { ClientStatus } from "@/types";

const statusConfig: Record<ClientStatus, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "text-status-active bg-status-active-bg" },
  configurando: { label: "Configurando", className: "text-status-configuring bg-status-configuring-bg" },
  briefing_pendente: { label: "Briefing Pendente", className: "text-status-pending bg-status-pending-bg" },
  pausado: { label: "Pausado", className: "text-status-paused bg-status-paused-bg" },
};

interface StatusBadgeProps {
  status: ClientStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-current/20", config.className, className)}>
      {config.label}
    </span>
  );
};

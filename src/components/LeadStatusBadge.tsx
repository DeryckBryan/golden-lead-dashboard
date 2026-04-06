import React from "react";
import { cn } from "@/lib/utils";
import { LeadStatus } from "@/types";

const leadStatusConfig: Record<LeadStatus, { label: string; className: string }> = {
  novo: { label: "Novo", className: "text-muted-foreground bg-muted" },
  em_contato: { label: "Em Contato", className: "text-blue-400 bg-blue-400/10" },
  qualificado: { label: "Qualificado", className: "text-status-active bg-status-active-bg" },
  desqualificado: { label: "Desqualificado", className: "text-status-paused bg-status-paused-bg" },
  agendado: { label: "Agendado", className: "text-purple-400 bg-purple-400/10" },
  nao_respondeu: { label: "Não Respondeu", className: "text-orange-400 bg-orange-400/10" },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status, className }) => {
  const config = leadStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", config.className, className)}>
      {config.label}
    </span>
  );
};

import React, { useState } from "react";
import { Client } from "@/types";
import { useClients } from "@/hooks/useClients";
import { StatusBadge } from "@/components/StatusBadge";
import NovoClienteDialog from "@/components/NovoClienteDialog";
import { cn } from "@/lib/utils";
import { Search, Plus, Loader2, Bot } from "lucide-react";

interface ClientSidebarProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ selectedClient, onSelectClient }) => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { clients, loading, refetch } = useClients();

  const filtered = clients.filter(c =>
    c.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
    c.razao_social?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col h-full bg-card border-r border-border">

        {/* Brand */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">SDR Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bryan's &amp; Co</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {clients.length === 0 ? "Nenhum cliente ainda." : "Nenhum resultado."}
            </p>
          ) : (
            filtered.map(client => {
              const isSelected = selectedClient?.id === client.id;
              const initials = getInitials(client.nome_fantasia || client.razao_social || "?");
              return (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate leading-none mb-1",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {client.nome_fantasia || client.razao_social}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Add client */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      <NovoClienteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={refetch}
      />
    </>
  );
};

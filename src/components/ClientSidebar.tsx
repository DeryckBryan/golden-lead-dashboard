import React, { useState } from "react";
import { Client } from "@/types";
import { mockClients } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ClientSidebarProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ selectedClient, onSelectClient }) => {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter(c =>
    c.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
    c.razao_social.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <h2 className="font-heading text-xl font-bold text-primary">SDR Admin</h2>
        <p className="font-body text-sm text-muted-foreground">Bryan's & Co</p>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3 border-b border-border">
        <Button variant="outline" className="w-full justify-start gap-2 border-primary/40 text-primary hover:bg-accent">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 bg-secondary border-input"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground font-body text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filtered.map(client => (
            <button
              key={client.id}
              onClick={() => onSelectClient(client)}
              className={cn(
                "w-full text-left p-4 border-b border-border transition-colors hover:bg-accent",
                selectedClient?.id === client.id && "bg-accent border-l-[3px] border-l-primary"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-body font-medium text-foreground text-sm truncate">
                  {client.nome_fantasia}
                </span>
                <StatusBadge status={client.status} />
              </div>
              <span className="text-xs text-muted-foreground font-body">{client.segmento}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

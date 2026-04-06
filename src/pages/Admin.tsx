import React, { useState } from "react";
import { Client } from "@/types";
import { ClientSidebar } from "@/components/ClientSidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { IdentificacaoTab } from "@/components/tabs/IdentificacaoTab";
import { BriefingTab } from "@/components/tabs/BriefingTab";
import { ICPTab } from "@/components/tabs/ICPTab";
import { BANTTab } from "@/components/tabs/BANTTab";
import { WhatsAppTab } from "@/components/tabs/WhatsAppTab";
import { CadenciaTab } from "@/components/tabs/CadenciaTab";
import { AcoesTab } from "@/components/tabs/AcoesTab";
import { LeadsTab } from "@/components/tabs/LeadsTab";
import { ConversasTab } from "@/components/tabs/ConversasTab";
import { cn } from "@/lib/utils";
import { Sun, Moon, Menu, X, Briefcase } from "lucide-react";

const tabs = [
  "Identificação", "Briefing", "ICP", "BANT", "WhatsApp", "Cadência", "Ações", "Leads", "Conversas"
];

const Admin: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTab = () => {
    if (!selectedClient) return null;
    switch (activeTab) {
      case 0: return <IdentificacaoTab client={selectedClient} />;
      case 1: return <BriefingTab client={selectedClient} />;
      case 2: return <ICPTab client={selectedClient} />;
      case 3: return <BANTTab client={selectedClient} />;
      case 4: return <WhatsAppTab client={selectedClient} />;
      case 5: return <CadenciaTab client={selectedClient} />;
      case 6: return <AcoesTab client={selectedClient} />;
      case 7: return <LeadsTab client={selectedClient} />;
      case 8: return <ConversasTab client={selectedClient} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] z-50">
            <ClientSidebar selectedClient={selectedClient} onSelectClient={c => { setSelectedClient(c); setSidebarOpen(false); setActiveTab(0); }} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[280px] shrink-0 border-r border-border">
        <ClientSidebar selectedClient={selectedClient} onSelectClient={c => { setSelectedClient(c); setActiveTab(0); }} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            {selectedClient ? (
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-lg font-bold text-foreground">{selectedClient.nome_fantasia}</h1>
                <StatusBadge status={selectedClient.status} />
              </div>
            ) : (
              <h1 className="font-heading text-lg font-bold text-foreground">SDR Admin</h1>
            )}
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors">
            {theme === "dark" ? <Sun className="h-5 w-5 text-accent-foreground" /> : <Moon className="h-5 w-5 text-accent-foreground" />}
          </button>
        </div>

        {/* Content */}
        {selectedClient ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="border-b border-border overflow-x-auto shrink-0">
              <div className="flex px-4 lg:px-6">
                {tabs.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "px-4 py-3 text-sm font-body font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                      activeTab === i
                        ? "text-primary border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {renderTab()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <Briefcase className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <h2 className="font-heading text-xl text-foreground mb-2">Selecione um cliente</h2>
              <p className="text-muted-foreground font-body text-sm">Escolha um cliente na lista ao lado para gerenciar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

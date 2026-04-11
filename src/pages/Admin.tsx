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
import {
  Sun, Moon, Menu, X,
  User, FileText, Target, BarChart2,
  MessageCircle, GitBranch, Zap, Users, MessageSquare,
  LayoutDashboard,
} from "lucide-react";

const tabs = [
  { label: "Identificação", icon: User },
  { label: "Briefing",      icon: FileText },
  { label: "ICP",           icon: Target },
  { label: "BANT",          icon: BarChart2 },
  { label: "WhatsApp",      icon: MessageCircle },
  { label: "Cadência",      icon: GitBranch },
  { label: "Ações",         icon: Zap },
  { label: "Leads",         icon: Users },
  { label: "Conversas",     icon: MessageSquare },
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] z-50" onClick={e => e.stopPropagation()}>
            <ClientSidebar
              selectedClient={selectedClient}
              onSelectClient={c => { setSelectedClient(c); setSidebarOpen(false); setActiveTab(0); }}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[260px] shrink-0">
        <ClientSidebar
          selectedClient={selectedClient}
          onSelectClient={c => { setSelectedClient(c); setActiveTab(0); }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>

            {selectedClient ? (
              <div className="flex items-center gap-2.5 animate-slide-in">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(selectedClient.nome_fantasia || selectedClient.razao_social || "?")
                    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                </div>
                <span className="font-semibold text-foreground text-sm">
                  {selectedClient.nome_fantasia || selectedClient.razao_social}
                </span>
                <StatusBadge status={selectedClient.status} />
              </div>
            ) : (
              <span className="font-semibold text-foreground text-sm">SDR Admin</span>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full border border-border bg-secondary flex items-center transition-colors hover:border-primary/30"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            <span className={cn(
              "absolute flex items-center justify-center w-5 h-5 rounded-full bg-card shadow-sm transition-all duration-300",
              theme === "dark" ? "left-1" : "left-8"
            )}>
              {theme === "dark"
                ? <Moon className="h-3 w-3 text-primary" />
                : <Sun className="h-3 w-3 text-primary" />
              }
            </span>
            <Sun className={cn("absolute left-8 h-3 w-3 transition-opacity", theme === "dark" ? "opacity-30 text-muted-foreground" : "opacity-0")} />
            <Moon className={cn("absolute left-2 h-3 w-3 transition-opacity", theme === "dark" ? "opacity-0" : "opacity-30 text-muted-foreground")} />
          </button>
        </header>

        {/* Content */}
        {selectedClient ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tab bar */}
            <div className="px-4 lg:px-6 pt-4 pb-0 border-b border-border bg-card/40 sticky top-14 z-20">
              <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
                {tabs.map(({ label, icon: Icon }, i) => (
                  <button
                    key={label}
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-xl border-b-2 transition-all",
                      activeTab === i
                        ? "text-primary border-primary bg-primary/5"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
              {renderTab()}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center animate-fade-in max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <LayoutDashboard className="h-8 w-8 text-primary/60" />
              </div>
              <h2 className="font-heading text-xl text-foreground mb-2">Selecione um cliente</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Escolha um cliente na lista lateral para gerenciar suas configurações, leads e conversas do SDR.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

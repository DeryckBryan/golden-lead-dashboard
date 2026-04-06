export interface Client {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  status: "ativo" | "configurando" | "briefing_pendente" | "pausado";
  segmento: string;
  email_comercial?: string;
  whatsapp?: string;
  site?: string;
  situacao_cadastral?: string;
  porte?: string;
  data_abertura?: string;
  endereco?: string;
  socios?: string[];
  briefing_token?: string;
  created_at?: string;
}

export interface Lead {
  id: string;
  client_id: string;
  nome: string;
  empresa: string;
  cargo: string;
  icp_score: number;
  icp_match: boolean;
  bant_score: number;
  status: "novo" | "em_contato" | "qualificado" | "desqualificado" | "agendado" | "nao_respondeu";
  origem: string;
  created_at: string;
  justificativa_icp?: string;
  bant_breakdown?: { budget: number; authority: number; need: number; timeline: number };
  link_crm?: string;
}

export interface Message {
  id: string;
  lead_id: string;
  client_id: string;
  content: string;
  sender: "sdr" | "lead";
  is_ai: boolean;
  created_at: string;
}

export interface CadenceStep {
  id: string;
  client_id: string;
  step_number: number;
  trigger: "inicio" | "sem_resposta" | "resposta_positiva" | "objecao" | "agendamento";
  channel: "whatsapp" | "email";
  delay_hours: number;
  use_ai: boolean;
  template: string;
}

export type ClientStatus = Client["status"];
export type LeadStatus = Lead["status"];

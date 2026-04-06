import { Client } from "@/types";

export const mockClients: Client[] = [
  {
    id: "1",
    razao_social: "Tech Solutions Ltda",
    nome_fantasia: "TechSol",
    cnpj: "12.345.678/0001-90",
    status: "ativo",
    segmento: "Tecnologia",
    email_comercial: "contato@techsol.com.br",
    whatsapp: "11999999999",
    briefing_token: "abc123",
  },
  {
    id: "2",
    razao_social: "Construtora Horizonte SA",
    nome_fantasia: "Horizonte",
    cnpj: "98.765.432/0001-10",
    status: "configurando",
    segmento: "Construção Civil",
    briefing_token: "def456",
  },
  {
    id: "3",
    razao_social: "Alimentos Premium Ltda",
    nome_fantasia: "Premium Foods",
    cnpj: "55.666.777/0001-88",
    status: "briefing_pendente",
    segmento: "Alimentação",
    briefing_token: "ghi789",
  },
  {
    id: "4",
    razao_social: "Consultoria Apex EIRELI",
    nome_fantasia: "Apex",
    cnpj: "11.222.333/0001-44",
    status: "pausado",
    segmento: "Consultoria",
    briefing_token: "jkl012",
  },
];

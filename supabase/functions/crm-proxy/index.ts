import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { crm, token, action, pipelineId, subdomain } = await req.json();

    let result;
    if (crm === "rdstation") result = await rdStation(token, action, pipelineId);
    else if (crm === "kommo") result = await kommo(token, subdomain, action, pipelineId);
    else if (crm === "pipedrive") result = await pipedrive(token, action, pipelineId);
    else if (crm === "hubspot") result = await hubspot(token, action, pipelineId);
    else throw new Error("CRM não suportado");

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    // Sempre retorna 200 — supabase.functions.invoke() trata não-2xx como exceção
    // e não deixa ler o body. O erro vai no JSON para o frontend tratar.
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

// ── RD Station CRM ────────────────────────────────────────────────────────────
// RD Station CRM não separa pipelines — usa deal_stages diretamente.
// Retornamos um "pipeline" fictício para manter o fluxo de UI consistente.
async function rdStation(token: string, action: string, _pipelineId?: string) {
  const base = "https://crm.rdstation.com/api/v1";
  const h = { Accept: "application/json" };

  // Valida token buscando deal_stages (endpoint correto do RD Station CRM)
  const r = await fetch(`${base}/deal_stages?token=${token}`, { headers: h });
  if (!r.ok) throw new Error(`RD Station ${r.status}: token inválido ou sem permissão`);
  const d = await r.json();
  const allStages: any[] = d.deal_stages ?? [];

  if (action === "getPipelines") {
    // Retorna um pipeline único representando o funil padrão
    return { pipelines: [{ id: "default", name: "Funil de Vendas" }] };
  }
  if (action === "getStages") {
    return { stages: allStages.map((s: any) => ({ id: s._id, name: s.name })) };
  }
}

// ── Kommo ─────────────────────────────────────────────────────────────────────
async function kommo(token: string, subdomain: string, action: string, pipelineId?: string) {
  const base = `https://${subdomain}.kommo.com/api/v4`;
  const h = { Authorization: `Bearer ${token}` };
  if (action === "getPipelines") {
    const r = await fetch(`${base}/leads/pipelines`, { headers: h });
    if (!r.ok) throw new Error(`Kommo ${r.status}`);
    const d = await r.json();
    return { pipelines: (d._embedded?.pipelines ?? []).map((p: any) => ({ id: String(p.id), name: p.name })) };
  }
  if (action === "getStages") {
    const r = await fetch(`${base}/leads/pipelines/${pipelineId}`, { headers: h });
    if (!r.ok) throw new Error(`Kommo ${r.status}`);
    const d = await r.json();
    return { stages: (d._embedded?.statuses ?? []).map((s: any) => ({ id: String(s.id), name: s.name })) };
  }
}

// ── Pipedrive ─────────────────────────────────────────────────────────────────
async function pipedrive(token: string, action: string, pipelineId?: string) {
  const base = "https://api.pipedrive.com/v1";
  if (action === "getPipelines") {
    const r = await fetch(`${base}/pipelines?api_token=${token}`);
    if (!r.ok) throw new Error(`Pipedrive ${r.status}`);
    const d = await r.json();
    return { pipelines: (d.data ?? []).map((p: any) => ({ id: String(p.id), name: p.name })) };
  }
  if (action === "getStages") {
    const r = await fetch(`${base}/stages?pipeline_id=${pipelineId}&api_token=${token}`);
    if (!r.ok) throw new Error(`Pipedrive ${r.status}`);
    const d = await r.json();
    return { stages: (d.data ?? []).map((s: any) => ({ id: String(s.id), name: s.name })) };
  }
}

// ── HubSpot ───────────────────────────────────────────────────────────────────
async function hubspot(token: string, action: string, pipelineId?: string) {
  const base = "https://api.hubapi.com";
  const h = { Authorization: `Bearer ${token}` };
  if (action === "getPipelines") {
    const r = await fetch(`${base}/crm/v3/pipelines/deals`, { headers: h });
    if (!r.ok) throw new Error(`HubSpot ${r.status}`);
    const d = await r.json();
    return { pipelines: (d.results ?? []).map((p: any) => ({ id: p.id, name: p.label })) };
  }
  if (action === "getStages") {
    const r = await fetch(`${base}/crm/v3/pipelines/deals/${pipelineId}/stages`, { headers: h });
    if (!r.ok) throw new Error(`HubSpot ${r.status}`);
    const d = await r.json();
    return { stages: (d.results ?? []).map((s: any) => ({ id: s.id, name: s.label })) };
  }
}

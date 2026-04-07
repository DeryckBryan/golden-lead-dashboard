import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Client } from "@/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, razao_social, nome_fantasia, cnpj, status, segmento, email_comercial, whatsapp, briefing_token, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setClients(data as Client[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, refetch: fetchClients };
}

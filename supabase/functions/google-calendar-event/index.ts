import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { refresh_token, evento } = await req.json()

  if (!refresh_token || !evento) {
    return new Response(JSON.stringify({ error: 'refresh_token e evento são obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Trocar refresh_token por access_token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token,
      grant_type:    'refresh_token',
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return new Response(JSON.stringify({ error: 'Falha ao obter access_token', detail: tokenData }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Criar evento no Google Calendar
  const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(evento),
  })

  const calData = await calRes.json()

  return new Response(JSON.stringify(calData), {
    status: calRes.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

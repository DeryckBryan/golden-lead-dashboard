import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { refresh_token, timeMin, timeMax } = await req.json()

  if (!refresh_token || !timeMin || !timeMax) {
    return new Response(JSON.stringify({ error: 'refresh_token, timeMin e timeMax são obrigatórios' }), {
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

  // Verificar free/busy no Google Calendar
  const freebusyRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: 'primary' }],
    }),
  })

  const freebusyData = await freebusyRes.json()
  const busySlots = freebusyData?.calendars?.primary?.busy || []
  const busy = busySlots.length > 0

  return new Response(JSON.stringify({ busy, busySlots }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

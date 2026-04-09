import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const url = new URL(req.url)
  const code      = url.searchParams.get('code')
  const state     = url.searchParams.get('state')   // client_id
  const error     = url.searchParams.get('error')

  const DASHBOARD_URL       = Deno.env.get('DASHBOARD_URL')!
  const GOOGLE_CLIENT_ID    = Deno.env.get('GOOGLE_CLIENT_ID')!
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
  const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const redirectBase = `${DASHBOARD_URL}?google_auth=`

  if (error || !code || !state) {
    return Response.redirect(`${redirectBase}error`, 302)
  }

  // Trocar o code pelo refresh_token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  `${SUPABASE_URL}/functions/v1/google-calendar-callback`,
      grant_type:    'authorization_code',
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.refresh_token) {
    console.error('Token exchange failed:', tokenData)
    return Response.redirect(`${redirectBase}error`, 302)
  }

  // Salvar refresh_token no Supabase vinculado ao client_id (state)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { error: dbError } = await supabase
    .from('client_actions')
    .update({ google_refresh_token: tokenData.refresh_token })
    .eq('client_id', state)

  if (dbError) {
    console.error('Supabase update failed:', dbError)
    return Response.redirect(`${redirectBase}error`, 302)
  }

  return Response.redirect(`${redirectBase}success&client_id=${state}`, 302)
})

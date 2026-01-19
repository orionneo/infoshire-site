import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const sbUrl = Deno.env.get('SB_URL')
    const sbServiceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')

    if (!sbUrl || !sbServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing SB_URL or SB_SERVICE_ROLE_KEY (set secrets in Supabase)',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(sbUrl, sbServiceKey)

// Place ID da Infoshire Games (obrigatório via secret PLACE_ID)
const PLACE_ID = Deno.env.get('PLACE_ID');
if (!PLACE_ID) {
  return new Response(
    JSON.stringify({ success: false, error: 'PLACE_ID not configured' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const CACHE_HOURS = 12

    // busca cache
    const { data: cached, error: cacheErr } = await supabase
      .from('google_reviews_cache')
      .select('*')
      .eq('place_id', PLACE_ID)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!cacheErr && cached) {
      const ageMs = Date.now() - new Date(cached.cached_at).getTime()
      const ageHours = ageMs / (1000 * 60 * 60)

      if (ageHours < CACHE_HOURS) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              rating: cached.rating,
              user_ratings_total: cached.user_ratings_total,
              reviews: cached.reviews,
            },
            cached: true,
            cache_age_hours: Number(ageHours.toFixed(2)),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // sem Google key: devolve exemplo
    if (!googleApiKey) {
      const exampleData = {
        rating: 4.8,
        user_ratings_total: 127,
        reviews: [
          {
            author_name: 'Carlos Silva',
            rating: 5,
            text: 'Excelente atendimento! Consertaram meu PlayStation 5 rapidamente e com preço justo. Recomendo!',
            time: Math.floor(Date.now() / 1000) - 86400 * 14,
            profile_photo_url: '',
          },
          {
            author_name: 'Maria Santos',
            rating: 5,
            text: 'Profissionais muito competentes. Recuperaram dados do meu notebook que outros disseram ser impossível. Muito obrigada!',
            time: Math.floor(Date.now() / 1000) - 86400 * 30,
            profile_photo_url: '',
          },
        ],
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: exampleData,
          cached: false,
          note: 'Example data (set GOOGLE_PLACES_API_KEY to fetch real reviews)',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Places details (legacy endpoint)
    const placeDetailsUrl =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(PLACE_ID)}` +
      `&fields=rating,user_ratings_total,reviews` +
      `&key=${encodeURIComponent(googleApiKey)}` +
      `&language=pt-BR`

    const googleRes = await fetch(placeDetailsUrl)
    const googleJson = await googleRes.json()

    if (googleJson.status !== 'OK') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Google API Error: ${googleJson.status}`,
          details: googleJson,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = googleJson.result

    // salva cache
    await supabase.from('google_reviews_cache').insert({
      place_id: PLACE_ID,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      reviews: result.reviews || [],
      cached_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          reviews: result.reviews || [],
        },
        cached: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
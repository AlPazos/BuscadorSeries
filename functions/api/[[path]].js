// Pages Function: proxy hacia la API de TMDB.
// Cloudflare sirve esta función en /api/* y reenvía la petición a TMDB
// añadiendo la API key, que vive como variable de entorno del servidor
// (TMDB_API_KEY en el panel de Cloudflare) y nunca llega al navegador.
const TMDB_BASE = 'https://api.themoviedb.org/3'

export async function onRequestGet({ request, params, env }) {
  // [[path]] captura los segmentos de la ruta como array: /api/tv/123 → ['tv', '123']
  const target = new URL(`${TMDB_BASE}/${params.path.join('/')}`)

  // conservamos los query params del cliente (query, language...) y añadimos la key
  const incoming = new URL(request.url)
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value))
  target.searchParams.set('api_key', env.TMDB_API_KEY)

  const res = await fetch(target, { headers: { Accept: 'application/json' } })

  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      // cache en el edge/navegador: 5 min es de sobra para tendencias y fichas
      'Cache-Control': 'public, max-age=300',
    },
  })
}

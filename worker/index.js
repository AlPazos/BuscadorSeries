// Worker de la app: hace de proxy hacia la API de TMDB en /api/* añadiendo
// la key (secret TMDB_API_KEY del Worker, nunca visible en el navegador)
// y sirve los assets estáticos del build para el resto de rutas.
const TMDB_BASE = 'https://api.themoviedb.org/3'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      // distingue "el secret no está configurado" de "TMDB rechaza la key"
      if (!env.TMDB_API_KEY) {
        return Response.json(
          { error: 'El secret TMDB_API_KEY no está configurado en el Worker' },
          { status: 500 }
        )
      }

      // /api/tv/123 → https://api.themoviedb.org/3/tv/123
      const target = new URL(`${TMDB_BASE}${url.pathname.slice('/api'.length)}`)

      // conservamos los query params del cliente (query, language...) y añadimos la key
      url.searchParams.forEach((value, key) => target.searchParams.set(key, value))
      target.searchParams.set('api_key', env.TMDB_API_KEY)

      const res = await fetch(target, { headers: { Accept: 'application/json' } })

      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          // cache en el edge/navegador: 5 min es de sobra para tendencias y fichas.
          // Los errores no se cachean: si no, un fallo puntual se queda pegado 5 min.
          'Cache-Control': res.ok ? 'public, max-age=300' : 'no-store',
        },
      })
    }

    // el resto de rutas: assets estáticos (con fallback SPA a index.html)
    return env.ASSETS.fetch(request)
  },
}

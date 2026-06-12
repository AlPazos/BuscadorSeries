// Worker de la app: hace de proxy hacia la API de TMDB en /api/* añadiendo
// la key (secret TMDB_API_KEY del Worker, nunca visible en el navegador),
// reenvía las rutas de la API de usuarios a la Lambda (secret API_USUARIOS_URL,
// su Function URL no se publica) y sirve los assets estáticos del resto.
const TMDB_BASE = 'https://api.themoviedb.org/3'

// Rutas que expone la API de usuarios, sin reescritura: el navegador llama
// a /favoritos y la Lambda recibe /favoritos. Se comparan con cuidado
// (=== o prefijo con barra) para no comerle rutas a la SPA por accidente.
const esRutaDeUsuario = (pathname) =>
  pathname.startsWith('/auth/') ||
  pathname === '/favoritos' ||
  pathname.startsWith('/favoritos/') ||
  pathname === '/preferencias'

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

    if (esRutaDeUsuario(url.pathname)) {
      if (!env.API_USUARIOS_URL) {
        return Response.json(
          { error: 'El secret API_USUARIOS_URL no está configurado en el Worker' },
          { status: 500 }
        )
      }

      // misma ruta y query, pero sobre la Function URL de la Lambda
      const target = new URL(url.pathname + url.search, env.API_USUARIOS_URL)

      // reenviamos solo lo que la API necesita (token y tipo del body);
      // el resto de cabeceras del navegador no le aporta nada
      const headers = new Headers({ Accept: 'application/json' })
      for (const nombre of ['Authorization', 'Content-Type']) {
        const valor = request.headers.get(nombre)
        if (valor) headers.set(nombre, valor)
      }

      const res = await fetch(target, {
        method: request.method,
        headers,
        body: request.body,
      })

      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          // datos de cuentas: nunca cachear, ni en el edge ni en el navegador
          'Cache-Control': 'no-store',
        },
      })
    }

    // el resto de rutas: assets estáticos (con fallback SPA a index.html)
    return env.ASSETS.fetch(request)
  },
}

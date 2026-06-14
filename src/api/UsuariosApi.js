// Cliente de la API de usuarios (cuentas, favoritos y preferencias).
// Las rutas son relativas (/auth/*, /favoritos, /preferencias) porque van
// al mismo origen: el Worker las reenvía a la Lambda en producción y el
// proxy de Vite en desarrollo, así que la URL real nunca está en el bundle.
// La API devuelve los errores como {error: "mensaje"}; aquí los convertimos
// en ApiError para que la UI pueda enseñar ese mensaje tal cual.

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status // código HTTP, por si la UI quiere distinguir (401, 409...)
  }
}

export class UsuariosApi {
  // Token JWT de la sesión actual (lo fija el AuthContext al entrar/salir).
  // Mientras esté puesto, todas las peticiones llevan Authorization: Bearer.
  token = null

  // baseUrl vacío = mismo origen; se puede pasar otro para probar fuera del navegador
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  // Petición genérica: serializa el body, añade el token y traduce errores
  async #request(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (this.token) headers.Authorization = `Bearer ${this.token}`

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (res.status === 204) return null // DELETE correcto: respuesta sin body

    // el body puede no ser JSON válido (p. ej. el 401 sin token llega vacío)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new ApiError(data?.error ?? `Error ${res.status}`, res.status)
    }
    return data
  }

  // --- cuentas ---

  // → {id, email, nombre}; 400 datos inválidos (password < 8), 409 email ya registrado
  registro({ email, password, nombre }) {
    return this.#request('/auth/registro', {
      method: 'POST',
      body: { email, password, nombre },
    })
  }

  // → {token, expiraEnSegundos}; 401 con mensaje genérico si falla
  login({ email, password }) {
    return this.#request('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  }

  // datos del usuario de la sesión → {id, email, nombre, creadoEn}; 401 sin token
  getPerfil() {
    return this.#request('/auth/perfil')
  }

  // --- favoritos (requieren sesión) ---

  // → [{id, tmdbId, tipo, anadidoEn}] del usuario, más recientes primero
  getFavoritos() {
    return this.#request('/favoritos')
  }

  // tipo: "pelicula" | "serie" → el favorito creado; 409 si ya existía
  addFavorito({ tmdbId, tipo }) {
    return this.#request('/favoritos', { method: 'POST', body: { tmdbId, tipo } })
  }

  // id: el del favorito (no el de TMDB) → null; 404 si no existe o no es tuyo
  borrarFavorito(id) {
    return this.#request(`/favoritos/${id}`, { method: 'DELETE' })
  }

  // --- preferencias (requieren sesión) ---

  // → {tema, idioma} ("sistema"/"es" por defecto, creadas en el registro)
  getPreferencias() {
    return this.#request('/preferencias')
  }

  // ambos campos obligatorios → lo guardado; 400 si algo es inválido
  guardarPreferencias({ tema, idioma }) {
    return this.#request('/preferencias', { method: 'PUT', body: { tema, idioma } })
  }
}

export default UsuariosApi

// Favoritos del usuario compartidos con toda la app vía Context (mismo patrón
// que AuthContext): la lista se carga una vez al iniciar sesión y todos los
// corazones (Card, Detail) la consultan, en vez de preguntar cada uno a la API.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

// traduce el type de TMDB al tipo de nuestra API; lo que no esté aquí
// (episodios, etc.) no se puede guardar como favorito
const TIPO_API = { movie: 'pelicula', tv: 'serie' }

const FavoritosContext = createContext(null)

// `alPedirSesion` se llama si alguien toca un corazón sin sesión (abre el login)
export function FavoritosProvider({ alPedirSesion, children }) {
  const { usuario, api } = useAuth()

  // La lista se guarda junto con DE QUIÉN es: así, al cerrar sesión o cambiar
  // de usuario no hay que vaciarla a mano (eso sería un setState síncrono en
  // un efecto, que React desaconseja) — simplemente deja de "valer" y la
  // derivación de abajo devuelve []. lista: [{id, tmdbId, tipo, anadidoEn}]
  const [cargados, setCargados] = useState({ de: null, lista: [] })
  // si la carga falla se apunta DE QUIÉN falló (mismo patrón que cargados:
  // así un error viejo no contamina a otro usuario) y un contador de
  // reintentos que relanza el efecto al pulsarse "Reintentar"
  const [carga, setCarga] = useState({ intento: 0, fallo: null })

  // al iniciar sesión (o reintentar) se cargan los favoritos del usuario
  useEffect(() => {
    if (!usuario) return
    let cancelado = false // si el efecto se limpia antes de llegar la respuesta, se ignora
    api
      .getFavoritos()
      .then((lista) => !cancelado && setCargados({ de: usuario.email, lista }))
      // sin esto, un fallo (red, Lambda caída...) dejaría la app eternamente
      // en "Cargando…": hay que poder avisar y ofrecer reintentarlo
      .catch(() => !cancelado && setCarga((c) => ({ ...c, fallo: usuario.email })))
    return () => {
      cancelado = true
    }
  }, [usuario, api, carga.intento])

  // la lista solo cuenta si pertenece al usuario actual (useMemo: que el []
  // de "sin sesión" no sea un array nuevo en cada render)
  const favoritos = useMemo(
    () => (usuario && cargados.de === usuario.email ? cargados.lista : []),
    [usuario, cargados]
  )

  // ¿Se sabe ya la verdad? Sin sesión sí (no hay nada que cargar: ningún
  // corazón está marcado); con sesión, solo cuando la lista ya llegó. Los
  // corazones NO se pintan hasta que esto sea true, para no enseñar un
  // "no es favorito" provisional que medio segundo después cambia.
  const cargado = !usuario || cargados.de === usuario.email

  // hubo un fallo cargando los favoritos DEL USUARIO ACTUAL y seguimos sin lista
  const errorCarga = !cargado && carga.fallo === usuario?.email

  // Todo el value dentro de un useMemo: si no, sería un objeto NUEVO en cada
  // render del provider y React re-renderizaría a todos los consumidores
  // (cada corazón de la pantalla) aunque los favoritos no hubieran cambiado
  // — por ejemplo, con cada tecla del buscador. Así solo se re-renderizan
  // cuando los favoritos cambian de verdad.
  const value = useMemo(() => {
    // índice "tipo:tmdbId" → favorito, para que cada corazón consulte en O(1)
    const porClave = new Map()
    for (const f of favoritos) porClave.set(`${f.tipo}:${f.tmdbId}`, f)

    const buscar = (title) => porClave.get(`${TIPO_API[title.type]}:${title.id}`)

    // actualiza la lista del usuario actual a partir de la anterior
    const guardar = (cambio) =>
      setCargados((c) => ({
        de: usuario.email,
        lista: cambio(c.de === usuario.email ? c.lista : []),
      }))

    // añade o quita el title según esté ya guardado o no
    const toggleFavorito = async (title) => {
      if (!usuario) {
        alPedirSesion?.()
        return
      }
      const tipo = TIPO_API[title.type]
      if (!tipo) return

      const existente = buscar(title)
      if (existente?.pendiente) return // aún viaja el alta de este mismo title: ignorar

      // Actualización OPTIMISTA: el corazón cambia al instante, sin esperar el
      // viaje a la Lambda (~0,6s en caliente); si la API luego falla, el catch
      // recarga la lista real y la UI vuelve sola a la verdad.
      try {
        if (existente) {
          guardar((lista) => lista.filter((f) => f.id !== existente.id))
          await api.borrarFavorito(existente.id)
        } else {
          // entra ya con un favorito provisional; al responder la API se
          // sustituye por el real (con el id que asigna la base de datos)
          const provisional = { id: `pendiente-${tipo}-${title.id}`, tmdbId: title.id, tipo, pendiente: true }
          guardar((lista) => [provisional, ...lista])
          const creado = await api.addFavorito({ tmdbId: title.id, tipo })
          guardar((lista) => lista.map((f) => (f.id === provisional.id ? creado : f)))
        }
      } catch {
        // desincronización (red caída, 409 ya existía, 404 ya borrado...): en
        // vez de adivinar, recargamos la verdad del servidor
        api.getFavoritos().then((lista) => guardar(() => lista)).catch(() => {})
      }
    }

    return {
      favoritos, // la lista entera, para la vista "mis favoritos"
      cargado,
      errorCarga,
      reintentarCarga: () => setCarga((c) => ({ intento: c.intento + 1, fallo: null })),
      esFavorito: (title) => Boolean(buscar(title)),
      sePuedeGuardar: (title) => Boolean(TIPO_API[title.type]),
      toggleFavorito,
    }
  }, [favoritos, cargado, errorCarga, usuario, api, alPedirSesion])

  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook y provider van juntos a propósito
export function useFavoritos() {
  const ctx = useContext(FavoritosContext)
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>')
  return ctx
}

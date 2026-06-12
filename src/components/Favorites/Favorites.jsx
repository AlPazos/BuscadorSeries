import { useEffect, useState } from 'react'
import Card from '../Card/Card.jsx'
import { TmdbApi } from '../../api/TmdbApi.js'
import { useFavoritos } from '../../favoritos/FavoritosContext.jsx'
import './Favorites.css'

const tmdb = new TmdbApi()

// nuestra API guarda el tipo como "pelicula"/"serie"; TMDB espera "movie"/"tv"
const TIPO_TMDB = { pelicula: 'movie', serie: 'tv' }

// Caché de títulos ya pedidos a TMDB (vive lo que la pestaña). Sin ella,
// cada cambio en la lista relanzaba una petición POR CADA favorito restante
// (quitar 1 corazón con 50 favoritos = 49 peticiones). Se guarda la promesa,
// no el resultado: así dos peticiones simultáneas del mismo título también
// se deduplican. Los fallos se borran de la caché para poder reintentarlos.
const cacheTitles = new Map() // "tipo:tmdbId" → Promise<title | null>

const pedirTitle = (favorito) => {
  const clave = `${favorito.tipo}:${favorito.tmdbId}`
  if (!cacheTitles.has(clave)) {
    const promesa = tmdb.getTitle(favorito.tmdbId, TIPO_TMDB[favorito.tipo]).catch(() => {
      cacheTitles.delete(clave)
      return null // si uno falla, no tumba al resto
    })
    cacheTitles.set(clave, promesa)
  }
  return cacheTitles.get(clave)
}

// Vista "Mis favoritos": la API de usuarios solo guarda {tmdbId, tipo}, así
// que aquí se piden a TMDB los datos frescos de cada título (el catálogo no
// se almacena: es una decisión de diseño del proyecto).
function Favorites({ onSelect }) {
  const { favoritos, cargado, errorCarga, reintentarCarga, esFavorito } = useFavoritos()
  const [titles, setTitles] = useState(null) // null = cargando todavía

  useEffect(() => {
    // hasta que la lista de favoritos no haya llegado de la API no se pide
    // nada a TMDB: si no, la primera pasada (lista vacía provisional) dejaría
    // titles=[] y se vería un "aún no tienes favoritos" falso
    if (!cargado) return
    let cancelado = false
    Promise.all(favoritos.map(pedirTitle)).then(
      (lista) => !cancelado && setTitles(lista.filter(Boolean))
    )
    return () => {
      cancelado = true
    }
  }, [favoritos, cargado])

  if (errorCarga) {
    return (
      <p className="favorites-aviso">
        No se han podido cargar tus favoritos.{' '}
        <button className="boton-reintentar" onClick={reintentarCarga}>
          Reintentar
        </button>
      </p>
    )
  }

  if (!cargado || titles === null) {
    return <p className="favorites-aviso">Cargando tus favoritos…</p>
  }

  // el filtro hace que al quitar un corazón la card desaparezca al instante,
  // sin esperar a que el efecto de arriba recargue la lista de TMDB
  const visibles = titles.filter((t) => esFavorito(t))

  if (visibles.length === 0) {
    return (
      <p className="favorites-aviso">
        Aún no tienes favoritos. Toca el corazón de cualquier título para guardarlo aquí.
      </p>
    )
  }

  return (
    <>
      <h2 className="favorites-titulo">Mis favoritos</h2>
      <div className="cards-grid">
        {visibles.map((t) => (
          <Card key={`${t.type}-${t.id}`} title={t} onClick={onSelect} />
        ))}
      </div>
    </>
  )
}

export default Favorites

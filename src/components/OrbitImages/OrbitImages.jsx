import { useEffect, useState } from 'react'
import { TmdbApi } from '../../api/TmdbApi.js'
import './OrbitImages.css'

const tmdb = new TmdbApi()

// caché a nivel de módulo: los pósters se piden una vez por pestaña, no cada
// vez que se vacía el buscador
let cachePosters = null

// Estado vacío del buscador: unos pósters recomendados (tendencias de TMDB)
// girando en órbita elíptica alrededor del texto "Descubre nuevos títulos".
// Decorativo (los pósters son aria-hidden).
function OrbitImages() {
  const [posters, setPosters] = useState(cachePosters ?? [])
  // cuántas imágenes han terminado de cargar: hasta que no estén todas, no se
  // muestra nada (ni el texto), para que no aparezca el texto "suelto" primero
  const [cargadas, setCargadas] = useState(0)

  useEffect(() => {
    if (cachePosters) return
    let cancelado = false
    tmdb
      .getTrending('all')
      .then((lista) => {
        const imgs = lista
          .map((t) => t.image)
          .filter(Boolean)
          .slice(0, 9)
        cachePosters = imgs
        if (!cancelado) setPosters(imgs)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [])

  const listo = posters.length > 0 && cargadas >= posters.length
  // cuenta una imagen como "resuelta" tanto si carga como si falla, para no
  // quedarnos esperando para siempre por un póster roto
  const alResolver = () => setCargadas((n) => n + 1)

  return (
    <div className={`orbit${listo ? ' orbit--listo' : ''}`}>
      <div className="orbit-centro">
        <p className="orbit-texto neon-text">Descubre nuevos títulos</p>
      </div>

      {posters.map((src, i) => (
        <div
          key={src}
          className="orbit-item"
          aria-hidden="true"
          style={{ '--base': `${(360 / posters.length) * i}deg` }}
        >
          <img src={src} alt="" onLoad={alResolver} onError={alResolver} />
        </div>
      ))}
    </div>
  )
}

export default OrbitImages

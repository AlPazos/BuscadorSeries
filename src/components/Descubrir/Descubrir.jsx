import { useEffect, useRef, useState } from 'react'
import BlurText from '../BlurText/BlurText.jsx'
import TipoToggle from '../TipoToggle/TipoToggle.jsx'
import Card from '../Card/Card.jsx'
import { TmdbApi } from '../../api/TmdbApi.js'
import './Descubrir.css'

const tmdb = new TmdbApi()

// Géneros populares por tipo. Ojo: las películas y las series tienen LISTAS
// DE GÉNEROS DISTINTAS en TMDB (p. ej. en series no hay "Aventura" suelta sino
// "Acción y aventura"), por eso van separadas.
const GENEROS_PELICULA = [
  { id: 28, nombre: 'Acción' },
  { id: 35, nombre: 'Comedia' },
  { id: 27, nombre: 'Terror' },
  { id: 878, nombre: 'Ciencia ficción' },
  { id: 18, nombre: 'Drama' },
  { id: 12, nombre: 'Aventura' },
  { id: 53, nombre: 'Suspense' },
  { id: 16, nombre: 'Animación' },
]

const GENEROS_SERIE = [
  { id: 10759, nombre: 'Acción y aventura' },
  { id: 35, nombre: 'Comedia' },
  { id: 18, nombre: 'Drama' },
  { id: 80, nombre: 'Crimen' },
  { id: 10765, nombre: 'Ciencia ficción y fantasía' },
  { id: 16, nombre: 'Animación' },
  { id: 9648, nombre: 'Misterio' },
  { id: 99, nombre: 'Documental' },
]

// Una fila horizontal (estilo Netflix): título + carrusel de cards. Si no hay
// títulos, no pinta nada (un género puede venir vacío).
function Fila({ titulo, titles, onSelect }) {
  const scrollRef = useRef(null)

  // mueve el carrusel una "página" (casi el ancho visible). En bucle: al pasar
  // del final vuelve al principio y al revés. El scroll del usuario está
  // desactivado por CSS (overflow:hidden), pero scrollTo/scrollBy sí funcionan.
  const mover = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const comportamiento = suave ? 'smooth' : 'auto'
    const paso = el.clientWidth * 0.9

    if (dir > 0) {
      const enElFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
      if (enElFinal) el.scrollTo({ left: 0, behavior: comportamiento })
      else el.scrollBy({ left: paso, behavior: comportamiento })
    } else {
      const enElInicio = el.scrollLeft <= 2
      if (enElInicio) el.scrollTo({ left: el.scrollWidth, behavior: comportamiento })
      else el.scrollBy({ left: -paso, behavior: comportamiento })
    }
  }

  if (!titles || titles.length === 0) return null
  return (
    <section className="fila">
      <h3 className="fila-titulo">{titulo}</h3>
      <div className="fila-carrusel">
        <button
          type="button"
          className="fila-flecha fila-flecha--prev"
          onClick={() => mover(-1)}
          aria-label="Anteriores"
        >
          <span className="fila-flecha-icono">‹</span>
        </button>

        <div className="fila-scroll" ref={scrollRef}>
          {titles.map((t, i) => (
            <Card key={`${t.type}-${t.id}`} title={t} index={i} onClick={onSelect} />
          ))}
        </div>

        <button
          type="button"
          className="fila-flecha fila-flecha--next"
          onClick={() => mover(1)}
          aria-label="Siguientes"
        >
          <span className="fila-flecha-icono">›</span>
        </button>
      </div>
    </section>
  )
}

// Pantalla "Descubrir": sin buscador. Un toggle Películas/Series cambia todo el
// contenido; arriba las tendencias del tipo elegido y debajo una fila por
// género popular. Cada fila se pide a TMDB (tendencias + discover por género).
function Descubrir({ onSelect }) {
  const [tipo, setTipo] = useState('movie') // 'movie' | 'tv'
  // datos cacheados por tipo: { movie: {tendencias, filas}, tv: {...} }. Así
  // alternar a un tipo ya visto es instantáneo y "cargando" se deriva (no hace
  // falta un setState síncrono en el efecto).
  const [datos, setDatos] = useState({})

  useEffect(() => {
    if (datos[tipo]) return // ese tipo ya está cargado
    let cancelado = false
    const generos = tipo === 'movie' ? GENEROS_PELICULA : GENEROS_SERIE

    Promise.all([
      tmdb.getTrending(tipo).catch(() => []),
      ...generos.map((g) => tmdb.getByGenre(tipo, g.id).catch(() => [])),
    ]).then(([tend, ...resto]) => {
      if (cancelado) return
      setDatos((prev) => ({
        ...prev,
        [tipo]: {
          tendencias: tend,
          filas: generos.map((g, i) => ({ nombre: g.nombre, titles: resto[i] })),
        },
      }))
    })

    return () => {
      cancelado = true
    }
  }, [tipo, datos])

  const actual = datos[tipo]

  return (
    <div className="descubrir">
      <BlurText
        as="h1"
        className="vista-titulo"
        text="Descubrir"
        animateBy="letters"
        direction="top"
        delay={60}
      />

      {/* toolbox: cambia entre películas y series */}
      <TipoToggle valor={tipo} onCambiar={setTipo} />

      {!actual ? (
        <p className="aviso-cargando">Cargando…</p>
      ) : (
        <>
          <Fila titulo="Tendencias" titles={actual.tendencias} onSelect={onSelect} />
          {actual.filas.map((f) => (
            <Fila key={f.nombre} titulo={f.nombre} titles={f.titles} onSelect={onSelect} />
          ))}
        </>
      )}
    </div>
  )
}

export default Descubrir

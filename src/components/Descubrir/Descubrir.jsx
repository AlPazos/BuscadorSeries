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

  // nº de títulos reales (las cards se renderizan 3 veces para el bucle infinito)
  const n = titles ? titles.length : 0

  // Reposiciona el scroll a la "copia" central. INSTANTÁNEO (behavior:'instant')
  // a propósito: como las 3 copias son idénticas, saltar un ancho de copia es
  // invisible y da sensación de carrusel infinito en ambos sentidos. Si no fuera
  // instantáneo, el scroll-behavior:smooth del CSS animaría el salto y se vería
  // (era el "comportamiento raro"). El ancho de una copia (setW) se mide en el
  // DOM (distancia entre la 1ª card de la copia 1 y la de la copia 2), exacta
  // pese a gaps y padding.
  const normalizar = () => {
    const el = scrollRef.current
    if (!el || n === 0) return
    const kids = el.children
    if (kids.length < n + 1) return
    const setW = kids[n].offsetLeft - kids[0].offsetLeft
    if (setW <= 0) return
    let sl = el.scrollLeft
    while (sl >= 2 * setW) sl -= setW
    while (sl < setW) sl += setW
    if (Math.abs(sl - el.scrollLeft) > 0.5) el.scrollTo({ left: sl, behavior: 'instant' })
  }

  // posición inicial en la copia central (instantánea, sin animar al cargar)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || n === 0) return
    const kids = el.children
    if (kids.length < n + 1) return
    const setW = kids[n].offsetLeft - kids[0].offsetLeft
    if (setW > 0) el.scrollTo({ left: setW, behavior: 'instant' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titles])

  // Inclinación de las cards SEGÚN LA VELOCIDAD Y EL SENTIDO del scroll. Vale
  // tanto para las flechas (scroll suave programático) como para el ARRASTRE
  // TÁCTIL en móvil: ambos disparan eventos 'scroll'. Se escribe en la variable
  // CSS --tilt del contenedor (un único write por evento; las cards la heredan).
  // Al parar el scroll se endereza (0) y se reposiciona el bucle. El
  // reposicionado se hace SIEMPRE (aunque haya reduce-motion); la inclinación,
  // solo si el usuario no pidió reducir movimiento.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const conMovimiento = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const MAX = 7 // grados máximos de inclinación
    const K = 1.6 // factor px/ms → grados
    let ultimoSL = el.scrollLeft
    let ultimoT = performance.now()
    let pausa = null

    const enderezar = () => {
      if (conMovimiento) el.style.setProperty('--tilt', '0deg')
      normalizar()
      ultimoSL = el.scrollLeft // el salto del reposicionado no cuenta como velocidad
    }

    const alHacerScroll = () => {
      const ahora = performance.now()
      const dt = ahora - ultimoT
      const dx = el.scrollLeft - ultimoSL
      ultimoSL = el.scrollLeft
      ultimoT = ahora
      // dt acotado: ignora el primer evento tras una pausa larga y el salto
      // instantáneo del reposicionado (que daría una velocidad falsa enorme)
      if (conMovimiento && dt > 0 && dt < 200) {
        const ang = Math.max(-MAX, Math.min(MAX, (dx / dt) * K))
        el.style.setProperty('--tilt', `${ang.toFixed(2)}deg`)
      }
      // respaldo de 'scrollend' (no todos los navegadores lo disparan):
      // enderezar 140 ms después del último evento de scroll
      clearTimeout(pausa)
      pausa = setTimeout(enderezar, 140)
    }

    el.addEventListener('scroll', alHacerScroll, { passive: true })
    el.addEventListener('scrollend', enderezar)
    return () => {
      el.removeEventListener('scroll', alHacerScroll)
      el.removeEventListener('scrollend', enderezar)
      clearTimeout(pausa)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // mover una "página" con las flechas. El scroll suave genera la velocidad que
  // inclina las cards; normalizar() (vía scrollend/respaldo) cierra el bucle.
  const mover = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: suave ? 'smooth' : 'auto' })
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
          {/* 3 copias para el bucle infinito; normalizar() salta a la central */}
          {[0, 1, 2].map((copia) =>
            titles.map((t, i) => (
              // wrapper para inclinar la card sin pisar sus propias
              // transformaciones (hover, animación de entrada)
              <div className="fila-card" key={`${copia}-${t.type}-${t.id}`}>
                {/* precargadas: visibles ya (sin animación de entrada ni
                    IntersectionObserver) e imagen eager, para que el scroll del
                    carrusel no compita con animaciones de entrada ni cargas */}
                <Card title={t} index={i} onClick={onSelect} animarEntrada={false} />
              </div>
            )),
          )}
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

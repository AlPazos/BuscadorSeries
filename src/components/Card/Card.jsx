import { memo, useEffect, useRef } from 'react'
import FavoriteButton from '../FavoriteButton/FavoriteButton.jsx'
import './Card.css'

// etiqueta legible del tipo de title (TMDB usa movie/tv)
const TIPO_ETIQUETA = { movie: 'Película', tv: 'Serie' }

// Recibe un `title` normalizado por TmdbApi y muestra toda su info.
// Forma esperada: { id, type, title, originalTitle, year, image, rating, votes, plot }
// `onClick` (opcional) recibe el title al hacer clic en la card.
// `index` (opcional) escalona la animación de entrada de cada tarjeta.
// `animarEntrada=false` (p. ej. en el carrusel de Descubrir): la card se muestra
// YA, sin IntersectionObserver ni animación de entrada. Con cientos de cards
// triplicadas por el bucle infinito, revelarlas una a una mientras se hace
// scroll dispara muchas animaciones a la vez y baja el rendimiento.
function Card({ title, onClick, index = 0, animarEntrada = true }) {
  // Animación de entrada: la tarjeta arranca oculta y se revela (fundido +
  // deslizamiento) cuando entra en el viewport. Un IntersectionObserver por
  // tarjeta que se desconecta tras revelarse. Respeta prefers-reduced-motion.
  const ref = useRef(null)
  useEffect(() => {
    // sin animación de entrada: la card ya es visible (clase is-shown en el
    // render), no montamos observer ni reproducimos card-in
    if (!animarEntrada) return

    const el = ref.current
    if (!el) return

    const sinMovimiento = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (sinMovimiento) {
      el.classList.add('is-visible')
      return
    }

    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-visible')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [animarEntrada])

  if (!title) return null

  const {
    type,
    title: name,
    originalTitle,
    year,
    image,
    rating,
    votes,
    plot,
  } = title

  return (
    <article
      ref={ref}
      className={`card${onClick ? ' card--clickable' : ''}${animarEntrada ? '' : ' is-shown'}`}
      onClick={onClick ? () => onClick(title) : undefined}
      // escalonado acotado (patrón de 5) para que las tarjetas profundas
      // no acumulen retardo al revelarse
      style={{ '--d': `${(index % 5) * 60}ms` }}
    >
      {image ? (
        <div className="card-image">
          {/* lazy + decode asíncrono: abrir Descubrir no descarga de golpe las
              ~180 imágenes (incl. filas bajo el pliegue); van entrando según se
              acercan. El tirón al hacer scroll lo evitan ya el quitar la
              animación de entrada y el will-change, no el precargado. */}
          <img src={image} alt={name} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="card-image card-image--empty">Sin imagen</div>
      )}

      {/* corazón sobre la esquina del póster */}
      <FavoriteButton title={title} className="card-fav" />

      <div className="card-body">
        <h3 className="card-title">
          {name}
          {year && <span className="card-year"> ({year})</span>}
        </h3>

        {originalTitle && originalTitle !== name && (
          <p className="card-original">{originalTitle}</p>
        )}

        <div className="card-meta">
          {type && <span className="card-tag">{TIPO_ETIQUETA[type] ?? type}</span>}
          {rating != null && (
            <span className="card-rating">
              ⭐ {rating}
              {votes != null && (
                <small> ({votes.toLocaleString()} votos)</small>
              )}
            </span>
          )}
        </div>

        {plot && <p className="card-plot">{plot}</p>}
      </div>
    </article>
  )
}

// memo: React se salta el render si las props no han cambiado — así las
// teclas del buscador (que re-renderizan App entera) no repintan cada card
export default memo(Card)

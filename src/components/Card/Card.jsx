import { memo } from 'react'
import FavoriteButton from '../FavoriteButton/FavoriteButton.jsx'
import './Card.css'

// Recibe un `title` normalizado por TmdbApi y muestra toda su info.
// Forma esperada: { id, type, title, originalTitle, year, image, rating, votes, plot }
// `onClick` (opcional) recibe el title al hacer clic en la card.
function Card({ title, onClick }) {
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
      className={`card${onClick ? ' card--clickable' : ''}`}
      onClick={onClick ? () => onClick(title) : undefined}
    >
      {image ? (
        <div className="card-image">
          <img src={image} alt={name} loading="lazy" />
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
          {type && <span className="card-tag">{type}</span>}
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

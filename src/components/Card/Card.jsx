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

export default Card

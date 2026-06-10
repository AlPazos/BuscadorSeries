import { useState } from 'react'
import Seasons from '../Seasons/Seasons.jsx'
import { TmdbApi } from '../../api/TmdbApi.js'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js'
import './Detail.css'

// Convierte un episodio de TMDB a la misma forma que un title,
// para poder reutilizar este mismo Detail al mostrarlo.
function episodeToTitle(ep) {
  return {
    id: ep.id,
    type: 'episode',
    title: `${ep.episode_number}. ${ep.name}`,
    originalTitle: null,
    year: ep.air_date ? ep.air_date.slice(0, 4) : null,
    image: TmdbApi.imageUrl(ep.still_path, 'w500'),
    rating: ep.vote_average ? Number(ep.vote_average.toFixed(1)) : null,
    votes: ep.vote_count ?? null,
    plot: ep.overview || null,
  }
}

// Modal centrado con la información del title. `onBack` lo cierra.
function Detail({ title, onBack }) {
  // episodio abierto en un segundo Detail anidado (solo para series)
  const [episode, setEpisode] = useState(null)

  // mientras el modal esté abierto, el fondo no debe hacer scroll
  useBodyScrollLock()

  if (!title) return null

  const { type, title: name, originalTitle, year, image, rating, votes, plot } = title

  // los fotogramas de episodio son 16:9; los pósters, 2:3
  const isEpisode = type === 'episode'

  return (
    // Overlay: centra el panel y cierra al clicar fuera.
    // stopPropagation: si este Detail está anidado en otro, el clic no debe
    // burbujear y cerrar también el de abajo.
    <div
      className="detail-overlay"
      onClick={(e) => {
        e.stopPropagation()
        onBack()
      }}
    >
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <button className="detail-back" onClick={onBack}>
          ← Volver
        </button>

        <div className="detail-content">
          {image ? (
            <div className={`detail-image${isEpisode ? ' detail-image--wide' : ''}`}>
              <img src={image} alt={name} />
            </div>
          ) : (
            <div className="detail-image detail-image--empty">Sin imagen</div>
          )}

          <div className="detail-info">
            <h2 className="detail-title">
              {name}
              {year && <span className="detail-year"> ({year})</span>}
            </h2>

            {originalTitle && originalTitle !== name && (
              <p className="detail-original">{originalTitle}</p>
            )}

            <div className="detail-meta">
              {type && <span className="detail-tag">{type}</span>}
              {rating != null && (
                <span className="detail-rating">
                  ⭐ {rating}
                  {votes != null && <small> ({votes.toLocaleString()} votos)</small>}
                </span>
              )}
            </div>

            {plot && <p className="detail-plot">{plot}</p>}
          </div>
        </div>

        {/* temporadas/episodios solo para series */}
        {type === 'tv' && (
          <Seasons
            seriesId={title.id}
            onEpisodeClick={(ep) => setEpisode(episodeToTitle(ep))}
          />
        )}
      </div>

      {/* segundo Detail anidado con la info del episodio */}
      {episode && <Detail title={episode} onBack={() => setEpisode(null)} />}
    </div>
  )
}

export default Detail

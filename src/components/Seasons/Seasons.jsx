import { useEffect, useState } from 'react'
import { TmdbApi } from '../../api/TmdbApi.js'
import AnimatedList from '../AnimatedList/AnimatedList.jsx'
import './Seasons.css'

const tmdb = new TmdbApi()

// Lista de temporadas de una serie. Cada temporada es un panel clicable que,
// al abrirse, carga y muestra sus episodios (bajo demanda y cacheados).
// `onEpisodeClick` (opcional) recibe el episodio pulsado.
function Seasons({ seriesId, onEpisodeClick }) {
  const [seasons, setSeasons] = useState([])
  const [openSeason, setOpenSeason] = useState(null)
  const [episodes, setEpisodes] = useState({}) // { [seasonNumber]: episodes[] }

  // Carga las temporadas al montar. No hace falta resetear nada al cambiar
  // de serie: quien usa este componente le pone key={seriesId}, así que un
  // cambio de serie monta un Seasons nuevo con todo el estado a cero.
  useEffect(() => {
    let cancelado = false
    tmdb
      .getSeasons(seriesId)
      .then((lista) => !cancelado && setSeasons(lista))
      .catch(() => {}) // sin temporadas, la sección simplemente no se muestra
    return () => {
      cancelado = true
    }
  }, [seriesId])

  const toggleSeason = async (seasonNumber) => {
    // si ya está abierta, la cerramos
    if (openSeason === seasonNumber) {
      setOpenSeason(null)
      return
    }
    setOpenSeason(seasonNumber)

    // cargamos los episodios solo la primera vez
    if (!episodes[seasonNumber]) {
      const data = await tmdb.getSeason(seriesId, seasonNumber)
      setEpisodes((prev) => ({ ...prev, [seasonNumber]: data.episodes ?? [] }))
    }
  }

  if (!seasons.length) return null

  return (
    <section className="seasons">
      <h3 className="seasons-title">Temporadas</h3>

      <div className="seasons-list">
        {seasons.map((season) => {
          const isOpen = openSeason === season.season_number
          const eps = episodes[season.season_number]

          return (
            <div key={season.id} className={`season${isOpen ? ' season--open' : ''}`}>
              <button
                className="season-head"
                onClick={() => toggleSeason(season.season_number)}
              >
                <span className="season-name">{season.name}</span>
                <span className="season-count">{season.episode_count} episodios</span>
                <span className="season-arrow">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen &&
                (eps == null ? (
                  <p className="episode-loading">Cargando episodios…</p>
                ) : (
                  <AnimatedList className="episodes">
                    {eps.map((ep) => {
                      const still = TmdbApi.imageUrl(ep.still_path, 'w300')
                      return (
                        <div
                          key={ep.id}
                          className={`episode${onEpisodeClick ? ' episode--clickable' : ''}`}
                          onClick={onEpisodeClick ? () => onEpisodeClick(ep) : undefined}
                        >
                          {still ? (
                            <img className="episode-still" src={still} alt={ep.name} loading="lazy" />
                          ) : (
                            <div className="episode-still episode-still--empty" />
                          )}

                          <div className="episode-info">
                            <span className="episode-name">
                              {ep.episode_number}. {ep.name}
                            </span>
                            {ep.air_date && <span className="episode-date">{ep.air_date}</span>}
                            {ep.overview && <p className="episode-overview">{ep.overview}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </AnimatedList>
                ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Seasons

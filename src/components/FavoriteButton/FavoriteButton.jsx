import { useFavoritos } from '../../favoritos/FavoritosContext.jsx'
import './FavoriteButton.css'

// Corazón para guardar/quitar un title de favoritos. Se autoexcluye si el
// title no se puede guardar (episodios) y, sobre todo, mientras la lista de
// favoritos aún viaja desde la API: antes de saber la verdad no se pinta
// nada, nunca un corazón vacío que medio segundo después "se enciende".
// El posicionamiento lo decide quien lo usa vía `className`.
// `withLabel`: además del corazón, muestra un texto al lado y se pinta como
// botón-píldora (en el Detail, donde hay sitio y el icono solo no se entiende).
function FavoriteButton({ title, className = '', withLabel = false }) {
  const { cargado, esFavorito, sePuedeGuardar, toggleFavorito } = useFavoritos()

  if (!title || !cargado || !sePuedeGuardar(title)) return null

  const marcado = esFavorito(title)
  const etiqueta = marcado ? 'Quitar de favoritos' : 'Añadir a favoritos'
  // texto visible (afirmativo cuando ya está guardado)
  const textoVisible = marcado ? 'En favoritos' : 'Añadir a favoritos'

  return (
    <button
      type="button"
      className={`favorite-button${marcado ? ' favorite-button--on' : ''}${
        withLabel ? ' favorite-button--label' : ''
      } ${className}`}
      // stopPropagation: sobre una Card clicable, el clic no debe abrir el Detail
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorito(title)
      }}
      aria-label={etiqueta}
      aria-pressed={marcado}
      title={etiqueta}
    >
      <svg
        viewBox="0 0 24 24"
        fill={marcado ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {withLabel && <span className="favorite-button-label">{textoVisible}</span>}
    </button>
  )
}

export default FavoriteButton

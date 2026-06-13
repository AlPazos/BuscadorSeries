import './TipoToggle.css'

// Toggle reutilizable Películas / Series ("toolbox"). Controlado: recibe el
// valor ('movie' | 'tv') y avisa de los cambios con onCambiar. Se usa en
// Descubrir y en Mis favoritos.
function TipoToggle({ valor, onCambiar }) {
  return (
    <div className="tipo-toggle" role="group" aria-label="Tipo de contenido">
      <button
        type="button"
        className={`tipo-toggle-opcion${valor === 'movie' ? ' activo' : ''}`}
        onClick={() => onCambiar('movie')}
        aria-pressed={valor === 'movie'}
      >
        Películas
      </button>
      <button
        type="button"
        className={`tipo-toggle-opcion${valor === 'tv' ? ' activo' : ''}`}
        onClick={() => onCambiar('tv')}
        aria-pressed={valor === 'tv'}
      >
        Series
      </button>
      {/* fondo deslizante que marca la opción activa */}
      <span className={`tipo-toggle-marca ${valor}`} aria-hidden="true" />
    </div>
  )
}

export default TipoToggle

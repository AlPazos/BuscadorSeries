import './SearchBar.css'

// Buscador en forma de píldora glass: lupa a la izquierda, input en el medio
// y botón de borrar (✕) cuando hay texto. Es presentacional: recibe el valor y
// avisa de los cambios con `onChange` (recibe la cadena nueva, no el evento).
function SearchBar({ value, onChange, placeholder = 'Buscar…' }) {
  return (
    <div className="searchbar">
      {/* lupa decorativa */}
      <svg
        className="searchbar-icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        className="searchbar-input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Buscar películas y series"
      />

      {/* botón de borrar: solo cuando hay algo escrito */}
      {value && (
        <button
          type="button"
          className="searchbar-clear"
          onClick={() => onChange('')}
          aria-label="Borrar búsqueda"
          title="Borrar"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchBar

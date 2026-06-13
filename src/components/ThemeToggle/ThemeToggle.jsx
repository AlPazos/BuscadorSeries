import { useEffect, useState } from 'react'
import './ThemeToggle.css'

// Lee el tema inicial: 1) el que un script en index.html ya fijó en <html>
// para evitar el parpadeo (FOUC), 2) lo guardado en localStorage, o 3) la
// preferencia del sistema. Devuelve siempre 'light' o 'dark'.
function leerTemaInicial() {
  const enHtml = document.documentElement.dataset.theme
  if (enHtml === 'light' || enHtml === 'dark') return enHtml

  const guardado = localStorage.getItem('tema')
  if (guardado === 'light' || guardado === 'dark') return guardado

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// Selector de tema claro/oscuro. Fija data-theme en <html> (que el CSS usa
// como override del prefers-color-scheme) y lo persiste en localStorage.
// Nota: de momento NO sincroniza con las preferencias del backend; eso es
// lógica de cuenta y se hará aparte.
function ThemeToggle() {
  const [tema, setTema] = useState(leerTemaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem('tema', tema)
  }, [tema])

  const esOscuro = tema === 'dark'
  const alternar = () => setTema(esOscuro ? 'light' : 'dark')

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternar}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
    >
      {esOscuro ? (
        // luna (tema oscuro activo)
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // sol (tema claro activo)
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle

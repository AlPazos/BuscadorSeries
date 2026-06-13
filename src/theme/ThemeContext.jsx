// Tema claro/oscuro compartido por la app. Fija data-theme en <html> (que el
// CSS usa como override del prefers-color-scheme) y lo persiste en localStorage.
// Además, con sesión iniciada lo SINCRONIZA con las preferencias del backend:
// al entrar trae el tema guardado, y al cambiarlo lo guarda. Solo el tema —el
// idioma se reenvía tal cual porque el PUT lo exige, pero no lo tocamos aquí.
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

const ThemeContext = createContext(null)

// tema inicial: 1) el que el script de index.html dejó en <html> (anti-FOUC),
// 2) lo de localStorage, o 3) la preferencia del sistema. Siempre 'light'|'dark'.
function leerTemaInicial() {
  const enHtml = document.documentElement.dataset.theme
  if (enHtml === 'light' || enHtml === 'dark') return enHtml

  const guardado = localStorage.getItem('tema')
  if (guardado === 'light' || guardado === 'dark') return guardado

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const { usuario, api } = useAuth()
  const [tema, setTema] = useState(leerTemaInicial)
  // idioma actual del backend: no lo tocamos, pero el PUT /preferencias lo
  // exige, así que lo recordamos para reenviarlo al guardar el tema
  const idiomaRef = useRef('es')

  // aplica el tema (data-theme + localStorage) siempre que cambie
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem('tema', tema)
  }, [tema])

  // al iniciar sesión: traer las preferencias y aplicar el tema guardado
  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    api
      .getPreferencias()
      .then((prefs) => {
        if (cancelado || !prefs) return
        idiomaRef.current = prefs.idioma ?? 'es'
        // solo aplicamos si el backend tiene un tema explícito (no "sistema")
        if (prefs.tema === 'light' || prefs.tema === 'dark') setTema(prefs.tema)
      })
      .catch(() => {}) // si falla, se queda el tema local
    return () => {
      cancelado = true
    }
  }, [usuario, api])

  // cambio por el usuario: actualiza y, con sesión, lo guarda en el backend.
  // El guardado va aquí (no en un efecto sobre `tema`) para NO reenviar al
  // backend el tema que acabamos de LEER de él al iniciar sesión.
  const alternar = () => {
    const nuevo = tema === 'dark' ? 'light' : 'dark'
    setTema(nuevo)
    if (usuario) {
      api
        .guardarPreferencias({ tema: nuevo, idioma: idiomaRef.current })
        .catch(() => {})
    }
  }

  return (
    <ThemeContext.Provider value={{ tema, alternar }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook y provider van juntos a propósito
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}

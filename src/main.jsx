import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: las vistas tienen URL (atrás/adelante y recarga funcionan) */}
    <BrowserRouter>
      {/* la sesión envuelve a toda la app: cualquier componente puede usar useAuth() */}
      <AuthProvider>
        {/* el tema va dentro de la sesión porque la sincroniza con /preferencias */}
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

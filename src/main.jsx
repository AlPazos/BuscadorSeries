import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* la sesión envuelve a toda la app: cualquier componente puede usar useAuth() */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

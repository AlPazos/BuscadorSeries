import { useState } from 'react'
import Stepper, { Step } from '../Stepper/Stepper.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js'
import './AuthModal.css'

// Modal de cuenta con dos modos: 'login' (formulario simple, son solo dos
// campos) y 'registro' (Stepper en tres pasos). `onCambiarModo` alterna entre
// ellos sin cerrar el modal; `onClose` lo cierra (clic fuera, ✕ o al entrar).
function AuthModal({ modo, onCambiarModo, onClose }) {
  // mientras el modal esté abierto, el fondo no debe hacer scroll
  useBodyScrollLock()

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-cerrar" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        {modo === 'login' ? (
          <FormularioLogin onClose={onClose} onIrARegistro={() => onCambiarModo('registro')} />
        ) : (
          <RegistroStepper onClose={onClose} onIrALogin={() => onCambiarModo('login')} />
        )}
      </div>
    </div>
  )
}

function FormularioLogin({ onClose, onIrARegistro }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null) // mensaje de la API (ApiError) o null
  const [enviando, setEnviando] = useState(false)

  const manejarSubmit = async (e) => {
    e.preventDefault() // que el form no recargue la página, lo gestionamos nosotros
    setError(null)
    setEnviando(true)
    try {
      await login(email, password)
      onClose() // sesión iniciada: el nav ya muestra la cuenta
    } catch (err) {
      setError(err.message) // p. ej. "Email o contraseña incorrectos"
      setEnviando(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={manejarSubmit}>
      <h2 className="auth-titulo">Entrar</h2>

      <label className="auth-campo">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>

      <label className="auth-campo">
        Contraseña
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button className="auth-enviar" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <button type="button" className="auth-cambio" onClick={onIrARegistro}>
        ¿No tienes cuenta? Crea una
      </button>
    </form>
  )
}

function RegistroStepper({ onClose, onIrALogin }) {
  const { registro } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repetida, setRepetida] = useState('') // confirmación de la contraseña
  const [nombre, setNombre] = useState('')
  const [paso, setPaso] = useState(1)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // validación por paso: el botón "Continuar" se desbloquea al completar cada uno
  const emailValido = /\S+@\S+\.\S+/.test(email)
  const passwordValida = password.length >= 8 && password === repetida
  const nombreValido = nombre.trim().length > 0
  const pasoValido = [emailValido, passwordValida, nombreValido][paso - 1]
  const todoValido = emailValido && passwordValida && nombreValido

  const crearCuenta = async () => {
    setError(null)
    setEnviando(true)
    try {
      await registro({ email, password, nombre: nombre.trim() })
      onClose() // registro() ya hace auto-login, no hay que volver a entrar
    } catch (err) {
      setError(err.message) // p. ej. 409 "Ya existe una cuenta con ese email"
      setEnviando(false)
    }
  }

  return (
    <div className="auth-registro">
      <h2 className="auth-titulo">Crear cuenta</h2>

      <Stepper
        onStepChange={setPaso}
        backButtonText="Atrás"
        nextButtonText="Continuar"
        completeButtonText={enviando ? 'Creando…' : 'Crear cuenta'}
        // En el último paso, nuestro onClick SUSTITUYE al interno del Stepper
        // (el spread de nextButtonProps va después): así la cuenta se crea al
        // pulsar y, si la API falla, seguimos en el paso para enseñar el error.
        nextButtonProps={
          paso === 3
            ? { onClick: crearCuenta, disabled: !todoValido || enviando }
            : { disabled: !pasoValido }
        }
      >
        <Step>
          <h3>Tu email</h3>
          <label className="auth-campo">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </label>
        </Step>

        <Step>
          <h3>Tu contraseña</h3>
          <label className="auth-campo">
            Contraseña (mínimo 8 caracteres)
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="auth-campo">
            Repítela
            <input
              type="password"
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
            />
          </label>
          {repetida && password !== repetida && (
            <p className="auth-aviso">Las contraseñas no coinciden</p>
          )}
        </Step>

        <Step>
          <h3>¿Cómo te llamas?</h3>
          <label className="auth-campo">
            Nombre
            <input
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
        </Step>
      </Stepper>

      {error && <p className="auth-error">{error}</p>}

      <button type="button" className="auth-cambio" onClick={onIrALogin}>
        ¿Ya tienes cuenta? Entra
      </button>
    </div>
  )
}

export default AuthModal

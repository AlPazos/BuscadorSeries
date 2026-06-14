import { useCallback, useState } from 'react'
import Stepper, { Step } from '../Stepper/Stepper.jsx'
import GoogleBoton from './GoogleBoton.jsx'
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

// Separador "o" entre el acceso con Google y el formulario tradicional.
function Separador() {
  return (
    <div className="auth-separador">
      <span>o</span>
    </div>
  )
}

// Botón para reenviar el correo de verificación. Se usa tanto en el banner del
// 403 (login) como en la pantalla de "revisa tu correo" (registro).
function ReenviarVerificacion({ email }) {
  const { reenviarVerificacion } = useAuth()
  const [estado, setEstado] = useState('idle') // idle | enviando | enviado | error

  const reenviar = async () => {
    setEstado('enviando')
    try {
      await reenviarVerificacion(email)
      setEstado('enviado')
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'enviado') {
    return <p className="auth-aviso">Te hemos reenviado el correo de verificación.</p>
  }

  return (
    <>
      <button
        type="button"
        className="auth-reenviar"
        onClick={reenviar}
        disabled={estado === 'enviando'}
      >
        {estado === 'enviando' ? 'Enviando…' : 'Reenviar correo de verificación'}
      </button>
      {estado === 'error' && (
        <p className="auth-error">No se pudo reenviar. Inténtalo de nuevo.</p>
      )}
    </>
  )
}

function FormularioLogin({ onClose, onIrARegistro }) {
  const { login, loginGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null) // mensaje de la API (ApiError) o null
  const [sinVerificar, setSinVerificar] = useState(false) // login 403: email sin verificar
  const [enviando, setEnviando] = useState(false)

  const manejarSubmit = async (e) => {
    e.preventDefault() // que el form no recargue la página, lo gestionamos nosotros
    setError(null)
    setSinVerificar(false)
    setEnviando(true)
    try {
      await login(email, password)
      onClose() // sesión iniciada: el nav ya muestra la cuenta
    } catch (err) {
      // 403 = cuenta correcta pero email aún sin verificar: caso aparte (con reenvío)
      if (err.status === 403) setSinVerificar(true)
      else setError(err.message) // p. ej. "Email o contraseña incorrectos"
      setEnviando(false)
    }
  }

  // memoizado: GoogleBoton rehace su efecto (y repinta) si cambia esta función
  const entrarConGoogle = useCallback(
    async (idToken) => {
      setError(null)
      try {
        await loginGoogle(idToken)
        onClose()
      } catch (err) {
        setError(err.message)
      }
    },
    [loginGoogle, onClose],
  )

  return (
    <form className="auth-form" onSubmit={manejarSubmit}>
      <h2 className="auth-titulo neon-text">Entrar</h2>

      <GoogleBoton onCredential={entrarConGoogle} />
      <Separador />

      <label className="auth-campo">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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

      {sinVerificar && (
        <div className="auth-verifica">
          <p className="auth-aviso">
            Tienes que verificar tu email antes de entrar. Revisa tu correo.
          </p>
          <ReenviarVerificacion email={email} />
        </div>
      )}

      <button className="auth-enviar" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <button type="button" className="auth-cambio" onClick={onIrARegistro}>
        ¿No tienes cuenta? Crea una
      </button>
    </form>
  )
}

// Pantalla de confirmación tras registrarse: el registro ya NO inicia sesión,
// hay que verificar el email primero.
function RevisaTuCorreo({ email, onIrALogin }) {
  return (
    <div className="auth-revisa">
      <div className="auth-revisa-icono" aria-hidden="true">
        ✉️
      </div>
      <h2 className="auth-titulo neon-text">Revisa tu correo</h2>
      <p className="auth-revisa-texto">
        Te hemos enviado un enlace de verificación a <strong>{email}</strong>.
        Ábrelo para activar tu cuenta y poder entrar.
      </p>

      <ReenviarVerificacion email={email} />

      <button type="button" className="auth-cambio" onClick={onIrALogin}>
        Ya lo he verificado, entrar
      </button>
    </div>
  )
}

function RegistroStepper({ onClose, onIrALogin }) {
  const { registro, loginGoogle } = useAuth()
  const [metodo, setMetodo] = useState(null) // null = elegir | 'email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repetida, setRepetida] = useState('') // confirmación de la contraseña
  const [nombre, setNombre] = useState('')
  const [paso, setPaso] = useState(1)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [completado, setCompletado] = useState(false) // cuenta creada → revisa tu correo

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
      setCompletado(true) // ya no hay auto-login: hay que verificar el email
    } catch (err) {
      setError(err.message) // p. ej. 409 "Ya existe una cuenta con ese email"
      setEnviando(false)
    }
  }

  // crear cuenta con Google = entrar con Google (el backend la crea al vuelo);
  // memoizado para no repintar el botón de Google en cada render
  const registrarConGoogle = useCallback(
    async (idToken) => {
      setError(null)
      try {
        await loginGoogle(idToken)
        onClose()
      } catch (err) {
        setError(err.message)
      }
    },
    [loginGoogle, onClose],
  )

  if (completado) {
    return <RevisaTuCorreo email={email} onIrALogin={onIrALogin} />
  }

  // paso 0: elegir cómo crear la cuenta (Google o email)
  if (metodo === null) {
    return (
      <div className="auth-registro">
        <h2 className="auth-titulo neon-text">Crear cuenta</h2>

        <GoogleBoton onCredential={registrarConGoogle} />
        <Separador />

        <button
          type="button"
          className="auth-enviar"
          onClick={() => setMetodo('email')}
        >
          Registrarme con email
        </button>

        {error && <p className="auth-error">{error}</p>}

        <button type="button" className="auth-cambio" onClick={onIrALogin}>
          ¿Ya tienes cuenta? Entra
        </button>
      </div>
    )
  }

  return (
    <div className="auth-registro">
      <h2 className="auth-titulo neon-text">Crear cuenta</h2>

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

      <button type="button" className="auth-cambio" onClick={() => setMetodo(null)}>
        ← Otras opciones
      </button>

      <button type="button" className="auth-cambio" onClick={onIrALogin}>
        ¿Ya tienes cuenta? Entra
      </button>
    </div>
  )
}

export default AuthModal

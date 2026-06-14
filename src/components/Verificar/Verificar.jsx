import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import BlurText from '../BlurText/BlurText.jsx'
import './Verificar.css'

// Página /verificar?token=... : confirma el email contra POST /auth/verificar
// (el endpoint es idempotente). NO inicia sesión; al terminar, el usuario entra
// normalmente. La ruta no choca con el proxy del Worker porque este solo
// reenvía /auth/* (la API es /auth/verificar; esta página es /verificar).
// `onEntrar` (de App) abre el modal de login.
function Verificar({ onEntrar }) {
  const { verificarEmail } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  // sin-token | verificando | ok | error
  const [estado, setEstado] = useState(token ? 'verificando' : 'sin-token')
  // evita la doble petición del doble montaje de StrictMode en desarrollo
  const lanzado = useRef(false)

  useEffect(() => {
    if (!token || lanzado.current) return
    lanzado.current = true
    verificarEmail(token).then(
      () => setEstado('ok'),
      () => setEstado('error'),
    )
  }, [token, verificarEmail])

  // vuelve a la home y abre el modal de login (estado de App)
  const irAEntrar = () => {
    navigate('/')
    onEntrar()
  }

  return (
    <div className="verificar">
      {estado === 'verificando' && (
        <>
          <BlurText
            as="h1"
            className="vista-titulo"
            text="Verificando…"
            animateBy="letters"
            direction="top"
            delay={60}
          />
          <p className="verificar-texto">Estamos confirmando tu email.</p>
        </>
      )}

      {estado === 'ok' && (
        <div className="verificar-tarjeta verificar-tarjeta--ok">
          <div className="verificar-icono" aria-hidden="true">
            ✓
          </div>
          <h1 className="vista-titulo neon-text">Email verificado</h1>
          <p className="verificar-texto">
            Tu cuenta ya está activa. Ya puedes iniciar sesión.
          </p>
          <button className="verificar-cta" onClick={irAEntrar}>
            Iniciar sesión
          </button>
        </div>
      )}

      {estado === 'error' && (
        <div className="verificar-tarjeta">
          <div className="verificar-icono verificar-icono--error" aria-hidden="true">
            !
          </div>
          <h1 className="vista-titulo">No se pudo verificar</h1>
          <p className="verificar-texto">
            El enlace no es válido o ha caducado. Pide uno nuevo desde la pantalla
            de inicio de sesión.
          </p>
          <button className="verificar-cta" onClick={irAEntrar}>
            Ir a iniciar sesión
          </button>
        </div>
      )}

      {estado === 'sin-token' && (
        <div className="verificar-tarjeta">
          <h1 className="vista-titulo">Enlace incompleto</h1>
          <p className="verificar-texto">
            Falta el token de verificación. Abre el enlace completo del correo
            que te enviamos.
          </p>
          <button className="verificar-cta" onClick={irAEntrar}>
            Volver
          </button>
        </div>
      )}
    </div>
  )
}

export default Verificar

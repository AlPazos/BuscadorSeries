import { useEffect, useRef } from 'react'
import { GOOGLE_CLIENT_ID } from '../../auth/google.js'
import { useGoogleScript } from '../../hooks/useGoogleScript.js'
import { useTheme } from '../../theme/ThemeContext.jsx'

// Botón oficial "Continuar con Google" (Google Identity Services). Cuando el
// usuario lo pulsa y Google devuelve el ID token, llama a onCredential(idToken).
//
// OJO: Google NO permite restilizar libremente este botón (es anti-phishing);
// solo deja elegir entre sus variantes (theme/size/shape). Lo que hacemos para
// integrarlo: usar el tema oscuro/claro según la app, darle el ancho del
// formulario y envolverlo con un marco de glow neón (.google-boton).
//
// IMPORTANTE: el padre debe memoizar onCredential (useCallback); si no, el
// efecto se rehace en cada render y Google repinta el botón.
function GoogleBoton({ onCredential }) {
  const contenedor = useRef(null)
  const estado = useGoogleScript()
  const { tema } = useTheme()

  useEffect(() => {
    if (estado !== 'listo' || !contenedor.current) return
    const { google } = window
    const nodo = contenedor.current

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (respuesta) => onCredential(respuesta.credential),
    })
    google.accounts.id.renderButton(nodo, {
      type: 'standard',
      // en oscuro, botón negro relleno; en claro, contorno: integra con cada tema
      theme: tema === 'dark' ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'center',
      locale: 'es',
      // que ocupe el ancho disponible (Google lo limita a 400 px)
      width: Math.min(nodo.clientWidth || 360, 400),
    })

    // GIS pinta su botón dentro del contenedor; lo limpiamos al rehacer el
    // efecto (cambio de tema, remount) para no acumular botones duplicados
    return () => {
      nodo.innerHTML = ''
    }
  }, [estado, tema, onCredential])

  if (estado === 'error') {
    return <p className="auth-aviso">No se pudo cargar el acceso con Google.</p>
  }

  return (
    <div className="google-boton" aria-busy={estado !== 'listo'}>
      <div className="google-boton-marco" ref={contenedor} />
    </div>
  )
}

export default GoogleBoton

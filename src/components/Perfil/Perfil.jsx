import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import './Perfil.css'

// Vista de perfil: pide los datos de la cuenta a la API (GET /auth/perfil) y
// los muestra. `onSalir` lo provee App (abre la confirmación de cerrar sesión).
// Solo se monta con sesión (la ruta está protegida).
function Perfil({ onSalir }) {
  const { api } = useAuth()
  const [perfil, setPerfil] = useState(null) // {id, email, nombre, creadoEn}
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelado = false
    api
      .getPerfil()
      .then((p) => !cancelado && setPerfil(p))
      .catch((e) => !cancelado && setError(e.message))
    return () => {
      cancelado = true
    }
  }, [api])

  if (error) {
    return <p className="perfil-aviso">No se ha podido cargar tu perfil: {error}</p>
  }

  if (!perfil) {
    return <p className="perfil-aviso">Cargando tu perfil…</p>
  }

  const inicial = (perfil.nombre || perfil.email || '?').charAt(0).toUpperCase()
  const desde = perfil.creadoEn
    ? new Date(perfil.creadoEn).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <>
      <h2 className="perfil-titulo neon-text">Mi perfil</h2>

      <div className="perfil-tarjeta">
        <div className="perfil-avatar" aria-hidden="true">
          {inicial}
        </div>

        <p className="perfil-nombre">{perfil.nombre}</p>

        <dl className="perfil-datos">
          <div className="perfil-dato">
            <dt>Email</dt>
            <dd>{perfil.email}</dd>
          </div>
          {desde && (
            <div className="perfil-dato">
              <dt>Miembro desde</dt>
              <dd>{desde}</dd>
            </div>
          )}
        </dl>

        <button type="button" className="perfil-salir" onClick={onSalir}>
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

export default Perfil

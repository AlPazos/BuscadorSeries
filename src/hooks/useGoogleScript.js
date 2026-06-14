// Carga el script de Google Identity Services (GIS) una sola vez para toda la
// app y avisa cuando está listo. Devuelve 'cargando' | 'listo' | 'error'.
//
// El <script> se inyecta bajo demanda (no en index.html) para no cargar Google
// en cada visita: solo cuando alguien abre el modal de cuenta. La promesa es
// de módulo (compartida) para que dos botones montados a la vez no la dupliquen.
import { useEffect, useState } from 'react'

const SRC = 'https://accounts.google.com/gsi/client'

let promesaCarga = null

function cargarGsi() {
  if (promesaCarga) return promesaCarga
  promesaCarga = new Promise((resolve, reject) => {
    // por si ya estuviera disponible (HMR en dev, navegación previa)
    if (window.google?.accounts?.id) return resolve()
    const script = document.createElement('script')
    script.src = SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      promesaCarga = null // permite reintentar en una carga futura
      reject(new Error('No se pudo cargar Google Identity Services'))
    }
    document.head.appendChild(script)
  })
  return promesaCarga
}

export function useGoogleScript() {
  const [estado, setEstado] = useState(() =>
    window.google?.accounts?.id ? 'listo' : 'cargando',
  )

  useEffect(() => {
    if (estado === 'listo') return
    let vivo = true // ignora la respuesta si el componente se desmonta antes
    cargarGsi().then(
      () => vivo && setEstado('listo'),
      () => vivo && setEstado('error'),
    )
    return () => {
      vivo = false
    }
  }, [estado])

  return estado
}

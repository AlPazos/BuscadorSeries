import { useEffect } from 'react'

// Contador a nivel de módulo: permite varios modales abiertos a la vez
// (el body solo se desbloquea cuando se cierra el último).
let locks = 0

// Bloquea el scroll del body mientras el componente que lo usa esté montado.
export function useBodyScrollLock() {
  useEffect(() => {
    locks++
    document.body.style.overflow = 'hidden'

    return () => {
      locks--
      if (locks === 0) document.body.style.overflow = ''
    }
  }, [])
}

export default useBodyScrollLock

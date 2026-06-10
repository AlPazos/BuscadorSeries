import { useEffect, useState } from 'react'

// Devuelve `value` pero retrasado: solo se actualiza cuando han pasado
// `delay` ms sin que `value` cambie. Útil para no llamar a la API en cada tecla.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id) // cancela el anterior si value cambia antes
  }, [value, delay])

  return debounced
}

export default useDebounce

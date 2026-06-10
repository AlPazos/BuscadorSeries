import { Children, useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView } from 'motion/react'
import './AnimatedList.css'

// Lista scrolleable cuyos items entran animados (escala + fade) al aparecer,
// con degradados arriba/abajo que indican que hay más contenido.
// Adaptado de React Bits (reactbits.dev). Cambios respecto al original:
// - recibe children arbitrarios en vez de un array de strings
// - sin selección ni navegación por teclado (los items tienen su propio clic)
// - colores del tema en vez de fijos

const AnimatedItem = ({ children, delay = 0, index }) => {
  const ref = useRef(null)
  // como en el original: el item se anima cada vez que entra en vista
  // (y se desvanece al salir), no solo la primera vez
  const inView = useInView(ref, { amount: 0.5 })
  return (
    <motion.div
      ref={ref}
      data-index={index}
      className="animated-item"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  )
}

const AnimatedList = ({ children, showGradients = true, className = '', displayScrollbar = true }) => {
  const listRef = useRef(null)
  const [topGradientOpacity, setTopGradientOpacity] = useState(0)
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(0)

  const updateGradients = useCallback((el) => {
    const { scrollTop, scrollHeight, clientHeight } = el
    setTopGradientOpacity(Math.min(scrollTop / 50, 1))
    const bottomDistance = scrollHeight - (scrollTop + clientHeight)
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1))
  }, [])

  // recalcula los degradados al montar y cuando cambia el contenido
  // (p. ej. al desplegar una temporada crece la lista)
  useEffect(() => {
    if (listRef.current) updateGradients(listRef.current)
  }, [children, updateGradients])

  return (
    <div className={`scroll-list-container ${className}`}>
      <div
        ref={listRef}
        className={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`}
        onScroll={(e) => updateGradients(e.target)}
      >
        {Children.map(children, (child, index) => (
          <AnimatedItem delay={0.1} index={index}>
            {child}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className="top-gradient" style={{ opacity: topGradientOpacity }}></div>
          <div className="bottom-gradient" style={{ opacity: bottomGradientOpacity }}></div>
        </>
      )}
    </div>
  )
}

export default AnimatedList

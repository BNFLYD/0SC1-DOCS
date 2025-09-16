import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'

const ScrollToTop = ({ isDark }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollHierarchy, setScrollHierarchy] = useState(false)

  // Mostrar el botón cuando se desplaza hacia abajo
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  // Exponer la jerarquía de scroll globalmente para que About pueda respetarla
  useEffect(() => {
    if (scrollHierarchy) {
      window.__SCROLL_HIERARCHY__ = true
      document.documentElement.setAttribute('data-scroll-hierarchy', '1')
    } else {
      window.__SCROLL_HIERARCHY__ = false
      document.documentElement.removeAttribute('data-scroll-hierarchy')
    }
    return () => {
      window.__SCROLL_HIERARCHY__ = false
      document.documentElement.removeAttribute('data-scroll-hierarchy')
    }
  }, [scrollHierarchy])

  // Opción B: además de apagar al llegar al top, si el botón deja de ser visible, desactivar jerarquía
  useEffect(() => {
    if (scrollHierarchy && !isVisible) {
      setScrollHierarchy(false)
    }
  }, [scrollHierarchy, isVisible])

  // Función para desplazarse suavemente hacia arriba con jerarquía activada
  const scrollToTop = () => {
    setScrollHierarchy(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Desactivar jerarquía cuando llegamos al tope (o tras timeout de seguridad)
    const el = document.scrollingElement || document.documentElement
    const t0 = performance.now()
    const maxMs = 1600
    const tick = () => {
      const atTop = (el.scrollTop || 0) <= 1
      const tooLong = performance.now() - t0 > maxMs
      if (atTop || tooLong) {
        setScrollHierarchy(false)
      } else {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-12 right-12 p-6 rounded-3xl transition-all duration-300 transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        ${isDark ? 'bg-primary text-cloud' : 'bg-secondary text-primary'}
        focus:outline-none shadow-lg z-50`}
      aria-label="Scroll to top"
    >
      <Icon icon="gravity-ui:chevron-up-wide" className="w-6 h-6" />
    </button>
  )
}

export default ScrollToTop

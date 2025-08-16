import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

const ScrollToTop = ({ isDark }) => {
  const [isVisible, setIsVisible] = useState(false)

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

  // Función para desplazarse suavemente hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-12 right-12 p-6 rounded-3xl transition-all duration-300 transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        ${isDark ? 'bg-primary hover:bg-primary/80' : 'bg-secondary hover:bg-secondary/80'}
        focus:outline-none shadow-lg z-50`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  )
}

export default ScrollToTop

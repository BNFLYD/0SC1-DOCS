import { useState, useEffect, useRef } from 'react'

const TerminalText = ({ text, className, inView = true, onComplete }) => {
  const [displayText, setDisplayText] = useState('> ')
  const [isTyping, setIsTyping] = useState(false)
  const fullText = `> ${text}`
  const intervalRef = useRef(null)

  useEffect(() => {
    if (inView && !isTyping) {
      // Iniciar la animación
      setIsTyping(true)
      setDisplayText('> ') // Resetear el texto al inicio
      let currentIndex = 2 // Empezamos después del "> "

      intervalRef.current = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(intervalRef.current)
          setIsTyping(false)
          onComplete?.() // Llamar al callback cuando termine
        }
      }, 50) // Velocidad de escritura
    } else if (!inView && isTyping) {
      // Si pierde visibilidad durante la animación, reiniciar
      clearInterval(intervalRef.current)
      setIsTyping(false)
      setDisplayText('> ') // Resetear el texto
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [inView, fullText])

  return (
    <span className={className}>
      {displayText}
      {isTyping && (
        <span className="inline-block w-2 h-5 ml-1 bg-current animate-blink" />
      )}
    </span>
  )
}

export default TerminalText

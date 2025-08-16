import { useEffect, useRef } from "react"
import { useUser } from '../../context/UserContext'

const StaticEffect = ({ intensity = 100, flashProbability = 0.1 }) => {
  const { isDark } = useUser()
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    const animate = () => {
      // Limpiar canvas con fondo transparente
      ctx.clearRect(0, 0, width, height)

      // En modo claro, usamos un blend mode diferente para que la estática negra sea visible
      canvas.style.mixBlendMode = isDark ? "screen" : "multiply"

      // Color de la estática basado en el tema
      ctx.fillStyle = isDark ? "#ffffff" : "#000000"

      // Dibujar líneas aleatorias
      for (let i = 0; i < intensity; i++) {
        ctx.fillRect(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 20 + 5,
          1
        )
      }

      // Efecto de flash
      if (Math.random() < flashProbability) {
        ctx.fillStyle = `rgba(${
          isDark ? "255, 255, 255" : "0, 0, 0"
        }, ${Math.random() * 0.3 + 0.1})`
        ctx.fillRect(0, 0, width, height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [ intensity, flashProbability])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}

export default StaticEffect

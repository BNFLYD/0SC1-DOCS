"use client"

import { useEffect, useRef } from "react"

const CRTScreen = ({ theme, activeChannel }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height
    let time = 0

    const animate = () => {
      // Limpiar canvas - fondo negro
      ctx.fillStyle = isDark ? "#000000" : "#ffffff"
      ctx.fillRect(0, 0, width, height)

      // Configurar estilo base
      ctx.strokeStyle = isDark ? "#ffffff" : "#000000"
      ctx.fillStyle = isDark ? "#ffffff" : "#000000"
      ctx.font = "12px monospace"

      if (!activeChannel) {
        // Animación por defecto: onda senoidal
        ctx.lineWidth = 2
        ctx.beginPath()

        const amplitude = height * 0.15
        const frequency = 0.05
        const centerY = height / 2

        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin((x + time) * frequency) * amplitude
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      } else {
        // Contenido según el canal activo
        ctx.textAlign = "left"
        ctx.textBaseline = "top"

        switch (activeChannel) {
          case "whoami":
            ctx.fillText("> whoami", 20, 20)
            ctx.fillText("Desarrollador Full Stack", 20, 40)
            ctx.fillText("Especialista en React & Node.js", 20, 60)
            ctx.fillText("Apasionado por la tecnología", 20, 80)
            ctx.fillText("y el código limpio", 20, 100)
            break
          case "projects":
            ctx.fillText("> ls projects/", 20, 20)
            ctx.fillText("• E-commerce Platform", 20, 40)
            ctx.fillText("• Task Management App", 20, 60)
            ctx.fillText("• Weather Dashboard", 20, 80)
            ctx.fillText("• Portfolio Website", 20, 100)
            break
          case "blog":
            ctx.fillText("> cat blog/README.md", 20, 20)
            ctx.fillText("Escribo sobre:", 20, 40)
            ctx.fillText("• Desarrollo web moderno", 20, 60)
            ctx.fillText("• Mejores prácticas", 20, 80)
            ctx.fillText("• Nuevas tecnologías", 20, 100)
            break
        }
      }

      // Efecto de líneas de escaneo
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1)
      }

      time += 2
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [theme, activeChannel])

  const isDark = theme === "dark"

  return (
    <div className="relative w-full h-full">
      {/* Marco del monitor CRT cuadrado */}
      <div
        className={`w-full aspect-square rounded-xl border-1 p-1 relative overflow-hidden ${
          isDark ? "border-white/50 bg-white/80" : "border-black/50 bg-black"
        }`}
      >
        {/* Pantalla */}
        <div className="w-full h-full rounded-lg relative overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="w-full h-full"
            style={{ imageRendering: "" }}
          />

          {/* Efecto de curvatura CRT */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent 70%, rgba(0,0,0,0.2) 100%)`,
            }}
          />
        </div>

        {/* Etiqueta del monitor */}
        <div className={`absolute bottom-4 right-4 text-xs font-mono ${isDark ? "text-white" : "text-black"}`}>
          0SC1
        </div>
      </div>
    </div>
  )
}

export default CRTScreen

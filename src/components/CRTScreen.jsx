"use client"

import { useEffect, useRef } from "react"
import WhoamiChannel from "../components/Channels/WhoamiChannel"
import ProjectsChannel from "../components/Channels/ProjectsChannel"
import BlogChannel from "../components/Channels/BlogChannel"
import MesmerizerChannel from "../components/Channels/MesmerizerChannel"

const CRTScreen = ({ theme, activeChannel, isDistorting }) => {
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
      // Limpiar canvas - fondo según el tema
      ctx.fillStyle = theme === "dark" ? "#111111" : "#ffffff"
      ctx.fillRect(0, 0, width, height)

      // Si está distorsionando, dibujar efecto de estática/glitch
      if (isDistorting) {
        // Color de la estática: blanco si el fondo es oscuro, negro si el fondo es claro
        ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000"
        for (let i = 0; i < 100; i++) {
          // Dibujar muchas líneas aleatorias
          ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 20 + 5, 1)
        }
        // Añadir un flash rápido
        if (Math.random() < 0.1) {
          // 10% de probabilidad de un flash
          ctx.fillStyle = `rgba(${theme === "dark" ? "255, 255, 255" : "0, 0, 0"}, ${Math.random() * 0.3 + 0.1})`
          ctx.fillRect(0, 0, width, height)
        }
      } else if (!activeChannel) {
        // Animación por defecto: onda senoidal (solo si no hay canal activo)
        ctx.strokeStyle = theme === "dark" ? "#ffffff" : "#000000"
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
      }


      // Efecto de líneas de escaneo (siempre aplicar, encima de todo)
      // El color de las líneas de escaneo se invierte con el tema
      ctx.fillStyle = theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
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
  }, [theme, activeChannel, isDistorting])

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

          {/* Overlay interactivo para el contenido del canal */}
          {!isDistorting && ( // Ocultar overlay durante la distorsión
            <div
              className={`absolute inset-0 font-mono text-sm ${isDark ? "text-white" : "text-black"} flex flex-col`}
            >
              {activeChannel === "whoami" && <WhoamiChannel theme={theme} />}
              {activeChannel === "projects" && <ProjectsChannel theme={theme} />}
              {activeChannel === "blog" && <BlogChannel theme={theme} />}
              {activeChannel === "play" && <MesmerizerChannel theme={theme} />}
            </div>
          )}

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

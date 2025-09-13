import { useState, useEffect } from "react"

const SkillKnob = ({ skill, percentage, shouldAnimate = true, isDark }) => {
  const [currentRotation, setCurrentRotation] = useState(-90) // Empezamos desde -90 grados
  const rotation = (percentage / 100) * 180 - 90 // El valor final de rotación

  useEffect(() => {
    const startAnimation = async () => {
      if (!shouldAnimate) return

      // Resetear a la posición inicial
      setCurrentRotation(-90)

      // Pequeña pausa para asegurar el reset
      await new Promise(resolve => setTimeout(resolve, 250))

      // Animar hasta la posición final
      setCurrentRotation(rotation)
    }

    startAnimation()

    return () => {
      setCurrentRotation(-90)
    }
  }, [percentage, shouldAnimate, rotation])

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Knob/Perilla simplificada */}
      <div className="relative w-10 h-10">
        {/* Base del knob */}
        <div
          className={`w-full h-full rounded-full border relative ${
            isDark ? "border-white/60 bg-primary" : "border-black/60 bg-secondary"
          }`}
        >
          {/* Indicador del knob */}
          <div
            className={`absolute w-0.5 h-3 top-1 left-1/2 origin-bottom transform -translate-x-1/2 transition-all duration-[1500ms] ease-out ${
              isDark ? "bg-white" : "bg-black"
            }`}
            style={{
              transform: `translateX(-50%) rotate(${currentRotation}deg)`,
              transformOrigin: "50% 18px",
            }}
          />

          {/* Centro del knob */}
          <div
            className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
              isDark ? "bg-white" : "bg-black"
            }`}
          />
        </div>
      </div>

      {/* Solo etiqueta */}
      <div className="text-center">
        <div className={`text-sm font-specs ${isDark ? "text-white" : "text-black"}`}>{skill}</div>
      </div>
    </div>
  )
}

export default SkillKnob

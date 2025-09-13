import { useState, useEffect } from "react"
import PropTypes from 'prop-types'

const AmplitudeIndicator = ({ skill, percentage, vertical = true, shouldAnimate = true, isDark }) => {
  const [currentValue, setCurrentValue] = useState(0)
  const height = (currentValue / 100) * 40 // Altura máxima reducida

AmplitudeIndicator.propTypes = {
  skill: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
  vertical: PropTypes.bool,
  shouldAnimate: PropTypes.bool
}

  useEffect(() => {
    const startAnimation = async () => {
      if (!shouldAnimate) return
      // Resetear al inicio
      setCurrentValue(0)
      // Esperar a que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 250))
      // Iniciar la animación
      setCurrentValue(percentage)
    }

    startAnimation()

    // Limpiar la animación cuando el componente se desmonte
    return () => {
      setCurrentValue(0)
    }
  }, [percentage, shouldAnimate])

  if (vertical) {
    // Diseño vertical
    return (
      <div className="flex flex-col items-center space-y-1">
        {/* Indicador de amplitud simplificado */}
        <div className={`relative w-5 h-12 flex flex-col justify-end rounded-lg ${isDark ? "bg-primary" : "bg-secondary"}`}>
          {/* Marco simple */}
          <div className={`absolute inset-0 border rounded-lg ${isDark ? "border-white/60" : "border-black/60"}`} />

          {/* Barra de amplitud */}
          <div
            className={`w-full rounded-b-lg transition-all duration-700 ${isDark ? "bg-white" : "bg-black"}`}
            style={{ height: `${height}px` }}
          />
        </div>

        {/* Solo etiqueta */}
        <div className="text-center">
          <div className={`text-sm font-specs ${isDark ? "text-white" : "text-black"}`}>{skill}</div>
        </div>
      </div>
    )
  } else {
    // Diseño horizontal
    return (
      <div className="space-y-2">
        {/* Nombre y porcentaje */}
        <div className="flex justify-between items-center">
          <span className="font-specs text-md tracking-wide">{skill}</span>
          <span className="font-specs text-md">{currentValue}%</span>
        </div>

        {/* Barra de progreso horizontal */}
        <div className="relative">
          {/* Fondo de la barra */}
          <div className={`w-full h-2 rounded-full ${isDark ? "bg-white/20" : "bg-black/20"}`}>
            {/* Barra de progreso */}
            <div
              className={`h-full rounded-full transition-all duration-[1500ms] ease-out ${isDark ? "bg-white" : "bg-black"}`}
              style={{ width: `${currentValue}%` }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default AmplitudeIndicator

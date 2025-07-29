"use client"

const AmplitudeIndicator = ({ skill, percentage, theme, vertical = true }) => {
  const isDark = theme === "dark"
  const height = (percentage / 100) * 40 // Altura máxima reducida

  if (vertical) {
    // Diseño vertical (original)
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
          <div className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-black"}`}>{skill}</div>
        </div>
      </div>
    )
  } else {
    // Diseño horizontal (para la página About)
    const width = (percentage / 100) * 200 // Ancho máximo de la barra horizontal

    return (
      <div className="space-y-2">
        {/* Nombre y porcentaje */}
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-sm tracking-wide">{skill}</span>
          <span className="font-mono text-xs">{percentage}%</span>
        </div>

        {/* Barra de progreso horizontal */}
        <div className="relative">
          {/* Fondo de la barra */}
          <div className={`w-full h-2 rounded-full ${isDark ? "bg-white/20" : "bg-black/20"}`}>
            {/* Barra de progreso */}
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isDark ? "bg-white" : "bg-black"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default AmplitudeIndicator

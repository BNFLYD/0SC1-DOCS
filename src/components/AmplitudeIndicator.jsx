"use client"

const AmplitudeIndicator = ({ skill, percentage, theme }) => {
  const isDark = theme === "dark"
  const height = (percentage / 100) * 40 // Altura máxima reducida

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Indicador de amplitud simplificado */}
      <div className="relative w-5 h-12 flex flex-col justify-end">
        {/* Marco simple */}
        <div className={`absolute inset-0 border rounded-lg ${isDark ? "border-white/40" : "border-black/40"}`} />

        {/* Barra de amplitud */}
        <div
          className={`w-full rounded-b-lg transition-all duration-700 ${isDark ? "bg-gray-300" : "bg-black"}`}
          style={{ height: `${height}px` }}
        />
      </div>

      {/* Solo etiqueta */}
      <div className="text-center">
        <div className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-black"}`}>{skill}</div>
      </div>
    </div>
  )
}

export default AmplitudeIndicator

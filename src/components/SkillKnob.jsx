"use client"

const SkillKnob = ({ skill, percentage, theme }) => {
  const isDark = theme === "dark"
  const rotation = (percentage / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Knob/Perilla simplificada */}
      <div className="relative w-10 h-10">
        {/* Base del knob */}
        <div
          className={`w-full h-full rounded-full border relative ${
            isDark ? "border-white/60 bg-black" : "border-black/60 bg-white"
          }`}
        >
          {/* Indicador del knob */}
          <div
            className={`absolute w-0.5 h-3 top-1 left-1/2 origin-bottom transform -translate-x-1/2 transition-transform duration-500 ${
              isDark ? "bg-white" : "bg-black"
            }`}
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
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
        <div className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-black"}`}>{skill}</div>
      </div>
    </div>
  )
}

export default SkillKnob

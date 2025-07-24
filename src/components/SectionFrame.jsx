"use client"

const SectionFrame = ({ title, children, theme }) => {
  const isDark = theme === "dark"

  return (
    <div className="relative w-full h-full p-4">
      {/* Marco rectangular */}
      <div className={`w-full h-full border-2 rounded-xl relative ${isDark ? "border-white/60" : "border-black/60"}`}>
        {/* Contenido */}
        <div className="w-full h-full p-4 flex items-center justify-center">{children}</div>

        {/* Etiqueta en la parte inferior */}
        <div
          className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-2 font-mono text-sm font-bold ${
            isDark ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          {title}
        </div>
      </div>
    </div>
  )
}

export default SectionFrame

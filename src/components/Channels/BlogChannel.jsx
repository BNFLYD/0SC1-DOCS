import { useState } from "react"
import { Link } from "react-router-dom"
import { translations } from "../../constants/translations"
import sprite from "../../assets/sprite.svg"
import TerminalText from "../UI/TerminalText"

const BlogChannel = ({ language, isDark }) => {
  const textColor = isDark ? "text-white" : "text-black"
  const t = translations[language].channelContent.blog
  const [showContent, setShowContent] = useState(false)

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <div className="text-xl font-bold">
        <TerminalText
          text="bat blog/README.md"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`flex w-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Contenido de texto (60% del ancho) */}
        <div className="text-lg font-mono font-semibold w-[60%] pr-4 space-y-2">
          <p>{t.title}</p>
          <ul className="list-disc list-inside ml-2 space-y-4">
            {t.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        {/* Animación sprite (40% del ancho) */}
        <div className="w-[40%]">
          <div
            className={`animate-sprite h-48 w-48 rounded-2xl mx-auto ${isDark ? "filter invert-[0%] hue-rotate-0 bg-void/25" : "filter invert-[100%] hue-rotate-180 bg-primary/65"}`}
            style={{
              backgroundImage: `url(${sprite})`,
              backgroundSize: '100% 6400%', // Mantenemos la proporción exacta para la animación
            }}
          />
        </div>
      </div>
      <Link
        to="/blog"
        className={`relative isolate overflow-hidden mt-4 px-3 py-1 border rounded-md text-xs font-bold self-start
          transition-colors duration-300
          before:content-[''] before:absolute before:inset-0 before:rounded-full before:z-0
          before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
          transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}
          ${isDark ? "border-white/60 text-white hover:text-black before:bg-white" : "border-black/60 text-black hover:text-white before:bg-black"}`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ox = ((e.clientX - rect.left) / rect.width) * 100;
          const oy = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty('--ox', `${ox}%`);
          e.currentTarget.style.setProperty('--oy', `${oy}%`);
        }}
      >
        <span className="relative z-10">{t.action} ↗</span>
      </Link>
    </div>
  )
}

export default BlogChannel

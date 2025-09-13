import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { translations } from "../../constants/translations"
import sprite from "../../assets/sprite.svg"
import TerminalText from "../UI/TerminalText"

const BlogChannel = ({ language, isDark }) => {
  const textColor = isDark ? "text-white" : "text-black"
  const t = translations[language].channelContent.blog
  const [showContent, setShowContent] = useState(false)

  // Preload del sprite para asegurar descarga temprana (se usa como background-image)
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = sprite
    // @ts-ignore: fetchPriority puede no estar tipado
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => {
      if (link.parentNode) document.head.removeChild(link)
    }
  }, [])

  return (
    <div className={`font-specs flex flex-col p-8 gap-2 ${textColor}`}>
      <div className="text-2xl font-semibold">
        <TerminalText
          text="bat blog/README.md"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`flex w-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Contenido de texto (60% del ancho) */}
        <div className="text-xl w-[60%] pr-4 space-y-2">
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
        className={`
          relative inline-flex items-center justify-center
          mt-2 px-3 border rounded-sm text-base self-start
          overflow-hidden
          transition-[background-size,color,opacity] duration-300 ease-out
          ${showContent ? 'opacity-100' : 'opacity-0'}
          ${isDark
            ? "border-cloud/60 text-white hover:text-primary [--fill:theme(colors.cloud)]"
            : "border-primary/60 text-black hover:text-secondary [--fill:theme(colors.primary)]"
          }
          bg-[radial-gradient(circle_at_center,var(--fill)_0%,var(--fill)_100%)]
          bg-no-repeat bg-center [background-size:0%_0%]
          hover:[background-size:140%_140%]
        `}
      >
        <span className="relative z-10">{t.action} ↗</span>
      </Link>
    </div>
  )
}

export default BlogChannel

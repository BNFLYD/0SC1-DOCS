"use client"
import { useState } from "react"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"
import TerminalText from "../TerminalText"

const ProjectsChannel = () => {
  const { language, isDark } = useUser()
  const textColor = isDark ? "text-white" : "text-black"
  const t = translations[language].channelContent.projects
  const [showContent, setShowContent] = useState(false)

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <div className="text-xl font-bold">
        <TerminalText
          text="ls projects/"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`text-lg font-mono font-semibold transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <p>{t.title}</p>
        <ul className="list-disc list-inside ml-2">
          {t.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <button
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
        <span className="relative z-10">{translations[language].projects} ↗</span>
      </button>
    </div>
  )
}

export default ProjectsChannel

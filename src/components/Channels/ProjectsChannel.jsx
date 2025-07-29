"use client"
import { useState } from "react"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"
import TerminalText from "../TerminalText"

const ProjectsChannel = ({ theme }) => {
  const isDark = theme === "dark"
  const textColor = isDark ? "text-white" : "text-black"
  const { language } = useUser()
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
        className={`mt-4 px-3 py-1 border rounded-md text-xs font-bold self-start transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'} ${isDark ? "border-white/60 hover:bg-white/10" : "border-black/60 hover:bg-black/10"}`}
      >
        {translations[language].projects} →
      </button>
    </div>
  )
}

export default ProjectsChannel

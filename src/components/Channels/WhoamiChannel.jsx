"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"
import TerminalText from "../TerminalText"
import report from "../../assets/report.png";

const WhoamiChannel = () => {
  const { language, isDark } = useUser()
  const t = translations[language].channelContent.whoami
  const textColor = isDark ? "text-white" : "text-black"
  const [showContent, setShowContent] = useState(false)

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <div className="text-xl font-bold">
        <TerminalText
          text="whoami"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`flex items-start w-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-lg font-mono font-semibold flex flex-col pr-4 " style={{ width: "60%" }}>
          {t.items.map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
        <div className=" flex flex-col h-full pl-4" style={{ width: "40%" }}>
          <img loading="lazy" src={report} alt="report" className="w-auto h-auto rounded-lg"/>
        </div>
      </div>
      <Link
        to="/about"
        className={`mt-4 px-3 py-1 border rounded-md text-xs font-bold self-start transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'} ${isDark ? "border-white/60 hover:bg-white/10" : "border-black/60 hover:bg-black/10"}`}
      >
        {translations[language].about} →
      </Link>
    </div>
  )
}

export default WhoamiChannel

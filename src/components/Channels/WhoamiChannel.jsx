"use client"

import { Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"

const WhoamiChannel = ({ theme }) => {
  const { language } = useUser()
  const t = translations[language].channelContent.whoami
  const isDark = theme === "dark"
  const textColor = isDark ? "text-white" : "text-black"

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <p className="text-xl font-bold">{"> whoami"}</p>
      <div className="text-lg font-mono font-semibold">

        {t.items.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
      <Link
        to="/about"
        className={`mt-4 px-3 py-1 border rounded-md text-xs font-bold self-start ${isDark ? "border-white/60 hover:bg-white/10" : "border-black/60 hover:bg-black/10"}`}
      >
        {translations[language].about} →
      </Link>
    </div>
  )
}

export default WhoamiChannel

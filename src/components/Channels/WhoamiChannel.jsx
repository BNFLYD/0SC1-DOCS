"use client"

import { Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"
import report from "../../assets/report.png";

const WhoamiChannel = ({ theme }) => {
  const { language } = useUser()
  const t = translations[language].channelContent.whoami
  const isDark = theme === "dark"
  const textColor = isDark ? "text-white" : "text-black"

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <p className="text-xl font-bold">{"> whoami"}</p>
      <div className="flex items-start w-full">
        <div className="text-lg font-mono font-semibold flex flex-col pr-4 " style={{ width: "60%" }}>
          {t.items.map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
        <div className=" flex flex-col h-full pl-4" style={{ width: "40%" }}>
          <img src={report} alt="report" className="w-auto h-auto rounded-lg"/>
        </div>
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

import { useState } from "react"
import { Link } from "react-router-dom"
import TerminalText from "../UI/TerminalText"
import report from "../../assets/report.png";

const WhoamiChannel = ({ language, isDark, t }) => {
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
          {(t?.channelContent?.whoami?.items || []).map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
        <div className=" flex flex-col h-full pl-4" style={{ width: "40%" }}>
          <img loading="lazy" src={report} alt="report" className="w-auto h-auto rounded-2xl" />
        </div>
      </div>
      <Link
        to="/about"
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
        <span className="relative z-10">{t?.about || 'About'} ↗</span>
      </Link>
    </div>
  )
}

export default WhoamiChannel

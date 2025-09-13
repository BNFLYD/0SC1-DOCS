import { useState } from "react"
import { Link } from "react-router-dom"
import TerminalText from "../UI/TerminalText"
import report from "../../assets/report.png";

const WhoamiChannel = ({ language, isDark, t }) => {
  const textColor = isDark ? "text-white" : "text-black"
  const [showContent, setShowContent] = useState(false)

  return (
    <div className={`flex flex-col p-8 gap-2 font-specs ${textColor}`}>
      <div className="text-2xl font-semibold">
        <TerminalText
          text="whoami"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`flex items-start w-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-xl flex flex-col pr-4 " style={{ width: "60%" }}>
          {(t?.channelContent?.whoami?.items || []).map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
        <div className=" flex flex-col h-full pl-4" style={{ width: "40%" }}>
          <img
            loading="eager"
            fetchpriority="high"
            decoding="auto"
            src={report}
            alt="report"
            className="w-auto h-auto rounded-2xl"
          />
        </div>
      </div>
      <Link
        to="/about"
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
        <span className="relative z-10">{t?.about || 'About'} ↗</span>
      </Link>
    </div>
  )
}

export default WhoamiChannel

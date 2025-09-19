import { useState } from "react"
import { Link } from "react-router-dom"
import TerminalText from "../UI/TerminalText"

const ProjectsChannel = ({ language, isDark, t }) => {
  const textColor = isDark ? "text-white" : "text-black"
  const [showContent, setShowContent] = useState(false)

  return (
    <div className={`font-specs flex flex-col p-8 gap-2 ${textColor}`}>
      <div className="text-2xl font-semibold">
        <TerminalText
          text="ls projects/"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`text-xl transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <p>{t?.channelContent?.projects?.title || 'Projects:'}</p>
        <ul className="list-disc list-inside ml-2">
          {(t?.channelContent?.projects?.items || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <Link
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
        to="/about#projects"
        aria-label="Go to About projects section"
      >
        <span className="relative z-10">{t?.projects || 'Projects'} ↗</span>
      </Link>
    </div>
  )
}

export default ProjectsChannel

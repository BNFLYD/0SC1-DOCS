"use client"

import { useState } from "react"
import { useUser } from "../../context/UserContext"

import TerminalText from "../TerminalText"

const HireChannel = () => {
const { isDark } = useUser()
  const textColor = isDark ? "text-white" : "text-black"
  const [showContent, setShowContent] = useState(false)

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <div className="text-xl font-bold">
        <TerminalText
          text="send email"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      <div className={`text-lg font-mono  font-semibold transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <p>de: email@example.com</p>
        <p>asunto: </p>
        <p>Your message here...</p>
      </div>
      <button
        className={`mt-4 px-3 py-1 border rounded-md text-xs font-bold self-start transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'} ${isDark ? "border-white/60 hover:bg-white/10" : "border-black/60 hover:bg-black/10"}`}
      >
        enviar →
      </button>
    </div>
  )
}

export default HireChannel

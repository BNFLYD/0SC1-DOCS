"use client"
import { useUser } from "../context/UserContext"
import { translations } from "../constants/translations"

const ChannelButtons = ({ activeChannel, onChannelChange, theme }) => {
  const isDark = theme === "dark"
  const { language } = useUser()

  const channels = [
    { id: "whoami", label: translations[language].about },
    { id: "blog", label: translations[language].blog },
    { id: "projects", label: translations[language].projects || "Projects" },
    { id: "nami", label: "News" },
    { id: "play", label: "Play" },
  ]

  const handleChannelClick = (channelId) => {
    // Si el canal ya está activo, lo desactivamos
    if (activeChannel === channelId) {
      onChannelChange(null)
    } else {
      onChannelChange(channelId)
    }
  }

  return (
      <div className="w-full h-full p-3 flex items-center justify-center">
        <div className="flex w-full justify-between px-8">
          {channels.map((channel) => (
            <div key={channel.id} className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleChannelClick(channel.id)}
                className={`px-7 py-3 text-xs font-mono font-bold rounded border transition-all duration-300 ${activeChannel === channel.id
                    ? "bg-[#2ca798]"
                    : isDark
                      ? "bg-black text-white border-white/60"
                      : "bg-gray-300 text-black border-black/60"
                  }`}
              >

              </button>
              <span className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-black"}`}>
                {channel.label}
              </span>
            </div>
          ))}
        </div>
      </div>
  )
}

export default ChannelButtons

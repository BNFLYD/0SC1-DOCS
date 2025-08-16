const ChannelButtons = ({ activeChannel, onChannelChange, isDark, t }) => {
  const channels = [
    { id: "whoami", label: t?.about || "About" },
    { id: "blog", label: t?.blog || "Blog" },
    { id: "projects", label: t?.projects || "Projects" },
    { id: "hire", label: t?.contact || "Contacto" },
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
                aria-pressed={activeChannel === channel.id}
                className={`relative isolate px-7 py-3 text-xs font-mono font-bold rounded border select-none
                  transition-all duration-200 ease-out
                  ${isDark ? 'bg-primary text-white border-white/40' : 'bg-secondary text-black border-black/30'}
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_6px_rgba(0,0,0,0.25)]
                  hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_8px_rgba(0,0,0,0.35)]
                  active:shadow-[inset_0_4px_12px_rgba(0,0,0,0.55),inset_0_-1px_0_rgba(255,255,255,0.12)]
                  hover:translate-y-[1px] active:translate-y-[3px]
                  ${activeChannel === channel.id ? (isDark ? 'ring-1 ring-feather/70 ring-offset-0 ring-offset-transparent' : 'ring-1 ring-feather ring-offset-0 ring-offset-transparent') : ''}
                  ${activeChannel === channel.id ? 'before:content-[""] before:absolute before:-inset-3 before:rounded-[inherit] before:bg-feather/70 before:blur-2xl before:-z-10 before:pointer-events-none' : ''}
                `}
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

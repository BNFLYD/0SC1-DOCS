"use client"

import { useState } from "react"
import CRTScreen from "../components/CRTScreen"
import SkillKnob from "../components/SkillKnob"
import AmplitudeIndicator from "../components/AmplitudeIndicator"
import ChannelButtons from "../components/ChannelButtons"
import SectionFrame from "../components/SectionFrame"
import { useUser } from "../context/UserContext"
import { translations } from "../constants/translations"

const Home = () => {
  const { language, isDark } = useUser()
  const [activeChannel, setActiveChannel] = useState(null)
  const [isDistorting, setIsDistorting] = useState(false)

  const handleChannelChange = (channelId) => {
    setIsDistorting(true) // Iniciar distorsión
    setTimeout(() => {
      setActiveChannel(channelId) // Cambiar canal después de que la distorsión comience
      setIsDistorting(false) // Terminar distorsión
    }, 250) // Duración de la distorsión (ajustable)
  }

  // Datos de habilidades y capacidades
  const skills = [
    { name: "Python", percentage: 70 },
    { name: "Javascript", percentage: 90 },
    { name: "Rust", percentage: 30 },
    { name: "Docker", percentage: 60 },
  ]

  const frontendCapabilities = [
    { name: "React", percentage: 90 },
    { name: "Svelte", percentage: 70 },
    { name: "Tailwind", percentage: 30 },
    { name: "Next", percentage: 60 },
  ]

  const backendCapabilities = [
    { name: "Node", percentage: 90 },
    { name: "Fast API", percentage: 70 },
    { name: "Tauri", percentage: 30 },
    { name: "PostgreSQL", percentage: 60 },
  ]

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-void text-white" : "bg-cloud text-black"
        }`}
    >

      {/* Contenido principal */}
      <main className="flex items-center justify-center" style={{ height: "calc(75vh)" }}>
        <div className="flex items-start w-full" style={{ maxWidth: "1440px" }}>
          {/* Monitor CRT (40% del ancho) */}
          <div className="p-4" style={{ width: "40%" }}>
            <CRTScreen theme={isDark ? "dark" : "light"} activeChannel={activeChannel} isDistorting={isDistorting} />
          </div>

          {/* Sección derecha (60% del ancho) - se ajusta a la altura del monitor */}
          <div className="flex flex-col h-full" style={{ width: "60%" }}>
            {/* Fila superior: Habilidades + Capacidades (85% del alto) */}
            <div className="flex flex-1" style={{ height: "80%" }}>
              {/* Habilidades (15% del ancho total = 25% de esta sección) */}
              <div className="pt-0 pr-2 pb-0 pl-4" style={{ width: "25%" }}>
                <SectionFrame title={translations[language].skills.toUpperCase()} theme={isDark ? "dark" : "light"}>
                  <div className="flex flex-col justify-evenly gap-8 items-center h-full py-2">
                    {skills.map((skill) => (
                      <SkillKnob key={skill.name} skill={skill.name} percentage={skill.percentage} theme={isDark ? "dark" : "light"} />
                    ))}
                  </div>
                </SectionFrame>
              </div>

              {/* Capacidades Frontend y Backend (45% del ancho total = 75% de esta sección) */}
              <div className="flex flex-col pt-1 px-2 pb-4" style={{ width: "75%" }}>
                {/* Frontend (50% del alto) */}
                <div style={{ height: "50%" }}>
                  <SectionFrame title={translations[language].frontend.toUpperCase()} theme={isDark ? "dark" : "light"}>
                    <div className="flex justify-between items-center w-full px-4">
                      {frontendCapabilities.map((capability) => (
                        <AmplitudeIndicator
                          key={capability.name}
                          skill={capability.name}
                          percentage={capability.percentage}
                          theme={isDark ? "dark" : "light"}
                        />
                      ))}
                    </div>
                  </SectionFrame>
                </div>

                {/* Espacio entre secciones reducido */}
                <div style={{ height: "20%" }}>

                </div>

                {/* Backend (50% del alto) */}
                <div style={{ height: "50%" }}>
                  <SectionFrame title={translations[language].backend.toUpperCase()} theme={isDark ? "dark" : "light"}>
                    <div className="flex justify-between items-center w-full px-4">
                      {backendCapabilities.map((capability) => (
                        <AmplitudeIndicator
                          key={capability.name}
                          skill={capability.name}
                          percentage={capability.percentage}
                          theme={isDark ? "dark" : "light"}
                        />
                      ))}
                    </div>
                  </SectionFrame>
                </div>
              </div>
            </div>

            {/* Fila inferior: Canales (15% del alto) */}
            <div>
              <div className="pr-2 pl-4">
                <SectionFrame title={translations[language].channels.toUpperCase()} theme={isDark ? "dark" : "light"}>
                  <ChannelButtons activeChannel={activeChannel} onChannelChange={handleChannelChange} theme={isDark ? "dark" : "light"} />
                </SectionFrame>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home

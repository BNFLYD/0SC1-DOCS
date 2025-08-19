import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import CRTScreen from "../components/CRTScreen"
import SkillKnob from "../components/UI/SkillKnob"
import AmplitudeIndicator from "../components/UI/AmplitudeIndicator"
import ChannelButtons from "../components/UI/ChannelButtons"
import SectionFrame from "../components/UI/SectionFrame"

const Home = () => {
  const { language, isDark, theme, t } = useOutletContext() || {}
  const [activeChannel, setActiveChannel] = useState(() => {
    try {
      return sessionStorage.getItem('ui:activeChannel') || null
    } catch {
      return null
    }
  })
  const [isDistorting, setIsDistorting] = useState(false)

  const handleChannelChange = (channelId) => {
    setIsDistorting(true) // Iniciar distorsión
    setTimeout(() => {
      setActiveChannel(channelId) // Cambiar canal después de que la distorsión comience
      setIsDistorting(false) // Terminar distorsión
    }, 250) // Duración de la distorsión (ajustable)
  }

  // Restaurar canal al volver de Auth0 y persistir selección
  useEffect(() => {
    try {
      if (sessionStorage.getItem('contact:pending') === '1') {
        setActiveChannel('hire')
        sessionStorage.setItem('ui:activeChannel', 'hire')
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (activeChannel) {
        sessionStorage.setItem('ui:activeChannel', activeChannel)
      } else {
        sessionStorage.removeItem('ui:activeChannel')
      }
    } catch {}
  }, [activeChannel])

  // Datos de habilidades y capacidades
  const skills = [
    { name: "Python", percentage: 70 },
    { name: "Javascript", percentage: 90 },
    { name: "Rust", percentage: 30 },
    { name: "Docker", percentage: 60 },
  ]

  const aiCapabilities = [
    { name: "IA SDK", percentage: 90 },
    { name: "MCPs", percentage: 70 },
    { name: "n8n", percentage: 40 },
    { name: "Vibe Cod", percentage: 20 },
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
      className="min-h-screen transition-colors duration-300 bg-none"
    >

      {/* Contenido principal */}
      <main>
        <section>
          <div className="flex items-center justify-center" style={{ height: "calc(75vh)" }}>
            <div className="flex items-start w-full" style={{ maxWidth: "1440px" }}>
            {/* Monitor CRT (40% del ancho) */}
            <div className="p-4" style={{ width: "40%" }}>
              <CRTScreen theme={theme} activeChannel={activeChannel} isDistorting={isDistorting} language={language} isDark={isDark} t={t} />
            </div>

            {/* Sección derecha (60% del ancho) - se ajusta a la altura del monitor */}
            <div className="flex flex-col h-full" style={{ width: "60%" }}>
              {/* Fila superior: Habilidades + Capacidades (85% del alto) */}
              <div className="flex flex-1" style={{ height: "80%" }}>
                {/* Habilidades (15% del ancho total = 25% de esta sección) */}
                <div className="pt-0 pr-2 pb-0 pl-4" style={{ width: "25%" }}>
                  <SectionFrame title={(t?.skills || 'Habilidades').toUpperCase()} isDark={isDark}>
                    <div className="flex flex-col justify-evenly gap-8 items-center h-full py-2">
                      {skills.map((skill) => (
                        <SkillKnob key={skill.name} skill={skill.name} percentage={skill.percentage} isDark={isDark} />
                      ))}
                    </div>
                  </SectionFrame>
                </div>

                {/* Capacidades Frontend IA y Backend (45% del ancho total = 75% de esta sección) */}
                <div className="flex flex-col pt-1 px-2 pb-4" style={{ width: "75%" }}>
                  {/* Frontend (33% del alto) */}
                  <div style={{ height: "33%" }}>
                    <SectionFrame title={(t?.frontend || 'Frontend').toUpperCase()} isDark={isDark}>
                      <div className="flex justify-between items-center w-full px-4">
                        {frontendCapabilities.map((capability) => (
                          <AmplitudeIndicator
                            key={capability.name}
                            skill={capability.name}
                            percentage={capability.percentage}
                            shouldAnimate={true}
                            isDark={isDark}
                          />
                        ))}
                      </div>
                    </SectionFrame>
                  </div>

                  {/* AI (33% del alto) */}
                  <div style={{ height: "33%" }}>
                    <SectionFrame title={(t?.ai || 'IA').toUpperCase()} isDark={isDark}>
                      <div className="flex justify-between items-center w-full px-4">
                        {aiCapabilities.map((capability) => (
                          <AmplitudeIndicator
                            key={capability.name}
                            skill={capability.name}
                            percentage={capability.percentage}
                            shouldAnimate={true}
                            isDark={isDark}
                          />
                        ))}
                      </div>
                    </SectionFrame>
                  </div>

                  {/* Backend (33% del alto) */}
                  <div style={{ height: "33%" }}>
                    <SectionFrame title={(t?.backend || 'Backend').toUpperCase()} isDark={isDark}>
                      <div className="flex justify-between items-center w-full px-4">
                        {backendCapabilities.map((capability) => (
                          <AmplitudeIndicator
                            key={capability.name}
                            skill={capability.name}
                            percentage={capability.percentage}
                            shouldAnimate={true}
                            isDark={isDark}
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
                  <SectionFrame title={(t?.channels || 'Canales').toUpperCase()} isDark={isDark}>
                    <ChannelButtons activeChannel={activeChannel} onChannelChange={handleChannelChange} isDark={isDark} t={t} />
                  </SectionFrame>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home

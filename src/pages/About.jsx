"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "../context/UserContext"
import { Mail, Github, Linkedin } from "lucide-react"
import TerminalText from "../components/TerminalText"
import AmplitudeIndicator from "../components/AmplitudeIndicator"
import StaticEffect from "../components/UI/StaticEffect"
import profile from "../assets/yo.jpg"
import hornero from "../assets/hornero.svg"
import osci from "../assets/sprite-try.svg";

const About = () => {
  const { isDark } = useUser()
  const [isSkillsSectionVisible, setIsSkillsSectionVisible] = useState(false)
  const [showWhoamiContent, setShowWhoamiContent] = useState(false)
  const [showSkillsContent, setShowSkillsContent] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const skillsSectionRef = useRef(null)

  const images = [profile, osci, hornero]

  // Efecto para el IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSkillsSectionVisible(entry.isIntersecting)
          if (!entry.isIntersecting) {
            // Resetear el estado del contenido cuando el elemento sale de la vista
            setShowSkillsContent(false)
          }
        })
      },
      {
        threshold: 0.5, // El 50% del elemento debe ser visible para activar
      },
    )

    const currentRef = skillsSectionRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, []) // Se ejecuta una sola vez al montar el componente


  // Datos de habilidades organizados por categorías
  const skillCategories = [
    {
      title: "Habilidades",
      skills: [
        { name: "Javascript", percentage: 90 },
        { name: "Python", percentage: 70 },
        { name: "Rust", percentage: 30 },
        { name: "Docker", percentage: 60 },
      ],
    },
    {
      title: "Backend",
      skills: [
        { name: "Node", percentage: 90 },
        { name: "Fast API", percentage: 70 },
        { name: "Tauri", percentage: 30 },
        { name: "PostgreSQL", percentage: 60 },
      ],
    },
    {
      title: "Frontend",
      skills: [
        { name: "React", percentage: 90 },
        { name: "Svelte", percentage: 70 },
        { name: "Tailwind", percentage: 30 },
        { name: "Next", percentage: 60 },
      ],
    },
    {
      title: "Inteligencia Artificial",
      skills: [
        { name: "IA SDK", percentage: 10 },
        { name: "Model Context Protocols", percentage: 20 },
        { name: "Vibe Coding", percentage: 20 },
        { name: "Context Enginiering", percentage: 40 },
      ],
    },
  ]

  return (
    <div
      className="min-h-screen transition-colors duration-300 bg-none">
      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto space-y-52">
        {" "}
        {/* Añadido px-6 para padding lateral */}
        {/* Sección de perfil */}
        <section>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 pt-32">
            {/* Información personal */}
            <div className="flex-1 text-left">
              <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 tracking-wider">
                <TerminalText text="whoami" onComplete={() => setShowWhoamiContent(true)} />
              </h1>

              <div
                className={`p-6 rounded-xl border-2 transition-opacity duration-500 ${isDark ? "border-primary/10 bg-primary" : "border-secondary/10 bg-secondary"
                  } ${showWhoamiContent ? "opacity-100" : "opacity-0"}`}
              >
                <h2 className="text-xl font-mono font-bold mb-4 tracking-wide">Flavio Gabriel Morales</h2>

                <div className="space-y-3 font-mono text-lg leading-relaxed">
                  <p>Desarrollador Full Stack apasionado por crear soluciones tecnológicas innovadoras y eficientes.</p>
                  <p>
                    Me especializo en el desarrollo web moderno, con experiencia en arquitecturas escalables y tecnologías
                    de vanguardia.
                  </p>
                  <p>
                    Disfruto trabajando tanto en el frontend como en el backend, siempre buscando escribir código limpio y
                    mantenible.
                  </p>
                  <p>
                    Cuando no estoy programando, me gusta explorar nuevas tecnologías, contribuir a proyectos open source
                    y compartir conocimiento con la comunidad.
                  </p>
                </div>
              </div>
            </div>

            {/* Columna derecha: Foto de perfil + Contacto */}
            <div className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${showWhoamiContent ? "opacity-100" : "opacity-0"}`}>
              {/* Foto de perfil */}
              <div
                className={`w-48 h-48 rounded-3xl overflow-hidden relative cursor-pointer ${isDark ? "bg-primary" : "bg-secondary"
                  }`}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                    setTimeout(() => {
                      setIsTransitioning(false);
                    }, 500);
                  }, 500);
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {currentImageIndex === 1 ? (
                    <div
                      className={`animate-sprite bg-no-repeat w-full h-full ${isDark ? "filter invert-[0%] hue-rotate-0" : "filter invert-[100%] hue-rotate-180"}`}
                      style={{
                        backgroundImage: `url(${images[1]})`,
                        backgroundSize: '100% 6400%'
                      }}
                    />
                  ) : (
                    <img
                      src={images[currentImageIndex]}
                      alt={`Profile ${currentImageIndex + 1}`}
                      className={`w-full h-full transition-opacity duration-300
                        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
                        ${currentImageIndex === 2 ? 'object-contain animate-float' : ''}`}
                    />
                  )}
                </div>
                {isTransitioning && (
                  <StaticEffect
                    theme={isDark ? "dark" : "light"}
                    intensity={150}
                    flashProbability={0.2}
                  />
                )}
              </div>

              {/* Sección de contacto */}
              <div
                className={`w-48 rounded-xl}`}
              >
                <h3 className="text-xl font-mono font-bold mb-4 tracking-wide text-center">Contacto</h3>
                <div className="flex justify-center gap-2 font-mono text-sm">
                  {/* Reducido gap-4 a gap-2 */}
                  <a
                    href="mailto:tu@email.com"
                    className={`relative p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center group ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                      }`}
                    aria-label="Enviar correo electrónico"
                  >
                    <Mail className="w-5 h-5" />
                    <span
                      className={`absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono whitespace-nowrap ${isDark ? "text-white" : "text-black"
                        }`}
                    >
                      Email
                    </span>
                  </a>
                  <a
                    href="https://github.com/FlavioG01"
                    className={`relative p-3 rounded-lg transition-all duration-300 flex flex-col items-center justify-center group ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                      }`}
                    aria-label="Ver perfil de GitHub"
                  >
                    <Github className="w-5 h-5" />
                    <span
                      className={`absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono whitespace-nowrap ${isDark ? "text-white" : "text-black"
                        }`}
                    >
                      GitHub
                    </span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/flavio-gabriel-morales-939371184/"
                    className={`relative p-3 rounded-lg transition-all duration-300 flex flex-col items-center justify-center group ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                      }`}
                    aria-label="Ver perfil de LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span
                      className={`absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono whitespace-nowrap ${isDark ? "text-white" : "text-black"
                        }`}
                    >
                      LinkedIn
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de habilidades */}
        <section>
          <div
            ref={skillsSectionRef} // Asignar la referencia
            className={`space-y-8 py-12 transition-opacity duration-1000 ease-out ${isSkillsSectionVisible ? "opacity-100" : "opacity-0" // Controlar la opacidad
              }`}
          >
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 tracking-wider">
              <TerminalText
                text="htop skills"
                inView={isSkillsSectionVisible}
                onComplete={() => setShowSkillsContent(true)}
              />
            </h1>

            <div className={`transition-opacity duration-500 space-y-6 ${showSkillsContent ? "opacity-100" : "opacity-0"}`}>
              {skillCategories.map((category) => (
                <div key={category.title} className="space-y-2">
                  {/* Título de la categoría */}
                  <h3
                    className={`text-xl font-mono font-bold tracking-wide pb-2 border-b ${isDark ? "border-white/20" : "border-black/20"
                      }`}
                  >
                    {category.title}
                  </h3>

                  {/* Grid de habilidades */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.skills.map((skill) => (
                      <AmplitudeIndicator
                        key={skill.name}
                        skill={skill.name}
                        percentage={skill.percentage}
                        theme={isDark ? "dark" : "light"}
                        vertical={false}
                        shouldAnimate={showSkillsContent}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div></div>
      </main>
    </div>
  )
}

export default About

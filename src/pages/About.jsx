"use client"

import { useUser } from "../context/UserContext"
import { Mail, Github, Linkedin } from "lucide-react"
import AmplitudeIndicator from "../components/AmplitudeIndicator"
import profile from "../assets/yo.jpg";

const About = () => {
  const { isDark } = useUser()


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
  ]

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-void text-white" : "bg-cloud text-black"
        }`}
    >
      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Sección de perfil */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
          {/* Información personal */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 tracking-wider">{">"} whoami</h1>

            <div
              className={`p-6 rounded-xl border-2 ${isDark ? "border-white/40 bg-gray-900/50" : "border-black/40 bg-gray-100/50"
                }`}
            >
              <h2 className="text-xl font-mono font-bold mb-4 tracking-wide">Flavio Gabriel Morales</h2>

              <div className="space-y-3 font-mono text-sm leading-relaxed">
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
          <div className="flex flex-col items-center gap-8">
            {/* Foto de perfil */}
            <div
              className={`w-48 h-48 rounded-3xl border-2 overflow-hidden ${isDark ? "border-white/40" : "border-black/40"
                }`}
            >
              <img src={profile} alt="report" className="w-auto h-auto rounded-lg" />
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
                  className={`relative p-3 rounded-lg transition-all duration-300 flex flex-col items-center justify-center group ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"
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
                  href="https://github.com/tuusuario"
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
                  href="https://linkedin.com/in/tuusuario"
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

        {/* Sección de habilidades */}
        <div className="space-y-12">
          <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 tracking-wider">{">"} skills --list</h1>

          {skillCategories.map((category) => (
            <div key={category.title} className="space-y-6">
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default About

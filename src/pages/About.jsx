"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  const [showWhoamiContent, setShowWhoamiContent] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  // Estado unificado para las secciones
  const [sections, setSections] = useState({
    skills: { isVisible: false, canScroll: true, showContent: false },
    experience: { isVisible: false, canScroll: true, showContent: false }
  })

  // Referencias unificadas
  const skillsRef = useRef(null)
  const experienceRef = useRef(null)
  const sectionRefs = useMemo(() => ({
    skills: skillsRef,
    experience: experienceRef
  }), [])

  // Función para scroll suave personalizado
  const smoothScrollTo = useCallback((element) => {
    if (isScrolling) return; // Evitar múltiples scrolls simultáneos

    setIsScrolling(true);
    const navbarHeight = 80; // Altura aproximada del navbar
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
    const startPosition = window.pageYOffset;
    const distance = offsetPosition - startPosition;
    const duration = 1000; // Duración en ms
    let start = null;

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);

      // Función de easing para un movimiento más suave
      const easeInOutCubic = progress => {
        return progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      };

      window.scrollTo(0, startPosition + distance * easeInOutCubic(progress));

      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(animation);
  }, [isScrolling, setIsScrolling]);

  const images = [profile, osci, hornero]

  // Efecto para el IntersectionObserver
  // Función auxiliar para actualizar el estado de una sección
  const updateSection = useCallback((sectionId, updates) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], ...updates }
    }));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Identificar qué sección está siendo observada por su ref
          const sectionId = Object.keys(sectionRefs).find(
            key => sectionRefs[key].current === entry.target
          );

          if (sectionId) {
            const currentSection = sections[sectionId];

            if (entry.isIntersecting) {
              // Cuando la sección entra en vista
              updateSection(sectionId, { isVisible: true });

              if (currentSection.canScroll && !isScrolling) {
                smoothScrollTo(entry.target);
                updateSection(sectionId, { canScroll: false });
              }
            } else {
              // Cuando la sección sale de vista
              updateSection(sectionId, {
                isVisible: false,
                showContent: false,
                canScroll: true
              });
            }
          }
        });
      },
      {
        threshold: 0.4,
        rootMargin: '0px 0px'
      }
    );

    // Observar todas las secciones
    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [isScrolling, sections, updateSection, smoothScrollTo, sectionRefs]);


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
                <TerminalText text= "whoami"onComplete={() => setShowWhoamiContent(true)} />
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
                    href="mailto:flaviogv010@gmail.com"
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
            ref={sectionRefs.skills}
            className={`space-y-8 py-12 transition-opacity duration-1000 ease-out ${
              sections.skills.isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 tracking-wider">
              <TerminalText
                text="htop skills"
                inView={sections.skills.isVisible}
                onComplete={() => updateSection('skills', { showContent: true })}
              />
            </h1>

            <div className={`transition-opacity duration-500 space-y-6 ${sections.skills.showContent ? "opacity-100" : "opacity-0"}`}>
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
                        shouldAnimate={sections.skills.showContent}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sección de experiencia øøø*/}
        <section>
          <div
            ref={sectionRefs.experience}
            className={`space-y-8 py-12 transition-opacity duration-1000 ease-out ${
              sections.experience.isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 tracking-wider">
              <TerminalText
                text="bat experience.md"
                inView={sections.experience.isVisible}
                onComplete={() => updateSection('experience', { showContent: true })}
              />
            </h1>

            <div className={`transition-opacity duration-500 ${sections.experience.showContent ? "opacity-100" : "opacity-0"}`}>
              <div className={`p-6 rounded-xl border-2 ${
                isDark ? "border-primary/10 bg-primary" : "border-secondary/10 bg-secondary"
              }`}>
                <div className="space-y-4 font-mono text-lg">
                  <p>
                    Con más de 5 años de experiencia en desarrollo web, he participado
                    en diversos proyectos que han enriquecido mi perfil profesional.
                  </p>
                  <p>
                    Mi trayectoria incluye el desarrollo de aplicaciones web escalables,
                    implementación de arquitecturas robustas y optimización de rendimiento
                    en proyectos de alto impacto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default About

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "../hooks/useAuth"
import { Icon } from "@iconify/react"
import { useInView } from 'react-intersection-observer'
import TerminalText from "../components/UI/TerminalText"
import ProjectCards from "../components/UI/ProjectCards"
import ContactForm from "../components/ContactForm"
import AmplitudeIndicator from "../components/UI/AmplitudeIndicator"
import StaticEffect from "../components/UI/StaticEffect"
import Toast from "../components/UI/Toast"
import profile from "../assets/yo.jpg"
import hornero from "../assets/hornero.svg"
import osci from "../assets/sprite.svg";
import { useOutletContext } from "react-router-dom"

// Componente para la imagen con intersection observer
// Añade prioridad de descarga y tamaño intrínseco para evitar CLS
const InViewImage = ({ src, alt, isTransitioning, currentImageIndex, w, h, decoding = "auto" }) => {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });

  // Tamaños por defecto alineados al contenedor (w-48 h-48 => 192px)
  const width = w ?? 192;
  const height = h ?? 192;

  return (
    <img
      loading="eager"
      fetchpriority="high"
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      decoding={decoding}
      className={`w-full h-full transition-opacity duration-300
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        ${currentImageIndex === 2 ? 'object-contain animate-float' : ''}
        ${inView ? 'scale-100' : 'scale-95'}
        transition-all duration-700 ease-out`}
    />
  );
};

const About = () => {
  const context = useOutletContext() || {}
  const { isDark, theme, isMuttActive, setIsMuttActive, t } = context
  const safeSetIsMuttActive = typeof setIsMuttActive === 'function' ? setIsMuttActive : () => {}
  const { isLoading } = useAuth()
  const [showWhoamiContent, setShowWhoamiContent] = useState(false)
  const [headerText, setHeaderText] = useState(isMuttActive ? "mutt" : "whoami")

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [hoveredSkill, setHoveredSkill] = useState(null)
  // Estados propios del formulario fueron movidos a ContactForm
  // Estado para saber si la card de auth del formulario hijo está abierta
  const [authCardOpenFromChild, setAuthCardOpenFromChild] = useState(false)

  // No persistir mutt entre vistas: al montar decidir por redirect pendiente; al desmontar, resetear
  useEffect(() => {
    let pending = false
    try {
      pending = sessionStorage.getItem('contact:pending') === '1'
    } catch {}
    if (pending) {
      setHeaderText('mutt')
      safeSetIsMuttActive(true)
    } else {
      setHeaderText('whoami')
      safeSetIsMuttActive(false)
    }
    return () => {
      // Al salir de About, no conservar mutt
      safeSetIsMuttActive(false)
    }
  }, [safeSetIsMuttActive])

  // Función para manejar el cambio de texto y mostrar/ocultar el formulario
  const handleMailClick = () => {
    const newState = headerText === "whoami"
    // Actualizamos ambos estados
    setHeaderText(newState ? "mutt" : "whoami")
    safeSetIsMuttActive(newState)
    // Si volvemos a whoami, ocultamos el formulario inmediatamente
    if (headerText === "mutt") {
      setShowEmailForm(false)
    }
  }

  // Estado unificado para las secciones
  const [sections, setSections] = useState({
    skills: { isVisible: false, canScroll: true, showContent: false },
    experience: { isVisible: false, canScroll: true, showContent: false },
    projects: { isVisible: false, canScroll: true, showContent: false },
  })
  // Ref para tener el estado de secciones siempre actualizado en callbacks
  const sectionsRef = useRef(sections)
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  // Referencias unificadas
  const skillsRef = useRef(null)
  const experienceRef = useRef(null)
  const projectsRef = useRef(null)
  const sectionRefs = useMemo(() => ({
    skills: skillsRef,
    experience: experienceRef,
    projects: projectsRef,
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

  // Project cards content
  const projectItems = useMemo(() => ([
    {
      title: "BlackSun",
      description: "Diseño funcional alineado al negocio.",
      tecnologies: "Next.js, tailwindcss",
      access: "https://github.com/0SC1/black-sun",
      icon: "ph:rocket-launch-duotone",
    },
    {
      title: "Hornero",
      description: "Buenas prácticas, disciplina y gobierno de datos.",
      tecnologies: "React, Tailwind",
      access: "https://github.com/0SC1/hornero",
      icon: "ph:target-duotone",
    },

  ]), [])

  // Helper: get toast key from skill display name
  const getToastKey = useCallback((name) => {
    const map = {
      'Javascript': 'javascript',
      'JavaScript': 'javascript',
      'Python': 'python',
      'Rust': 'rust',
      'Docker': 'docker',
      'Node': 'node',
      'Fast API': 'fastapi',
      'Tauri': 'tauri',
      'PostgreSQL': 'postgresql',
      'React': 'react',
      'Svelte': 'svelte',
      'Tailwind': 'tailwind',
      'Next': 'next',
      'IA SDK': 'ia_sdk',
      'n8n': 'n8n',
      'Model Context Protocols': 'mcp',
      'Vibe Coding': 'vibe_coding'
    }
    return map[name] || null
  }, [])

  // Preload del sprite (se usa como background-image, no aplica atributos de <img>)
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = osci
    // @ts-ignore: fetchPriority no está tipado en algunos TS/DOM
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => {
      if (link.parentNode) document.head.removeChild(link)
    }
  }, [])

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
            const currentSection = sectionsRef.current[sectionId];

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
  }, [isScrolling, updateSection, smoothScrollTo, sectionRefs, isLoading]);

  // Loguear rechazos no manejados para evitar pantallas en blanco silenciosas
  useEffect(() => {
    const handler = (e) => {
      console.error('[unhandledrejection]', e.reason)
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])


  // Datos de habilidades organizados por categorías
  const skillCategories = [
    {
      title: "Habilidades",
      skills: [
        { name: "Javascript", percentage: 90, toast: "El lenguaje de la web, ideal para el desarrollo de apps y sitios facilmente desplegables y de alto rendimiento, sobre todo con ES6+, mi lenguaje favorito", icon: "simple-icons:javascript" },
        { name: "Python", percentage: 70, toast: "Un lenguaje dinamico, flexible y con un repertorio de bibliotecas enorme sobre todo para Data Science y AI/ML, actualmente es el lenguaje de la IA", icon: "simple-icons:python" },
        { name: "Rust", percentage: 30, toast: "Un lenguaje diseñado para ser robusto, tener un exelente performance y ser seguro. Es la opcion ideal para gestionar sistemas de alta velocidad y concurrencia", icon: "simple-icons:rust" },
        { name: "Docker", percentage: 60, toast: "Una plataforma para desarrollar, enviar y ejecutar aplicaciones en contenedores. Es la opcion ideal para desplegar servicios en la nube de manera eficiente", icon: "simple-icons:docker" },
      ],
    },
    {
      title: "Backend",
      skills: [
        { name: "Node", percentage: 90, toast: "Es, junto con Deno y Bun, el entorno de ejecución de JavaScript del servidor, ideal para apps backend escalables y en tiempo real, confiable y seguro", icon: "simple-icons:nodedotjs" },
        { name: "Fast API", percentage: 70, toast: "Un framework moderno y rápido para construir APIs con Python similar a Django pero más minimalista, ligero y asincrono. Es ideal para microservicios", icon: "simple-icons:fastapi" },
        { name: "Tauri", percentage: 30, toast: "Es rapido, ligero, trabaja a nivel de sistema y permite crear apps de Rust con tecnologías web. Es mejor que Electron para aplicaciones multiplataforma", icon: "simple-icons:tauri" },
        { name: "PostgreSQL", percentage: 60, toast: "Es una sql moderna, rapida, eficiente, ampliamente utilizada y de codigo abierto. Es ideal para proyectos con relaciones complejas", icon: "simple-icons:postgresql" },
      ],
    },
    {
      title: "Frontend",
      skills: [
        { name: "React", percentage: 90, toast: "El framework de JavaScript más popular para construir interfaces de usuario. Ideal para aplicaciones web interactivas y dinámicas", icon: "simple-icons:react" },
        { name: "Svelte", percentage: 70, toast: "Un framework centrado en la optimización del rendimiento. Ideal para proyectos donde se necesita un desarrollo ágil y una interfaz simple pero moderna", icon: "simple-icons:svelte" },
        { name: "Tailwind", percentage: 30, toast: "Un framework CSS para diseño responsivo y personalizado. Ideal para desarrollar una solución rápida y flexible con mucho estilo", icon: "simple-icons:tailwindcss" },
        { name: "Next", percentage: 60, toast: "Un framework para React que permite la renderización del lado del servidor y la optimización del rendimiento. Ideal para proyectos mas grandes y escalables", icon: "simple-icons:nextdotjs" },
      ],
    },
    {
      title: "Inteligencia Artificial",
      skills: [
        { name: "IA SDK", percentage: 10, toast: "Desarrollado por Vercel, es un conjunto de herramientas y bibliotecas que facilitan la integración de modelos de inteligencia artificial en aplicaciones", icon: "simple-icons:vercel" },
        { name: "Model Context Protocols", percentage: 20, toast: "Un protocolo de gestión de contextos en IA desarrollado por Anthropic. Actualmente es un estándar para la interacción entre modelos y su entorno", icon: "simple-icons:claude" },
        { name: "n8n", percentage: 40, toast: "Una herramienta de automatización de flujos de trabajo que permite integrar diferentes servicios, aplicaciones y modelos de manera sencilla", icon: "simple-icons:n8n" },
        { name: "Vibe Coding", percentage: 20, toast: "Una técnica donde la IA hace el codigo mediante prompts, bien usada mejora el flujo de trabajo para el diseño de interfaces y el prototipado basico", icon: "material-symbols:airwave" },
      ],
    },
  ]

  return (
    <div
      className="min-h-screen transition-colors duration-300 bg-none relative">
      {/* Overlay de carga no destructivo (no desmonta el contenido) */}
      {isLoading && !authCardOpenFromChild && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-500 opacity-75"></div>
        </div>
      )}
      {/* Contenido principal (siempre montado) */}
      <main className="max-w-7xl mx-auto space-y-52">
        {" "}
        {/* Añadido px-6 para padding lateral */}
        {/* Sección de perfil */}
        <section>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 pt-32">
            {/* Información personal */}
            <div className="flex-1 text-left">
              <h1 className="text-4xl md:text-5xl font-specs font-semibold mb-6 tracking-wider">
                <TerminalText
                  key={headerText}
                  text={t?.aboutPage?.header?.[headerText] || headerText}
                  onComplete={() => {
                    setShowWhoamiContent(true)
                    if (headerText === "mutt") {
                      setShowEmailForm(true)
                    }
                  }}
                />
              </h1>

              <div
                className={`p-6 rounded-xl border-2 transition-opacity duration-500 ${isDark ? "border-primary/10 bg-primary" : "border-secondary/10 bg-secondary"
                  } ${showWhoamiContent ? "opacity-100" : "opacity-0"}`}
              >
                {showEmailForm ? (
                  <div className="space-y-4 font-mono">
                    {/* Formulario de contacto extraído a componente */}
                    <ContactForm
                      isDark={isDark}
                      t={t}
                      onCardOpenChange={setAuthCardOpenFromChild}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-sans font-semibold mb-4 tracking-wide">{t?.aboutPage?.profile?.name || 'Flavio Gabriel Morales'}</h2>
                    <div className="space-y-3 font-sans text-xl leading-relaxed">
                      <p>{t?.aboutPage?.profile?.bio?.[0] || 'Desarrollador Full Stack apasionado por crear soluciones tecnológicas innovadoras y eficientes.'}</p>
                      <p>{t?.aboutPage?.profile?.bio?.[1] || 'Me especializo en el desarrollo web moderno, con experiencia en arquitecturas escalables y tecnologías de vanguardia.'}</p>
                      <p>{t?.aboutPage?.profile?.bio?.[2] || 'Disfruto trabajando tanto en el frontend como en el backend, siempre buscando escribir código limpio y mantenible.'}</p>
                      <p>{t?.aboutPage?.profile?.bio?.[3] || 'Cuando no estoy programando, me gusta explorar nuevas tecnologías, contribuir a proyectos open source y compartir conocimiento con la comunidad.'}</p>
                    </div>
                  </>
                )}
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
                    <InViewImage
                      src={images[currentImageIndex]}
                      alt={`Profile ${currentImageIndex + 1}`}
                      isTransitioning={isTransitioning}
                      currentImageIndex={currentImageIndex}
                    />
                  )}
                </div>
                {isTransitioning && (
                  <StaticEffect
                    theme={theme}
                    intensity={150}
                    flashProbability={0.2}
                  />
                )}
              </div>

              {/* Sección de contacto */}
              <div
                className={`w-48 rounded-xl`}
              >
                <h3 className="text-xl font-sans font-semibold mb-4 tracking-wide text-center">{t?.aboutPage?.contact?.title || 'Contacto'}</h3>
                <div className="flex justify-center gap-2 font-sans text-sm">
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      handleMailClick();
                    }}
                    className={`relative p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center group`}
                    aria-label={(t?.aboutPage?.contact?.email || 'Email')}
                  >
                    <Icon
                      icon="streamline-logos:protonmail-logo-2-block"
                      width="28"
                      height="28"
                      className={`mb-2 mx-auto transition-colors duration-200 ${isDark ? 'text-white' : 'text-black'}`}
                    />
                    <span
                      className={`absolute bottom-[-0.5rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-sans whitespace-nowrap ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                        }`}
                    >
                      {t?.aboutPage?.contact?.email || 'Email'}
                    </span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/flavio-gabriel-morales-939371184/"
                    className={`relative p-3 rounded-lg transition-all duration-300 flex flex-col items-center justify-center group`}
                    aria-label={(t?.aboutPage?.contact?.linkedin || 'LinkedIn')}
                  >
                    <Icon
                      icon="brandico:linkedin-rect"
                      width="25"
                      height="25"
                      className={`mb-2 mx-auto transition-colors duration-200 ${isDark ? 'text-white' : 'text-black'}`}
                    />
                    <span
                      className={`absolute bottom-[-0.5rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-sans whitespace-nowrap ${isDark ? "text-white" : "text-black"
                        }`}
                    >
                      {t?.aboutPage?.contact?.linkedin || 'LinkedIn'}
                    </span>
                  </a>
                  <a
                    href="https://github.com/FlavioG01"
                    className={`relative p-3 rounded-lg transition-all duration-300 flex flex-col items-center justify-center group `}
                    aria-label={(t?.aboutPage?.contact?.github || 'GitHub')}
                  >
                    <Icon
                      icon="jam:github"
                      width="28"
                      height="28"
                      className={`mb-2 mx-auto transition-colors duration-200  ${isDark ? 'text-white ' : 'text-black'}`}
                    />
                    <span
                      className={`absolute bottom-[-0.5rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-sans whitespace-nowrap ${isDark ? "text-white" : "text-black"
                        }`}
                    >
                      {t?.aboutPage?.contact?.github || 'GitHub'}
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
            className={`space-y-8 py-12 transition-opacity duration-1000 ease-out ${sections.skills.isVisible ? "opacity-100" : "opacity-0"
              }`}
          >
            <h1 className="text-4xl md:text-5xl font-specs font-semibold mb-6 tracking-wider">
              <TerminalText
                text={t?.aboutPage?.skills?.title || 'htop skills'}
                inView={sections.skills.isVisible}
                onComplete={() => updateSection('skills', { showContent: true })}
              />
            </h1>

            <div className={`transition-opacity duration-500 space-y-6 ${sections.skills.showContent ? "opacity-100" : "opacity-0"}`}>
              {skillCategories.map((category) => (
                <div key={category.title} className="space-y-2">
                  {/* Título de la categoría */}
                  <h3
                    className={`text-xl md:text-2xl font-specs font-semibold tracking-wide pb-2 border-b ${isDark ? "border-white/20" : "border-black/20"
                      }`}
                  >
                    {(() => {
                      const c = t?.aboutPage?.skills?.categories
                      switch (category.title) {
                        case 'Habilidades': return c?.general || category.title
                        case 'Backend': return c?.backend || category.title
                        case 'Frontend': return c?.frontend || category.title
                        case 'Inteligencia Artificial': return c?.ai || category.title
                        default: return category.title
                      }
                    })()}
                  </h3>

                  {/* Grid de habilidades */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="relative"
                        onMouseEnter={() => setHoveredSkill(skill.name)}
                        onMouseLeave={() => setHoveredSkill(null)}
                      >
                        <AmplitudeIndicator
                          skill={skill.name}
                          percentage={skill.percentage}
                          vertical={false}
                          shouldAnimate={sections.skills.showContent}
                          isDark={isDark}
                        />
                        <Toast
                          text={(t?.aboutPage?.skills?.toasts?.[getToastKey(skill.name)] || skill.toast)}
                          icon={skill.icon}
                          visible={hoveredSkill === skill.name}
                          isDark={isDark}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sección de experiencia */}
        <section>
          <div
            ref={sectionRefs.experience}
            className={`space-y-8 py-12 transition-opacity duration-1000 ease-out ${sections.experience.isVisible ? "opacity-100" : "opacity-0"
              }`}
          >
            <h1 className="text-4xl md:text-5xl font-specs font-semibold mb-6 tracking-wider">
              <TerminalText
                text={t?.aboutPage?.experience?.title || 'bat experience.md'}
                inView={sections.experience.isVisible}
                onComplete={() => updateSection('experience', { showContent: true })}
              />
            </h1>

            <div className={`transition-opacity duration-500 ${sections.experience.showContent ? "opacity-100" : "opacity-0"}`}>
              <div className={`p-6 rounded-xl border-2 ${isDark ? "border-primary/10 bg-primary" : "border-secondary/10 bg-secondary"
                }`}>
                <div className="space-y-4 font-sans text-xl">
                  <p>{t?.aboutPage?.experience?.paragraphs?.[0] || 'Con más de 5 años de experiencia en desarrollo web, he participado en diversos proyectos que han enriquecido mi perfil profesional.'}</p>
                  <p>{t?.aboutPage?.experience?.paragraphs?.[1] || 'Mi trayectoria incluye el desarrollo de aplicaciones web escalables, implementación de arquitecturas robustas y optimización de rendimiento en proyectos de alto impacto.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de proyectos */}
        <section>
          <div
            ref={sectionRefs.projects}
            className={`space-y-8 py-12 transition-opacity duration-1000 ease-out ${sections.projects.isVisible ? "opacity-100" : "opacity-0"
              }`}
          >
            <h1 className="text-4xl md:text-5xl font-specs font-semibold mb-6 tracking-wider">
              <TerminalText
                text={t?.channelContent?.projects?.title || 'ls projects/'}
                inView={sections.projects.isVisible}
                onComplete={() => updateSection('projects', { showContent: true })}
              />
            </h1>

            <div className={`transition-opacity duration-500 ${sections.projects.showContent ? "opacity-100" : "opacity-0"}`}>
              <ProjectCards
                items={projectItems}
                isDark={isDark}
                columns={{ base: 1, md: 2, lg: 3 }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default About

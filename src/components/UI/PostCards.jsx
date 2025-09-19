import PropTypes from "prop-types"
import { useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"

const PostCard = ({
  post,
  isDark = false,
  isOpen = false,
  language = 'es',
  copiedSlug = '',
  onToggle,
  onShare,
  children,
}) => {
  const rowRef = useRef(null)
  const iconRef = useRef(null)
  const [sliding, setSliding] = useState(false)
  const [offset, setOffset] = useState(0) // px
  const [fading, setFading] = useState(false)
  const mountedRef = useRef(false)

  const SLIDE_MS = 280
  const OPEN_FADE_MS = 100
  const CLOSE_FADE_MS = 100

  const computeTravel = () => {
    const row = rowRef.current
    const ico = iconRef.current
    if (!row || !ico) return null
    const r = row.getBoundingClientRect()
    const c = ico.getBoundingClientRect()
    // Deja un padding lateral similar a ProjectCards (~32px)
    return Math.max(0, r.width - c.width - 32)
  }

  useEffect(() => {
    // Evitar animación en el primer render
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    const travel = computeTravel()
    if (travel == null) return
    try {
      if (isOpen) {
        // Abrir: fade-in contenido y pequeño slide del icono
        setFading(true)
        setSliding(true)
        setOffset(-travel)
        setTimeout(() => {
          setSliding(false)
          setOffset(0)
          // terminar fade-in
          setTimeout(() => setFading(false), OPEN_FADE_MS)
        }, SLIDE_MS)
      } else {
        // Cerrar: fade-out contenido y slide de regreso
        setFading(true)
        setSliding(true)
        // moverlo hacia la derecha para un retorno sutil
        setOffset(travel)
        setTimeout(() => {
          setSliding(false)
          setOffset(0)
          setTimeout(() => setFading(false), CLOSE_FADE_MS)
        }, SLIDE_MS)
      }
    } catch (_) {
      // En caso de layout inestable, reset sin animación
      setSliding(false)
      setOffset(0)
      setFading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle?.(post.slug)
    }
  }

  return (
    <div id={`card-${post.slug}`} className="relative">
      <div className={`rounded-2xl overflow-hidden transition-colors ${isDark ? 'bg-primary' : 'bg-secondary'}`}>
        {/* Header / Miniatura */}
        <div
          ref={rowRef}
          className="w-full h-32 px-5 flex gap-6 items-center cursor-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onClick={() => onToggle?.(post.slug)}
          onKeyDown={handleKeyDown}
        >
          {/* Cover simple (o icono/tag) */}
          {isOpen ? (
            <div
              ref={iconRef}
              className="rounded-md shrink-0 overflow-hidden flex items-center justify-center"
              style={{ transform: `translateX(${offset}px)`, transition: sliding ? 'transform 280ms ease-out' : 'none' }}
            >
              {post.icon ? (
                <Icon icon={post.icon} className={`text-7xl md:text-9xl ${post.icon?.startsWith('custom:')
                  ? (isDark ? 'filter invert-[12%]' : 'filter invert-[88%]')
                  : (isDark ? 'text-cloud' : 'text-primary')
                  }`} />
              ) : (
                <span className="text-xs font-code opacity-70">{post.tags?.[0] || 'N/A'}</span>
              )}
            </div>
          ) : (
            <div
              className="rounded-md shrink-0 overflow-hidden flex items-center justify-center"
            ></div>
          )}

          {/* Títulos / Metadatos */}
          <div className={`flex-1 ${isOpen ? 'items-start text-left' : 'items-center text-left'} flex flex-col min-w-0`}>
            {!isOpen ? (
              <div>
                <h3 className={`font-code text-5xl leading-tight truncate transition-opacity duration-200 ${!fading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {post.title}
                </h3>
                <p className="font-code text-sm mt-1 items-center justify-center align-center">
                  {post.tags?.length ? `${post.tags.join(', ')}` : ''}
                </p>
              </div>
            ) : (
              <div
                className={`w-full transition-opacity ${fading ? 'opacity-0' : 'opacity-100'}`}
                style={{ transitionDuration: `${fading ? CLOSE_FADE_MS : OPEN_FADE_MS}ms` }}
              >
                <h3 className="font-code text-2xl">{post.title}</h3>
                {post.subtitle && (
                  <p className="font-code text-lg opacity-80">{post.subtitle}</p>
                )}
                {post.excerpt && (
                  <p className="font-code text-base line-clamp-2">{post.excerpt}</p>
                )}
                <p className="font-code text-sm mt-1">
                  {post._dateText || ''}
                  {post.tags?.length ? ` · ${post.tags.join(', ')}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Acciones a la derecha: compartir */}
          {isOpen ? (
            <div className="ml-4 shrink-0 flex items-center gap-2">
              <div className="relative group">
                <button
                  type="button"
                  aria-label={language === 'es' ? 'Compartir enlace' : 'Share link'}
                  className={`transition-colors flex items-center justify-center text-4xl md:text-5xl ${isDark ? 'text-cloud' : 'text-primary'}`}
                  onClick={(e) => { e.stopPropagation(); onShare?.(post.slug, post.title) }}
                >
                  <Icon icon="tabler:link" />
                </button>
                <span
                  className={`absolute top-2 right-14 rounded text-lg font-code whitespace-nowrap pointer-events-none transition-opacity duration-200 ${copiedSlug === post.slug
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                    } ${isDark ? 'text-cloud' : 'text-primary'}`}
                >
                  {copiedSlug === post.slug
                    ? (language === 'es' ? 'Enlace copiado' : 'Link copied')
                    : (language === 'es' ? 'Compartir' : 'Share')}
                </span>
              </div>
            </div>
          ) : (
            <div
              ref={iconRef}
              className="rounded-md shrink-0 overflow-hidden flex items-center justify-center"
              style={{ transform: `translateX(${offset}px)`, transition: sliding ? 'transform 280ms ease-out' : 'none' }}
            >
              {post.icon ? (
                <Icon icon={post.icon} className={`text-7xl md:text-9xl ${post.icon?.startsWith('custom:')
                  ? (isDark ? 'filter invert-[12%]' : 'filter invert-[88%]')
                  : (isDark ? 'text-cloud' : 'text-primary')
                  }`} />
              ) : (
                <span className="text-xs font-code opacity-70">{post.tags?.[0] || 'N/A'}</span>
              )}
            </div>
          )}
        </div>

        {/* Contenido expandido */}
        {isOpen && (
          <div id={`post-${post.slug}`} className="min-w-0">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

PostCard.propTypes = {
  post: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    excerpt: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    icon: PropTypes.string,
    _dateText: PropTypes.string,
  }).isRequired,
  isDark: PropTypes.bool,
  isOpen: PropTypes.bool,
  language: PropTypes.string,
  copiedSlug: PropTypes.string,
  onToggle: PropTypes.func,
  onShare: PropTypes.func,
  children: PropTypes.node,
}

export default PostCard

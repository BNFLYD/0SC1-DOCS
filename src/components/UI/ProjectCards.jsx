import PropTypes from "prop-types"
import { useState, useRef } from "react"
import { Icon } from "@iconify/react"

/*
  ProjectCards
  - Responsive grid of cards for showcasing project areas or offerings.
  - Designed to match the radial hover fill pattern you used in channels.

  Props:
  - items: Array<{ title: string, description?: string, icon?: string, href?: string }>
  - isDark?: boolean
  - columns?: { base?: number, md?: number, lg?: number }
  - className?: string (extra classes for the grid container)

  Usage:
    <ProjectCards
      isDark={isDark}
      items={[
        { title: 'Metodológicas', description: 'Buenas prácticas, disciplina y gobierno de datos', icon: 'ph:target-duotone', href: '#' },
        { title: 'Funcionales', description: 'Diseño funcional alineado al negocio', icon: 'ph:rocket-launch-duotone', href: '#' },
      ]}
    />
*/

const ProjectCards = ({ items = [], isDark = false, columns, className = "" }) => {
  // columns is intentionally ignored to follow the stacked style used in Blog posts
  // Track flipped cards (by index)
  const [flipped, setFlipped] = useState(() => new Set())
  // Track fading text (hidden) during phase transitions
  const [fading, setFading] = useState(() => new Set())
  // Refs to measure positions for fluid slide
  const rowRefs = useRef({})
  const iconRefs = useRef({})
  // Per-card slide state
  const [sliding, setSliding] = useState(() => new Set())
  const [offsets, setOffsets] = useState(() => ({})) // px
  // Single active card and animation guard
  const [activeIndex, setActiveIndex] = useState(null)
  const [animating, setAnimating] = useState(false)

  const startFade = (i) => setFading(prev => new Set(prev).add(i))
  const stopFade = (i) => setFading(prev => { const n = new Set(prev); n.delete(i); return n })
  // No slide/wobble: we removed icon translation animation entirely

  const FADE_MS = 80
  const SLIDE_MS = 280

  const computeTravel = (idx) => {
    const row = rowRefs.current[idx]
    const ico = iconRefs.current[idx]
    if (!row || !ico) return null
    const r = row.getBoundingClientRect()
    const c = ico.getBoundingClientRect()
    return Math.max(0, r.width - c.width - 32)
  }

  const openCard = (idx) => {
    const baseReversed = (idx % 2) === 1
    setAnimating(true)
    // Start fading title and slide immediately for a snappier feel
    startFade(idx)
    const travel = computeTravel(idx)
    try {
      if (travel != null) {
        const dir = baseReversed ? -1 : 1
        setOffsets(prev => ({ ...prev, [idx]: dir * travel }))
        setSliding(prev => new Set(prev).add(idx))
        setTimeout(() => {
          setFlipped(prev => { const n = new Set(prev); n.add(idx); return n })
          // Keep title hidden while flipped; no stopFade here
          setSliding(prev => { const n = new Set(prev); n.delete(idx); return n })
          setOffsets(prev => ({ ...prev, [idx]: 0 }))
          setActiveIndex(idx)
          setAnimating(false)
        }, SLIDE_MS)
      } else {
        setFlipped(prev => { const n = new Set(prev); n.add(idx); return n })
        setActiveIndex(idx)
        setAnimating(false)
      }
    } catch (_) {
      setFlipped(prev => { const n = new Set(prev); n.add(idx); return n })
      setActiveIndex(idx)
      setAnimating(false)
    }
  }

  const closeCard = (idx, cb) => {
    const baseReversed = (idx % 2) === 1
    // Start fading and sliding back immediately
    startFade(idx)
    const travel = computeTravel(idx)
    try {
      if (travel != null) {
        const dir = baseReversed ? 1 : -1
        setOffsets(prev => ({ ...prev, [idx]: dir * travel }))
        setSliding(prev => new Set(prev).add(idx))
        setTimeout(() => {
          setSliding(prev => { const n = new Set(prev); n.delete(idx); return n })
          setOffsets(prev => ({ ...prev, [idx]: 0 }))
          setFlipped(prev => { const n = new Set(prev); n.delete(idx); return n })
          setTimeout(() => stopFade(idx), FADE_MS)
          if (typeof cb === 'function') cb()
        }, SLIDE_MS)
      } else {
        setFlipped(prev => { const n = new Set(prev); n.delete(idx); return n })
        setTimeout(() => stopFade(idx), FADE_MS)
        if (typeof cb === 'function') cb()
      }
    } catch (_) {
      setFlipped(prev => { const n = new Set(prev); n.delete(idx); return n })
      setTimeout(() => stopFade(idx), FADE_MS)
      if (typeof cb === 'function') cb()
    }
  }

  const handleClick = (i) => {
    if (animating) return
    const isOpen = flipped.has(i)
    if (isOpen) {
      // Close the same card
      setAnimating(true)
      closeCard(i, () => {
        setActiveIndex(null)
        setAnimating(false)
      })
      return
    }
    // If another is active, close it first, then open current
    if (activeIndex !== null && activeIndex !== i) {
      setAnimating(true)
      const prev = activeIndex
      // Run both animations in parallel for instant feel
      closeCard(prev, () => { setActiveIndex(null) })
      openCard(i)
      return
    }
    // No active: open directly
    openCard(i)
  }

  return (
    <div className={["relative space-y-6", className].join(" ")}>
      {items.map((item, idx) => {
        const baseReversed = (idx % 2) === 1
        const isFlipped = flipped.has(idx)
        // If flipped, invert the base layout and hide text (no slide)
        const isReversed = isFlipped ? !baseReversed : baseReversed
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(idx)}
            className="relative block w-full text-left focus:outline-none"
            aria-pressed={isFlipped ? "true" : "false"}
          >
            <div ref={el => (rowRefs.current[idx] = el)} className={`rounded-2xl overflow-hidden transition-colors ${isDark ? "bg-primary text-white" : "bg-secondary text-black"}`}>
              {/* Header/content row as 3-column grid to center title optically */}
              <div className="w-full py-6 px-5 grid items-center gap-4 grid-cols-[auto_1fr_auto]">
                {/* Left slot: icon or spacer depending on side */}
                {isReversed ? (
                  <div className="h-20 w-28 shrink-0" aria-hidden></div>
                ) : (
                  <div
                    ref={el => (iconRefs.current[idx] = el)}
                    className="h-20 w-28 rounded-md bg-current/10 shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ transform: offsets[idx] ? `translateX(${offsets[idx]}px)` : 'translateX(0px)', transition: sliding.has(idx) ? 'transform 280ms ease-out' : 'none' }}
                  >
                    {item.icon ? (
                      <Icon icon={item.icon} className={`text-6xl md:text-8xl opacity-80 ${isDark ? "text-white" : "text-black"}`} />
                    ) : (
                      <span className="text-xs font-specs opacity-70">PRJ</span>
                    )}
                  </div>
                )}

                {/* Center slot: centered title when closed, details when open (full width to truly center inline content) */}
                <div className="flex min-w-0 w-full flex-col items-center justify-center text-center space-y-2">
                  {!isFlipped ? (
                    <h3 className={`font-specs text-4xl md:text-5xl font-semibold leading-tight truncate transition-opacity duration-200 ${(!isFlipped && !fading.has(idx)) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      {item.title}
                    </h3>
                  ) : (
                    <div className="max-w-prose w-full transition-opacity duration-200 opacity-100">
                      {item.description && (
                        <p className="mb-0 mt-3font-sans text-lg md:text-xl opacity-90">
                          {item.description}
                        </p>
                      )}
                      {item.tecnologies && (
                        <p className="mb-0 mt-3 font-sans text-lg md:text-xl opacity-80">
                          <span className="font-semibold">Tecnologías:</span> {item.tecnologies}
                        </p>
                      )}
                      {item.access && (
                        <a
                          href={item.access}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="button"
                          className={`relative isolate overflow-hidden block w-fit mx-auto px-3 py-2 rounded-lg text-sm font-bold mt-0
                            transition-colors duration-300 font-sans
                            before:content-[''] before:absolute before:inset-0 before:rounded-full before:z-0
                            before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
                            ${isDark ? 'bg-void text-white hover:text-black before:bg-cloud' : 'bg-cloud text-black hover:text-white before:bg-primary'}`}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const ox = ((e.clientX - rect.left) / rect.width) * 100
                            const oy = ((e.clientY - rect.top) / rect.height) * 100
                            e.currentTarget.style.setProperty('--ox', `${ox}%`)
                            e.currentTarget.style.setProperty('--oy', `${oy}%`)
                          }}
                        >
                          <span className="relative z-10">Acceso ↗</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Right slot: icon or spacer depending on side */}
                {isReversed ? (
                  <div
                    ref={el => (iconRefs.current[idx] = el)}
                    className="h-20 w-28 rounded-md bg-current/10 shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ transform: offsets[idx] ? `translateX(${offsets[idx]}px)` : 'translateX(0px)', transition: sliding.has(idx) ? 'transform 280ms ease-out' : 'none' }}
                  >
                    {item.icon ? (
                      <Icon icon={item.icon} className={`text-6xl md:text-8xl opacity-80 ${isDark ? "text-white" : "text-black"}`} />
                    ) : (
                      <span className="text-xs font-specs opacity-70">PRJ</span>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-28 shrink-0" aria-hidden></div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

ProjectCards.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string, // Iconify name, e.g., 'ph:target-duotone'
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
  })).isRequired,
  isDark: PropTypes.bool,
  columns: PropTypes.shape({
    base: PropTypes.number,
    md: PropTypes.number,
    lg: PropTypes.number,
  }),
  className: PropTypes.string,
}

export default ProjectCards

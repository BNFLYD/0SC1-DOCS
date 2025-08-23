import { useMemo, useState, useEffect, useRef } from "react"
import { useOutletContext, useLocation, useNavigate } from "react-router-dom"
import { Icon } from "@iconify/react"
import CodeCopyButton from "../components/MarkDownUI/CodeCopyButton"
import { Scrollbar } from "../components/UI/Scrollbar"

// Parse YYYY-MM-DD as a local date (avoids UTC shift showing previous day)
function parseLocalDate(iso) {
  try {
    if (!iso || typeof iso !== 'string') return new Date(0)
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return new Date(iso)
    return new Date(y, (m - 1), d)
  } catch (_) {
    return new Date(0)
  }
}

function Blog() {
  const { language, isDark, t } = useOutletContext()
  const location = useLocation()
  const navigate = useNavigate()

  // Cargar todos los componentes MDX de /src/content/posts/*.mdx
  const mdxModules = useMemo(() => {
    return import.meta.glob("../content/posts/*.mdx", { eager: true })
  }, [])

  // Construir lista desde los propios archivos MDX (sin JSON)
  const normalized = useMemo(() => {
    return Object.entries(mdxModules)
      .map(([path, mod]) => {
        const file = path.split("/").pop() || ""
        const slug = file.replace(/\.mdx$/, "")
        const meta = (mod && "meta" in mod ? mod.meta : undefined) || {}
        const Comp = mod?.default
        const title = meta.title || slug
        const date = meta.date || "2025-08-16"
        const tags = Array.isArray(meta.tags) ? meta.tags : []
        const excerpt = typeof meta.excerpt === "string" ? meta.excerpt : ""
        const cover = typeof meta.cover === "string" ? meta.cover : ""
        const subtitle = typeof meta.subtitle === "string" ? meta.subtitle : ""
        const icon = typeof meta.icon === "string" ? meta.icon : ""
        return {
          slug,
          title,
          date,
          tags,
          excerpt,
          cover,
          subtitle,
          icon,
          Component: Comp,
          _date: parseLocalDate(date),
        }
      })
      .filter((p) => Boolean(p.Component))
  }, [mdxModules])

  // Estado de UI: búsqueda, tag activo y post expandido
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState("")
  const [expandedSlug, setExpandedSlug] = useState("")

  // Sync expanded post with URL (?post=slug)
  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const s = sp.get('post') || ""
    setExpandedSlug(s)
  }, [location.search])

  const toggleExpanded = (slug) => {
    const isOpen = expandedSlug === slug
    const sp = new URLSearchParams(location.search)
    if (isOpen) sp.delete('post'); else sp.set('post', slug)
    navigate({ search: sp.toString() ? `?${sp.toString()}` : "" }, { replace: true })
    setExpandedSlug(isOpen ? "" : slug)
  }

  const sharePost = async (slug, title) => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('post', slug)
      const shareUrl = url.toString()
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      }
    } catch (_) { /* noop */ }
  }

  // Tags únicas disponibles para filtros
  const allTags = useMemo(() => {
    const set = new Set()
    normalized.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [normalized])

  // Filtrado y orden
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (p) => {
      if (!q) return true
      const haystack = [p.title, p.excerpt, ...(p.tags || [])]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    }
    const matchesTag = (p) => (activeTag ? p.tags?.includes(activeTag) : true)

    return normalized
      .filter((p) => matchesQuery(p) && matchesTag(p))
      .sort((a, b) => b._date - a._date)
  }, [normalized, query, activeTag])

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Controles: búsqueda y filtros */}
      <div className="mb-8 flex flex-col gap-4 space-y-4 pt-24">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === "es" ? "Buscar por título, resumen o tag..." : "Search by title, excerpt or tag..."}
          className={`w-full px-8 py-3 rounded-xl outline-none font-mono text-md ${isDark
            ? "bg-primary text-white placeholder-white/40"
            : "bg-secondary text-black placeholder-black/40"
            }`}
        />

        <div className="flex flex-wrap gap-2 items-center">
          <button
            className={`px-3 py-1 rounded-lg text-sm font-bold border transition-colors ${!activeTag
              ? isDark
                ? "border-white/80 bg-white text-black"
                : "border-black/80 bg-black text-white"
              : isDark
                ? "border-white/40 text-white hover:bg-white/10"
                : "border-black/40 text-black hover:bg-black/5"
              }`}
            onClick={() => setActiveTag("")}
          >
            {language === "es" ? "Todos" : "All"}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`px-3 py-1 rounded-md text-xs font-bold border transition-colors ${activeTag === tag
                ? isDark
                  ? "border-white/80 bg-white text-black"
                  : "border-black/80 bg-black text-white"
                : isDark
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-black/40 text-black hover:bg-black/5"
                }`}
              onClick={() => setActiveTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de posts */}
      <div className="space-y-6">
        {filtered.map((post) => {
          const isOpen = expandedSlug === post.slug
          const Comp = post.Component
          return (
            <div key={post.slug} className="relative">
              <div
                className={`rounded-2xl overflow-hidden transition-colors ${isDark ? "bg-primary" : "bg-secondary"}`}
              >
                {/* Miniatura / Header */}
                <div
                  className={`w-full p-5 flex items-center gap-4 cursor-pointer`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggleExpanded(post.slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleExpanded(post.slug)
                    }
                  }}
                >
                  {/* Cover simple (si hubiera) */}
                  <div className="h-20 w-28 rounded-md bg-current/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {post.icon ? (
                      <Icon icon={post.icon} className={`text-7xl hover:text-feather opacity-80 ${isDark ? "text-white" : "text-black"}`} />
                    ) : (
                      <span className="text-xs font-mono opacity-70">{post.tags?.[0] || "MDX"}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono text-lg font-bold">
                      {post.title}
                    </h3>
                    {post.subtitle && (
                      <p className="font-mono text-sm font-semibold opacity-80">
                        {post.subtitle}
                      </p>
                    )}
                    <p className="font-mono text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                    <p className="font-mono text-xs mt-1">
                      {post._date.toLocaleDateString(language === "es" ? "es-AR" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                      {post.tags?.length ? ` · ${post.tags.join(", ")}` : ""}
                    </p>
                  </div>
                  {/* Acciones a la derecha: caret + compartir */}
                  <div className="ml-4 shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={language === 'es' ? 'Compartir enlace' : 'Share link'}
                      className={`w-8 h-8 transition-colors flex items-center justify-center ${isDark ? 'text-white hover:text-feather' : 'text-black hover:text-feather'}`}
                      onClick={(e) => { e.stopPropagation(); sharePost(post.slug, post.title) }}
                      title={language === 'es' ? 'Compartir' : 'Share'}
                    >
                      <Icon icon="bxs:copy" className="text-xl" />
                    </button>
                  </div>
                </div>

                {/* Contenido MDX expandido dentro del card, SIN scrollbar adentro */}
                {isOpen && Comp && (
                  <div id={`post-${post.slug}`} className="min-w-0">
                    <CollapsibleProse isDark={isDark}>
                      <Comp />
                      <CodeCopyButton />
                    </CollapsibleProse>
                  </div>
                )}
              </div>
              {/* Scrollbar totalmente fuera del card, a la derecha */}
              {isOpen && (
                <Scrollbar targetId={`post-${post.slug}`} />
              )}
            </div>
          )
        })}
        {!filtered.length && (
          <p className="font-mono text-sm opacity-70">
            {language === "es" ? "Sin resultados" : "No results"}
          </p>
        )}
      </div>
    </div>
  )
}

export default Blog

function CollapsibleProse({ isDark, children }) {
  useEffect(() => {
    // Initialize collapsible nested lists for all prose containers on mount/update
    const containers = document.querySelectorAll('[data-prose-collapsible]')
    containers.forEach((root) => {
      initCollapsibles(root)
      // Ensure images inside prose are lazy-loaded by default
      const imgs = root.querySelectorAll('img')
      imgs.forEach((img) => {
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy')
        if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async')
      })
    })
  })

  // Delegated click-to-zoom for native markdown images (exclude MdxImage)
  useEffect(() => {
    const containers = Array.from(document.querySelectorAll('[data-prose-collapsible]'))
    if (!containers.length) return

    const showOverlay = (src, alt = '') => {
      try {
        const overlay = document.createElement('div')
        overlay.style.position = 'fixed'
        overlay.style.inset = '0'
        overlay.style.background = 'rgba(0,0,0,0.85)'
        overlay.style.display = 'flex'
        overlay.style.alignItems = 'center'
        overlay.style.justifyContent = 'center'
        overlay.style.zIndex = '9999'

        const img = document.createElement('img')
        img.src = src
        img.alt = alt
        img.style.maxWidth = '90vw'
        img.style.maxHeight = '90vh'
        img.style.objectFit = 'contain'
        img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)'
        img.style.cursor = 'zoom-out'

        const close = () => {
          window.removeEventListener('keydown', onKey)
          overlay.removeEventListener('click', onOverlayClick)
          overlay.remove()
        }
        const onKey = (e) => { if (e.key === 'Escape') close() }
        const onOverlayClick = () => close()
        overlay.addEventListener('click', onOverlayClick)
        window.addEventListener('keydown', onKey)

        overlay.appendChild(img)
        document.body.appendChild(overlay)
      } catch (_) { /* noop */ }
    }

    const handler = (e) => {
      const target = e.target
      if (!(target instanceof HTMLElement)) return
      if (target.tagName.toLowerCase() !== 'img') return
      if (target.getAttribute('data-mdximage') === '1') return
      // native markdown image
      const src = target.currentSrc || target.getAttribute('src')
      if (!src) return
      e.stopPropagation()
      showOverlay(src, target.getAttribute('alt') || '')
    }

    containers.forEach((root) => root.addEventListener('click', handler))
    return () => containers.forEach((root) => root.removeEventListener('click', handler))
  }, [])

  return (
    <div
      className={`px-16 pb-6 pt-1 prose max-w-none ${isDark
        ? "prose-invert prose-pre:bg-void"
        : "prose-pre:bg-cloud"
        } prose-pre:rounded-2xl prose-pre:p-4 prose-code:font-mono`}
      data-theme={isDark ? 'dark' : 'light'}
      data-prose-collapsible
    >
      {children}
    </div>
  )
}

// Scrollbar moved to ../components/UI/Scrollbar

function initCollapsibles(root) {
  if (!root || root.__collapsibleInit) return
  root.__collapsibleInit = true

  const items = Array.from(root.querySelectorAll('li'))
  items.forEach((li) => {
    // Only direct child list qualifies
    const childList = li.querySelector(':scope > ul, :scope > ol')
    if (!childList) return
    if (li.dataset.collapsibleInit === '1') return
    li.dataset.collapsibleInit = '1'
    // Ensure hover only affects the label text wrapper, not the entire LI
    li.classList.remove('group', 'relative')

    // Start collapsed with inline transition (height + opacity)
    childList.hidden = false
    // Don't clip bullets on the left: only hide overflow on Y axis
    childList.style.overflowY = 'hidden'
    childList.style.overflowX = 'visible'
    childList.style.height = '0px'
    childList.style.opacity = '0'
    childList.style.transition = 'height 300ms ease-in-out, opacity 300ms ease-in-out'
    childList.style.willChange = 'height, opacity'
    // Ensure list markers render outside with room on the left
    childList.style.listStylePosition = 'outside'
    childList.style.paddingInlineStart = '1rem'
    // Force marker type so bullets/numbers are visible regardless of external CSS
    childList.style.listStyleType = childList.tagName === 'UL' ? 'disc' : 'decimal'
    // Prevent the animating list from overlapping and clipping the caret
    childList.style.position = 'relative'
    childList.style.zIndex = '0'

    // Transition management: allow interruption and restart cleanly
    let endHandler = null
    const TRANSITION = 'height 300ms ease-in-out, opacity 300ms ease-in-out'
    const cancelEndHandler = () => {
      if (endHandler) {
        childList.removeEventListener('transitionend', endHandler)
        endHandler = null
      }
    }
    const forceReflow = () => void childList.offsetHeight
    const getCurrentHeight = () => childList.getBoundingClientRect().height
    const withNoTransition = (fn) => {
      const prev = childList.style.transition
      childList.style.transition = 'none'
      fn()
      forceReflow()
      childList.style.transition = TRANSITION
    }

    const expand = () => {
      cancelEndHandler()
      // Start from current height (could be mid-animation)
      withNoTransition(() => {
        const current = getCurrentHeight()
        childList.style.height = current + 'px'
        childList.style.opacity = '1'
      })
      // Animate to full height
      const target = childList.scrollHeight
      childList.style.height = target + 'px'
      endHandler = (e) => {
        if (e.target !== childList || e.propertyName !== 'height') return
        // Lock open state to natural height
        childList.style.transition = 'none'
        childList.style.height = 'auto'
        forceReflow()
        childList.style.transition = TRANSITION
        cancelEndHandler()
      }
      childList.addEventListener('transitionend', endHandler)
    }

    const collapse = () => {
      cancelEndHandler()
      // If currently 'auto' or animating, measure and set fixed start height
      withNoTransition(() => {
        const current = getCurrentHeight()
        childList.style.height = current + 'px'
        childList.style.opacity = '1'
      })
      forceReflow()
      // Animate to closed
      childList.style.height = '0px'
      childList.style.opacity = '0'
    }

    let isOpen = false

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'list-caret'
    btn.setAttribute('aria-expanded', 'false')
    btn.setAttribute('title', 'Expandir/colapsar')
    btn.textContent = '▸'
    // Ensure caret renders above any sibling animations
    btn.style.position = 'relative'
    btn.style.zIndex = '2'

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      isOpen = !isOpen
      if (isOpen) {
        expand()
      } else {
        collapse()
      }
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      btn.textContent = isOpen ? '▾' : '▸'
    })

    // Insert caret before the li content
    li.insertBefore(btn, li.firstChild)

    // Wrap the label (content before the child list) to apply underline on hover
    // Collect nodes after the caret button up to (but not including) the nested child list
    const labelWrapper = document.createElement('span')
    labelWrapper.className = 'relative inline-block group'
    let cursor = btn.nextSibling
    const nodesToWrap = []
    while (cursor && cursor !== childList) {
      const next = cursor.nextSibling
      nodesToWrap.push(cursor)
      cursor = next
    }
    if (nodesToWrap.length) {
      nodesToWrap.forEach(node => labelWrapper.appendChild(node))
      // Insert the wrapper before the child list (or at the end if no child list found by safety)
      if (childList && childList.parentNode === li) {
        li.insertBefore(labelWrapper, childList)
      } else {
        li.appendChild(labelWrapper)
      }
      // Add the underline element inside the wrapper
      const underline = document.createElement('span')
      underline.className = 'underline -bottom-1'
      labelWrapper.appendChild(underline)
    }

    // Also toggle when clicking the text/content of the LI (but not interactive elements)
    li.addEventListener('click', (e) => {
      // Don't react if the click was on the caret button itself
      if (e.target === btn) return
      // Ignore clicks inside this item's nested child list
      if (childList && childList.contains(e.target)) return
      // Ignore clicks on obvious interactive elements inside the item
      if (e.target.closest('a, button, input, textarea, select, label, code, pre')) return
      // Prevent bubbling to parent LIs
      e.stopPropagation()

      isOpen = !isOpen
      if (isOpen) {
        expand()
      } else {
        collapse()
      }
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      btn.textContent = isOpen ? '▾' : '▸'
    })
  })
}

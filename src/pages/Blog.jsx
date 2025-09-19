import { useMemo, useState, useEffect, useRef } from "react"
import { useOutletContext, useLocation, useNavigate } from "react-router-dom"
import { Scrollbar } from "../components/UI/Scrollbar"
import PostCard from "../components/UI/PostCards"
import CodeCopyButton from "../components/MarkDownUI/CodeCopyButton"

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

// Map app language to proper locale
const localeFor = (lang) => ({
  es: 'es-AR',
  en: 'en-US',
  de: 'de-DE',
  ja: 'ja-JP',
} [lang] || lang || 'en-US')

const formatDateLong = (dateObj, lang) => {
  try {
    // Special handling for Japanese spacing: "Y M D"
    if (lang === 'ja') {
      const y = new Intl.DateTimeFormat('ja-JP', { year: 'numeric' }).format(dateObj) // includes 年
      const m = new Intl.DateTimeFormat('ja-JP', { month: 'numeric' }).format(dateObj)
      const d = new Intl.DateTimeFormat('ja-JP', { day: 'numeric' }).format(dateObj)
      return `${y} ${m} ${d}`
    }
    const loc = localeFor(lang)
    return new Intl.DateTimeFormat(loc, { dateStyle: 'long' }).format(dateObj)
  } catch (_) {
    return dateObj.toLocaleDateString()
  }
}

function Blog() {
  const { language, isDark, t } = useOutletContext()
  const location = useLocation()
  const navigate = useNavigate()

  const isClearingRef = useRef(false)

  // Cargar todos los componentes MDX de /src/content/posts/*.mdx
  const mdxModules = useMemo(() => {
    return import.meta.glob("../content/posts/*.mdx", { eager: true })
  }, [])

  // Construir lista desde los propios archivos MDX (sin JSON)
  const normalized = useMemo(() => {
    const buildHaystack = (baseMeta, metaByLang) => {
      const buf = []
      const push = (obj) => {
        if (!obj) return
        if (obj.title) buf.push(String(obj.title))
        if (obj.subtitle) buf.push(String(obj.subtitle))
        if (obj.excerpt) buf.push(String(obj.excerpt))
        if (Array.isArray(obj.tags)) buf.push(obj.tags.join(' '))
      }
      push(baseMeta)
      if (metaByLang && typeof metaByLang === 'object') {
        Object.values(metaByLang).forEach(push)
      }
      return buf.join(' ').toLowerCase()
    }

    return Object.entries(mdxModules)
      .map(([path, mod]) => {
        const file = path.split("/").pop() || ""
        const slug = file.replace(/\.mdx$/, "")
        const meta = (mod && "meta" in mod ? mod.meta : undefined) || {}
        const metaByLang = (mod && "metaByLang" in mod ? mod.metaByLang : undefined) || undefined
        const sel = (metaByLang && language && metaByLang[language]) ? metaByLang[language] : meta
        const Comp = mod?.default
        const title = sel?.title || slug
        const date = sel?.date || "2025-08-16"
        const tags = Array.isArray(sel?.tags) ? sel.tags : []
        const excerpt = typeof sel?.excerpt === "string" ? sel.excerpt : ""
        const cover = typeof sel?.cover === "string" ? sel.cover : ""
        const subtitle = typeof sel?.subtitle === "string" ? sel.subtitle : ""
        const icon = typeof sel?.icon === "string" ? sel.icon : ""
        const haystack = buildHaystack(meta, metaByLang)
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
          haystack,
        }
      })
      .filter((p) => Boolean(p.Component))
  }, [mdxModules, language])

  // Estado de UI: búsqueda, tag activo y post expandido
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState("")
  const [expandedSlug, setExpandedSlug] = useState("")
  const [copiedSlug, setCopiedSlug] = useState("")

  // Sync expanded post with URL (?post=slug)
  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const s = sp.get('post') || ""
    setExpandedSlug(s)
  }, [location.search])

  // Load initial query and tag from URL on mount and whenever URL changes externally
  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const q = sp.get('q') || ""
    const tag = sp.get('tag') || ""
    // Avoid loops: only update state if different
    if (q !== query) setQuery(q)
    if (tag !== activeTag) setActiveTag(tag)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // Reflect query and tag into URL (preserve ?post)
  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const curQ = sp.get('q') || ""
    const curTag = sp.get('tag') || ""
    let changed = false
    if (query !== curQ) { changed = true; if (query) sp.set('q', query); else sp.delete('q') }
    if (activeTag !== curTag) { changed = true; if (activeTag) sp.set('tag', activeTag); else sp.delete('tag') }
    if (changed) {
      navigate({ search: sp.toString() ? `?${sp.toString()}` : "" }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTag])

  // Allow closing expanded post with Escape
  useEffect(() => {
    if (!expandedSlug) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        toggleExpanded(expandedSlug)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expandedSlug])

  const toggleExpanded = (slug) => {
    const isOpen = expandedSlug === slug
    const sp = new URLSearchParams(location.search)
    if (isOpen) {
      // CLEAR FIRST: skip any lifecycle saves during this close
      isClearingRef.current = true
      // Persist collapsible state for this post before closing
      try { window.dispatchEvent(new CustomEvent('prose:save', { detail: { slug } })) } catch (_) { /* noop */ }
      // Remove persisted fixedTop for this post so next open will recompute
      try { sessionStorage.removeItem(`sbTop:post-${slug}`) } catch (_) { /* noop */ }
      // Then update URL and state
      sp.delete('post')
      navigate({ search: sp.toString() ? `?${sp.toString()}` : "" }, { replace: true })
      setExpandedSlug("")
      // Release the guard on next tick
      setTimeout(() => { isClearingRef.current = false }, 0)
    } else {
      // Animate list scroll so the selected card reaches the top, then expand
      const container = document.getElementById('post-list')
      const card = document.getElementById(`card-${slug}`)
      const expandNow = () => {
        sp.set('post', slug)
        navigate({ search: sp.toString() ? `?${sp.toString()}` : "" }, { replace: true })
        setExpandedSlug(slug)
      }
      // If we can't animate, expand immediately
      if (!container || !card) { expandNow(); return }
      // Only meaningful if the list is scrollable (no post open yet)
      const isScrollable = container.scrollHeight > container.clientHeight
      if (!isScrollable) { expandNow(); return }

      // Compute the desired scrollTop so that the card touches the top of the container
      const cRect = container.getBoundingClientRect()
      const pRect = card.getBoundingClientRect()
      const desired = container.scrollTop + (pRect.top - cRect.top)
      const threshold = 2
      if (Math.abs(container.scrollTop - desired) <= 4) { expandNow(); return }

      try {
        container.scrollTo({ top: desired, behavior: 'smooth' })
      } catch (_) {
        container.scrollTop = desired
        expandNow()
        return
      }

      let rafId = 0
      let startTs = 0
      const maxMs = 900
      const check = (ts) => {
        if (!startTs) startTs = ts || 0
        const done = Math.abs(container.scrollTop - desired) <= threshold
        const timedOut = (ts || 0) - startTs > maxMs
        if (done || timedOut) {
          if (rafId) cancelAnimationFrame(rafId)
          expandNow()
          return
        }
        rafId = requestAnimationFrame(check)
      }
      rafId = requestAnimationFrame(check)
    }
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
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug(""), 1500)
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
      // Search across all languages using precomputed haystack
      return (p.haystack || "").includes(q)
    }
    const matchesTag = (p) => (activeTag ? p.tags?.includes(activeTag) : true)

    return normalized
      .filter((p) => matchesQuery(p) && matchesTag(p))
      .sort((a, b) => b._date - a._date)
  }, [normalized, query, activeTag])

  // When a post is expanded, hide the rest from the list
  const visiblePosts = expandedSlug
    ? filtered.filter((p) => p.slug === expandedSlug)
    : filtered

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Controles: búsqueda y filtros */}
      <div className="mb-8 flex flex-col gap-2 space-y-4 pt-24">
        {/** Simple inline i18n for labels (fallback if no t-keys) */}
        {(() => {
          return null
        })()}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={{
            es: "Buscar por título, resumen o tag...",
            en: "Search by title, excerpt or tag...",
            de: "Suche nach Titel, Zusammenfassung oder Tag...",
            ja: "タイトル・要約・タグで検索...",
          }[language] || "Search by title, excerpt or tag..."}
          className={`w-full px-8 py-3 rounded-xl outline-none font-sans text-lg ${isDark
            ? "bg-primary text-white placeholder-white/40"
            : "bg-secondary text-black placeholder-black/40"
            }`}
        />

        <div className="flex flex-wrap gap-2 items-center">
          <button
            className={`relative isolate overflow-hidden my-1 px-3 py-1 rounded-lg text-sm font-sans font-bold
              transition-colors duration-300
              before:content-[''] before:absolute before:inset-0 before:rounded-full
              before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
              ${isDark ? 'bg-primary text-white hover:text-primary before:bg-cloud' : 'bg-secondary text-primary hover:text-secondary before:bg-primary'}`}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const ox = ((e.clientX - rect.left) / rect.width) * 100
              const oy = ((e.clientY - rect.top) / rect.height) * 100
              e.currentTarget.style.setProperty('--ox', `${ox}%`)
              e.currentTarget.style.setProperty('--oy', `${oy}%`)
            }}
            onClick={() => setActiveTag("")}
          >
            <span className="relative z-10">
              {{
                es: "Todos",
                en: "All",
                de: "Alle",
                ja: "すべて",
              }[language] || "All"}
            </span>
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`relative isolate overflow-hidden my-1 px-3 py-1 rounded-lg text-sm font-sans font-bold
                transition-colors duration-300
                before:content-[''] before:absolute before:inset-0 before:rounded-full
                before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
                ${isDark ? 'bg-primary text-white hover:text-primary before:bg-cloud' : 'bg-secondary text-primary hover:text-secondary before:bg-primary'}`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const ox = ((e.clientX - rect.left) / rect.width) * 100
                const oy = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.style.setProperty('--ox', `${ox}%`)
                e.currentTarget.style.setProperty('--oy', `${oy}%`)
              }}
              onClick={() => setActiveTag(tag)}
            >
              <span className="relative z-10">
                #{tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Listado de posts: máx 4 cards de alto y scroll interno SOLO cuando no hay post abierto */}
      <div id="post-list" className={`relative space-y-4 ${expandedSlug ? "" : "overflow-y-auto max-h-[35rem] rounded-2xl"}`}>
        {visiblePosts.map((post) => {
          const isOpen = expandedSlug === post.slug
          const Comp = post.Component
          const postView = { ...post, _dateText: formatDateLong(post._date, language) }
          return (
            <div key={post.slug} >
              <PostCard
                post={postView}
                isDark={isDark}
                isOpen={isOpen}
                language={language}
                copiedSlug={copiedSlug}
                onToggle={toggleExpanded}
                onShare={sharePost}
              >
                {Comp && (
                  <CollapsibleProse isDark={isDark} postSlug={post.slug}>
                    <Comp />
                    <CodeCopyButton />
                  </CollapsibleProse>
                )}
              </PostCard>
              {/* Scrollbar totalmente fuera del card, a la derecha (post mode con defaults) */}
              {isOpen && (
                <Scrollbar targetId={`post-${post.slug}`} />
              )}
            </div>
          )
        })}
        {!visiblePosts.length && (
          <p className="font-mono text-sm opacity-70">
            {{
              es: "Sin resultados",
              en: "No results",
              de: "Keine Ergebnisse",
              ja: "該当なし",
            }[language] || "No results"}
          </p>
        )}
        {/* Scrollbar para la lista cuando hay más de 4 posts y ningún post abierto */}
        {!expandedSlug && filtered.length > 4 && (
          <Scrollbar
            targetId="post-list"
            container
            rightOffsetPx={16}
            topPadPx={368}
            bottomPadPx={140}
          />
        )}
      </div>
      {/* aria-live for copy feedback */}
      <div aria-live="polite" className="sr-only">
        {copiedSlug ? (language === 'es' ? 'Enlace copiado' : 'Link copied') : ''}
      </div>
    </div>
  )
}

export default Blog

function CollapsibleProse({ isDark, postSlug, children }) {
  const STORAGE_UI_KEY = postSlug ? `blogProse:${postSlug}` : null
  useEffect(() => {
    // Initialize collapsible nested lists for all prose containers on mount/update
    const containers = document.querySelectorAll('[data-prose-collapsible]')
    containers.forEach((root) => {
      initCollapsibles(root, STORAGE_UI_KEY)
      // Ensure images inside prose are lazy-loaded by default
      const imgs = root.querySelectorAll('img')
      imgs.forEach((img) => {
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy')
        if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async')
      })
    })
    // Signal readiness so Blog can finalize scroll restoration precisely
    try { window.dispatchEvent(new CustomEvent('prose:ready', { detail: { slug: postSlug } })) } catch (_) { /* noop */ }
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

function initCollapsibles(root, storageKey) {
  if (!root || root.__collapsibleInit) return
  root.__collapsibleInit = true

  const items = Array.from(root.querySelectorAll('li'))
  // Load saved open set
  let openSet = new Set()
  if (storageKey) {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) openSet = new Set(JSON.parse(raw))
    } catch (_) { /* noop */ }
  }
  // Persist only when Blog asks (prose:save), not on every click
  const persist = () => {
    if (!storageKey) return
    try { sessionStorage.setItem(storageKey, JSON.stringify(Array.from(openSet))) } catch (_) { /* noop */ }
  }
  items.forEach((li) => {
    // Only direct child list qualifies
    const childList = li.querySelector(':scope > ul, :scope > ol')
    if (!childList) return
    if (li.dataset.collapsibleInit === '1') return
    li.dataset.collapsibleInit = '1'
    // Ensure hover only affects the label text wrapper, not the entire LI
    li.classList.remove('group', 'relative')

    // Assign a stable id for this LI within this post
    if (!li.dataset.cid) li.dataset.cid = String(items.indexOf(li))
    const cid = li.dataset.cid

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
    // If saved as open, open immediately without animation
    if (openSet.has(cid)) {
      isOpen = true
      childList.style.transition = 'none'
      childList.style.height = 'auto'
      childList.style.opacity = '1'
      forceReflow()
      childList.style.transition = TRANSITION
    }

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
        openSet.add(cid)
      } else {
        collapse()
        openSet.delete(cid)
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
        openSet.add(cid)
      } else {
        collapse()
        openSet.delete(cid)
      }
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      btn.textContent = isOpen ? '▾' : '▸'
    })

    // Listen once per root for a consolidated save request
    if (!root.__collapsibleSaveBind) {
      root.__collapsibleSaveBind = true
      const onSave = (e) => {
        if (!e.detail || !e.detail.slug) { persist(); return }
        // Only persist if this root belongs to the same post (best-effort: storageKey includes slug)
        if (storageKey && storageKey.endsWith(e.detail.slug)) persist()
      }
      window.addEventListener('prose:save', onSave)
      // Clean up when the root is removed
      const observer = new MutationObserver(() => {
        if (!document.contains(root)) {
          window.removeEventListener('prose:save', onSave)
          observer.disconnect()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }
  })
}

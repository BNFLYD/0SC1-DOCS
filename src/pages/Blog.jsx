"use client"
import { useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { Icon } from "@iconify/react"
import CodeCopyButton from "../components/CodeCopyButton"

function Blog() {
  const { language, isDark, t } = useOutletContext()

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
        const date = meta.date || "1970-01-01"
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
          _date: date ? new Date(date) : new Date(0),
        }
      })
      .filter((p) => Boolean(p.Component))
  }, [mdxModules])

  // Estado de UI: búsqueda, tag activo y post expandido
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState("")
  const [expandedSlug, setExpandedSlug] = useState("")

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
            <div
              key={post.slug}
              className={`rounded-2xl overflow-hidden transition-colors ${isDark ? "bg-primary" : "bg-secondary"
                }`}
            >
              {/* Miniatura / Header */}
              <button
                className={`w-full text-left p-5 flex items-center gap-4 hover:bg-current/5 transition-colors`}
                onClick={() => setExpandedSlug(isOpen ? "" : post.slug)}
                aria-expanded={isOpen}
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
                    {new Date(post.date).toLocaleDateString(language === "es" ? "es-AR" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                    {post.tags?.length ? ` · ${post.tags.join(", ")}` : ""}
                  </p>
                </div>
              </button>

              {/* Contenido MDX expandido */}
              {isOpen && Comp && (
                <div
                className={`px-16 pb-6 pt-1 prose max-w-none ${
                  isDark
                    ? "prose-invert prose-pre:bg-void"
                    : "prose-pre:bg-cloud"
                } prose-pre:rounded-2xl prose-pre:p-4 prose-code:font-mono`}
                data-theme={isDark ? 'dark' : 'light'}
              >
                <Comp />
                <CodeCopyButton />
              </div>
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

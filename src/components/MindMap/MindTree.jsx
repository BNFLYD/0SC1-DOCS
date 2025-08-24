import React, { useMemo, useState } from "react"

// MindTree: visor simple de mapas mentales con nodos plegables (estilo Logseq)
// Uso esperado (en MDX):
// import MindTree from "../../components/MindMap/MindTree";
// <MindTree data={{ label: 'root', children: [{ label: 'hijo 1' }, { label: 'hijo 2', children: [{ label: 'nieto' }] }] }} />
// - Por defecto solo se ve el nodo raíz. Los hijos se despliegan tocando el punto del nodo.

function useCollapsed(initial = true) {
  const [open, setOpen] = useState(!initial)
  const toggle = () => setOpen((v) => !v)
  return { open, toggle }
}

function Node({ node, depth = 0 }) {
  const hasChildren = Array.isArray(node?.children) && node.children.length > 0
  const { open, toggle } = useCollapsed(true)

  return (
    <div className="relative">
      {/* Línea conectora hacia el padre (no en root) */}
      {depth > 0 && (
        <div className="absolute -left-6 top-4 h-px w-6 bg-current/50" aria-hidden="true" />
      )}

      {/* Cabecera del nodo */}
      <div className="flex items-center gap-2 py-1">
        {/* Punto de toggle */}
        <button
          type="button"
          onClick={hasChildren ? toggle : undefined}
          aria-label={hasChildren ? (open ? "Colapsar" : "Expandir") : undefined}
          className={`relative inline-flex items-center justify-center w-4 h-4 rounded-full border ${
            hasChildren ? "cursor-pointer" : "opacity-40 cursor-default"
          }`}
        >
          {/* punto interior solo si hay hijos */}
          {hasChildren && (
            <span
              className={`block w-2 h-2 rounded-full transition-colors ${open ? "bg-current" : "bg-transparent"}`}
            />
          )}
        </button>

        {/* Etiqueta */}
        <div className="font-mono text-sm select-text">
          {node?.label ?? "(sin título)"}
        </div>
      </div>

      {/* Hijos plegables */}
      {hasChildren && open && (
        <div className="pl-8 border-l border-current/30 ml-2">
          {node.children.map((child, idx) => (
            <Node key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MindTree({ data, className = "", dark = true }) {
  const theme = dark
    ? "text-white"
    : "text-black"

  // Normalizar entrada mínima
  const normalized = useMemo(() => {
    if (!data || typeof data !== "object") return { label: String(data ?? "root"), children: [] }
    return { label: data.label ?? "root", children: Array.isArray(data.children) ? data.children : [] }
  }, [data])

  // El root siempre visible; sus hijos empiezan ocultos (cada Node maneja su open).
  return (
    <div className={`relative ${theme} [--ring:theme(colors.emerald.400)]`}>
      <div className="rounded-2xl px-4 py-3">
        <div className="font-mono text-base mb-2">{normalized.label}</div>
        {Array.isArray(normalized.children) && normalized.children.length > 0 && (
          <div className="pl-6 border-l border-current/30">
            {normalized.children.map((c, i) => (
              <Node key={i} node={c} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

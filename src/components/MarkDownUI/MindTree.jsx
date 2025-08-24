import React, { useMemo, useState } from "react"

// 1) Parseo de lista UL/OL a árbol
function parseList(listEl) {
  if (!listEl || !listEl.props) return []
  const items = React.Children.toArray(listEl.props.children).filter(Boolean)
  return items.map((li, idx) => {
    if (!React.isValidElement(li)) return { key: String(idx), label: li, children: [] }
    const liKids = React.Children.toArray(li.props?.children).filter(Boolean)
    const nested = liKids.find((k) => React.isValidElement(k) && (k.type === 'ul' || k.type === 'ol'))
    const labelKids = nested ? liKids.filter((k) => k !== nested) : liKids
    const children = nested ? parseList(nested) : []
    const label = labelKids.length > 0 ? labelKids : '(sin título)'
    return { key: String(idx), label, children }
  })
}

// 2) Layout simple estilo mind map (horizontal). Calcula posiciones x,y.
function layoutTree(root, columnWidth = 280, vGap = 36, yStart = 0, depth = 0) {
  // Devuelve { nodes: [{x,y,node,depth}], links: [{from,to}] , height }
  if (!root) return { nodes: [], links: [], height: 0 }

  // Si no tiene hijos, altura mínima
  if (!root.children || root.children.length === 0 || !root.open) {
    const y = yStart
    return {
      nodes: [{ x: depth * columnWidth, y, node: root, depth }],
      links: [],
      height: vGap,
    }
  }

  // Layout de hijos primero
  let accY = yStart
  const childLayouts = root.children.map((c) => {
    const L = layoutTree(c, columnWidth, vGap, accY, depth + 1)
    accY += L.height
    return L
  })

  // Centro del padre = promedio de los centros de los hijos
  const firstTop = childLayouts[0]?.nodes[0]?.y ?? yStart
  const lastBottom = childLayouts[childLayouts.length - 1]?.nodes.slice(-1)[0]?.y ?? yStart
  const parentY = Math.round((firstTop + lastBottom) / 2)

  const self = { x: depth * columnWidth, y: parentY, node: root, depth }
  const nodes = [self]
  const links = []
  childLayouts.forEach((L) => {
    nodes.push(...L.nodes)
    links.push({ from: self, to: L.nodes[0] })
    links.push(...L.links)
  })

  return {
    nodes,
    links,
    height: accY - yStart,
  }
}

// 3) Nodo con estado de colapso
function useOpen(initial = false) {
  const [open, setOpen] = useState(initial)
  const toggle = () => setOpen((v) => !v)
  return { open, toggle }
}

function enhanceTree(nodes, path = []) {
  // Agrega estado open a cada nodo (primer nivel abierto por defecto)
  return nodes.map((n, i) => {
    const id = [...path, i].join('.')
    return {
      ...n,
      id,
      open: false,
      children: enhanceTree(n.children || [], [...path, i]),
    }
  })
}

export default function MindTree({ children, className = "", dark = true, height = undefined }) {
  const theme = dark ? "text-white" : "text-black"

  // Detectar primer UL/OL en children
  const rootList = useMemo(() => {
    const arr = React.Children.toArray(children).filter(Boolean)
    for (const el of arr) {
      if (React.isValidElement(el) && (el.type === 'ul' || el.type === 'ol')) return el
    }
    for (const el of arr) {
      if (React.isValidElement(el)) {
        const inner = React.Children
          .toArray(el.props?.children)
          .find((k) => React.isValidElement(k) && (k.type === 'ul' || k.type === 'ol'))
        if (inner) return inner
      }
    }
    return null
  }, [children])

  const baseNodes = useMemo(() => (rootList ? parseList(rootList) : []), [rootList])

  // Fallback: si no hay <ul>/<ol>, intentar parsear texto markdown tipo lista
  const textNodes = useMemo(() => {
    if (rootList) return []
    const arr = React.Children.toArray(children).filter(Boolean)

    // Recolector recursivo de texto (soporta fragments y elementos anidados)
    const collect = (el) => {
      if (el == null || el === false) return ''
      if (typeof el === 'string') return el
      if (!React.isValidElement(el)) return ''
      // si es <br/> lo convertimos en salto de línea
      if (el.type === 'br') return '\n'
      const kids = React.Children.toArray(el.props?.children).map(collect)
      return kids.join('')
    }

    const text = arr.map(collect).join('\n').trim()
    if (!text) return []

    // Parser sencillo de listas con '-' y sangría por espacios (2 o 4 espacios por nivel)
    const lines = text.split(/\r?\n/).map((l) => l.replace(/\t/g, '    '))
    const items = []
    const stack = [{ children: items }]
    const indentSize = (s) => (s.match(/^\s*/)?.[0].length ?? 0)

    for (let raw of lines) {
      const m = raw.match(/^(\s*)-\s+(.*)$/)
      if (!m) continue
      const ind = indentSize(m[1])
      const label = m[2]
      const node = { label, children: [] }
      // calcular nivel aprox cada 2 espacios
      const level = Math.floor(ind / 2)
      while (stack.length > level + 1) stack.pop()
      stack[stack.length - 1].children.push(node)
      stack.push(node)
    }
    return items
  }, [children, rootList])

  // Estado por nodo (abrir/cerrar). Almaceno en un diccionario id->open para no recrear funciones.
  const [openMap, setOpenMap] = useState(() => ({}))
  const toggle = (id) => setOpenMap((m) => ({ ...m, [id]: !m[id] }))

  // Construir árbol con ids y banderas open
  const tree = useMemo(() => {
    const add = (nodes, path = []) => nodes.map((n, i) => {
      const id = [...path, i].join('.')
      return {
        ...n,
        id,
        open: openMap[id] ?? (path.length === 0 ? true : false), // nivel 0 abierto por defecto
        children: add(n.children || [], [...path, i])
      }
    })
    const source = baseNodes.length ? baseNodes : textNodes
    return add(source)
  }, [baseNodes, textNodes, openMap])

  // Quitar nodos vacíos o con solo espacios y propagar limpieza
  const cleanedTree = useMemo(() => {
    const clean = (nodes) => {
      const out = []
      for (const n of nodes) {
        const label = typeof n.label === 'string' ? n.label.trim() : n.label
        const children = clean(n.children || [])
        const hasLabel = (label != null) && (typeof label !== 'string' || label.length > 0)
        if (hasLabel) {
          out.push({ ...n, label, children })
        } else if (children.length) {
          // Sin etiqueta: eleva los hijos al nivel actual para evitar bullets/carets vacíos
          out.push(...children)
        } // si no hay etiqueta ni hijos, se descarta
      }
      return out
    }
    return clean(tree)
  }, [tree])

  // Agrupa por profundidad solo los nodos visibles (respeta colapsado)
  const byDepth = useMemo(() => {
    const cols = []
    const visit = (nodes, depth = 0) => {
      if (!cols[depth]) cols[depth] = []
      for (const n of nodes) {
        cols[depth].push(n)
        const open = !!openMap[n.id]
        if (open && n.children && n.children.length) visit(n.children, depth + 1)
      }
    }
    // raíz puede ser multiple: mostramos todos los de nivel 0
    visit(cleanedTree, 0)
    return cols
  }, [cleanedTree, openMap])

  // Refs de elementos para dibujar conectores entre columnas
  const caretRefs = React.useRef({})
  const bulletRefs = React.useRef({})
  const innerRef = React.useRef(null)

  // Item de fila: registra refs de bullet/caret
  const RowItem = ({ node, depth }) => {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = !!openMap[node.id]

    return (
      <div className="relative leading-snug">
        <span className="inline-flex items-center gap-1 relative">
          {depth >= 1 && (
            <span
              ref={(el) => {
                if (el) bulletRefs.current[node.id] = el; else delete bulletRefs.current[node.id]
              }}
              className="text-feather select-none"
              aria-hidden
            >
              •
            </span>
          )}
          <button
            type="button"
            className="text-left align-middle"
            onClick={hasChildren ? () => toggle(node.id) : undefined}
          >
            {node.label}
          </button>
          {hasChildren && (
            <button
              ref={(el) => {
                if (el) caretRefs.current[node.id] = el; else delete caretRefs.current[node.id]
              }}
              type="button"
              className="px-0.5 text-feather/90 hover:text-feather"
              aria-label={isOpen ? 'Colapsar' : 'Expandir'}
              onClick={() => toggle(node.id)}
            >
              {isOpen ? '▾' : '▸'}
            </button>
          )}
        </span>
      </div>
    )
  }

  // Render de una columna (mismo depth)
  const Column = ({ nodes, depth }) => (
    <div className="flex flex-col gap-1 px-2">
      {nodes.map((n) => (
        <RowItem key={n.id} node={n} depth={depth} />
      ))}
    </div>
  )

  // Si no hay nodos, mensaje
  if (!tree.length) {
    return (
      <div className={`text-sm opacity-70 ${theme} border rounded-lg px-3 py-2 bg-black/30 dark:bg-white/5`}>No se encontró una lista para renderizar.</div>
    )
  }

  // Para layout tratamos al primer item como raíz principal, los demás como hermanos desde el mismo origen
  const [root, ...siblings] = tree
  const columnWidth = 260
  const vGap = 42

  // Forzar open=false para calcular altura si está colapsado: layoutTree ya lo respeta con node.open
  // Usamos un offset vertical inicial para evitar posiciones negativas que queden fuera de vista
  const topOffset = 40
  const layoutRoot = layoutTree(root, columnWidth, vGap, topOffset, 0)
  const totalHeight = Math.max(layoutRoot.height + topOffset, vGap + topOffset)
  const maxDepth = Math.max(0, ...layoutRoot.nodes.map(n => n.depth))
  const totalWidth = (maxDepth + 1) * columnWidth + 80

  // Helpers de estilos
  const nodeStyle = (x, y) => ({ left: x + 16, top: y, position: 'absolute' })

  // Path curvo entre dos puntos
  const curve = (a, b) => {
    const c = 0.45 * (b.x - a.x)
    return `M ${a.x+32},${a.y} C ${a.x+c},${a.y} ${b.x-c},${b.y} ${b.x},${b.y}`
  }

  // Altura del recuadro (estilo <pre>):
  // - Si viene "20%" lo tomamos como 20vh (viewport) para que sea fijo sin depender del contenedor.
  // - Si es número => px.
  // - Si es string con unidades => se respeta tal cual.
  const boxHeight = (() => {
    if (typeof height === 'string' && height.trim()) {
      const s = height.trim()
      if (s.endsWith('%')) {
        const n = parseFloat(s)
        return Number.isFinite(n) ? `${n}vh` : undefined
      }
      return s
    }
    if (typeof height === 'number') return `${height}px`
    return undefined
  })()

  // SVG overlay para conectar caret padre -> bullet hijo
  const ConnectorsSvg = ({ rootRef, nodesByDepth }) => {
    const [state, setState] = React.useState({ w: 0, h: 0, paths: [] })

    const build = React.useCallback(() => {
      const rootBox = rootRef.current?.getBoundingClientRect()
      if (!rootBox) return
      const paths = []
      for (let d = 1; d < nodesByDepth.length; d++) {
        for (const child of nodesByDepth[d]) {
          const childId = child.id
          const parentId = childId.includes('.') ? childId.split('.').slice(0, -1).join('.') : null
          if (!parentId) continue
          const bulletEl = bulletRefs.current[childId]
          const caretEl = caretRefs.current[parentId]
          if (!bulletEl || !caretEl) continue
          const b = bulletEl.getBoundingClientRect()
          const c = caretEl.getBoundingClientRect()
          const x1 = c.left - rootBox.left + c.width / 2
          const y1 = c.top - rootBox.top + c.height / 2
          const x2 = b.left - rootBox.left + b.width / 2
          const y2 = b.top - rootBox.top + b.height / 2
          const dx = Math.max(28, (x2 - x1) * 0.45)
          const dPath = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
          paths.push(dPath)
        }
      }
      setState({ w: rootBox.width, h: rootBox.height, paths })
    }, [rootRef, nodesByDepth])

    React.useLayoutEffect(() => {
      let raf = requestAnimationFrame(() => build())
      return () => cancelAnimationFrame(raf)
    }, [build])

    React.useLayoutEffect(() => {
      const onResize = () => build()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [build])

    if (!state.w || !state.h) return null
    return (
      <svg className="pointer-events-none absolute inset-0" width={state.w} height={state.h} viewBox={`0 0 ${state.w} ${state.h}`}>
        {state.paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
        ))}
      </svg>
    )
  }

  // Drag-to-pan: permite arrastrar con click para hacer scroll del contenedor
  const outerRef = React.useRef(null)
  const dragState = React.useRef({ dragging: false, startX: 0, startY: 0, sl: 0, st: 0 })

  const onPointerDown = (e) => {
    // Evitar robar eventos de controles interactivos
    const target = e.target
    if (target.closest('button, a, input, textarea, select')) return
    const outer = outerRef.current
    if (!outer) return
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      sl: outer.scrollLeft,
      st: outer.scrollTop,
    }
    outer.setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e) => {
    const outer = outerRef.current
    const s = dragState.current
    if (!outer || !s.dragging) return
    const dx = e.clientX - s.startX
    const dy = e.clientY - s.startY
    outer.scrollLeft = s.sl - dx
    outer.scrollTop = s.st - dy
  }

  const endDrag = (e) => {
    const outer = outerRef.current
    if (!outer) return
    dragState.current.dragging = false
    outer.releasePointerCapture?.(e.pointerId)
  }

  // Render único: columnas por niveles (mapa mental simple)
  return (
    <div
      ref={outerRef}
      className={`relative ${theme} ${className} my-4 overflow-auto rounded-2xl border border-feather/10 bg-[#d0d0d0] dark:bg-black text-sm`}
      style={{ width: '100%', height: boxHeight, minHeight: boxHeight ? undefined : 200 }}
    >
      <div
        ref={innerRef}
        className="relative px-8 py-4 cursor-grab"
        style={{ userSelect: dragState.current.dragging ? 'none' : undefined, cursor: dragState.current.dragging ? 'grabbing' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => { if (dragState.current.dragging) endDrag(e) }}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${byDepth.length || 1}, max-content)`, columnGap: 12, justifyContent: 'start' }}
        >
          {byDepth.map((nodes, i) => (
            <Column key={i} nodes={nodes} depth={i} />
          ))}
        </div>
        <ConnectorsSvg rootRef={innerRef} nodesByDepth={byDepth} />
      </div>
    </div>
  )
}

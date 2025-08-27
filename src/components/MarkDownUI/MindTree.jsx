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

export default function MindTree({ children, className = "", dark = true, height = undefined, connectorStartRatio = 0.8, connectorMinDx = 28 }) {
  // Usar variantes de Tailwind para color de texto según modo
  const theme = 'text-primary dark:text-white'

  // Aumentar un paso el tamaño de texto dentro del componente
  const sizeClass = React.useMemo(() => {
    const cls = String(className || '')
    if (cls.includes('text-base')) return 'text-lg'
    if (cls.includes('text-xs')) return 'text-base'
    return 'text-base'
  }, [className])

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
  const [lastExpandedDepth, setLastExpandedDepth] = useState(null)
  const toggle = (id) => {
    const depth = id.split('.').length - 1
    const willOpen = !(openMap[id] ?? false)
    setOpenMap((m) => ({ ...m, [id]: !m[id] }))
    // Al expandir, la nueva columna visible es depth+1
    setLastExpandedDepth(willOpen ? depth + 1 : null)
  }

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
  const gridRef = React.useRef(null)
  const labelRefs = React.useRef({})
  const extraRefs = React.useRef({})
  const wrapRefs = React.useRef({})
  const prevContentWRef = React.useRef(0)

  const applyWrapWidth = (id) => {
    const btn = labelRefs.current[id]
    const extra = extraRefs.current[id]
    const wrap = wrapRefs.current[id]
    if (!btn || !extra || !wrap) return
    const p = btn.querySelector('p')
    if (!p) return
    // mover hermanos posteriores al primer <p> hacia extra
    let sib = p.nextSibling
    while (sib) {
      const next = sib.nextSibling
      extra.appendChild(sib)
      sib = next
    }
    // ajustar ancho al renderizado del <p>
    const w = Math.ceil(p.getBoundingClientRect().width)
    if (Number.isFinite(w) && w > 0) wrap.style.width = `${w}px`
  }

  // Item de fila: registra refs de bullet/caret
  const RowItem = ({ node, depth }) => {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = !!openMap[node.id]

    return (
      <div className={"relative leading-snug"}>
        <span className="inline-flex items-center gap-1 relative">
          {depth >= 1 && (
            <span
              ref={(el) => {
                if (el) bulletRefs.current[node.id] = el; else delete bulletRefs.current[node.id]
              }}
              className="text-feather select-none text-2xl leading-none inline-flex items-center"
              aria-hidden
            >
              •
            </span>
          )}
          <div
            ref={(el) => { if (el) { wrapRefs.current[node.id] = el; applyWrapWidth(node.id) } else delete wrapRefs.current[node.id] }}
            className="inline-block text-primary dark:text-white"
          >
            <button
              type="button"
              className="text-left align-middle text-primary dark:text-white"
              ref={(el) => { if (el) { labelRefs.current[node.id] = el; applyWrapWidth(node.id) } else delete labelRefs.current[node.id] }}
              onClick={hasChildren ? () => toggle(node.id) : undefined}
            >
              {node.label}
            </button>
            <div
              ref={(el) => { if (el) { extraRefs.current[node.id] = el; applyWrapWidth(node.id) } else delete extraRefs.current[node.id] }}
              className="mt-1 w-full text-primary dark:text-white"
            />
          </div>
          {hasChildren && (
            <button
            ref={(el) => {
              if (el) caretRefs.current[node.id] = el; else delete caretRefs.current[node.id]
            }}
            type="button"
            className="px-0.5 text-feather hover:text-feather text-2xl leading-none inline-flex items-center justify-center relative -top-0.5"
            aria-label={isOpen ? 'Colapsar' : 'Expandir'}
            onClick={() => toggle(node.id)}
          >
            {'▸'}
          </button>
          )}
        </span>
      </div>
    )
  }

  // Medición de columnas por profundidad para centrar verticalmente
  const colRefs = React.useRef({}) // depth -> HTMLElement (contenido intrínseco)
  const [maxColHeight, setMaxColHeight] = React.useState(0)

  React.useLayoutEffect(() => {
    // esperar a que DOM pinte
    const raf = requestAnimationFrame(() => {
      let maxH = 0
      for (const [k, el] of Object.entries(colRefs.current)) {
        if (el && el.offsetHeight) maxH = Math.max(maxH, el.offsetHeight)
      }
      setMaxColHeight(maxH)
    })
    return () => cancelAnimationFrame(raf)
  }, [byDepth, openMap])

  // Centrado horizontal condicional: centrar solo si el grid no supera el ancho visible
  const [hCenter, setHCenter] = React.useState(true)
  React.useLayoutEffect(() => {
    const recompute = () => {
      const outer = outerRef.current
      const grid = gridRef.current
      if (!outer || !grid) return
      const visible = outer.clientWidth || 0
      const content = Math.ceil(grid.scrollWidth || grid.offsetWidth || 0)
      setHCenter(content <= visible)
    }
    const raf = requestAnimationFrame(recompute)
    window.addEventListener('resize', recompute)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recompute).catch(() => {})
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', recompute)
    }
  }, [byDepth, openMap])

  // Auto-scroll a la derecha cuando al expandir aumenta el ancho del grid y excede el visible
  React.useLayoutEffect(() => {
    const scrollIfGrew = () => {
      const outer = outerRef.current
      const grid = gridRef.current
      if (!outer || !grid) return
      const visible = outer.clientWidth || 0
      const content = Math.ceil(grid.scrollWidth || grid.offsetWidth || 0)
      const prev = prevContentWRef.current || 0
      const margin = 40 // margen extra para ver completo el último nivel
      // Solo desplazar si el contenido creció y ahora excede lo visible
      if (content > prev && content > visible) {
        const maxLeft = Math.max(0, outer.scrollWidth - visible)
        const target = Math.max(0, Math.min(content - visible + margin, maxLeft))
        // desplazamiento suave para mostrar el nuevo nivel
        outer.scrollTo({ left: target, behavior: 'smooth' })
      }
      prevContentWRef.current = content
    }
    // esperar a layout estable
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(scrollIfGrew)
      // guardar id2 en cierre
      scrollIfGrew._id2 = id2
    })
    return () => {
      cancelAnimationFrame(id1)
      if (scrollIfGrew._id2) cancelAnimationFrame(scrollIfGrew._id2)
    }
  }, [byDepth, openMap])

  // Mover del botón todo lo que esté después del primer <p> al contenedor "extra"
  React.useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      for (const [id, btn] of Object.entries(labelRefs.current)) {
        const extra = extraRefs.current[id]
        const wrap = wrapRefs.current[id]
        if (!btn || !extra || !wrap) continue
        const p = btn.querySelector('p')
        if (!p) continue
        let sib = p.nextSibling
        let moved = false
        while (sib) {
          const next = sib.nextSibling
          extra.appendChild(sib)
          moved = true
          sib = next
        }
        // Ajustar el ancho del wrapper al ancho RENDERIZADO del primer <p>
        const w = Math.ceil(p.getBoundingClientRect().width)
        if (Number.isFinite(w) && w > 0) {
          wrap.style.width = `${w}px`
        } else {
          wrap.style.removeProperty('width')
        }
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [byDepth, openMap])

  // Recalcular al cambiar el tamaño de ventana o al cargar fuentes
  React.useEffect(() => {
    const recompute = () => {
      for (const [id, btn] of Object.entries(labelRefs.current)) {
        const wrap = wrapRefs.current[id]
        if (!btn || !wrap) continue
        const p = btn.querySelector('p')
        if (!p) continue
        const w = Math.ceil(p.getBoundingClientRect().width)
        if (Number.isFinite(w) && w > 0) wrap.style.width = `${w}px`
      }
    }
    recompute()
    window.addEventListener('resize', recompute)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recompute).catch(() => {})
    }
    return () => {
      window.removeEventListener('resize', recompute)
    }
  }, [byDepth, openMap])

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
  const ConnectorsSvg = ({ rootRef, nodesByDepth, colorClass = '', connectorStartRatio, connectorMinDx, lastExpandedDepth }) => {
    const [state, setState] = React.useState({ w: 0, h: 0, paths: [] })
    const rafId = React.useRef(0)
    const pathRefs = React.useRef([])

    const build = React.useCallback(() => {
      const rootEl = rootRef.current
      const rootBox = rootEl?.getBoundingClientRect()
      if (!rootEl || !rootBox) return
      // Cache de Y (centro de la primera línea del primer párrafo/heading) por nodo
      const lineCenterY = {}
      // Paso 1: alinear bullets/carets con la PRIMERA línea del PRIMER <p> o <h1>-<h6> dentro del botón (label)
      for (let d = 0; d < nodesByDepth.length; d++) {
        for (const n of nodesByDepth[d]) {
          const labelEl = labelRefs.current[n.id]
          if (!labelEl) continue
          const firstLineEl = labelEl.querySelector('p, h1, h2, h3, h4, h5, h6')
          if (!firstLineEl) continue
          const rects = firstLineEl.getClientRects()
          if (!rects || rects.length === 0) continue
          const first = rects[0]
          const targetY = first.top + first.height / 2
          // Guardar Y relativo al root para reutilizar en paths
          lineCenterY[n.id] = targetY - rootBox.top
          const bulletEl = bulletRefs.current[n.id]
          const caretEl = caretRefs.current[n.id]
          if (bulletEl) bulletEl.style.transform = ''
          if (caretEl) caretEl.style.transform = ''
          if (bulletEl) {
            const br = bulletEl.getBoundingClientRect()
            const delta = Math.round(targetY - (br.top + br.height / 2))
            if (delta) bulletEl.style.transform = `translateY(${delta}px)`
          }
          if (caretEl) {
            const cr = caretEl.getBoundingClientRect()
            const delta = Math.round(targetY - (cr.top + cr.height / 2))
            if (delta) caretEl.style.transform = `translateY(${delta}px)`
          }
        }
      }
      const paths = []
      // Importante: NO sumar scroll aquí. El SVG está dentro del mismo contenedor scrolleable,
      // por lo que se traslada junto al contenido. Medimos posiciones relativas a rootBox.
      const Y_OFFSET = 1 // px hacia abajo en ambos extremos
      // Calcular, por nivel, el borde derecho máximo del contenedor de fila, para que la curvatura
      // comience alineada verticalmente en ese punto para todos los subniveles del mismo nivel.
      const bendXByDepth = []
      for (let d = 1; d < nodesByDepth.length; d++) {
        let maxRight = -Infinity
        for (const child of nodesByDepth[d]) {
          const childId = child.id
          const bulletEl = bulletRefs.current[childId]
          if (!bulletEl) continue
          // Contenedor de fila y contenedor de contenido (columna)
          const rowEl = bulletEl.closest('span.inline-flex') || bulletEl.parentElement
          const contentEl = rowEl?.querySelector('div.inline-block') || rowEl
          const cr = contentEl?.getBoundingClientRect()
          if (cr && Number.isFinite(cr.right)) maxRight = Math.max(maxRight, cr.right)
        }
        // -1px para evitar que la curva invada visualmente la columna
        bendXByDepth[d] = Number.isFinite(maxRight) ? (maxRight - rootBox.left - 1) : undefined
      }
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
          // Coordenadas relativas al contenedor interno (sin scroll)
          const x1 = c.left - rootBox.left + c.width / 2
          const y1 = (lineCenterY[parentId] ?? (c.top - rootBox.top + c.height / 2)) + Y_OFFSET
          const x2 = b.left - rootBox.left + b.width / 2
          const y2 = (lineCenterY[childId] ?? (b.top - rootBox.top + b.height / 2)) + Y_OFFSET
          // Determinar ratio por nivel: acepta number | array | function
          let ratio
          if (typeof connectorStartRatio === 'function') {
            try { ratio = connectorStartRatio(d, { x1, y1, x2, y2, parentId, childId }) } catch { ratio = 0.8 }
          } else if (Array.isArray(connectorStartRatio)) {
            ratio = connectorStartRatio[Math.min(d, connectorStartRatio.length - 1)]
          } else {
            ratio = connectorStartRatio
          }
          if (!Number.isFinite(ratio)) ratio = 0.8
          const minDx = Number.isFinite(connectorMinDx) ? connectorMinDx : 28
          const bendX = bendXByDepth[d]
          // No permitir que el punto de quiebre quede a la derecha del bullet
          const DISJ_OFFSET = 25 // px hacia la izquierda
          const effectiveBendX = Number.isFinite(bendX) ? Math.min(bendX - DISJ_OFFSET, x2 - minDx) : undefined
          const SMOOTH = 8 // px: cuánto antes empezar a curvar y suavizar la tangente
          let dPath
          if (Number.isFinite(effectiveBendX) && effectiveBendX > x1 + minDx + 1) {
            // Terminar el tramo recto un poco antes del borde de la columna
            const sX = Math.max(x1 + minDx, effectiveBendX - SMOOTH)
            const cX = sX + SMOOTH // control levemente a la derecha para continuidad de tangente
            dPath = `M ${x1},${y1} L ${sX},${y1} C ${cX},${y1} ${cX},${y2} ${x2},${y2}`
          } else {
            // Fallback: curvatura simétrica por ratio/min
            const dx = Math.max(minDx, (x2 - x1) * ratio)
            dPath = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
          }
          paths.push({ d: dPath, depth: d })
        }
      }
      // Usar dimensiones del contenido completo para que el SVG no recorte
      setState({ w: rootEl.scrollWidth, h: rootEl.scrollHeight, paths })
    }, [rootRef, nodesByDepth])

    // Animación de trazo: dibujar desde el caret hacia el bullet en ~200ms
    React.useEffect(() => {
      pathRefs.current.forEach((el) => {
        if (!el) return
        // Animar solo si corresponde al nivel recién expandido
        const d = Number(el.dataset.depth)
        if (!Number.isFinite(d) || d !== lastExpandedDepth) return
        // Preparar estilo para animación
        el.style.transition = 'stroke-dashoffset 500ms ease-out, opacity 500ms ease-out'
        el.style.strokeDasharray = '1'
        el.style.strokeDashoffset = '1'
        el.style.opacity = '0.001'
        requestAnimationFrame(() => {
          el.style.strokeDashoffset = '0'
          el.style.opacity = '1'
        })
      })
    }, [state.paths, lastExpandedDepth])

    // Programa el build tras dos frames para esperar a que el layout/recursos se asienten
    const scheduleBuild = React.useCallback(() => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        rafId.current = requestAnimationFrame(() => {
          build()
        })
      })
    }, [build])

    React.useLayoutEffect(() => {
      scheduleBuild()
      // también tras fonts (evita salto por FOUT/FOIT)
      if ('fonts' in document && document.fonts?.ready) {
        document.fonts.ready.then(() => scheduleBuild()).catch(() => {})
      }
      // y pequeños delays por si hay layout async de terceros
      const t1 = setTimeout(() => scheduleBuild(), 50)
      const t2 = setTimeout(() => scheduleBuild(), 200)
      return () => {
        if (rafId.current) cancelAnimationFrame(rafId.current)
        clearTimeout(t1); clearTimeout(t2)
      }
    }, [scheduleBuild])

    React.useLayoutEffect(() => {
      const onResize = () => scheduleBuild()
      window.addEventListener('resize', onResize)
      let ro
      if (rootRef.current && 'ResizeObserver' in window) {
        ro = new ResizeObserver(() => scheduleBuild())
        ro.observe(rootRef.current)
      }
      // Observar mutaciones del DOM (MDX que inserta contenido luego)
      let mo
      if (rootRef.current && 'MutationObserver' in window) {
        mo = new MutationObserver(() => scheduleBuild())
        mo.observe(rootRef.current, { subtree: true, childList: true })
      }
      // Reaccionar a cargas de recursos dentro del árbol (img/video/iframe)
      const rootEl = rootRef.current
      const res = []
      if (rootEl) {
        rootEl.querySelectorAll('img,video,iframe').forEach((el) => {
          const handler = () => scheduleBuild()
          // Algunos elementos usan 'load', otros 'loadedmetadata'
          el.addEventListener('load', handler, { passive: true })
          el.addEventListener('loadedmetadata', handler, { passive: true })
          res.push([el, handler])
        })
      }
      return () => {
        window.removeEventListener('resize', onResize)
        if (ro) ro.disconnect()
        if (mo) mo.disconnect()
        res.forEach(([el, h]) => {
          el.removeEventListener('load', h)
          el.removeEventListener('loadedmetadata', h)
        })
      }
    }, [scheduleBuild])

    // No es necesario recalcular en scroll; el SVG se desplaza con el contenido.

    if (!state.w || !state.h) return null
    return (
      <svg
        className={`pointer-events-none absolute z-0 ${colorClass}`}
        style={{ left: 0, top: 0, width: state.w, height: state.h }}
        width={state.w}
        height={state.h}
        viewBox={`0 0 ${state.w} ${state.h}`}
      >
        {state.paths.map((p, i) => (
          <path
            key={i}
            ref={(el) => (pathRefs.current[i] = el)}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={1}
            data-depth={p.depth}
          />
        ))}
      </svg>
    )
  }

  // Drag-to-pan: permite arrastrar con click para hacer scroll del contenedor
  const outerRef = React.useRef(null)
  const dragState = React.useRef({ dragging: false, maybe: false, moved: false, startX: 0, startY: 0, sl: 0, st: 0 })
  const velocityRef = React.useRef({ vx: 0, vy: 0, lastX: 0, lastY: 0, lastT: 0 })
  const inertiaRef = React.useRef({ id: 0 })

  const cancelInertia = React.useCallback(() => {
    if (inertiaRef.current.id) {
      cancelAnimationFrame(inertiaRef.current.id)
      inertiaRef.current.id = 0
    }
  }, [])

  const onPointerDown = (e) => {
    // Permitir iniciar sobre botones/labels; solo bloquear links/inputs nativos
    const target = e.target
    if (target.closest('a, input, textarea, select')) return
    const outer = outerRef.current
    if (!outer) return
    // cancelar inercia si estaba corriendo
    cancelInertia()
    dragState.current = {
      dragging: false,
      maybe: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      sl: outer.scrollLeft,
      st: outer.scrollTop,
    }
    velocityRef.current = { vx: 0, vy: 0, lastX: e.clientX, lastY: e.clientY, lastT: performance.now() }
    // No prevent ni capture aún; esperamos a superar umbral de movimiento
  }

  const onPointerMove = (e) => {
    const outer = outerRef.current
    const s = dragState.current
    if (!outer || !s.maybe) return
    const dx = e.clientX - s.startX
    const dy = e.clientY - s.startY
    const dist = Math.max(Math.abs(dx), Math.abs(dy))
    if (!s.dragging) {
      const TH = 4 // umbral en px para iniciar drag
      if (dist > TH) {
        s.dragging = true
        s.moved = true
        outer.setPointerCapture?.(e.pointerId)
      } else {
        return
      }
    }
    outer.scrollLeft = s.sl - dx
    outer.scrollTop = s.st - dy
    // calcular velocidad (px/ms) en espacio de scroll
    const now = performance.now()
    const { lastX, lastY, lastT } = velocityRef.current
    const dt = Math.max(1, now - lastT) // evitar división por cero
    const ddx = e.clientX - lastX
    const ddy = e.clientY - lastY
    // vScroll = -dPointer/dt
    velocityRef.current.vx = -ddx / dt
    velocityRef.current.vy = -ddy / dt
    velocityRef.current.lastX = e.clientX
    velocityRef.current.lastY = e.clientY
    velocityRef.current.lastT = now
    e.preventDefault()
  }

  const endDrag = (e) => {
    const outer = outerRef.current
    if (!outer) return
    const s = dragState.current
    if (s.dragging) {
      e.preventDefault()
      e.stopPropagation()
    }
    s.dragging = false
    s.maybe = false
    outer.releasePointerCapture?.(e.pointerId)
    // Mantener flag moved por un tick para onClickCapture
    setTimeout(() => { s.moved = false }, 0)
    // iniciar inercia si hay velocidad
    const { vx, vy } = velocityRef.current
    const speed = Math.hypot(vx, vy)
    const MIN_SPEED = 0.02 // px/ms
    if (speed > MIN_SPEED) {
      const FRICTION = 0.95 // multiplicador por frame (~60fps)
      let last = performance.now()
      const step = () => {
        const now = performance.now()
        const dt = Math.min(50, Math.max(1, now - last)) // ms
        last = now
        const out = outerRef.current
        if (!out) return
        // aplicar movimiento
        out.scrollLeft += velocityRef.current.vx * dt
        out.scrollTop += velocityRef.current.vy * dt
        // fricción
        velocityRef.current.vx *= FRICTION
        velocityRef.current.vy *= FRICTION
        // límites
        const maxL = Math.max(0, out.scrollWidth - out.clientWidth)
        const maxT = Math.max(0, out.scrollHeight - out.clientHeight)
        if (out.scrollLeft <= 0 && velocityRef.current.vx < 0) velocityRef.current.vx = 0
        if (out.scrollLeft >= maxL && velocityRef.current.vx > 0) velocityRef.current.vx = 0
        if (out.scrollTop <= 0 && velocityRef.current.vy < 0) velocityRef.current.vy = 0
        if (out.scrollTop >= maxT && velocityRef.current.vy > 0) velocityRef.current.vy = 0
        // condición de parada
        if (Math.hypot(velocityRef.current.vx, velocityRef.current.vy) <= MIN_SPEED * 0.5) {
          inertiaRef.current.id = 0
          return
        }
        inertiaRef.current.id = requestAnimationFrame(step)
      }
      cancelInertia()
      inertiaRef.current.id = requestAnimationFrame(step)
    }
  }

  // Render único: columnas por niveles (mapa mental simple)
  return (
    <div
      ref={outerRef}
      className={`relative ${theme} ${className} my-4 overflow-auto rounded-2xl border border-feather/10 bg-[#d0d0d0] dark:bg-black ${sizeClass}`}
      style={{ width: '100%', height: boxHeight, minHeight: boxHeight ? undefined : 200 }}
    >
      <div
        ref={innerRef}
        className={`relative px-8 py-4 cursor-grab min-h-full flex items-center ${hCenter ? 'justify-center' : 'justify-start'}`}
        style={{ userSelect: dragState.current.dragging ? 'none' : undefined, cursor: dragState.current.dragging ? 'grabbing' : undefined, paddingRight: hCenter ? undefined : 40, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={gridRef}
          className="relative z-10 grid"
          style={{ gridTemplateColumns: `repeat(${byDepth.length || 1}, max-content)`, columnGap: 12, justifyContent: 'start' }}
        >
          {byDepth.map((nodes, depth) => (
            <div
              key={depth}
              className="relative flex items-center"
              style={{ height: maxColHeight || 'auto' }}
            >
              <div
                ref={(el) => {
                  if (el) colRefs.current[depth] = el; else delete colRefs.current[depth]
                }}
                className="flex flex-col gap-1 px-2"
              >
                {nodes.map((n) => (
                  <RowItem key={n.id} node={n} depth={depth} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ConnectorsSvg
          rootRef={innerRef}
          nodesByDepth={byDepth}
          colorClass={'text-primary dark:text-cloud'}
          connectorStartRatio={connectorStartRatio}
          connectorMinDx={connectorMinDx}
          lastExpandedDepth={lastExpandedDepth}
        />
      </div>
    </div>
  )
}

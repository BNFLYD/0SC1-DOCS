import React from "react"

/**
 * MdxContent: layout de columnas para contenido MDX
 *
 * Props:
 * - col: cantidad de columnas (default 2)
 * - width: string | number | string[] | number[]
 *     - string/number: ancho de cada columna (e.g. "33%" o 1fr). Se repite col veces
 *     - array: ancho por columna, p.ej ["15%","45%","40%"]
 * - gap: separación entre columnas/filas (CSS gap) - default 16 (px)
 * - align: alineación vertical del contenido en cada columna (stretch|start|center|end)
 * - textAlign: alineación de párrafos dentro de cada columna (left|center|right|justify)
 *     - string: aplica a todas las columnas
 *     - string[]: aplica por columna, p.ej ["left","center","right"]
 * - className: clases extra del contenedor
 * - columnClass: clases extra para cada item/columna
 * - breakpoint: si se define (e.g. "md"), antes de ese breakpoint se apila en 1 columna
 */
export default function MdxContent({
  col = 2,
  width,
  gap = 16,
  align = "stretch",
  textAlign = undefined,
  className = "",
  columnClass = "",
  breakpoint = "",
  dividers = false,
  dividerClass = "border-l border-gray-300/50 dark:border-gray-600/50 pl-4",
  children,
}) {
  const items = React.Children.toArray(children).filter(Boolean)
  const listAdjust = "[&>ul:not(:has(> li[data-collapsible-init='1']))]:pl-6 [&>ol:not(:has(> li[data-collapsible-init='1']))]:pl-6"

  // Construye template de columnas
  const templateColumns = (() => {
    const count = Number(col) > 0 ? Number(col) : 1

    // Helper para normalizar una unidad (number => px, keywords/fr => tal cual si string)
    const toUnit = (v) => {
      if (typeof v === 'number') return `${v}px`
      if (typeof v === 'string') return v
      return '1fr'
    }

    if (Array.isArray(width) && width.length > 0) {
      // Usa los anchos provistos; si hay menos que col, completa con 1fr
      const arr = [...width]
      while (arr.length < count) arr.push('1fr')
      return arr.slice(0, count).map(toUnit).join(' ')
    }

    if (width != null) {
      // Un solo valor repetido
      const unit = toUnit(width)
      return Array.from({ length: count }, () => unit).join(' ')
    }

    // Sin width => columnas fluidas
    return `repeat(${count}, minmax(0, 1fr))`
  })()

  // Breakpoint: si se provee, apilamos en 1 columna antes del bp
  const bpClass = typeof breakpoint === 'string' && breakpoint.trim()
    ? `${breakpoint.trim()}:grid-cols-[${templateColumns}]`
    : ''

  // Usamos style para grid-template-columns dinámico
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: templateColumns,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    alignItems: align,
  }

  return (
    <div className={`w-full ${className}`} style={containerStyle}>
      {items.map((child, i) => {
        const withDivider = dividers && i > 0
        const allowed = ['left','center','right','justify']
        let ta
        if (Array.isArray(textAlign)) {
          const v = textAlign[i]
          ta = typeof v === 'string' && allowed.includes(v) ? v : undefined
        } else if (typeof textAlign === 'string' && allowed.includes(textAlign)) {
          ta = textAlign
        } else {
          ta = undefined
        }
        return (
          <div
            key={i}
            className={`mdx-rich mdx-pad ${columnClass} ${withDivider ? dividerClass : ''} ${listAdjust}`}
            style={{ breakInside: 'avoid' }}
            data-textalign={ta}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

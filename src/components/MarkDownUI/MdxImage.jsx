import React, { useState } from "react"
export default function MdxImage({
  src,
  alt,
  side = "center",
  width,
  height,
  loading = "lazy",
  fetchpriority = "auto",
  decoding = "auto",
  className = "",
  wrap = false,
  // soporte de contenido
  children,
  // Renombrado: text -> description (se mantiene text por compatibilidad)
  description,
  containerClass = "",
  textClass = "",
  breakpoint = "", // "" = fila siempre; usa "md" si querés activar desde md
  aspectRatio, // e.g. "16:9", "4:3", "3:2", "1:1" o "ancho:alto"
  content = "cover", // object-fit: cover | contain | fill | none | scale-down
  // NUEVO: layout de contenido en columnas
  contentLayout = "slides", // slides | columns
  columns = 1,
  columnsMd,
  columnsLg,
  columnGap = 4, // tailwind gap-x unidad (e.g. 4 -> gap-x-4)
  // Bloquear interacciones con la imagen (no menú, no arrastrar, no selección, sin overlay)
  locked = false,
}) {
  // Helper: crea un overlay de imagen a pantalla completa y lo cierra con click o Esc
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
  const normalizedAspect = (() => {
    if (!aspectRatio) return null
    if (typeof aspectRatio === 'string') {
      const parts = aspectRatio.split(':').map((p) => p.trim())
      if (parts.length === 2 && parts[0] && parts[1]) {
        const w = Number(parts[0])
        const h = Number(parts[1])
        if (!Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0) {
          return `${w} / ${h}`
        }
      }
    }
    return null
  })()

  // Carrusel básico: si src es array, permite click para avanzar
  const isCarousel = Array.isArray(src)
  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const currentSrc = isCarousel ? src[(idx % src.length + src.length) % src.length] : src
  // Descripción vinculada al índice del carrusel si es array
  const descriptionIsArray = Array.isArray(description)
  const currentDescription = descriptionIsArray
    ? description[(idx % description.length + description.length) % description.length]
    : description
  // Slides de contenido (children) sincronizados con índice
  const childrenArray = React.Children.toArray(children).filter(Boolean)
  const hasSlides = childrenArray.length > 0
  const currentSlide = hasSlides
    ? childrenArray[(idx % childrenArray.length + childrenArray.length) % childrenArray.length]
    : null
  const handleClick = (e) => {
    if (!isCarousel) return
    try {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const next = x > rect.width / 2
      setIdx((i) => (next ? i + 1 : i - 1 + src.length) % src.length)
    } catch (_) {
      setIdx((i) => (i + 1) % src.length)
    }
  }

  // Normalizar width: número => px, string => tal cual (porcentajes o px)
  const cssWidth = (() => {
    if (typeof width === 'number') return `${width}px`
    if (typeof width === 'string' && width.trim().length > 0) return width
    return undefined
  })()
  const widthAttr = typeof width === 'number' ? width : undefined

  const ImgBox = (
    <div
      className={`${containerClass ? '' : ''}`}
      style={{
        // controla el ancho total del bloque (imagen + caption)
        width: cssWidth,
      }}
      onMouseEnter={() => isCarousel && setHover(true)}
      onMouseLeave={() => isCarousel && setHover(false)}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: normalizedAspect || undefined,
          width: '100%',
        }}
      >
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          width={widthAttr}
          height={height}
          loading={loading}
          fetchpriority={fetchpriority}
          decoding={decoding}
          data-mdximage="1"
          onClick={() => { if (!locked) showOverlay(currentSrc, alt) }}
          onContextMenu={locked ? (e) => e.preventDefault() : undefined}
          onDragStart={locked ? (e) => e.preventDefault() : undefined}
          onMouseDown={locked ? (e) => e.preventDefault() : undefined}
          draggable={locked ? false : undefined}
          className={`mdx-fade-in ${(() => {
            // Si el usuario ya pasó alguna clase rounded*, no aplicar el default
            const hasRounded = typeof className === 'string' && /(^|\s)rounded(?:-[a-z0-9-]+)?(\s|$)/i.test(className)
            return hasRounded ? '' : 'rounded-2xl'
          })()} ${className}`.trim()}
          style={{
            display: 'block',
            width: '100%',
            height: normalizedAspect ? '100%' : undefined,
            objectFit: content,
            cursor: locked ? 'default' : 'zoom-in',
            userSelect: locked ? 'none' : undefined,
            WebkitUserDrag: locked ? 'none' : undefined,
            // Forzar el radio si el usuario pasó rounded-full/rounded-none
            borderRadius: (() => {
              if (typeof className === 'string') {
                if (/(^|\s)rounded-none(\s|$)/i.test(className)) return '0px'
                if (/(^|\s)rounded-full(\s|$)/i.test(className)) return '9999px'
              }
              return undefined
            })(),
          }}
        />
        {isCarousel && (
          <>
            {/* Transparent click zones for easier navigation (reduced width) */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                setIdx((i) => (i - 1 + src.length) % src.length)
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '12%',
                height: '80%',
                background: 'transparent',
                zIndex: 25,
              }}
              aria-label="Zona anterior"
            />
            <div
              onClick={(e) => {
                e.stopPropagation()
                setIdx((i) => (i + 1) % src.length)
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '12%',
                height: '80%',
                background: 'transparent',
                zIndex: 25,
              }}
              aria-label="Zona siguiente"
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 8,
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: '#2ca798',
                borderRadius: 0,
                padding: 0,
                fontSize: 20,
                lineHeight: 1,
                opacity: hover ? 1 : 0,
                transition: 'opacity 120ms ease',
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: 30,
                fontWeight: 1000,
              }}
              role="button"
              tabIndex={0}
              aria-label="Imagen anterior"
              onClick={() => setIdx((i) => (i - 1 + src.length) % src.length)}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIdx((i) => (i - 1 + src.length) % src.length)
                }
              }}
            >
              ◀
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: '#2ca798',
                borderRadius: 0,
                padding: 0,
                fontSize: 20,
                lineHeight: 1,
                opacity: hover ? 1 : 0,
                transition: 'opacity 120ms ease',
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: 30,
                fontWeight: 1000,
              }}
              role="button"
              tabIndex={0}
              aria-label="Imagen siguiente"
              onClick={() => setIdx((i) => (i + 1) % src.length)}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIdx((i) => (i + 1) % src.length)
                }
              }}
            >
              ▶
            </div>
          </>
        )}
      </div>
      {currentDescription != null && (
        <div key={typeof currentDescription === 'string' ? currentDescription : idx} className={`w-full text-center mt-2 mdx-fade-in ${textClass}`}>
          {currentDescription}
        </div>
      )}
    </div>
  )
  // Si hay contenido lateral (children), layout lado a lado controlado por side
  if (hasSlides) {
    const hasBp = typeof breakpoint === "string" && breakpoint.trim().length > 0
    const bp = hasBp ? `${breakpoint.trim()}:` : ""

    const Img = ImgBox
    // No añadimos paddings/margins laterales aquí; el espaciado de listas lo maneja index.css
    const listAdjust = ""

    // Helper: clases para multi-columnas
    const colClass = (() => {
      // Sanitizar valores aceptados (1..6)
      const clamp = (n) => {
        const v = Number(n)
        if (Number.isNaN(v) || v < 1) return 1
        if (v > 6) return 6
        return v
      }
      const baseCols = clamp(columns)
      const mdCols = columnsMd != null ? clamp(columnsMd) : null
      const lgCols = columnsLg != null ? clamp(columnsLg) : null
      const parts = [`columns-${baseCols}`]
      if (mdCols) parts.push(`md:columns-${mdCols}`)
      if (lgCols) parts.push(`lg:columns-${lgCols}`)
      const gap = typeof columnGap === 'number' ? `gap-x-${columnGap}` : (columnGap || 'gap-x-4')
      parts.push(gap)
      // evitar cortes feos
      parts.push('[&>*]:break-inside-avoid')
      return parts.join(' ')
    })()

    // contentLayout: columns => mostramos TODOS los children en columnas
    if (contentLayout === 'columns') {
      // center: imagen centrada arriba y columnas debajo a todo el ancho
      if (side === 'center') {
        return (
          <div className={`flex flex-col items-center gap-3 ${containerClass}`}>
            {Img}
            <div className={`w-full ${colClass} mdx-rich mdx-pad ${textClass} ${listAdjust}`}>
              {childrenArray}
            </div>
          </div>
        )
      }

      // left/right: imagen a un lado y columnas al otro
      const Columns = (
        <div className={`flex-1 min-w-0 ${colClass} mdx-rich mdx-pad ${textClass} ${listAdjust}`}>
          {childrenArray}
        </div>
      )
      const contentCols = side === 'right' ? (
        <>
          {Columns}
          {Img}
        </>
      ) : (
        <>
          {Img}
          {Columns}
        </>
      )
      return (
        <div className={`${bp}flex gap-4 items-start ${containerClass}`}>
          {contentCols}
        </div>
      )
    }

    // contentLayout: slides (comportamiento previo)
    const Txt = (
      <div className={`flex-1 min-w-0 mdx-rich mdx-pad ${textClass} ${listAdjust}`}>{currentSlide}</div>
    )

    // Caso especial: side="center" con texto (children) => columna centrada
    if (side === 'center') {
      return (
        <div className={`flex flex-col items-center gap-3 ${containerClass}`}>
          {Img}
          <div className={`w-full text-center mdx-rich mdx-pad ${textClass} ${listAdjust}`}>{currentSlide}</div>
        </div>
      )
    }

    // Orden DOM según side (evita depender de flex-row-reverse)
    const content = side === 'right' ? (
      <>
        {Txt}
        {Img}
      </>
    ) : (
      <>
        {Img}
        {Txt}
      </>
    )

    return (
      <div className={`${bp}flex gap-4 items-start ${containerClass}`}>
        {content}
      </div>
    )
  }

  // Alineación
  // - wrap=false: bloque con márgenes automáticos (robusto en flex/grid)
  // - wrap=true: usa floats para que el texto/otros elementos fluyan alrededor
  let sideClass = "block";
  if (wrap) {
    sideClass =
      side === "right"
        ? "float-right ml-4"
        : side === "left"
        ? "float-left mr-4"
        : "flex justify-center w-full";
  } else {
    sideClass =
      side === "right"
        ? "block ml-auto"
        : side === "left"
        ? "block mr-auto"
        : "flex justify-center w-full";
  }

  return (
    <div className={`${sideClass}`}>
      {ImgBox}
    </div>
  )
}

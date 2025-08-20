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
}) {
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
      className={`shrink-0 ${containerClass ? '' : ''}`}
      style={{
        // si se provee width (px o %), respetarlo para calcular altura con aspect-ratio
        width: cssWidth,
        // si se provee height sin aspect, dejamos que el <img> lo maneje
        aspectRatio: normalizedAspect || undefined,
        position: 'relative',
      }}
      onClick={handleClick}
      onMouseEnter={() => isCarousel && setHover(true)}
      onMouseLeave={() => isCarousel && setHover(false)}
    >
      <img
        src={currentSrc}
        alt={alt}
        width={widthAttr}
        height={height}
        loading={loading}
        fetchpriority={fetchpriority}
        decoding={decoding}
        className={`rounded-2xl ${className}`}
        style={{
          display: 'block',
          width: normalizedAspect ? '100%' : cssWidth,
          height: normalizedAspect ? '100%' : undefined,
          objectFit: content,
        }}
      />
      {isCarousel && (
        <>
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
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 20,
              fontWeight: 1000,
            }}
            aria-hidden
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
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 20,
              fontWeight: 1000,
            }}
            aria-hidden
          >
            ▶
          </div>
        </>
      )}
      {currentDescription != null && (
        <div className={`w-full text-center mt-2 ${textClass}`}>
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
    const Txt = (
      <div className={`flex-1 min-w-0 ${textClass}`}>{currentSlide}</div>
    )

    // Caso especial: side="center" con texto (children) => columna centrada
    if (side === 'center') {
      return (
        <div className={`flex flex-col items-center gap-3 ${containerClass}`}>
          {Img}
          <div className={`w-full text-center ${textClass}`}>{currentSlide}</div>
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
        : "block mx-auto";
  } else {
    sideClass =
      side === "right"
        ? "block ml-auto"
        : side === "left"
        ? "block mr-auto"
        : "block mx-auto";
  }

  return (
    <div className={`${sideClass}`}>
      {ImgBox}
    </div>
  )
}

import React from "react"
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
  text,
  containerClass = "",
  textClass = "",
  breakpoint = "", // "" = fila siempre; usa "md" si querés activar desde md
  // NUEVO: relación de aspecto y ajuste de contenido
  aspectRatio, // e.g. "16:9", "4:3", "3:2", "1:1" o "ancho:alto"
  content = "cover", // object-fit: cover | contain | fill | none | scale-down
}) {
  // Utilidades para relación de aspecto
  const normalizedAspect = (() => {
    if (!aspectRatio) return null
    if (typeof aspectRatio === 'string') {
      // admitir formatos conocidos "w:h"
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

  const ImgBox = (
    <div
      className={`shrink-0 ${containerClass ? '' : ''}`}
      style={{
        // si se provee width, respetarlo para calcular altura con aspect-ratio
        width: typeof width === 'number' ? `${width}px` : undefined,
        // si se provee height sin aspect, dejamos que el <img> lo maneje
        aspectRatio: normalizedAspect || undefined,
      }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchpriority={fetchpriority}
        decoding={decoding}
        className={`rounded-2xl ${className}`}
        style={{
          display: 'block',
          width: normalizedAspect ? '100%' : undefined,
          height: normalizedAspect ? '100%' : undefined,
          objectFit: content,
        }}
      />
    </div>
  )
  // Si hay texto/children: layout lado a lado controlado por side
  if (children != null || text != null) {
    const hasBp = typeof breakpoint === "string" && breakpoint.trim().length > 0
    const bp = hasBp ? `${breakpoint.trim()}:` : ""

    const Img = ImgBox
    const Txt = (
      <div className={`flex-1 min-w-0 ${textClass}`}>{children ?? text}</div>
    )

    // Caso especial: side="center" con texto => columna centrada
    if (side === 'center') {
      return (
        <div className={`flex flex-col items-center gap-3 ${containerClass}`}>
          {Img}
          <div className={`w-full text-center ${textClass}`}>{children ?? text}</div>
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
    <div className={`${sideClass}`} style={{ aspectRatio: normalizedAspect || undefined }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchpriority={fetchpriority}
        decoding={decoding}
        className={`rounded-2xl ${className}`}
        style={{
          display: 'block',
          width: normalizedAspect ? '100%' : undefined,
          height: normalizedAspect ? '100%' : undefined,
          objectFit: content,
        }}
      />
    </div>
  )
}

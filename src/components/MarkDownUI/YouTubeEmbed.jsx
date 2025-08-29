import React, { useMemo, useRef } from "react";

export default function YouTubeEmbed({
  url,
  id,
  title = "YouTube video",
  start = 0,
  autoplay = false,
  controls = true,
  loop = false,
  mute = false,
  ratio = "16/9",
  width,
  height,
  side = "center",
  description,
  seekTo, // number (seconds) or string mm:ss / hh:mm:ss to jump when clicking description
  markers = [], // array of { label: string, time: number|string }
  markersRounded = "md", // none|sm|md|lg|xl|2xl|full
  markersClass = "", // extra classes for marker buttons
  markersAnimateClass = "", // e.g., 'animate-float', 'animate-blink'
  cover = true, // make iframe visually cover the container
  showTitle = true, // render visual H2 with title above description
  className = "",
  // soporte de contenido adicional (MDX children) como en imágenes
  children,
  // Escalar UI del player (controles) cuando el embed es muy pequeño. 1 = sin cambios
  uiScale = 1,
}) {
  const normalizeRatio = (val) => {
    if (!val) return undefined;
    const s = String(val).trim();
    const parts = s.replace(/\s+/g, "").split(/[:/]/);
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[0]} / ${parts[1]}`; // CSS expects "<num> / <num>"
    }
    return s;
  };

  const toPercent = (v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "number") return `${v}%`;
    return v; // assume valid CSS unit like '80%'
  };

  const videoId = useMemo(() => {
    if (id && typeof id === "string") return id;
    if (!url || typeof url !== "string") return "";
    try {
      const u = new URL(url);
      // https://www.youtube.com/watch?v=VIDEO_ID
      if (u.hostname.includes("youtube.com")) {
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        // Paths like /shorts/VIDEO_ID or /embed/VIDEO_ID
        const parts = u.pathname.split("/").filter(Boolean);
        const shortsIdx = parts.indexOf("shorts");
        if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
        const embedIdx = parts.indexOf("embed");
        if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      }
      // https://youtu.be/VIDEO_ID
      if (u.hostname.includes("youtu.be")) {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0]) return parts[0];
      }
      return "";
    } catch (_) {
      return "";
    }
  }, [url, id]);

  if (!videoId) return null;

  const params = new URLSearchParams();
  if (start > 0) params.set("start", String(start));
  if (autoplay) params.set("autoplay", "1");
  if (!controls) params.set("controls", "0");
  if (loop) {
    params.set("loop", "1");
    // playlist needed for true loop behavior
    params.set("playlist", videoId);
  }
  if (mute) params.set("mute", "1");
  // Enable JS API for programmatic seeking
  params.set("enablejsapi", "1");
  try {
    // Best effort to set origin for security; ignore if not available
    // window may be undefined in SSR contexts, but this component is client-side
    // so we guard with try/catch.
    // eslint-disable-next-line no-undef
    if (typeof window !== "undefined" && window.location?.origin) {
      params.set("origin", window.location.origin);
    }
  } catch {}

  const src = `https://www.youtube.com/embed/${videoId}${params.toString() ? `?${params.toString()}` : ""}`;

  // Styles: outer wrapper controls width/height; inner holds aspect-ratio box
  const frameStyle = {
    aspectRatio: normalizeRatio(ratio),
  };
  const w = toPercent(width);
  const h = toPercent(height);
  const wrapperStyle = {};
  // If we have side layout with children and width is a percentage, treat it as video width,
  // so don't constrain the outer wrapper width.
  const videoPercent = (() => {
    if (!w) return null;
    if (typeof w === 'string' && w.trim().endsWith('%')) {
      const n = parseFloat(w);
      if (!Number.isNaN(n) && n > 0 && n < 100) return n;
    }
    if (typeof width === 'number' && width > 0 && width < 100) return width;
    return null;
  })();
  const sideWithChildren = !!children && side !== 'center';
  if (w && !(sideWithChildren && videoPercent != null)) wrapperStyle.width = w; else wrapperStyle.width = "100%";
  if (h) wrapperStyle.height = h; // optional explicit height

  const sideClass = (() => {
    switch (side) {
      case "left":
        return "ml-0 mr-auto";
      case "right":
        return "ml-auto mr-0";
      case "center":
      default:
        return "mx-auto";
    }
  })();

  const iframeRef = useRef(null);

  const toSeconds = (v) => {
    if (v == null) return null;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const s = String(v).trim();
    // supports ss, mm:ss, hh:mm:ss
    const parts = s.split(":").map((x) => parseInt(x, 10));
    if (parts.some((n) => Number.isNaN(n))) return null;
    let sec = 0;
    if (parts.length === 1) sec = parts[0];
    if (parts.length === 2) sec = parts[0] * 60 + parts[1];
    if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    return sec;
  };

  const seek = (v) => {
    const seconds = toSeconds(v);
    if (seconds == null) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    const payload = (func, args = []) => ({ event: "command", func, args });
    try {
      iframe.contentWindow.postMessage(JSON.stringify(payload("seekTo", [seconds, true])), "*");
      iframe.contentWindow.postMessage(JSON.stringify(payload("playVideo")), "*");
    } catch {}
  };

  // Reusable blocks: Video (iframe + description + markers) and Children content
  const VideoBlock = (
    <>
      <div className="relative overflow-hidden rounded-2xl" style={frameStyle}>
        <iframe
          className={`${cover ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "w-full h-full"}`}
          src={src}
          title={title}
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          ref={iframeRef}
          allowFullScreen
          style={(() => {
            // Cuando cover=true, antes usábamos min-w/min-h para cubrir.
            // Para escalar la UI, compensamos expandiendo el iframe y aplicando transform.
            if (!cover) return undefined;
            const s = Number(uiScale);
            if (!s || s === 1) return { minWidth: '100%', minHeight: '100%' };
            const pct = (100 / s);
            return {
              // Hacemos el iframe más grande y lo escalamos para que cubra sin dejar bordes
              width: `${pct}%`,
              height: `${pct}%`,
              minWidth: `${pct}%`,
              minHeight: `${pct}%`,
              transform: `translate(-50%, -50%) scale(${s})`,
              transformOrigin: 'center',
              left: '50%',
              top: '50%',
              position: 'absolute',
            };
          })()}
        />
      </div>
      {showTitle && typeof title === 'string' && title.trim() !== '' ? (
        <h2 className={`mt-3 mb-0 text-2xl font-semibold pb-0 ${side === 'center' ? 'text-left' : ''}`}>{title}</h2>
      ) : null}
      {description ? (
        <div className="mt-0 text-sm text-gray-600 dark:text-gray-300">
          {seekTo ? (
            <button type="button" onClick={() => seek(seekTo)} className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-100">
              {description}
            </button>
          ) : (
            description
          )}
        </div>
      ) : null}
      {Array.isArray(markers) && markers.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          {markers.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => seek(m?.time)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ox = ((e.clientX - rect.left) / rect.width) * 100;
                const oy = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--ox', `${ox}%`);
                e.currentTarget.style.setProperty('--oy', `${oy}%`);
              }}
              className={`px-2 py-0.5 ${
                {
                  none: "rounded-none",
                  sm: "rounded-sm",
                  md: "rounded-md",
                  lg: "rounded-lg",
                  xl: "rounded-xl",
                  "2xl": "rounded-2xl",
                  full: "rounded-full",
                }[markersRounded] || "rounded-md"
              } relative isolate overflow-hidden text-inherit bg-cloud dark:bg-void hover:bg-void hover:text-cloud dark:hover:bg-secondary dark:hover:text-void transition-colors before:content-[''] before:absolute before:inset-0 before:rounded-full before:-z-10 before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)] before:bg-void dark:before:bg-secondary ${markersAnimateClass} ${markersClass}`}
              title={typeof m?.time === "string" ? m.time : `${m?.time}s`}
            >
              {m?.label ?? m?.time}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );

  const ChildrenBlock = children ? (
    <div className="mdx-rich mdx-pad">
      {children}
    </div>
  ) : null;

  return (
    <div className={`${sideClass} ${className}`} style={wrapperStyle}>
      {children && side !== "center" ? (
        <div className="flex gap-4 items-start">
          {side === "right" ? (
            <>
              <div
                className="min-w-0"
                style={{ flexBasis: videoPercent != null ? `${100 - videoPercent}%` : undefined, width: videoPercent != null ? `${100 - videoPercent}%` : undefined, flexGrow: videoPercent != null ? 0 : 1 }}
              >
                {ChildrenBlock}
              </div>
              <div
                className="min-w-0"
                style={{ flexBasis: videoPercent != null ? `${videoPercent}%` : undefined, width: videoPercent != null ? `${videoPercent}%` : undefined, flexGrow: videoPercent != null ? 0 : 1 }}
              >
                {VideoBlock}
              </div>
            </>
          ) : (
            <>
              <div
                className="min-w-0"
                style={{ flexBasis: videoPercent != null ? `${videoPercent}%` : undefined, width: videoPercent != null ? `${videoPercent}%` : undefined, flexGrow: videoPercent != null ? 0 : 1 }}
              >
                {VideoBlock}
              </div>
              <div
                className="min-w-0"
                style={{ flexBasis: videoPercent != null ? `${100 - videoPercent}%` : undefined, width: videoPercent != null ? `${100 - videoPercent}%` : undefined, flexGrow: videoPercent != null ? 0 : 1 }}
              >
                {ChildrenBlock}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {VideoBlock}
          {children ? (
            <div className="mt-2 w-full mdx-rich mdx-pad [&>*]:mx-auto">{children}</div>
          ) : null}
        </>
      )}
    </div>
  );
}

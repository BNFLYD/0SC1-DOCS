import { useEffect, useRef, useState } from "react"

export function Scrollbar({ targetId, container = false, rightOffsetPx = 16, topPadPx = 368, bottomPadPx = 50 }) {
  const trackRef = useRef(null)
  const thumbRef = useRef(null)
  const [thumbTop, setThumbTop] = useState(0)
  const [thumbHeight, setThumbHeight] = useState(0)
  const [showScroll, setShowScroll] = useState(true)
  const [fixedTop, setFixedTop] = useState(96)
  const [trackHeightPx, setTrackHeightPx] = useState(() => Math.max(0, window.innerHeight - 96))
  const bottomOffsetPx = 48
  const [ready, setReady] = useState(false)
  const initialTopRef = useRef(null)
  const lockedRef = useRef(false)

  useEffect(() => {
    // Resolve target element for both modes (container and post). In post mode we only measure it.
    const targetEl = targetId ? document.getElementById(targetId) : null

    const computeMetrics = () => {
      const track = trackRef.current
      if (!track) return { trackH: 0, maxScrollable: 0, start: 0, elH: 0, viewH: 0 }
      if (container && targetEl) {
        const elH = targetEl.scrollHeight || 0
        const viewH = targetEl.clientHeight || 0
        const start = 0
        const maxScrollable = Math.max(0, elH - viewH)
        const trackH = track.clientHeight || 0
        return { trackH, maxScrollable, start, elH, viewH }
      }
      // Page-wide mapping: full document height
      const doc = document.documentElement
      const elH = Math.max(doc.scrollHeight, doc.offsetHeight, doc.clientHeight)
      const viewH = window.innerHeight
      const start = 0
      const maxScrollable = Math.max(0, elH - viewH)
      const trackH = track.clientHeight || 0
      return { trackH, maxScrollable, start, elH, viewH }
    }

    // Size depends on total vs visible height only (no min, no scroll dependency)
    const updateThumbSize = () => {
      // In post mode (non-container) if we have a target element, decide visibility by its height vs viewport.
      if (!container && targetEl) {
        const track = trackRef.current
        if (!track) return
        const elH = targetEl.scrollHeight || targetEl.getBoundingClientRect().height || 0
        const viewH = window.innerHeight
        const trackH = track.clientHeight || 0
        if (!trackH) return
        setShowScroll(elH > (viewH - 8))
        const safeEl = Math.max(1, elH || 1)
        const safeView = Math.max(1, viewH)
        const viewRatio = Math.min(1, safeView / safeEl)
        const th = Math.floor(trackH * viewRatio)
        setThumbHeight(th)
        // Also update position with the new thumb height to keep it within bounds
        const maxScrollable = Math.max(0, safeEl - safeView)
        const y = window.scrollY
        const p = maxScrollable > 0 ? Math.min(1, Math.max(0, y / maxScrollable)) : 0
        const travel = Math.max(0, trackH - th)
        setThumbTop(Math.floor(p * travel))
        return
      }

      // Default sizing (list/container mode or no target element)
      const { trackH, elH, viewH } = computeMetrics()
      if (!trackH) return
      setShowScroll((elH || 0) > (viewH - 8))
      const safeEl = Math.max(1, elH || 1)
      const safeView = Math.max(1, viewH)
      const viewRatio = Math.min(1, safeView / safeEl)
      const th = Math.floor(trackH * viewRatio)
      setThumbHeight(th)
      // Clamp position using the freshly computed thumb height
      const maxScrollable = Math.max(0, safeEl - safeView)
      const y = container && targetEl ? (targetEl.scrollTop || 0) : window.scrollY
      const p = maxScrollable > 0 ? Math.min(1, Math.max(0, y / maxScrollable)) : 0
      const travel = Math.max(0, trackH - th)
      setThumbTop(Math.floor(p * travel))
    }

    // Position maps current scroll to the available travel
    const updateThumbPosition = () => {
      const { trackH, maxScrollable, start } = computeMetrics()
      if (!trackH) return
      if (maxScrollable <= 0) { setThumbTop(0); return }
      const y = container && targetEl ? targetEl.scrollTop : window.scrollY
      const p = Math.min(1, Math.max(0, (y - start) / maxScrollable))
      const th = thumbRef.current?.offsetHeight || thumbHeight
      const travel = Math.max(0, trackH - th)
      const top = Math.floor(p * travel)
      setThumbTop(top)
    }

    const onScroll = () => updateThumbPosition()
    const onResize = () => { updateThumbSize(); updateThumbPosition() }

    // Initial compute + one extra frame for late layout
    updateThumbSize()
    updateThumbPosition()
    let raf1 = 0
    raf1 = requestAnimationFrame(() => {
      updateThumbSize();
      updateThumbPosition();
      // If list container exists and is at top, force thumb to top to avoid stale residual positions
      if (container && targetEl && (targetEl.scrollTop || 0) === 0) {
        setThumbTop(0)
      }
      // Clamp container scrollTop to its new maxScrollable after layout changes
      if (container && targetEl) {
        const { maxScrollable } = computeMetrics()
        if (targetEl.scrollTop > maxScrollable) {
          try { targetEl.scrollTop = maxScrollable } catch {}
        }
        updateThumbPosition()
      }
    })

    if (container && targetEl) {
      targetEl.addEventListener('scroll', onScroll, { passive: true })
      const ro = new ResizeObserver(() => onResize())
      try { ro.observe(targetEl) } catch {}
      window.addEventListener('resize', onResize)
      return () => {
        cancelAnimationFrame(raf1)
        targetEl.removeEventListener('scroll', onScroll)
        try { ro.disconnect() } catch {}
        window.removeEventListener('resize', onResize)
      }
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      return () => {
        cancelAnimationFrame(raf1)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
      }
    }
  }, [targetId, container])

  // When the track geometry changes (due to top/bottom paddings applying after mount),
  // recompute size and position so the thumb never sits outside the new track bounds.
  useEffect(() => {
    if (!ready) return
    const track = trackRef.current
    if (!track) return
    // Force a recompute after layout has applied new sizes
    const id = requestAnimationFrame(() => {
      // Reuse logic from main effect without duplicating listeners
      const trackH = track.clientHeight || 0
      if (!trackH) return
      // Determine mode + target
      const targetEl = targetId ? document.getElementById(targetId) : null
      if (container && targetEl) {
        const elH = targetEl.scrollHeight || 0
        const viewH = targetEl.clientHeight || 0
        const safeEl = Math.max(1, elH)
        const safeView = Math.max(1, viewH)
        const viewRatio = Math.min(1, safeView / safeEl)
        const th = Math.floor(trackH * viewRatio)
        setThumbHeight(th)
        const maxScrollable = Math.max(0, safeEl - safeView)
        const y = targetEl.scrollTop || 0
        const p = maxScrollable > 0 ? Math.min(1, Math.max(0, y / maxScrollable)) : 0
        const travel = Math.max(0, trackH - th)
        setThumbTop(Math.floor(p * travel))
      } else {
        const doc = document.documentElement
        const elH = Math.max(doc.scrollHeight, doc.offsetHeight, doc.clientHeight)
        const viewH = window.innerHeight
        const safeEl = Math.max(1, elH)
        const safeView = Math.max(1, viewH)
        const viewRatio = Math.min(1, safeView / safeEl)
        const th = Math.floor(trackH * viewRatio)
        setThumbHeight(th)
        const maxScrollable = Math.max(0, safeEl - safeView)
        const y = window.scrollY
        const p = maxScrollable > 0 ? Math.min(1, Math.max(0, y / maxScrollable)) : 0
        const travel = Math.max(0, trackH - th)
        setThumbTop(Math.floor(p * travel))
      }
    })
    return () => cancelAnimationFrame(id)
  }, [trackHeightPx, fixedTop, ready, container, targetId])

  // Track sizing/positioning (same layout; paddings configurable per mode)
  useEffect(() => {
    const topPad = topPadPx
    const bottomPad = bottomPadPx
    const apply = () => {
      setFixedTop(topPad)
      setTrackHeightPx(Math.max(0, window.innerHeight - topPad - bottomPad))
      setReady(true)
    }
    apply()
    const onResize = () => apply()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [targetId, container, topPadPx, bottomPadPx])

  useEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return

    const targetEl = container && targetId ? document.getElementById(targetId) : null
    let dragging = false
    let moved = false
    let grabOffset = 0 // distancia desde el borde superior del pulgar hasta el punto donde se agarra
    let trackHolding = false

    const computeMax = () => {
      if (container && targetEl) {
        const start = 0
        const maxScrollable = Math.max(0, (targetEl.scrollHeight || 0) - (targetEl.clientHeight || 0))
        const trackH = track.clientHeight || 0
        const th = thumb.offsetHeight || 0
        return { start, maxScrollable, trackH, th }
      }
      // Page-wide mapping
      const doc = document.documentElement
      const start = 0
      const maxScrollable = Math.max(0, Math.max(doc.scrollHeight, doc.offsetHeight, doc.clientHeight) - window.innerHeight)
      const trackH = track.clientHeight || 0
      const th = thumb.offsetHeight || 0
      return { start, maxScrollable, trackH, th }
    }

    const scrollToThumbTop = (top, smooth) => {
      const { start, maxScrollable, trackH, th } = computeMax()
      if (trackH <= 0) return
      const clampedTop = Math.min(Math.max(0, top), Math.max(0, trackH - th))
      const p = trackH - th > 0 ? clampedTop / (trackH - th) : 0
      const target = start + p * maxScrollable
      if (container && targetEl) {
        targetEl.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' })
      } else {
        window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' })
      }
    }

    const onThumbDown = (e) => {
      dragging = true
      moved = false
      // calcular el offset donde se tomó el pulgar para evitar saltos
      const thumbRect = thumb.getBoundingClientRect()
      grabOffset = Math.max(0, Math.min(e.clientY - thumbRect.top, thumbRect.height))
      try { thumb.setPointerCapture?.(e.pointerId) } catch (_) {}
      e.preventDefault()
      e.stopPropagation()
    }

    const onThumbMove = (e) => {
      if (!dragging) return
      moved = true
      const trackRect = track.getBoundingClientRect()
      const top = (e.clientY - trackRect.top) - grabOffset
      scrollToThumbTop(top, false)
      e.preventDefault()
    }

    const onThumbUp = (e) => {
      dragging = false
      try { thumb.releasePointerCapture?.(e.pointerId) } catch {}
    }
    const onTrackDown = (e) => {
      if (e.target === thumb) return
      trackHolding = true
      try { track.setPointerCapture?.(e.pointerId) } catch (_) {}
      const trackRect = track.getBoundingClientRect()
      const clickY = e.clientY - trackRect.top
      const th = thumb.offsetHeight || 0
      const targetTop = clickY - th / 2
      scrollToThumbTop(targetTop, false)
      e.preventDefault()
      e.stopPropagation()
    }

    const onTrackMove = (e) => {
      if (!trackHolding) return
      const trackRect = track.getBoundingClientRect()
      const y = e.clientY - trackRect.top
      const th = thumb.offsetHeight || 0
      const targetTop = y - th / 2
      scrollToThumbTop(targetTop, false)
      e.preventDefault()
    }

    const onTrackUp = (e) => {
      if (!trackHolding) return
      trackHolding = false
      try { track.releasePointerCapture?.(e.pointerId) } catch {}
    }

    thumb.addEventListener('pointerdown', onThumbDown)
    thumb.addEventListener('pointermove', onThumbMove)
    thumb.addEventListener('pointerup', onThumbUp)
    thumb.addEventListener('pointercancel', onThumbUp)
    track.addEventListener('pointerdown', onTrackDown)
    track.addEventListener('pointermove', onTrackMove)
    track.addEventListener('pointerup', onTrackUp)
    track.addEventListener('pointercancel', onTrackUp)
    return () => {
      thumb.removeEventListener('pointerdown', onThumbDown)
      thumb.removeEventListener('pointermove', onThumbMove)
      thumb.removeEventListener('pointerup', onThumbUp)
      thumb.removeEventListener('pointercancel', onThumbUp)
      track.removeEventListener('pointerdown', onTrackDown)
      track.removeEventListener('pointermove', onTrackMove)
      track.removeEventListener('pointerup', onTrackUp)
      track.removeEventListener('pointercancel', onTrackUp)
    }
  }, [targetId, container])

  if (!showScroll) return null

  if (container) {
    return (
      <div
        className="absolute top-0 h-full z-10 pointer-events-none transition-opacity duration-200"
        style={{ right: `-${rightOffsetPx}px`, visibility: ready ? 'visible' : 'hidden', opacity: ready ? 1 : 0 }}
      >
        <div className="fixed w-3 pointer-events-auto" style={{ top: fixedTop + 'px', height: trackHeightPx + 'px' }}>
          <div ref={trackRef} className="relative h-full w-full rounded-full bg-secondary dark:bg-primary touch-none select-none overflow-hidden">
            <div
              ref={thumbRef}
              style={{ top: `${Math.max(0, Math.min(thumbTop, Math.max(0, (trackRef.current?.clientHeight || trackHeightPx) - thumbHeight)))}px`, height: `${thumbHeight}px` }}
              className="absolute left-0 right-0 rounded-full bg-feather cursor-pointer touch-none select-none"
              role="slider"
              aria-orientation="vertical"
              aria-label="Scroll list"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute top-0 h-full z-10 pointer-events-none transition-opacity duration-200"
      style={{ right: `-${rightOffsetPx}px`, visibility: ready ? 'visible' : 'hidden', opacity: ready ? 1 : 0 }}
    >
      <div className="fixed w-3 pointer-events-auto" style={{ top: fixedTop + 'px', height: trackHeightPx + 'px' }}>
        <div ref={trackRef} className="relative h-full w-full rounded-full bg-secondary dark:bg-primary touch-none select-none overflow-hidden">
          <div
            ref={thumbRef}
            style={{ top: `${Math.max(0, Math.min(thumbTop, Math.max(0, (trackRef.current?.clientHeight || trackHeightPx) - thumbHeight)))}px`, height: `${thumbHeight}px` }}
            className="absolute left-0 right-0 rounded-full bg-feather cursor-pointer touch-none select-none"
            role="slider"
            aria-orientation="vertical"
            aria-label="Scroll post"
          />
        </div>
      </div>
    </div>
  )
}

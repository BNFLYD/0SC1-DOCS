import { useEffect, useRef, useState } from "react"

export function Scrollbar({ targetId }) {
  const trackRef = useRef(null)
  const thumbRef = useRef(null)
  const [thumbTop, setThumbTop] = useState(0)
  const [thumbHeight, setThumbHeight] = useState(40)
  const [showScroll, setShowScroll] = useState(true)
  const [fixedTop, setFixedTop] = useState(96)
  const [trackHeightPx, setTrackHeightPx] = useState(() => Math.max(0, window.innerHeight - 96))
  const bottomOffsetPx = 48
  const [ready, setReady] = useState(false)
  const initialTopRef = useRef(null)
  const lockedRef = useRef(false)

  useEffect(() => {
    const offset = 96

    const computeMetrics = () => {
      const track = trackRef.current
      if (!track) return { trackH: 0, maxScrollable: 0, start: 0, elH: 0 }
      // Page-wide mapping: full document height
      const doc = document.documentElement
      const elH = Math.max(doc.scrollHeight, doc.offsetHeight, doc.clientHeight)
      const start = 0
      const maxScrollable = Math.max(0, elH - window.innerHeight)
      const trackH = track.clientHeight || 0
      return { trackH, maxScrollable, start, elH }
    }

    const updateThumb = () => {
      const { trackH, maxScrollable, start, elH } = computeMetrics()
      if (!trackH) return
      setShowScroll((elH || 0) > (window.innerHeight - 8))
      // Native-like: thumb size proportional to visible vs total content
      const minThumb = 24
      const viewRatio = Math.min(1, (window.innerHeight - 1) / Math.max(1, elH || 1))
      const th = Math.max(minThumb, Math.floor(trackH * viewRatio))
      setThumbHeight(th)
      if (maxScrollable <= 0) { setThumbTop(0); return }
      const y = window.scrollY
      const p = Math.min(1, Math.max(0, (y - start) / maxScrollable))
      const top = Math.floor(p * (trackH - th))
      setThumbTop(top)
    }

    const onScroll = () => updateThumb()
    const onResize = () => { updateThumb() }
    // Initial compute + one extra frame for late layout
    updateThumb()
    let raf1 = 0
    raf1 = requestAnimationFrame(() => updateThumb())

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf1)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [targetId])

  // Fixed track with constant paddings (no card-based calculations or observers)
  useEffect(() => {
    const topPad = 366 // fixed
    const bottomPad = 56 // fixed
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
  }, [targetId])

  useEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return

    const offset = 96
    let dragging = false
    let moved = false
    let grabOffset = 0 // distancia desde el borde superior del pulgar hasta el punto donde se agarra
    let trackHolding = false

    const computeMax = () => {
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
      window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' })
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
  }, [targetId])

  if (!showScroll) return null

  return (
    <div
      className="absolute -right-6 top-0 h-full z-10 pointer-events-none transition-opacity duration-200"
      style={{ visibility: ready ? 'visible' : 'hidden', opacity: ready ? 1 : 0 }}
    >
      <div className="fixed w-3 pointer-events-auto" style={{ top: fixedTop + 'px', height: trackHeightPx + 'px' }}>
        <div ref={trackRef} className="relative h-full w-full rounded-full bg-secondary dark:bg-primary touch-none select-none">
          <div
            ref={thumbRef}
            style={{ top: `${thumbTop}px`, height: `${thumbHeight}px` }}
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

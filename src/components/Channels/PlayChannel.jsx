import { useState, useEffect, useRef, useCallback } from 'react'
import das from '../../assets/das.gif'


// Variable de depuración global para el componente
const DEBUG_MODE = true; // Activado para depuración

const PlayChannel = () => {
  // Refs y estado principal
  const containerRef = useRef(null)
  const rafRef = useRef(0)
  const lastTsRef = useRef(0)
  const [state, setState] = useState('menu') // 'menu' | 'playing' | 'gameover'
  const [score, setScore] = useState(0)

  // Dimensiones relativas (usamos % para posicionar, el contenedor es 1:1)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  // Personaje (posiciones en % del contenedor)
  const [char, setChar] = useState({
    x: 12,        // % desde el borde izquierdo
    y: 28,        // % desde el suelo (pájaro inicia en el aire)
    vy: 0,        // velocidad vertical (unidades %/s)
    w: 28,        // ancho en % (doble de tamaño)
    h: 36,        // alto en % (doble de tamaño)
    ducking: false,
    onGround: false,
  })

  // Obstáculos
  const [obstacles, setObstacles] = useState([]) // {id, x, y, w, h, speed}
  const obstacleIdRef = useRef(0)
  const spawnTimerRef = useRef(0)

  // Configuración del juego
  const gravity = 180 // %/s^2 caída normal (aumentada para caída más rápida)
  const ascendAcc = 400 // %/s^2 aceleración al mantener E (muy sensible)
  const descendBoost = 400 // %/s^2 extra al mantener Q (muy sensible)
  const maxY = 110 // % altura máxima que puede alcanzar (doble de altura)
  const jumpVy = 120   // impulso de salto doble para click/tap rápido
  const baseSpeed = 30 // %/s velocidad base de obstáculos

  // Helpers
  const resetGame = useCallback(() => {
    // Resetear controles primero
    setControls({ jumpHeld: false, duckHeld: false })
    // Luego resetear el estado del juego
    setScore(0)
    setChar({
      x: 12,
      y: 18,        // Posición inicial
      vy: 0,
      w: 28,
      h: 36,
      ducking: false,
      onGround: false,
    })
    setObstacles([])
    spawnTimerRef.current = 0
    lastTsRef.current = null
  }, [])

  // Medir contenedor para layout responsivo
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDims({ w: width, h: height })
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Estado para los controles (usando useRef para evitar re-renders)
  const controlsRef = useRef({ jumpHeld: false, duckHeld: false })
  const [_, forceUpdate] = useState({}) // Solo para forzar re-render cuando sea necesario

  // Función para actualizar controles
  const setControls = useCallback((updater) => {
    const newState = typeof updater === 'function'
      ? updater(controlsRef.current)
      : updater
    controlsRef.current = { ...controlsRef.current, ...newState }
    forceUpdate({}) // Forzar re-render si es necesario
  }, [])

  // Entradas de teclado
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase()

      if (key === 'r') {
        if (state === 'gameover') {
          resetGame()
          setState('playing')
        }
        return
      }

      if (state === 'menu') {
        if (key === 'e') {
          resetGame();
          setState('playing')
        }
        return
      }

      if (state !== 'playing') return

      if (key === 'e' && state === 'playing') {
        setControls({ jumpHeld: true })
        setChar(c => ({
          ...c,
          vy: c.onGround ? jumpVy : c.vy,
          onGround: false
        }))
      } else if (key === 'q' && state === 'playing') {
        setControls({ duckHeld: true })
        setChar(c => ({
          ...c,
          ducking: c.onGround
        }))
      }
    }
    const onKeyUp = (e) => {
      const key = e.key.toLowerCase()
      if (state !== 'playing') return

      if (key === 'q') {
        setControls(prev => ({ ...prev, duckHeld: false }))
        setChar(c => ({ ...c, ducking: false }))
      } else if (key === 'e') {
        setControls(prev => ({ ...prev, jumpHeld: false }))
      }
    }

    window.addEventListener('keydown', onKeyDown, { passive: true })
    window.addEventListener('keyup', onKeyUp, { passive: true })

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [state])


  // Entradas touch (tap = saltar, swipe abajo = agachar)
  useEffect(() => {
    let touchStartY = 0
    let touchStartX = 0
    let swipedDown = false
    let duckTimeout = 0

    const onTouchStart = (e) => {
      if (!containerRef.current) return
      const t = e.changedTouches[0]
      touchStartY = t.clientY
      touchStartX = t.clientX
      swipedDown = false
      // mantener salto mientras está tocando (para replicar "hold")
      physicsInput.jumpHeldRef.current = true
    }
    const onTouchMove = (e) => {
      if (state !== 'playing') return
      const t = e.changedTouches[0]
      const dy = t.clientY - touchStartY
      if (dy > 30 && !swipedDown) {
        swipedDown = true
        physicsInput.duckHeldRef.current = true
        setChar(c => ({ ...c, ducking: true }))
        window.clearTimeout(duckTimeout)
        duckTimeout = window.setTimeout(() => {
          physicsInput.duckHeldRef.current = false
          setChar(c => ({ ...c, ducking: false }))
        }, 400)
      }
    }
    const onTouchEnd = (e) => {
      if (state === 'menu') {
        resetGame(); setState('playing'); return
      }
      if (state === 'gameover') {
        resetGame(); setState('playing'); return
      }
      if (state !== 'playing') return
      physicsInput.jumpHeldRef.current = false
    }
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      window.clearTimeout(duckTimeout)
    }
  }, [state])

  // Utilidades: rectángulos de colisión en coordenadas 0-100 (origen abajo-izquierda)
  const getCharRect = (c) => {
    // Altura visual real del sprite (aplica escala cuando está ducking)
    const scaleY = c.ducking ? 0.7 : 1
    const visualH = c.h * scaleY
    // Escala vertical de la caja de colisión (1 = altura completa, 0.5 = mitad)
    const scaleRectY = 0.5
    // Márgenes (ajusta si querés recortar lateralmente)
    const m = { l: 0, r: 0 }
    const left = c.x + c.w * m.l + 6
    const right = c.x + c.w * (1 - m.r) - 1
    const bottom = c.y + (visualH * scaleRectY) - 5
    const top = c.y + (visualH * scaleRectY) + 4
    return { left, right, bottom, top, width: right - left, height: top - bottom }
  }

  const getObstacleRect = (o) => {
    const m = { l: 0, r: 0, t: 0, b: 0 }
    const left = o.x + o.w * m.l
    const right = o.x + o.w * (1 - m.r)
    let bottom, top
    if (o.type === 'floor') {
      bottom = o.y + o.h * m.b
      top = o.y + o.h * (1 - m.t)
    } else {
      // ceiling: y es distancia desde el borde superior; convertimos a sistema bottom-up
      const bottomFromBottom = 100 - (o.y + o.h)
      bottom = bottomFromBottom + o.h * m.b
      top = bottomFromBottom + o.h * (1 - m.t)
    }
    return { left, right, bottom, top, width: right - left, height: top - bottom }
  }

  // Spawn de obstáculos (suelo y techo)
  const spawnObstacle = () => {
    const w = 10   // Ancho fijo para los obstáculos
    const h = 26   // Altura fija para los obstáculos
    const id = obstacleIdRef.current++

    // Decidir si crear obstáculo en el piso o en el techo (50/50 de probabilidad)
    if (Math.random() > 0.5) {
      // Obstáculo en el piso
      const y = 7   // 7% desde el borde inferior
      setObstacles(prev => [...prev, {
        id,
        x: 105,
        y,
        w,
        h,
        type: 'floor'
      }])
    } else {
      // Obstáculo en el techo
      const y = 7  // 30% desde el borde superior
      setObstacles(prev => [...prev, {
        id,
        x: 105,
        y,
        w,
        h,
        type: 'ceiling'
      }])
    }
  }

  // Bucle principal
  useEffect(() => {
    if (state === 'menu' || state === 'gameover') return
    let running = true

    const tick = (ts) => {
      if (!running) return
      if (!lastTsRef.current) lastTsRef.current = ts
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05) // s, cap dt
      lastTsRef.current = ts

      // Dificultad: aumentar velocidad con el tiempo
      const speed = baseSpeed + Math.min(score / 50, 30) // %/s

      // Físicas del personaje (vuelo)
      setChar(c => {
        let { y, vy, onGround } = c
        const { jumpHeld, duckHeld } = controlsRef.current

        // Si se mantiene E, forzar ascenso hasta maxY
        if (jumpHeld) {
          if (y < maxY) {
            // Acelerar hacia arriba rápidamente
            vy = Math.min(vy + ascendAcc * dt, maxY * 0.5)
          } else {
            // Mantener en altura máxima exacta
            return { ...c, y: maxY, vy: 0, onGround: false }
          }
        } else {
          // Gravedad normal si no se mantiene E
          vy -= gravity * dt
        }

        // Descenso acelerado si se mantiene Q
        if (duckHeld && y > 0) {
          vy = Math.max(vy - descendBoost * dt, -maxY * 0.8)
        }

        y += vy * dt
        const floorLevel = 0;  // Nivel del suelo al 7% del borde inferior
        const ceilingLevel = 71; // Techo al 10% del borde superior (100% - 10% = 90%)

        // Limitar movimiento vertical entre el piso y el techo
        if (y <= floorLevel) {
          y = floorLevel;
          vy = 0;
          onGround = true;
        } else if (y >= ceilingLevel) {
          y = ceilingLevel;
          vy = 0;
        } else {
          onGround = false;
        }

        // ducking visual solo cuando está en el suelo y duckHeld
        const ducking = onGround && duckHeld
        return { ...c, y, vy, onGround, ducking }
      })

      // Obstáculos: mover y limpiar
      setObstacles(prev => {
        let next = prev.map(o => ({ ...o, x: o.x - speed * dt }))
        next = next.filter(o => o.x + o.w > -5)
        return next
      })

      // Spawning
      spawnTimerRef.current += dt
      const interval = 1.2 - Math.min(score / 1000, 0.6) // más rápido con el score
      if (spawnTimerRef.current >= interval) {
        spawnTimerRef.current = 0
        spawnObstacle()
      }

      // Puntaje
      setScore(s => s + Math.floor(dt * 100))

      // Colisión AABB usando cajas completas de personaje y obstáculo
      const cRect = getCharRect(char)
      const collided = obstacles.some(o => {
        const oRect = getObstacleRect(o)
        const xOverlap = cRect.right > oRect.left && cRect.left < oRect.right
        const yOverlap = cRect.top > oRect.bottom && cRect.bottom < oRect.top
        return xOverlap && yOverlap
      })
      if (collided) {
        running = false
        setState('gameover')
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [state, score, obstacles, char])

  // Click/Mouse: usar click como salto o empezar
  const handleClick = () => {
    if (state === 'menu') { resetGame(); setState('playing'); return }
    if (state === 'gameover') { resetGame(); setState('playing'); return }
    if (state !== 'playing') return
      // Click: activar hold completo hasta soltar
      physicsInput.jumpHeldRef.current = true
      setChar(c => ({ ...c, vy: Math.max(c.vy, jumpVy), onGround: false }))
  }

  // Render
  // El contenedor es relativo y cuadrado; hijos posicionados en %
  return (
    <div className="w-full h-full">
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-900 select-none"
        onClick={handleClick}
      >
        {/* Línea del techo a 10% del borde superior */}
        <div
          className="absolute left-0 right-0 bg-blue-500/30"
          style={{
            top: '7%',
            height: '1px',
            zIndex: 5
          }}
        />

        {/* Línea del suelo a 7% del borde inferior */}
        <div
          className="absolute left-0 right-0 bg-white/30"
          style={{
            bottom: '7%',
            height: '1px',
            zIndex: 5
          }}
        />

        {/* Suelo visual ligero (opcional) */}
        <div className="absolute left-0 right-0" style={{ bottom: '0%', height: '2%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)' }} />

        {/* Personaje: usar el sprite existente dentro del div alt="character" */}
        <div
          alt="character"
          className="absolute"
          style={{
            left: `${char.x}%`,
            bottom: `${char.y}%`,
            width: `${char.w}%`,
            height: `${char.h * (char.ducking ? 0.7 : 1)}%`,
            // La altura la controla la imagen manteniendo aspecto; si ducking, reducimos escala Y
            transform: 'none',
            transformOrigin: 'bottom center',
            zIndex: 10
          }}
        >
          <img src={das} alt="Hornero" className="w-full h-full object-contain dark:invert-[1]" />

        </div>

        {/* Obstáculos */}
        {obstacles.map(o => {
          // Si es un obstáculo del techo
          if (o.type === 'ceiling') {
            const r = getObstacleRect(o)
            return (
              <div key={`${o.id}-container`}>
                <div
                  key={o.id}
                  className="absolute bg-[#1b1b1b] dark:bg-white/90"
                  style={{
                    left: `${r.left}%`,
                    bottom: `${r.bottom}%`,
                    width: `${r.width}%`,
                    height: `${r.height}%`,
                    border: '1px solid red',
                    opacity: 0.7
                  }}
                />
                {/* Debug: caja completa del obstáculo (techo) */}
                {DEBUG_MODE && (
                  <div
                    className="absolute border-2 border-yellow-400 bg-yellow-400/20 pointer-events-none"
                    style={{
                      left: `${r.left}%`,
                      bottom: `${r.bottom}%`,
                      width: `${r.width}%`,
                      height: `${r.height}%`,
                      zIndex: 12
                    }}
                  />
                )}
              </div>
            );
          }

          // Obstáculos del piso
          {
            const r = getObstacleRect(o)
            return (
            <div key={`${o.id}-container`}>
              <div
                key={o.id}
                className="absolute bg-[#1b1b1b] dark:bg-white/90"
                style={{
                  left: `${r.left}%`,
                  bottom: `${r.bottom}%`,
                  width: `${r.width}%`,
                  height: `${r.height}%`,
                  border: '1px solid red',
                  opacity: 0.7
                }}
              />
              {/* Debug: caja completa del obstáculo (piso) */}
              {DEBUG_MODE && (
                <div
                  className="absolute border-2 border-fuchsia-500 bg-fuchsia-500/20 pointer-events-none"
                  style={{
                    left: `${r.left}%`,
                    bottom: `${r.bottom}%`,
                    width: `${r.width}%`,
                    height: `${r.height}%`,
                    zIndex: 12
                  }}
                />
              )}
            </div>
          );}
        })}

        {/* Debug: Mostrar hitbox del personaje */}
        {DEBUG_MODE && (() => { const r = getCharRect(char); return (
          <div
            className="absolute border-2 border-green-500 bg-green-500/20 pointer-events-none"
            style={{
              left: `${r.left}%`,
              bottom: `${r.bottom}%`,
              width: `${r.width}%`,
              height: `${r.height}%`,
              zIndex: 12
            }}
          />) })()}

        {/* Score en playing */}
        {state === 'playing' && (
          <div className="absolute top-2 right-3 text-xs md:text-sm font-mono tracking-wider">
            {score}
          </div>
        )}

        {/* Overlays de estado */}
        {state !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/30">
            {state === 'menu' && (
              <>
                <div className="font-mono text-center">
                  <div className="text-lg">Flying Away</div>
                  <div className="text-xs opacity-80 mt-1">W/Click para empezar · S/Swipe abajo para agacharse</div>
                </div>
                <button
                  onClick={() => { resetGame(); setState('playing') }}
                  className="px-3 py-1 rounded border border-white/30 font-mono text-sm hover:bg-white/10"
                >
                  Start
                </button>
              </>
            )}

            {state === 'gameover' && (
              <div className="flex flex-col items-center gap-3">
                <div className="font-mono text-lg">Game Over</div>
                <div className="font-mono text-sm opacity-80">Score: {score}</div>
                <button
                  onClick={() => { resetGame(); setState('playing') }}
                  aria-label="Restart"
                  className="flex items-center gap-2 px-3 py-1 rounded border border-white/30 font-mono text-sm hover:bg-white/10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Restart (R)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayChannel

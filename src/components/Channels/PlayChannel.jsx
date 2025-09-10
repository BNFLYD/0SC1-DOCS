import { useState, useEffect, useRef, useCallback } from 'react'
import intro from '../../assets/introbg.png'
import scenebg from '../../assets/scenebg.png'
import scene from '../../assets/scene.png'
import zondaIcon from '../../assets/zonda.png'
import palitoIcon from '../../assets/palito.png'
import sauce from '../../assets/sauce.png'
import menu from '../../assets/menu.gif'
import zonda from '../../assets/zonda.gif'
import palito from '../../assets/palito.gif'
import vuelo from '../../assets/normal.gif'
import rasante from '../../assets/rasante.gif'
import planear from '../../assets/planeando.gif'
import choque from '../../assets/choque.gif'


// Variable de depuración global para el componente
const DEBUG_MODE = true; // Activado para depuración

const PlayChannel = ({ theme }) => {
  const isDark = theme === 'dark'
  // Refs y estado principal
  const containerRef = useRef(null)
  const rafRef = useRef(0)
  const lastTsRef = useRef(0)
  const [state, setState] = useState('menu') // 'menu' | 'playing' | 'gameover'
  const [score, setScore] = useState(0)
  const [zondaCount, setZondaCount] = useState(0)
  const zondaCountRef = useRef(0)
  const [stickCount, setStickCount] = useState(0)
  const [planActive, setPlanActive] = useState(false)
  const planActiveRef = useRef(false)
  const [planTimeLeft, setPlanTimeLeft] = useState(0)
  const planTimeLeftRef = useRef(0)
  const planCooldownUntilRef = useRef(0)
  const [collisionsOn, setCollisionsOn] = useState(true) // habilitar/deshabilitar colisiones
  const [showHitboxes, setShowHitboxes] = useState(false) // mostrar/ocultar cajas de colisión
  // Estado físico de W para evitar delay al soltar S
  const wPhysicalHeldRef = useRef(false)
  // Parallax scene layer (repeat-x) over scenebg
  const sceneLayerRef = useRef(null)
  const sceneOffsetRef = useRef(0) // px acumulados para backgroundPositionX
  // Escala horizontal y altura del layer 'scene'
  const SCENE_SCALE_X = 2.4 // 130% del ancho del contenedor
  const SCENE_HEIGHT = '25%'
  // Escalas de sprites in-field
  const ZONDA_SCALE = 2
  const STICK_SCALE = 2
  // Assets readiness (preload images to avoid late popping)
  const [assetsReady, setAssetsReady] = useState(false)

  // Game Over (Opción B): fases y gating
  const [gameOverPhase, setGameOverPhase] = useState('panel') // 'panel' | 'recap'
  const [recapStep, setRecapStep] = useState(0) // 0 nada, 1 distancia, 2 zondas, 3 palitos
  const [allowRestart, setAllowRestart] = useState(false)
  const allowRestartRef = useRef(false)
  useEffect(() => { allowRestartRef.current = allowRestart }, [allowRestart])
  const [finalScore, setFinalScore] = useState(0)
  const [finalZonda, setFinalZonda] = useState(0)
  const [finalSticks, setFinalSticks] = useState(0)
  const gameoverTimeoutsRef = useRef([])
  const [recapTotal, setRecapTotal] = useState(0)
  const recapAnimRafRef = useRef(0)
  const [recapAnimDone, setRecapAnimDone] = useState(false)
  // Menu: ASCII title and scaling
  const [asciiTitle, setAsciiTitle] = useState('')
  const menuAsciiRef = useRef(null)
  const menuWrapRef = useRef(null)
  const menuContainerRef = useRef(null)
  const [showRecordMsg, setShowRecordMsg] = useState(false)
  // High Score (sesión)
  const [highScore, setHighScore] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const recordEvaluatedRef = useRef(false)

  // Mostrar la escena solo fuera del menú y del recap de game over
  // (en menu, ocultamos todo lo que no pertenezca al propio menú)
  const showScene = (state === 'playing') || (state === 'gameover' && gameOverPhase === 'panel')

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
  const gapRef = useRef(0) // distancia recorrida desde el último spawn (en % del mundo)
  const lastObstacleTypeRef = useRef(null)
  // Elección pendiente para respetar gaps sin recalcular tipo cada frame
  const pendingTypeRef = useRef(null)
  const pendingRequiredGapRef = useRef(null)
  // Ancho del último obstáculo para convertir gap en edge-to-edge (left-to-left - prevWidth)
  const lastObstacleWidthRef = useRef(0)

  // Configuración del juego
  const gravity = 180 // %/s^2 caída normal (aumentada para caída más rápida)
  const ascendAcc = 600 // %/s^2 aceleración al mantener E (muy sensible)
  const descendBoost = 800 // %/s^2 extra al mantener Q (muy sensible)
  const maxY = 110 // % altura máxima que puede alcanzar
  const jumpVy = 120   // impulso de salto doble para click/tap rápido
  const baseSpeed = 30 // %/s velocidad base de obstáculos
  // Gaps fijos entre obstáculos (en unidades de % del mundo)
  // Si el siguiente obstáculo es del mismo tipo que el anterior, usar un gap mayor
  const gapSameType = 3
  const gapDiffType = 40

  // Helpers
  const resetGame = useCallback(() => {
    // Resetear controles primero
    setControls({ jumpHeld: false, duckHeld: false })
    // Luego resetear el estado del juego
    setScore(0)
    setZondaCount(0)
    setStickCount(0)
    setPlanActive(false)
    planActiveRef.current = false
    setPlanTimeLeft(0)
    planTimeLeftRef.current = 0
    planCooldownUntilRef.current = 0
    setChar({
      x: 12,
      y: 120,        // Posición inicial
      vy: 0,
      w: 28,
      h: 36,
      ducking: false,
      onGround: false,
      // Planear: estado y altura bloqueada
      planing: false,
      planY: null,
    })
    setObstacles([])
    spawnTimerRef.current = 0
    gapRef.current = 0
    pendingTypeRef.current = null
    pendingRequiredGapRef.current = null
    lastObstacleWidthRef.current = 0
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

  // Mantener refs sincronizados con estado que usamos en el loop
  useEffect(() => {
    zondaCountRef.current = zondaCount
  }, [zondaCount])

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
        if (state === 'gameover' && allowRestartRef.current) {
          resetGame()
          setState('playing')
        }
        return
      }

      if (state === 'menu') {
        if (key === 'w') {
          resetGame();
          setState('playing')
        }
        return
      }

      if (state !== 'playing') return

      if (key === 'w' && state === 'playing') {
        wPhysicalHeldRef.current = true
        // Si S está sostenida y no hay Zonda, ignorar W (prioridad de S)
        if (controlsRef.current.duckHeld && zondaCountRef.current === 0) {
          return
        }
        setControls({ jumpHeld: true })
        setChar(c => ({
          ...c,
          vy: c.onGround ? jumpVy : c.vy,
          onGround: false
        }))
      } else if (key === 'c') {
        // Toggle rápido de colisiones
        setCollisionsOn(v => !v)
      } else if (key === 'h') {
        // Toggle visual de hitboxes
        setShowHitboxes(v => !v)
      } else if (key === 's' && state === 'playing') {
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

      if (key === 's') {
        setControls(prev => ({ ...prev, duckHeld: false }))
        setChar(c => ({ ...c, ducking: false }))
        // Si W sigue físicamente presionada, habilitar jumpHeld de inmediato
        if (wPhysicalHeldRef.current) {
          setControls(prev => ({ ...prev, jumpHeld: true }))
          setChar(c => ({
            ...c,
            vy: c.onGround ? jumpVy : c.vy,
            onGround: false
          }))
        }
      } else if (key === 'w') {
        wPhysicalHeldRef.current = false
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

  // Generate ASCII title when entering menu (static literal, no figlet)
  useEffect(() => {
    if (state !== 'menu') return
    const ascii = `██████   █████  ██    ██ ██    ██ ███    ██ ██  █████
██   ██ ██   ██  ██  ██  ██    ██ ████   ██ ██ ██   ██
██████  ███████   ████   ██    ██ ██ ██  ██ ██ ███████
██      ██   ██    ██    ██    ██ ██  ██ ██ ██ ██   ██
██      ██   ██    ██     ██████  ██   ████ ██ ██   ██

                                                       `
    setAsciiTitle(ascii)
  }, [state])

  // Scale ASCII to fit container bounds preserving aspect ratio
  useEffect(() => {
    if (state !== 'menu') return

    const updateScale = () => {
      const pre = menuAsciiRef.current
      const box = menuContainerRef.current
      const wrap = menuWrapRef.current
      if (!pre || !box || !wrap) return

      const pw = pre.offsetWidth || 1
      const ph = pre.offsetHeight || 1
      const bw = box.clientWidth || 1
      const bh = box.clientHeight || 1
      const s = Math.min(bw / pw, bh / ph)
      wrap.style.transform = `translate(-50%, -50%) scale(${s})`
    }

    const ro = new ResizeObserver(updateScale)
    if (menuContainerRef.current) ro.observe(menuContainerRef.current)
    // after ascii updates
    setTimeout(updateScale, 0)

    window.addEventListener('resize', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      ro.disconnect()
    }
  }, [state, asciiTitle])

  // Cargar high score desde sessionStorage al montar
  useEffect(() => {
    const raw = sessionStorage.getItem('high_score')
    const val = raw != null ? Number(raw) : 0
    setHighScore(Number.isFinite(val) ? val : 0)
  }, [])

  // Preload critical assets once to reduce initial delay
  useEffect(() => {
    let cancelled = false
    const urls = [intro, scenebg, scene, vuelo, rasante, planear, choque]

    const preload = (url) => new Promise((resolve) => {
      const img = new Image()
      img.onload = img.onerror = () => resolve()
      img.src = url
    })

    Promise.race([
      Promise.all(urls.map(preload)),
      new Promise(res => setTimeout(res, 1500)), // fallback rápido
    ]).then(() => { if (!cancelled) setAssetsReady(true) })

    return () => { cancelled = true }
  }, [])

  // Animación incremental para R4: 0 -> score -> score+sticks -> score+sticks+zonda
  useEffect(() => {
    // Ejecutar únicamente en gameover recap cuando recapStep >= 4
    if (!(state === 'gameover' && gameOverPhase === 'recap' && recapStep >= 4)) return

    // Cancelar animación previa si existiera
    if (recapAnimRafRef.current) cancelAnimationFrame(recapAnimRafRef.current)
    setRecapAnimDone(false)

    // Evaluar record una sola vez al entrar a R4
    if (!recordEvaluatedRef.current) {
      const finalWeighted = finalScore + (finalSticks * 150) + (finalZonda * 25)
      const isNew = finalWeighted > highScore
      setIsNewRecord(isNew)
      if (isNew) {
        setHighScore(finalWeighted)
        sessionStorage.setItem('high_score', String(finalWeighted))
      }
      recordEvaluatedRef.current = true
    }

    const targets = [
      finalScore,
      finalScore + (finalSticks * 150),
      finalScore + (finalSticks * 150) + (finalZonda * 25),
    ]
    const durations = [300, 300, 300] // ms: total 900ms para calzar antes del botón

    let segIndex = 0
    let fromValue = 0
    let startTs = 0

    const animate = (ts) => {
      if (!startTs) startTs = ts
      const elapsed = ts - startTs
      const dur = durations[segIndex]
      const toValue = targets[segIndex]
      const t = Math.min(1, elapsed / dur)
      const value = Math.floor(fromValue + (toValue - fromValue) * t)
      setRecapTotal(value)
      if (t < 1) {
        recapAnimRafRef.current = requestAnimationFrame(animate)
      } else {
        // Segmento completo; avanzar si queda otro
        segIndex += 1
        if (segIndex < targets.length) {
          fromValue = toValue
          startTs = 0
          recapAnimRafRef.current = requestAnimationFrame(animate)
        } else {
          // Animación completa
          setRecapAnimDone(true)
        }
      }
    }

    recapAnimRafRef.current = requestAnimationFrame(animate)

    return () => {
      if (recapAnimRafRef.current) cancelAnimationFrame(recapAnimRafRef.current)
      recapAnimRafRef.current = 0
    }
  }, [state, gameOverPhase, recapStep, finalScore, finalSticks, finalZonda])


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
      // Si S (duck) está activa y no hay Zonda, ignorar W/jump
      if (physicsInput?.duckHeldRef?.current && zondaCountRef.current === 0) {
        return
      }
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
        if (allowRestartRef.current) { resetGame(); setState('playing'); }
        return
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
    } else if (o.type === 'empty') {
      // Obstáculo vacío: no colisiona, pero para debug mostramos su espacio ocupado
      const bottomFromBottom = 97 - (o.y + o.h)
      bottom = bottomFromBottom + o.h * m.b
      top = bottomFromBottom + o.h * (1 - m.t)
    } else if (o.type === 'middle') {
      // Árbol: el sprite arranca desde el suelo, pero la hitbox es solo la copa
      // Usamos trunkH (alto del tronco, sin colisión) y canopyH (alto de la copa, sí colisiona)
      const trunkH = o.trunkH ?? Math.max(0, o.h - (o.canopyH ?? 0))
      const canopyH = o.canopyH ?? Math.max(0, o.h - trunkH)
      bottom = o.y + trunkH + canopyH * m.b
      top = o.y + trunkH + canopyH * (1 - m.t)
    } else {
      // ceiling: y es distancia desde el borde superior; convertimos a sistema bottom-up
      const bottomFromBottom = 97 - (o.y + o.h)
      bottom = bottomFromBottom + o.h * m.b
      top = bottomFromBottom + o.h * (1 - m.t)
    }
    return { left, right, bottom, top, width: right - left, height: top - bottom }
  }

  // Spawn de obstáculos (suelo y techo)
  const spawnObstacle = (forcedType) => {
    // Tamaños diferenciados por tipo
    const wb = 10  // ancho piso
    const hb = 36  // alto piso
    const wt = 20  // ancho techo
    const ht = 20  // alto techo
    const wm = 25  // ancho árbol
    const trunkH = 14 // altura del tronco (no colisiona)
    const canopyH = 30 // altura de la copa (sí colisiona)
    const id = obstacleIdRef.current++

    // Decidir tipo respetando restricciones de secuencia y agregando 'empty'
    let type
    if (forcedType) {
      type = forcedType
    } else {
      const r = Math.random()
      if (lastObstacleTypeRef.current === 'middle') {
        // Tras un árbol, no permitir piso
        type = r < 0.5 ? 'ceiling' : (r < 0.75 ? 'middle' : 'empty')
      } else if (lastObstacleTypeRef.current === 'floor') {
        // Tras un piso, no permitir árbol (middle)
        type = r < 0.5 ? 'ceiling' : (r < 0.75 ? 'floor' : 'empty')
      } else {
        // Caso general: distribución pareja entre 4 tipos
        type = r < 0.25 ? 'floor' : (r < 0.5 ? 'ceiling' : (r < 0.75 ? 'middle' : 'empty'))
      }
    }

    let spawnedWidth = 0
    if (type === 'floor') {
      // Obstáculo en el piso
      const y = 7   // 7% desde el borde inferior
      setObstacles(prev => [...prev, {
        id,
        x: 105,
        y,
        w: wb,
        h: hb,
        type: 'floor'
      }])
      spawnedWidth = wb
    } else if (type === 'ceiling') {
      // Obstáculo en el techo
      const y = 7  // 30% desde el borde superior
      setObstacles(prev => [...prev, {
        id,
        x: 105,
        y,
        w: wt,
        h: ht,
        type: 'ceiling'
      }])
      spawnedWidth = wt
    } else if (type === 'middle') {
      // Obstáculo intermedio (árbol): visual desde el piso, hitbox solo en la copa
      const y = 7
      // Probabilidad 22% de generar Palito dentro del tronco
      const addStick = Math.random() < 0.22
      setObstacles(prev => [...prev, {
        id,
        x: 105,
        y,
        w: wm,
        h: trunkH + canopyH, // altura total del sprite
        trunkH,
        canopyH,
        type: 'middle',
        ...(addStick ? { stick: { w: 4, h: 10, collected: false } } : {})
      }])
      spawnedWidth = wm
    } else {
      // Obstáculo vacío: ocupa espacio pero no colisiona ni se renderiza, salvo en debug
      const y = 7
      // Probabilidad 33% de generar Zonda dentro del vacío
      const addZonda = Math.random() < 0.33
      setObstacles(prev => [...prev, {
        id,
        x: 105,
        y,
        w: wt,
        h: ht,
        type: 'empty',
        ...(addZonda ? { zonda: { w: 6, h: 6, collected: false } } : {})
      }])
      spawnedWidth = wt
    }
    lastObstacleTypeRef.current = type
    lastObstacleWidthRef.current = spawnedWidth
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

      // Dificultad: aumentar velocidad con el tiempo (curva suavizada raíz)
      let speed = baseSpeed + Math.min(0.6 * Math.sqrt(score), 24) // %/s
      // Boosts de velocidad con prioridad de S: si S está presionada y no hay Zonda, W queda anulada
      {
        const j = controlsRef.current.jumpHeld
        const d = controlsRef.current.duckHeld
        const hasZ = zondaCountRef.current > 0
        const effectiveJumpBoost = j && !(d && !hasZ)

        if (j && d && planActiveRef.current) {
          // Solo S (o W anulada por S sin Zonda)
          speed *= 3
        } else if (!effectiveJumpBoost && d) {
          // W+S
          speed *= 1.5
        }
      }

      // Parallax para 'scene' (solo jugando): loop continuo con dos fondos (cada uno SCENE_SCALE_X * 100% ancho)
      if (state === 'playing' && sceneLayerRef.current && containerRef.current) {
        const k = 0.5 // factor de parallax (0..1)
        const cw = containerRef.current.clientWidth || 0
        const bandW = cw * SCENE_SCALE_X
        const dx = (speed * k) * (cw / 200) * dt // px
        sceneOffsetRef.current -= dx
        if (sceneOffsetRef.current <= -bandW) sceneOffsetRef.current += bandW
        const yPos = 'calc(100% - 9%)'
        const x1 = Math.floor(sceneOffsetRef.current) - 1
        const x2 = x1 + bandW
        // Dos posiciones para dos imágenes de fondo
        sceneLayerRef.current.style.backgroundPosition = `${x1}px ${yPos}, ${x2}px ${yPos}`
      }

      // Actualizar cuenta regresiva del plan si está activo (UI a 10 Hz)
      if (planActiveRef.current) {
        const prev = planTimeLeftRef.current
        const next = prev - dt
        planTimeLeftRef.current = next
        // Si se agotó (o por debajo de 0 por flotantes), finalizar y cooldown
        if (next <= 0) {
          planTimeLeftRef.current = 0
          setPlanTimeLeft(0)
          setPlanActive(false)
          planActiveRef.current = false
          planCooldownUntilRef.current = ts + 1000 // 1s cooldown
        } else {
          // Actualizar la UI solo cuando cambia la décima para reducir renders
          const prevDec = Math.floor(planTimeLeft * 10)
          const nextDec = Math.floor(next * 10)
          if (nextDec !== prevDec) setPlanTimeLeft(next)
        }
      }


      // Activar plan (dash) y consumir Zonda ANTES de físicas, usando refs (evita stale state)
      const bothHeldNow = controlsRef.current.jumpHeld && controlsRef.current.duckHeld
      const canActivatePlanNow = bothHeldNow && !planActiveRef.current && (zondaCountRef.current > 0) && ts >= (planCooldownUntilRef.current || 0)
      if (canActivatePlanNow) {
        setPlanActive(true)
        planActiveRef.current = true
        setPlanTimeLeft(5)
        planTimeLeftRef.current = 5
        setZondaCount(v => Math.max(0, v - 1))
        zondaCountRef.current = Math.max(0, zondaCountRef.current - 1)
      }

      // Físicas del personaje (vuelo) con prioridad de S sobre W cuando no hay Zonda
      setChar(c => {
        let { y, vy, onGround, planing, planY } = c
        const { jumpHeld, duckHeld } = controlsRef.current
        const hasZonda = zondaCountRef.current > 0
        const bothHeld = jumpHeld && duckHeld
        // S tiene prioridad: si S está presionada y no hay Zonda, W se ignora
        const effectiveJump = jumpHeld && !(duckHeld && !hasZonda)
        // Plan activo mientras W+S y planActive esté encendido (no depende del contador tras activarse)
        const canPlanNow = bothHeld && planActiveRef.current

        if (canPlanNow) {
          // Entrar y mantener modo planear: congelar altura y velocidad
          if (!planing) {
            planing = true
            planY = y
          }
          y = planY ?? y
          vy = 0
        } else {
          // Salir de planear si estaba activo
          if (planing) {
            planing = false
            planY = null
          }

          // Si se mantiene W efectiva, forzar ascenso (hasta maxY)
          if (effectiveJump) {
            if (y < maxY) {
              vy = Math.min(vy + ascendAcc * dt, maxY * 0.6)
            } else {
              return { ...c, y: maxY, vy: 0, onGround: false, planing, planY }
            }
          } else {
            // Gravedad normal
            vy -= gravity * dt
          }

          // Descenso acelerado si se mantiene S
          if (duckHeld && y > 0) {
            vy = Math.max(vy - descendBoost * dt, -maxY * 0.9)
          }

          y += vy * dt
        }

        const floorLevel = 2;  // Nivel del suelo al 7% del borde inferior
        const ceilingLevel = 71; // Techo al 10% del borde superior (100% - 10% = 90%)

        // Limitar movimiento vertical entre el piso y el techo
        if (y <= floorLevel) {
          y = floorLevel;
          vy = 0;
          onGround = true;
        } else if (y >= ceilingLevel) {
          y = ceilingLevel;
          vy = 0;
          onGround = false;
        } else {
          onGround = false;
        }

        // ducking visual solo cuando está en el suelo y duckHeld
        const ducking = onGround && duckHeld
        return { ...c, y, vy, onGround, ducking, planing, planY }
      })

      // Obstáculos: mover y limpiar
      setObstacles(prev => {
        let next = prev.map(o => ({ ...o, x: o.x - speed * dt }))
        next = next.filter(o => o.x + o.w > -5)
        return next
      })

      // Spawning por distancia fija (no por tiempo)
      // Acumular distancia recorrida desde el último spawn
      gapRef.current += speed * dt
      // Si no hay tipo pendiente, elegir UNO y fijar el gap requerido
      if (pendingTypeRef.current === null) {
        let candidateType
        const r = Math.random()
        if (lastObstacleTypeRef.current === 'middle') {
          candidateType = r < 0.5 ? 'ceiling' : (r < 0.75 ? 'middle' : 'empty')
        } else if (lastObstacleTypeRef.current === 'floor') {
          candidateType = r < 0.5 ? 'ceiling' : (r < 0.75 ? 'floor' : 'empty')
        } else {
          candidateType = r < 0.25 ? 'floor' : (r < 0.5 ? 'ceiling' : (r < 0.75 ? 'middle' : 'empty'))
        }
        pendingTypeRef.current = candidateType
        const desiredEdgeGap = (candidateType === lastObstacleTypeRef.current) ? gapSameType : gapDiffType
        // convertir a left-to-left sumando el ancho del obstáculo anterior
        pendingRequiredGapRef.current = desiredEdgeGap + (lastObstacleWidthRef.current || 0)
      }
      // Si ya se acumuló el gap requerido, spawnear el tipo pendiente
      if (pendingTypeRef.current !== null && pendingRequiredGapRef.current !== null) {
        if (gapRef.current >= pendingRequiredGapRef.current) {
          spawnObstacle(pendingTypeRef.current)
          gapRef.current = 0
          pendingTypeRef.current = null
          pendingRequiredGapRef.current = null
        }
      }

      // Puntaje
      setScore((s => s + Math.floor(dt * 100)))

      // Colisión AABB usando cajas completas de personaje y obstáculo
      const cRect = getCharRect(char)
      const collided = collisionsOn && obstacles.some(o => {
        if (o.type === 'empty') return false // no colisiona
        const oRect = getObstacleRect(o)
        const xOverlap = cRect.right > oRect.left && cRect.left < oRect.right
        const yOverlap = cRect.top > oRect.bottom && cRect.bottom < oRect.top
        return xOverlap && yOverlap
      })

      // Recolección de Zonda dentro de obstáculos vacíos (calcular hits primero)
      const zondaHitIds = []
      for (const o of obstacles) {
        if (o.type !== 'empty' || !o.zonda || o.zonda.collected) continue
        const r = getObstacleRect(o)
        const zW = o.zonda.w
        const zH = o.zonda.h
        const zLeft = r.left + (r.width - zW) / 2
        const zBottom = r.bottom + (r.height - zH) / 2
        const zRect = { left: zLeft, right: zLeft + zW, bottom: zBottom, top: zBottom + zH }
        const xOverlap = cRect.right > zRect.left && cRect.left < zRect.right
        const yOverlap = cRect.top > zRect.bottom && cRect.bottom < zRect.top
        if (xOverlap && yOverlap) zondaHitIds.push(o.id)
      }
      if (zondaHitIds.length > 0) {
        setObstacles(prev => prev.map(o => (
          zondaHitIds.includes(o.id)
            ? { ...o, zonda: { ...o.zonda, collected: true } }
            : o
        )))
        setScore(s => s + 0 * zondaHitIds.length)
        setZondaCount(c => c + zondaHitIds.length)
      }

      // Recolección de Palito en troncos de obstáculos 'middle'
      const stickHitIds = []
      for (const o of obstacles) {
        if (o.type !== 'middle' || !o.stick || o.stick.collected) continue
        const r = getObstacleRect(o) // probablemente devuelve la copa
        // Altura real del tronco en % del contenedor, proporcional al rect de canopy
        const trunkHeightActual = r.height * (o.trunkH / o.h)
        // Si r representa la copa, su bottom coincide con el top del tronco
        const trunkTop = r.bottom
        const trunkBottom = trunkTop - trunkHeightActual
        const sW = o.stick.w
        const sH = o.stick.h
        const sLeft = r.left + (r.width - sW) / 2
        const sBottom = trunkBottom + Math.max(0, (trunkHeightActual - sH)) / 2
        const sRect = { left: sLeft, right: sLeft + sW, bottom: sBottom, top: sBottom + sH }
        const xOverlap = cRect.right > sRect.left && cRect.left < sRect.right
        const yOverlap = cRect.top > sRect.bottom && cRect.bottom < sRect.top
        if (xOverlap && yOverlap) stickHitIds.push(o.id)
      }
      if (stickHitIds.length > 0) {
        setObstacles(prev => prev.map(o => (
          stickHitIds.includes(o.id)
            ? { ...o, stick: { ...o.stick, collected: true } }
            : o
        )))
        setStickCount(c => c + stickHitIds.length)
      }
      if (collided) {
        running = false
        setState('gameover')
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [state, score, obstacles, char, collisionsOn, planActive, planTimeLeft, zondaCount])

  // Fases de Game Over (panel -> recap) y limpieza de timeouts
  useEffect(() => {
    // Limpiar cualquier timeout previo
    gameoverTimeoutsRef.current.forEach(id => clearTimeout(id))
    gameoverTimeoutsRef.current = []

    if (state !== 'gameover') {
      // Reset UI cuando salimos de gameover
      setAllowRestart(false)
      setRecapStep(0)
      setGameOverPhase('panel')
      setRecapTotal(0)
      setIsNewRecord(false)
      recordEvaluatedRef.current = false
      setRecapAnimDone(false)
      setShowRecordMsg(false)
      return
    }

    // Snapshot de métricas finales
    setFinalScore(score)
    setFinalZonda(zondaCount)
    setFinalSticks(stickCount)
    setAllowRestart(false)
    setRecapStep(0)
    setGameOverPhase('panel')
    setRecapTotal(0)
    setIsNewRecord(false)
    recordEvaluatedRef.current = false
    setRecapAnimDone(false)
    setShowRecordMsg(false)

    // Secuencia de fases (sin blank)
    const base = 1500 // 1.5s panel
    const t1 = setTimeout(() => setGameOverPhase('recap'), base)
    const r1 = setTimeout(() => setRecapStep(1), base + 300)     // +0.3s distancia
    const r2 = setTimeout(() => setRecapStep(2), base + 900)     // +0.9s zondas
    const r3 = setTimeout(() => {                                // +1.5s palitos
      setRecapStep(3)
    }, base + 1500)
    const r4 = setTimeout(() => {                                // +0.6s: mostrar PUNTUACION total
      setRecapStep(4)
    }, base + 1500 + 600)
    const r5 = setTimeout(() => {                                // fin animación R4 (~+900ms)
      setShowRecordMsg(true)
    }, base + 1500 + 600 + 900)
    const r6 = setTimeout(() => {                                // luego del mensaje, aparece botón
      setAllowRestart(true)
    }, base + 1500 + 600 + 900 + 300)

    gameoverTimeoutsRef.current = [t1, r1, r2, r3, r4, r5, r6]

    return () => {
      gameoverTimeoutsRef.current.forEach(id => clearTimeout(id))
      gameoverTimeoutsRef.current = []
    }
  }, [state])

  // Click/Mouse: usar click como salto o empezar
  const handleClick = () => {
    if (state === 'menu') { resetGame(); setState('playing'); return }
    if (state === 'gameover') { if (allowRestartRef.current) { resetGame(); setState('playing') }; return }
    if (state !== 'playing') return
      // Click: activar hold completo hasta soltar
      // Si S está sostenida y no hay Zonda, ignorar W/jump
      if (controlsRef.current.duckHeld && zondaCountRef.current === 0) {
        return
      }
      physicsInput.jumpHeldRef.current = true
      setChar(c => ({ ...c, vy: Math.max(c.vy, jumpVy), onGround: false }))
  }

  // Render
  // El contenedor es relativo y cuadrado; hijos posicionados en %
  return (
    <div className="w-full h-full font-arcade">
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none"
        onClick={handleClick}
      >
        {/* Background image layer for PLAY (beneath scene) */}
        {state === 'playing' && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url(${scenebg})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center calc(100% - 14%)',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
        {/* Scene layer over scenebg (under gameplay), seamless with two backgrounds */}
        {state === 'playing' && (
          <div
            ref={sceneLayerRef}
            className="absolute inset-0 z-[3] pointer-events-none"
            style={{
              backgroundImage: `url(${scene}), url(${scene})`,
              backgroundRepeat: 'no-repeat, no-repeat',
              backgroundSize: `${SCENE_SCALE_X * 100}% ${SCENE_HEIGHT}, ${SCENE_SCALE_X * 100}% ${SCENE_HEIGHT}`,
              backgroundPosition: '0 calc(100% - 9%), 100% calc(100% - 9%)',
              imageRendering: 'pixelated'
            }}
          />
        )}
        {showScene && (<>
        {/* Línea del techo a 10% del borde superior */}
        <div
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

        {/* Personaje */}
        <div
          alt="character"
          className="absolute z-50"
          style={{
            left: `${char.x}%`,
            bottom: `${char.y}%`,
            width: `${char.w}%`,
            height: `${char.h * (char.ducking ? 0.7 : 1)}%`,
            transform: 'none',
            transformOrigin: 'bottom center',
            zIndex: 60
          }}
        >
          <img
            src={state === 'gameover' ? choque : (char.planing ? planear : (controlsRef.current.duckHeld ? rasante : vuelo))}
            alt="Hornero"
            className="w-full h-full object-contain"
            decoding="async"
            loading="eager"
            fetchPriority="high"
            style={{
              filter: 'invert(0.18) brightness(1.8) contrast(0.88) saturate(0.95)'
            }}
          />

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
                    opacity: 0.7,
                    zIndex: 6
                  }}
                />
                {/* Debug: caja completa del obstáculo (techo) */}
                {showHitboxes && DEBUG_MODE && (
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
          if (o.type === 'floor') {
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
                  opacity: 0.7,
                  zIndex: 6
                }}
              />
              {/* Debug: caja completa del obstáculo (piso) */}
              {showHitboxes && DEBUG_MODE && (
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
          );
          }

          // Obstáculo intermedio (árbol): renderizar con asset `sauce` cubriendo tronco + copa
          if (o.type === 'middle') {
            const r = getObstacleRect(o)
            return (
              <div key={`${o.id}-container`}>
                {/* Árbol completo con asset */}
                <img
                  src={sauce}
                  alt="Árbol"
                  className="absolute select-none pointer-events-none object-contain"
                  style={{
                    left: `${r.left}%`,
                    bottom: `${r.bottom - o.trunkH}%`,
                    width: `${r.width}%`,
                    height: `${r.height + o.trunkH}%`,
                    zIndex: 6,
                    filter: isDark ? 'invert(0)' : 'invert(1)'
                  }}
                />
                {/* Debug: mostrar hitbox de la copa */}
                {showHitboxes && DEBUG_MODE && (
                  <div
                    className="absolute border-2 border-emerald-400 bg-emerald-400/20 pointer-events-none"
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
            )
          }

          // Obstáculo vacío: invisible en juego; en debug muestra borde azul sin colisión
          if (o.type === 'empty') {
            const r = getObstacleRect(o)
            return (
              <div key={`${o.id}-container`}>
                {showHitboxes && (
                  <div
                    className="absolute border-2 border-blue-400 bg-transparent pointer-events-none"
                    style={{
                      left: `${r.left}%`,
                      bottom: `${r.bottom}%`,
                      width: `${r.width}%`,
                      height: `${r.height}%`,
                      zIndex: 12
                    }}
                  />
                )}
                {o.zonda && !o.zonda.collected && (
                  <img
                    src={zonda}
                    alt="Zonda"
                    className="absolute select-none pointer-events-none object-contain"
                    style={{
                      left: `${r.left + (r.width - (o.zonda.w * ZONDA_SCALE)) / 2}%`,
                      bottom: `${r.bottom + (r.height - (o.zonda.h * ZONDA_SCALE)) / 2}%`,
                      width: `${o.zonda.w * ZONDA_SCALE}%`,
                      height: `${o.zonda.h * ZONDA_SCALE}%`,
                      zIndex: 9,
                      filter: isDark ? 'invert(0)' : 'invert(1)'
                    }}
                    title="Zonda"
                  />
                )}
              </div>
            )
          }
        })}

        {/* Debug: Mostrar hitbox del personaje */}
        {showHitboxes && DEBUG_MODE && (() => { const r = getCharRect(char); return (
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

        {/* Render palitos (stick) visibles en troncos de árboles middle */}
        {obstacles.map(o => {
          if (o.type !== 'middle' || !o.stick || o.stick.collected) return null
          const r = getObstacleRect(o) // canopy
          const trunkHeightActual = r.height * (o.trunkH / o.h)
          const trunkTop = r.bottom
          const trunkBottom = trunkTop - trunkHeightActual
          const sW = o.stick.w
          const sH = o.stick.h
          const sLeft = r.left + (r.width - sW) / 2 - (sW * (STICK_SCALE - 1)) / 2
          const sBottom = trunkBottom + Math.max(0, (trunkHeightActual - sH)) / 2 - (sH * (STICK_SCALE - 1)) / 2
          return (
            <div
              key={`stick-${o.id}`}
              className="absolute z-20 flex items-center justify-center select-none pointer-events-none"
              style={{ left: `${sLeft}%`, bottom: `${sBottom}%`, width: `${sW * STICK_SCALE}%`, height: `${sH * STICK_SCALE}%` }}
              title="Palito"
            >
              <img
              src={palito}
              alt="Palito"
              className="w-full h-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
              style={{filter: isDark ? 'invert(0)' : 'invert(1)'}}
              />
            </div>
          )
        })}

        {/* Score en playing */}
        {state === 'playing' && (
          <>
            <div className="absolute top-2 right-3 text-md md:text-lg font-arcade tracking-wider">
              {score}
            </div>
            <div className="absolute top-2 left-3 text-md md:text-lg font-arcade tracking-wider select-none flex items-center gap-4">
              <span className="inline-flex items-center">
                <img
                src={palitoIcon}
                alt="Palitos"
                className="w-5 h-5 md:w-6 md:h-6 object-contain"
                style={{filter: isDark ? 'invert(1)' : 'invert(0)'}}
                />
                <span className="mx-1">×</span>
                {stickCount}
              </span>
              {/* Zonda y temporizador */}
              <span className="inline-flex items-center">
                <img
                src={zondaIcon}
                alt="Zonda"
                className="w-5 h-5 md:w-6 md:h-6 object-contain"
                style={{filter: isDark ? 'invert(0)' : 'invert(1)'}}   />
                <span className="mx-1">×</span>
                {zondaCount}
                {planActive && (
                  <span className="ml-2 opacity-80">{Math.max(0, Math.ceil(planTimeLeftRef.current || 0))}s</span>
                )}
              </span>
            </div>
          </>
        )}

        </>)}

        {/* Overlays de estado */}
        {/* Inicio */}
        {state === 'menu' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 filter [--introFilter:none] dark:[--introFilter:invert(0.88)]"
            style={{
              backgroundImage: `url(${intro})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center calc(100% - 15%)',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div
              ref={menuContainerRef}
              className="relative"
              style={{ width: '85%', height: '28%' }}
            >
              <div
                ref={menuWrapRef}
                className="absolute left-1/2 top-0"
                style={{ transform: 'translate(-50%, -50%) scale(1)', transformOrigin: 'center center' }}
              >
                <pre
                  ref={menuAsciiRef}
                  className="whitespace-pre leading-none font-mono select-none"
                  style={{ fontSize: '12px', lineHeight: '12px', margin: 0 }}
                >
                  {asciiTitle}
                </pre>
              </div>
            </div>
            {/* Sprite del menú: esquina inferior derecha */}
            <img
              src={menu}
              alt="menu"
              className="absolute pointer-events-none"
              style={{
                bottom: '10%',
                left: '-4%',
                width: '40%',
                height: '22%',
                imageRendering: 'pixelated',
                zIndex: 2,
                filter: 'invert(0.18) brightness(1.8) contrast(0.88) saturate(0.95)'
              }}
            />
            {/* helper text and start button */}
            <div className="text-xs opacity-80 mt-1">W/Click para empezar · S/Swipe abajo para agacharse</div>
            <button
              onClick={() => { if (assetsReady) { resetGame(); setState('playing') } }}
              disabled={!assetsReady}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded border border-void/30 dark:border-secondary text-xl hover:bg-primary hover:text-secondary dark:hover:bg-cloud dark:hover:text-void ${!assetsReady ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {assetsReady ? 'Empezar' : 'Cargando…'}
            </button>
          </div>
        )}

  {/* GAMEOVER */}
        {state === 'gameover' && (
          <>
            {/* Fase PANEL */}
            {gameOverPhase === 'panel' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="mx-auto w-full max-w-[min(900px,95%)] px-8 py-3 rounded-xl backdrop-blur-sm bg-cloud/80 dark:bg-void/80">
                  <div className="font-arcade text-center text-primary dark:text-secondary ">
                    <div className="text-3xl">Game Over</div>
                  </div>
                </div>
              </div>
            )}

            {/* Fase RECAP: solo recap visible */}
            {gameOverPhase === 'recap' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-arcade text-center">
                  <div className="text-lg md:text-2xl mb-2" style={{ visibility: recapStep >= 1 ? 'visible' : 'hidden' }}>
                    Distancia x {finalScore}
                  </div>
                  <div className="text-lg md:text-2xl mb-2" style={{ visibility: recapStep >= 2 ? 'visible' : 'hidden' }}>
                    Cargas de Zonda x {finalZonda}
                  </div>
                  <div className="text-lg md:text-2xl mb-2" style={{ visibility: recapStep >= 3 ? 'visible' : 'hidden' }}>
                    Palitos x {finalSticks}
                  </div>
                  <div className="text-lg md:text-2xl mb-3" style={{ visibility: recapStep >= 4 ? 'visible' : 'hidden' }}>
                    Puntuacion Final {recapTotal}
                  </div>
                  {recapStep >= 4 && recapAnimDone && (
                    <div className="text-lg md:text-2xl mb-3 font-semibold">
                      {isNewRecord ? 'Nuevo Record!' : (
                        <>
                          Record {highScore}
                        </>
                      )}
                    </div>
                  )}
                  {allowRestart && (
                    <button
                      onClick={() => { if (allowRestartRef.current) { resetGame(); setState('playing') } }}
                      aria-label="Restart"
                      className="inline-flex items-center gap-2 px-3 py-1 rounded border border-void/30 dark:border-secondary text-xl hover:bg-primary hover:text-secondary dark:hover:bg-cloud dark:hover:text-void"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Reiniciar [R]
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PlayChannel

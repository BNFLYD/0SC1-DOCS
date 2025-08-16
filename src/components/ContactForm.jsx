import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import emailjs from '@emailjs/browser'

export default function ContactForm({ isDark, onCardOpenChange }) {
  const { loginWithRedirect, loginWithPopup, getIdTokenClaims, getAccessTokenSilently, logout } = useAuth()

  const [formData, setFormData] = useState({ name: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)
  const [lastSentEmail, setLastSentEmail] = useState(null)

  // Auth card UI
  const [showAuthCard, setShowAuthCard] = useState(false)
  const [authCardStatus, setAuthCardStatus] = useState('idle') // 'idle' | 'authenticating' | 'error'
  const [authError, setAuthError] = useState('')
  const authInFlight = useRef(false)
  const lastSubmitTs = useRef(0)
  const instanceId = useRef(Math.random().toString(36).slice(2, 8))

  // Envío de acuse al usuario con credenciales de cliente (no afecta el envío principal)
  const sendClientReceipt = async ({ toEmail, toName }) => {
    if (!toEmail) return
    const svc = import.meta.env.VITE_CLIENT_EMAILJS_SERVICE_ID
    const tpl = import.meta.env.VITE_CLIENT_EMAILJS_TEMPLATE_ID
    const pub = import.meta.env.VITE_CLIENT_EMAILJS_PUBLIC_KEY || import.meta.env.VITE_CLIENT_EMAILJS__PUBLIC_KEY
    if (!svc || !tpl || !pub) return
    const params = {
      // El template espera: Subject: {{subject}}, To Email: {{email}}, Content: {{message}}
      email: toEmail,
      subject: 'Recibimos tu mensaje',
      message: `Hola ${toName || 'amig@'}, ¡gracias por escribir! Ya recibimos tu mensaje y lo responderemos a la brevedad. Se notificó a Flavio Morales.`,
    }
    try {
      await emailjs.send(svc, tpl, params, pub)
    } catch (e) {
      // No interrumpir el flujo principal
      try { console.warn('[EmailJS][ClientReceipt] fallo de envío:', e?.message || e) } catch {}
    }
  }


  useEffect(() => {
    const currentInstanceId = instanceId.current
    // Restaurar borrador si existe (por flujo de redirección)
    try {
      const draft = sessionStorage.getItem('contact:draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed && typeof parsed === 'object') {
          setFormData({ name: parsed.name || '', message: parsed.message || '' })
        }
      }
    } catch (e) {

    }

    // Verificar si venimos de una redirección de Auth0
    const checkRedirectAndSubmit = async () => {
      try {
        // Disparar autosubmit si hay flag de pendiente, sin requerir chequear recencia del token
        let isPending = false
        try { isPending = sessionStorage.getItem('contact:pending') === '1' } catch {}

        if (isPending) {
          // Pequeño delay para que el DOM y estado del padre terminen de montar
          setShowAuthCard(true)
          setAuthCardStatus('authenticating')
          setTimeout(() => {
            const form = document.getElementById('contactForm')
            if (form) {
              form.requestSubmit()
            } else {
            }
          }, 150)
          return
        }

        // Mantener comportamiento anterior como fallback (por si el flag no está, pero venimos autenticados)
        try {
          const claims = await getIdTokenClaims()
          if (!claims) return
          const isRecentAuth = Date.now() / 1000 - claims.auth_time < 10
          if (isRecentAuth) {
            setTimeout(() => {
              const form = document.getElementById('contactForm')
              if (form) {
                setShowAuthCard(false)
                setAuthCardStatus('idle')
                form.requestSubmit()
              }
            }, 100)
          }
        } catch {}
      } catch (e) {

      }
    }

    checkRedirectAndSubmit()

    return () => {

    }
  }, [getIdTokenClaims])

  useEffect(() => {
    if (typeof onCardOpenChange === 'function') onCardOpenChange(showAuthCard)
  }, [showAuthCard, onCardOpenChange])

  useEffect(() => {
  }, [lastSentEmail])

  const resetAuthState = async () => {
    authInFlight.current = false
    setShowAuthCard(false)
    setAuthCardStatus('idle')
    setAuthError('')
    try {
      await logout({
        openUrl: false,
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID
      })
    } catch (e) {

    }
  }

  return (
    <div className="space-y-4 font-mono">
      <form
        id="contactForm"
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()

          // Limpiar mensajes de envío previos al presionar el botón
          setSendStatus(null)
          setLastSentEmail(null)

          setAuthError('')
          try {
            const now = Date.now()
            if (now - lastSubmitTs.current < 800) {
              return
            }
            lastSubmitTs.current = now
            if (authInFlight.current) {
              return
            }
            // Detectar si venimos de redirección (auto-envío sin popup)
            let isRedirectPending = false
            try {
              isRedirectPending = sessionStorage.getItem('contact:pending') === '1'
            } catch {}

            if (isRedirectPending) {
              authInFlight.current = true

              // Obtener email con pequeño retry/backoff: el SDK puede seguir resolviendo el callback
              const getFreshEmailWithRetry = async () => {
                const maxAttempts = 8
                const delay = (ms) => new Promise(r => setTimeout(r, ms))
                for (let i = 0; i < maxAttempts; i++) {
                  // 1) claims
                  try {
                    const claims = await getIdTokenClaims({ timeoutInSeconds: 5 })
                    const email = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null
                    if (email) return email
                  } catch {}
                  // 2) userinfo con token silencioso
                  try {
                    const token = await getAccessTokenSilently()
                    if (token) {
                      const domain = import.meta.env.VITE_AUTH0_DOMAIN
                      const resp = await fetch(`https://${domain}/userinfo`, { headers: { Authorization: `Bearer ${token}` } })
                      const profile = await resp.json()
                      const email = profile?.email || null
                      if (email) return email
                    }
                  } catch {}
                  await delay(200 + i * 150)
                }
                return null
              }

              const freshEmail = await getFreshEmailWithRetry()
              if (!freshEmail) {
                setAuthError('No se pudo obtener el email autenticado tras la redirección. Intenta de nuevo.')
                setAuthCardStatus('error')
                authInFlight.current = false
                return
              }

              // Enviar email con el borrador restaurado
              const emailData = { ...formData, email: freshEmail }
              setSending(true)
              try {
                await emailjs.send(
                  import.meta.env.VITE_EMAILJS_SERVICE_ID,
                  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                  emailData,
                  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                )
                // Enviar acuse al usuario (no bloqueante para UX)
                sendClientReceipt({ toEmail: freshEmail, toName: formData.name })
                setSendStatus('success')
                setFormData({ name: '', message: '' })
                setLastSentEmail(freshEmail)
                // Limpiar borrador/flag de redirección
                try {
                  sessionStorage.removeItem('contact:pending')
                  sessionStorage.removeItem('contact:draft')
                } catch {}
              } catch (sendErr) {
                setSendStatus('error')
              } finally {
                setSending(false)
                setAuthCardStatus('idle')
                setShowAuthCard(false)
                authInFlight.current = false
              }
              return
            }

            authInFlight.current = true

            // Limpiar cualquier sesión existente de Auth0
            await logout({
              openUrl: false,
              clientId: import.meta.env.VITE_AUTH0_CLIENT_ID
            })

            // Iniciar el popup de inmediato para que el navegador lo considere gesto de usuario
            setShowAuthCard(true)
            setAuthCardStatus('authenticating')

            await loginWithPopup({
              authorizationParams: {
                prompt: 'login',
                max_age: 0  // Forzar nueva autenticación
              }
            })

            // 2) Obtener email del token fresco
            let freshEmail = null
            try {
              // Forzar obtención de un token fresco
              const claims = await getIdTokenClaims({ timeoutInSeconds: 10 })
              freshEmail = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null

              if (!freshEmail) {
                throw new Error('No se encontró email en el token')
              }
            } catch (e) {

            }
            if (!freshEmail) {
              try {
                const token = await getAccessTokenSilently()
                const domain = import.meta.env.VITE_AUTH0_DOMAIN
                const resp = await fetch(`https://${domain}/userinfo`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                const profile = await resp.json()
                freshEmail = profile?.email || null
              } catch (e) {

              }
            }
            if (!freshEmail) {
              setAuthError('No se pudo obtener el email autenticado. Intenta de nuevo.')
              setAuthCardStatus('error')
              return
            }

            // 3) Enviar email SOLO con email fresco
            const emailData = { ...formData, email: freshEmail }
            setSending(true)
            try {
              await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                emailData,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
              )
              // Enviar acuse al usuario (no bloqueante)
              sendClientReceipt({ toEmail: freshEmail, toName: formData.name })
              setSendStatus('success')
              setFormData({ name: '', message: '' })
              setLastSentEmail(freshEmail)
              // Limpiar borrador persistido tras envío exitoso
              try {
                sessionStorage.removeItem('contact:pending')
                sessionStorage.removeItem('contact:draft')
              } catch (e) {}
            } catch (sendErr) {
              setSendStatus('error')
            } finally {
              setSending(false)
              setAuthCardStatus('idle')
              setShowAuthCard(false)
              authInFlight.current = false
            }
          } catch (error) {
            // Si cerraron el popup no enviamos y mostramos estado de error controlado
            await resetAuthState() // Reset state first

            if (error?.error === 'popup_closed' || error?.code === 'popup_closed') {
              setAuthError('Autenticación cancelada. Vuelve a intentar.')
              setAuthCardStatus('error')
              return
            }
            // Popup bloqueado por el navegador
            if (error?.error === 'popup_blocked' || error?.code === 'popup_blocked') {
              setAuthError('El navegador bloqueó el popup. Habilita pop-ups para este sitio o usa la redirección.')
              setAuthCardStatus('error')
              return
            }
            setAuthError(error?.message || 'No se pudo abrir el popup de autenticación.')
            setAuthCardStatus('error')
          }
        }}
      >
        <div>
          <label htmlFor="name" className="block text-sm font-bold mb-2">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => {
              setSendStatus(null)
              setLastSentEmail(null)
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }}
            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-primary border-cloud/40' : 'bg-cloud border-void/40'} font-mono`}
            placeholder="Tu nombre"
            required
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-bold mb-2">
            Mensaje
          </label>
          <textarea
            id="message"
            rows="4"
            value={formData.message}
            onChange={(e) => {
              setSendStatus(null)
              setLastSentEmail(null)
              setFormData((prev) => ({ ...prev, message: e.target.value }))
            }}
            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-primary border-cloud/40' : 'bg-cloud border-void/40'} font-mono`}
            placeholder="Escribe tu mensaje aquí..."
            required
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={sending || authCardStatus === 'authenticating'}
            className={`relative isolate overflow-hidden my-2 px-3 py-1 border rounded-md text-xs font-bold
              transition-colors duration-300
              before:content-[''] before:absolute before:inset-0 before:rounded-full
              before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
              ${isDark ? 'border-white/40 text-white hover:text-black before:bg-white' : 'border-black/40 text-black hover:text-white before:bg-black'}`}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const ox = ((e.clientX - rect.left) / rect.width) * 100
              const oy = ((e.clientY - rect.top) / rect.height) * 100
              e.currentTarget.style.setProperty('--ox', `${ox}%`)
              e.currentTarget.style.setProperty('--oy', `${oy}%`)
            }}
          >
            <span className="relative z-10 text-md">{sending ? 'Enviando...' : 'Enviar ↗'}</span>
          </button>
          {sendStatus === 'success' && (
            <p className="text-feather text-sm">¡Mensaje enviado con éxito desde {lastSentEmail}!</p>
          )}
          {sendStatus === 'error' && (
            <p className="text-red-500 text-sm">Error al enviar el mensaje. Por favor, intenta de nuevo.</p>
          )}
        </div>
      </form>

      {showAuthCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none ">
          <div
            className={`pointer-events-auto rounded-xl shadow-lg w-[90%] max-w-md p-5 border relative space-y-3 ${isDark ? 'bg-primary border-white/15' : 'bg-secondary border-black/15'}`}
          >
            <button
              type="button"
              aria-label="Cerrar"
              className={`absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-lg text-3xl leading-none ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              onClick={async () => {
                await resetAuthState()
                setShowAuthCard(false)
              }}
            >
              ×
            </button>
            <h4 className="absolute top-2 left-4 font-mono font-bold text-lg">Autenticación</h4>
            <br/>
            {authCardStatus === 'authenticating' && (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-500 opacity-75"></div>
                <p className="pt-16 font-mono text-sm opacity-80">Autenticando... completa el popup para continuar.</p>
              </div>
            )}
            {authCardStatus === 'error' && (
              <div className="space-y-2">
                <p className="font-mono text-sm text-red-500">{authError}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-2 rounded-md font-bold text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                onClick={async () => {
                  await resetAuthState()
                  const form = document.getElementById('contactForm')
                  if (form) form.requestSubmit()
                }}
              >
                Reintentar
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded-md font-bold text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                onClick={async () => {
                  try {
                    try {
                      sessionStorage.setItem('contact:pending', '1')
                      sessionStorage.setItem('contact:draft', JSON.stringify(formData))
                    } catch (e) {}
                    await logout({
                      openUrl: false,
                      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID
                    })
                    await loginWithRedirect({
                      authorizationParams: {
                        prompt: 'login',
                        max_age: 0,
                        redirect_uri: `${window.location.origin}/about`
                      },
                      appState: { returnTo: '/about' }
                    })
                  } catch (e) {
                    await resetAuthState()
                    setAuthError('Error al redireccionar. Intenta de nuevo.')
                    setAuthCardStatus('error')
                  }
                }}
              >
                Usar redirección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

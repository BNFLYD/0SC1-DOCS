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

  useEffect(() => {
    const currentInstanceId = instanceId.current
    console.log(`[ContactForm ${currentInstanceId}] mount`)
    // Restaurar borrador si existe (por flujo de redirección)
    try {
      const draft = sessionStorage.getItem('contact:draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed && typeof parsed === 'object') {
          setFormData({ name: parsed.name || '', message: parsed.message || '' })
          console.log(`[ContactForm ${currentInstanceId}] draft restored from sessionStorage`)
        }
      }
    } catch (e) {
      console.warn(`[ContactForm ${currentInstanceId}] failed to restore draft`, e)
    }

    // Verificar si venimos de una redirección de Auth0
    const checkRedirectAndSubmit = async () => {
      try {
        const claims = await getIdTokenClaims()
        if (!claims) {
          console.log(`[ContactForm ${currentInstanceId}] No claims found`)
          return
        }

        // Verificar si la autenticación es reciente (menos de 10 segundos)
        const isRecentAuth = Date.now() / 1000 - claims.auth_time < 10
        console.log(`[ContactForm ${currentInstanceId}] Auth time check:`, {
          now: Date.now() / 1000,
          authTime: claims.auth_time,
          isRecent: isRecentAuth
        })

        if (isRecentAuth) {
          console.log(`[ContactForm ${currentInstanceId}] Recent auth detected, preparing submit`)
          // Forzar un pequeño delay para asegurar que React ha renderizado
          setTimeout(() => {
            const form = document.getElementById('contactForm')
            if (form) {
              console.log(`[ContactForm ${currentInstanceId}] Triggering form submit`)
              setShowAuthCard(false) // Ocultar el modal
              setAuthCardStatus('idle')
              form.requestSubmit()
            } else {
              console.warn(`[ContactForm ${currentInstanceId}] Form not found after redirect`)
            }
          }, 100)
        }
      } catch (e) {
        console.warn(`[ContactForm ${currentInstanceId}] Error processing redirect:`, e)
      }
    }

    checkRedirectAndSubmit()

    return () => {
      console.log(`[ContactForm ${currentInstanceId}] unmount`)
    }
  }, [getIdTokenClaims])

  useEffect(() => {
    if (typeof onCardOpenChange === 'function') onCardOpenChange(showAuthCard)
  }, [showAuthCard, onCardOpenChange])

  useEffect(() => {
    console.warn(`[ContactForm] Email actualizado:`, lastSentEmail)
  }, [lastSentEmail])

  const resetAuthState = async () => {
    console.log(`[ContactForm ${instanceId.current}] resetting auth state`)
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
      console.warn('[ContactForm] Error al limpiar sesión:', e)
    }
  }

  return (
    <div className="space-y-4 font-mono">
      <form
        id="contactForm"
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          // Log del estado antes del reset
          console.warn(`[ContactForm ${instanceId.current}] Email antes del reset:`, lastSentEmail)
          try {
            const tokenBefore = await getIdTokenClaims()
            console.warn(`[ContactForm ${instanceId.current}] Token Auth0 antes del reset:`, tokenBefore)
          } catch (e) {
            console.warn(`[ContactForm ${instanceId.current}] No hay token antes del reset`)
          }

          setLastSentEmail(null)

          // Log del estado después del reset
          try {
            const tokenAfter = await getIdTokenClaims()
            console.warn(`[ContactForm ${instanceId.current}] Token Auth0 después del reset:`, tokenAfter)
          } catch (e) {
            console.warn(`[ContactForm ${instanceId.current}] No hay token después del reset`)
          }

          setAuthError('')
          try {
            const now = Date.now()
            if (now - lastSubmitTs.current < 800) {
              console.warn(`[ContactForm ${instanceId.current}] debounce preventing double submit`)
              return
            }
            lastSubmitTs.current = now
            if (authInFlight.current) {
              console.warn(`[ContactForm ${instanceId.current}] auth already in flight, ignoring submit`)
              return
            }
            // Detectar si venimos de redirección (auto-envío sin popup)
            let isRedirectPending = false
            try {
              isRedirectPending = sessionStorage.getItem('contact:pending') === '1'
            } catch {}

            if (isRedirectPending) {
              authInFlight.current = true
              console.log(`[ContactForm ${instanceId.current}] redirect pending detected: skipping popup and sending with existing session`)

              // Obtener email del token actual
              let freshEmail = null
              try {
                const claims = await getIdTokenClaims({ timeoutInSeconds: 10 })
                console.log(`[ContactForm ${instanceId.current}] claims after redirect:`, claims)
                freshEmail = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null
              } catch (e) {
                console.warn('[ContactForm] claims fetch after redirect failed:', e)
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
                  console.log(`[ContactForm ${instanceId.current}] userinfo email after redirect:`, freshEmail)
                } catch (e) {
                  console.warn('[ContactForm] userinfo after redirect failed', e)
                }
              }
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
                setSendStatus('success')
                setFormData({ name: '', message: '' })
                setLastSentEmail(freshEmail)
                // Limpiar borrador/flag de redirección
                try {
                  sessionStorage.removeItem('contact:pending')
                  sessionStorage.removeItem('contact:draft')
                } catch {}
              } catch (sendErr) {
                console.error('Error sending email after redirect:', sendErr)
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
            console.log(`[ContactForm ${instanceId.current}] submit: start auth flow (starting popup immediately)`)

            // Limpiar cualquier sesión existente de Auth0
            console.log(`[ContactForm ${instanceId.current}] clearing existing auth session`)
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

            console.log(`[ContactForm ${instanceId.current}] popup completed successfully`)

            // 2) Obtener email del token fresco
            let freshEmail = null
            try {
              // Forzar obtención de un token fresco
              const claims = await getIdTokenClaims({ timeoutInSeconds: 10 })
              console.log(`[ContactForm ${instanceId.current}] Verificando claims del nuevo token:`, claims)
              freshEmail = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null

              if (!freshEmail) {
                throw new Error('No se encontró email en el token')
              }

              console.log(`[ContactForm ${instanceId.current}] Email obtenido del nuevo token:`, freshEmail)
            } catch (e) {
              console.warn('[ContactForm] Error al obtener email del token:', e)
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
                console.log(`[ContactForm ${instanceId.current}] userinfo email:`, freshEmail)
              } catch (e) {
                console.warn('[ContactForm] userinfo fetch failed', e)
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
              setSendStatus('success')
              setFormData({ name: '', message: '' })
              setLastSentEmail(freshEmail)
              // Limpiar borrador persistido tras envío exitoso
              try {
                sessionStorage.removeItem('contact:pending')
                sessionStorage.removeItem('contact:draft')
              } catch (e) {
                console.warn('[ContactForm] failed to clear draft from sessionStorage', e)
              }
            } catch (sendErr) {
              console.error('Error sending email:', sendErr)
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
              console.warn('[ContactForm] popup blocked by the browser')
              setAuthError('El navegador bloqueó el popup. Habilita pop-ups para este sitio o usa la redirección.')
              setAuthCardStatus('error')
              return
            }
            console.error('Error en el proceso de autenticación:', error)
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
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-primary border-cloud/40' : 'bg-cloud border-void/40'} font-mono`}
            placeholder="Escribe tu mensaje aquí..."
            required
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={sending || authCardStatus === 'authenticating'}
            className={`p-2 rounded-lg font-bold text-left transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
              } ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {sending ? 'Enviando...' : 'Enviar Mensaje'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className={`pointer-events-auto rounded-xl shadow-lg w-[90%] max-w-md p-5 border ${isDark ? 'bg-primary border-white/15' : 'bg-secondary border-black/15'
              }`}
          >
            <h4 className="font-mono font-bold text-lg mb-2">Autenticación</h4>
            {authCardStatus === 'authenticating' && (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-500 opacity-75"></div>
                <p className="font-mono text-sm opacity-80">Autenticando... completa el popup para continuar.</p>
              </div>
            )}
            {authCardStatus === 'error' && (
              <div className="space-y-3">
                <p className="font-mono text-sm text-red-500">{authError}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-md font-bold text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                      }`}
                    onClick={async () => {
                      await resetAuthState()
                      setShowAuthCard(false)
                    }}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-md font-bold text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                      }`}
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
                    className={`px-3 py-2 rounded-md font-bold text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                      }`}
                    onClick={async () => {
                      try {
                        console.log(`[ContactForm ${instanceId.current}] starting redirect auth flow`)
                        // Guardar borrador e intención de envío antes de redireccionar
                        try {
                          sessionStorage.setItem('contact:pending', '1')
                          sessionStorage.setItem('contact:draft', JSON.stringify(formData))
                          console.log(`[ContactForm ${instanceId.current}] draft saved to sessionStorage`)
                        } catch (e) {
                          console.warn('[ContactForm] failed to save draft to sessionStorage', e)
                        }
                        // Limpiar la sesión antes de redireccionar
                        await logout({
                          openUrl: false,
                          clientId: import.meta.env.VITE_AUTH0_CLIENT_ID
                        })

                        await loginWithRedirect({
                          authorizationParams: {
                            prompt: 'login',
                            max_age: 0
                          }
                        })
                      } catch (e) {
                        console.error('Redirect auth error:', e)
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}

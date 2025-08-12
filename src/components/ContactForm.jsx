import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import emailjs from '@emailjs/browser'

export default function ContactForm({ isDark, onCardOpenChange }) {
  const { loginWithRedirect, loginWithPopup, getIdTokenClaims, getAccessTokenSilently } = useAuth()

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
    console.log(`[ContactForm ${instanceId.current}] mount`)
    return () => console.log(`[ContactForm ${instanceId.current}] unmount`)
  }, [])

  useEffect(() => {
    if (typeof onCardOpenChange === 'function') onCardOpenChange(showAuthCard)
  }, [showAuthCard, onCardOpenChange])

  return (
    <div className="space-y-4 font-mono">
      <form
        id="contactForm"
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
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
            authInFlight.current = true
            console.log(`[ContactForm ${instanceId.current}] submit: start auth flow (starting popup immediately)`)
            // Iniciar el popup de inmediato para que el navegador lo considere gesto de usuario
            const popupPromise = loginWithPopup({ authorizationParams: { prompt: 'login' } })
            // Mostrar la card después de iniciar el popup
            setShowAuthCard(true)
            setAuthCardStatus('authenticating')
            // Esperar resolución del popup
            await popupPromise
            console.log(`[ContactForm ${instanceId.current}] popup resolved`)

            // 2) Intentar obtener email desde id_token; si no viene, usar userinfo
            let freshEmail = null
            try {
              const claims = await getIdTokenClaims()
              freshEmail = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null
              console.log(`[ContactForm ${instanceId.current}] claims email:`, freshEmail)
            } catch (e) {
              console.warn('[ContactForm] getIdTokenClaims failed', e)
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
            if (error?.error === 'popup_closed' || error?.code === 'popup_closed') {
              setAuthError('Autenticación cancelada. Vuelve a intentar.')
              setAuthCardStatus('error')
              authInFlight.current = false
              return
            }
            // Popup bloqueado por el navegador
            if (error?.error === 'popup_blocked' || error?.code === 'popup_blocked') {
              console.warn('[ContactForm] popup blocked by the browser')
              setAuthError('El navegador bloqueó el popup. Habilita pop-ups para este sitio o usa la redirección.')
              setAuthCardStatus('error')
              authInFlight.current = false
              return
            }
            console.error('Error en el proceso de autenticación:', error)
            setAuthError(error?.message || 'No se pudo abrir el popup de autenticación.')
            setAuthCardStatus('error')
            authInFlight.current = false
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
        <button
          type="submit"
          disabled={sending || authCardStatus === 'authenticating'}
          className={`p-2 rounded-lg font-bold text-left transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
            } ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {sending ? 'Enviando...' : 'Enviar Mensaje'}
        </button>
        {sendStatus === 'success' && (
          <p className="text-feather mt-2">¡Mensaje enviado con éxito desde {lastSentEmail}!</p>
        )}
        {sendStatus === 'error' && (
          <p className="text-red-500 mt-2">Error al enviar el mensaje. Por favor, intenta de nuevo.</p>
        )}
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
                    onClick={() => setShowAuthCard(false)}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-md font-bold text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                      }`}
                    onClick={() => {
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
                        await loginWithRedirect({
                          authorizationParams: { prompt: 'login' },
                          appState: { returnTo: '/about' }
                        })
                      } catch (e) {
                        console.error('Redirect auth error', e)
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

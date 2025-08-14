"use client"

import { useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { useUser } from "../../context/UserContext"
import { useAuth } from "../../hooks/useAuth"
import emailjs from "@emailjs/browser"

import TerminalText from "../TerminalText"

const HireChannel = () => {
  const { isDark } = useUser()
  const textColor = isDark ? "text-white" : "text-black"
  const [showContent, setShowContent] = useState(false)

  // Form state (ContactForm-compatible)
  const { loginWithPopup, loginWithRedirect, getIdTokenClaims, getAccessTokenSilently, logout } = useAuth()
  const [formData, setFormData] = useState({ name: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null) // 'success' | 'error' | null
  const lastSubmitTs = useRef(0)
  // Auth card UI
  const [showAuthCard, setShowAuthCard] = useState(false)
  const [authCardStatus, setAuthCardStatus] = useState('idle') // 'idle' | 'authenticating' | 'error'
  const [authError, setAuthError] = useState('')
  // Per-field validation feedback
  const [invalidField, setInvalidField] = useState(null) // 'name' | 'message' | null
  const [invalidMsg, setInvalidMsg] = useState('')

  const resetAuthState = async () => {
    setShowAuthCard(false)
    setAuthCardStatus('idle')
    setAuthError('')
    try {
      await logout({ openUrl: false, clientId: import.meta.env.VITE_AUTH0_CLIENT_ID })
    } catch {}
  }

  // Resume flow after Auth0 redirect: restore draft and auto-send
  useEffect(() => {
    let cancelled = false
    const maybeResume = async () => {
      try {
        const pending = sessionStorage.getItem('contact:pending')
        const draftRaw = sessionStorage.getItem('contact:draft')
        if (pending !== '1' || !draftRaw) return

        const draft = JSON.parse(draftRaw)
        if (!draft || typeof draft !== 'object') return

        // reflect draft in UI
        setFormData({ name: draft.name || '', message: draft.message || '' })

        // show small auth processing state
        setShowAuthCard(true)
        setAuthCardStatus('authenticating')

        // try to fetch authenticated email with small retry window (SDK may still be finalizing callback)
        const getFreshEmailWithRetry = async () => {
          const maxAttempts = 8
          const delay = (ms) => new Promise(r => setTimeout(r, ms))
          for (let i = 0; i < maxAttempts; i++) {
            if (cancelled) return null
            // 1) try id token claims
            try {
              const claims = await getIdTokenClaims({ timeoutInSeconds: 5 })
              const email = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null
              if (email) return email
            } catch {}
            // 2) try userinfo via access token
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
          if (cancelled) return
          setSendStatus('error')
          setAuthError('No se pudo obtener el email autenticado tras la redirección.')
          setAuthCardStatus('error')
          return
        }

        if (cancelled) return
        setSending(true)
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            { ...draft, email: freshEmail },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          )
          setSendStatus('success')
          setFormData({ name: '', message: '' })
        } catch (err) {
          setSendStatus('error')
          setAuthError('Error al enviar el mensaje tras la redirección. Intenta de nuevo.')
          setAuthCardStatus('error')
        } finally {
          setSending(false)
          setAuthCardStatus('idle')
          setShowAuthCard(false)
          try {
            sessionStorage.removeItem('contact:pending')
            sessionStorage.removeItem('contact:draft')
          } catch {}
        }
      } finally {
        // ensure flags are cleared even on early returns
        try {
          sessionStorage.removeItem('contact:pending')
        } catch {}
      }
    }
    void maybeResume()
    return () => { cancelled = true }
  }, [getAccessTokenSilently, getIdTokenClaims])

  return (
    <div className={`flex flex-col p-8 gap-2 relative ${textColor}`}>
      <div className="text-xl font-bold">
        <TerminalText
          text="sendmail"
          inView={true}
          onComplete={() => setShowContent(true)}
          prefix="> "
        />
      </div>
      {/* Retro compose panel */}
      <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setSendStatus(null)
            // Simple required validation (avoid native tooltip)
            if (!formData.name.trim()) {
              setInvalidField('name')
              setInvalidMsg('Rellene este campo')
              try { e.currentTarget.querySelector('input[name="name"]').focus() } catch {}
              return
            }
            if (!formData.message.trim()) {
              setInvalidField('message')
              setInvalidMsg('Rellene este campo')
              try { e.currentTarget.querySelector('textarea').focus() } catch {}
              return
            }

            const now = Date.now()
            if (now - lastSubmitTs.current < 800) return
            lastSubmitTs.current = now

            try {
              setShowAuthCard(true)
              setAuthCardStatus('authenticating')
              // reset any prior session
              await logout({ openUrl: false, clientId: import.meta.env.VITE_AUTH0_CLIENT_ID })

              // popup auth
              await loginWithPopup({
                authorizationParams: { prompt: 'login', max_age: 0, scope: 'openid profile email' }
              })

              // get fresh email from claims first
              let freshEmail = null
              try {
                const claims = await getIdTokenClaims({ timeoutInSeconds: 10 })
                freshEmail = claims?.email || claims?.['https://schemas.openid.net/claims/email'] || null
              } catch {}

              // fallback to userinfo
              if (!freshEmail) {
                try {
                  const token = await getAccessTokenSilently()
                  const domain = import.meta.env.VITE_AUTH0_DOMAIN
                  const resp = await fetch(`https://${domain}/userinfo`, { headers: { Authorization: `Bearer ${token}` } })
                  const profile = await resp.json()
                  freshEmail = profile?.email || null
                } catch {}
              }

              if (!freshEmail) {
                setSendStatus('error')
                setAuthError('No se pudo autenticar el usuario. Intentalo de nuevo o usa la redirección.')
                setAuthCardStatus('error')
                return
              }

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
              } catch (err) {
                setSendStatus('error')
                setAuthError('Error al enviar el mensaje. Intenta de nuevo.')
                setAuthCardStatus('error')
              } finally {
                setSending(false)
                setAuthCardStatus('idle')
                setShowAuthCard(false)
              }
            } catch (error) {
              // errores comunes de popup
              if (error?.error === 'popup_closed' || error?.code === 'popup_closed') {
                setAuthError('Autenticación cancelada. Vuelve a intentar o usa redirección.')
              } else if (error?.error === 'popup_blocked' || error?.code === 'popup_blocked') {
                setAuthError('El navegador bloqueó el popup. Habilita pop-ups o usa redirección.')
              } else {
                setAuthError(error?.message || 'No se pudo abrir el popup de autenticación.')
              }
              setAuthCardStatus('error')
              setSendStatus('error')
            }
          }}
          noValidate
          className={`font-mono w-full max-w-2xl
            ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-black'}`}
        >

          <div className={`text-lg font-semibold border-y ${isDark ? 'border-white/20' : 'border-black/20'} py-2 space-y-2`}>
            <div className="flex items-center gap-2">
              <span className="w-16 text-lg font-semibold">Para:</span>
              <span
                className={`flex-1 bg-transparent outline-none placeholder-current text-lg font-semibold`}>
                Flavio Gabriel Morales
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-lg ">De:</span>
              <div className="relative flex-1">
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, name: e.target.value }))
                    if (invalidField === 'name' && e.target.value.trim()) setInvalidField(null)
                  }}
                  className={`w-full bg-transparent outline-none placeholder-current text-lg opacity-50`}
                  placeholder="Tu nombre"
                  required
                />
                {invalidField === 'name' && (
                  <div className={`absolute -bottom-6 left-0 font-mono text-xs border px-2 py-1 rounded-md ${isDark ? 'bg-primary text-white border-white/30' : 'bg-white text-black border-black/30'}`}>
                    {invalidMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={`mt-3 text-sm`}>-- Mensaje --</div>
          <div className="relative">
            <textarea
              rows={2}
              className={`mt-1 w-full bg-transparent resize-y text-lg outline-none leading-relaxed`}
              placeholder="Escribe tu mensaje aquí..."
              value={formData.message}
              onChange={(e) => {
                setFormData((p) => ({ ...p, message: e.target.value }))
                if (invalidField === 'message' && e.target.value.trim()) setInvalidField(null)
              }}
              required
            />
            {invalidField === 'message' && (
              <div className={`absolute -bottom-6 left-0 font-mono text-xs border px-2 py-1 rounded-md ${isDark ? 'bg-primary text-white border-white/30' : 'bg-white text-black border-black/30'}`}>
                {invalidMsg}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative">
              <button
                type="submit"
                disabled={sending}
                className={`relative isolate overflow-hidden px-3 py-1 border rounded-md text-xs font-bold
                  transition-colors duration-300
                  before:content-[''] before:absolute before:inset-0 before:rounded-full
                  before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
                  ${isDark ? 'border-white/60 text-white hover:text-black before:bg-white' : 'border-black/60 text-black hover:text-white before:bg-black'}`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ox = ((e.clientX - rect.left) / rect.width) * 100
                  const oy = ((e.clientY - rect.top) / rect.height) * 100
                  e.currentTarget.style.setProperty('--ox', `${ox}%`)
                  e.currentTarget.style.setProperty('--oy', `${oy}%`)
                }}
              >
                <span className="relative z-10 whitespace-nowrap">{sending ? 'enviando…' : 'enviar ↗'}</span>
              </button>
              {sendStatus === 'success' && (
                <span className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs whitespace-nowrap ${isDark ? 'text-white/70' : 'text-black/70'}`}>¡Mensaje enviado!</span>
              )}
              {sendStatus === 'error' && (
                <span className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs whitespace-nowrap ${isDark ? 'text-white/70' : 'text-black/70'}`}>Fallo el envio, intentelo de nuevo.</span>
              )}
            </div>
            <div className={`flex w-full gap-2 self-start transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex gap-4 ml-auto">
                <a
                  href="https://www.linkedin.com/in/flavio-gabriel-morales-939371184/"
                  className={`relative p-3 rounded-lg mr-2 transition-all duration-300 flex flex-col items-center justify-center group `}
                  aria-label="Ver perfil de GitHub">
                  <Icon
                    icon="pixel:linkedin"
                    width="28"
                    height="28"
                    className={`mb-2 mx-auto transition-colors duration-200 ${isDark ? 'text-white' : 'text-black'}`}
                  />
                  <span
                    className={`absolute bottom-[-0.1rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono whitespace-nowrap ${isDark ? "text-white" : "text-black"
                      }`}
                  >
                    LinkedIn
                  </span>
                </a>
                <a
                  href="https://github.com/FlavioG01"
                  className={`relative p-3 rounded-lg transition-all duration-300 flex flex-col items-center justify-center group `}
                  aria-label="Ver perfil de GitHub">
                  <Icon
                    icon="dinkie-icons:github"
                    width="28"
                    height="28"
                    className={`mb-2 mx-auto transition-colors duration-200 ${isDark ? 'text-white' : 'text-black'}`}
                  />
                  <span
                    className={`absolute bottom-[-0.1rem] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono whitespace-nowrap ${isDark ? "text-white" : "text-black"
                      }`}
                  >
                    GitHub
                  </span>
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Per-field validation toasts are rendered near each field above */}
      {showAuthCard && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          {/* Backdrop dentro del CRT */}
          <div className="absolute inset-0 bg-current/5" />
          {/* Card retro */}
          <div className={`relative w-[90%] max-w-md p-4 border font-mono rounded-md ${isDark ? 'bg-primary text-white border-white/20' : 'bg-white text-black border-black/20'}`}>
            <div className={`text-sm border-b ${isDark ? 'border-white/20' : 'border-black/20'} pb-2 mb-3 flex items-center justify-between`}>
              <span className="font-bold">[ autenticación ]</span>
              <button
                type="button"
                aria-label="Cerrar"
                className={`relative isolate overflow-hidden px-2 py-0.5 border rounded-md text-xs font-bold
                  transition-colors duration-300
                  before:content-[''] before:absolute before:inset-0 before:rounded-full
                  before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
                  ${isDark ? 'border-white/60 text-white hover:text-black before:bg-white' : 'border-black/60 text-black hover:text-white before:bg-black'}`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ox = ((e.clientX - rect.left) / rect.width) * 100
                  const oy = ((e.clientY - rect.top) / rect.height) * 100
                  e.currentTarget.style.setProperty('--ox', `${ox}%`)
                  e.currentTarget.style.setProperty('--oy', `${oy}%`)
                }}
                onClick={async () => {
                  await resetAuthState()
                  setShowAuthCard(false)
                }}
              >
                <span className="relative z-10">x</span>
              </button>
            </div>
            {authCardStatus === 'authenticating' && (
              <p className="text-xs opacity-80">Autenticando... completa la verificacion para continuar.</p>
            )}
            {authCardStatus === 'error' && (
              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>{authError}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className={`relative isolate overflow-hidden px-3 py-1 border rounded-md text-xs font-bold
                  transition-colors duration-300
                  before:content-[''] before:absolute before:inset-0 before:rounded-full
                  before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
                  ${isDark ? 'border-white/60 text-white hover:text-black before:bg-white' : 'border-black/60 text-black hover:text-white before:bg-black'}`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ox = ((e.clientX - rect.left) / rect.width) * 100
                  const oy = ((e.clientY - rect.top) / rect.height) * 100
                  e.currentTarget.style.setProperty('--ox', `${ox}%`)
                  e.currentTarget.style.setProperty('--oy', `${oy}%`)
                }}
                onClick={async () => {
                  await resetAuthState()
                  const form = document.querySelector('form')
                  if (form) form.requestSubmit()
                }}
              >
                <span className="relative z-10 whitespace-nowrap">reintentar</span>
              </button>
              <button
                type="button"
                className={`relative isolate overflow-hidden px-3 py-1 border rounded-md text-xs font-bold
                  transition-colors duration-300
                  before:content-[''] before:absolute before:inset-0 before:rounded-full
                  before:scale-0 hover:before:scale-150 before:transition-transform before:duration-300 before:ease-out before:origin-[var(--ox)_var(--oy)]
                  ${isDark ? 'border-white/60 text-white hover:text-black before:bg-white' : 'border-black/60 text-black hover:text-white before:bg-black'}`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ox = ((e.clientX - rect.left) / rect.width) * 100
                  const oy = ((e.clientY - rect.top) / rect.height) * 100
                  e.currentTarget.style.setProperty('--ox', `${ox}%`)
                  e.currentTarget.style.setProperty('--oy', `${oy}%`)
                }}
                onClick={async () => {
                  try {
                    try {
                      sessionStorage.setItem('contact:draft', JSON.stringify(formData))
                      sessionStorage.setItem('contact:pending', '1')
                      sessionStorage.setItem('ui:activeChannel', 'hire')
                    } catch {}
                    await logout({ openUrl: false, clientId: import.meta.env.VITE_AUTH0_CLIENT_ID })
                    await loginWithRedirect({
                      authorizationParams: { prompt: 'login', max_age: 0, scope: 'openid profile email', redirect_uri: window.location.href }
                    })
                  } catch (e) {
                    setAuthError('Error al redireccionar. Intenta de nuevo.')
                    setAuthCardStatus('error')
                  }
                }}
              >
                <span className="relative z-10 whitespace-nowrap">usar redirección</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HireChannel

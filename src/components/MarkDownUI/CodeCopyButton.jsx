import { useEffect } from "react"
import { Icon } from "@iconify/react"
import { createRoot } from "react-dom/client"

const CodeCopyButton = () => {
  useEffect(() => {
    const addCopyButtons = () => {
      const codeBlocks = document.querySelectorAll('[data-rehype-pretty-code-figure]:not([data-copy-added])')

      codeBlocks.forEach((figure) => {
        figure.setAttribute('data-copy-added', 'true')
        figure.style.position = 'relative'

        const button = document.createElement('button')
        button.className = 'absolute top-3 right-3 z-10 p-1 rounded-full bg-void text-white dark:bg-white dark:text-void'
        button.type = 'button'
        button.setAttribute('aria-label', 'Copiar código')

        // Render Iconify icon via React DOM
        const root = createRoot(button)
        const renderIcon = (iconName) => {
          root.render(
            <Icon icon={iconName} width={24} height={24} />
          )
        }
        // initial icon
        renderIcon('lets-icons:copy-light')

        // Floating label for hover/click state
        let copied = false
        const label = document.createElement('span')
        label.textContent = 'Copiar'
        label.className = 'absolute pr-10 right-3 pt-1 top-2 text-md font-mono text-void dark:text-white bg-transparent select-none opacity-0 transition-opacity duration-150 pointer-events-none'
        figure.appendChild(label)

        const showLabel = (text) => {
          label.textContent = text
          label.classList.remove('opacity-0')
          label.classList.add('opacity-100')
        }

        const hideLabel = () => {
          if (!copied) {
            label.classList.remove('opacity-100')
            label.classList.add('opacity-0')
          }
        }

        button.addEventListener('mouseenter', () => {
          if (!copied) showLabel('Copiar')
        })
        button.addEventListener('mouseleave', () => {
          hideLabel()
        })

        button.onclick = async () => {
          const code = figure.querySelector('pre code')?.textContent
          if (code) {
            try {
              await navigator.clipboard.writeText(code)
              renderIcon('heroicons-outline:check')
              copied = true
              showLabel('Copiado')
              setTimeout(() => {
                renderIcon('lets-icons:copy-light')
                copied = false
                hideLabel()
              }, 2000)
            } catch (err) {
              console.error('Copy failed:', err)
            }
          }
        }

        figure.appendChild(button)
      })
    }

    addCopyButtons()

    const observer = new MutationObserver(addCopyButtons)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}

export default CodeCopyButton

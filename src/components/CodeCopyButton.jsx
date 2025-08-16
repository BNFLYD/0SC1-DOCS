import { useEffect } from "react"

const CodeCopyButton = () => {
  useEffect(() => {
    const addCopyButtons = () => {
      const codeBlocks = document.querySelectorAll('[data-rehype-pretty-code-figure]:not([data-copy-added])')
      
      codeBlocks.forEach((figure) => {
        figure.setAttribute('data-copy-added', 'true')
        figure.style.position = 'relative'

        const button = document.createElement('button')
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        `
        button.className = 'absolute top-2 right-2 z-10 p-2 rounded opacity-70 hover:opacity-100 transition-opacity bg-gray-800 text-white dark:bg-white dark:text-gray-800'
        
        button.onclick = async () => {
          const code = figure.querySelector('pre code')?.textContent
          if (code) {
            try {
              await navigator.clipboard.writeText(code)
              button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2l-4.2-4.2-1.4 1.4 5.6 5.6 12-12-1.4-1.4L9 16.2z"/>
                </svg>
              `
              setTimeout(() => {
                button.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                `
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

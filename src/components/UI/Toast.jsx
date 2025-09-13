import  { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Icon } from '@iconify/react'

const Toast = ({ text, icon, visible, isDark }) => {
  const [showIcon, setShowIcon] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    let iconTimer, textTimer
    if (visible) {
      setShowIcon(true)
      textTimer = setTimeout(() => setShowText(true), 300) // Mostrar texto después de 300ms
    } else {
      setShowText(false)
      iconTimer = setTimeout(() => setShowIcon(false), 300) // Ocultar icono después de que se oculte el texto
    }
    return () => {
      clearTimeout(iconTimer)
      clearTimeout(textTimer)
    }
  }, [visible])

  return (
    <div
      className={`fixed z-50 inset-x-0 top-28 mx-auto transition-all duration-300 transform
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
    >
      <div className={`max-w-7xl mx-auto px-4`}>
        <div className={`p-3 rounded-xl
          ${isDark ? 'bg-primary/80 backdrop-blur-lg' : 'bg-secondary/80 backdrop-blur-md'}
          text-center`}
        >
          {icon && (
            <div className={`transition-all duration-300 transform ${showIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <Icon
                icon={icon}
                width="28"
                height="28"
                className="mb-2 mx-auto"
                style={{ color: isDark ? 'white' : 'black' }}
              />
            </div>
          )}
          <span className={`text-lg pb-3 font-sans block transition-all duration-300 transform
            ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {text}
          </span>
        </div>
      </div>
    </div>
  )
}

Toast.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.string,
  visible: PropTypes.bool.isRequired,
  isDark: PropTypes.bool
}

export default Toast

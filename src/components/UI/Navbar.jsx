import { useState } from "react"
import { Icon } from '@iconify/react'
import { Sun, Moon, Menu } from "lucide-react"
import { Link } from "react-router-dom"
import { languages } from "../../constants/languages"
import icon from "../../assets/iconb.svg"

const Navbar = ({ currentLanguage = "es", onLanguageChange, isDark, setIsDark, t }) => {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)

  const toggleTheme = () => setIsDark(!isDark)

  const handleLanguageSelect = (language) => {
    onLanguageChange?.(language)
    setIsLanguageMenuOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 w-full px-6 py-4 transition-colors duration-300 z-50 ${isDark ? "bg-primary text-white" : "bg-secondary text-black"
      }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo y nombre */}
        <Link
          to="/"
          className={`flex items-center space-x-3 cursor-pointer ${isDark ? "text-white" : "text-black"
            }`}>
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src={icon}
                alt="icon"
                className={`w-8 h-8 ${isDark ? "filter invert-[100%] hue-rotate-180" : "filter invert-[0%] hue-rotate-0"}`}
              />
            </div>
            <h1 className="relative inline-block group text-xl font-mono font-semibold tracking-wider">
              0SC1-DOCS
              <span className="underline -bottom-0"></span>
            </h1>
          </div>
        </Link>

        {/* Navegación central */}
        <div className="hidden md:flex items-center space-x-8">

          <Link
            to="/about"
            className={`font-sans font-bold text-sm uppercase tracking-wider relative group ${isDark ? "text-white" : "text-black"
              }`}
          >
            {t.about}
            <span className="underline -bottom-1"></span>
          </Link>
          <Link
            to="/blog"
            className={`font-sans font-bold text-sm uppercase tracking-wider relative group ${isDark ? "text-white" : "text-black"
              }`}
          >
            {t.blog}
            <span className="underline -bottom-1"></span>
          </Link>
        </div>

        {/* Controles de tema e idioma */}
        <div className="flex items-center space-x-4">
          {/* Selector de idioma */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className={`w-8 h-8 flex items-center justify-center transition-opacity ${isDark ? "text-white" : "text-black"
                }`}
              aria-label={t.languageSelector}
            >
              <Icon
                icon={languages.find(lang => lang.code === currentLanguage)?.icon}
                width="20"
                height="20"
              />
            </button>

            {isLanguageMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-5 w-32 rounded-lg shadow-lg z-50  ${isDark ? "bg-primary text-white" : "bg-secondary text-black"
                  }`}
              >
                {languages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className="w-full px-3 py-2 text-left text-sm font-mono relative group"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon
                        icon={language.icon}
                        width="20"
                        height="20"
                      />
                      <span className={`relative ${currentLanguage === language.code ? "font-bold" : ""}`}>
                        {t[
                          language.code === "es" ? "spanish" :
                            language.code === "en" ? "english" :
                              language.code === "de" ? "german" : "japanese"
                        ]}
                        <span className="underline -bottom-1"></span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle de tema */}
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 flex items-center justify-center transition-all duration-300 ${isDark ? "text-white" : "text-black"
              }`}
            aria-label={t.themeToggle[isDark ? "toLight" : "toDark"]}
          >
            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Menú móvil */}
          <button className="md:hidden">
            <Menu className={`w-5 h-5 ${isDark ? "text-white" : "text-black"}`} />
          </button>
        </div>
      </div>

      {/* Overlay para cerrar menú de idioma */}
      {isLanguageMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsLanguageMenuOpen(false)} />}
    </nav>
  )
}

export default Navbar

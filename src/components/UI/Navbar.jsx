"use client"

import { useState } from "react"
import { Sun, Moon, Menu } from "lucide-react"
import { Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"
import { languages } from "../../constants/languages"

const Navbar = ({ currentLanguage = "es", onLanguageChange }) => {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const { isDark, setIsDark } = useUser()

  const toggleTheme = () => setIsDark(!isDark)

  const handleLanguageSelect = (language) => {
    onLanguageChange?.(language)
    setIsLanguageMenuOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 w-full px-6 py-4 border-b transition-colors duration-300 z-50 ${isDark ? "bg-black border-white/20 text-white" : "bg-white border-black/20 text-black"
      }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo y nombre */}
        <Link
          to="/"
          className={`flex items-center space-x-3 cursor-pointer ${isDark ? "text-white" : "text-black"
            }`}>
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className={`w-8 h-8 border-2 rounded-sm flex items-center justify-center font-mono text-sm font-bold ${isDark ? "border-white" : "border-black"
              }`}>
              <span className="text-xs">01</span>
            </div>
            <h1 className="text-xl font-mono font-bold tracking-wider">0SC1-DOCS</h1>
          </div>
        </Link>

        {/* Navegación central */}
        <div className="hidden md:flex items-center space-x-8">

          <Link
            to="/about"
            className={`font-sans font-bold text-sm uppercase tracking-wider relative group ${isDark ? "text-white" : "text-black"
              }`}
          >
            {translations[currentLanguage].about}
            <span
              className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-700 group-hover:w-full bg-feather"
            ></span>
          </Link>
          <Link
            to="/blog"
            className={`font-sans font-bold text-sm uppercase tracking-wider relative group ${isDark ? "text-white" : "text-black"
              }`}
          >
            {translations[currentLanguage].blog}
            <span
              className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-700 group-hover:w-full bg-feather"
            ></span>
          </Link>
        </div>

        {/* Controles de tema e idioma */}
        <div className="flex items-center space-x-4">
          {/* Selector de idioma */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className={`w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity ${isDark ? "text-white" : "text-black"
                }`}
              aria-label={translations[currentLanguage].languageSelector}
            >
              <span className="text-lg">
                {languages.find(lang => lang.code === currentLanguage)?.flag}
              </span>
            </button>

            {isLanguageMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-32 border rounded-sm shadow-lg z-50 ${isDark ? "bg-black border-white/20 text-white" : "bg-white border-black/20 text-black"
                  }`}
              >
                {languages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className="w-full px-3 py-2 text-left text-sm font-mono relative group"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{language.flag}</span>
                      <span className={`relative ${currentLanguage === language.code ? "font-bold" : ""}`}>
                        {translations[currentLanguage][
                          language.code === "es" ? "spanish" :
                            language.code === "en" ? "english" :
                              language.code === "de" ? "german" : "japanese"
                        ]}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-700 group-hover:w-full bg-feather"></span>
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
            className={`w-8 h-8 flex items-center justify-center hover:opacity-60 transition-all duration-300 ${isDark ? "text-white" : "text-black"
              }`}
            aria-label={translations[currentLanguage].themeToggle[isDark ? "toLight" : "toDark"]}
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

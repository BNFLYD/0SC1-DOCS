"use client"

import { useState } from "react"
import { Sun, Moon, Menu } from "lucide-react"

const Navbar = ({ currentTheme = "dark", onThemeChange, currentLanguage = "es", onLanguageChange }) => {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [theme, setTheme] = useState(currentTheme)

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    onThemeChange?.(newTheme)
  }

  const handleLanguageSelect = (language) => {
    onLanguageChange?.(language)
    setIsLanguageMenuOpen(false)
  }

  const isDark = theme === "dark"

  return (
    <nav
      className={`w-full px-6 py-4 border-b transition-colors duration-300 ${
        isDark ? "bg-black border-white/20 text-white" : "bg-white border-black/20 text-black"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo y nombre */}
        <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div
            className={`w-8 h-8 border-2 rounded-sm flex items-center justify-center font-mono text-sm font-bold ${
              isDark ? "border-white" : "border-black"
            }`}
          >
            <span className="text-xs">0</span>
          </div>
          <h1 className="text-xl font-mono font-bold tracking-wider">0SC1-DOCS</h1>
        </div>

        {/* Navegación central */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="/blog"
            className={`font-mono text-sm uppercase tracking-wider hover:opacity-60 transition-opacity relative group ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Blog
            <span
              className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                isDark ? "bg-white" : "bg-black"
              }`}
            ></span>
          </a>
          <a
            href="/about"
            className={`font-mono text-sm uppercase tracking-wider hover:opacity-60 transition-opacity relative group ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            About
            <span
              className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                isDark ? "bg-white" : "bg-black"
              }`}
            ></span>
          </a>
        </div>

        {/* Controles de tema e idioma */}
        <div className="flex items-center space-x-4">
          {/* Selector de idioma */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className={`w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity ${
                isDark ? "text-white" : "text-black"
              }`}
              aria-label="Seleccionar idioma"
            >
              <span className="text-lg">🇦🇷</span>
            </button>

            {isLanguageMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-32 border rounded-sm shadow-lg z-50 ${
                  isDark ? "bg-black border-white/20 text-white" : "bg-white border-black/20 text-black"
                }`}
              >
                <button
                  onClick={() => handleLanguageSelect("es")}
                  className={`w-full px-3 py-2 text-left text-sm font-mono hover:opacity-60 transition-opacity flex items-center space-x-2 ${
                    currentLanguage === "es" ? "font-bold" : ""
                  }`}
                >
                  <span>🇦🇷</span>
                  <span>Español</span>
                </button>
                <button
                  onClick={() => handleLanguageSelect("en")}
                  className={`w-full px-3 py-2 text-left text-sm font-mono hover:opacity-60 transition-opacity flex items-center space-x-2 ${
                    currentLanguage === "en" ? "font-bold" : ""
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>English</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle de tema */}
          <button
            onClick={handleThemeToggle}
            className={`w-8 h-8 flex items-center justify-center hover:opacity-60 transition-all duration-300 ${
              isDark ? "text-white" : "text-black"
            }`}
            aria-label={theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
          >
            {theme === "light" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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

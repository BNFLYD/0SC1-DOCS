"use client"

import { useState } from "react"
import Navbar from "./components/Navbar.jsx"

function App() {
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("es")

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Navbar currentTheme={theme} onThemeChange={setTheme} currentLanguage={language} onLanguageChange={setLanguage} />

      {/* Contenido de ejemplo */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-mono font-bold mb-4">0SC1 - Osciloscopio CRT</h1>
          <p className="text-lg font-mono opacity-80">
            {language === "es"
              ? "Diseño minimalista con detalles retro futuristas"
              : "Minimalist design with retro futuristic details"}
          </p>
          <div className="mt-8 p-6 border border-current/20 rounded-sm">
            <p className="font-mono text-sm">
              {language === "es"
                ? `Tema actual: ${theme === "light" ? "Claro" : "Oscuro"}`
                : `Current theme: ${theme === "light" ? "Light" : "Dark"}`}
            </p>
            <p className="font-mono text-sm mt-2">
              {language === "es"
                ? `Idioma: ${language === "es" ? "Español" : "English"}`
                : `Language: ${language === "es" ? "Español" : "English"}`}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

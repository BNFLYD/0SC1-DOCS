"use client"
import { translations } from "../constants/translations"
import { useUser } from "../context/UserContext"

function About() {
  const { language, isDark } = useUser()

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-mono font-bold mb-4 transition-colors">
          {translations[language].title}
        </h1>
        <p className="text-lg font-mono opacity-80 transition-opacity hover:opacity-100">
          {translations[language].subtitle}
        </p>
        <div className="mt-8 p-6 border rounded-lg border-current/20 backdrop-blur-sm transition-all hover:border-current/40">
          <p className="font-mono text-sm">
            {`${translations[language].currentTheme}: ${translations[language].themes[isDark ? "dark" : "light"]}`}
          </p>
          <p className="font-mono text-sm mt-2">
            {`${translations[language].currentLanguage}: ${translations[language][language === "es" ? "spanish" : language === "en" ? "english" : language === "de" ? "german" : "japanese"]}`}
          </p>
        </div>
      </div>
    </div>
  )
}

export default About

import { useUser } from '../context/UserContext'
import { translations } from '../constants/translations'

// Hook que siempre está disponible globalmente
export const useGlobalState = () => {
  const { language, isDark, setLanguage, setIsDark, isMuttActive, setIsMuttActive } = useUser()

  return {
    language,
    isDark,
    setLanguage,
    setIsDark,
    isMuttActive,
    setIsMuttActive,
    textColor: isDark ? "text-white" : "text-black",
    theme: isDark ? "dark" : "light",
    t: translations[language] || translations.es // Traducciones ya resueltas con fallback
  }
}

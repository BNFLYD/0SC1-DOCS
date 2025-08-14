import { createContext, useContext, useState, useEffect } from "react"

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("userLanguage")
    return savedLanguage !== null ? savedLanguage : "es"
  })

  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("userTheme")
    return savedTheme !== null ? savedTheme === "dark" : true
  })

  // No persistimos mutt entre vistas; por defecto false. Solo About decidirá activarlo si hay redirección pendiente.
  const [isMuttActive, setIsMuttActive] = useState(false)

  useEffect(() => {
    localStorage.setItem("userLanguage", language)
  }, [language])

  useEffect(() => {
    localStorage.setItem("userTheme", isDark ? "dark" : "light")
  }, [isDark])

  return (
    <UserContext.Provider
      value={{
        language,
        setLanguage,
        isDark,
        setIsDark,
        isMuttActive,
        setIsMuttActive
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

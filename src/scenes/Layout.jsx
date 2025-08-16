import Header from "./global/Header"
import { useUser } from "../context/UserContext"
import ScrollToTop from "../components/UI/ScrollToTop"
import { useEffect } from "react"

const Layout = ({ children }) => {
  const { isDark } = useUser()

  // Sync Tailwind dark mode and Shiki theme at the HTML root
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? "bg-void text-white" : "bg-cloud text-black"
    }`}>
      <Header />
      <ScrollToTop />
      <main className="pt-20">
        {children}
      </main>
    </div>
  )
}

export default Layout

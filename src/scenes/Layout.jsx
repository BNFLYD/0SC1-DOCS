import Header from "./global/Header"
import { useGlobalState } from "../hooks/useGlobalState"
import ScrollToTop from "../components/UI/ScrollToTop"
import { useEffect } from "react"
import { Outlet } from "react-router-dom"

const Layout = () => {
  const globalState = useGlobalState()
  const { isDark } = globalState

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
      <Header globalState={globalState} />
      <ScrollToTop isDark={isDark} />
      <main className="pt-20">
        <Outlet context={globalState} />
      </main>
    </div>
  )
}

export default Layout


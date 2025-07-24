import Header from "./global/Header"
import { useUser } from "../context/UserContext"

const Layout = ({ children }) => {
  const { isDark } = useUser()

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? "bg-black text-white" : "bg-white text-black"
    }`}>
      <Header />
      <main className="pt-20">
        {children}
      </main>
    </div>
  )
}

export default Layout

import Navbar from "../../components/UI/Navbar"
import { useUser } from "../../context/UserContext"

const Header = () => {
  const { language, setLanguage } = useUser()

  return (
    <header>
      <Navbar currentLanguage={language} onLanguageChange={setLanguage} />
    </header>
  )
}

export default Header

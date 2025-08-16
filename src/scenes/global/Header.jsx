import Navbar from "../../components/UI/Navbar"

const Header = ({ globalState }) => {
  const { language, setLanguage, isDark, t } = globalState

  return (
    <header>
      <Navbar 
        currentLanguage={language} 
        onLanguageChange={setLanguage} 
        isDark={isDark}
        setIsDark={globalState.setIsDark}
        t={t}
      />
    </header>
  )
}

export default Header

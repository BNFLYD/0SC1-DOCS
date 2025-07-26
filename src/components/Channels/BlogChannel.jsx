"use client"
import { Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { translations } from "../../constants/translations"

const BlogChannel = ({ theme }) => {
  const isDark = theme === "dark"
  const textColor = isDark ? "text-white" : "text-black"
  const { language } = useUser()
  const t = translations[language].channelContent.blog

  return (
    <div className={`flex flex-col p-8 gap-2 ${textColor}`}>
      <p className="text-xl font-bold">{"> cat blog/README.md"}</p>
      <div className="text-lg font-mono font-semibold">
        <p>{t.title}</p>
        <ul className="list-disc list-inside ml-2">
          {t.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <Link
        to="/blog"
        className={`mt-4 px-3 py-1 border rounded-md text-xs font-bold self-start ${isDark ? "border-white/60 hover:bg-white/10" : "border-black/60 hover:bg-black/10"}`}
      >
        {t.action} →
      </Link>
    </div>
  )
}

export default BlogChannel

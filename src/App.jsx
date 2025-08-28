"use client"

import { Routes, Route, useLocation } from "react-router-dom"
import { useEffect } from "react"
import Layout from "./scenes/Layout"
import Home from "./pages/Home"
import About from "./pages/About"
import Blog from "./pages/Blog"

function ScrollRestoration() {
  const location = useLocation()
  useEffect(() => {
    const isBlog = location.pathname === '/blog'
    const sp = new URLSearchParams(location.search)
    const hasPost = !!sp.get('post')
    // Preserve scroll only on Blog when a post is open via ?post=
    if (isBlog && hasPost) return
    // Otherwise, reset to top
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, location.search])
  return null
}

function App() {
  return (
    <>
      <ScrollRestoration />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

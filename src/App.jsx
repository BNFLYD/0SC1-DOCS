"use client"

import { Routes, Route } from "react-router-dom"
import Layout from "./scenes/Layout"
import Home from "./pages/Home"
import About from "./pages/About"
import Blog from "./pages/Blog"

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
      </Routes>
    </Layout>
  )
}

export default App

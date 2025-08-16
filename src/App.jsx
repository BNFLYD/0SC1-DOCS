"use client"

import { Routes, Route } from "react-router-dom"
import Layout from "./scenes/Layout"
import Home from "./pages/Home"
import About from "./pages/About"
import Blog from "./pages/Blog"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
      </Route>
    </Routes>
  )
}

export default App

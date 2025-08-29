import React from 'react'
import { useOutletContext } from 'react-router-dom'

export default function Lang({ show, children }) {
  const { language: lang } = useOutletContext()
  const list = Array.isArray(show) ? show : [show]
  return list.includes(lang) ? <>{children}</> : null
}

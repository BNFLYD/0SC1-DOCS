import { addIcon } from '@iconify/react'
import blacksunRaw from '../BlackSun logo.svg?raw'
import horneroRaw from '../Hornero logo.svg?raw'

// Registers custom Iconify icons from raw SVG assets.
// Call this once at app startup or in a top-level route.
export default function registerCustomIcons() {
  try {
    if (typeof blacksunRaw === 'string' && blacksunRaw) {
      const m = blacksunRaw.match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/i)
      const width = m ? parseFloat(m[1]) : 24
      const height = m ? parseFloat(m[2]) : 24
      const inner = blacksunRaw
        .replace(/^[\s\S]*?<svg[^>]*>/i, '')
        .replace(/<\/svg>\s*$/i, '')
      addIcon('custom:blacksun', { body: inner, width, height })
    }
    if (typeof horneroRaw === 'string' && horneroRaw) {
      const m = horneroRaw.match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/i)
      const width = m ? parseFloat(m[1]) : 24
      const height = m ? parseFloat(m[2]) : 24
      const inner = horneroRaw
        .replace(/^[\s\S]*?<svg[^>]*>/i, '')
        .replace(/<\/svg>\s*$/i, '')
      addIcon('custom:hornero', { body: inner, width, height })
    }
  } catch (e) {
    // no-op; avoid breaking the app if parsing fails
    // console.error('[registerCustomIcons] failed:', e)
  }
}

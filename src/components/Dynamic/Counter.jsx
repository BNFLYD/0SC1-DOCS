import React, { useState } from 'react'

// Simple counter component inspired by the default React/Vite template
// Usage:
//   <Counter />
//   <Counter initial={10} step={2} />
export default function Counter({ initial = 0, step = 1, className = '' }) {
  const [count, setCount] = useState(initial)

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => setCount((c) => c + step)}
        className="px-3 py-1 rounded-md border text-xs font-bold transition-colors duration-200 border-black/50 text-black hover:text-white hover:bg-black dark:border-white/50 dark:text-white dark:hover:text-black dark:hover:bg-white"
        aria-label="Increment counter"
      >
        count is {count}
      </button>
      <p className="text-xs opacity-70 font-mono">
        Click the button to increment
      </p>
    </div>
  )
}

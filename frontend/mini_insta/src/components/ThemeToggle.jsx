import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext.jsx'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button className='theme-toggle' onClick={toggleTheme} aria-label='Toggle theme'>
      <motion.span
        className='theme-toggle-icon'
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>
    </button>
  )
}

export default ThemeToggle

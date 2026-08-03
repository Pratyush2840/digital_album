import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext.jsx'

const SunIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='12' cy='12' r='4.5' />
    <line x1='12' y1='2' x2='12' y2='4.5' />
    <line x1='12' y1='19.5' x2='12' y2='22' />
    <line x1='4.2' y1='4.2' x2='6' y2='6' />
    <line x1='18' y1='18' x2='19.8' y2='19.8' />
    <line x1='2' y1='12' x2='4.5' y2='12' />
    <line x1='19.5' y1='12' x2='22' y2='12' />
    <line x1='4.2' y1='19.8' x2='6' y2='18' />
    <line x1='18' y1='6' x2='19.8' y2='4.2' />
  </svg>
)

const MoonIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M20.5 14.5A9 9 0 1 1 9.5 3.5a7 7 0 0 0 11 11z' />
  </svg>
)

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button className='theme-toggle' onClick={toggleTheme} aria-label='Toggle theme'>
      <AnimatePresence mode='wait' initial={false}>
        <motion.span
          className='theme-toggle-icon'
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25 }}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export default ThemeToggle

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' }
  })
}

const features = [
  { icon: '📸', title: 'Share Posts', desc: 'Upload photos with captions and build your own visual feed in seconds.' },
  { icon: '❤️', title: 'Like & Comment', desc: 'React to posts you love and start conversations right underneath them.' },
  { icon: '🤝', title: 'Follow Requests', desc: 'Send and accept follow requests to grow your circle, your way.' }
]

const Landing = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className='landing'>
      <nav className='landing-nav'>
        <span className='nav-bar-logo'>Mini Insta</span>
        <div className='nav-links'>
          <a href='#features'>Features</a>
          <a href='#preview'>Preview</a>
        </div>
        <ThemeToggle />
        {isAuthenticated ? (
          <Link to='/feed' className='btn-primary' style={{ textDecoration: 'none' }}>Go to Feed</Link>
        ) : (
          <>
            <Link to='/login' className='btn-secondary' style={{ textDecoration: 'none' }}>Login</Link>
            <Link to='/register' className='btn-primary' style={{ textDecoration: 'none' }}>Sign up</Link>
          </>
        )}
      </nav>

      <section className='landing-hero'>
        <span className='landing-blob one' />
        <span className='landing-blob two' />

        <motion.div
          className='landing-hero-text'
          initial='hidden'
          animate='show'
        >
          <motion.h1 variants={fadeUp} custom={0}>
            Share your moments.<br />
            <span className='landing-gradient-text'>Build your circle.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={1}>
            A tiny Instagram-style app to post photos, like and comment on your
            friends' moments, and follow the people you care about.
          </motion.p>
          <motion.div className='landing-cta' variants={fadeUp} custom={2}>
            {isAuthenticated ? (
              <Link to='/feed' className='btn-primary' style={{ textDecoration: 'none' }}>Go to Feed</Link>
            ) : (
              <>
                <Link to='/register' className='btn-primary' style={{ textDecoration: 'none' }}>Get started</Link>
                <Link to='/login' className='btn-secondary' style={{ textDecoration: 'none' }}>I have an account</Link>
              </>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          id='preview'
          className='phone-mock'
          initial={{ opacity: 0, y: 40, rotate: 6 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <span className='phone-mock-notch' />
          <div className='phone-mock-screen'>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className='phone-mock-post'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.2 }}
              >
                <div className='phone-mock-post-img' />
                <div className='phone-mock-row'>
                  <motion.span
                    className='phone-mock-heart'
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5, delay: i * 0.4 }}
                  >
                    ♥
                  </motion.span>
                  <span>{12 + i * 7} likes</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id='features' className='landing-features'>
        <motion.h2
          className='landing-section-title'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          Everything you need to connect
        </motion.h2>
        <motion.p
          className='landing-section-subtitle'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Simple, fast, and built for sharing what matters.
        </motion.p>

        <div className='landing-feature-grid'>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className='landing-feature-card'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
            >
              <span className='landing-feature-icon'>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className='landing-footer'>
        Mini Insta &mdash; a small project, built for fun.
      </footer>
    </div>
  )
}

export default Landing

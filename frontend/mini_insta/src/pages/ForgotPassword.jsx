import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className='auth-section'>
      <div className='auth-topbar'>
        <Link to='/' className='nav-bar-logo'>Mini Insta</Link>
        <ThemeToggle />
      </div>
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type='email'
          placeholder='Your account email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className='auth-error'>{error}</p>}
        {message && <p className='auth-success'>{message}</p>}
        <button type='submit' className='btn-primary' disabled={submitting}>Send Reset Link</button>
      </form>
      <p><Link to='/login'>Back to login</Link></p>
    </section>
  )
}

export default ForgotPassword

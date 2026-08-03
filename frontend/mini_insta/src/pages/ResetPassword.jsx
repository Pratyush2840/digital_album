import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      navigate('/login')
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
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type='password'
          placeholder='New password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type='password'
          placeholder='Confirm new password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className='auth-error'>{error}</p>}
        <button type='submit' className='btn-primary' disabled={submitting}>Reset Password</button>
      </form>
    </section>
  )
}

export default ResetPassword

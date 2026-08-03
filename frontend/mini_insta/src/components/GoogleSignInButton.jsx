import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const GoogleSignInButton = ({ onError }) => {
  const buttonRef = useRef(null)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    let cancelled = false

    const renderButton = () => {
      if (cancelled || !window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential)
            navigate('/feed')
          } catch (err) {
            onError?.(err.response?.data?.message || 'Google sign-in failed')
          }
        }
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 260
      })
    }

    if (window.google) {
      renderButton()
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          renderButton()
        }
      }, 200)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }
  }, [loginWithGoogle, navigate, onError])

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null
  }

  return <div className='google-signin-button' ref={buttonRef} />
}

export default GoogleSignInButton

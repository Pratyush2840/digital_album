import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NavBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className='nav-bar'>
      <Link to='/feed'>Feed</Link>
      <Link to='/create-post'>Create Post</Link>
      <span className='nav-spacer' />
      {user && <span className='nav-username'>{user.username}</span>}
      <button onClick={handleLogout}>Logout</button>
    </nav>
  )
}

export default NavBar

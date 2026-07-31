import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const NavBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className='nav-bar'>
      <Link to='/feed' className='nav-bar-logo'>Mini Insta</Link>
      <Link to='/feed'>Feed</Link>
      <Link to='/create-post'>Create Post</Link>
      <Link to='/people'>People</Link>
      <Link to='/requests'>Requests</Link>
      <Link to='/saved'>Saved</Link>
      <span className='nav-spacer' />
      <ThemeToggle />
      {user && <Link to={`/profile/${user.id}`} className='nav-username'>@{user.username}</Link>}
      <button className='btn-secondary' onClick={handleLogout}>Logout</button>
    </nav>
  )
}

export default NavBar

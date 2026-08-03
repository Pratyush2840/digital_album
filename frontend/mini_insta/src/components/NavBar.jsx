import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const navLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

const NavBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className='nav-bar'>
      <NavLink to='/feed' className='nav-bar-logo'>Mini Insta</NavLink>
      <div className='nav-links'>
        <NavLink to='/feed' className={navLinkClass}>Feed</NavLink>
        <NavLink to='/create-post' className={navLinkClass}>Create Post</NavLink>
        <NavLink to='/people' className={navLinkClass}>People</NavLink>
        <NavLink to='/requests' className={navLinkClass}>Requests</NavLink>
        <NavLink to='/saved' className={navLinkClass}>Saved</NavLink>
      </div>
      <span className='nav-spacer' />
      <ThemeToggle />
      {user && <NavLink to={`/profile/${user.id}`} className='nav-username'>@{user.username}</NavLink>}
      <button className='btn-secondary' onClick={handleLogout}>Logout</button>
    </nav>
  )
}

export default NavBar

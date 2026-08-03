import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'

const People = () => {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])

  const search = (q) => {
    api.get('/users/search', { params: { q } }).then((res) => setUsers(res.data.users))
  }

  useEffect(() => {
    search('')
  }, [])

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    search(value)
  }

  const handleFollowRequest = (userId) => {
    api.post(`/users/${userId}/follow-request`)
      .then(() => search(query))
  }

  return (
    <>
      <NavBar />
      <section className='people-section'>
        <input
          className='people-search-input'
          type='text'
          placeholder='Search people by username...'
          value={query}
          onChange={handleChange}
        />

        {users.map((u) => (
          <div key={u.id} className='user-row'>
            <div className='user-avatar'>{u.username.charAt(0).toUpperCase()}</div>
            <Link to={`/profile/${u.id}`} className='user-username'>
              @{u.username}
              {u.isPrivate && <span className='profile-private-badge' title='Private account'>🔒</span>}
            </Link>
            {u.isFollowing ? (
              <button className='btn-secondary' disabled>Following</button>
            ) : u.requestSent ? (
              <button className='btn-secondary' disabled>Requested</button>
            ) : (
              <button className='btn-primary' onClick={() => handleFollowRequest(u.id)}>Follow</button>
            )}
          </div>
        ))}

        {users.length === 0 && <p className='empty-state'>No users found.</p>}
      </section>
    </>
  )
}

export default People

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'

const FollowRequests = () => {
  const [requests, setRequests] = useState([])

  const load = () => {
    api.get('/users/requests').then((res) => setRequests(res.data.requests))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAccept = (userId) => {
    api.post(`/users/${userId}/accept-request`).then(load)
  }

  const handleReject = (userId) => {
    api.post(`/users/${userId}/reject-request`).then(load)
  }

  return (
    <>
      <NavBar />
      <section className='requests-section'>
        <h2>Follow Requests</h2>

        {requests.map((u) => (
          <div key={u.id} className='user-row'>
            <div className='user-avatar'>{u.username.charAt(0).toUpperCase()}</div>
            <Link to={`/profile/${u.id}`} className='user-username'>@{u.username}</Link>
            <button className='btn-primary' onClick={() => handleAccept(u.id)}>Accept</button>
            <button className='btn-danger' onClick={() => handleReject(u.id)}>Reject</button>
          </div>
        ))}

        {requests.length === 0 && <p className='empty-state'>No pending follow requests.</p>}
      </section>
    </>
  )
}

export default FollowRequests

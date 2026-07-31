import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const Profile = () => {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [busy, setBusy] = useState(false)

  const load = () => {
    api.get(`/users/${id}`).then((res) => setProfile(res.data.user))
    api.get(`/users/${id}/posts`).then((res) => setPosts(res.data.posts))
  }

  useEffect(() => {
    load()
  }, [id])

  const handleFollowRequest = () => {
    setBusy(true)
    api.post(`/users/${id}/follow-request`)
      .then(load)
      .finally(() => setBusy(false))
  }

  const handleUnfollow = () => {
    setBusy(true)
    api.post(`/users/${id}/unfollow`)
      .then(load)
      .finally(() => setBusy(false))
  }

  const handleDeletePost = (postId) => {
    if (!window.confirm('Delete this post?')) return
    api.delete(`/posts/${postId}`).then(load)
  }

  if (!profile) {
    return (
      <>
        <NavBar />
        <section className='profile-section'>
          <p className='empty-state'>Loading profile...</p>
        </section>
      </>
    )
  }

  const isOwnProfile = currentUser && currentUser.id === id

  return (
    <>
      <NavBar />
      <section className='profile-section'>
        <div className='profile-header'>
          <div className='profile-avatar'>{profile.username.charAt(0).toUpperCase()}</div>
          <div>
            <h2>@{profile.username}</h2>
            <div className='profile-stats'>
              <span>{profile.followersCount} followers</span>
              <span>{profile.followingCount} following</span>
            </div>
            {!isOwnProfile && (
              <div style={{ marginTop: 14 }}>
                {profile.isFollowing ? (
                  <button className='btn-danger' disabled={busy} onClick={handleUnfollow}>Unfollow</button>
                ) : profile.requestSent ? (
                  <button className='btn-secondary' disabled>Request sent</button>
                ) : (
                  <button className='btn-primary' disabled={busy} onClick={handleFollowRequest}>Follow</button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='profile-posts-grid'>
          {posts.map((post) => (
            <div key={post._id} className='profile-post-tile'>
              <img src={post.image} alt={post.caption} />
              {isOwnProfile && (
                <button className='profile-post-delete' onClick={() => handleDeletePost(post._id)}>Delete</button>
              )}
            </div>
          ))}
        </div>
        {posts.length === 0 && <p className='empty-state'>No posts yet.</p>}
      </section>
    </>
  )
}

export default Profile

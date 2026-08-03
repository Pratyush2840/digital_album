import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const Profile = () => {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [busy, setBusy] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [bioDraft, setBioDraft] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [privateDraft, setPrivateDraft] = useState(true)

  const load = () => {
    api.get(`/users/${id}`).then((res) => {
      setProfile(res.data.user)
      if (res.data.user.canViewPosts) {
        api.get(`/users/${id}/posts`).then((r) => setPosts(r.data.posts))
      } else {
        setPosts([])
      }
    })
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

  const startEditProfile = () => {
    setNameDraft(profile.name || '')
    setBioDraft(profile.bio || '')
    setPrivateDraft(profile.isPrivate)
    setAvatarFile(null)
    setIsEditing(true)
  }

  const handleProfileSave = (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', nameDraft)
    formData.append('bio', bioDraft)
    formData.append('isPrivate', privateDraft)
    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }

    setBusy(true)
    api.patch('/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        setIsEditing(false)
        load()
      })
      .finally(() => setBusy(false))
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
          {profile.avatar ? (
            <img className='profile-avatar profile-avatar-img' src={profile.avatar} alt={profile.username} />
          ) : (
            <div className='profile-avatar'>{profile.username.charAt(0).toUpperCase()}</div>
          )}
          <div>
            <h2>
              {profile.name || `@${profile.username}`}
              {profile.isPrivate && <span className='profile-private-badge' title='Private account'>🔒</span>}
            </h2>
            {profile.name && <p className='profile-username-sub'>@{profile.username}</p>}
            {profile.bio && <p className='profile-bio'>{profile.bio}</p>}
            <div className='profile-stats'>
              <span>{profile.followersCount} followers</span>
              <span>{profile.followingCount} following</span>
            </div>
            {isOwnProfile ? (
              <div style={{ marginTop: 14 }}>
                <button className='btn-secondary' onClick={startEditProfile}>Edit Profile</button>
              </div>
            ) : (
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

        {isEditing && (
          <form className='profile-edit-form' onSubmit={handleProfileSave}>
            <label>
              Name
              <input type='text' value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder='Your name' />
            </label>
            <label>
              Bio
              <textarea value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} placeholder='Tell people about yourself' />
            </label>
            <label>
              Avatar
              <input type='file' accept='image/*' onChange={(e) => setAvatarFile(e.target.files[0])} />
            </label>
            <label className='profile-edit-checkbox'>
              <input type='checkbox' checked={privateDraft} onChange={(e) => setPrivateDraft(e.target.checked)} />
              Private account (only followers can see your posts)
            </label>
            <div className='profile-edit-actions'>
              <button type='submit' className='btn-primary' disabled={busy}>Save</button>
              <button type='button' className='btn-secondary' onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        )}

        {profile.canViewPosts ? (
          <>
            <div className='profile-posts-grid'>
              {posts.map((post) => (
                <div key={post._id} className='profile-post-tile'>
                  <Link to={`/post/${post._id}`}>
                    <img src={post.image} alt={post.caption} />
                  </Link>
                  {isOwnProfile && (
                    <button className='profile-post-delete' onClick={() => handleDeletePost(post._id)}>Delete</button>
                  )}
                </div>
              ))}
            </div>
            {posts.length === 0 && <p className='empty-state'>No posts yet.</p>}
          </>
        ) : (
          <div className='profile-locked'>
            <span className='profile-locked-icon'>🔒</span>
            <p>This account is private.</p>
            <p className='profile-username-sub'>{profile.requestSent ? 'Your follow request is pending.' : 'Follow this account to see their posts.'}</p>
          </div>
        )}
      </section>
    </>
  )
}

export default Profile

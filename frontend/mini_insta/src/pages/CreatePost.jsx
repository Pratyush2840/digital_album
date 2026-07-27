import React, { useState } from 'react'
import api from '../utils/api.js'
import {useNavigate} from 'react-router-dom'
import NavBar from '../components/NavBar.jsx'




const CreatePost = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async(e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
    api.post('/create-post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })    .then((res) => {
      navigate('/feed');
    })
    .catch((err) => {
      setError(err.response?.data?.message || 'Failed to create post');
    })
  }
  return (
    <>
      <NavBar />
      <section className='create-post-section'>
        <h1>Create Post</h1>

        <form onSubmit={handleSubmit}>
          <input type="file" name='image' accept = "image/*" />
          <input type="text" name='caption' placeholder='Enter Caption' required />
          {error && <p className="auth-error">{error}</p>}
          <button type='submit' className='btn-primary'>Create Post</button>
        </form>
      </section>
    </>
  )
}

export default CreatePost

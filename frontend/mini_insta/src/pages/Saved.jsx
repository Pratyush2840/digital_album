import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import Spinner from '../components/Spinner.jsx'

const Saved = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    const loadSaved = () => {
        api.get('/users/me/saved')
        .then((res) => setPosts(res.data.posts))
        .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadSaved()
    }, [])

    const handleUnsave = (postId) => {
        api.post(`/posts/${postId}/save`)
        .then(() => loadSaved())
    }

    return (
        <>
            <NavBar />
            <section className='feed-section'>
                {
                    loading ? (
                        <Spinner label='Loading saved posts...' />
                    ) : posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post._id} className='post-card'>
                                <Link to={`/post/${post._id}`}>
                                    <img src={post.image} alt='Post' />
                                </Link>
                                <div className='post-header'>
                                    {post.user?.username && (
                                        <Link to={`/profile/${post.user._id}`} className='post-author'>@{post.user.username}</Link>
                                    )}
                                    <button className='save-button saved' onClick={() => handleUnsave(post._id)}>★ Unsave</button>
                                </div>
                                <p>{post.caption}</p>
                            </div>
                        ))
                    ) : (
                        <p className='empty-state'>No saved posts yet.</p>
                    )
                }
            </section>
        </>
    )
}

export default Saved

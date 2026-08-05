import React, { useEffect, useState } from 'react'
import NavBar from '../components/NavBar.jsx'
import Spinner from '../components/Spinner.jsx'
import api from '../utils/api.js'

const Archived = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    const load = () => {
        api.get('/users/me/archived')
            .then((res) => setPosts(res.data.posts))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        load()
    }, [])

    const handleUnarchive = (postId) => {
        api.patch(`/posts/${postId}/archive`).then(load)
    }

    return (
        <>
            <NavBar />
            <section className='profile-section'>
                <h2>Archived Posts</h2>
                {loading ? (
                    <Spinner label='Loading archived posts...' />
                ) : posts.length > 0 ? (
                    <div className='profile-posts-grid'>
                        {posts.map((post) => (
                            <div key={post._id} className='profile-post-tile'>
                                <img src={post.image} alt={post.caption} />
                                <div className='profile-post-actions'>
                                    <button className='profile-post-archive' onClick={() => handleUnarchive(post._id)}>Unarchive</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className='empty-state'>No archived posts.</p>
                )}
            </section>
        </>
    )
}

export default Archived

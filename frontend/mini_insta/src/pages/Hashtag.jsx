import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import Spinner from '../components/Spinner.jsx'
import PostImages from '../components/PostImages.jsx'
import CaptionText from '../components/CaptionText.jsx'

const Hashtag = () => {
    const { tag } = useParams()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.get(`/hashtags/${tag}`)
            .then((res) => setPosts(res.data.posts))
            .finally(() => setLoading(false))
    }, [tag])

    return (
        <>
            <NavBar />
            <section className='feed-section'>
                <h2>#{tag}</h2>
                {loading ? (
                    <Spinner label='Loading posts...' />
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <div key={post._id} className='post-card'>
                            <PostImages post={post} />
                            {post.user?.username && (
                                <Link to={`/profile/${post.user._id}`} className='post-author'>@{post.user.username}</Link>
                            )}
                            <p><CaptionText text={post.caption} /></p>
                        </div>
                    ))
                ) : (
                    <p className='empty-state'>No posts found for #{tag}.</p>
                )}
            </section>
        </>
    )
}

export default Hashtag

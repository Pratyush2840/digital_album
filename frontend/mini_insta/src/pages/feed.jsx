import React , {useState , useEffect} from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const Feed = () => {
    const [posts, setposts] = useState([])
    const [commentDrafts, setCommentDrafts] = useState({})
    const [savedIds, setSavedIds] = useState([])
    const { user } = useAuth()

    const loadPosts = () => {
        api.get('/posts')
        .then((res)=>{
            setposts(res.data.posts)
        })
    }

    const loadSaved = () => {
        api.get('/users/me/saved')
        .then((res) => setSavedIds(res.data.posts.map((p) => p._id)))
    }

    useEffect(() => {
        loadPosts()
        loadSaved()
    } , [])

    const handleSave = (postId) => {
        api.post(`/posts/${postId}/save`)
        .then(() => loadSaved())
    }

    const handleLike = (postId) => {
        api.post(`/posts/${postId}/like`)
        .then(() => loadPosts())
    }

    const handleDelete = (postId) => {
        if (!window.confirm('Delete this post?')) return
        api.delete(`/posts/${postId}`)
        .then(() => loadPosts())
    }

    const handleCommentChange = (postId, value) => {
        setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
    }

    const handleCommentSubmit = (e, postId) => {
        e.preventDefault()
        const text = commentDrafts[postId]
        if (!text || !text.trim()) return
        api.post(`/posts/${postId}/comments`, { text })
        .then(() => {
            setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
            loadPosts()
        })
    }

  return (
    <>
      <NavBar />
      <section className='feed-section'>
      {
        posts.length > 0 ? (
            posts.map((post) => {
                const isLiked = user && post.likes?.some((id) => id === user.id)
                const isSaved = savedIds.includes(post._id)
                return (
                    <div key={post._id} className='post-card'>
                        <img src={post.image} alt='Post' />
                        <div className='post-header'>
                            {post.user?.username && (
                                <Link to={`/profile/${post.user._id}`} className='post-author'>@{post.user.username}</Link>
                            )}
                            {user && post.user?._id === user.id && (
                                <button className='post-delete-button' onClick={() => handleDelete(post._id)}>Delete</button>
                            )}
                        </div>
                        <p>{post.caption}</p>

                        <div className='post-actions'>
                            <button
                                className={isLiked ? 'like-button liked' : 'like-button'}
                                onClick={() => handleLike(post._id)}
                            >
                                {isLiked ? '♥' : '♡'} {post.likes?.length || 0}
                            </button>
                            <button
                                className={isSaved ? 'save-button saved' : 'save-button'}
                                onClick={() => handleSave(post._id)}
                            >
                                {isSaved ? '★ Saved' : '☆ Save'}
                            </button>
                        </div>

                        <div className='post-comments'>
                            {post.comments?.map((comment) => (
                                <p key={comment._id} className='post-comment'>
                                    <strong>@{comment.user?.username}</strong> {comment.text}
                                </p>
                            ))}
                        </div>

                        <form className='comment-form' onSubmit={(e) => handleCommentSubmit(e, post._id)}>
                            <input
                                type='text'
                                placeholder='Add a comment...'
                                value={commentDrafts[post._id] || ''}
                                onChange={(e) => handleCommentChange(post._id, e.target.value)}
                            />
                            <button type='submit'>Post</button>
                        </form>
                    </div>
                )
            })
        ) : (
            <p>No posts available.</p>
        )
      }

      </section>
    </>
  )
}

export default Feed

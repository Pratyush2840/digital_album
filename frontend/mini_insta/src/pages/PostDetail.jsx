import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import Spinner from '../components/Spinner.jsx'
import PostImages from '../components/PostImages.jsx'
import CaptionText from '../components/CaptionText.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const PostDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [post, setPost] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [isSaved, setIsSaved] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [captionDraft, setCaptionDraft] = useState('')
    const [commentDraft, setCommentDraft] = useState('')
    const [replyDrafts, setReplyDrafts] = useState({})
    const [openReplyId, setOpenReplyId] = useState(null)

    const loadPost = () => {
        api.get(`/posts/${id}`)
            .then((res) => setPost(res.data.post))
            .catch((err) => {
                setErrorMessage(err.response?.status === 403 ? 'This account is private.' : 'Post not found.')
            })
    }

    const loadSaved = () => {
        api.get('/users/me/saved')
            .then((res) => setIsSaved(res.data.posts.some((p) => p._id === id)))
    }

    useEffect(() => {
        loadPost()
        loadSaved()
    }, [id])

    const handleLike = () => {
        api.post(`/posts/${id}/like`).then(loadPost)
    }

    const handleSave = () => {
        api.post(`/posts/${id}/save`).then(loadSaved)
    }

    const handleDelete = () => {
        if (!window.confirm('Delete this post?')) return
        api.delete(`/posts/${id}`).then(() => navigate('/feed'))
    }

    const startEdit = () => {
        setCaptionDraft(post.caption || '')
        setIsEditing(true)
    }

    const handleCaptionSave = () => {
        if (!captionDraft.trim()) return
        api.patch(`/posts/${id}`, { caption: captionDraft })
            .then(() => {
                setIsEditing(false)
                loadPost()
            })
    }

    const handleCommentDelete = (commentId) => {
        api.delete(`/posts/${id}/comments/${commentId}`).then(loadPost)
    }

    const handleCommentLike = (commentId) => {
        api.post(`/posts/${id}/comments/${commentId}/like`).then(loadPost)
    }

    const handleCommentSubmit = (e) => {
        e.preventDefault()
        if (!commentDraft.trim()) return
        api.post(`/posts/${id}/comments`, { text: commentDraft })
            .then(() => {
                setCommentDraft('')
                loadPost()
            })
    }

    const toggleReplyBox = (commentId) => {
        setOpenReplyId((prev) => (prev === commentId ? null : commentId))
    }

    const handleReplyChange = (commentId, value) => {
        setReplyDrafts((prev) => ({ ...prev, [commentId]: value }))
    }

    const handleReplySubmit = (e, commentId) => {
        e.preventDefault()
        const text = replyDrafts[commentId]
        if (!text || !text.trim()) return
        api.post(`/posts/${id}/comments/${commentId}/replies`, { text })
            .then(() => {
                setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }))
                setOpenReplyId(null)
                loadPost()
            })
    }

    const handleReplyDelete = (commentId, replyId) => {
        api.delete(`/posts/${id}/comments/${commentId}/replies/${replyId}`).then(loadPost)
    }

    if (errorMessage) {
        return (
            <>
                <NavBar />
                <section className='feed-section'>
                    <p className='empty-state'>{errorMessage}</p>
                </section>
            </>
        )
    }

    if (!post) {
        return (
            <>
                <NavBar />
                <section className='feed-section'>
                    <Spinner label='Loading post...' />
                </section>
            </>
        )
    }

    const isLiked = user && post.likes?.some((likeId) => likeId === user.id)
    const isOwner = user && post.user?._id === user.id

    return (
        <>
            <NavBar />
            <section className='feed-section'>
                <div className='post-card'>
                    <PostImages post={post} />
                    <div className='post-header'>
                        {post.user?.username && (
                            <Link to={`/profile/${post.user._id}`} className='post-author'>@{post.user.username}</Link>
                        )}
                        {isOwner && (
                            <div className='post-owner-actions'>
                                <button className='post-edit-button' onClick={startEdit}>Edit</button>
                                <button className='post-delete-button' onClick={handleDelete}>Delete</button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className='caption-edit-form'>
                            <input
                                type='text'
                                value={captionDraft}
                                onChange={(e) => setCaptionDraft(e.target.value)}
                            />
                            <button onClick={handleCaptionSave}>Save</button>
                            <button className='btn-secondary' onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    ) : (
                        <p><CaptionText text={post.caption} /></p>
                    )}

                    <div className='post-actions'>
                        <button
                            className={isLiked ? 'like-button liked' : 'like-button'}
                            onClick={handleLike}
                        >
                            {isLiked ? '♥' : '♡'} {post.likes?.length || 0}
                        </button>
                        <button
                            className={isSaved ? 'save-button saved' : 'save-button'}
                            onClick={handleSave}
                        >
                            {isSaved ? '★ Saved' : '☆ Save'}
                        </button>
                    </div>

                    <div className='post-comments'>
                        {post.comments?.map((comment) => {
                            const canDelete = user && (comment.user?._id === user.id || isOwner)
                            const commentLiked = user && comment.likes?.some((likeId) => likeId === user.id)
                            return (
                                <div key={comment._id} className='post-comment-block'>
                                    <p className='post-comment'>
                                        <strong>@{comment.user?.username}</strong> {comment.text}
                                        <button
                                            className={commentLiked ? 'comment-like-button liked' : 'comment-like-button'}
                                            onClick={() => handleCommentLike(comment._id)}
                                        >
                                            {commentLiked ? '♥' : '♡'} {comment.likes?.length || 0}
                                        </button>
                                        <button
                                            className='comment-reply-button'
                                            onClick={() => toggleReplyBox(comment._id)}
                                        >
                                            Reply
                                        </button>
                                        {canDelete && (
                                            <button
                                                className='comment-delete-button'
                                                onClick={() => handleCommentDelete(comment._id)}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </p>

                                    {comment.replies?.length > 0 && (
                                        <div className='comment-replies'>
                                            {comment.replies.map((reply) => {
                                                const canDeleteReply = user && (reply.user?._id === user.id || isOwner)
                                                return (
                                                    <p key={reply._id} className='post-comment reply'>
                                                        <strong>@{reply.user?.username}</strong> {reply.text}
                                                        {canDeleteReply && (
                                                            <button
                                                                className='comment-delete-button'
                                                                onClick={() => handleReplyDelete(comment._id, reply._id)}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </p>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {openReplyId === comment._id && (
                                        <form
                                            className='comment-form reply-form'
                                            onSubmit={(e) => handleReplySubmit(e, comment._id)}
                                        >
                                            <input
                                                type='text'
                                                placeholder={`Reply to @${comment.user?.username}...`}
                                                value={replyDrafts[comment._id] || ''}
                                                onChange={(e) => handleReplyChange(comment._id, e.target.value)}
                                            />
                                            <button type='submit'>Reply</button>
                                        </form>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <form className='comment-form' onSubmit={handleCommentSubmit}>
                        <input
                            type='text'
                            placeholder='Add a comment...'
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                        />
                        <button type='submit'>Post</button>
                    </form>
                </div>
            </section>
        </>
    )
}

export default PostDetail

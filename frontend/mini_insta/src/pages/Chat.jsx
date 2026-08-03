import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api.js'
import NavBar from '../components/NavBar.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

const Chat = () => {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const socket = useSocket()
    const [conversations, setConversations] = useState([])
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [messages, setMessages] = useState([])
    const [draft, setDraft] = useState('')
    const bottomRef = useRef(null)

    const loadConversations = () => {
        api.get('/messages/conversations')
            .then((res) => setConversations(res.data.conversations))
            .finally(() => setLoadingConversations(false))
    }

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        if (!userId) {
            setMessages([])
            return
        }
        api.get(`/messages/${userId}`)
            .then((res) => setMessages(res.data.messages))
            .then(loadConversations)
    }, [userId])

    useEffect(() => {
        if (!socket) return
        const handleNewMessage = (msg) => {
            if (userId && (msg.sender === userId || msg.recipient === userId)) {
                setMessages((prev) => [...prev, msg])
            }
            loadConversations()
        }
        socket.on('new-message', handleNewMessage)
        return () => socket.off('new-message', handleNewMessage)
    }, [socket, userId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = (e) => {
        e.preventDefault()
        if (!draft.trim() || !userId) return
        api.post(`/messages/${userId}`, { text: draft })
            .then(() => setDraft(''))
    }

    const activeConversation = conversations.find((c) => c.id === userId)

    return (
        <>
            <NavBar />
            <section className='chat-section'>
                <div className='chat-sidebar'>
                    <h3 className='chat-sidebar-title'>Messages</h3>
                    {loadingConversations ? (
                        <Spinner label='Loading chats...' />
                    ) : conversations.length === 0 ? (
                        <p className='empty-state'>No conversations yet. Chat unlocks once you and someone follow each other.</p>
                    ) : (
                        conversations.map((c) => (
                            <button
                                key={c.id}
                                className={c.id === userId ? 'chat-conversation active' : 'chat-conversation'}
                                onClick={() => navigate(`/chat/${c.id}`)}
                            >
                                <div className='user-avatar'>{c.username.charAt(0).toUpperCase()}</div>
                                <div className='chat-conversation-info'>
                                    <span className='chat-conversation-name'>{c.name || `@${c.username}`}</span>
                                    <span className='chat-conversation-preview'>{c.lastMessage || 'Say hello 👋'}</span>
                                </div>
                                {c.unreadCount > 0 && <span className='chat-unread-badge'>{c.unreadCount}</span>}
                            </button>
                        ))
                    )}
                </div>

                <div className='chat-thread'>
                    {!userId ? (
                        <p className='empty-state'>Select a conversation to start chatting.</p>
                    ) : (
                        <>
                            <div className='chat-thread-header'>
                                <Link to={`/profile/${userId}`}>@{activeConversation?.username}</Link>
                            </div>
                            <div className='chat-messages'>
                                {messages.map((m) => (
                                    <div
                                        key={m._id}
                                        className={m.sender === user.id ? 'chat-bubble mine' : 'chat-bubble'}
                                    >
                                        {m.text}
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>
                            <form className='chat-input-form' onSubmit={handleSend}>
                                <input
                                    type='text'
                                    placeholder='Type a message...'
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                />
                                <button type='submit' className='btn-primary'>Send</button>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </>
    )
}

export default Chat

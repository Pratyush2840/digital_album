import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import CreatePost from './pages/CreatePost.jsx'
import Feed from './pages/feed.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Landing from './pages/Landing.jsx'
import Profile from './pages/Profile.jsx'
import People from './pages/People.jsx'
import FollowRequests from './pages/FollowRequests.jsx'
import Saved from './pages/Saved.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Chat from './pages/Chat.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path='/' element={<Landing />} />
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/reset-password/:token' element={<ResetPassword />} />
              <Route path='/create-post' element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
              <Route path='/feed' element={<ProtectedRoute><Feed /></ProtectedRoute>} />
              <Route path='/people' element={<ProtectedRoute><People /></ProtectedRoute>} />
              <Route path='/requests' element={<ProtectedRoute><FollowRequests /></ProtectedRoute>} />
              <Route path='/saved' element={<ProtectedRoute><Saved /></ProtectedRoute>} />
              <Route path='/post/:id' element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
              <Route path='/profile/:id' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path='/chat' element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path='/chat/:userId' element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

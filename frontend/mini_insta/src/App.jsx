import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import CreatePost from './pages/CreatePost.jsx'
import Feed from './pages/feed.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Landing from './pages/Landing.jsx'
import Profile from './pages/Profile.jsx'
import People from './pages/People.jsx'
import FollowRequests from './pages/FollowRequests.jsx'
import Saved from './pages/Saved.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/create-post' element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path='/feed' element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path='/people' element={<ProtectedRoute><People /></ProtectedRoute>} />
            <Route path='/requests' element={<ProtectedRoute><FollowRequests /></ProtectedRoute>} />
            <Route path='/saved' element={<ProtectedRoute><Saved /></ProtectedRoute>} />
            <Route path='/profile/:id' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

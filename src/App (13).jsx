// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './components/auth/AuthPage'
import FeedPage from './components/feed/FeedPage'
import ReelsPage from './components/reels/ReelsPage'
import StoriesPage from './components/stories/StoriesPage'
import TweetsPage from './components/tweets/TweetsPage'
import MessagesPage from './components/messages/MessagesPage'
import NotificationsPage from './components/notifications/NotificationsPage'
import ProfilePage from './components/profile/ProfilePage'
import ExplorePage from './components/feed/ExplorePage'

const Protected = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/auth" replace />
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#fff',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#0f0f13' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#0f0f13' } },
          }}
        />
        <Routes>
          <Route path="/auth" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />
          <Route path="/" element={
            <Protected><AppLayout /></Protected>
          }>
            <Route index          element={<FeedPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="reels"   element={<ReelsPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="tweets"  element={<TweetsPage />} />
            <Route path="messages"           element={<MessagesPage />} />
            <Route path="messages/:chatId"   element={<MessagesPage />} />
            <Route path="notifications"      element={<NotificationsPage />} />
            <Route path="profile/:uid"       element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

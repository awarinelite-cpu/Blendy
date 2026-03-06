// src/components/feed/FeedPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPublicFeed } from '../../firebase/postService'
import PostCard from './PostCard'
import StoriesRow from '../stories/StoriesRow'
import SuggestedUsers from '../profile/SuggestedUsers'
import { HiSparkles } from 'react-icons/hi'

export default function FeedPage() {
  const { user, profile } = useAuth()
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = getPublicFeed('post', (data) => {
      setPosts(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="flex max-w-6xl mx-auto px-4 py-6 gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        {/* Stories */}
        <StoriesRow />

        {/* Feed header */}
        <div className="flex items-center gap-2 mb-4">
          <HiSparkles className="w-5 h-5 text-brand-400" />
          <h2 className="font-display font-bold text-lg text-white">Your Feed</h2>
        </div>

        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <EmptyFeed />
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0">
        <SuggestedUsers />
      </aside>
    </div>
  )
}

function FeedSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="card mb-3 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full shimmer-bg" />
        <div className="flex-1">
          <div className="h-3 shimmer-bg rounded w-32 mb-2" />
          <div className="h-2 shimmer-bg rounded w-24" />
        </div>
      </div>
      <div className="h-3 shimmer-bg rounded mb-2" />
      <div className="h-3 shimmer-bg rounded w-3/4 mb-4" />
      <div className="h-48 shimmer-bg rounded-xl" />
    </div>
  ))
}

function EmptyFeed() {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">🌟</div>
      <h3 className="font-display font-bold text-xl text-white mb-2">Nothing here yet</h3>
      <p className="text-gray-500 text-sm">Follow some people or create your first post!</p>
    </div>
  )
}

// src/components/stories/StoriesPage.jsx
import { useState, useEffect } from 'react'
import { getPublicFeed } from '../../firebase/postService'
import { getUserProfile } from '../../firebase/userService'
import { formatDistanceToNow } from 'date-fns'
import { HiPhotograph } from 'react-icons/hi'

export default function StoriesPage() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [active,  setActive]  = useState(null)

  useEffect(() => {
    const unsub = getPublicFeed('story', (data) => {
      setStories(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <HiPhotograph className="w-6 h-6 text-amber-400" />
        <h1 className="font-display font-bold text-2xl text-white">Stories</h1>
        <span className="text-sm text-gray-500 ml-2">Disappear in 24 hours</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="aspect-[9/16] rounded-2xl shimmer-bg" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📸</div>
          <h3 className="font-display font-bold text-xl text-white mb-2">No stories yet</h3>
          <p className="text-gray-500 text-sm">Create your first story!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stories.map(story => (
            <StoryCard key={story.id} story={story} onClick={() => setActive(story)} />
          ))}
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div className="max-w-sm w-full">
            {active.mediaType === 'video'
              ? <video src={active.mediaURL} className="w-full rounded-2xl" autoPlay controls />
              : <img src={active.mediaURL} className="w-full rounded-2xl" alt="" />
            }
            {active.content && (
              <p className="text-white text-center mt-3">{active.content}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StoryCard({ story, onClick }) {
  const [author, setAuthor] = useState(null)
  useEffect(() => { getUserProfile(story.uid).then(setAuthor) }, [story.uid])
  const time = story.createdAt?.toDate
    ? formatDistanceToNow(story.createdAt.toDate(), { addSuffix: true })
    : 'just now'

  return (
    <div
      onClick={onClick}
      className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group bg-surface-50"
    >
      {story.mediaType === 'video'
        ? <video src={story.mediaURL} className="w-full h-full object-cover" muted />
        : <img src={story.mediaURL} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {author?.photoURL
          ? <img src={author.photoURL} className="w-7 h-7 avatar ring-1 ring-amber-400" alt="" />
          : <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold">
              {(author?.displayName || '?')[0].toUpperCase()}
            </div>
        }
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-white text-xs font-medium">{author?.displayName}</p>
        <p className="text-gray-400 text-xs">{time}</p>
      </div>
    </div>
  )
}

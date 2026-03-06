// src/components/stories/StoriesRow.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPublicFeed, createPost, uploadMedia } from '../../firebase/postService'
import { getUserProfile } from '../../firebase/userService'
import { HiPlus, HiX } from 'react-icons/hi'
import { useRef } from 'react'
import toast from 'react-hot-toast'

export default function StoriesRow() {
  const { user, profile } = useAuth()
  const [stories,    setStories]   = useState([])
  const [viewing,    setViewing]   = useState(null) // story to view
  const [viewingIdx, setViewingIdx] = useState(0)
  const fileRef = useRef()

  useEffect(() => {
    const unsub = getPublicFeed('story', setStories)
    return unsub
  }, [])

  const handleAddStory = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      toast.loading('Uploading story…', { id: 'story' })
      const mediaURL  = await uploadMedia(user.uid, file, 'stories')
      const mediaType = file.type.startsWith('video') ? 'video' : 'image'
      await createPost(user.uid, {
        type: 'story', content: '', mediaURL, mediaType, isPublic: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      toast.dismiss('story')
      toast.success('Story added!')
    } catch (err) {
      toast.dismiss('story')
      toast.error('Failed: ' + err.message)
    }
  }

  // Group stories by user
  const grouped = stories.reduce((acc, s) => {
    if (!acc[s.uid]) acc[s.uid] = []
    acc[s.uid].push(s)
    return acc
  }, {})

  const storyGroups = Object.entries(grouped).map(([uid, stories]) => ({ uid, stories }))

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3 mb-5 scrollbar-hide no-scrollbar">
        {/* Add story */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => fileRef.current.click()}
            className="w-16 h-16 rounded-full bg-surface-50 border-2 border-dashed border-brand-500/40 hover:border-brand-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <HiPlus className="w-6 h-6 text-brand-400" />
          </button>
          <span className="text-xs text-gray-500 text-center w-16 truncate">Your story</span>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleAddStory} className="hidden" />
        </div>

        {/* Story bubbles */}
        {storyGroups.map(({ uid, stories: storyList }) => (
          <StoryBubble
            key={uid}
            uid={uid}
            stories={storyList}
            onClick={() => { setViewing(storyList); setViewingIdx(0) }}
          />
        ))}
      </div>

      {/* Story viewer */}
      {viewing && (
        <StoryViewer
          stories={viewing}
          idx={viewingIdx}
          onClose={() => setViewing(null)}
          onNext={() => {
            if (viewingIdx < viewing.length - 1) setViewingIdx(i => i + 1)
            else setViewing(null)
          }}
        />
      )}
    </>
  )
}

function StoryBubble({ uid, stories, onClick }) {
  const [author, setAuthor] = useState(null)
  useEffect(() => { getUserProfile(uid).then(setAuthor) }, [uid])

  return (
    <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={onClick}>
      <div className="story-gradient-border">
        <div className="w-14 h-14 rounded-full bg-surface-50 overflow-hidden ring-2 ring-surface m-0.5">
          {author?.photoURL
            ? <img src={author.photoURL} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full bg-brand-600 flex items-center justify-center text-lg font-bold">
                {(author?.displayName || '?')[0].toUpperCase()}
              </div>
          }
        </div>
      </div>
      <span className="text-xs text-gray-400 text-center w-16 truncate">{author?.username || '…'}</span>
    </div>
  )
}

function StoryViewer({ stories, idx, onClose, onNext }) {
  const story = stories[idx]
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { onNext(); return 0 }
        return p + 2
      })
    }, 100) // 5 seconds total
    return () => clearInterval(interval)
  }, [idx])

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onNext}>
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-8 right-4 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
      >
        <HiX className="w-5 h-5 text-white" />
      </button>

      {/* Media */}
      {story.mediaType === 'video'
        ? <video src={story.mediaURL} className="max-h-screen max-w-full" autoPlay loop playsInline />
        : <img src={story.mediaURL} className="max-h-screen max-w-full object-contain" alt="story" />
      }

      {story.content && (
        <div className="absolute bottom-10 left-4 right-4 text-white text-center font-medium text-lg drop-shadow-lg">
          {story.content}
        </div>
      )}
    </div>
  )
}

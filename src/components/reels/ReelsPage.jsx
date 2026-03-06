// src/components/reels/ReelsPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getReels, likePost, unlikePost, incrementViews } from '../../firebase/postService'
import { getUserProfile, followUser, unfollowUser } from '../../firebase/userService'
import { useInView } from 'react-intersection-observer'
import { HiHeart, HiOutlineHeart, HiChatAlt2, HiShare, HiVolumeUp, HiVolumeOff, HiFilm } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'

export default function ReelsPage() {
  const [reels,   setReels]   = useState([])
  const [current, setCurrent] = useState(0)
  const [muted,   setMuted]   = useState(false)
  const containerRef = useRef()

  useEffect(() => {
    const unsub = getReels(setReels)
    return unsub
  }, [])

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar relative" ref={containerRef}>
      {/* Mute toggle */}
      <button
        onClick={() => setMuted(m => !m)}
        className="fixed top-6 right-6 z-30 w-10 h-10 glass rounded-full flex items-center justify-center text-white"
      >
        {muted ? <HiVolumeOff className="w-5 h-5" /> : <HiVolumeUp className="w-5 h-5" />}
      </button>

      {reels.length === 0 && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <HiFilm className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
            <h3 className="font-display font-bold text-xl text-white mb-2">No Reels yet</h3>
            <p className="text-gray-500 text-sm">Be the first to post a reel!</p>
          </div>
        </div>
      )}

      {reels.map((reel, i) => (
        <ReelItem
          key={reel.id}
          reel={reel}
          isActive={i === current}
          muted={muted}
          onVisible={() => setCurrent(i)}
        />
      ))}
    </div>
  )
}

function ReelItem({ reel, isActive, muted, onVisible }) {
  const { user } = useAuth()
  const videoRef = useRef()
  const [author,  setAuthor]  = useState(null)
  const [liked,   setLiked]   = useState(reel.likes?.includes(user?.uid))
  const [likes,   setLikes]   = useState(reel.likesCount || 0)
  const [following, setFollowing] = useState(false)
  const [showDesc, setShowDesc]   = useState(false)

  const { ref: inViewRef, inView } = useInView({ threshold: 0.7 })

  useEffect(() => { getUserProfile(reel.uid).then(setAuthor) }, [reel.uid])

  useEffect(() => {
    if (inView) {
      onVisible()
      incrementViews(reel.id)
    }
  }, [inView])

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive && inView) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isActive, inView])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const handleLike = async () => {
    if (liked) {
      setLiked(false); setLikes(l => l - 1)
      await unlikePost(reel.id, user.uid)
    } else {
      setLiked(true); setLikes(l => l + 1)
      await likePost(reel.id, user.uid, reel.uid)
    }
  }

  return (
    <div ref={inViewRef} className="h-screen w-full snap-start relative flex items-center justify-center bg-black overflow-hidden">
      {reel.mediaURL ? (
        <video
          ref={videoRef}
          src={reel.mediaURL}
          className="h-full w-full object-cover"
          loop
          playsInline
          muted={muted}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-brand">
          <p className="text-white text-xl font-bold text-center px-8">{reel.content}</p>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />

      {/* Author info */}
      <div className="absolute bottom-24 left-4 right-20 text-white">
        <div className="flex items-center gap-2 mb-2">
          {author?.photoURL
            ? <img src={author.photoURL} className="w-8 h-8 avatar" alt="" />
            : <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold shrink-0">
                {(author?.displayName || '?')[0].toUpperCase()}
              </div>
          }
          <span className="font-semibold text-sm">@{author?.username}</span>
          <button
            onClick={() => setFollowing(f => !f)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              following ? 'border-white/30 text-white/60' : 'border-white text-white'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>
        {reel.content && (
          <p
            className={`text-sm text-gray-200 leading-relaxed ${showDesc ? '' : 'line-clamp-2'} cursor-pointer`}
            onClick={() => setShowDesc(d => !d)}
          >
            {reel.content}
            {!showDesc && reel.content.length > 80 && <span className="text-gray-400"> …more</span>}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          {liked
            ? <HiHeart className="w-8 h-8 text-red-400 animate-bounce-soft" />
            : <HiOutlineHeart className="w-8 h-8 text-white" />
          }
          <span className="text-white text-xs font-medium">{likes > 0 ? likes : ''}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <HiChatAlt2 className="w-7 h-7 text-white" />
          <span className="text-white text-xs">{reel.commentsCount || ''}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <HiShare className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  )
}

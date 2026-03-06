// src/components/feed/PostCard.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import {
  HiHeart, HiOutlineHeart,
  HiChat, HiShare,
  HiDotsHorizontal, HiTrash
} from 'react-icons/hi'
import { toggleLike, deletePost } from '../../firebase/postService'

export default function PostCard({ post }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const liked = post.likes?.includes(user?.uid)
  const likeCount = post.likes?.length ?? 0
  const commentCount = post.commentCount ?? 0

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user) return
    await toggleLike(post.id, user.uid)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this post?')) {
      await deletePost(post.id)
    }
    setShowMenu(false)
  }

  const handleShare = (e) => {
    e.stopPropagation()
    navigator.share?.({
      title: post.authorName,
      text: post.content,
      url: window.location.href,
    })
  }

  const timeAgo = post.createdAt
    ? formatDistanceToNow(post.createdAt.toDate?.() ?? new Date(post.createdAt), { addSuffix: true })
    : ''

  return (
    <div className="card mb-3 p-4 hover:bg-white/5 transition cursor-pointer"
      onClick={() => navigate(`/profile/${post.authorId}`)}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center flex-shrink-0"
            onClick={e => { e.stopPropagation(); navigate(`/profile/${post.authorId}`) }}
          >
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold">
                {post.authorName?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>

          {/* Name + time */}
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{post.authorName}</p>
            {post.authorUsername && (
              <p className="text-gray-500 text-xs">@{post.authorUsername}</p>
            )}
            <p className="text-gray-500 text-xs">{timeAgo}</p>
          </div>
        </div>

        {/* Menu */}
        {user?.uid === post.authorId && (
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
              className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <HiDotsHorizontal />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-10 min-w-[130px]">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-white/5 text-sm rounded-xl transition"
                >
                  <HiTrash /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-gray-200 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.imageURL && (
        <div className="rounded-xl overflow-hidden mb-3 max-h-96">
          <img
            src={post.imageURL}
            alt="post"
            className="w-full object-cover"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1" onClick={e => e.stopPropagation()}>
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition ${
            liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          {liked ? <HiHeart className="text-lg" /> : <HiOutlineHeart className="text-lg" />}
          <span>{likeCount > 0 ? likeCount : ''}</span>
        </button>

        {/* Comment */}
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-400 transition">
          <HiChat className="text-lg" />
          <span>{commentCount > 0 ? commentCount : ''}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition ml-auto"
        >
          <HiShare className="text-lg" />
        </button>
      </div>
    </div>
  )
}

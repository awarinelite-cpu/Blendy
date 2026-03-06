// src/components/tweets/TweetsPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPublicFeed, createPost, likePost, unlikePost, addComment } from '../../firebase/postService'
import { getUserProfile } from '../../firebase/userService'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { HiHashtag, HiHeart, HiOutlineHeart, HiChatAlt2, HiShare, HiRefresh } from 'react-icons/hi'

export default function TweetsPage() {
  const { user, profile } = useAuth()
  const [tweets,  setTweets]  = useState([])
  const [compose, setCompose] = useState('')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const unsub = getPublicFeed('tweet', (data) => {
      setTweets(data)
      setLoading(false)
    })
    setLoading(true)
    return unsub
  }, [])

  const handleTweet = async () => {
    if (!compose.trim() || compose.length > 280) return
    setPosting(true)
    try {
      await createPost(user.uid, { type: 'tweet', content: compose })
      setCompose('')
      toast.success('Tweeted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <HiHashtag className="w-6 h-6 text-cyan-400" />
        <h1 className="font-display font-bold text-2xl text-white">Tweets</h1>
      </div>

      {/* Compose */}
      <div className="card p-4 mb-5">
        <div className="flex gap-3">
          {profile?.photoURL
            ? <img src={profile.photoURL} className="w-10 h-10 avatar shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold shrink-0">
                {(profile?.displayName || 'U')[0].toUpperCase()}
              </div>
          }
          <div className="flex-1">
            <textarea
              value={compose}
              onChange={e => setCompose(e.target.value)}
              placeholder="What's happening?"
              maxLength={280}
              rows={3}
              className="w-full bg-transparent text-white text-base placeholder-gray-600 resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
              <span className={`text-xs ${compose.length > 260 ? 'text-red-400' : 'text-gray-600'}`}>
                {compose.length}/280
              </span>
              <button
                onClick={handleTweet}
                disabled={posting || !compose.trim() || compose.length > 280}
                className="btn-primary px-5 py-2 text-sm"
              >
                {posting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Tweeting…
                  </span>
                ) : 'Tweet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tweet feed */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full shimmer-bg shrink-0" />
                <div className="flex-1">
                  <div className="h-3 shimmer-bg rounded w-32 mb-2" />
                  <div className="h-3 shimmer-bg rounded mb-1" />
                  <div className="h-3 shimmer-bg rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tweets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="font-display font-bold text-xl text-white mb-2">No tweets yet</h3>
          <p className="text-gray-500 text-sm">Be the first to tweet!</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {tweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)}
        </div>
      )}
    </div>
  )
}

function TweetCard({ tweet }) {
  const { user } = useAuth()
  const [author, setAuthor] = useState(null)
  const [liked,  setLiked]  = useState(tweet.likes?.includes(user?.uid))
  const [likes,  setLikes]  = useState(tweet.likesCount || 0)

  useEffect(() => { getUserProfile(tweet.uid).then(setAuthor) }, [tweet.uid])

  const handleLike = async () => {
    if (liked) { setLiked(false); setLikes(l=>l-1); await unlikePost(tweet.id, user.uid) }
    else        { setLiked(true);  setLikes(l=>l+1); await likePost(tweet.id, user.uid, tweet.uid) }
  }

  const time = tweet.createdAt?.toDate
    ? formatDistanceToNow(tweet.createdAt.toDate(), { addSuffix: true })
    : 'just now'

  return (
    <div className="card mb-2 p-4 hover:bg-white/[0.02] transition-colors animate-fade-in">
      <div className="flex gap-3">
        {author?.photoURL
          ? <img src={author.photoURL} className="w-10 h-10 avatar shrink-0" alt="" />
          : <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm shrink-0">
              {(author?.displayName || '?')[0].toUpperCase()}
            </div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{author?.displayName}</span>
            <span className="text-gray-500 text-xs">@{author?.username}</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">{time}</span>
          </div>
          <p className="text-gray-200 text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">
            {tweet.content}
          </p>
          {tweet.mediaURL && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={tweet.mediaURL} className="w-full max-h-64 object-cover" alt="" />
            </div>
          )}
          <div className="flex items-center gap-6 mt-3 text-gray-500">
            <button className="flex items-center gap-1.5 text-xs hover:text-cyan-400 transition-colors">
              <HiChatAlt2 className="w-4 h-4" />
              <span>{tweet.commentsCount || ''}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs hover:text-green-400 transition-colors">
              <HiRefresh className="w-4 h-4" />
            </button>
            <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'hover:text-red-400'}`}>
              {liked ? <HiHeart className="w-4 h-4" /> : <HiOutlineHeart className="w-4 h-4" />}
              <span>{likes > 0 ? likes : ''}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs hover:text-brand-400 transition-colors">
              <HiShare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

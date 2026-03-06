// src/components/profile/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUserProfile, followUser, unfollowUser, updateUserProfile, uploadAvatar } from '../../firebase/userService'
import { getUserPosts } from '../../firebase/postService'
import PostCard from '../feed/PostCard'
import toast from 'react-hot-toast'
import { HiPencil, HiPhotograph, HiFilm, HiHashtag, HiGlobeAlt, HiCheckCircle } from 'react-icons/hi'

export default function ProfilePage() {
  const { uid }  = useParams()
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const isMe     = uid === user?.uid
  const [profile,  setProfile]  = useState(null)
  const [posts,    setPosts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [tab,      setTab]      = useState('posts')
  const [following, setFollowing] = useState(false)
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', website: '' })

  useEffect(() => {
    getUserProfile(uid).then(p => {
      setProfile(p)
      setEditForm({ displayName: p?.displayName || '', bio: p?.bio || '', website: p?.website || '' })
      setFollowing(myProfile?.following?.includes(uid) || false)
    })
    const unsub = getUserPosts(uid, (data) => {
      setPosts(data)
      setLoading(false)
    })
    return unsub
  }, [uid])

  const handleFollow = async () => {
    if (following) {
      setFollowing(false)
      setProfile(p => ({ ...p, followersCount: (p.followersCount||1) - 1 }))
      await unfollowUser(user.uid, uid)
    } else {
      setFollowing(true)
      setProfile(p => ({ ...p, followersCount: (p.followersCount||0) + 1 }))
      await followUser(user.uid, uid)
    }
    refreshProfile()
  }

  const handleSaveEdit = async () => {
    await updateUserProfile(uid, editForm)
    setProfile(p => ({ ...p, ...editForm }))
    setEditing(false)
    toast.success('Profile updated!')
    refreshProfile()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      toast.loading('Uploading…', { id: 'avatar' })
      const url = await uploadAvatar(uid, file)
      await updateUserProfile(uid, { photoURL: url })
      setProfile(p => ({ ...p, photoURL: url }))
      toast.dismiss('avatar')
      toast.success('Photo updated!')
      refreshProfile()
    } catch (err) {
      toast.dismiss('avatar')
      toast.error(err.message)
    }
  }

  const filtered = posts.filter(p => {
    if (tab === 'posts')  return p.type === 'post'
    if (tab === 'reels')  return p.type === 'reel'
    if (tab === 'tweets') return p.type === 'tweet'
    return true
  })

  if (!profile) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="card p-8 animate-pulse">
        <div className="flex gap-4 mb-6">
          <div className="w-24 h-24 rounded-full shimmer-bg" />
          <div className="flex-1">
            <div className="h-5 shimmer-bg rounded w-40 mb-3" />
            <div className="h-3 shimmer-bg rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile card */}
      <div className="card p-6 mb-5">
        {/* Cover / Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-brand-500/30 bg-surface-50">
              {profile.photoURL
                ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full bg-brand-600 flex items-center justify-center text-3xl font-bold">
                    {(profile.displayName || '?')[0].toUpperCase()}
                  </div>
              }
            </div>
            {isMe && (
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-500 transition-colors">
                <HiPencil className="w-3 h-3 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl text-white">{profile.displayName}</h1>
              {profile.verified && <HiCheckCircle className="w-5 h-5 text-brand-400" />}
            </div>
            <p className="text-gray-500 text-sm mb-2">@{profile.username}</p>
            {profile.bio && <p className="text-gray-300 text-sm">{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-400 text-sm mt-1 hover:underline">
                <HiGlobeAlt className="w-4 h-4" /> {profile.website}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-4 py-3 border-y border-white/5">
          <div className="text-center">
            <p className="font-display font-bold text-lg text-white">{profile.postsCount || 0}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-lg text-white">{profile.followersCount || 0}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-lg text-white">{profile.followingCount || 0}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>

        {/* Actions */}
        {isMe ? (
          editing ? (
            <div className="space-y-3">
              <input
                value={editForm.displayName}
                onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="Display name"
                className="input-field py-2 text-sm"
              />
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Bio"
                rows={2}
                className="input-field py-2 text-sm resize-none"
              />
              <input
                value={editForm.website}
                onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                placeholder="Website URL"
                className="input-field py-2 text-sm"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="btn-primary flex-1 py-2 text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1 py-2 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-ghost w-full py-2 border border-white/10 text-sm font-medium">
              Edit Profile
            </button>
          )
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleFollow}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                following
                  ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 border border-white/10'
                  : 'btn-primary'
              }`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      {/* Post tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl mb-4">
        {[
          { key: 'posts',  label: 'Posts',  icon: HiPhotograph },
          { key: 'reels',  label: 'Reels',  icon: HiFilm },
          { key: 'tweets', label: 'Tweets', icon: HiHashtag },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({length:2}).map((_,i)=>(
            <div key={i} className="card p-4 animate-pulse h-40 shimmer-bg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-600">
          <p>No {tab} yet</p>
        </div>
      ) : (
        filtered.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  )
}

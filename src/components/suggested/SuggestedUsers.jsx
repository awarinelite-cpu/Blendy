// src/components/profile/SuggestedUsers.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { followUser, unfollowUser } from '../../firebase/userService'
import { Link } from 'react-router-dom'
import { HiSparkles } from 'react-icons/hi'

export default function SuggestedUsers() {
  const { user, profile, refreshProfile } = useAuth()
  const [users,     setUsers]    = useState([])
  const [following, setFollowing] = useState({})

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'users'), orderBy('followersCount', 'desc'), limit(8))
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid)
      setUsers(all.slice(0, 5))
      const initFollowing = {}
      all.forEach(u => { initFollowing[u.id] = profile?.following?.includes(u.id) || false })
      setFollowing(initFollowing)
    }
    load()
  }, [user.uid])

  const handleToggle = async (uid) => {
    const isFollowing = following[uid]
    setFollowing(f => ({ ...f, [uid]: !isFollowing }))
    if (isFollowing) await unfollowUser(user.uid, uid)
    else             await followUser(user.uid, uid)
    refreshProfile()
  }

  if (!users.length) return null

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <HiSparkles className="w-4 h-4 text-brand-400" />
        <h3 className="font-display font-semibold text-sm text-white">Who to follow</h3>
      </div>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3">
            <Link to={`/profile/${u.id}`} className="shrink-0">
              {u.photoURL
                ? <img src={u.photoURL} className="w-9 h-9 avatar" alt="" />
                : <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                    {(u.displayName || '?')[0].toUpperCase()}
                  </div>
              }
            </Link>
            <Link to={`/profile/${u.id}`} className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{u.displayName}</p>
              <p className="text-xs text-gray-500">@{u.username}</p>
            </Link>
            <button
              onClick={() => handleToggle(u.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                following[u.id]
                  ? 'bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                  : 'bg-brand-600 text-white hover:bg-brand-500'
              }`}
            >
              {following[u.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

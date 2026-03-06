// src/components/feed/ExplorePage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchUsers } from '../../firebase/userService'
import { HiSearch, HiUserAdd } from 'react-icons/hi'

export default function ExplorePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const users = await searchUsers(query)
        setResults(users.filter(u => u.uid !== user?.uid))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [query, user])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Results */}
      {loading && (
        <p className="text-center text-gray-500 text-sm">Searching...</p>
      )}

      {!loading && query && results.length === 0 && (
        <p className="text-center text-gray-500 text-sm">No users found for "{query}"</p>
      )}

      <div className="space-y-3">
        {results.map(u => (
          <div
            key={u.uid}
            onClick={() => navigate(`/profile/${u.uid}`)}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center flex-shrink-0">
              {u.photoURL ? (
                <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {u.displayName?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{u.displayName}</p>
              {u.username && (
                <p className="text-gray-400 text-sm truncate">@{u.username}</p>
              )}
              {u.bio && (
                <p className="text-gray-500 text-xs truncate mt-0.5">{u.bio}</p>
              )}
            </div>

            {/* Icon */}
            <HiUserAdd className="text-indigo-400 text-xl flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!query && (
        <div className="text-center mt-16 text-gray-600">
          <HiSearch className="text-5xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search for people to follow</p>
        </div>
      )}
    </div>
  )
}

// src/components/notifications/NotificationsPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getUserProfile } from '../../firebase/userService'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { HiBell, HiHeart, HiChatAlt2, HiUserAdd } from 'react-icons/hi'

const ICON_MAP = {
  like:    { icon: HiHeart,    color: 'text-red-400',   bg: 'bg-red-400/10' },
  comment: { icon: HiChatAlt2, color: 'text-brand-400', bg: 'bg-brand-400/10' },
  follow:  { icon: HiUserAdd,  color: 'text-green-400', bg: 'bg-green-400/10' },
}

export default function NotificationsPage() {
  const { user }  = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user.uid])

  const markRead = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true })
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <HiBell className="w-6 h-6 text-brand-400" />
          <h1 className="font-display font-bold text-2xl text-white">Notifications</h1>
          {unread > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full shimmer-bg shrink-0" />
              <div className="flex-1"><div className="h-3 shimmer-bg rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="card p-12 text-center">
          <HiBell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="font-display font-bold text-xl text-white mb-2">All caught up!</h3>
          <p className="text-gray-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifs.map(notif => (
            <NotifItem key={notif.id} notif={notif} onRead={() => markRead(notif.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotifItem({ notif, onRead }) {
  const [from, setFrom] = useState(null)
  useEffect(() => { getUserProfile(notif.fromUid).then(setFrom) }, [notif.fromUid])
  const { icon: Icon, color, bg } = ICON_MAP[notif.type] || ICON_MAP.like
  const time = notif.createdAt?.toDate
    ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
    : 'just now'

  return (
    <div
      onClick={onRead}
      className={`card p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-white/5 ${
        !notif.read ? 'border-l-2 border-brand-500' : ''
      }`}
    >
      <div className="relative shrink-0">
        {from?.photoURL
          ? <img src={from.photoURL} className="w-10 h-10 avatar" alt="" />
          : <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold text-sm">
              {(from?.displayName || '?')[0].toUpperCase()}
            </div>
        }
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${bg}`}>
          <Icon className={`w-3 h-3 ${color}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200">
          <span className="font-semibold text-white">{from?.displayName}</span>
          {' '}{notif.message}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </div>
      {!notif.read && <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
    </div>
  )
}

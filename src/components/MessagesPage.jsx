// src/components/messages/MessagesPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getUserConversations, getOrCreateConversation,
  sendMessage, getMessages, watchPresence,
} from '../../firebase/messageService'
import { getUserProfile, searchUsers } from '../../firebase/userService'
import { formatDistanceToNow } from 'date-fns'
import { HiSearch, HiPaperAirplane, HiArrowLeft, HiChat } from 'react-icons/hi'

export default function MessagesPage() {
  const { chatId }  = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [convos,   setConvos]   = useState([])
  const [active,   setActive]   = useState(chatId || null)
  const [messages, setMessages] = useState([])
  const [partner,  setPartner]  = useState(null)
  const [text,     setText]     = useState('')
  const [search,   setSearch]   = useState('')
  const [results,  setResults]  = useState([])
  const [online,   setOnline]   = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    const unsub = getUserConversations(user.uid, setConvos)
    return unsub
  }, [user.uid])

  useEffect(() => {
    if (!active) return
    const unsub = getMessages(active, setMessages)
    // Find partner uid from active chatId
    const parts = active.split('_')
    const partnerUid = parts.find(id => id !== user.uid)
    if (partnerUid) {
      getUserProfile(partnerUid).then(setPartner)
      const unsub2 = watchPresence(partnerUid, (data) => setOnline(data?.online || false))
      return () => { unsub(); unsub2?.() }
    }
    return unsub
  }, [active, user.uid])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    const t = setTimeout(() => searchUsers(search).then(r => setResults(r.filter(u => u.id !== user.uid))), 300)
    return () => clearTimeout(t)
  }, [search])

  const startChat = async (targetUser) => {
    const cid = await getOrCreateConversation(user.uid, targetUser.id)
    setActive(cid)
    setPartner(targetUser)
    setSearch(''); setResults([])
    navigate(`/messages/${cid}`)
  }

  const handleSend = async () => {
    if (!text.trim() || !active) return
    const msg = text
    setText('')
    await sendMessage(active, user.uid, msg)
  }

  return (
    <div className="flex h-screen lg:h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className={`${active ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-white/5 glass`}>
        <div className="p-4 border-b border-white/5">
          <h2 className="font-display font-bold text-xl text-white mb-3">Messages</h2>
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search people…"
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          {results.length > 0 && (
            <div className="mt-2 glass rounded-xl overflow-hidden">
              {results.map(u => (
                <button key={u.id} onClick={() => startChat(u)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 w-full text-left transition-colors">
                  {u.photoURL
                    ? <img src={u.photoURL} className="w-8 h-8 avatar" alt="" />
                    : <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {(u.displayName || '?')[0].toUpperCase()}
                      </div>
                  }
                  <div>
                    <p className="text-sm font-medium text-white">{u.displayName}</p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {convos.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              <HiChat className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
          {convos.map(convo => (
            <ConvoItem
              key={convo.id}
              convo={convo}
              currentUid={user.uid}
              isActive={convo.id === active}
              onClick={() => { setActive(convo.id); navigate(`/messages/${convo.id}`) }}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!active ? 'hidden lg:flex' : 'flex'} flex-col flex-1 min-w-0`}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <HiChat className="w-16 h-16 text-brand-400 mx-auto mb-4 opacity-40" />
              <h3 className="font-display font-bold text-xl text-white mb-2">Your Messages</h3>
              <p className="text-gray-500 text-sm">Search for someone to start a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 glass">
              <button onClick={() => { setActive(null); navigate('/messages') }} className="lg:hidden btn-icon mr-1">
                <HiArrowLeft className="w-5 h-5" />
              </button>
              {partner && (
                <>
                  {partner.photoURL
                    ? <img src={partner.photoURL} className="w-9 h-9 avatar" alt="" />
                    : <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {(partner.displayName || '?')[0].toUpperCase()}
                      </div>
                  }
                  <div>
                    <p className="font-semibold text-white text-sm">{partner.displayName}</p>
                    <p className={`text-xs ${online ? 'text-green-400' : 'text-gray-500'}`}>
                      {online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isMine={msg.senderUid === user.uid} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 input-field py-2.5"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="btn-primary px-4 py-2.5 disabled:opacity-40"
                >
                  <HiPaperAirplane className="w-5 h-5 rotate-90" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ConvoItem({ convo, currentUid, isActive, onClick }) {
  const otherUid = convo.participants?.find(id => id !== currentUid)
  const [other, setOther] = useState(null)
  useEffect(() => { if (otherUid) getUserProfile(otherUid).then(setOther) }, [otherUid])
  const time = convo.updatedAt?.toDate
    ? formatDistanceToNow(convo.updatedAt.toDate(), { addSuffix: false })
    : ''

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors ${
        isActive ? 'bg-brand-600/15 border-r-2 border-brand-500' : 'hover:bg-white/5'
      }`}
    >
      {other?.photoURL
        ? <img src={other.photoURL} className="w-10 h-10 avatar shrink-0" alt="" />
        : <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold shrink-0">
            {(other?.displayName || '?')[0].toUpperCase()}
          </div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white truncate">{other?.displayName}</p>
          <span className="text-xs text-gray-600 shrink-0 ml-2">{time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{convo.lastMessage || 'Start chatting'}</p>
      </div>
    </button>
  )
}

function MessageBubble({ msg, isMine }) {
  const time = msg.createdAt?.toDate
    ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })
    : 'just now'

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
          isMine
            ? 'bg-brand-600 text-white rounded-br-md'
            : 'glass text-gray-200 rounded-bl-md'
        }`}>
          {msg.text}
        </div>
        <span className="text-xs text-gray-600 mt-1 px-1">{time}</span>
      </div>
    </div>
  )
}

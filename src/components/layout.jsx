// src/components/layout/AppLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiHome, HiCompass, HiFilm, HiPhotograph, HiChat,
  HiBell, HiUser, HiLogout, HiPencil, HiMenuAlt2, HiX,
  HiHashtag,
} from 'react-icons/hi'
import CreatePostModal from '../feed/CreatePostModal'

const NAV = [
  { to: '/',            icon: HiHome,        label: 'Home',         exact: true },
  { to: '/explore',     icon: HiCompass,     label: 'Explore' },
  { to: '/reels',       icon: HiFilm,        label: 'Reels' },
  { to: '/stories',     icon: HiPhotograph,  label: 'Stories' },
  { to: '/tweets',      icon: HiHashtag,     label: 'Tweets' },
  { to: '/messages',    icon: HiChat,        label: 'Messages' },
  { to: '/notifications', icon: HiBell,      label: 'Notifications' },
]

export default function AppLayout() {
  const { user, profile, logout } = useAuth()
  const navigate  = useNavigate()
  const [open,     setOpen]    = useState(false) // mobile sidebar
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass border-r border-white/5
        flex flex-col py-6 px-3 transition-transform duration-300
        lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-3 mb-8">
          <span className="font-display font-extrabold text-2xl gradient-text tracking-tight">
            Blendly
          </span>
          <p className="text-xs text-gray-600 mt-0.5">Where everything connects</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Create button */}
        <button
          onClick={() => { setCreating(true); setOpen(false) }}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4 animate-pulse-glow"
        >
          <HiPencil className="w-4 h-4" />
          Create
        </button>

        {/* Profile / Logout */}
        <div className="border-t border-white/5 pt-4 mt-2">
          <button
            onClick={() => { navigate(`/profile/${user?.uid}`); setOpen(false) }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors w-full text-left mb-1"
          >
            {profile?.photoURL
              ? <img src={profile.photoURL} className="w-8 h-8 avatar" alt="" />
              : <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {(profile?.displayName || 'U')[0].toUpperCase()}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">@{profile?.username}</p>
            </div>
          </button>
          <button onClick={logout} className="nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <HiLogout className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 glass border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="btn-icon">
          <HiMenuAlt2 className="w-5 h-5" />
        </button>
        <span className="font-display font-extrabold text-xl gradient-text">Blendly</span>
        <button onClick={() => setCreating(true)} className="btn-icon text-indigo-400">
          <HiPencil className="w-5 h-5" />
        </button>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <Outlet />
      </main>

      {/* Create post modal */}
      {creating && <CreatePostModal onClose={() => setCreating(false)} />}
    </div>
  )
}

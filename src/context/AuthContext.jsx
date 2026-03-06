// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { createUserProfile, getUserProfile } from '../firebase/userService'
import { setUserOnline, setUserOffline } from '../firebase/messageService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user,        setUser]        = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [loading,     setLoading]     = useState(true)

  const refreshProfile = async (uid) => {
    const p = await getUserProfile(uid)
    setProfile(p)
    return p
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await refreshProfile(firebaseUser.uid)
        setUserOnline(firebaseUser.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Handle tab close / offline
  useEffect(() => {
    if (!user) return
    const handleUnload = () => setUserOffline(user.uid)
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [user])

  const signUp = async (email, password, username) => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(u, { displayName: username })
    await createUserProfile(u.uid, { email, username, displayName: username })
    await refreshProfile(u.uid)
    return u
  }

  const signIn = async (email, password) => {
    const { user: u } = await signInWithEmailAndPassword(auth, email, password)
    await refreshProfile(u.uid)
    return u
  }

  const signInWithGoogle = async () => {
    const { user: u } = await signInWithPopup(auth, googleProvider)
    await createUserProfile(u.uid, {
      email:       u.email,
      username:    u.email.split('@')[0],
      displayName: u.displayName,
      photoURL:    u.photoURL,
    })
    await refreshProfile(u.uid)
    return u
  }

  const logout = async () => {
    if (user) setUserOffline(user.uid)
    await signOut(auth)
    setProfile(null)
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    refreshProfile: () => user && refreshProfile(user.uid),
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

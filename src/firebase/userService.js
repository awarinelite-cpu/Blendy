// src/firebase/userService.js
import {
  doc, setDoc, getDoc, updateDoc, collection,
  query, where, getDocs, orderBy, limit,
  serverTimestamp, arrayUnion, arrayRemove, increment
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'

// ── User Profile ──────────────────────────────────────────────────────────────

export const createUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid)
  await setDoc(userRef, {
    uid,
    username:    data.username || data.email.split('@')[0],
    displayName: data.displayName || data.username || 'Blendly User',
    email:       data.email,
    photoURL:    data.photoURL || '',
    bio:         '',
    website:     '',
    location:    '',
    followers:   [],
    following:   [],
    followersCount: 0,
    followingCount: 0,
    postsCount:     0,
    verified:    false,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  }, { merge: true })
}

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

export const uploadAvatar = async (uid, file) => {
  const storageRef = ref(storage, `avatars/${uid}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export const searchUsers = async (query_) => {
  const q = query(
    collection(db, 'users'),
    where('username', '>=', query_),
    where('username', '<=', query_ + '\uf8ff'),
    limit(10)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Follow / Unfollow ─────────────────────────────────────────────────────────

export const followUser = async (currentUid, targetUid) => {
  const batch = []
  batch.push(updateDoc(doc(db, 'users', currentUid), {
    following:      arrayUnion(targetUid),
    followingCount: increment(1),
  }))
  batch.push(updateDoc(doc(db, 'users', targetUid), {
    followers:      arrayUnion(currentUid),
    followersCount: increment(1),
  }))
  await Promise.all(batch)
  // Create notification
  await createNotification(targetUid, {
    type:      'follow',
    fromUid:   currentUid,
    message:   'started following you',
  })
}

export const unfollowUser = async (currentUid, targetUid) => {
  await Promise.all([
    updateDoc(doc(db, 'users', currentUid), {
      following:      arrayRemove(targetUid),
      followingCount: increment(-1),
    }),
    updateDoc(doc(db, 'users', targetUid), {
      followers:      arrayRemove(currentUid),
      followersCount: increment(-1),
    }),
  ])
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const createNotification = async (toUid, data) => {
  await setDoc(doc(collection(db, 'users', toUid, 'notifications')), {
    ...data,
    read:      false,
    createdAt: serverTimestamp(),
  })
}

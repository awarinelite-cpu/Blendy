// src/firebase/postService.js
import {
  collection, doc, addDoc, getDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, getDocs, startAfter,
  serverTimestamp, arrayUnion, arrayRemove, increment,
  onSnapshot, setDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './config'
import { createNotification } from './userService'

// ── Upload Media ──────────────────────────────────────────────────────────────

export const uploadMedia = async (uid, file, folder = 'posts') => {
  const ext      = file.name.split('.').pop()
  const filename = `${folder}/${uid}/${Date.now()}.${ext}`
  const storageRef = ref(storage, filename)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

// ── Create Post (Feed / Tweet / Reel / Story) ─────────────────────────────────

export const createPost = async (uid, data) => {
  const postRef = await addDoc(collection(db, 'posts'), {
    uid,
    type:        data.type || 'post',   // 'post' | 'tweet' | 'reel' | 'story'
    content:     data.content || '',
    mediaURL:    data.mediaURL || null,
    mediaType:   data.mediaType || null, // 'image' | 'video'
    thumbnail:   data.thumbnail || null,
    tags:        data.tags || [],
    mentions:    data.mentions || [],
    likes:       [],
    likesCount:  0,
    comments:    [],
    commentsCount: 0,
    sharesCount: 0,
    views:       0,
    isPublic:    data.isPublic !== false,
    expiresAt:   data.expiresAt || null, // For stories (24h)
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
  // Increment user postsCount
  await updateDoc(doc(db, 'users', uid), { postsCount: increment(1) })
  return postRef.id
}

// ── Feed Queries ──────────────────────────────────────────────────────────────

export const getFeedPosts = (following, lastDoc, callback) => {
  const uids = [...following].slice(0, 10) // Firestore 'in' limit
  if (!uids.length) return () => {}
  let q = query(
    collection(db, 'posts'),
    where('uid', 'in', uids),
    where('type', 'in', ['post', 'tweet']),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  if (lastDoc) q = query(q, startAfter(lastDoc))
  return onSnapshot(q, snap => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(posts, snap.docs[snap.docs.length - 1])
  })
}

export const getPublicFeed = (type = 'post', callback) => {
  const q = query(
    collection(db, 'posts'),
    where('type', '==', type),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(30)
  )
  return onSnapshot(q, snap => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(posts)
  })
}

export const getReels = (callback) => {
  const q = query(
    collection(db, 'posts'),
    where('type', '==', 'reel'),
    where('isPublic', '==', true),
    orderBy('views', 'desc'),
    limit(20)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const getStories = (following, callback) => {
  const uids = [...following, 'public'].slice(0, 10)
  const q = query(
    collection(db, 'posts'),
    where('uid', 'in', uids),
    where('type', '==', 'story'),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const getUserPosts = (uid, callback) => {
  const q = query(
    collection(db, 'posts'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ── Interactions ──────────────────────────────────────────────────────────────

export const likePost = async (postId, uid, authorUid) => {
  const ref_ = doc(db, 'posts', postId)
  await updateDoc(ref_, { likes: arrayUnion(uid), likesCount: increment(1) })
  if (authorUid !== uid) {
    await createNotification(authorUid, { type: 'like', fromUid: uid, postId, message: 'liked your post' })
  }
}

export const unlikePost = async (postId, uid) => {
  await updateDoc(doc(db, 'posts', postId), {
    likes: arrayRemove(uid),
    likesCount: increment(-1),
  })
}

export const toggleLike = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId)
  const postSnap = await getDoc(postRef)
  if (!postSnap.exists()) return
  const likes = postSnap.data().likes || []
  const alreadyLiked = likes.includes(userId)
  await updateDoc(postRef, {
    likes: alreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likesCount: increment(alreadyLiked ? -1 : 1),
  })
}

export const addComment = async (postId, uid, text, authorUid) => {
  const commentRef = doc(collection(db, 'posts', postId, 'comments'))
  await setDoc(commentRef, {
    uid, text,
    likes: [],
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) })
  if (authorUid !== uid) {
    await createNotification(authorUid, { type: 'comment', fromUid: uid, postId, message: 'commented on your post' })
  }
  return commentRef.id
}

export const getComments = (postId, callback) => {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc'),
    limit(50)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const incrementViews = async (postId) => {
  await updateDoc(doc(db, 'posts', postId), { views: increment(1) })
}

export const deletePost = async (postId, uid, mediaURL) => {
  await deleteDoc(doc(db, 'posts', postId))
  await updateDoc(doc(db, 'users', uid), { postsCount: increment(-1) })
  if (mediaURL) {
    try { await deleteObject(ref(storage, mediaURL)) } catch (_) {}
  }
}

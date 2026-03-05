// src/firebase/messageService.js
import {
  collection, doc, addDoc, query, orderBy,
  limit, onSnapshot, serverTimestamp, setDoc,
  getDoc, updateDoc, getDocs, where
} from 'firebase/firestore'
import { ref as rtdbRef, onValue, set, push, serverTimestamp as rtTimestamp } from 'firebase/database'
import { db, rtdb } from './config'

// ── Conversation helpers ──────────────────────────────────────────────────────

export const getChatId = (uid1, uid2) =>
  [uid1, uid2].sort().join('_')

export const getOrCreateConversation = async (uid1, uid2) => {
  const chatId  = getChatId(uid1, uid2)
  const chatRef = doc(db, 'conversations', chatId)
  const snap    = await getDoc(chatRef)
  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [uid1, uid2],
      lastMessage:  '',
      lastSenderId: '',
      updatedAt:    serverTimestamp(),
      createdAt:    serverTimestamp(),
      unread:       { [uid1]: 0, [uid2]: 0 },
    })
  }
  return chatId
}

export const getUserConversations = (uid, callback) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('updatedAt', 'desc'),
    limit(30)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ── Messages ──────────────────────────────────────────────────────────────────

export const sendMessage = async (chatId, senderUid, text, mediaURL = null) => {
  const msgRef = collection(db, 'conversations', chatId, 'messages')
  await addDoc(msgRef, {
    senderUid,
    text,
    mediaURL,
    read:      false,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'conversations', chatId), {
    lastMessage:  text || '📎 Media',
    lastSenderId: senderUid,
    updatedAt:    serverTimestamp(),
  })
}

export const getMessages = (chatId, callback) => {
  const q = query(
    collection(db, 'conversations', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ── Presence (Realtime DB) ────────────────────────────────────────────────────

export const setUserOnline = (uid) => {
  const presRef = rtdbRef(rtdb, `presence/${uid}`)
  set(presRef, { online: true, lastSeen: rtTimestamp() })
}

export const setUserOffline = (uid) => {
  const presRef = rtdbRef(rtdb, `presence/${uid}`)
  set(presRef, { online: false, lastSeen: rtTimestamp() })
}

export const watchPresence = (uid, callback) => {
  const presRef = rtdbRef(rtdb, `presence/${uid}`)
  return onValue(presRef, snap => callback(snap.val()))
}

// src/components/feed/CreatePostModal.jsx
import { useState, useRef, useCallback } from 'react'
import { X, Image, Video, MapPin, Smile, Globe, ChevronDown, Loader2 } from 'lucide-react'

const AUDIENCES = [
  { value: 'public', label: 'Everyone', icon: '🌍' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'only_me', label: 'Only Me', icon: '🔒' },
]

export default function CreatePostModal({ isOpen, onClose, onPost, user }) {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState([]) // [{ url, type, file }]
  const [audience, setAudience] = useState('public')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  const textRef = useRef(null)

  const MAX_CHARS = 500
  const remaining = MAX_CHARS - content.length
  const canPost = (content.trim().length > 0 || media.length > 0) && remaining >= 0 && !loading

  const addFiles = useCallback((files) => {
    const allowed = Array.from(files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    ).slice(0, 4 - media.length)

    const previews = allowed.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      file,
      id: Math.random().toString(36).slice(2),
    }))
    setMedia(prev => [...prev, ...previews].slice(0, 4))
  }, [media.length])

  const removeMedia = (id) => setMedia(prev => prev.filter(m => m.id !== id))

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (!canPost) return
    setLoading(true)
    try {
      await onPost?.({ content, media, audience })
      setContent('')
      setMedia([])
      setAudience('public')
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.()
  }

  if (!isOpen) return null

  const selectedAudience = AUDIENCES.find(a => a.value === audience)

  const progressColor =
    remaining < 0 ? '#f87171' :
    remaining < 50 ? '#fbbf24' :
    '#6366f1'

  const progressDeg = Math.min(360, ((MAX_CHARS - Math.max(0, remaining)) / MAX_CHARS) * 360)

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      onKeyDown={handleKeyDown}
      style={styles.backdrop}
    >
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>Create Post</span>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={styles.divider} />

        {/* User row */}
        <div style={styles.userRow}>
          <div style={styles.avatar}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={styles.avatarImg} />
              : <span style={styles.avatarFallback}>{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</span>
            }
            <div style={styles.avatarOnline} />
          </div>
          <div>
            <div style={styles.userName}>{user?.displayName || user?.email || 'You'}</div>
            {/* Audience selector */}
            <div style={{ position: 'relative' }}>
              <button
                style={styles.audienceBtn}
                onClick={() => setAudienceOpen(o => !o)}
              >
                <span>{selectedAudience.icon}</span>
                <span style={{ fontSize: 12 }}>{selectedAudience.label}</span>
                <ChevronDown size={12} style={{
                  transform: audienceOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
              </button>
              {audienceOpen && (
                <div style={styles.audienceDropdown}>
                  {AUDIENCES.map(a => (
                    <button
                      key={a.value}
                      style={{
                        ...styles.audienceOption,
                        background: a.value === audience ? 'rgba(99,102,241,0.15)' : 'transparent',
                      }}
                      onClick={() => { setAudience(a.value); setAudienceOpen(false) }}
                    >
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text area */}
        <div
          style={{
            ...styles.dropZone,
            borderColor: dragOver ? 'rgba(99,102,241,0.6)' : 'transparent',
            background: dragOver ? 'rgba(99,102,241,0.05)' : 'transparent',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <textarea
            ref={textRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            style={styles.textarea}
            rows={4}
            maxLength={MAX_CHARS + 50}
          />
        </div>

        {/* Media previews */}
        {media.length > 0 && (
          <div style={{
            ...styles.mediaGrid,
            gridTemplateColumns: media.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          }}>
            {media.map(m => (
              <div key={m.id} style={styles.mediaThumb}>
                {m.type === 'video'
                  ? <video src={m.url} style={styles.mediaEl} muted />
                  : <img src={m.url} alt="" style={styles.mediaEl} />
                }
                <button
                  style={styles.mediaRemove}
                  onClick={() => removeMedia(m.id)}
                  aria-label="Remove"
                >
                  <X size={12} />
                </button>
                {m.type === 'video' && (
                  <div style={styles.videoBadge}>
                    <Video size={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={styles.divider} />

        {/* Actions bar */}
        <div style={styles.actionsRow}>
          <span style={styles.addLabel}>Add to post</span>
          <div style={styles.actionBtns}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)}
            />
            <button
              style={styles.actionIcon}
              onClick={() => fileRef.current?.click()}
              title="Photo/Video"
              disabled={media.length >= 4}
            >
              <Image size={20} color="#34d399" />
            </button>
            <button style={styles.actionIcon} title="Feeling">
              <Smile size={20} color="#fbbf24" />
            </button>
            <button style={styles.actionIcon} title="Location">
              <MapPin size={20} color="#f87171" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {/* Char counter ring */}
          <div style={styles.charRing} title={`${remaining} characters remaining`}>
            <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
              <circle
                cx="16" cy="16" r="13"
                fill="none"
                stroke={progressColor}
                strokeWidth="2.5"
                strokeDasharray={`${2 * Math.PI * 13}`}
                strokeDashoffset={`${2 * Math.PI * 13 * (1 - progressDeg / 360)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.2s, stroke 0.2s' }}
              />
            </svg>
            {remaining <= 50 && (
              <span style={{
                ...styles.charCount,
                color: progressColor,
              }}>
                {remaining < 0 ? remaining : remaining}
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canPost}
            style={{
              ...styles.postBtn,
              opacity: canPost ? 1 : 0.4,
              cursor: canPost ? 'pointer' : 'not-allowed',
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Posting…</>
              : 'Post'
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: '#1a1a24',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1) inset',
    animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px 20px 16px',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '0 20px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '16px 20px 8px',
  },
  avatar: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(99,102,241,0.4)',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 18,
  },
  avatarOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: '50%',
    background: '#34d399',
    border: '2px solid #1a1a24',
  },
  userName: {
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 4,
  },
  audienceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 6,
    padding: '3px 8px',
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  audienceDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    background: '#12121a',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 10,
    padding: 4,
    zIndex: 10,
    minWidth: 140,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  audienceOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    borderRadius: 7,
    border: 'none',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.12s',
  },
  dropZone: {
    margin: '8px 20px 0',
    borderRadius: 10,
    border: '2px dashed transparent',
    transition: 'border-color 0.2s, background 0.2s',
    padding: 4,
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: 16,
    lineHeight: 1.6,
    resize: 'none',
    fontFamily: 'inherit',
    placeholder: 'rgba(255,255,255,0.25)',
    caretColor: '#6366f1',
    boxSizing: 'border-box',
  },
  mediaGrid: {
    display: 'grid',
    gap: 4,
    margin: '8px 20px',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 280,
  },
  mediaThumb: {
    position: 'relative',
    overflow: 'hidden',
    background: '#0f0f13',
    minHeight: 100,
    maxHeight: 180,
  },
  mediaEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  mediaRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    background: 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    background: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: '2px 5px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
  },
  addLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: 500,
  },
  actionBtns: {
    display: 'flex',
    gap: 2,
  },
  actionIcon: {
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px 18px',
    gap: 12,
  },
  charRing: {
    position: 'relative',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  charCount: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: 700,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  postBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 12,
    padding: '11px 24px',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.2s, transform 0.1s',
    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
  },
}

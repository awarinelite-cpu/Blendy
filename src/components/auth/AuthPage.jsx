// src/components/auth/AuthPage.jsx
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'
import { HiEye, HiEyeOff, HiMail, HiLockClosed, HiUser } from 'react-icons/hi'

export default function AuthPage() {
  const [mode,     setMode]     = useState('login') // login | signup | reset
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form,     setForm]     = useState({ email: '', password: '', username: '' })
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        navigate('/')
      } else if (mode === 'signup') {
        if (form.username.length < 3) throw new Error('Username must be at least 3 characters')
        await signUp(form.email, form.password, form.username)
        toast.success('Welcome to Blendly! 🎉')
        navigate('/')
      } else {
        await resetPassword(form.email)
        toast.success('Reset email sent!')
        setMode('login')
      }
    } catch (err) {
      toast.error(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-pink/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-5xl gradient-text mb-2">Blendly</h1>
          <p className="text-gray-500 text-sm">Posts · Reels · Stories · Tweets — all in one.</p>
        </div>

        <div className="card p-8 shadow-card">
          <h2 className="font-display font-bold text-xl text-white mb-6">
            {mode === 'login'  ? 'Sign in to your account' :
             mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </h2>

          {/* Google */}
          {mode !== 'reset' && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 glass-light border border-white/10 hover:border-white/20 rounded-xl py-3 text-white font-medium transition-all duration-200 hover:bg-white/5 active:scale-95 disabled:opacity-50 mb-5"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-gray-600">or continue with email</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={set('username')}
                  className="input-field pl-10"
                  required
                />
              </div>
            )}

            <div className="relative">
              <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={set('email')}
                className="input-field pl-10"
                required
              />
            </div>

            {mode !== 'reset' && (
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={set('password')}
                  className="input-field pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPass ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setMode('reset')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300 font-medium">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowRight, Sparkles, Eye, EyeOff, User, Lock, Zap } from 'lucide-react'

interface AuthSectionProps {
  onLogin: (username: string, password: string) => Promise<void>
  onRegister: (username: string, password: string) => Promise<void>
  onMockLogin: () => void
  isLoading: boolean
  error: string | null
}

export default function AuthSection({ onLogin, onRegister, onMockLogin, isLoading, error }: AuthSectionProps) {
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      await onLogin(username, password)
    } else {
      await onRegister(username, password)
    }
  }

  const resetForm = () => {
    setUsername('')
    setPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <AnimatePresence mode="wait">
        {mode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-4 tracking-tight"
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                AI Mitra
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-white/60 mb-12 font-light"
            >
              Your intelligent companion for learning and creation
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode('login'); resetForm(); }}
                className="group relative px-8 py-4 w-full sm:w-auto min-w-[200px] rounded-xl font-semibold text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_100%] group-hover:animate-shimmer" />
                <span className="relative flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              {/* Create Account Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode('register'); resetForm(); }}
                className="group relative px-8 py-4 w-full sm:w-auto min-w-[200px] rounded-xl font-semibold text-white overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <span className="relative">Create Account</span>
              </motion.button>
            </motion.div>

            {/* Demo Mode */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onMockLogin}
              className="mt-8 text-white/40 hover:text-white/60 text-sm flex items-center gap-2 mx-auto transition-colors"
            >
              <Zap className="w-3 h-3" />
              Try Demo Mode
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md"
          >
            {/* Glass Card */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 rounded-3xl blur-xl opacity-30 animate-pulse" />

              {/* Card */}
              <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                {/* Back Button */}
                <button
                  onClick={() => setMode('landing')}
                  className="mb-6 text-white/50 hover:text-white flex items-center gap-2 text-sm transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-white/50 mb-8 text-sm">
                  {mode === 'login'
                    ? 'Enter your credentials to continue'
                    : 'Join us and start your journey'}
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                      >
                        <p className="text-sm text-red-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isLoading || !username || !password}
                    className="w-full relative py-4 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {mode === 'login' ? 'Sign In' : 'Create Account'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* Switch Mode */}
                <p className="mt-6 text-center text-sm text-white/40">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetForm(); }}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

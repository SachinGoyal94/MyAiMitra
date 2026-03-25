'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, MessageCircle, User, Lock, History, Trash2, Send, Bot, Settings, Sparkles, Clock, UserCircle, Users, FileText, GraduationCap, Database, Zap, Terminal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuthSection from '@/components/home/AuthSection'
import NeuralNetworkBackground from '@/components/ui/NeuralNetworkBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { motion, AnimatePresence } from 'framer-motion'



interface ChatMessage {
  id: number
  question: string
  answer: string
  engine: string
  timestamp: string
}

interface User {
  username: string
  token?: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedEngine, setSelectedEngine] = useState('gemini-2.5-flash-lite-preview-06-17')
  const [useHistory, setUseHistory] = useState(true)
  const [maxHistory, setMaxHistory] = useState(10)
  const [mockMode, setMockMode] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)



  const API_BASE = 'https://sachingoyal94-myaimitra.hf.space'

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // API functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(user?.token && { Authorization: `Bearer ${user.token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, { ...options, headers })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Network error')
    }
  }

  const handleLogin = async (username: string, password: string) => {
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      formData.append('grant_type', 'password')

      const response = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || `Login failed (${response.status})`

        // If API is down, offer mock mode
        if (response.status >= 500 || response.status === 400) {
          setError(`API Error: ${errorMessage}. The backend server appears to be down. Try Mock Mode to test the interface.`)
          return
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      const userData = { username, token: data.access_token }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(`${errorMessage}. The backend server may be unavailable.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (username: string, password: string) => {
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
        }),
      })

      // Auto-login after registration
      setTimeout(() => handleLogin(username, password), 100)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(`${errorMessage}. The backend server may be unavailable. Try Mock Mode to test the interface.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMockLogin = () => {
    const userData = { username: 'Demo User' }
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setMockMode(true)
    setError(null)
    // Add some demo chat history
    setChatHistory([
      {
        id: 1,
        question: "Hello! How are you?",
        answer: "Hello! I'm doing great, thank you for asking! I'm here to help you with any questions you might have. What would you like to know today?",
        engine: "gemini-2.5-flash-lite-preview-06-17",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        question: "Can you explain quantum computing?",
        answer: "Quantum computing is a revolutionary computing paradigm that uses quantum mechanics principles like superposition and entanglement to process information. Unlike classical computers that use bits (0 or 1), quantum computers use qubits that can exist in multiple states simultaneously, allowing them to solve certain complex problems much faster than traditional computers.",
        engine: "llama3-8b-8192",
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ])
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user) return

    setIsLoading(true)
    setError(null)

    try {
      let response: any

      if (mockMode) {
        // Mock response for demo
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
        response = {
          answer: `This is a mock response from ${getModelName(selectedEngine)}. The backend API is currently unavailable, but you can see how the interface works! Your question was: "${currentMessage}"`
        }
      } else {
        response = await apiCall('/ask', {
          method: 'POST',
          body: JSON.stringify({
            question: currentMessage,
            engine: selectedEngine,
            use_history: useHistory,
            max_history: maxHistory,
          }),
        })
      }

      const newMessage: ChatMessage = {
        id: Date.now(),
        question: currentMessage,
        answer: response.answer || response.response || 'No response received',
        engine: selectedEngine,
        timestamp: new Date().toISOString(),
      }

      setChatHistory(prev => [...prev, newMessage])
      setCurrentMessage('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(`${errorMessage}. The backend server may be unavailable.`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatHistory = async () => {
    if (!user) return

    try {
      const history = await apiCall('/history')
      setChatHistory(history || [])
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const deleteHistory = async () => {
    if (!user) return

    try {
      await apiCall('/history', { method: 'DELETE' })
      setChatHistory([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete history')
    }
  }

  const deleteSpecificChat = async (chatId: number) => {
    if (!user) return

    try {
      await apiCall(`/history/${chatId}`, { method: 'DELETE' })
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat')
    }
  }

  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user])

  // Check for existing user session on page load
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (err) {
        console.error('Failed to parse user data:', err)
        localStorage.removeItem('user')
      }
    }
  }, [])

  const getModelIcon = (engine?: string) => {
    if (!engine) return '🤖'
    if (engine.includes('gemini')) return '🚀'
    if (engine.includes('llama3')) return '🧠'
    if (engine.includes('gemma')) return '💎'
    if (engine.includes('llama-3.1')) return '⚡'
    return '🤖'
  }

  const getModelName = (engine?: string) => {
    if (!engine) return 'Unknown'
    if (engine.includes('gemini')) return 'Gemini'
    if (engine.includes('llama3')) return 'Llama 3'
    if (engine.includes('gemma')) return 'Gemma'
    if (engine.includes('llama-3.1')) return 'Llama 3.1'
    return engine
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <NeuralNetworkBackground />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pointer-events-none">
          <div className="pointer-events-auto">
            <AuthSection
              onLogin={handleLogin}
              onRegister={handleRegister}
              onMockLogin={handleMockLogin}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white font-sans selection:bg-purple-500/30">
      <NeuralNetworkBackground />

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.6)]"
            >
              <Terminal className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-default">
                AI Mitra OS
              </h1>
              <p className="text-sm font-medium text-white/50 tracking-wide uppercase">
                Welcome, {user.username}
                {mockMode && <Badge className="ml-2 bg-green-500/20 text-green-300 animate-pulse border-green-500/30">MOCK</Badge>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/character-chat')}
              className="group relative overflow-hidden bg-black/20 border-white/10 text-white/80 hover:text-white transition-all backdrop-blur-md rounded-full px-5"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Users className="w-4 h-4 mr-2" /> Character Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUser(null)
                setMockMode(false)
                setChatHistory([])
                localStorage.removeItem('user')
              }}
              className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all rounded-full px-5"
            >
              <Lock className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 pt-32 pb-12 relative z-10 grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Left Column: Tools & Nav */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="xl:col-span-1 space-y-6 flex flex-col h-[calc(100vh-180px)]"
        >
          {/* Hero Prompt */}
          <div className="mb-8">
            <h2 className="text-4xl font-light leading-tight mb-2">
              <span className="block text-white/60">Initialize</span>
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-bold">Sequence.</span>
            </h2>
            <p className="text-white/40 text-sm tracking-wide">Select a sub-routine or interface with the core logic below.</p>
          </div>

          <ScrollArea className="flex-1 -mx-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <GlassCard
                intensity="high"
                className="cursor-pointer group hover:border-purple-500/50"
                glowColor="rgba(168, 85, 247, 0.4)"
                onClick={() => router.push('/course-guidance')}
              >
                <div className="p-4 flex flex-col items-center justify-center text-center h-full gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-full group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-purple-100">COURSE GEN</span>
                </div>
              </GlassCard>

              <GlassCard
                intensity="high"
                className="cursor-pointer group hover:border-blue-500/50"
                glowColor="rgba(59, 130, 246, 0.4)"
                onClick={() => router.push('/db-chat')}
              >
                <div className="p-4 flex flex-col items-center justify-center text-center h-full gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-full group-hover:scale-110 transition-transform">
                    <Database className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-blue-100">DATA QUERY</span>
                </div>
              </GlassCard>

              <GlassCard
                intensity="high"
                className="cursor-pointer group hover:border-orange-500/50"
                glowColor="rgba(249, 115, 22, 0.4)"
                onClick={() => router.push('/summarizer')}
              >
                <div className="p-4 flex flex-col items-center justify-center text-center h-full gap-3">
                  <div className="p-3 bg-orange-500/20 rounded-full group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-orange-300" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-orange-100">SUMMARIZE</span>
                </div>
              </GlassCard>

              <GlassCard
                intensity="high"
                className="cursor-pointer group hover:border-yellow-500/50"
                glowColor="rgba(234, 179, 8, 0.4)"
                onClick={() => router.push('/flowchart-generator')}
              >
                <div className="p-4 flex flex-col items-center justify-center text-center h-full gap-3">
                  <div className="p-3 bg-yellow-500/20 rounded-full group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-yellow-300" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-yellow-100">FLOWCHART</span>
                </div>
              </GlassCard>
            </div>

            {/* History List */}
            <div className="mb-2 flex items-center justify-between sticky top-0 bg-black/10 backdrop-blur-md py-2 z-10">
              <h3 className="text-xs font-bold tracking-widest text-white/40 uppercase">Memory Logs</h3>
              <Button size="icon" variant="ghost" onClick={deleteHistory} className="h-6 w-6 text-white/30 hover:text-red-400">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8 text-white/20 border border-white/5 rounded-xl border-dashed">
                  <p className="text-xs uppercase tracking-widest">No logs found</p>
                </div>
              ) : (
                chatHistory.filter(chat => chat && chat.id).map((chat, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    key={chat.id}
                    className="group relative p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500/50 transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform" />
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {getModelIcon(chat.engine)} {getModelName(chat.engine)}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); deleteSpecificChat(chat.id); }} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-white/80 line-clamp-1">{chat.question}</p>
                    <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString() : ''}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Right Area: Floating Holographic Terminal */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="xl:col-span-3 h-[calc(100vh-180px)]"
        >
          <GlassCard intensity="high" className="h-full flex flex-col border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] ring-1 ring-white/10" hoverTilt={false}>

            {/* Terminal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <MessageCircle className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-semibold tracking-wider text-white/80 uppercase">AI Core Interface</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                <span>STATUS: <span className="text-green-400">ONLINE</span></span>
                <span>LATENCY: ~12ms</span>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-4">
                <div className="flex flex-col justify-end min-h-full space-y-6">
                  {chatHistory.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center text-white/30 py-24 flex flex-col items-center justify-center"
                    >
                      <div className="w-32 h-32 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping opacity-20" />
                        <Bot className="w-12 h-12 text-indigo-400/50" />
                      </div>
                      <h3 className="text-xl font-light text-white/60 tracking-widest uppercase">Awaiting Input</h3>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {chatHistory.filter(chat => chat && chat.id).map((chat, index) => (
                        <motion.div
                          key={chat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          {/* User */}
                          <div className="flex gap-4 justify-end items-start group">
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[80%] backdrop-blur-sm shadow-xl">
                              <p className="text-[15px] font-light text-white leading-relaxed">{chat.question || ''}</p>
                            </div>
                            <Avatar className="w-10 h-10 mt-1 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                              <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white font-mono text-xs">
                                USR
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          {/* Bot */}
                          <div className="flex gap-4 items-start group">
                            <Avatar className="w-10 h-10 mt-1 border border-indigo-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-900 to-purple-900 text-indigo-200">
                                <Bot className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-2xl rounded-tl-sm px-6 py-4 max-w-[85%] backdrop-blur-md shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 border-indigo-500/20 text-indigo-300 font-mono tracking-wider">
                                  {getModelIcon(chat.engine)} {getModelName(chat.engine)}
                                </Badge>
                              </div>
                              <p className="text-[15px] font-light text-indigo-50/90 whitespace-pre-wrap leading-relaxed">
                                {chat.answer || ''}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Dock */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-xl shrink-0 z-20">
              {error && (
                <Alert className="mb-4 border-red-500/30 bg-red-500/10 backdrop-blur-md text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                    <SelectTrigger className="w-auto min-w-[220px] h-9 bg-white/5 border-white/10 text-xs font-mono text-white/80 rounded-full hover:bg-white/10 transition-colors focus:ring-1 focus:ring-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10 text-white/90">
                      <SelectItem value="llama-3.1-8b-instant" className="hover:bg-white/10 focus:bg-white/10">
                        ⚡ llama-3.1-8b-instant
                      </SelectItem>
                      <SelectItem value="llama-3.3-70b-versatile" className="hover:bg-white/10 focus:bg-white/10">
                        🧠 llama-3.3-70b-versatile
                      </SelectItem>
                      <SelectItem value="gemini-2.5-flash-lite" className="hover:bg-white/10 focus:bg-white/10">
                        🚀 gemini-2.5-flash-lite
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-4 text-xs font-mono text-white/50 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white/80 transition-colors">
                      <input type="checkbox" checked={useHistory} onChange={(e) => setUseHistory(e.target.checked)} className="rounded border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500 accent-indigo-500" />
                      CTX_MEM
                    </label>
                    <div className="w-px h-3 bg-white/20" />
                    <label className="flex items-center gap-2">
                      VOL:
                      <input type="number" min="1" max="50" value={maxHistory} onChange={(e) => setMaxHistory(parseInt(e.target.value) || 10)} className="w-10 bg-transparent text-white border-b border-white/20 focus:outline-none focus:border-indigo-500 text-center" />
                    </label>
                  </div>
                </div>

                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity blur duration-500" />
                  <div className="relative flex bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl p-2 gap-2 shadow-2xl">
                    <Textarea
                      placeholder="Initialize query sequence..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1 min-h-[50px] max-h-[150px] bg-transparent border-none text-[15px] font-light text-white placeholder:text-white/30 focus-visible:ring-0 resize-none p-3"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !currentMessage.trim()}
                      className="self-end h-[50px] w-[50px] rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 transition-all active:scale-95 disabled:opacity-30 p-0 shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/5"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  )
}

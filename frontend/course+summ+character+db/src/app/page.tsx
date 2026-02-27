'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, MessageCircle, User, Lock, History, Trash2, Send, Bot, Settings, Sparkles, Clock, UserCircle, Users, FileText, GraduationCap, Database, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuthSection from '@/components/home/AuthSection'
import AuroraBackground from '@/components/ui/AuroraBackground'


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



  const API_BASE = 'https://my-ai-mitra.onrender.com'

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
      <>
        <AuroraBackground />
        <AuthSection
          onLogin={handleLogin}
          onRegister={handleRegister}
          onMockLogin={handleMockLogin}
          isLoading={isLoading}
          error={error}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      {/* 3D Aurora Background */}
      <AuroraBackground />

      <style jsx>{`
        .slide-in-right { animation: slide-in-right 0.4s ease-out; }
        .slide-in-left { animation: slide-in-left 0.4s ease-out; }
        .bounce-in { animation: bounce-in 0.5s ease-out; }
        .message-hover { transition: all 0.25s ease; }
        .message-hover:hover { transform: translateY(-2px); }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-110 transition-all duration-300 glow-pulse">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-sm">
                  AI Mitra
                </h1>
                <p className="text-sm text-indigo-300/70">
                  Welcome back, {user.username}
                  {mockMode && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200 animate-pulse">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mock Mode
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/character-chat')}
                className="flex items-center gap-2 border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <Users className="w-4 h-4" />
                Character Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/summarizer')}
                className="flex items-center gap-2 border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4" />
                AI Summarizer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUser(null)
                  setMockMode(false)
                  setChatHistory([])
                  localStorage.removeItem('user')
                }}
                className="flex items-center gap-2 border-white/20 text-white/70 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
              >
                <Lock className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* AI Tools Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            AI Tools & Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Character Chat Tool */}
            <Card
              className="shadow-lg border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-[1.05] hover:border-purple-400/50 cursor-pointer group"
              onClick={() => router.push('/character-chat')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">Character Chat</h3>
                <p className="text-xs text-purple-200/70">Chat with AI characters</p>
              </CardContent>
            </Card>

            {/* Course Guidance Tool */}
            <Card
              className="shadow-lg border border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-md hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-[1.05] hover:border-blue-400/50 cursor-pointer group"
              onClick={() => router.push('/course-guidance')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">Course Guidance</h3>
                <p className="text-xs text-blue-200/70">Generate AI courses</p>
              </CardContent>
            </Card>

            {/* Database Chat Tool */}
            <Card
              className="shadow-lg border border-green-500/30 bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-md hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300 hover:scale-[1.05] hover:border-green-400/50 cursor-pointer group"
              onClick={() => router.push('/db-chat')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">Database Chat</h3>
                <p className="text-xs text-green-200/70">Query your database</p>
              </CardContent>
            </Card>

            {/* Summarizer Tool */}
            <Card
              className="shadow-lg border border-orange-500/30 bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-md hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-300 hover:scale-[1.05] hover:border-orange-400/50 cursor-pointer group"
              onClick={() => router.push('/summarizer')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">Summarizer</h3>
                <p className="text-xs text-orange-200/70">Summarize content</p>
              </CardContent>
            </Card>

            {/* Flowchart Generator Tool */}
            <Card
              className="shadow-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-md hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300 hover:scale-[1.05] hover:border-yellow-400/50 cursor-pointer group"
              onClick={() => router.push('/flowchart-generator')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">Flowchart Generator</h3>
                <p className="text-xs text-yellow-200/70">Create visual flowcharts</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-xl text-white">Chat Interface</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    {chatHistory.length} messages
                  </Badge>
                </div>
                <CardDescription className="text-indigo-300/60">Ask questions to different AI engines</CardDescription>
              </CardHeader>

              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-6">
                  <div className="flex flex-col justify-end min-h-full space-y-6 py-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center text-indigo-300/70 py-16 bounce-in">
                        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Bot className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-white">Start a conversation</h3>
                        <p className="text-sm">Ask your first question to begin chatting with AI</p>
                      </div>
                    ) : (
                      chatHistory.filter(chat => chat && chat.id).map((chat, index) => (
                        <div key={chat.id} className="space-y-4" style={{ animationDelay: `${index * 0.1}s` }}>
                          {/* User Message */}
                          <div className="flex gap-3 slide-in-right message-hover">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-indigo-600">You</span>
                                <span className="text-xs text-muted-foreground">
                                  {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div className="bg-indigo-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] message-hover">
                                <p className="text-sm text-indigo-100 break-words">{chat.question || 'No question'}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSpecificChat(chat.id)}
                              className="opacity-0 hover:opacity-100 transition-all duration-300 h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:scale-110"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* AI Response */}
                          <div className="flex gap-3 slide-in-left message-hover" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-purple-100 text-purple-600">
                                <Bot className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-purple-600">AI Assistant</span>
                                <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                                  {getModelIcon(chat.engine)} {getModelName(chat.engine)}
                                </Badge>
                              </div>
                              <div className="bg-purple-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] message-hover">
                                <p className="text-sm text-purple-100 whitespace-pre-wrap break-words">{chat.answer || 'No response received'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input Section - Fixed */}
              <div className="border-t border-white/10 bg-gradient-to-r from-black/40 via-indigo-950/20 to-black/40 p-5 transition-all duration-300">
                <div className="space-y-3">
                  {/* Model Selection */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                      <SelectTrigger className="w-72 h-11 bg-white/5 border-white/20 text-white rounded-xl transition-all duration-300 hover:border-indigo-400/50 hover:bg-white/10 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llama-3.1-8b-instant" className="transition-all duration-200 hover:bg-indigo-50">
                          ⚡ llama-3.1-8b-instant
                        </SelectItem>
                        <SelectItem value="llama-3.3-70b-versatile" className="transition-all duration-200 hover:bg-indigo-50">
                          🧠 llama-3.3-70b-versatile
                        </SelectItem>
                        <SelectItem value="gemini-2.5-flash-lite" className="transition-all duration-200 hover:bg-indigo-50">
                          🚀 gemini-2.5-flash-lite
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-history"
                        checked={useHistory}
                        onChange={(e) => setUseHistory(e.target.checked)}
                        className="rounded border-indigo-500/50 text-indigo-400 focus:ring-indigo-500 transition-all duration-200 hover:scale-110 bg-transparent"
                      />
                      <Label htmlFor="use-history" className="text-sm font-medium cursor-pointer transition-colors hover:text-indigo-300 text-indigo-200/80">Use History</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="max-history" className="text-sm font-medium text-indigo-200/80">Max History:</Label>
                      <Input
                        id="max-history"
                        type="number"
                        min="1"
                        max="50"
                        value={maxHistory}
                        onChange={(e) => setMaxHistory(parseInt(e.target.value) || 10)}
                        className="w-16 h-10 border-white/20 bg-white/5 text-white transition-all duration-300 hover:border-indigo-400/50 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask your question..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl transition-all duration-300 focus:bg-white/10 focus:shadow-lg"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !currentMessage.trim()}
                      className="px-8 h-[60px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="mt-4 border-red-200 bg-red-50 slide-up">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)] flex flex-col shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600 transition-transform duration-300 hover:scale-110" />
                    <CardTitle className="text-xl text-white">Chat History</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deleteHistory}
                    disabled={chatHistory.length === 0}
                    className="text-indigo-300/60 hover:text-red-400 hover:bg-red-500/10 border-white/20 transition-all duration-300 hover:scale-[1.05]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription className="text-indigo-300/60">
                  {chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full px-4">
                  <div className="space-y-3 py-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center text-indigo-300/60 py-8 bounce-in">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No chat history yet</p>
                        <p className="text-xs mt-1">Start chatting to see your history</p>
                      </div>
                    ) : (
                      chatHistory.filter(chat => chat && chat.id).map((chat, index) => (
                        <Card key={chat.id} className="p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-white/10 bg-white/5 message-hover overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-0 text-indigo-300">
                                {getModelIcon(chat.engine)} {getModelName(chat.engine)}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteSpecificChat(chat.id)}
                                className="h-6 w-6 p-0 opacity-0 hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-white line-clamp-2 leading-relaxed break-words">
                                {chat.question || 'No question'}
                              </p>
                              <p className="text-xs text-indigo-200/60 line-clamp-2 leading-relaxed break-words">
                                {chat.answer || 'No response'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-indigo-300/50">
                              <Clock className="w-3 h-3" />
                              {chat.timestamp ? new Date(chat.timestamp).toLocaleString() : 'No timestamp'}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div >
  )
}
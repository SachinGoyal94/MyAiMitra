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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, MessageCircle, User, Lock, History, Trash2, Send, Bot, Settings, Sparkles, Clock, ArrowLeft, Plus, Edit3, UserCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/ui/AuroraBackground'

interface CharacterMessage {
  id: number
  sender: 'user' | 'agent'
  message: string
  created_at: string
}

interface Persona {
  id: number
  character_name: string
  mode: string
  tone: string
  summary: string
  created_at: string
}

export default function CharacterChat() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; token?: string; userId?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<CharacterMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [showCreatePersona, setShowCreatePersona] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Create persona form state
  const [mode, setMode] = useState<'auto' | 'custom'>('auto')
  const [characterName, setCharacterName] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [tone, setTone] = useState('neutral')

  const API_BASE = '' // Use local API routes

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check for user session
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      } else {
        // Redirect to home page if not logged in
        router.push('/')
        return
      }
      setIsCheckingAuth(false)
    }
  }, [])

  // Load personas when user is available
  useEffect(() => {
    if (user) {
      loadUserId()
    }
  }, [user])

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}/api${endpoint}`

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Network error')
    }
  }

  const getUserId = async (username: string) => {
    console.log('Getting user ID for:', username)
    const response = await apiCall(`/get_user_id/${encodeURIComponent(username)}`)
    console.log('User ID response:', response)
    return response.user_id
  }

  const loadUserId = async () => {
    if (!user) return

    // If userId is already set, don't fetch again
    if (user.userId) {
      loadPersonas(user.userId)
      return
    }

    try {
      console.log('Loading user ID for user:', user)
      const userId = await getUserId(user.username)
      console.log('Got user ID:', userId)
      if (userId) {
        // Update user state and save to localStorage
        const updatedUser = { ...user, userId }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        console.log('Loading personas for user ID:', userId)
        loadPersonas(userId)
      } else {
        setError('User not found. Please log in again.')
      }
    } catch (err) {
      console.error('Failed to load user ID:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user'
      setError(`${errorMessage}. Please try logging in again.`)
    }
  }

  const loadPersonas = async (userId?: number) => {
    try {
      if (!userId) return

      console.log('Loading personas for user ID:', userId)
      const response = await apiCall(`/user/${userId}/characters`)
      const mappedPersonas = response.characters?.map((p: any) => ({
        id: p.persona_id,
        character_name: p.character_name,
        mode: p.mode,
        tone: p.tone,
        summary: p.summary,
        created_at: p.created_at
      })) || []
      console.log('Loaded personas:', mappedPersonas)
      setPersonas(mappedPersonas)
    } catch (err) {
      console.error('Failed to load personas:', err)
      // Just set empty personas - user can create new ones
      setPersonas([])
    }
  }

  const createPersona = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Creating persona with data:', {
        username: user.username,
        mode,
        tone,
        characterName,
        customPrompt
      })

      const formData = new FormData()
      formData.append('username', user.username)
      formData.append('mode', mode)
      formData.append('tone', tone)

      if (mode === 'auto') {
        formData.append('character_name', characterName)
      } else {
        formData.append('character_name', characterName)
        formData.append('custom_prompt', customPrompt)
      }

      console.log('Sending request to /set_character')
      const response = await fetch('/api/set_character', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Create persona error:', errorData)
        throw new Error(errorData.error || `Failed to create persona (${response.status})`)
      }

      const data = await response.json()
      console.log('Create persona response:', data)

      const newPersona: Persona = {
        id: data.persona_id,
        character_name: data.character_name,
        mode: mode,
        tone: tone,
        summary: data.summary,
        created_at: new Date().toISOString()
      }

      console.log('New persona created:', newPersona)
      setPersonas(prev => [...prev, newPersona])
      setSelectedPersona(newPersona)
      setShowCreatePersona(false)

      // Reset form
      setCharacterName('')
      setCustomPrompt('')
      setTone('neutral')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create persona'
      console.error('Create persona error:', err)
      setError(`${errorMessage}. The backend server may be unavailable.`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedPersona || !user || !user.userId) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('user_id', user.userId!.toString())
      formData.append('persona_id', selectedPersona.id.toString())
      formData.append('user_message', currentMessage)
      formData.append('max_history', '15')

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to send message (${response.status})`)
      }

      const data = await response.json()

      // Add user message
      const userMessage: CharacterMessage = {
        id: Date.now(),
        sender: 'user',
        message: currentMessage,
        created_at: new Date().toISOString()
      }

      // Add agent response
      const agentMessage: CharacterMessage = {
        id: Date.now() + 1,
        sender: 'agent',
        message: data.response,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage, agentMessage])
      setCurrentMessage('')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(`${errorMessage}. The backend server may be unavailable.`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatHistory = async () => {
    if (!selectedPersona || !user || !user.userId) return

    try {
      console.log('Loading chat history for user:', user.userId, 'persona:', selectedPersona.id)
      const history = await apiCall(`/history/${user.userId}/${selectedPersona.id}`)
      console.log('Chat history response:', history)

      // Ensure we always set an array
      if (Array.isArray(history)) {
        setMessages(history)
      } else if (history && Array.isArray(history.messages)) {
        setMessages(history.messages)
      } else {
        console.log('No valid history array found, setting empty array')
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to load history:', err)
      setMessages([]) // Always ensure messages is an array
    }
  }

  const deletePersona = async (personaId: number) => {
    if (!user || !user.userId) return

    try {
      const formData = new FormData()
      formData.append('user_id', user.userId.toString())

      const response = await fetch(`/api/character/${personaId}`, {
        method: 'DELETE',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to delete persona (${response.status})`)
      }

      setPersonas(prev => prev.filter(p => p.id !== personaId))
      if (selectedPersona?.id === personaId) {
        setSelectedPersona(null)
        setMessages([]) // Reset to empty array
      }

      // Show success message
      console.log('Character deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete persona'
      setError(`${errorMessage}. The backend server may be unavailable.`)
    }
  }

  const handleDeleteClick = (persona: Persona, e: React.MouseEvent) => {
    e.stopPropagation()
    setPersonaToDelete(persona)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (personaToDelete) {
      const personaId = personaToDelete.id
      // Close dialog immediately for better UX
      setDeleteConfirmOpen(false)
      setPersonaToDelete(null)
      // Then perform delete in background
      await deletePersona(personaId)
    }
  }

  useEffect(() => {
    if (selectedPersona) {
      loadChatHistory()
    }
  }, [selectedPersona])

  const handleBackToMain = () => {
    router.push('/')
  }

  if (isCheckingAuth) {
    return (
      <>
        <AuroraBackground />
        <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-white/10 bg-black/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-400" />
                <p className="text-indigo-200">Checking authentication...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <AuroraBackground />
        <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-white/10 bg-black/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-400" />
                <p className="text-indigo-200">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <AuroraBackground />

      <style jsx>{`
        @keyframes slide-in-right {
          from { 
            opacity: 0;
            transform: translateX(50px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-left {
          from { 
            opacity: 0;
            transform: translateX(-50px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounce-in {
          0% { 
            opacity: 0;
            transform: scale(0.3);
          }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
        .slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
        .bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .message-hover {
          transition: all 0.3s ease;
        }
        .message-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBackToMain}
                className="flex items-center gap-2 border-white/20 text-white/70 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to AI Chat
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-110 transition-transform duration-300">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">
                  Character Chat
                </h1>
                <p className="text-sm text-purple-300/70">
                  Welcome back, {user.username}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('user')
                setUser(null)
                router.push('/')
              }}
              className="flex items-center gap-2 border-white/20 text-white/70 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
            >
              <Lock className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Selection */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)] flex flex-col shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-purple-400" />
                    <CardTitle className="text-xl text-white">Characters</CardTitle>
                  </div>
                  {/* Create Character Button */}
                  <Button
                    size="sm"
                    onClick={() => setShowCreatePersona(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                {/* Create Character Modal */}
                {showCreatePersona && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setShowCreatePersona(false)}
                  >
                    <div
                      className="bg-[#0f0a1e]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-[600px] w-full max-h-[80vh] overflow-hidden flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <h2 className="text-xl font-semibold text-white">Create New Character</h2>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreatePersona(false)}
                          className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                        >
                          ×
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <p className="text-indigo-200/70">
                          Design a new AI character with specific personality traits and communication style.
                        </p>

                        <div>
                          <Label htmlFor="mode" className="text-indigo-200">Mode</Label>
                          <Select value={mode} onValueChange={(value: 'auto' | 'custom') => setMode(value)}>
                            <SelectTrigger className="bg-white/5 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto Character</SelectItem>
                              <SelectItem value="custom">Custom Character</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {mode === 'auto' ? (
                          <div>
                            <Label htmlFor="character-name" className="text-indigo-200">Character Name</Label>
                            <Input
                              id="character-name"
                              value={characterName}
                              onChange={(e) => setCharacterName(e.target.value)}
                              placeholder="e.g., Sherlock Holmes"
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label htmlFor="character-name" className="text-indigo-200">Character Name</Label>
                              <Input
                                id="character-name"
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                placeholder="e.g., Mary, Friends Mom"
                                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              />
                            </div>
                            <div>
                              <Label htmlFor="custom-prompt" className="text-indigo-200">Custom Prompt</Label>
                              <Textarea
                                id="custom-prompt"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Describe your character's personality, background, and expertise..."
                                className="min-h-[120px] max-h-[200px] resize-y bg-white/5 border-white/20 text-white placeholder:text-white/40"
                                rows={6}
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <Label htmlFor="tone" className="text-indigo-200">Tone</Label>
                          <p className="text-xs text-indigo-300/50 mb-2">Select a preset or type your own custom tone</p>
                          <Input
                            id="tone"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            placeholder="Type a custom tone or select below..."
                            className="mb-3 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                          />
                          <div className="flex flex-wrap gap-2">
                            {['neutral', 'friendly', 'professional', 'casual', 'humorous', 'formal', 'matured', 'sarcastic', 'enthusiastic', 'calm'].map((presetTone) => (
                              <Badge
                                key={presetTone}
                                variant={tone === presetTone ? 'default' : 'outline'}
                                className={`cursor-pointer capitalize transition-all duration-200 hover:scale-105 ${tone === presetTone
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                                  : 'border-white/20 text-indigo-200/70 hover:bg-white/10 hover:border-purple-400/50'
                                  }`}
                                onClick={() => setTone(presetTone)}
                              >
                                {presetTone}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {error && (
                          <Alert className="border-red-500/30 bg-red-500/10">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <AlertDescription className="text-red-300">
                              {error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 p-6 border-t border-white/10 bg-black/30">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreatePersona(false)}
                          disabled={isLoading}
                          className="flex-1 border-white/20 text-white/70 bg-white/5 hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createPersona}
                          disabled={isLoading || !characterName.trim() || (mode === 'custom' && !customPrompt.trim())}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Create Character
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-3 p-4">
                    {personas.map((persona) => (
                      <Card
                        key={persona.id}
                        className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] border ${selectedPersona?.id === persona.id
                          ? 'ring-2 ring-purple-500 bg-purple-500/20 border-purple-500/30'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        onClick={() => setSelectedPersona(persona)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                                {persona.character_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate text-white">{persona.character_name}</h3>
                              <p className="text-xs text-indigo-300/60 capitalize">{persona.tone} • {persona.mode}</p>
                              <p className="text-xs text-indigo-200/40 mt-1 line-clamp-2">{persona.summary}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleDeleteClick(persona, e)}
                              className="h-8 w-8 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border-white/10 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-xl text-white">
                    {selectedPersona ? `Chat with ${selectedPersona.character_name}` : 'Select a Character'}
                  </CardTitle>
                  {selectedPersona && (
                    <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {selectedPersona.tone}
                    </Badge>
                  )}
                </div>
                {selectedPersona && (
                  <CardDescription className="text-indigo-300/60">{selectedPersona.summary}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                {selectedPersona ? (
                  <>
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-4 p-4">
                        {Array.isArray(messages) && messages.length === 0 ? (
                          <div className="text-center py-8 bounce-in">
                            <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bot className="w-10 h-10 text-purple-400" />
                            </div>
                            <p className="text-indigo-300/60">Start a conversation with {selectedPersona.character_name}</p>
                          </div>
                        ) : (
                          Array.isArray(messages) && messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${message.sender === 'user' ? 'slide-in-right' : 'slide-in-left'
                                }`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-2xl message-hover ${message.sender === 'user'
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                  : 'bg-white/10 border border-white/10 text-indigo-100'
                                  }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {message.sender === 'user' ? (
                                    <User className="w-4 h-4" />
                                  ) : (
                                    <Bot className="w-4 h-4 text-purple-400" />
                                  )}
                                  <span className="text-xs font-medium">
                                    {message.sender === 'user' ? 'You' : selectedPersona.character_name}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                                <p className="text-xs mt-1 opacity-50">
                                  {new Date(message.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Fixed Input Area */}
                    <div className="border-t border-white/10 bg-gradient-to-r from-black/40 via-purple-950/20 to-black/40 p-4 flex-shrink-0">
                      <div className="flex gap-2">
                        <Input
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          placeholder={`Message ${selectedPersona.character_name}...`}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={isLoading || !currentMessage.trim()}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bounce-in">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCircle className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No Character Selected</h3>
                      <p className="text-indigo-300/60">Choose a character from the sidebar to start chatting</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Alert className="mt-4 border-red-500/30 bg-red-500/10">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px] bg-[#0f0a1e]/95 border border-white/10 backdrop-blur-xl text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Delete Character
              </DialogTitle>
              <DialogDescription className="text-indigo-200/60">
                Are you sure you want to delete <strong className="text-white">{personaToDelete?.character_name}</strong>?
                This action cannot be undone and will also delete all chat history with this character.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setPersonaToDelete(null)
                }}
                className="border-white/20 text-white/70 bg-white/5 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Character
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
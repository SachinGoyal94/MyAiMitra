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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
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
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        /* Custom scrollbar for chat area */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        /* Custom scrollbar for textarea specifically */
        textarea.custom-scrollbar::-webkit-scrollbar {
          width: 8px !important;
        }
        textarea.custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 4px !important;
        }
        textarea.custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 4px !important;
          border: 2px solid #f1f5f9 !important;
        }
        textarea.custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
      `}</style>

      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBackToMain}
                className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:scale-[1.02]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to AI Chat
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Character Chat
                </h1>
                <p className="text-sm text-muted-foreground">
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
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:scale-[1.02]"
            >
              <Lock className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Selection */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)] flex flex-col shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-xl">Characters</CardTitle>
                  </div>
                  {/* Create Character Button */}
                  <Button
                    size="sm"
                    onClick={() => setShowCreatePersona(true)}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowCreatePersona(false)}
                  >
                    <div
                      className="bg-white rounded-lg shadow-xl max-w-[600px] w-full max-h-[80vh] overflow-hidden flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <h2 className="text-xl font-semibold">Create New Character</h2>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreatePersona(false)}
                          className="h-8 w-8 p-0"
                        >
                          ×
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <p className="text-gray-600">
                          Design a new AI character with specific personality traits and communication style.
                        </p>

                        <div>
                          <Label htmlFor="mode">Mode</Label>
                          <Select value={mode} onValueChange={(value: 'auto' | 'custom') => setMode(value)}>
                            <SelectTrigger>
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
                            <Label htmlFor="character-name">Character Name</Label>
                            <Input
                              id="character-name"
                              value={characterName}
                              onChange={(e) => setCharacterName(e.target.value)}
                              placeholder="e.g., Sherlock Holmes"
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label htmlFor="character-name">Character Name</Label>
                              <Input
                                id="character-name"
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                placeholder="e.g., Mary, Friends Mom"
                              />
                            </div>
                            <div>
                              <Label htmlFor="custom-prompt">Custom Prompt</Label>
                              <Textarea
                                id="custom-prompt"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Describe your character's personality, background, and expertise..."
                                className="min-h-[120px] max-h-[200px] resize-y overflow-y-auto custom-scrollbar"
                                rows={6}
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <Label htmlFor="tone">Tone</Label>
                          <p className="text-xs text-gray-500 mb-2">Select a preset or type your own custom tone</p>
                          <Input
                            id="tone"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            placeholder="Type a custom tone or select below..."
                            className="mb-3"
                          />
                          <div className="flex flex-wrap gap-2">
                            {['neutral', 'friendly', 'professional', 'casual', 'humorous', 'formal', 'matured', 'sarcastic', 'enthusiastic', 'calm'].map((presetTone) => (
                              <Badge
                                key={presetTone}
                                variant={tone === presetTone ? 'default' : 'outline'}
                                className={`cursor-pointer capitalize transition-all duration-200 hover:scale-105 ${tone === presetTone
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-transparent'
                                  : 'hover:bg-purple-100 hover:border-purple-300'
                                  }`}
                                onClick={() => setTone(presetTone)}
                              >
                                {presetTone}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {error && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <AlertDescription className="text-red-700">
                              {error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 p-6 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreatePersona(false)}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createPersona}
                          disabled={isLoading || !characterName.trim() || (mode === 'custom' && !customPrompt.trim())}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
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
                <ScrollArea className="flex-1 min-h-0 custom-scrollbar">
                  <div className="space-y-3 p-4">
                    {personas.map((persona) => (
                      <Card
                        key={persona.id}
                        className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${selectedPersona?.id === persona.id
                          ? 'ring-2 ring-purple-500 bg-purple-50'
                          : 'hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedPersona(persona)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0">
                              <AvatarFallback className="text-white font-bold">
                                {persona.character_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{persona.character_name}</h3>
                              <p className="text-xs text-muted-foreground capitalize">{persona.tone} • {persona.mode}</p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{persona.summary}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleDeleteClick(persona, e)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 flex-shrink-0"
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
            <Card className="h-[calc(100vh-200px)] flex flex-col shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-xl">
                    {selectedPersona ? `Chat with ${selectedPersona.character_name}` : 'Select a Character'}
                  </CardTitle>
                  {selectedPersona && (
                    <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 border-purple-200">
                      {selectedPersona.tone}
                    </Badge>
                  )}
                </div>
                {selectedPersona && (
                  <CardDescription>{selectedPersona.summary}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                {selectedPersona ? (
                  <>
                    <ScrollArea className="flex-1 min-h-0 custom-scrollbar">
                      <div className="space-y-4 p-4">
                        {Array.isArray(messages) && messages.length === 0 ? (
                          <div className="text-center py-8">
                            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Start a conversation with {selectedPersona.character_name}</p>
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
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                                  }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {message.sender === 'user' ? (
                                    <User className="w-4 h-4" />
                                  ) : (
                                    <Bot className="w-4 h-4" />
                                  )}
                                  <span className="text-xs font-medium">
                                    {message.sender === 'user' ? 'You' : selectedPersona.character_name}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                                <p className="text-xs mt-1 opacity-70">
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
                    <div className="border-t bg-white p-4 flex-shrink-0">
                      <div className="flex gap-2">
                        <Input
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          placeholder={`Message ${selectedPersona.character_name}...`}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={isLoading || !currentMessage.trim()}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
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
                    <div className="text-center">
                      <UserCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Character Selected</h3>
                      <p className="text-gray-500">Choose a character from the sidebar to start chatting</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Delete Character
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{personaToDelete?.character_name}</strong>?
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
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isLoading}
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
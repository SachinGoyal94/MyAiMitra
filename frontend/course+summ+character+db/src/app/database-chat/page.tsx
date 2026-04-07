'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BACKEND_URLS } from '@/config/backend_urls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Database, MessageCircle, Send, Settings, Key, Server, User, Lock, Globe, Plug, Bot, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatMessage {
  id: number
  type: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface DatabaseConfig {
  mysql_host: string
  mysql_user: string
  mysql_password: string
  mysql_db: string
  mysql_port: string
}

export default function DatabaseChatPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Database configuration
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    mysql_host: '',
    mysql_user: '',
    mysql_password: '',
    mysql_db: '',
    mysql_port: '3306'
  })



  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleDatabaseConnect = async () => {
    // Validate all fields are filled
    if (!dbConfig.mysql_host || !dbConfig.mysql_user || !dbConfig.mysql_password || !dbConfig.mysql_db || !dbConfig.mysql_port) {
      setError('All fields are required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Test connection
      const response = await fetch(`${BACKEND_URLS.DB_CHAT}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "test",
          ...dbConfig
        })
      })

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`)
      }

      setIsConnected(true)
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        content: `✅ Connected to: ${dbConfig.mysql_db}@${dbConfig.mysql_host}:${dbConfig.mysql_port}`,
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to database'
      setError(`${errorMessage}. Check connection details and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentQuery.trim() || !isConnected) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuery.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentQuery('')
    setIsLoading(true)
    setError(null)

    try {
      // Use our local API route
      const apiResponse = await fetch('/api/database-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery.trim(),
          ...dbConfig
        })
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed: ${apiResponse.status} ${apiResponse.statusText}`)
      }

      const response = await apiResponse.json()

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response || response.answer || 'No response received',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send request'
      setError(`${errorMessage}. Check connection and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setMessages([])
    setError(null)
  }

  const handleConfigChange = (field: keyof DatabaseConfig, value: string) => {
    setDbConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-4 shadow-lg float-animation">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Database Chat
          </h1>
          <p className="text-lg text-muted-foreground">
            Chat with your MySQL database using natural language
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="mt-4"
          >
            ← Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Configuration Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm slide-up h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Database Configuration
                </CardTitle>
                <CardDescription>
                  {isConnected ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Connected to {dbConfig.mysql_db}
                    </span>
                  ) : (
                    'Configure your MySQL connection'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mysql_host" className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        Host *
                      </Label>
                      <Input
                        id="mysql_host"
                        placeholder="localhost or IP address"
                        value={dbConfig.mysql_host}
                        onChange={(e) => handleConfigChange('mysql_host', e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_user" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Username *
                      </Label>
                      <Input
                        id="mysql_user"
                        placeholder="database username"
                        value={dbConfig.mysql_user}
                        onChange={(e) => handleConfigChange('mysql_user', e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password *
                      </Label>
                      <Input
                        id="mysql_password"
                        type="password"
                        placeholder="database password"
                        value={dbConfig.mysql_password}
                        onChange={(e) => handleConfigChange('mysql_password', e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_db" className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Database Name *
                      </Label>
                      <Input
                        id="mysql_db"
                        placeholder="database name"
                        value={dbConfig.mysql_db}
                        onChange={(e) => handleConfigChange('mysql_db', e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_port" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Port *
                      </Label>
                      <Input
                        id="mysql_port"
                        placeholder="3306"
                        value={dbConfig.mysql_port}
                        onChange={(e) => handleConfigChange('mysql_port', e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>



                    <Button 
                      onClick={handleDatabaseConnect} 
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plug className="mr-2 h-4 w-4" />
                          Connect to Database
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Connection Active</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Database:</strong> {dbConfig.mysql_db}</p>
                        <p><strong>Host:</strong> {dbConfig.mysql_host}:{dbConfig.mysql_port}</p>
                        <p><strong>User:</strong> {dbConfig.mysql_user}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleDisconnect}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm slide-up h-[700px]" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Database Chat Interface
                </CardTitle>
                <CardDescription>
                  {isConnected ? 
                    'Ask questions about your database in natural language' : 
                    'Connect to a database to start chatting'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0 overflow-hidden" style={{ height: '450px', position: 'relative' }}>
                <div className="p-4 overflow-y-auto custom-scrollbar" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        {isConnected ? 'Start a conversation' : 'Connect to database first'}
                      </h3>

                    </div>
                  ) : (
                    <div className="space-y-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 break-words overflow-wrap-anywhere overflow-hidden ${
                              message.type === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.type === 'user' ? (
                                <User className="w-4 h-4" />
                              ) : (
                                <Bot className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {message.type === 'user' ? 'You' : 'DB Assistant'}
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere overflow-hidden">
                              {message.content}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              </CardContent>
              
              {/* Input Area */}
              {isConnected && (
                <CardContent className="border-t border-gray-200 p-4" style={{ height: '100px' }}>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask about your database..."
                      value={currentQuery}
                      onChange={(e) => setCurrentQuery(e.target.value)}
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !currentQuery.trim()}
                      className="self-end bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
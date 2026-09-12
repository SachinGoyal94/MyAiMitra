'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Database, MessageCircle, Send, Settings, Server, User, Lock, Globe, Bot, CheckCircle, AlertCircle, Eye, EyeOff, Plug } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/ui/AuroraBackground'

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

export default function DBChatPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [mockMode, setMockMode] = useState(true) // Start with mock mode enabled
  const [showPassword, setShowPassword] = useState(false)
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

  const handleSendMessage = async () => {
    if (!currentQuery.trim()) return

    // For live mode, check if database config is filled
    if (!mockMode) {
      if (!dbConfig.mysql_host || !dbConfig.mysql_user || !dbConfig.mysql_password || !dbConfig.mysql_db || !dbConfig.mysql_port) {
        setError('Please fill in all database connection fields before sending queries')
        return
      }
    }

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
      let response: any

      if (mockMode) {
        // Mock response for demo
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Generate contextual mock responses
        const query = currentQuery.toLowerCase()
        let mockResponse = ''
        
        if (query.includes('table') || query.includes('show')) {
          mockResponse = `I found the following tables in your database:\n\n📋 **Tables Found:**\n• **users** - User accounts and profiles\n• **orders** - Customer orders and transactions\n• **products** - Product catalog and inventory\n• **categories** - Product categories\n• **order_items** - Order line items\n\nTotal: 5 tables\n\nWould you like me to show the structure of any specific table?`
        } else if (query.includes('user') || query.includes('customer')) {
          mockResponse = `📊 **User Data Analysis:**\n\n**Total Users:** 1,247\n**Active Users:** 892 (71.5%)\n**New Users (last 30 days):** 45\n\n**Recent User Activity:**\n• Most active: john.doe@example.com (23 logins)\n• Newest signup: emily.wilson@example.com (2 hours ago)\n• Top region: United States (45% of users)\n\nWould you like more detailed user analytics?`
        } else if (query.includes('order') || query.includes('purchase')) {
          mockResponse = `🛒 **Order Analysis:**\n\n**Total Orders:** 3,456\n**Revenue:** $124,567.89\n**Average Order Value:** $36.04\n\n**Recent Orders:**\n• Last 24 hours: 23 orders ($2,345.67)\n• Pending: 8 orders\n• Completed: 3,448 orders\n\n**Top Products:**\n1. Premium Widget - 234 orders\n2. Standard Gadget - 189 orders\n3. Deluxe Tool - 156 orders\n\nNeed more specific order information?`
        } else if (query.includes('product') || query.includes('inventory')) {
          mockResponse = `📦 **Product Inventory:**\n\n**Total Products:** 156\n**In Stock:** 142 (91%)\n**Low Stock:** 8 items\n**Out of Stock:** 6 items\n\n**Top Selling Products:**\n1. Premium Widget - 234 sold, 45 remaining\n2. Standard Gadget - 189 sold, 67 remaining\n3. Deluxe Tool - 156 sold, 12 remaining\n\n**Categories:**\n• Electronics: 45 products\n• Tools: 38 products\n• Accessories: 73 products\n\nWould you like to see details for any specific product?`
        } else {
          mockResponse = `I understand you're asking about: "${currentQuery}"\n\nIn **Mock Mode**, I can help you with various database queries like:\n\n📊 **Data Analysis:**\n• User statistics and trends\n• Order analytics and revenue\n• Product performance metrics\n• Inventory management\n\n🔍 **Schema Exploration:**\n• Table structures and relationships\n• Column types and constraints\n• Index information\n• Foreign key relationships\n\n**Try asking:**\n• "Show me all tables"\n• "How many users do we have?"\n• "What are our top-selling products?"\n• "Find recent orders"\n\nSince this is mock mode, I'm providing simulated responses. Connect to a real database to get actual data!`
        }
        
        response = { response: mockResponse }
      } else {
        // Send all database credentials with every query to our local API route
        const requestData = {
          query: currentQuery.trim(),
          mysql_host: dbConfig.mysql_host,
          mysql_user: dbConfig.mysql_user,
          mysql_password: dbConfig.mysql_password,
          mysql_db: dbConfig.mysql_db,
          mysql_port: dbConfig.mysql_port
        }
        
        console.log('Sending request to local API with data:', requestData)
        
        const apiResponse = await fetch('/api/database-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        })

        console.log('API Response status:', apiResponse.status)
        console.log('API Response headers:', Object.fromEntries(apiResponse.headers.entries()))

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}))
          console.error('API Error Response:', errorData)
          
          // Enhanced error message with more details
          let errorMessage = `Query failed: ${apiResponse.status} ${apiResponse.statusText}`
          if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.details) {
            errorMessage += `\n\nDetails: ${errorData.details}`
          }
          if (errorData.suggestion) {
            errorMessage += `\n\nSuggestion: ${errorData.suggestion}`
          }
          
          throw new Error(errorMessage)
        }

        response = await apiResponse.json()
        console.log('API Success Response:', response)
      }

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response || response.answer || 'No response received',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send query'
      
      // Check if it's a network/connectivity issue
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error') || errorMessage.includes('fetch failed')) {
        setError(`🌐 **Network Connection Error**\n\n${errorMessage}\n\n**The external database API appears to be unavailable.**\n\n**Recommended Solutions:**\n✅ **Use Mock Mode** - Toggle to Mock Mode above to test the interface immediately\n🔄 **Try Again Later** - The external service might be temporarily down\n🌐 **Check Internet** - Verify your network connection\n\n**Current Mode:** ${mockMode ? 'Mock Mode (should work offline)' : 'Live Database Mode (API unavailable)'}`)
      } else if (errorMessage.includes('Connection test failed')) {
        // Already formatted error from testConnection
        setError(errorMessage)
      } else {
        setError(`${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigChange = (field: keyof DatabaseConfig, value: string) => {
    setDbConfig(prev => ({ ...prev, [field]: value }))
  }

  const testConnection = async () => {
    if (mockMode) {
      setError('Connection test not needed in Mock Mode - it works offline!')
      return
    }

    if (!dbConfig.mysql_host || !dbConfig.mysql_user || !dbConfig.mysql_password || !dbConfig.mysql_db || !dbConfig.mysql_port) {
      setError('Please fill in all database connection fields first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const requestData = {
        query: "SELECT 1 as test",
        mysql_host: dbConfig.mysql_host,
        mysql_user: dbConfig.mysql_user,
        mysql_password: dbConfig.mysql_password,
        mysql_db: dbConfig.mysql_db,
        mysql_port: dbConfig.mysql_port
      }
      
      console.log('Testing connection with:', { ...requestData, mysql_password: '***' })
      
      const apiResponse = await fetch('/api/database-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}))
        throw new Error(`Connection test failed: ${errorData.error || apiResponse.statusText}`)
      }

      const response = await apiResponse.json()
      setError('✅ Connection test successful! Your database is accessible.')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed'
      setError(`❌ **Connection Test Failed**\n\n${errorMessage}\n\n**Troubleshooting Tips:**\n• Verify database server is running and accessible\n• Check if host, port, username, password, and database name are correct\n• Ensure your database allows remote connections\n• Check firewall settings\n• Try using Mock Mode to test the interface`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <AuroraBackground />

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
      `}</style>

      <div className="max-w-7xl mx-auto p-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)] float-animation">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-200 via-emerald-200 to-cyan-200 bg-clip-text text-transparent mb-2">
            Database Chat
          </h1>
          <p className="text-lg text-indigo-300/70">
            Chat with your MySQL database using natural language
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="mt-4 border-white/20 text-white/70 bg-white/5 hover:bg-white/10"
          >
            ← Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Configuration Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl slide-up h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5 text-green-400" />
                  Database Configuration
                </CardTitle>
                <CardDescription className="text-indigo-300/60">
                  {mockMode ? '✅ Mock Mode Active - Works Offline' : '⚠️ Live DB Mode - External API May Be Unavailable'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-300" />
                    <span className="text-sm text-indigo-200/80">
                      {mockMode ? 'Mock Mode Active' : 'Live DB Mode'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMockMode(!mockMode)}
                    className={`text-xs ${mockMode ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/5 border-white/20 text-indigo-200/70'}`}
                  >
                    {mockMode ? '✓ Mock' : 'Live DB'}
                  </Button>
                </div>

                {!mockMode && (
                  <>
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-xs text-orange-300">
                        ⚠️ <strong>Warning:</strong> The external database API appears to be currently unavailable. Consider using Mock Mode for testing.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mysql_host" className="flex items-center gap-2 text-indigo-200">
                        <Server className="w-4 h-4" />
                        Host *
                      </Label>
                      <Input
                        id="mysql_host"
                        placeholder="localhost or IP address"
                        value={dbConfig.mysql_host}
                        onChange={(e) => handleConfigChange('mysql_host', e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-green-500/50 focus:ring-green-500/30"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_user" className="flex items-center gap-2 text-indigo-200">
                        <User className="w-4 h-4" />
                        Username *
                      </Label>
                      <Input
                        id="mysql_user"
                        placeholder="database username"
                        value={dbConfig.mysql_user}
                        onChange={(e) => handleConfigChange('mysql_user', e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-green-500/50 focus:ring-green-500/30"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_password" className="flex items-center gap-2 text-indigo-200">
                        <Lock className="w-4 h-4" />
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="mysql_password"
                          type={showPassword ? "text" : "password"}
                          placeholder="database password"
                          value={dbConfig.mysql_password}
                          onChange={(e) => handleConfigChange('mysql_password', e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-green-500/50 focus:ring-green-500/30 pr-10"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/50 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_db" className="flex items-center gap-2 text-indigo-200">
                        <Database className="w-4 h-4" />
                        Database Name *
                      </Label>
                      <Input
                        id="mysql_db"
                        placeholder="database name"
                        value={dbConfig.mysql_db}
                        onChange={(e) => handleConfigChange('mysql_db', e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-green-500/50 focus:ring-green-500/30"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mysql_port" className="flex items-center gap-2 text-indigo-200">
                        <Globe className="w-4 h-4" />
                        Port *
                      </Label>
                      <Input
                        id="mysql_port"
                        placeholder="3306"
                        value={dbConfig.mysql_port}
                        onChange={(e) => handleConfigChange('mysql_port', e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-green-500/50 focus:ring-green-500/30"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300">
                        💡 <strong>Tip:</strong> All database credentials are sent with every query for maximum flexibility. No need to connect first!
                      </p>
                    </div>

                    {/* Connection Test Button */}
                    <Button 
                      onClick={testConnection}
                      variant="outline"
                      disabled={isLoading}
                      className="w-full border-green-500/30 text-green-300 bg-green-500/10 hover:bg-green-500/20"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Plug className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </>
                )}

                {messages.length > 0 && (
                  <Button 
                    onClick={clearChat}
                    variant="outline"
                    className="w-full border-white/10 text-white/60 bg-white/5 hover:bg-white/10"
                  >
                    Clear Chat
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl slide-up h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  Database Chat Interface
                </CardTitle>
                <CardDescription className="text-indigo-300/60">
                  {mockMode ? 
                    'Ask questions about your database in Mock Mode' : 
                    'Ask questions about your database - all credentials sent with each query'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database className="w-10 h-10 text-green-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        Start querying your database
                      </h3>
                      <p className="text-sm text-indigo-300/60 max-w-md mb-4">
                        {mockMode 
                          ? 'Ask questions about your database schema, data, or run queries using natural language.'
                          : 'Configure your database credentials and start asking questions. All credentials are sent with each query.'
                        }
                      </p>
                      {mockMode && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-md">
                          <p className="text-xs text-blue-300 mb-2">
                            💡 <strong>Mock Mode Examples:</strong>
                          </p>
                          <div className="text-xs text-blue-300/70 space-y-1">
                            <p>• "Show me all tables"</p>
                            <p>• "How many users do we have?"</p>
                            <p>• "What are our top-selling products?"</p>
                            <p>• "Find recent orders"</p>
                          </div>
                        </div>
                      )}
                      {!mockMode && (
                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg max-w-md">
                          <p className="text-xs text-orange-300">
                            ⚡ <strong>Direct Query Mode:</strong> No connection needed! Just fill in your database details and start asking questions.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-3 ${
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                : 'bg-white/10 border border-white/10 text-indigo-100'
                            }`}
                          >
                            <div className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </div>
                            <div className={`text-xs mt-1 ${
                              message.type === 'user' ? 'text-green-200/60' : 'text-indigo-300/40'
                            }`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-white/10 bg-gradient-to-r from-black/40 via-green-950/20 to-black/40 p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={
                        mockMode 
                          ? "Ask about your database... (e.g., 'Show me all tables', 'How many users do we have?')"
                          : "Ask about your database... (e.g., 'Show me all tables', 'What users are in the database?')"
                      }
                      value={currentQuery}
                      onChange={(e) => setCurrentQuery(e.target.value)}
                      className="flex-1 min-h-[60px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-green-500/50 focus:ring-green-500/30"
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
                      className="self-end bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {!mockMode && (!dbConfig.mysql_host || !dbConfig.mysql_user || !dbConfig.mysql_password || !dbConfig.mysql_db) && (
                    <p className="text-xs text-orange-300/70 mt-2">
                      ⚠️ Please fill in all database credentials before sending queries
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mt-6 border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
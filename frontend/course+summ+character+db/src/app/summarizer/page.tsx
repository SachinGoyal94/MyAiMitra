'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FeatureGuide from '@/components/FeatureGuide'
import { 
  Loader2, 
  Globe, 
  Youtube, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Copy,
  Download,
  Share2,
  Sparkles,
  BookOpen,
  Link2,
  FileText,
  PenTool,
  Languages
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/ui/AuroraBackground'
import { BACKEND_URLS } from '@/config/backend_urls'

interface SummaryResult {
  type: 'web' | 'youtube'
  summary: string
  url?: string
  processingTime?: number
  characterCount?: number
}

interface BlogResult {
  type: 'web' | 'youtube'
  blog: string
  url?: string
  processingTime?: number
  characterCount?: number
}

export default function Summarizer() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('web')
  const [activeMode, setActiveMode] = useState<'summarize' | 'blog'>('summarize')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [blogResult, setBlogResult] = useState<BlogResult | null>(null)
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Form states
  const [webUrl, setWebUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  
  const API_BASE = BACKEND_URLS.SUMMARIZER
  const API_TIMEOUT = 30000 // 30 seconds timeout

  // Helper function for API calls with timeout and error handling
  const makeApiCall = async (url: string, errorMessage: string, retryAttempt = 0) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Failed to parse server response. Please try again.')
      }
      
      setRetryCount(0)
      
      return data
    } catch (err) {
      clearTimeout(timeoutId)
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. The server may be busy. Please try again in a moment.')
        }
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          if (retryAttempt < 2) {
            // Wait 2 seconds and retry
            await new Promise(resolve => setTimeout(resolve, 2000))
            return makeApiCall(url, errorMessage, retryAttempt + 1)
          }
          
          throw new Error('Unable to connect to the AI service. The service appears to be temporarily unavailable. Please try again later.')
        }
        if (err.message.includes('CORS')) {
          throw new Error('Cross-origin request blocked. The service may be experiencing issues.')
        }
        throw err
      }
      
      throw new Error(errorMessage)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadSummary = () => {
    if (!result) return
    
    const blob = new Blob([result.summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary-${result.type}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadBlog = () => {
    if (!blogResult) return
    
    const blob = new Blob([blogResult.blog], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-${blogResult.type}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const summarizeWeb = async () => {
    if (!webUrl.trim()) {
      setError('Please enter a valid URL')
      return
    }

    // Basic URL validation
    try {
      new URL(webUrl)
    } catch {
      setError('Please enter a valid website URL (e.g., https://example.com)')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const startTime = Date.now()
      const data = await makeApiCall(
        `${API_BASE}/summarize/web?url=${encodeURIComponent(webUrl)}&lang=${selectedLanguage}`,
        'Failed to summarize website'
      )
      
      const processingTime = Date.now() - startTime

      // Validate the response data
      if (!data || !data.summary) {
        throw new Error('Invalid response from server: missing summary data')
      }

      setResult({
        type: 'web',
        summary: data.summary,
        url: webUrl,
        processingTime,
        characterCount: data.summary ? data.summary.length : 0
      })
      setSummaryGenerated(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to summarize website'
      setError(`${errorMessage}. Please check the URL and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const summarizeYoutube = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a valid YouTube URL')
      return
    }

    // Basic YouTube URL validation
    try {
      const url = new URL(youtubeUrl)
      if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
        throw new Error('Not a YouTube URL')
      }
    } catch {
      setError('Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setBlogResult(null)

    try {
      const startTime = Date.now()
      const data = await makeApiCall(
        `${API_BASE}/summarize/youtube?url=${encodeURIComponent(youtubeUrl)}&lang=${selectedLanguage}`,
        'Failed to summarize YouTube video'
      )
      
      const processingTime = Date.now() - startTime

      // Validate the response data
      if (!data || !data.summary) {
        throw new Error('Invalid response from server: missing summary data')
      }

      setResult({
        type: 'youtube',
        summary: data.summary,
        url: youtubeUrl,
        processingTime,
        characterCount: data.summary ? data.summary.length : 0
      })
      setSummaryGenerated(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to summarize YouTube video'
      setError(`${errorMessage}. Please check the URL and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateBlogFromWeb = async () => {
    if (!webUrl.trim()) {
      setError('Please enter a valid URL')
      return
    }

    // Basic URL validation
    try {
      new URL(webUrl)
    } catch {
      setError('Please enter a valid website URL (e.g., https://example.com)')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setBlogResult(null)

    try {
      const startTime = Date.now()
      const summary = result?.summary || ''
      console.log('Generating blog from web with:', { webUrl, summary, language: selectedLanguage })
      const data = await makeApiCall(
        `${API_BASE}/generate-blog/web?url=${encodeURIComponent(webUrl)}&summary=${encodeURIComponent(summary)}&lang=${selectedLanguage}`,
        'Failed to generate blog from website'
      )
      
      console.log('Blog generation response:', data)
      
      const processingTime = Date.now() - startTime

      // Validate the response data - check for possible field names
      const blogContent = data.response || data.blog || data.content || data.summary
      if (!data || !blogContent) {
        console.error('Invalid blog response:', data)
        throw new Error('Invalid response from server: missing blog data')
      }

      setBlogResult({
        type: 'web',
        blog: blogContent,
        url: webUrl,
        processingTime,
        characterCount: blogContent ? blogContent.length : 0
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate blog from website'
      setError(`${errorMessage}. Please check the URL and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateBlogFromYoutube = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a valid YouTube URL')
      return
    }

    // Basic YouTube URL validation
    try {
      const url = new URL(youtubeUrl)
      if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
        throw new Error('Not a YouTube URL')
      }
    } catch {
      setError('Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setBlogResult(null)

    try {
      const startTime = Date.now()
      const summary = result?.summary || ''
      console.log('Generating blog from YouTube with:', { youtubeUrl, language: selectedLanguage, summary })
      const data = await makeApiCall(
        `${API_BASE}/generate-blog/youtube?url=${encodeURIComponent(youtubeUrl)}&lang=${selectedLanguage}&summary=${encodeURIComponent(summary)}`,
        'Failed to generate blog from YouTube video'
      )
      
      console.log('YouTube blog generation response:', data)
      
      const processingTime = Date.now() - startTime

      // Validate the response data - check for possible field names
      const blogContent = data.response || data.blog || data.content || data.summary
      if (!data || !blogContent) {
        console.error('Invalid YouTube blog response:', data)
        throw new Error('Invalid response from server: missing blog data')
      }

      setBlogResult({
        type: 'youtube',
        blog: blogContent,
        url: youtubeUrl,
        processingTime,
        characterCount: blogContent ? blogContent.length : 0
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate blog from YouTube video'
      setError(`${errorMessage}. Please check the URL and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToMain = () => {
    router.push('/')
  }

  return (
    <>
      <FeatureGuide />
      <div className="min-h-screen relative overflow-hidden text-white">
      <AuroraBackground />

      <style jsx>{`
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
          }
          50% { 
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.8);
          }
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .summary-card {
          transition: all 0.3s ease;
        }
        .summary-card:hover {
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  AI Content Summarizer
                </h1>
                <p className="text-sm text-indigo-300/70">
                  Summarize websites, YouTube videos, and generate AI-powered blogs instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
        <div className="space-y-6">
          {/* Input Section */}
          <Card className="shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-xl text-white">Content Input</CardTitle>
              </div>
              <CardDescription className="text-indigo-300/60">
                Choose the type of content and operation you want to perform
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Mode Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block text-indigo-200">Operation Mode</Label>
                <Tabs value={activeMode} onValueChange={(value) => {
                  if (value === 'blog' && !summaryGenerated) return; // Prevent switching to blog if no summary
                  setActiveMode(value as 'summarize' | 'blog')
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                    <TabsTrigger value="summarize" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                      <FileText className="w-4 h-4" />
                      Summarize
                    </TabsTrigger>
                    <TabsTrigger 
                      value="blog" 
                      className={`flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70 ${
                        !summaryGenerated 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                      disabled={!summaryGenerated}
                    >
                      <PenTool className="w-4 h-4" />
                      Generate Blog
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {!summaryGenerated && (
                  <p className="text-xs text-indigo-300/50 mt-2">
                    Generate a summary first to enable blog generation
                  </p>
                )}
              </div>

              {/* Content Type Selection */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                  <TabsTrigger value="web" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                    <Globe className="w-4 h-4" />
                    Website
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="web" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="web-url" className="text-indigo-200">Website URL</Label>
                    <Input
                      id="web-url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="web-language" className="text-indigo-200">Language Code for Summary/Blog</Label>
                    <p className="text-xs text-indigo-300/50 mt-1 mb-2">
                      Enter language code for desired output language (e.g., en, hi, es, fr, de, ja, zh, ar)
                    </p>
                    <Input
                      id="web-language"
                      type="text"
                      placeholder="Enter language code (e.g., en, hi, es, fr, de)"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value.toLowerCase())}
                      className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/30"
                      maxLength={10}
                    />
                  </div>
                  <Button 
                    onClick={activeMode === 'summarize' ? summarizeWeb : generateBlogFromWeb}
                    disabled={isLoading || !webUrl.trim() || (activeMode === 'blog' && !summaryGenerated)}
                    className={`w-full shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                      activeMode === 'summarize' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/30'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {activeMode === 'summarize' ? 'Summarizing...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        {activeMode === 'summarize' ? 'Summarize Website' : 'Generate Blog'}
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="youtube" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="youtube-url" className="text-indigo-200">YouTube URL</Label>
                    <Input
                      id="youtube-url"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-red-500/50 focus:ring-red-500/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube-language" className="text-indigo-200">Audio Language for Processing</Label>
                    <p className="text-xs text-indigo-300/50 mt-1 mb-2">
                      Enter the language code for YouTube video transcript (e.g., en, hi, es, fr, de, ja, zh, ar)
                    </p>
                    <Input
                      id="youtube-language"
                      type="text"
                      placeholder="Enter language code (e.g., en, hi, es, fr, de)"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value.toLowerCase())}
                      className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-red-500/50 focus:ring-red-500/30"
                      maxLength={10}
                    />
                  </div>
                  <Alert className="bg-amber-500/10 border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-sm text-amber-300">
                      <strong>Important:</strong> YouTube video must have transcript available in the selected language for processing to work.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={activeMode === 'summarize' ? summarizeYoutube : generateBlogFromYoutube}
                    disabled={isLoading || !youtubeUrl.trim() || (activeMode === 'blog' && !summaryGenerated)}
                    className={`w-full shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                      activeMode === 'summarize' 
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-red-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {activeMode === 'summarize' ? 'Summarizing...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Youtube className="w-4 h-4 mr-2" />
                        {activeMode === 'summarize' ? 'Summarize Video' : 'Generate Blog'}
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="slide-up border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          {result ? (
            <Card className="shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl summary-card slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <CardTitle className="text-xl text-white">Summary</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                      {result.type === 'web' && <Globe className="w-3 h-3 mr-1" />}
                      {result.type === 'youtube' && <Youtube className="w-3 h-3 mr-1" />}
                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                      <FileText className="w-3 h-3 mr-1" />
                      Summary
                    </Badge>
                  </div>
                </div>
                {result.url && (
                  <CardDescription className="flex items-center gap-1 text-indigo-300/60">
                    <Link2 className="w-3 h-3" />
                    Source: {result.url}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-indigo-300/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.processingTime && 
                      `${(result.processingTime / 1000).toFixed(2)}s`
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {result.characterCount && 
                      `${result.characterCount.toLocaleString()} chars`
                    }
                  </div>
                </div>

                <ScrollArea className="h-[400px] w-full rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-indigo-100/80">
                    {result.summary}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.summary || '')}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSummary}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Summary',
                          text: result.summary,
                          url: result.url
                        })
                      }
                    }}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>

                {/* Blog Generation Section */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PenTool className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Generate Blog from Summary</h3>
                  </div>
                  <p className="text-sm text-indigo-300/60 mb-4">
                    Use this summary to generate a complete blog post with AI assistance.
                  </p>
                  <Button 
                    onClick={() => setActiveMode('blog')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Blog...
                      </>
                    ) : (
                      <>
                        <PenTool className="w-4 h-4 mr-2" />
                        Generate Blog Post
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : blogResult ? (
            <Card className="shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl summary-card slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <CardTitle className="text-xl text-white">Generated Blog</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                      {blogResult.type === 'web' && <Globe className="w-3 h-3 mr-1" />}
                      {blogResult.type === 'youtube' && <Youtube className="w-3 h-3 mr-1" />}
                      {blogResult.type.charAt(0).toUpperCase() + blogResult.type.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30">
                      <PenTool className="w-3 h-3 mr-1" />
                      Blog
                    </Badge>
                  </div>
                </div>
                {blogResult.url && (
                  <CardDescription className="flex items-center gap-1 text-indigo-300/60">
                    <Link2 className="w-3 h-3" />
                    Source: {blogResult.url}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-indigo-300/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {blogResult.processingTime && 
                      `${(blogResult.processingTime / 1000).toFixed(2)}s`
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {blogResult.characterCount && 
                      `${blogResult.characterCount.toLocaleString()} chars`
                    }
                  </div>
                </div>

                <ScrollArea className="h-[600px] w-full rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-indigo-100/80">
                    {blogResult.blog}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(blogResult.blog || '')}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Blog
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBlog}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Generated Blog',
                          text: blogResult.blog,
                          url: blogResult.url
                        })
                      }
                    }}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBlogResult(null)
                      setActiveMode('summarize')
                    }}
                    className="flex items-center gap-2 border-white/10 text-indigo-200/70 bg-white/5 hover:bg-white/10"
                  >
                    <FileText className="w-4 h-4" />
                    Back to Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[400px] flex items-center justify-center shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Ready to Summarize
                </h3>
                <p className="text-indigo-300/60 max-w-sm">
                  Enter a website URL or YouTube video link to generate an AI-powered summary instantly.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
    </>
  )
}
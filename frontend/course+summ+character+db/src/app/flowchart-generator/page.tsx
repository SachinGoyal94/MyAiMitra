'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, RefreshCw, ArrowLeft, Sparkles, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuroraBackground from '@/components/ui/AuroraBackground'

export default function FlowchartGenerator() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [flowchartId, setFlowchartId] = useState<string | null>(null)

  const API_BASE_URL = 'https://sachingoyal94-flowchart-space.hf.space'

  const handleGenerateFlowchart = async () => {
    if (!input.trim()) {
      setError('Please enter a flowchart description')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setHtmlContent(null)
    setFlowchartId(null)

    try {
      // Step 1: POST to /generate endpoint
      const generateResponse = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input.trim(),
        }),
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        throw new Error(errorData.detail || `API Error: ${generateResponse.status}`)
      }

      const responseData = await generateResponse.json()
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to generate flowchart')
      }

      const { flowchart_id, download_url } = responseData

      setFlowchartId(flowchart_id)
      
      // Step 2: GET the HTML file using the flowchart_id
      const htmlResponse = await fetch(`${API_BASE_URL}${download_url}`)
      
      if (!htmlResponse.ok) {
        throw new Error('Failed to fetch generated HTML')
      }

      const htmlText = await htmlResponse.text()
      setHtmlContent(htmlText)
      setSuccess('Flowchart generated successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate flowchart'
      setError(`${errorMessage}. Please try again.`)
      console.error('Flowchart generation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadHTML = () => {
    if (!htmlContent || !flowchartId) return

    try {
      const element = document.createElement('a')
      const file = new Blob([htmlContent], { type: 'text/html' })
      element.href = URL.createObjectURL(file)
      element.download = `flowchart_${flowchartId}.html`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      setSuccess('HTML file downloaded successfully!')
    } catch (err) {
      setError('Failed to download file')
    }
  }

  const handleClear = () => {
    setInput('')
    setHtmlContent(null)
    setFlowchartId(null)
    setError(null)
    setSuccess(null)
  }

  const exampleInputs = [
    "if a user age is more than 18 they can drive lmv and if more than 24 than hmv",
    "User logs in -> Validate credentials -> If valid, show dashboard, else show error",
    "Customer places order -> Check inventory -> If in stock, create shipment, else notify customer -> Process payment",
  ]

  const handleExampleInput = (example: string) => {
    setInput(example)
    setError(null)
  }

  return (
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
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 bg-clip-text text-transparent">
                    Flowchart Generator
                  </h1>
                </div>
              </Link>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 border-white/20 text-white/70 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Input Card */}
          <Card className="shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Flowchart Generator
              </CardTitle>
              <CardDescription className="text-indigo-300/60">Describe your flowchart logic to generate a diagram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Textarea */}
              <div className="space-y-2">
                <Label htmlFor="flowchart-input" className="text-sm font-medium text-indigo-200">
                  Flowchart Description
                </Label>
                <Textarea
                  id="flowchart-input"
                  placeholder="E.g., if a user age is more than 18 they can drive lmv and if more than 24 than hmv"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[200px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-500/50 focus:ring-yellow-500/30"
                />
                <p className="text-xs text-indigo-300/50">
                  Tip: Describe the logic flow, decision points, and conditions clearly
                </p>
              </div>

              {/* Example Inputs */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-indigo-200">Quick Examples</Label>
                <div className="space-y-2">
                  {exampleInputs.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleInput(example)}
                      className="w-full text-left justify-start text-xs h-auto py-2 px-3 border-white/10 bg-white/5 text-indigo-200/70 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300"
                    >
                      <span className="truncate">{example.substring(0, 50)}...</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <Button
                  onClick={handleGenerateFlowchart}
                  disabled={isLoading || !input.trim()}
                  className="w-full bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 hover:from-yellow-500 hover:via-orange-500 hover:to-pink-500 text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Flowchart
                    </>
                  )}
                </Button>

                {htmlContent && (
                  <>
                    <Button
                      onClick={handleDownloadHTML}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download HTML
                    </Button>

                    {flowchartId && (
                      <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                        <p className="text-xs font-medium text-indigo-200 mb-2">Flowchart ID:</p>
                        <p className="text-xs text-indigo-300/60 break-all font-mono">{flowchartId}</p>
                      </div>
                    )}
                  </>
                )}

                {input && (
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="w-full border-white/10 text-white/60 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Status Messages */}
              {error && (
                <Alert className="border-red-500/30 bg-red-500/10 slide-up">
                  <AlertDescription className="text-red-300 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500/30 bg-green-500/10 slide-up">
                  <AlertDescription className="text-green-300 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Information Section */}
          <Card className="mt-6 shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-lg text-white">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Step 1</Badge>
                  <h4 className="font-medium text-white">Describe Your Logic</h4>
                  <p className="text-sm text-indigo-300/60">
                    Write a clear description of your flowchart logic including decision points and conditions.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Step 2</Badge>
                  <h4 className="font-medium text-white">Generate Diagram</h4>
                  <p className="text-sm text-indigo-300/60">
                    Click "Generate Flowchart" to convert your description into a visual diagram.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Step 3</Badge>
                  <h4 className="font-medium text-white">Download</h4>
                  <p className="text-sm text-indigo-300/60">
                    Download the generated HTML file to use your flowchart anywhere.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

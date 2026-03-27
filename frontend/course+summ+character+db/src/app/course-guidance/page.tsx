'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, BookOpen, Target, FileText, HelpCircle, GraduationCap, TrendingUp, Award, Lightbulb, Bot, Wifi, WifiOff, Download, Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/ui/AuroraBackground'

interface CourseData {
  course: string
  skills_analysis: string
  content: string
  quiz: string
}

export default function CourseGuidancePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [mockMode, setMockMode] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Form state
  const [courseName, setCourseName] = useState('')

  const API_BASE = 'https://sachingoyal94-course-gen-space.hf.space'

  // Check backend status on component mount
  React.useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const testResponse = await fetch(`${API_BASE}/generate/course`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ course: 'test' }),
          signal: AbortSignal.timeout(3000)
        })
        setBackendStatus('online')
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setBackendStatus('online')
        } else {
          setBackendStatus('online')
        }
      }
    }

    checkBackendStatus()
  }, [])

  // Simulate progress bar during loading
  React.useEffect(() => {
    if (!isLoading) return
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return prev + Math.random() * 15
        }
        return prev
      })
    }, 500)
    
    return () => clearInterval(interval)
  }, [isLoading])

  const generateCourse = async () => {
    if (!courseName.trim()) {
      setError('Please enter a course name')
      return
    }

    setIsLoading(true)
    setProgress(0)
    setError(null)

    try {
      let data: any

      if (mockMode) {
        // Mock response for demo
        await new Promise(resolve => setTimeout(resolve, 2000))
        setProgress(100)
        data = {
          course: `Course: ${courseName.trim()}\n\nA comprehensive course covering fundamental concepts and advanced techniques. This course is designed for beginners and progresses to advanced topics.\n\nDuration: 1 month\nLevel: Beginner to Advanced\n\nTopics:\n- Introduction to ${courseName.trim()}\n- Core Concepts and Principles\n- Advanced Techniques and Best Practices\n- Practical Applications and Projects`,
          
          skills_analysis: `Skills Analysis for ${courseName.trim()}:\n\nCurrent Skills:\n- Basic understanding of the subject\n- Fundamental knowledge\n- Enthusiasm to learn\n\nRequired Skills:\n- Technical proficiency\n- Problem-solving abilities\n- Best practices understanding\n- Real-world application skills\n\nSkill Gaps:\n- Advanced techniques knowledge\n- Practical experience\n- Industry best practices\n\nRecommendations:\n- Practice regularly with exercises\n- Build personal projects\n- Study official documentation\n- Join community forums and discussions`,
          
          content: `Course Content for ${courseName.trim()}:\n\nModule 1: Introduction\n- Overview and Setup\n- Basic Concepts and Terminology\n- Environment Configuration\n- First Steps and Simple Examples\n\nModule 2: Core Concepts\n- Fundamental Principles\n- Key Features and Capabilities\n- Common Patterns and Approaches\n- Best Practices from Day One\n\nModule 3: Advanced Topics\n- Complex Techniques and Methods\n- Performance Optimization\n- Security Considerations\n- Scalability and Architecture\n\nModule 4: Practical Applications\n- Real-world Project Development\n- Case Studies and Examples\n- Troubleshooting and Debugging\n- Deployment and Maintenance\n\nResources:\n- Comprehensive documentation\n- Video tutorials and walkthroughs\n- Practice exercises and solutions\n- Community support and forums`,
          
          quiz: `Quiz for ${courseName.trim()}:\n\nQuestion 1: What is the primary purpose of ${courseName.trim()}?\nA) To provide entertainment\nB) To solve specific problems or achieve goals\nC) To complicate simple tasks\nD) To replace human workers entirely\n\nCorrect Answer: B\nExplanation: ${courseName.trim()} is primarily designed to solve specific problems and achieve particular goals efficiently and effectively.\n\nQuestion 2: Which skill is most important for mastering ${courseName.trim()}?\nA) Natural talent only\nB) Consistent practice and learning\nC) Expensive tools only\nD) Working in isolation\n\nCorrect Answer: B\nExplanation: Consistent practice and continuous learning are the keys to mastering any technical skill or subject.\n\nQuestion 3: What is the best approach to learning ${courseName.trim()}?\nA) Reading only theory\nB) Theory combined with practical application\nC) Watching videos only\nD) Memorizing everything at once\n\nCorrect Answer: B\nExplanation: The most effective learning approach combines theoretical knowledge with hands-on practical application.`
        }
      } else {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes timeout

        try {
          const response = await fetch(`${API_BASE}/generate/course`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course: courseName.trim()
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          setProgress(90)

          if (response.status === 422) {
            const errorData = await response.json()
            throw new Error(`API validation failed: ${JSON.stringify(errorData.detail)}`)
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          data = await response.json()
          setProgress(100)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw fetchError
        }
      }
      
      const parsedData: CourseData = {
        course: data.course || '',
        skills_analysis: data.skills_analysis || '',
        content: data.content || '',
        quiz: data.quiz || ''
      }
      
      setCourseData(parsedData)
      setProgress(100)
    } catch (err) {
      let errorMessage = 'Failed to generate course'
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out after 10 minutes. The AI course generation is taking longer than expected. Please try again or use Mock Mode for instant results.'
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Backend server is not responding. The service may be temporarily unavailable.'
        } else if (err.message.includes('API validation failed')) {
          errorMessage = 'API expects different data format. Use Mock Mode to test the interface.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(`${errorMessage}. Please try again or use Mock Mode.`)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  const downloadCourseAsText = () => {
    if (!courseData) return

    const content = `
=== ${courseData.course.split('\n')[0]} ===

COURSE OVERVIEW
${courseData.course}

---

SKILLS ANALYSIS
${courseData.skills_analysis}

---

COURSE CONTENT
${courseData.content}

---

QUIZ
${courseData.quiz}
    `.trim()

    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${courseName.replace(/\s+/g, '_')}_course.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const copyToClipboard = async () => {
    if (!courseData) return

    const content = `
COURSE: ${courseData.course}

SKILLS: ${courseData.skills_analysis}

CONTENT: ${courseData.content}

QUIZ: ${courseData.quiz}
    `.trim()

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
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
        @keyframes progress-fill {
          0% { width: 0%; }
        }
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .progress-bar {
          animation: progress-fill 0.3s ease-out;
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)] float-animation">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent mb-2">
            Course Guidance Tool
          </h1>
          <p className="text-lg text-indigo-300/70">
            Generate personalized courses with skills analysis, content, and quizzes
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="mt-4 border-white/20 text-white/70 bg-white/5 hover:bg-white/10"
          >
            ← Back to Home
          </Button>
        </div>

        {/* Input Form */}
        <Card className="mb-8 shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Course Generator
            </CardTitle>
            <CardDescription className="text-indigo-300/60">
              Enter a course name to generate a complete learning path. 
              {mockMode ? (
                <span className="text-green-400 font-medium"> Mock Mode: Instant demo data for testing.</span>
              ) : (
                <span> Course generation takes 3-15 minutes as AI creates comprehensive content.</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-indigo-200">Course Name *</Label>
              <Input
                id="courseName"
                placeholder="e.g., Web Development, Data Science, Machine Learning"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-blue-500 text-lg h-12"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    generateCourse()
                  }
                }}
                disabled={isLoading}
              />
            </div>
            
            {/* Mock Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-300" />
                <span className="text-sm text-indigo-200/80">
                  {mockMode ? 'Mock Mode Active' : 'Live API Mode'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMockMode(!mockMode)}
                disabled={isLoading}
                className={`text-xs ${mockMode ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/5 border-white/20 text-indigo-200/70'}`}
              >
                {mockMode ? '✓ Mock' : 'Live API'}
              </Button>
            </div>

            {/* Backend Status */}
            {!mockMode && (
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  {backendStatus === 'checking' ? (
                    <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />
                  ) : backendStatus === 'online' ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-indigo-200/80">
                    Backend Status: 
                    <span className={`ml-1 font-medium ${
                      backendStatus === 'checking' ? 'text-indigo-300' :
                      backendStatus === 'online' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {backendStatus === 'checking' ? ' Checking...' :
                       backendStatus === 'online' ? ' Online' : ' Offline'}
                    </span>
                  </span>
                </div>
                {backendStatus === 'offline' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMockMode(true)}
                    className="text-xs bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                  >
                    Use Mock Mode
                  </Button>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-indigo-200">Generating course...</span>
                  <span className="text-xs text-indigo-300/60">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full progress-bar transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={generateCourse} 
              disabled={isLoading || !courseName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {mockMode ? 'Generating Demo...' : 'Generating Course... (3-15 min)'}
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-5 w-5" />
                  {mockMode ? 'Generate Demo Course' : 'Generate Course'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/30 bg-red-500/10 slide-up">
            <AlertDescription className="text-red-300">
              {error}
              {!mockMode && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMockMode(true)}
                    className="text-xs bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                  >
                    🚀 Enable Mock Mode for Instant Testing
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {courseData && (
          <div className="space-y-6 slide-up">
            {/* Mock Mode Badge */}
            {mockMode && (
              <div className="flex items-center justify-center">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                  🎭 Mock Mode - Demo Data
                </Badge>
              </div>
            )}

            {/* Export Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={downloadCourseAsText}
                variant="outline"
                className="flex items-center gap-2 border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"
              >
                <Download className="w-4 h-4" />
                Download as Text
              </Button>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center gap-2 border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All
                  </>
                )}
              </Button>
            </div>
            
            <Tabs defaultValue="course" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 p-1 rounded-xl">
                <TabsTrigger value="course" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                  <BookOpen className="w-4 h-4" />
                  Course
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                  <Target className="w-4 h-4" />
                  Skills
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                  <FileText className="w-4 h-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="quiz" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-indigo-300/70">
                  <HelpCircle className="w-4 h-4" />
                  Quiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="course" className="space-y-4">
                <Card className="shadow-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-300">
                      <BookOpen className="w-5 h-5" />
                      Course Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="whitespace-pre-wrap text-indigo-100/80">
                        {courseData.course}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card className="shadow-2xl border border-green-500/20 bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-300">
                      <Target className="w-5 h-5" />
                      Skills Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="whitespace-pre-wrap text-indigo-100/80">
                        {courseData.skills_analysis}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card className="shadow-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-300">
                      <FileText className="w-5 h-5" />
                      Course Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="whitespace-pre-wrap text-indigo-100/80">
                        {courseData.content}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quiz" className="space-y-4">
                <Card className="shadow-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-300">
                      <HelpCircle className="w-5 h-5" />
                      Course Quiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="whitespace-pre-wrap text-indigo-100/80">
                        {courseData.quiz}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
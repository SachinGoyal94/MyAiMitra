import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URLS } from '@/config/backend_urls'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { query, mysql_host, mysql_user, mysql_password, mysql_db, mysql_port } = body
    
    // Validate required fields
    if (!query || !mysql_host || !mysql_user || !mysql_password || !mysql_db || !mysql_port) {
      return NextResponse.json(
        { error: 'Missing required fields: query, mysql_host, mysql_user, mysql_password, mysql_db, mysql_port' },
        { status: 400 }
      )
    }

    // Call the external database chat API
    // Call the external database chat API
    
    // Create a timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
    
    try {
      const response = await fetch(`${BACKEND_URLS.DB_CHAT}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; DatabaseChat/1.0)',
        },
        body: JSON.stringify({
          query,
          mysql_host,
          mysql_user,
          mysql_password,
          mysql_db,
          mysql_port
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Database chat API error:', response.status, errorText)
        
        // Return more specific error information
        return NextResponse.json(
          { 
            error: `Database API error: ${response.status} ${response.statusText}`,
            details: errorText,
            suggestion: 'Please check your database connection details and try again.'
          },
          { status: response.status }
        )
      }

      const data = await response.json()
      
      // Return the response from the database chat API
      return NextResponse.json(data)

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json(
            { 
              error: 'Request timeout',
              details: 'The database request took too long to respond.',
              suggestion: 'Please try again or check if the database server is accessible.'
            },
            { status: 408 }
          )
        }
        
        return NextResponse.json(
          { 
            error: 'Network error',
            details: fetchError.message,
            suggestion: 'Please check your internet connection and try again.'
          },
          { status: 503 }
        )
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('Database chat route error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: 'Please try again later or contact support if the problem persists.'
      },
      { status: 500 }
    )
  }
}
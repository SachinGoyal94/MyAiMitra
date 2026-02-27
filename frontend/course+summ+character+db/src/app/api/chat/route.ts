import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://persona-flow-zqxz.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Forward the request to the external backend
    const response = await fetch(`${BACKEND_URL}/chat/`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend error:', errorData)
      return NextResponse.json(
        { error: errorData.detail || errorData.error || `Backend error (${response.status})` },
        { status: response.status }
      )
    }
  } catch (error: any) {
    console.error('Error sending chat message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message. Backend may be unavailable.' },
      { status: 503 }
    )
  }
}
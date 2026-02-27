import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://persona-flow-zqxz.onrender.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string, personaId: string }> }
) {
  try {
    const { userId, personaId } = await params

    // Forward the request to the external backend
    const response = await fetch(`${BACKEND_URL}/history/${userId}/${personaId}`)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend error:', errorData)
      return NextResponse.json(
        { error: errorData.detail || errorData.error || `Failed to get history (${response.status})` },
        { status: response.status }
      )
    }
  } catch (error: any) {
    console.error('Error getting chat history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get chat history. Backend may be unavailable.' },
      { status: 503 }
    )
  }
}
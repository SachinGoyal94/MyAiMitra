import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://persona-flow-zqxz.onrender.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Call the real backend to get user ID
    try {
      const response = await fetch(`${BACKEND_URL}/get_user_id/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`Got user_id for ${username}:`, data)
        return NextResponse.json(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Backend error getting user ID:', errorData)
        return NextResponse.json(
          { error: errorData.detail || `User not found (${response.status})` },
          { status: response.status }
        )
      }
    } catch (backendError: any) {
      console.error('Backend unavailable:', backendError.message)
      return NextResponse.json(
        { error: 'Backend unavailable. Please try again later.' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error getting user ID:', error)
    return NextResponse.json(
      { error: 'Failed to get user ID' },
      { status: 500 }
    )
  }
}
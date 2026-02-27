import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://persona-flow-zqxz.onrender.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Forward request to real backend
    try {
      const response = await fetch(`${BACKEND_URL}/user/${userId}/characters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        throw new Error(`Backend returned ${response.status}`)
      }
    } catch (backendError: any) {
      console.log('Backend unavailable:', backendError.message)
      return NextResponse.json(
        { error: 'Backend unavailable. Please try again later.' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error getting user personas:', error)
    return NextResponse.json(
      { error: 'Failed to get personas' },
      { status: 500 }
    )
  }
}
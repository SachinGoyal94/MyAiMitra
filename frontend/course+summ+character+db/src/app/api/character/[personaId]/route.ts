import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URLS } from '@/config/backend_urls'



export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    const { personaId } = await params
    const formData = await request.formData()

    // Forward request to real backend
    const response = await fetch(`${BACKEND_URLS.PERSONA_FLOW}/character/${personaId}`, {
      method: 'DELETE',
      body: formData
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend error:', errorData)
      return NextResponse.json(
        { error: errorData.detail || errorData.error || `Failed to delete character (${response.status})` },
        { status: response.status }
      )
    }
  } catch (error: any) {
    console.error('Error deleting persona:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete character. Backend may be unavailable.' },
      { status: 503 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    // Proxy the request to your backend API
    // Your NestJS controller expects 'name' parameter, not 'q'
    const backendUrl = `http://localhost:3000/packages/search?name=${encodeURIComponent(query)}`
    
    const response = await fetch(backendUrl)
    
    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('API Proxy Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend API' }, 
      { status: 500 }
    )
  }
} 
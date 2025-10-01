import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Simple token generation
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Get credentials from environment variables
    const validUsername = process.env.AUTH_USERNAME || 'admin'
    const validPassword = process.env.AUTH_PASSWORD || 'password123'

    // Check credentials
    if (username === validUsername && password === validPassword) {
      const token = generateToken()
      
      return NextResponse.json(
        { success: true, token },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
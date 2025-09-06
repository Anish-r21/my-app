import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { ApiResponse, AuthUser } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    return NextResponse.json<ApiResponse<AuthUser>>({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get current user API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
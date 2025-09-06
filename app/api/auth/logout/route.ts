import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

export async function POST() {
  try {
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear auth cookie
    response.cookies.set({
      name: 'lms-auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Logout failed'
    }, { status: 500 })
  }
}
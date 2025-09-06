// app/api/student/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { analyticsQueries } from '@/lib/database'
import type { ApiResponse, StudentDashboardStats } from '@/types/database'

export async function GET() {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'student') {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const stats = await analyticsQueries.getStudentStats(user.id)
    
    return NextResponse.json<ApiResponse<StudentDashboardStats>>({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Get student stats API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch student stats'
    }, { status: 500 })
  }
}
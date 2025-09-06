import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { analyticsQueries } from '@/lib/database'
import type { ApiResponse, DashboardStats } from '@/types/database'

export async function GET() {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await analyticsQueries.getDashboardStats()
    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Get dashboard stats API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch dashboard stats'
    }, { status: 500 })
  }
}

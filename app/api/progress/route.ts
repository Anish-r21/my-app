//app/api/progress/route.ts --
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { progressQueries } from '@/lib/database'
import type { ApiResponse } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId, completed } = await request.json()
    
    if (!moduleId || typeof completed !== 'boolean') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Module ID and completion status are required'
      }, { status: 400 })
    }

    const success = completed 
      ? await progressQueries.markModuleComplete(user.id, moduleId)
      : await progressQueries.markModuleIncomplete(user.id, moduleId)

    if (!success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to update progress'
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Module marked as ${completed ? 'complete' : 'incomplete'}`
    })

  } catch (error) {
    console.error('Update progress API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update progress'
    }, { status: 500 })
  }
}
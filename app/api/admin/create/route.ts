// app/api/admin/create/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required',
      }, { status: 400 })
    }

    // createUser returns { user, error }
    const { user, error } = await auth.createUser({
      email,
      name,
      role: 'admin',
      password
    })

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: error || 'Failed to create user'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Admin user created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('=== API Error ===', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await auth.getCurrentUser()  // ✅ just one value, not destructured
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 })
    }

    const { data: admins, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('role', 'admin')

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      data: {
        admins: admins || [],
        count: admins?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get admins'
    }, { status: 500 })
  }
}

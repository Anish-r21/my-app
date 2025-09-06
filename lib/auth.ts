// lib/auth.ts - Fixed Authentication Utilities
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { supabase } from './supabase'
import type { User, AuthUser } from '../types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'
const TOKEN_NAME = 'lms-auth-token'

// Password utilities
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  },

  generate(): string {
    // Generate a temporary password for new students
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}

// JWT token utilities
export const tokenUtils = {
  sign(payload: AuthUser): string {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '7d',
      issuer: 'lms-platform',
      audience: 'lms-users'
    })
  },

  verify(token: string): AuthUser | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthUser
    } catch (error) {
      return null
    }
  }
}

// Cookie utilities - Fixed for Next.js async cookies
export const cookieUtils = {
  async set(token: string) {
    const cookieStore = await cookies()
    cookieStore.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })
  },

  async get(): Promise<string | null> {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get(TOKEN_NAME)
      return token?.value || null
    } catch (error) {
      return null
    }
  },

  async remove() {
    const cookieStore = await cookies()
    cookieStore.set(TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/'
    })
  }
}

// Authentication functions
export const auth = {
  // Authenticate user with email and password
  async login(email: string, password: string): Promise<{ user: AuthUser | null, error: string | null }> {
    try {
      console.log('Auth.login called with email:', email)
      
      // Get user from database
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      console.log('Database query result:', { users: users?.length, error })

      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      if (!users || users.length === 0) {
        console.log('No user found with email:', email)
        return { user: null, error: 'Invalid email or password' }
      }

      const user = users[0] as User
      console.log('User found:', { id: user.id, email: user.email, role: user.role, hasHash: !!user.password_hash })

      if (!user.password_hash) {
        console.log('User has no password hash')
        return { user: null, error: 'User account not properly configured' }
      }

      // Verify password
      console.log('Verifying password...')
      const isValidPassword = await passwordUtils.verify(password, user.password_hash)
      console.log('Password verification result:', isValidPassword)
      
      if (!isValidPassword) {
        return { user: null, error: 'Invalid email or password' }
      }

      // Create auth user object (without password hash)
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }

      console.log('Login successful for user:', authUser.email)
      return { user: authUser, error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { user: null, error: 'Login failed. Please try again.' }
    }
  },

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = await cookieUtils.get()
      if (!token) return null

      const user = tokenUtils.verify(token)
      if (!user) return null

      // Verify user still exists in database
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', user.id)
        .limit(1)

      if (error || !users || users.length === 0) {
        return null
      }

      return users[0] as AuthUser
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  // Create new user (admin only)
  async createUser(userData: {
    email: string
    name: string
    role: 'admin' | 'student'
    password?: string
  }): Promise<{ user: User | null, tempPassword?: string, error: string | null }> {
    try {
      const { email, name, role, password } = userData
      
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        return { user: null, error: 'User with this email already exists' }
      }

      // Generate password if not provided
      const userPassword = password || passwordUtils.generate()
      const hashedPassword = await passwordUtils.hash(userPassword)

      // Insert user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          name,
          role
        })
        .select()
        .single()

      if (error) throw error

      return {
        user: newUser as User,
        tempPassword: password ? undefined : userPassword,
        error: null
      }
    } catch (error) {
      console.error('Create user error:', error)
      return { user: null, error: 'Failed to create user' }
    }
  },

  // Logout
  async logout() {
    await cookieUtils.remove()
  }
}

// Role checking utilities
export const roleUtils = {
  isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'admin'
  },

  isStudent(user: AuthUser | null): boolean {
    return user?.role === 'student'
  },

  hasAccess(user: AuthUser | null, requiredRole: 'admin' | 'student'): boolean {
    if (!user) return false
    if (requiredRole === 'student') return true // Both admin and student can access student routes
    return user.role === 'admin' // Only admin can access admin routes
  }
}
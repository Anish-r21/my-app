// lib/supabase.ts - Supabase Configuration (Fixed)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're handling auth manually
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Database helper functions
export const db = {
  // Generic query function
  // async query(query: string, params: unknown[] = []) {
  //   try {
  //     const { data, error } = await supabase.rpc('execute_sql', {
  //       query,
  //       params
  //     })
      
  //     if (error) throw error
  //     return { data, error: null }
  //   } catch (error) {
  //     console.error('Database query error:', error)
  //     return { data: null, error }
  //   }
  // },

  // Select with filters
  async select(table: string, columns = '*', filters: Record<string, unknown> = {}) {
    try {
      let query = supabase.from(table).select(columns)
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
      
      const { data, error } = await query
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error(`Error selecting from ${table}:`, error)
      return { data: null, error }
    }
  },

  // Insert
  async insert(table: string, data: Record<string, unknown>) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return { data: result, error: null }
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error)
      return { data: null, error }
    }
  },

  // Update
  async update(table: string, id: string, data: Record<string, unknown>) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data: result, error: null }
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      return { data: null, error }
    }
  },

  // Delete
  async delete(table: string, id: string) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error)
      return { success: false, error }
    }
  }
}









































// // lib/supabase.ts - Supabase Configuration

// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
// }

// // Create Supabase client
// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     persistSession: false, // We're handling auth manually
//     autoRefreshToken: false,
//     detectSessionInUrl: false
//   }
// })

// // Database helper functions
// export const db = {
//   // Generic query function
//   async query(query: string, params: any[] = []) {
//     try {
//       const { data, error } = await supabase.rpc('execute_sql', {
//         query,
//         params
//       })
      
//       if (error) throw error
//       return { data, error: null }
//     } catch (error) {
//       console.error('Database query error:', error)
//       return { data: null, error }
//     }
//   },

//   // Select with filters
//   async select(table: string, columns = '*', filters: Record<string, any> = {}) {
//     try {
//       let query = supabase.from(table).select(columns)
      
//       // Apply filters
//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null) {
//           query = query.eq(key, value)
//         }
//       })
      
//       const { data, error } = await query
//       if (error) throw error
      
//       return { data, error: null }
//     } catch (error) {
//       console.error(`Error selecting from ${table}:`, error)
//       return { data: null, error }
//     }
//   },

//   // Insert
//   async insert(table: string, data: Record<string, any>) {
//     try {
//       const { data: result, error } = await supabase
//         .from(table)
//         .insert(data)
//         .select()
//         .single()
      
//       if (error) throw error
//       return { data: result, error: null }
//     } catch (error) {
//       console.error(`Error inserting into ${table}:`, error)
//       return { data: null, error }
//     }
//   },

//   // Update
//   async update(table: string, id: string, data: Record<string, any>) {
//     try {
//       const { data: result, error } = await supabase
//         .from(table)
//         .update(data)
//         .eq('id', id)
//         .select()
//         .single()
      
//       if (error) throw error
//       return { data: result, error: null }
//     } catch (error) {
//       console.error(`Error updating ${table}:`, error)
//       return { data: null, error }
//     }
//   },

//   // Delete
//   async delete(table: string, id: string) {
//     try {
//       const { error } = await supabase
//         .from(table)
//         .delete()
//         .eq('id', id)
      
//       if (error) throw error
//       return { success: true, error: null }
//     } catch (error) {
//       console.error(`Error deleting from ${table}:`, error)
//       return { success: false, error }
//     }
//   }
// }
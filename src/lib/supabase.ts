import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string
          balance: number
          status: 'active' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone: string
          balance?: number
          status?: 'active' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string
          balance?: number
          status?: 'active' | 'suspended'
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          client_id: string
          type: 'deposit' | 'withdrawal' | 'withdrawal_request'
          amount: number
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          description: string
          created_at: string
          processed_at?: string
          processed_by?: string
        }
        Insert: {
          id?: string
          client_id: string
          type: 'deposit' | 'withdrawal' | 'withdrawal_request'
          amount: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          description: string
          created_at?: string
          processed_at?: string
          processed_by?: string
        }
        Update: {
          id?: string
          client_id?: string
          type?: 'deposit' | 'withdrawal' | 'withdrawal_request'
          amount?: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          description?: string
          processed_at?: string
          processed_by?: string
        }
      }
    }
  }
}
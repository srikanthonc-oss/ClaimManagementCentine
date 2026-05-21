import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Platform } from '@/types'
import { api } from '@/lib/api'

export type UserRole = 'admin' | 'examiner' | 'viewer'

export interface AppUser {
  id: string
  email: string
  name: string
  password: string // In a real app this would be hashed
  role: UserRole
  platforms: Platform[] // Which platforms this user can access
  createdAt: string
  isActive: boolean
}

interface AuthState {
  // State
  users: AppUser[]
  currentUser: AppUser | null

  // Actions
  signIn: (email: string, password: string) => { success: boolean; error?: string }
  signUp: (email: string, name: string, password: string) => { success: boolean; error?: string }
  signOut: () => void

  // Admin actions
  setUsers: (users: AppUser[]) => void
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => { success: boolean; error?: string }
  updateUser: (id: string, updates: Partial<AppUser>) => void
  deleteUser: (id: string) => void
  getAllUsers: () => AppUser[]
}

// Default admin account
const defaultAdmin: AppUser = {
  id: 'admin-001',
  email: 'admin@nttdata.com',
  name: 'Admin',
  password: 'admin123',
  role: 'admin',
  platforms: ['Facet', 'Amisys', 'Xcelys'],
  createdAt: new Date().toISOString(),
  isActive: true,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [defaultAdmin],
      currentUser: null,

      signIn: (email: string, password: string) => {
        // Try backend API first
        api.auth.signIn(email, password)
          .then((data) => {
            localStorage.setItem('auth-token', data.token)
          })
          .catch(() => { /* fallback to local */ })

        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )
        // Fallback: check default admin in case localStorage has stale data
        if (!user) {
          if (email.toLowerCase() === 'admin@nttdata.com' && password === 'admin123') {
            // Reset users to include default admin
            const hasAdmin = get().users.some((u) => u.email.toLowerCase() === 'admin@nttdata.com')
            if (!hasAdmin) {
              set((state) => ({ users: [...state.users, defaultAdmin] }))
            }
            set({ currentUser: defaultAdmin })
            return { success: true }
          }
          return { success: false, error: 'Invalid email or password' }
        }
        if (!user.isActive) {
          return { success: false, error: 'Account is deactivated. Contact your administrator.' }
        }
        set({ currentUser: user })
        return { success: true }
      },

      signUp: (email: string, name: string, password: string) => {
        const existing = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        )
        if (existing) {
          return { success: false, error: 'An account with this email already exists' }
        }

        const newUser: AppUser = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: email.toLowerCase(),
          name,
          password,
          role: 'viewer', // New users default to viewer
          platforms: [], // No platform access until admin grants it
          createdAt: new Date().toISOString(),
          isActive: true,
        }

        set((state) => ({ users: [...state.users, newUser], currentUser: newUser }))
        return { success: true }
      },

      signOut: () => {
        set({ currentUser: null })
      },

      setUsers: (users: AppUser[]) => {
        set({ users })
      },

      addUser: (userData) => {
        const existing = get().users.find(
          (u) => u.email.toLowerCase() === userData.email.toLowerCase()
        )
        if (existing) {
          return { success: false, error: 'A user with this email already exists' }
        }

        const newUser: AppUser = {
          ...userData,
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ users: [...state.users, newUser] }))
        return { success: true }
      },

      updateUser: (id: string, updates: Partial<AppUser>) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          // Update currentUser if it's the same user
          currentUser: state.currentUser?.id === id
            ? { ...state.currentUser, ...updates }
            : state.currentUser,
        }))
      },

      deleteUser: (id: string) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }))
      },

      getAllUsers: () => {
        return get().users
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ users: state.users, currentUser: state.currentUser }),
    }
  )
)

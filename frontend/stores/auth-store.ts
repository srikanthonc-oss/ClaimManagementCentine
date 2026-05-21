import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Platform } from '@/types'

export type UserRole = 'admin' | 'examiner' | 'viewer'

export interface AppUser {
  id: string
  email: string
  name: string
  password?: string
  role: UserRole
  platforms: Platform[]
  createdAt?: string
  isActive: boolean
}

interface AuthState {
  // State
  currentUser: AppUser | null
  users: AppUser[]

  // Actions
  signIn: (user: AppUser) => void
  signOut: () => void
  setUsers: (users: AppUser[]) => void
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => { success: boolean; error?: string }
  updateUser: (id: string, updates: Partial<AppUser>) => void
  deleteUser: (id: string) => void
  getAllUsers: () => AppUser[]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      signIn: (user: AppUser) => {
        set({ currentUser: user })
      },

      signOut: () => {
        localStorage.removeItem('auth-token')
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
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
)

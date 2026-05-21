'use client'

import * as React from 'react'
import { useAuthStore, type AppUser, type UserRole } from '@/stores/auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Platform } from '@/types'
import { api } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const allPlatforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  examiner: 'Examiner',
  viewer: 'Viewer',
}

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full access — manage users, clear data, all operations',
  examiner: 'Can upload, process, approve/deny claims',
  viewer: 'Read-only access to all screens',
}

export default function UserManagementPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const users = useAuthStore((state) => state.users)
  const addUser = useAuthStore((state) => state.addUser)
  const updateUser = useAuthStore((state) => state.updateUser)
  const deleteUser = useAuthStore((state) => state.deleteUser)
  const setUsers = useAuthStore((state) => state.setUsers)

  // Fetch users from API on mount
  React.useEffect(() => {
    api.users.list()
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data)
        }
      })
      .catch(() => {})
  }, [setUsers])

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<AppUser | null>(null)
  const [formEmail, setFormEmail] = React.useState('')
  const [formName, setFormName] = React.useState('')
  const [formPassword, setFormPassword] = React.useState('')
  const [formRole, setFormRole] = React.useState<UserRole>('viewer')
  const [formPlatforms, setFormPlatforms] = React.useState<Platform[]>([])
  const [formError, setFormError] = React.useState('')

  // Only admin can access this page
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-xs text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <Shield className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="mt-3 text-sm font-semibold">Access Denied</h3>
          <p className="mt-1 text-xs text-muted-foreground">Only administrators can manage users</p>
        </div>
      </div>
    )
  }

  const handleOpenAdd = () => {
    setEditingUser(null)
    setFormEmail('')
    setFormName('')
    setFormPassword('')
    setFormRole('viewer')
    setFormPlatforms([])
    setFormError('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user)
    setFormEmail(user.email)
    setFormName(user.name)
    setFormPassword('')
    setFormRole(user.role)
    setFormPlatforms(user.platforms)
    setFormError('')
    setIsDialogOpen(true)
  }

  const handleTogglePlatform = (platform: Platform) => {
    setFormPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formEmail.trim() || !formName.trim()) {
      setFormError('Email and name are required')
      return
    }

    if (!editingUser && !formPassword.trim()) {
      setFormError('Password is required for new users')
      return
    }

    if (editingUser) {
      // Update existing user
      const updates: Partial<AppUser> = {
        name: formName.trim(),
        role: formRole,
        platforms: formPlatforms,
      }
      if (formPassword.trim()) {
        updates.password = formPassword
      }
      updateUser(editingUser.id, updates)
      // Sync with backend
      api.users.update(editingUser.id, updates).catch(() => {})
    } else {
      // Add new user
      const result = addUser({
        email: formEmail.trim().toLowerCase(),
        name: formName.trim(),
        password: formPassword,
        role: formRole,
        platforms: formPlatforms,
        isActive: true,
      })
      if (!result.success) {
        setFormError(result.error || 'Failed to add user')
        return
      }
      // Sync with backend
      api.users.create({
        email: formEmail.trim().toLowerCase(),
        name: formName.trim(),
        password: formPassword,
        role: formRole,
        platforms: formPlatforms,
        isActive: true,
      }).catch(() => {})
    }

    setIsDialogOpen(false)
  }

  const handleToggleActive = (user: AppUser) => {
    updateUser(user.id, { isActive: !user.isActive })
    // Sync with backend
    api.users.update(user.id, { isActive: !user.isActive }).catch(() => {})
  }

  const handleDelete = (user: AppUser) => {
    if (user.id === currentUser.id) return // Can't delete yourself
    deleteUser(user.id)
    // Sync with backend
    api.users.delete(user.id).catch(() => {})
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      case 'examiner': return <Edit className="h-3.5 w-3.5 text-amber-400" />
      case 'viewer': return <Eye className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-xs text-muted-foreground">Manage user accounts, roles, and platform access</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add User
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/20 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{users.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-500/20 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{users.filter((u) => u.isActive).length}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-red-500/20 p-2">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{users.filter((u) => !u.isActive).length}</p>
              <p className="text-[10px] text-muted-foreground">Deactivated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Platform Access</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(user.role)}
                        <span className="font-medium">{roleLabels[user.role]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <span className="text-[10px] text-muted-foreground">All platforms</span>
                      ) : user.platforms.length === 0 ? (
                        <span className="text-[10px] text-amber-400">No access</span>
                      ) : (
                        <div className="flex gap-1">
                          {user.platforms.map((p) => (
                            <span key={p} className="inline-flex rounded border px-1.5 py-0.5 text-[9px] font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                        user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleOpenEdit(user)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleToggleActive(user)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <XCircle className="h-3 w-3 text-amber-400" /> : <CheckCircle2 className="h-3 w-3 text-green-400" />}
                        </Button>
                        {user.id !== currentUser.id && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDelete(user)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingUser ? 'Update user role and platform access' : 'Create a new user account with role and platform permissions'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-9 text-xs"
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="John Doe"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="examiner">Examiner</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-lg border bg-muted/30 p-2.5 mt-2">
                <p className="text-[10px] font-medium mb-1">
                  {formRole === 'admin' && '🔑 Admin'}
                  {formRole === 'examiner' && '📋 Examiner'}
                  {formRole === 'viewer' && '👁 Viewer'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formRole === 'admin' && 'Full access — manage users, data sources, file uploads, process claims, configure AI functions, and clear all data.'}
                  {formRole === 'examiner' && 'Can run pend resolution, approve/deny claims, and view all screens. Cannot manage users, data sources, or upload files.'}
                  {formRole === 'viewer' && 'Read-only access to dashboard, claims processing, COB, AI functions, and data ontology. Cannot perform any actions.'}
                </p>
              </div>
            </div>

            {formRole !== 'admin' && (
              <div className="space-y-2">
                <Label className="text-xs">Platform Access</Label>
                <div className="flex items-center gap-4 rounded-lg border p-3">
                  {allPlatforms.map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={`form-platform-${platform}`}
                        checked={formPlatforms.includes(platform)}
                        onCheckedChange={() => handleTogglePlatform(platform)}
                      />
                      <Label htmlFor={`form-platform-${platform}`} className="text-xs font-normal cursor-pointer">
                        {platform}
                      </Label>
                    </div>
                  ))}
                </div>
                {formPlatforms.length === 0 && (
                  <p className="text-[10px] text-amber-400">⚠ No platforms selected — user won&apos;t see any claims data</p>
                )}
              </div>
            )}

            {formError && (
              <p className="text-xs text-destructive">{formError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 h-9 text-xs">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
              <Button type="button" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

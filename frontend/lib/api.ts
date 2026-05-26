const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * Get the auth token from localStorage (optional)
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth-token')
}

/**
 * Make an API request (auth token sent if available, but not required)
 */
async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || data.error || `Request failed (${res.status})`)
  }

  return await res.json()
}

// Auth
export const api = {
  auth: {
    signIn: (email: string, password: string) =>
      request('/api/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signUp: (email: string, name: string, password: string) =>
      request('/api/auth/sign-up', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  },

  claims: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/claims${query}`)
    },
    get: (id: string) => request(`/api/claims/${id}`),
    uploads: () => request('/api/claims/uploads'),
    upload: (claims: any[], fileName: string, platform: string) =>
      request('/api/claims/upload', { method: 'POST', body: JSON.stringify({ claims, fileName, platform }) }),
    uploadReference: (data: any) =>
      request('/api/claims/upload-reference', { method: 'POST', body: JSON.stringify(data) }),
    process: (id: string, agentResult: any) =>
      request(`/api/claims/${id}/process`, { method: 'POST', body: JSON.stringify({ agentResult }) }),
    runAgents: (id: string) =>
      request(`/api/claims/${id}/run-agents`, { method: 'POST' }),
    getAgentOutput: (id: string) =>
      request(`/api/claims/${id}/agent-output`),
    getAgentStage: (id: string, stageNumber: number) =>
      request(`/api/claims/${id}/agent-output/stage/${stageNumber}`),
    decide: (id: string, action: string, reason: string | null, notes: string) =>
      request(`/api/claims/${id}/decide`, { method: 'POST', body: JSON.stringify({ action, reason, notes }) }),
    clearAll: () => request('/api/claims', { method: 'DELETE' }),
  },

  dataSources: {
    list: () => request('/api/data-sources'),
    create: (data: any) => request('/api/data-sources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/data-sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/data-sources/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: () => request('/api/users'),
    create: (data: any) => request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }),
  },

  dashboard: {
    metrics: () => request('/api/dashboard/metrics'),
  },

  thresholds: {
    get: () => request('/api/thresholds'),
    update: (autoResolve: number, hitlLow: number) =>
      request('/api/thresholds', { method: 'PUT', body: JSON.stringify({ autoResolve, hitlLow }) }),
  },

  agents: {
    list: () => request('/api/agents'),
    toggle: (id: string) => request(`/api/agents/${id}/toggle`, { method: 'PUT' }),
  },
}

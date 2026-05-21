import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

describe('GET /api/claims', () => {
  it('returns paginated claims with default parameters', async () => {
    const request = createRequest('/api/claims')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('claims')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('page', 1)
    expect(data).toHaveProperty('pageSize', 50)
    expect(data).toHaveProperty('totalPages')
    expect(data.claims.length).toBeLessThanOrEqual(50)
    expect(data.total).toBe(500)
  })

  it('supports pagination with custom page and pageSize', async () => {
    const request = createRequest('/api/claims?page=2&pageSize=10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(2)
    expect(data.pageSize).toBe(10)
    expect(data.claims.length).toBe(10)
    expect(data.totalPages).toBe(50) // 500 / 10
  })

  it('filters claims by platform', async () => {
    const request = createRequest('/api/claims?platform=Facet')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.claims.every((c: { platform: string }) => c.platform === 'Facet')).toBe(true)
  })

  it('filters claims by classification', async () => {
    const request = createRequest('/api/claims?classification=DUAL')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.claims.every((c: { classification: string }) => c.classification === 'DUAL')).toBe(true)
  })

  it('filters claims by status', async () => {
    const request = createRequest('/api/claims?status=Pending')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.claims.every((c: { status: string }) => c.status === 'Pending')).toBe(true)
  })

  it('supports combining multiple filters', async () => {
    const request = createRequest('/api/claims?platform=Facet&status=Pending')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(
      data.claims.every(
        (c: { platform: string; status: string }) =>
          c.platform === 'Facet' && c.status === 'Pending'
      )
    ).toBe(true)
  })

  it('returns 400 for invalid platform value', async () => {
    const request = createRequest('/api/claims?platform=InvalidPlatform')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid platform value')
  })

  it('returns 400 for invalid classification value', async () => {
    const request = createRequest('/api/claims?classification=InvalidClass')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid classification value')
  })

  it('returns 400 for invalid status value', async () => {
    const request = createRequest('/api/claims?status=InvalidStatus')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid status value')
  })

  it('clamps pageSize to maximum of 200', async () => {
    const request = createRequest('/api/claims?pageSize=500')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pageSize).toBe(200)
  })

  it('clamps page to minimum of 1', async () => {
    const request = createRequest('/api/claims?page=-1')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(1)
  })

  it('returns empty claims array for page beyond total', async () => {
    const request = createRequest('/api/claims?page=999&pageSize=50')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.claims).toHaveLength(0)
    expect(data.page).toBe(999)
  })
})

'use client'

import * as React from 'react'
import { api } from '@/lib/api'
import { PageLoader } from '@/components/page-loader'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Claim, Classification } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Activity,
  Zap,
  UserCheck,
  Eye,
  X,
  Bot,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

/** Format a dollar amount in compact millions/thousands */
function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

export default function DashboardPage() {
  const [claims, setClaims] = React.useState<Claim[]>([])
  const [dataSources, setDataSources] = React.useState<any[]>([])
  const [viewingClaim, setViewingClaim] = React.useState<Claim | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  // Helper to map backend claim to frontend format
  const mapClaim = (c: any): Claim => ({
    id: c.id,
    claimNumber: c.claim_number,
    classification: c.classification,
    platform: c.platform,
    providerName: c.provider_name,
    billedAmount: c.billed_amount,
    status: c.status === 'InReview' ? 'In Review' : c.status,
    confidence: c.confidence || 0,
    daysAged: c.days_aged,
    state: c.state,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  })

  // Fetch claims from backend on mount
  React.useEffect(() => {
    let cancelled = false

    const doFetch = async () => {
      try {
        const [claimsData, dsData] = await Promise.all([
          api.claims.list({ pageSize: '500' }),
          api.dataSources.list().catch(() => []),
        ])
        if (!cancelled) {
          if (claimsData?.claims) setClaims(claimsData.claims.map(mapClaim))
          if (Array.isArray(dsData)) setDataSources(dsData)
        }
      } catch (err: any) {
        if (!cancelled) setFetchError(err.message || 'Failed to load claims')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    doFetch()
    return () => { cancelled = true }
  }, [])

  // Count examiner decisions (claims manually approved/denied — confidence set to 100 by approve action)
  const examinerDecisions = React.useMemo(() => {
    return claims.filter((c) =>
      (c.status === 'Approved' && c.confidence === 100) ||
      (c.status === 'Denied' && c.confidence > 0 && c.confidence < 95)
    ).length
  }, [claims])

  // Last updated timestamp
  const lastUpdated = React.useMemo(() => {
    if (claims.length === 0) return null
    const dates = claims
      .map((c) => c.updatedAt ? new Date(c.updatedAt).getTime() : 0)
      .filter((d) => d > 0)
    if (dates.length === 0) return null
    return new Date(Math.max(...dates))
  }, [claims])

  // Compute metrics from claims only (no API override)
  const metrics = React.useMemo(() => {
    const total = claims.length
    const approved = claims.filter((c) => c.status === 'Approved').length
    const denied = claims.filter((c) => c.status === 'Denied').length
    const pending = claims.filter((c) => c.status === 'Pending').length
    const inReview = claims.filter((c) => c.status === 'In Review').length
    const pendedClaims = pending + inReview
    const autoResolved = approved
    const autoResolvedPct = total > 0 ? Math.round((autoResolved / total) * 100) : 0
    const needsHITL = denied + inReview
    const totalBilled = claims.reduce((sum, c) => sum + c.billedAmount, 0)
    const avgConfidence = total > 0
      ? Math.round(claims.reduce((sum, c) => sum + c.confidence, 0) / total)
      : 0

    return {
      total,
      pendedClaims,
      autoResolved,
      autoResolvedPct,
      needsHITL,
      denied,
      totalBilled,
      avgConfidence,
    }
  }, [claims])

  // Pend mix by category
  const pendMixByCategory = React.useMemo(() => {
    const counts: Record<string, number> = {}
    claims.forEach((claim) => {
      counts[claim.classification] = (counts[claim.classification] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        count,
        percentage: claims.length > 0 ? Math.round((count / claims.length) * 100) : 0,
      }))
  }, [claims])

  // HITL Queue — claims that need human review
  const hitlQueue = React.useMemo(() => {
    return claims
      .filter((c) => c.status === 'Denied' || c.status === 'In Review')
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 5)
  }, [claims])

  // Get reason text for HITL claims
  const getHITLReason = (claim: Claim): string => {
    if (claim.classification === 'High Dollar') return 'High-dollar mandatory senior-reviewer sign-off'
    if (claim.classification === 'Auth') return 'High-dollar auth — medical director sign-off required'
    if (claim.classification === 'COB') return 'COB coordination — primary carrier verification needed'
    if (claim.classification === 'Duplicate') return 'Potential duplicate — manual adjudication required'
    if (claim.classification === 'DUAL') return 'Dual eligibility — cross-plan verification needed'
    return `${claim.classification} — manual review required`
  }

  // Loading state
  if (isLoading) {
    return <PageLoader message="Fetching claims from database..." />
  }

  if (fetchError) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs text-primary font-medium">PendResolve AI · Operations</p>
          <h1 className="text-2xl font-bold mt-1">Pend Resolution Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time view across core claims platforms, AI agents, and HITL workbenches.</p>
        </div>
        <div className="rounded-lg border border-dashed border-destructive/50 p-12 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="mt-3 text-sm font-semibold">Failed to load data</h3>
          <p className="mt-1 text-xs text-muted-foreground">{fetchError}</p>
          <p className="mt-2 text-xs text-muted-foreground">Check that the backend is running on port 4000 and you are signed in.</p>
        </div>
      </div>
    )
  }

  if (claims.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs text-primary font-medium">PendResolve AI · Operations</p>
          <h1 className="text-2xl font-bold mt-1">Pend Resolution Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time view across core claims platforms, AI agents, and HITL workbenches.</p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims data available</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload an XLS file in File Intake to populate the dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header with last updated */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-primary font-medium">PendResolve AI · Operations</p>
          <h1 className="text-2xl font-bold mt-1">Pend Resolution Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time view across core claims platforms, AI agents, and HITL workbenches.</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Top Row - 4 Primary Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pended Claims</p>
                <p className="mt-1 text-3xl font-bold">{metrics.pendedClaims}</p>
                <p className="text-[10px] text-muted-foreground">0 awaiting execution</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Auto-Resolved</p>
                <p className="mt-1 text-3xl font-bold">{metrics.autoResolvedPct}%</p>
                <p className="text-[10px] text-muted-foreground">{metrics.autoResolved} of {metrics.total} executed</p>
              </div>
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Needs HITL</p>
                <p className="mt-1 text-3xl font-bold">{metrics.needsHITL}</p>
                <p className="text-[10px] text-muted-foreground">{metrics.denied} auto-denied</p>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pend Value at Risk</p>
                <p className="mt-1 text-3xl font-bold">{formatCompactCurrency(metrics.totalBilled)}</p>
                <p className="text-[10px] text-muted-foreground">Total billed across pends</p>
              </div>
              <div className="rounded-lg bg-primary/20 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - 3 Secondary Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-500/20 p-2">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{metrics.avgConfidence}%</p>
              <p className="text-[10px] text-muted-foreground">Avg AI confidence</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-purple-500/20 p-2">
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{metrics.total}</p>
              <p className="text-[10px] text-muted-foreground">Executions completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-500/20 p-2">
              <UserCheck className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{examinerDecisions}</p>
              <p className="text-[10px] text-muted-foreground">Examiner decisions recorded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Pend Mix + HITL Queue */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Pend Mix by Category */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold">Pend Mix by Category</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{metrics.total} total</span>
            </div>
            <div className="space-y-3">
              {pendMixByCategory.map(({ category, count, percentage }) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{category}</span>
                    <span className="text-xs text-muted-foreground">{count} · {percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold">Connected Data Sources</span>
              </div>
              <Link href="/data-sources" className="text-[10px] text-primary hover:underline">
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              {dataSources.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No data sources configured</p>
              ) : (
                dataSources.slice(0, 5).map((ds: any) => (
                  <div key={ds.id} className="rounded-lg border p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{ds.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ds.type}
                        {ds.last_sync ? ` · Last sync: ${new Date(ds.last_sync).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      ds.status === 'active' ? 'bg-green-500/15 text-green-400' :
                      ds.status === 'error' ? 'bg-red-500/15 text-red-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      <span className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        ds.status === 'active' ? 'bg-green-400 animate-pulse' :
                        ds.status === 'error' ? 'bg-red-400' : 'bg-muted-foreground'
                      )} />
                      {ds.status === 'active' ? 'Active' : ds.status === 'error' ? 'Error' : 'Inactive'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Engine Status Bar */}
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <div>
          <p className="text-xs font-medium">AI Engine Active</p>
          <p className="text-[10px] text-muted-foreground">Processing {claims.length.toLocaleString()} claims today</p>
        </div>
      </div>

      {/* Claim Detail Popup (from HITL Queue click) */}
      {viewingClaim && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 overflow-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setViewingClaim(null)} />
          <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-2xl mb-10">
            <button onClick={() => setViewingClaim(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold">{viewingClaim.claimNumber}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {viewingClaim.classification} · {viewingClaim.platform} · {viewingClaim.state}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Provider</p>
                <p className="text-sm font-bold mt-0.5">{viewingClaim.providerName}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Billed Amount</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(viewingClaim.billedAmount)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Confidence</p>
                <p className={cn('text-sm font-bold mt-0.5',
                  viewingClaim.confidence >= 95 ? 'text-green-400' :
                  viewingClaim.confidence >= 80 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {viewingClaim.confidence > 0 ? `${viewingClaim.confidence}%` : '—'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Days Aged</p>
                <p className="text-sm font-bold mt-0.5">{viewingClaim.daysAged}</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-400 font-medium">⚠ Requires Human Review</p>
              <p className="text-[10px] text-muted-foreground mt-1">{getHITLReason(viewingClaim)}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <Link href="/pend-processing" className="flex-1">
                <Button size="sm" className="h-8 text-xs w-full gap-1.5">
                  <Eye className="h-3 w-3" />
                  Open in Claims Processing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

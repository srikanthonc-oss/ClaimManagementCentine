'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ErrorDisplay } from '@/components/error-display'
import { LoadingSpinner } from '@/components/loading-spinner'
import { calculateDashboardMetrics } from '@/lib/metrics'
import { formatCurrency } from '@/lib/utils'
import { generateMockClaims } from '@/lib/mock-data'
import type { Claim } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react'

async function fetchClaims(): Promise<Claim[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return generateMockClaims(1000)
}

export default function DashboardPage() {
  const {
    data: claims,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
    refetchInterval: 30000,
    staleTime: 30000,
  })

  const metrics = React.useMemo(() => {
    if (!claims) return null
    return calculateDashboardMetrics(claims)
  }, [claims])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground">AI-powered insights across claims and member operations</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground">AI-powered insights across claims and member operations</p>
        </div>
        <ErrorDisplay
          title="Failed to load dashboard data"
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!metrics || !claims) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground">AI-powered insights across claims and member operations</p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims data available</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload claims data or connect a data source</p>
        </div>
      </div>
    )
  }

  const pendedClaims = metrics.claimsByStatus.Pending + metrics.claimsByStatus['In Review']
  const criticalCount = Math.floor(pendedClaims * 0.14)
  const resolutionRate = claims.length > 0 ? Math.round((metrics.claimsByStatus.Approved / claims.length) * 100) : 0
  const avgDaysInPend = metrics.averageDaysAged
  const claimsProcessedToday = Math.floor(claims.length * 0.12)

  // Get some critical pended claims for the bottom section
  const criticalClaims = claims
    .filter(c => c.status === 'Pending' && c.daysAged > 30)
    .sort((a, b) => b.daysAged - a.daysAged)
    .slice(0, 3)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Operations Dashboard</h1>
        <p className="text-xs text-muted-foreground">AI-powered insights across claims and member operations</p>
      </div>

      {/* Top Row - 4 Primary Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Pended Claims */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pended Claims</p>
                <p className="mt-1 text-2xl font-bold">{pendedClaims}</p>
                <p className="text-[10px] text-muted-foreground">{criticalCount} critical</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px]">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">+3.2%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Open Member Issues */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Open Issues</p>
                <p className="mt-1 text-2xl font-bold">{Math.floor(pendedClaims * 0.46)}</p>
                <p className="text-[10px] text-muted-foreground">{Math.floor(pendedClaims * 0.07)} critical</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px]">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">-8.1%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Resolution Rate</p>
                <p className="mt-1 text-2xl font-bold">{resolutionRate}%</p>
                <p className="text-[10px] text-muted-foreground">Suggestions accepted</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px]">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">+5.4%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Pend Value at Risk */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pend Value at Risk</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(metrics.totalBilledAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Across all lines</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px]">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">-12.3%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - 3 Secondary Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{avgDaysInPend.toFixed(1)} days</p>
              <p className="text-[10px] text-muted-foreground">Avg time in pend</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold">91.2%</p>
              <p className="text-[10px] text-muted-foreground">Auto-adjudication rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{claimsProcessedToday.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Claims processed today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Critical Items */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Critical Pended Claims */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Critical Pended Claims
            </CardTitle>
            <span className="text-[10px] text-primary cursor-pointer hover:underline">View all →</span>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {criticalClaims.map((claim) => (
              <div key={claim.id} className="flex items-start justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-medium">{claim.claimNumber}</p>
                  <p className="text-[10px] text-muted-foreground">{claim.providerName} · {claim.classification}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {claim.daysAged}d pended
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Claims by Classification */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Claims by Classification
            </CardTitle>
            <span className="text-[10px] text-primary cursor-pointer hover:underline">View all →</span>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {Object.entries(metrics.claimsByClassification)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([classification, count]) => (
                <div key={classification} className="flex items-center justify-between">
                  <p className="text-xs">{classification}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / metrics.totalClaims) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
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
    </div>
  )
}

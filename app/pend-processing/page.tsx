'use client'

import * as React from 'react'
import { useClaimsStore } from '@/stores/claims-store'
import { useUIStore } from '@/stores/ui-store'
import { cn, formatCurrency } from '@/lib/utils'
import type { Classification, Platform, Claim } from '@/types'
import { FileText, CheckCircle2, AlertTriangle, XCircle, Activity, TrendingUp, Eye, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

// Simulated agent reasoning steps
function generateReasoningSteps(claim: Claim) {
  const steps = [
    {
      agent: 'EligibilityAgent',
      action: `${claim.classification} DETECTION`,
      system: '',
      time: '100ms',
      status: 'complete' as const,
      description: `Checking coverage for member (${claim.providerName})`,
      timestamp: new Date().toLocaleString(),
    },
    {
      agent: 'EligibilityAgent',
      action: '270/271 ELIGIBILITY INQUIRY',
      system: 'EDI GATEWAY (270/271)',
      time: '1200ms',
      status: 'complete' as const,
      description: `Coverage verified — ${claim.platform} is primary carrier`,
      detail: `primaryCarrier: ${claim.platform}  policyNumber: POL-${claim.claimNumber.slice(-6)}`,
    },
    {
      agent: 'PricingAgent',
      action: 'FEE SCHEDULE LOOKUP',
      system: 'CLAIMS DB',
      time: '450ms',
      status: 'complete' as const,
      description: `Billed amount ${formatCurrency(claim.billedAmount)} validated against fee schedule`,
      detail: `allowedAmount: ${formatCurrency(claim.billedAmount * 0.65)}  variance: within threshold`,
    },
    {
      agent: 'ComplianceAgent',
      action: 'RULE ENGINE CHECK',
      system: '',
      time: '320ms',
      status: 'complete' as const,
      description: `All compliance rules passed for ${claim.classification} claim type`,
      timestamp: new Date().toLocaleString(),
    },
    {
      agent: 'ResolutionAgent',
      action: 'AUTO-ADJUDICATION',
      system: '',
      time: '80ms',
      status: claim.status === 'Approved' ? 'complete' as const : 'warning' as const,
      description: claim.status === 'Approved'
        ? `Claim auto-approved with ${claim.confidence}% confidence`
        : `Claim flagged for manual review — confidence ${claim.confidence}%`,
    },
  ]
  return steps
}

export default function PendProcessingPage() {
  const claims = useClaimsStore((state) => state.claims)
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)

  const [activeTab, setActiveTab] = React.useState<string>('all')
  const [viewingClaim, setViewingClaim] = React.useState<Claim | null>(null)

  const platforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  // Filter by platform
  const platformFilteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return claims
    return claims.filter((claim) => selectedPlatforms.includes(claim.platform))
  }, [claims, selectedPlatforms])

  // Classifications with counts
  const classificationData = React.useMemo(() => {
    const counts: Record<string, number> = {}
    platformFilteredClaims.forEach((claim) => {
      counts[claim.classification] = (counts[claim.classification] || 0) + 1
    })
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
  }, [platformFilteredClaims])

  // Filter by active tab
  const filteredClaims = React.useMemo(() => {
    if (activeTab === 'all') return platformFilteredClaims
    return platformFilteredClaims.filter((claim) => claim.classification === activeTab)
  }, [platformFilteredClaims, activeTab])

  // Metrics
  const metrics = React.useMemo(() => {
    const total = platformFilteredClaims.length
    const approved = platformFilteredClaims.filter(c => c.status === 'Approved').length
    const denied = platformFilteredClaims.filter(c => c.status === 'Denied').length
    const inReview = platformFilteredClaims.filter(c => c.status === 'In Review').length
    const pending = platformFilteredClaims.filter(c => c.status === 'Pending').length
    const avgConfidence = total > 0
      ? Math.round(platformFilteredClaims.reduce((sum, c) => sum + c.confidence, 0) / total)
      : 0
    return { total, approved, denied, inReview, pending, avgConfidence }
  }, [platformFilteredClaims])

  // Platform counts
  const platformCounts = React.useMemo(() => {
    const counts: Record<string, number> = { Facet: 0, Amisys: 0, Xcelys: 0 }
    claims.forEach((claim) => { counts[claim.platform] = (counts[claim.platform] || 0) + 1 })
    return counts
  }, [claims])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-400'
      case 'Denied': return 'bg-red-500/20 text-red-400'
      case 'In Review': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-blue-500/20 text-blue-400'
    }
  }

  // Empty state
  if (claims.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Pend Processing</h1>
          <p className="text-xs text-muted-foreground">Submit claims for automated pend resolution and review</p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims data loaded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload an XLS file in File Intake to load claims data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pend Processing</h1>
        <p className="text-xs text-muted-foreground">Submit claims for automated pend resolution and review agent reasoning step-by-step</p>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-5 rounded-lg border bg-card px-4 py-2.5">
        <span className="text-xs font-semibold text-muted-foreground">Platform:</span>
        {platforms.map((platform) => {
          const isChecked = selectedPlatforms.includes(platform)
          const count = platformCounts[platform] || 0
          return (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`pend-${platform.toLowerCase()}`}
                checked={isChecked}
                onCheckedChange={() => togglePlatform(platform)}
              />
              <Label htmlFor={`pend-${platform.toLowerCase()}`} className="flex cursor-pointer items-center gap-1 text-xs font-normal">
                <span>{platform}</span>
                <span className="text-muted-foreground">({count})</span>
              </Label>
            </div>
          )
        })}
        {selectedPlatforms.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearPlatformFilters} className="text-xs h-6 ml-auto">Clear</Button>
        )}
      </div>

      {/* Tabs: Execution + Classification tabs */}
      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5',
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Bot className="h-3 w-3" /> Execution ({platformFilteredClaims.length})
        </button>
        {classificationData.map(([classification, count]) => (
          <button
            key={classification}
            onClick={() => setActiveTab(classification)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              activeTab === classification
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {classification} ({count})
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><FileText className="h-3 w-3" /> TOTAL EXECUTIONS</div>
          <p className="text-lg font-bold mt-1">{metrics.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-green-400"><CheckCircle2 className="h-3 w-3" /> COMPLETED</div>
          <p className="text-lg font-bold mt-1 text-green-400">{metrics.approved}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-yellow-400"><AlertTriangle className="h-3 w-3" /> NEEDS REVIEW</div>
          <p className="text-lg font-bold mt-1 text-yellow-400">{metrics.inReview + metrics.pending}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-blue-400"><Activity className="h-3 w-3" /> APPROVED</div>
          <p className="text-lg font-bold mt-1 text-blue-400">{metrics.approved}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-red-400"><XCircle className="h-3 w-3" /> DENIED</div>
          <p className="text-lg font-bold mt-1 text-red-400">{metrics.denied}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-purple-400"><TrendingUp className="h-3 w-3" /> AVG CONFIDENCE</div>
          <p className="text-lg font-bold mt-1 text-purple-400">{metrics.avgConfidence}%</p>
        </CardContent></Card>
      </div>

      {/* Claims Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Claim</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Provider</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Billed</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Days</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Confidence</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Outcome</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.slice(0, 100).map((claim) => (
                <tr key={claim.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-primary">{claim.claimNumber}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium">
                      {claim.classification}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px] truncate">{claim.providerName}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(claim.billedAmount)}</td>
                  <td className="px-3 py-2.5 text-right">{claim.daysAged}</td>
                  <td className="px-3 py-2.5 text-right">
                    {claim.confidence > 0 && (
                      <span className={cn(
                        'font-medium',
                        claim.confidence >= 90 ? 'text-green-400' :
                        claim.confidence >= 70 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {claim.confidence}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', getStatusBadge(claim.status))}>
                      {claim.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                      claim.status === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    )}>
                      {claim.status === 'Approved' ? 'COMPLETED' : 'PROCESSING'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setViewingClaim(claim)}
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClaims.length > 100 && (
          <div className="border-t px-3 py-2 text-center text-[10px] text-muted-foreground">
            Showing 100 of {filteredClaims.length} claims
          </div>
        )}
      </div>

      {/* Execution Detail Popup */}
      {viewingClaim && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 overflow-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setViewingClaim(null)} />
          <div className="relative z-50 w-full max-w-2xl rounded-lg border bg-background p-6 shadow-2xl mb-10">
            {/* Close */}
            <button onClick={() => setViewingClaim(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold">Execution: {viewingClaim.claimNumber}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {viewingClaim.classification} (PND-{viewingClaim.claimNumber.slice(-3)}) — 5 steps executed
            </p>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                <span className={cn('mt-1 inline-flex rounded px-2 py-0.5 text-xs font-bold',
                  viewingClaim.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                  viewingClaim.status === 'Denied' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                )}>
                  {viewingClaim.status === 'Approved' ? 'COMPLETED' : viewingClaim.status.toUpperCase()}
                </span>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Confidence</p>
                <p className={cn('mt-1 text-lg font-bold',
                  viewingClaim.confidence >= 90 ? 'text-green-400' :
                  viewingClaim.confidence >= 70 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {viewingClaim.confidence}%
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Outcome</p>
                <span className={cn('mt-1 inline-flex rounded px-2 py-0.5 text-xs font-bold',
                  viewingClaim.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                  viewingClaim.status === 'Denied' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                )}>
                  {viewingClaim.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Claim Details */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Provider</p>
                <p className="text-sm font-bold mt-0.5">{viewingClaim.providerName}</p>
                <p className="text-[10px] text-muted-foreground">State: {viewingClaim.state}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Billed Amount</p>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(viewingClaim.billedAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Days Aged: {viewingClaim.daysAged}</p>
              </div>
            </div>

            {/* Agent Reasoning Trace */}
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wide">Agent Reasoning Trace</h3>
            </div>

            <div className="space-y-3">
              {generateReasoningSteps(viewingClaim).map((step, i) => (
                <div key={i} className="flex gap-3">
                  {/* Status dot */}
                  <div className="flex flex-col items-center">
                    <div className={cn('h-2.5 w-2.5 rounded-full mt-1',
                      step.status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'
                    )} />
                    {i < 4 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{step.agent}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{step.action}</span>
                      {step.system && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{step.system}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{step.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    {step.detail && (
                      <div className="mt-1.5 rounded bg-muted/50 border px-2 py-1.5">
                        <code className="text-[10px] text-muted-foreground">{step.detail}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

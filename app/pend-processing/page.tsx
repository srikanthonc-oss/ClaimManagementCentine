'use client'

import * as React from 'react'
import { useClaimsStore } from '@/stores/claims-store'
import { useUIStore } from '@/stores/ui-store'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import { cn, formatCurrency } from '@/lib/utils'
import type { Claim, Platform, Classification } from '@/types'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Bot,
  Play,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Simulated agent reasoning steps
function generateReasoningSteps(claim: Claim) {
  return [
    {
      agent: 'EligibilityAgent',
      action: `${claim.classification} DETECTION`,
      system: '',
      time: '100ms',
      status: 'complete' as const,
      description: `Checking coverage for member (${claim.providerName})`,
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
    },
    {
      agent: 'ResolutionAgent',
      action: 'AUTO-ADJUDICATION',
      system: '',
      time: '80ms',
      status: claim.confidence >= 95 ? 'complete' as const : 'warning' as const,
      description: claim.confidence >= 95
        ? `Claim auto-approved with ${claim.confidence}% confidence`
        : `Claim flagged for manual review — confidence ${claim.confidence}%`,
    },
  ]
}

export default function PendProcessingPage() {
  const claims = useClaimsStore((state) => state.claims)
  const updateClaim = useClaimsStore((state) => state.updateClaim)
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)
  const dataSources = useDataSourcesStore((state) => state.dataSources)

  const [activeTab, setActiveTab] = React.useState<'all' | 'auto-resolved' | 'needs-review'>('all')
  const [activeCategory, setActiveCategory] = React.useState<string>('all')
  const [viewingClaim, setViewingClaim] = React.useState<Claim | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [processedIds, setProcessedIds] = React.useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('processed-claim-ids')
      if (stored) {
        try {
          return new Set(JSON.parse(stored) as string[])
        } catch { /* ignore */ }
      }
    }
    return new Set()
  })

  // Persist processedIds to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('processed-claim-ids', JSON.stringify([...processedIds]))
  }, [processedIds])

  const allPlatforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  // Only show platforms that have an active data source configured
  const enabledPlatforms = React.useMemo(() => {
    const activeSourceNames = dataSources
      .filter((ds) => ds.status === 'active')
      .map((ds) => ds.name)
    return allPlatforms.filter((p) => activeSourceNames.includes(p))
  }, [dataSources])

  // Platform counts
  const platformCounts = React.useMemo(() => {
    const counts: Record<string, number> = { Facet: 0, Amisys: 0, Xcelys: 0 }
    claims.forEach((c) => { counts[c.platform] = (counts[c.platform] || 0) + 1 })
    return counts
  }, [claims])

  // Step 1: Filter by platform — show nothing when none selected
  const platformFilteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return []
    return claims.filter((c) => selectedPlatforms.includes(c.platform))
  }, [claims, selectedPlatforms])

  // Category data from platform-filtered claims (updates when platform changes)
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {}
    platformFilteredClaims.forEach((c) => {
      counts[c.classification] = (counts[c.classification] || 0) + 1
    })
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
  }, [platformFilteredClaims])

  // Step 2: Filter by category (chained from platform filter)
  const categoryFilteredClaims = React.useMemo(() => {
    if (activeCategory === 'all') return platformFilteredClaims
    return platformFilteredClaims.filter((c) => c.classification === activeCategory)
  }, [platformFilteredClaims, activeCategory])

  // Step 3: Filter by inventory/status tab (chained from category filter)
  const filteredClaims = React.useMemo(() => {
    switch (activeTab) {
      case 'auto-resolved':
        return categoryFilteredClaims.filter((c) => processedIds.has(c.id) && c.confidence >= 95)
      case 'needs-review':
        return categoryFilteredClaims.filter((c) => processedIds.has(c.id) && c.confidence < 95)
      default:
        return categoryFilteredClaims
    }
  }, [categoryFilteredClaims, activeTab, processedIds])

  // Metrics reflect the category-filtered level (platform + category applied)
  const metrics = React.useMemo(() => {
    const total = categoryFilteredClaims.length
    const executed = categoryFilteredClaims.filter((c) => processedIds.has(c.id)).length
    const autoResolved = categoryFilteredClaims.filter((c) => processedIds.has(c.id) && c.confidence >= 95).length
    const needsHITL = categoryFilteredClaims.filter((c) => processedIds.has(c.id) && c.confidence < 95).length
    return { total, executed, autoResolved, needsHITL }
  }, [categoryFilteredClaims, processedIds])

  // Reset category when platform changes and selected category no longer exists
  React.useEffect(() => {
    if (activeCategory !== 'all') {
      const exists = categoryData.some(([cat]) => cat === activeCategory)
      if (!exists) setActiveCategory('all')
    }
  }, [categoryData, activeCategory])

  // Run Pend Processing — simulates agents running on filtered claims only
  const handleRunProcessing = () => {
    if (filteredClaims.length === 0 || isProcessing) return
    setIsProcessing(true)

    const claimsToProcess = [...filteredClaims]
    let index = 0
    const interval = setInterval(() => {
      if (index >= claimsToProcess.length) {
        clearInterval(interval)
        setIsProcessing(false)
        return
      }

      const claim = claimsToProcess[index]
      // Generate a confidence score based on claim characteristics
      let confidence = Math.floor(Math.random() * 30) + 70 // 70-99 base range

      // High dollar claims get lower confidence (need review)
      if (claim.classification === 'High Dollar') {
        confidence = Math.floor(Math.random() * 20) + 60 // 60-79
      }
      // Simple claims get higher confidence
      if (claim.classification === 'Duplicate' || claim.classification === 'Pricing') {
        confidence = Math.floor(Math.random() * 10) + 90 // 90-99
      }

      // Update claim with derived confidence and outcome
      const outcome = confidence >= 95 ? 'Approved' : 'Pending'
      updateClaim(claim.id, {
        confidence,
        status: outcome as Claim['status'],
      })

      setProcessedIds((prev) => new Set([...prev, claim.id]))
      index++
    }, 50) // 50ms per claim for visible progress
  }

  // Check if a claim has been processed
  const isClaimProcessed = (claimId: string) => processedIds.has(claimId)

  // Empty state
  if (claims.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Pend Execution Workbench</h1>
          <p className="text-xs text-muted-foreground">Upload pend inventory, run the agentic + automation engine, and review outcomes</p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims data loaded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload an XLS file in Claims File Intake to load claims data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pend Execution Workbench</h1>
          <p className="text-xs text-muted-foreground">
            Upload pend inventory from Facets / QNXT / Amisys / Xcelys, run the agentic + automation engine, and review auto-resolved outcomes or claims that need human review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={handleRunProcessing}
            disabled={isProcessing || filteredClaims.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run Pend Resolution
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Inventory</p>
            <p className="mt-1 text-3xl font-bold text-blue-400">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Executed</p>
            <p className="mt-1 text-3xl font-bold text-amber-400">{metrics.executed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Auto-Resolved</p>
            <p className="mt-1 text-3xl font-bold text-green-400">{metrics.autoResolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Needs HITL</p>
            <p className="mt-1 text-3xl font-bold text-red-400">{metrics.needsHITL}</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-5 rounded-lg border bg-card px-4 py-2.5">
        <span className="text-xs font-semibold text-muted-foreground">Platform:</span>
        {allPlatforms.map((platform) => {
          const isChecked = selectedPlatforms.includes(platform)
          const isEnabled = enabledPlatforms.includes(platform)
          const count = platformCounts[platform] || 0
          const isDisabled = !isEnabled || count === 0
          return (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`pend-${platform.toLowerCase()}`}
                checked={isChecked && !isDisabled}
                onCheckedChange={() => { if (!isDisabled) togglePlatform(platform) }}
                disabled={isDisabled}
              />
              <Label
                htmlFor={`pend-${platform.toLowerCase()}`}
                className={cn(
                  'flex cursor-pointer items-center gap-1 text-xs font-normal',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <span>{platform}</span>
                <span className="text-muted-foreground">({count})</span>
              </Label>
            </div>
          )
        })}
        {selectedPlatforms.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearPlatformFilters} className="text-xs h-6 ml-auto">Clear</Button>
        )}
        {enabledPlatforms.length === 0 && (
          <span className="text-[10px] text-amber-400 ml-2">No data sources configured</span>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            activeCategory === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          All Categories ({platformFilteredClaims.length})
        </button>
        {categoryData.map(([classification, count]) => (
          <button
            key={classification}
            onClick={() => setActiveCategory(classification)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
              activeCategory === classification
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {classification} ({count})
          </button>
        ))}
      </div>

      {/* Inventory Filter (Status Tabs) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          All Inventory ({metrics.total})
        </button>
        <button
          onClick={() => setActiveTab('auto-resolved')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeTab === 'auto-resolved'
              ? 'bg-green-600 text-white'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Auto-Resolved ({metrics.autoResolved})
        </button>
        <button
          onClick={() => setActiveTab('needs-review')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeTab === 'needs-review'
              ? 'bg-amber-600 text-white'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Needs Human Review ({metrics.needsHITL})
        </button>
      </div>

      {/* Claims Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-auto max-h-[450px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Claim #</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">System</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">State</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Provider</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Billed</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Outcome</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Confidence</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.slice(0, 100).map((claim) => {
                const processed = isClaimProcessed(claim.id)
                return (
                  <tr key={claim.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{claim.claimNumber}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium">
                        {claim.platform}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{claim.state}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-muted-foreground">{claim.classification}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium truncate max-w-[160px]">{claim.providerName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(claim.billedAmount)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {processed ? (
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                          claim.confidence >= 95
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}>
                          {claim.confidence >= 95 ? 'Auto-Resolved' : 'Pending Review'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {processed ? (
                        <span className={cn(
                          'font-medium',
                          claim.confidence >= 95 ? 'text-green-400' :
                          claim.confidence >= 80 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {claim.confidence}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-[10px]"
                        onClick={() => setViewingClaim(claim)}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredClaims.length > 100 && (
          <div className="border-t px-3 py-2 text-center text-[10px] text-muted-foreground">
            Showing 100 of {filteredClaims.length} claims
          </div>
        )}
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <div className="flex items-center gap-3 rounded-lg border bg-blue-500/10 border-blue-500/30 px-4 py-3">
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          <div>
            <p className="text-xs font-medium text-blue-400">Running Pend Resolution Agents...</p>
            <p className="text-[10px] text-muted-foreground">
              Processed {processedIds.size} of {filteredClaims.length} claims · Auto-resolved: {metrics.autoResolved} · Needs review: {metrics.needsHITL}
            </p>
          </div>
        </div>
      )}

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
              {viewingClaim.classification} · {viewingClaim.platform} · 5 agents executed
            </p>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Outcome</p>
                {isClaimProcessed(viewingClaim.id) ? (
                  <span className={cn('mt-1 inline-flex rounded px-2 py-0.5 text-xs font-bold',
                    viewingClaim.confidence >= 95 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  )}>
                    {viewingClaim.confidence >= 95 ? 'AUTO-RESOLVED' : 'NEEDS REVIEW'}
                  </span>
                ) : (
                  <span className="mt-1 inline-flex rounded px-2 py-0.5 text-xs font-bold bg-muted text-muted-foreground">
                    NOT EXECUTED
                  </span>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Confidence</p>
                {isClaimProcessed(viewingClaim.id) ? (
                  <p className={cn('mt-1 text-lg font-bold',
                    viewingClaim.confidence >= 95 ? 'text-green-400' :
                    viewingClaim.confidence >= 80 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {viewingClaim.confidence}%
                  </p>
                ) : (
                  <p className="mt-1 text-lg font-bold text-muted-foreground">—</p>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Billed Amount</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(viewingClaim.billedAmount)}</p>
              </div>
            </div>

            {/* Claim Details */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Provider</p>
                <p className="text-sm font-bold mt-0.5">{viewingClaim.providerName}</p>
                <p className="text-[10px] text-muted-foreground">State: {viewingClaim.state} · Platform: {viewingClaim.platform}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Classification</p>
                <p className="text-sm font-bold mt-0.5">{viewingClaim.classification}</p>
                <p className="text-[10px] text-muted-foreground">Days Aged: {viewingClaim.daysAged}</p>
              </div>
            </div>

            {/* Agent Reasoning Trace */}
            {isClaimProcessed(viewingClaim.id) ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">Agent Reasoning Trace</h3>
                </div>

                <div className="space-y-3">
                  {generateReasoningSteps(viewingClaim).map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn('h-2.5 w-2.5 rounded-full mt-1',
                          step.status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'
                        )} />
                        {i < 4 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
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
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Bot className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Agent reasoning trace will appear after execution</p>
                <p className="text-[10px] text-muted-foreground mt-1">Click &quot;Run Pend Resolution&quot; to process this claim</p>
              </div>
            )}

            {/* Action for needs-review claims */}
            {isClaimProcessed(viewingClaim.id) && viewingClaim.confidence < 95 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-amber-400 mb-2">⚠ This claim requires human review (confidence below 95%)</p>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => {
                    updateClaim(viewingClaim.id, { status: 'Approved', confidence: 100 })
                    setViewingClaim(null)
                  }}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => {
                    updateClaim(viewingClaim.id, { status: 'Denied' })
                    setViewingClaim(null)
                  }}>
                    Deny
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

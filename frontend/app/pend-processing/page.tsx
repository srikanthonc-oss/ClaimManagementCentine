'use client'

import * as React from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import { useAuthStore } from '@/stores/auth-store'
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ClaimDetailView } from '@/components/claim-detail-view'
import { PageLoader } from '@/components/page-loader'
import { api } from '@/lib/api'

// Agent reasoning steps that vary by classification
function generateReasoningSteps(claim: Claim) {
  const baseSteps = [
    {
      agent: 'IntakeAdapter',
      action: 'SCHEMA NORMALIZATION',
      system: claim.platform,
      time: '80ms',
      status: 'complete' as const,
      description: `Normalized ${claim.platform} fields to canonical schema`,
    },
  ]

  // Classification-specific steps
  const classificationSteps: Record<string, Array<{ agent: string; action: string; system: string; time: string; status: 'complete' | 'warning'; description: string; detail?: string }>> = {
    COB: [
      { agent: 'EligibilityAgent', action: '270/271 ELIGIBILITY INQUIRY', system: 'EDI GATEWAY', time: '1200ms', status: 'complete', description: `Verified other insurance for member via EDI 270/271`, detail: `primaryCarrier: ${claim.platform}  otherInsurance: detected` },
      { agent: 'COBAgent', action: 'COORDINATION RULE CHECK', system: 'RULES ENGINE', time: '340ms', status: 'complete', description: `Applied NAIC birthday rule and MSP guidelines`, detail: `rule: birthday  result: ${claim.platform} is secondary` },
      { agent: 'COBAgent', action: 'PRIMARY EOB RETRIEVAL', system: 'AWS S3 (claim-images)', time: '890ms', status: 'complete', description: `Retrieved primary EOB document from cloud storage` },
      { agent: 'PricingAgent', action: 'SECONDARY CALCULATION', system: 'PRICING ENGINE', time: '450ms', status: 'complete', description: `Computed secondary payment: ${formatCurrency(claim.billedAmount * 0.35)}`, detail: `allowedAmount: ${formatCurrency(claim.billedAmount * 0.65)}  coinsurance: 35%` },
    ],
    Auth: [
      { agent: 'EligibilityAgent', action: 'AUTH STATUS LOOKUP', system: 'AUTH DB', time: '320ms', status: 'complete', description: `Checked prior authorization status for claim`, detail: `authNumber: AUTH-${claim.claimNumber.slice(-6)}  status: verified` },
      { agent: 'AuthAgent', action: 'AUTH-TO-CLAIM MATCHING', system: 'RULES ENGINE', time: '280ms', status: 'complete', description: `Validated authorization matches claim procedure codes` },
      { agent: 'ComplianceAgent', action: 'TIMELY FILING CHECK', system: '', time: '150ms', status: 'complete', description: `Claim filed within ${claim.daysAged} days â€” within timely filing limit` },
    ],
    'High Dollar': [
      { agent: 'PricingAgent', action: 'FEE SCHEDULE LOOKUP', system: 'CLAIMS DB', time: '450ms', status: 'complete', description: `Billed amount ${formatCurrency(claim.billedAmount)} exceeds high-dollar threshold`, detail: `threshold: $50,000  variance: ${((claim.billedAmount / 50000 - 1) * 100).toFixed(0)}% over` },
      { agent: 'FraudAgent', action: 'FRAUD SCORING', system: 'ML PIPELINE', time: '680ms', status: 'complete', description: `Fraud risk assessment completed â€” no sanctions flags` },
      { agent: 'ComplianceAgent', action: 'SENIOR REVIEWER ROUTING', system: '', time: '100ms', status: 'warning', description: `Routed to senior reviewer â€” high-dollar mandatory sign-off required` },
    ],
    Duplicate: [
      { agent: 'DuplicateAgent', action: 'FUZZY MATCH SEARCH', system: 'CLAIMS DB', time: '560ms', status: 'complete', description: `Searched for duplicate claims by provider, amount, and date`, detail: `matchScore: 0.${85 + Math.floor(Math.random() * 10)}  potentialDuplicates: ${Math.floor(Math.random() * 3) + 1}` },
      { agent: 'DuplicateAgent', action: 'CLAIM COMPARISON', system: '', time: '220ms', status: 'complete', description: `Compared claim details with potential matches` },
      { agent: 'ComplianceAgent', action: 'DUPLICATE DETERMINATION', system: 'RULES ENGINE', time: '180ms', status: 'complete', description: `Applied duplicate detection rules â€” ${claim.confidence >= 95 ? 'confirmed duplicate' : 'inconclusive, needs review'}` },
    ],
    Pricing: [
      { agent: 'PricingAgent', action: 'FEE SCHEDULE LOOKUP', system: 'CLAIMS DB', time: '450ms', status: 'complete', description: `Validated billed amount against contracted fee schedule`, detail: `billedAmount: ${formatCurrency(claim.billedAmount)}  allowedAmount: ${formatCurrency(claim.billedAmount * 0.72)}` },
      { agent: 'PricingAgent', action: 'VARIANCE ANALYSIS', system: 'PRICING ENGINE', time: '320ms', status: 'complete', description: `Calculated pricing variance: ${((1 - 0.72) * 100).toFixed(0)}% â€” within acceptable range` },
      { agent: 'ComplianceAgent', action: 'CONTRACT TERMS CHECK', system: '', time: '180ms', status: 'complete', description: `Verified provider contract terms and reimbursement methodology` },
    ],
    DUAL: [
      { agent: 'EligibilityAgent', action: 'DUAL ELIGIBILITY CHECK', system: 'EDI GATEWAY', time: '980ms', status: 'complete', description: `Verified Medicare/Medicaid dual eligibility status`, detail: `medicare: active  medicaid: active  crossoverStatus: eligible` },
      { agent: 'COBAgent', action: 'CROSSOVER DETERMINATION', system: 'RULES ENGINE', time: '340ms', status: 'complete', description: `Applied Medicare/Medicaid crossover rules` },
      { agent: 'PricingAgent', action: 'SECONDARY PAYMENT CALC', system: 'PRICING ENGINE', time: '280ms', status: 'complete', description: `Computed Medicaid secondary payment after Medicare primary`, detail: `medicareAllowed: ${formatCurrency(claim.billedAmount * 0.8)}  medicaidResponsibility: ${formatCurrency(claim.billedAmount * 0.15)}` },
    ],
  }

  const specificSteps = classificationSteps[claim.classification] || [
    { agent: 'ComplianceAgent', action: 'RULE ENGINE CHECK', system: '', time: '320ms', status: 'complete' as const, description: `All compliance rules passed for ${claim.classification} claim type` },
    { agent: 'PricingAgent', action: 'FEE SCHEDULE LOOKUP', system: 'CLAIMS DB', time: '450ms', status: 'complete' as const, description: `Billed amount ${formatCurrency(claim.billedAmount)} validated against fee schedule`, detail: `allowedAmount: ${formatCurrency(claim.billedAmount * 0.65)}` },
  ]

  // Final adjudication step
  const adjudicationStep = {
    agent: 'ResolutionAgent',
    action: 'AUTO-ADJUDICATION',
    system: '',
    time: '80ms',
    status: claim.confidence >= 95 ? 'complete' as const : 'warning' as const,
    description: claim.confidence >= 95
      ? `Claim auto-approved with ${claim.confidence}% confidence`
      : `Claim flagged for manual review â€” confidence ${claim.confidence}%`,
  }

  return [...baseSteps, ...specificSteps, adjudicationStep]
}

export default function PendProcessingPage() {
  const [claims, setClaims] = React.useState<Claim[]>([])
  const [isPageLoading, setIsPageLoading] = React.useState(true)
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)
  const dataSources = useDataSourcesStore((state) => state.dataSources)
  const fetchDataSources = useDataSourcesStore((state) => state.fetchDataSources)
  const currentUser = useAuthStore((state) => state.currentUser)

  // Map backend claim to frontend format
  const mapClaim = (c: any): Claim => ({
    id: c.id,
    claimNumber: c.claim_number,
    classification: c.classification,
    platform: c.platform,
    providerName: c.provider_name,
    billedAmount: c.billed_amount,
    allowedAmount: c.allowed_amount,
    status: c.status === 'InReview' ? 'In Review' : c.status,
    confidence: c.confidence || 0,
    daysAged: c.days_aged,
    state: c.state,
    holdCode: c.hold_code,
    submitType: c.submit_type,
    claimType: c.claim_type,
    providerSpecialty: c.provider_specialty,
    subscriberId: c.subscriber_id,
    parFlag: c.par_flag,
    form: c.form,
    recvDt: c.recv_dt,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  })

  // Fetch claims and data sources from backend on mount
  React.useEffect(() => {
    fetchDataSources()
    api.claims.list({ pageSize: '500' })
      .then((data) => {
        if (data?.claims) {
          setClaims(data.claims.map(mapClaim))
        }
      })
      .catch(() => {})
      .finally(() => setIsPageLoading(false))
  }, [])

  const canExecute = currentUser?.role === 'admin' || currentUser?.role === 'examiner'

  // Read routing threshold from backend API
  const [autoResolveThreshold, setAutoResolveThreshold] = React.useState(92)
  React.useEffect(() => {
    api.thresholds.get()
      .then((data) => { if (data?.autoResolve) setAutoResolveThreshold(data.autoResolve) })
      .catch(() => {})
  }, [])

  const [activeTab, setActiveTab] = React.useState<'all' | 'auto-resolved' | 'needs-review' | 'approved' | 'denied' | 'pend-back'>('all')
  const [activeCategory, setActiveCategory] = React.useState<string>('all')
  const [viewingClaim, setViewingClaim] = React.useState<Claim | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortColumn, setSortColumn] = React.useState<string>('')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [processedIds, setProcessedIds] = React.useState<Set<string>>(new Set())

  // Initialize processedIds from claims that have been through the pipeline
  // (confidence > 0 OR status is Denied/Approved with confidence=100 OR status changed from Pending)
  React.useEffect(() => {
    const alreadyProcessed = claims.filter((c) =>
      c.confidence > 0 ||
      c.status === 'Denied' ||
      c.status === 'Approved' ||
      c.status === 'In Review'
    ).map((c) => c.id)
    if (alreadyProcessed.length > 0) {
      setProcessedIds((prev) => {
        const next = new Set(prev)
        alreadyProcessed.forEach((id) => next.add(id))
        return next
      })
    }
  }, [claims])

  // Check if any claims have been processed
  const hasProcessedClaims = processedIds.size > 0

  const allPlatforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  // Enable platforms that have claims in the database
  const enabledPlatforms = React.useMemo(() => {
    const platformsWithClaims = [...new Set(claims.map((c) => c.platform))] as Platform[]
    if (currentUser?.role === 'admin') return platformsWithClaims
    const userPlatforms = currentUser?.platforms || []
    return platformsWithClaims.filter((p) => userPlatforms.includes(p))
  }, [claims, currentUser])

  // Platform counts â€” only for user's allowed platforms
  const platformCounts = React.useMemo(() => {
    const counts: Record<string, number> = { Facet: 0, Amisys: 0, Xcelys: 0 }
    const allowedPlatforms = currentUser?.role === 'admin'
      ? allPlatforms
      : (currentUser?.platforms || [])
    claims.forEach((c) => {
      if (allowedPlatforms.includes(c.platform)) {
        counts[c.platform] = (counts[c.platform] || 0) + 1
      }
    })
    return counts
  }, [claims, currentUser])

  // Auto-select all platforms with claims on first load
  React.useEffect(() => {
    if (claims.length > 0 && selectedPlatforms.length === 0 && enabledPlatforms.length > 0) {
      enabledPlatforms.forEach((p) => togglePlatform(p))
    }
  }, [enabledPlatforms.length])

  // Step 1: Filter by platform â€” show nothing when none selected, restrict to user's platforms
  const platformFilteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return []
    // Only show claims for platforms the user has access to
    const allowedPlatforms = currentUser?.role === 'admin'
      ? allPlatforms
      : (currentUser?.platforms || [])
    return claims.filter((c) =>
      selectedPlatforms.includes(c.platform) && allowedPlatforms.includes(c.platform)
    )
  }, [claims, selectedPlatforms, currentUser])

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
    let result = categoryFilteredClaims

    // Status filter
    switch (activeTab) {
      case 'auto-resolved':
        result = result.filter((c) => processedIds.has(c.id) && c.status === 'Approved' && c.confidence >= autoResolveThreshold && c.confidence < 100)
        break
      case 'needs-review':
        result = result.filter((c) => processedIds.has(c.id) && c.status === 'In Review')
        break
      case 'approved':
        // Manual-resolved: Approved but confidence was below auto-resolve threshold (examiner approved)
        result = result.filter((c) => c.status === 'Approved' && c.confidence < autoResolveThreshold)
        break
      case 'denied':
        result = result.filter((c) => c.status === 'Denied')
        break
      case 'pend-back':
        result = result.filter((c) => c.status === 'Pending' && processedIds.has(c.id))
        break
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((c) =>
        c.claimNumber.toLowerCase().includes(q) ||
        c.providerName.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
      )
    }

    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal: string | number = ''
        let bVal: string | number = ''
        switch (sortColumn) {
          case 'claimNumber': aVal = a.claimNumber; bVal = b.claimNumber; break
          case 'platform': aVal = a.platform; bVal = b.platform; break
          case 'state': aVal = a.state; bVal = b.state; break
          case 'classification': aVal = a.classification; bVal = b.classification; break
          case 'providerName': aVal = a.providerName; bVal = b.providerName; break
          case 'billedAmount': aVal = a.billedAmount; bVal = b.billedAmount; break
          case 'confidence': aVal = a.confidence; bVal = b.confidence; break
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
        const cmp = String(aVal).localeCompare(String(bVal))
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [categoryFilteredClaims, activeTab, processedIds, searchQuery, sortColumn, sortDirection])

  // Toggle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Sort icon helper
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />
  }

  // Export to CSV
  const handleExport = () => {
    if (filteredClaims.length === 0) return
    const headers = ['Claim #', 'System', 'State', 'Category', 'Provider', 'Billed', 'Outcome', 'Confidence']
    const rows = filteredClaims.map((c) => [
      c.claimNumber,
      c.platform,
      c.state,
      c.classification,
      c.providerName,
      c.billedAmount.toFixed(2),
      processedIds.has(c.id) ? (c.confidence >= autoResolveThreshold ? 'Auto-Resolved' : c.status === 'Pending' ? 'Manual Processing' : c.status === 'Approved' ? 'Manual-Resolved' : c.status === 'Denied' ? 'Denied' : 'Pending Review') : 'Pending',
      processedIds.has(c.id) ? `${c.confidence}%` : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Metrics reflect the category-filtered level (platform + category applied)
  const metrics = React.useMemo(() => {
    const total = categoryFilteredClaims.length
    const executed = categoryFilteredClaims.filter((c) => processedIds.has(c.id)).length
    // Auto-resolved: system approved during processing (confidence was >= threshold originally)
    const autoResolved = categoryFilteredClaims.filter((c) => processedIds.has(c.id) && c.status === 'Approved' && c.confidence >= autoResolveThreshold && c.confidence < 100).length
    // Needs HITL: processed but confidence < 95 and still in review
    const needsHITL = categoryFilteredClaims.filter((c) => processedIds.has(c.id) && c.status === 'In Review').length
    // Manually approved by examiner (approved but confidence below threshold)
    const approved = categoryFilteredClaims.filter((c) => c.status === 'Approved' && c.confidence < autoResolveThreshold).length
    // Denied by examiner
    const denied = categoryFilteredClaims.filter((c) => c.status === 'Denied').length
    // Manual processing required (processed but AI cannot handle - status is Pending)
    const pendBack = categoryFilteredClaims.filter((c) => c.status === 'Pending' && processedIds.has(c.id)).length
    return { total, executed, autoResolved, needsHITL, approved, denied, pendBack }
  }, [categoryFilteredClaims, processedIds])

  // Reset category when platform changes and selected category no longer exists
  React.useEffect(() => {
    if (activeCategory !== 'all') {
      const exists = categoryData.some(([cat]) => cat === activeCategory)
      if (!exists) setActiveCategory('all')
    }
  }, [categoryData, activeCategory])

  // Run Pend Processing â€” simulates agents running on filtered claims only
  const handleRunProcessing = async () => {
    if (filteredClaims.length === 0 || isProcessing) return
    setIsProcessing(true)

    // Only process claims that haven't been processed yet (status=Pending, confidence=0)
    const claimsToProcess = filteredClaims.filter((c) => c.status === 'Pending' && c.confidence === 0)
    if (claimsToProcess.length === 0) {
      setIsProcessing(false)
      return
    }

    for (const claim of claimsToProcess) {
      try {
        const result = await api.claims.runAgents(claim.id)
        const confidence = result.confidence || 0
        const status = result.status === 'InReview' ? 'In Review' : result.status
        setClaims((prev) => prev.map((c) =>
          c.id === claim.id ? { ...c, confidence, status: status as Claim['status'] } : c
        ))
        setProcessedIds((prev) => new Set([...prev, claim.id]))
      } catch (err) {
        console.error('[RunAgents] Error:', err)
      }
    }
    setIsProcessing(false)
  }

  // Check if a claim has been processed
  const isClaimProcessed = (claimId: string) => processedIds.has(claimId)

  // Loading state
  if (isPageLoading) {
    return <PageLoader message="Loading claims inventory..." variant="table" />
  }

  // Empty state
  if (claims.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Claim Execution Workbench</h1>
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
          <h1 className="text-2xl font-bold">Claim Execution Workbench</h1>
          <p className="text-xs text-muted-foreground">
            Upload pend inventory from Facets / QNXT / Amisys / Xcelys, run the agentic + automation engine, and review auto-resolved outcomes or claims that need human review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExecute && (
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
          )}
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
          const isDisabled = count === 0
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
        <button
          onClick={() => setActiveTab('approved')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeTab === 'approved'
              ? 'bg-blue-600 text-white'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Manual-Resolved ({metrics.approved})
        </button>
        <button
          onClick={() => setActiveTab('denied')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeTab === 'denied'
              ? 'bg-red-600 text-white'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Denied ({metrics.denied})
        </button>
        <button
          onClick={() => setActiveTab('pend-back')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeTab === 'pend-back'
              ? 'bg-purple-600 text-white'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Manual Processing Required ({metrics.pendBack})
        </button>
      </div>

      {/* Search + Export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claim #, provider, state..."
            className="h-8 text-xs pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleExport}
          disabled={filteredClaims.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {filteredClaims.length} claims
        </span>
      </div>

      {/* Claims Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-auto max-h-[450px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('claimNumber')}>
                  <span className="inline-flex items-center gap-1">Claim # {getSortIcon('claimNumber')}</span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('platform')}>
                  <span className="inline-flex items-center gap-1">System {getSortIcon('platform')}</span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('state')}>
                  <span className="inline-flex items-center gap-1">State {getSortIcon('state')}</span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('classification')}>
                  <span className="inline-flex items-center gap-1">Category {getSortIcon('classification')}</span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('providerName')}>
                  <span className="inline-flex items-center gap-1">Provider {getSortIcon('providerName')}</span>
                </th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('billedAmount')}>
                  <span className="inline-flex items-center gap-1 justify-end">Billed {getSortIcon('billedAmount')}</span>
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Outcome</th>
                {hasProcessedClaims && (
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('confidence')}>
                  <span className="inline-flex items-center gap-1">Confidence {getSortIcon('confidence')}</span>
                </th>
                )}
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
                          claim.confidence >= autoResolveThreshold && claim.status === 'Approved'
                            ? 'bg-green-500/20 text-green-400'
                            : claim.status === 'Denied'
                            ? 'bg-red-500/20 text-red-400'
                            : claim.status === 'Pending'
                            ? 'bg-purple-500/20 text-purple-400'
                            : claim.status === 'Approved' && claim.confidence < autoResolveThreshold
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}>
                          {claim.confidence >= autoResolveThreshold && claim.status === 'Approved' ? 'Auto-Resolved'
                            : claim.status === 'Approved' && claim.confidence < autoResolveThreshold ? 'Manual-Resolved'
                            : claim.status === 'Denied' ? 'Denied'
                            : claim.status === 'Pending' ? 'Manual Processing'
                            : 'Pending Review'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </td>
                    {hasProcessedClaims && (
                    <td className="px-3 py-2.5 text-center">
                      {processed ? (
                        <span className={cn(
                          'font-medium',
                          claim.confidence >= autoResolveThreshold ? 'text-green-400' :
                          claim.confidence >= 80 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {claim.confidence}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    )}
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
              Processed {processedIds.size} of {filteredClaims.length} claims Â· Auto-resolved: {metrics.autoResolved} Â· Needs review: {metrics.needsHITL}
            </p>
          </div>
        </div>
      )}

      {/* Execution Detail Popup */}
      {viewingClaim && (
        <ClaimDetailView
          claim={viewingClaim}
          processed={isClaimProcessed(viewingClaim.id)}
          canExecute={canExecute}
          onClose={() => setViewingClaim(null)}
          onApprove={(notes) => {
            // Update locally
            setClaims((prev) => prev.map((c) =>
              c.id === viewingClaim.id ? { ...c, status: 'Approved' as Claim['status'], confidence: 100 } : c
            ))
            // Store in backend DB
            api.claims.decide(viewingClaim.id, 'approve', null, notes).catch(() => {})
            setViewingClaim(null)
          }}
          onDeny={(notes) => {
            if (notes.startsWith('[MANUAL-REVIEW:')) {
              setClaims((prev) => prev.map((c) =>
                c.id === viewingClaim.id ? { ...c, status: 'Pending' as Claim['status'] } : c
              ))
              const reason = notes.match(/\[MANUAL-REVIEW: (.*?)\]/)?.[1] || ''
              const cleanNotes = notes.replace(/\[MANUAL-REVIEW:.*?\]\s*/, '')
              api.claims.decide(viewingClaim.id, 'manual-review', reason, cleanNotes).catch(() => {})
            } else {
              setClaims((prev) => prev.map((c) =>
                c.id === viewingClaim.id ? { ...c, status: 'Denied' as Claim['status'] } : c
              ))
              const reason = notes.match(/\[(.*?)\]/)?.[1] || ''
              const cleanNotes = notes.replace(/\[.*?\]\s*/, '')
              api.claims.decide(viewingClaim.id, 'deny', reason, cleanNotes).catch(() => {})
            }
            setViewingClaim(null)
          }}
        />
      )}
    </div>
  )
}

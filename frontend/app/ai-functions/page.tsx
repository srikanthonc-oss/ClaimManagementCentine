'use client'

import * as React from 'react'
import { useClaimsStore } from '@/stores/claims-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import type { Claim } from '@/types'
import {
  Bot,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Shield,
  Search,
  DollarSign,
  Users,
  ToggleLeft,
  ToggleRight,
  FlaskConical,
  Loader2,
} from 'lucide-react'

/** AI Function definition */
interface AIFunction {
  id: string
  name: string
  description: string
  model: string
  threshold: number
  icon: React.ReactNode
  category: 'eligibility' | 'detection' | 'pricing' | 'compliance' | 'coordination'
}

const aiFunctions: AIFunction[] = [
  {
    id: 'cob-eligibility',
    name: 'COB Eligibility Check',
    description: 'Verifies other insurance via EDI 270/271 transactions and applies NAIC/birthday/MSP rules',
    model: 'gpt-4o',
    threshold: 0.92,
    icon: <Shield className="h-4 w-4" />,
    category: 'eligibility',
  },
  {
    id: 'duplicate-detection',
    name: 'Duplicate Detection',
    description: 'Identifies potential duplicate claims using fuzzy matching on claim number, provider, amount, and date',
    model: 'custom-ensemble-v2',
    threshold: 0.88,
    icon: <Search className="h-4 w-4" />,
    category: 'detection',
  },
  {
    id: 'pricing-validation',
    name: 'Pricing Validation',
    description: 'Validates billed amounts against fee schedules and flags outliers beyond allowed variance',
    model: 'pricing-engine-v3',
    threshold: 0.85,
    icon: <DollarSign className="h-4 w-4" />,
    category: 'pricing',
  },
  {
    id: 'fraud-scoring',
    name: 'Fraud Scoring',
    description: 'Ensemble model scoring claims for fraud indicators including sanctions, upcoding, and unbundling',
    model: 'fraud-ensemble-v1',
    threshold: 0.75,
    icon: <Shield className="h-4 w-4" />,
    category: 'compliance',
  },
  {
    id: 'auth-verification',
    name: 'Authorization Verification',
    description: 'Checks prior authorization status and validates auth-to-claim matching for auth-type pends',
    model: 'gpt-4o',
    threshold: 0.90,
    icon: <CheckCircle2 className="h-4 w-4" />,
    category: 'eligibility',
  },
  {
    id: 'coordination-rules',
    name: 'COB Coordination Rules',
    description: 'Determines primary/secondary payer using birthday rule, NAIC guidelines, and plan hierarchy',
    model: 'rules-engine-v2',
    threshold: 0.92,
    icon: <Users className="h-4 w-4" />,
    category: 'coordination',
  },
  {
    id: 'high-dollar-review',
    name: 'High Dollar Triage',
    description: 'Triages high-dollar claims for senior reviewer routing based on amount, provider history, and complexity',
    model: 'triage-model-v1',
    threshold: 0.80,
    icon: <DollarSign className="h-4 w-4" />,
    category: 'pricing',
  },
  {
    id: 'auto-adjudication',
    name: 'Auto-Adjudication Engine',
    description: 'Final decision engine that combines all agent outputs to auto-approve, deny, or route to HITL',
    model: 'adjudication-v4',
    threshold: 0.92,
    icon: <Zap className="h-4 w-4" />,
    category: 'compliance',
  },
]

export default function AIFunctionsPage() {
  const claims = useClaimsStore((state) => state.claims)
  const currentUser = useAuthStore((state) => state.currentUser)
  const isAdmin = currentUser?.role === 'admin'

  // Persist enabled functions to localStorage
  const [enabledFunctions, setEnabledFunctions] = React.useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai-functions-enabled')
      if (stored) {
        try { return new Set(JSON.parse(stored) as string[]) } catch { /* ignore */ }
      }
    }
    return new Set(aiFunctions.map((f) => f.id))
  })

  React.useEffect(() => {
    localStorage.setItem('ai-functions-enabled', JSON.stringify([...enabledFunctions]))
  }, [enabledFunctions])

  // Persist editable thresholds to localStorage
  const [thresholds, setThresholds] = React.useState<{ autoResolve: number; hitlLow: number }>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai-routing-thresholds')
      if (stored) {
        try { return JSON.parse(stored) } catch { /* ignore */ }
      }
    }
    return { autoResolve: 92, hitlLow: 60 }
  })

  React.useEffect(() => {
    localStorage.setItem('ai-routing-thresholds', JSON.stringify(thresholds))
  }, [thresholds])

  // Test function state
  const [testingFn, setTestingFn] = React.useState<string | null>(null)
  const [testResult, setTestResult] = React.useState<{ fnId: string; confidence: number; decision: string; latency: number } | null>(null)

  const toggleFunction = (id: string) => {
    setEnabledFunctions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Simulated execution stats based on claims count
  const getStats = React.useCallback((fn: AIFunction) => {
    const base = claims.length
    const seed = fn.id.length * 7
    const invocations = base > 0 ? Math.floor(base * (0.3 + (seed % 10) / 10)) : 0
    const successRate = 88 + (seed % 12)
    const avgLatency = 120 + (seed % 400)
    return { invocations, successRate: Math.min(successRate, 99.5), avgLatency }
  }, [claims.length])

  // Summary metrics
  const summaryMetrics = React.useMemo(() => {
    const active = enabledFunctions.size
    const total = aiFunctions.length
    const totalInvocations = aiFunctions.reduce((sum, fn) => sum + getStats(fn).invocations, 0)
    const avgSuccess = aiFunctions.length > 0
      ? aiFunctions.reduce((sum, fn) => sum + getStats(fn).successRate, 0) / aiFunctions.length
      : 0
    return { active, total, totalInvocations, avgSuccess: Math.round(avgSuccess * 10) / 10 }
  }, [enabledFunctions, getStats])

  // Test a function on a sample claim
  const handleTestFunction = (fnId: string) => {
    setTestingFn(fnId)
    setTestResult(null)

    setTimeout(() => {
      const confidence = Math.floor(Math.random() * 30) + 70
      const decision = confidence >= thresholds.autoResolve ? 'Auto-Resolve' : confidence >= thresholds.hitlLow ? 'HITL Review' : 'Force HITL'
      const latency = Math.floor(Math.random() * 500) + 100
      setTestResult({ fnId, confidence, decision, latency })
      setTestingFn(null)
    }, 1200)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">AI Functions</h1>
        <p className="text-xs text-muted-foreground">Configure and monitor AI agents powering the pend resolution pipeline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Active Functions</p>
            <p className="mt-1 text-3xl font-bold">{summaryMetrics.active}/{summaryMetrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total Invocations</p>
            <p className="mt-1 text-3xl font-bold">{summaryMetrics.totalInvocations.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg Success Rate</p>
            <p className="mt-1 text-3xl font-bold">{summaryMetrics.avgSuccess}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Claims Processed</p>
            <p className="mt-1 text-3xl font-bold">{claims.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Function Registry Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Function Registry</h2>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Function</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Model</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Threshold</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Invocations (24h)</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Success Rate</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Avg Latency</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Test</th>
                </tr>
              </thead>
              <tbody>
                {aiFunctions.map((fn) => {
                  const stats = getStats(fn)
                  const isEnabled = enabledFunctions.has(fn.id)
                  return (
                    <tr key={fn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded bg-primary/10 p-1.5 text-primary">
                            {fn.icon}
                          </div>
                          <div>
                            <p className="font-medium">{fn.name}</p>
                            <p className="text-[10px] text-muted-foreground max-w-[250px] truncate">{fn.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-mono">
                          {fn.model}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{(fn.threshold * 100).toFixed(0)}%</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {stats.invocations.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'font-medium',
                          stats.successRate >= 95 ? 'text-green-400' :
                          stats.successRate >= 90 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {stats.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {stats.avgLatency}ms
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => isAdmin && toggleFunction(fn.id)}
                          className={cn('inline-flex items-center gap-1', !isAdmin && 'opacity-50 cursor-not-allowed')}
                          aria-label={`Toggle ${fn.name}`}
                          disabled={!isAdmin}
                        >
                          {isEnabled ? (
                            <ToggleRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleTestFunction(fn.id)}
                          disabled={testingFn === fn.id || !isEnabled}
                        >
                          {testingFn === fn.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FlaskConical className="h-3 w-3" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold">Test Result — {aiFunctions.find((f) => f.id === testResult.fnId)?.name}</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Confidence Score</p>
                <p className={cn('text-lg font-bold mt-0.5',
                  testResult.confidence >= thresholds.autoResolve ? 'text-green-400' :
                  testResult.confidence >= thresholds.hitlLow ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {testResult.confidence}%
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Decision</p>
                <span className={cn('mt-0.5 inline-flex rounded px-2 py-0.5 text-xs font-bold',
                  testResult.decision === 'Auto-Resolve' ? 'bg-green-500/20 text-green-400' :
                  testResult.decision === 'HITL Review' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                )}>
                  {testResult.decision}
                </span>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground">Latency</p>
                <p className="text-lg font-bold mt-0.5">{testResult.latency}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editable Threshold Configuration */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold mb-3">Routing Thresholds (Global)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium">Auto-Resolve</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">≥</span>
                <Input
                  type="number"
                  min={60}
                  max={100}
                  value={thresholds.autoResolve}
                  onChange={(e) => setThresholds((prev) => ({ ...prev, autoResolve: Math.min(100, Math.max(prev.hitlLow + 1, parseInt(e.target.value) || 0)) }))}
                  className="h-8 w-16 text-xs text-center"
                  disabled={!isAdmin}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Confidence threshold for auto-approval</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-medium">HITL Review</span>
              </div>
              <p className="text-lg font-bold">{thresholds.hitlLow}–{thresholds.autoResolve - 1}%</p>
              <p className="text-[10px] text-muted-foreground mt-2">Routed to human reviewer</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium">Force HITL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">&lt;</span>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={thresholds.hitlLow}
                  onChange={(e) => setThresholds((prev) => ({ ...prev, hitlLow: Math.min(prev.autoResolve - 1, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className="h-8 w-16 text-xs text-center"
                  disabled={!isAdmin}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Mandatory human decision</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

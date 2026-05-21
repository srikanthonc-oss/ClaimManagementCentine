'use client'

import * as React from 'react'
import { useClaimsStore } from '@/stores/claims-store'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Bot,
  Zap,
  Users,
  ArrowRight,
  Shield,
} from 'lucide-react'

/** Resolution flow step definition */
interface FlowStep {
  step: number
  title: string
  agent: string
  badge: 'Automated' | 'HITL Optional' | 'HITL Required'
}

const resolutionSteps: FlowStep[] = [
  { step: 1, title: 'COB Pend Intake', agent: 'PendResolve · Adapter', badge: 'Automated' },
  { step: 2, title: 'Timely Filing & Pend Validation', agent: 'PendResolve · EligibilityAgent', badge: 'Automated' },
  { step: 3, title: 'Other Insurance Verification (EDI 270/271)', agent: 'PendResolve · EligibilityAgent', badge: 'HITL Optional' },
  { step: 4, title: 'Coordination Rule Determination', agent: 'PendResolve · COB Agent', badge: 'HITL Optional' },
  { step: 5, title: 'Primary EOB Retrieval', agent: 'PendResolve · AWS Cloud Storage (claim-images)', badge: 'HITL Optional' },
  { step: 6, title: 'Secondary Calculation', agent: 'PendResolve · Pricing Engine', badge: 'Automated' },
  { step: 7, title: 'Auto-Result Writeback', agent: 'PendResolve · Writeback', badge: 'HITL Required' },
]

function getBadgeStyle(badge: FlowStep['badge']) {
  switch (badge) {
    case 'Automated':
      return 'bg-green-500/20 text-green-400'
    case 'HITL Optional':
      return 'bg-blue-500/20 text-blue-400'
    case 'HITL Required':
      return 'bg-amber-500/20 text-amber-400'
  }
}

export default function COBPage() {
  const claims = useClaimsStore((state) => state.claims)

  // Filter COB claims from the store
  const cobClaims = React.useMemo(() => {
    return claims.filter((c) => c.classification === 'COB')
  }, [claims])

  // Metrics
  const metrics = React.useMemo(() => {
    const total = cobClaims.length
    const approved = cobClaims.filter((c) => c.status === 'Approved').length
    const denied = cobClaims.filter((c) => c.status === 'Denied').length
    const inReview = cobClaims.filter((c) => c.status === 'In Review').length
    const pending = cobClaims.filter((c) => c.status === 'Pending').length
    const autoResolved24h = approved // simplified for demo
    const awaitingHITL = denied + inReview
    const avgConfidence = total > 0
      ? Math.round(cobClaims.reduce((sum, c) => sum + c.confidence, 0) / total)
      : 0
    return { total, autoResolved24h, awaitingHITL, avgConfidence, pending }
  }, [cobClaims])

  return (
    <div className="space-y-5">
      {/* Top Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Open COB Pends</p>
            <p className="mt-1 text-3xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Auto-Resolved (24h)</p>
            <p className="mt-1 text-3xl font-bold">{metrics.autoResolved24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Awaiting HITL</p>
            <p className="mt-1 text-3xl font-bold">{metrics.awaitingHITL}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg AI Confidence</p>
            <p className="mt-1 text-3xl font-bold">{metrics.avgConfidence}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Flow */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Resolution Flow — Interconnected Steps</h2>
          </div>

          {/* Horizontal scrollable pipeline */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-stretch gap-0 min-w-max">
              {resolutionSteps.map((step, i) => (
                <React.Fragment key={step.step}>
                  {/* Step card */}
                  <div
                    className={cn(
                      'flex flex-col justify-between rounded-lg border p-3 w-[170px] flex-shrink-0',
                      i === 0 && 'border-primary bg-primary/5'
                    )}
                  >
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Step {step.step}</p>
                      <p className="text-xs font-semibold leading-tight">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{step.agent}</p>
                    </div>
                    <div className="mt-2">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium', getBadgeStyle(step.badge))}>
                        {step.badge}
                      </span>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {i < resolutionSteps.length - 1 && (
                    <div className="flex items-center px-1 flex-shrink-0">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section — COB Pend Intake + Pend-Type AI Strategy */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Left — COB Pend Intake Details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-sm font-bold">COB Pend Intake</h3>
                  <p className="text-[10px] text-muted-foreground">PendResolve · Adapter</p>
                </div>
              </div>
              <span className="inline-flex rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-medium text-green-400">
                Automated
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Receive PND-007 / COB pend event from Cenpas / DBPMS with member, claim, billed amount, and CPT context.
            </p>

            {/* Sub-sections */}
            <div className="space-y-3 pt-2">
              {/* AI Reasoning */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">AI Reasoning</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Schema normalization across QNXT / Facets / Xcelys / Amisys.
                </p>
              </div>

              {/* Traditional Automation */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-semibold">Traditional Automation</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Canonical case (COB-CASE-*) created, status QUEUED.
                </p>
              </div>

              {/* Human-in-the-Loop */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-semibold">Human-in-the-Loop</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Reviewer note — rationale, citations, or override reason
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right — Pend-Type AI Strategy */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Pend-Type AI Strategy</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              For COB pends the EligibilityAgent verifies other insurance via EDI 270/271,
              applies NAIC / birthday / MSP rules, retrieves the primary EOB from the AWS
              Cloud Storage claim-images bucket (private, signed URL), and computes the
              secondary payment. Clear cases auto-resolve; ambiguous, OOL records and
              non-standard EOBs are routed to HITL with full citation trail.
            </p>

            {/* Routing Rules */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold mb-2">Routing Rules</h4>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Auto-resolve when AI confidence ≥ 0.92 and no policy flags
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    HITL when confidence 0.60–0.92 or policy flag raised
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Force HITL on sanctions, fraud, or contract-variance &gt; 25%
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state hint */}
      {cobClaims.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            No COB claims loaded yet. Upload an XLS file with COB-classified claims in Claims File Intake.
          </p>
        </div>
      )}
    </div>
  )
}

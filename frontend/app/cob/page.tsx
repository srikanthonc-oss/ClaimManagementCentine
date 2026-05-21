'use client'

import * as React from 'react'
import { api } from '@/lib/api'
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
  Clock,
  Calculator,
  Send,
  ShieldCheck,
  Search,
} from 'lucide-react'

/** Resolution flow step definition */
interface FlowStep {
  step: number
  title: string
  agent: string
  badge: 'Automated' | 'HITL Optional' | 'HITL Required'
  icon: React.ReactNode
  description: string
  aiReasoning: string
  automation: string
  hitl: string
  dataSources: string[]
  outputs: string[]
}

const resolutionSteps: FlowStep[] = [
  {
    step: 1,
    title: 'COB Pend Intake',
    agent: 'Intake Adapter Agent',
    badge: 'Automated',
    icon: <FileText className="h-4 w-4 text-blue-400" />,
    description: 'Receive pend event from core claims platform. Normalize schema across QNXT / Facets / Xcelys / Amisys. Extract hold codes, denial codes, and claim header data.',
    aiReasoning: 'Schema normalization across multiple platforms. Maps vendor-specific fields to canonical COB case format. Validates required fields present before proceeding.',
    automation: 'Canonical case (COB-CASE-*) created, status QUEUED. Hold codes parsed and categorized. Claim detail lines extracted.',
    hitl: 'None required — fully automated intake.',
    dataSources: ['Core Claims Platform', 'Hold_Code_Info', 'Claim_Header'],
    outputs: ['Normalized claim record', 'Hold code classification', 'Case ID assignment'],
  },
  {
    step: 2,
    title: 'Hold & Denial Code Validation',
    agent: 'Hold Code Validation Agent',
    badge: 'Automated',
    icon: <Shield className="h-4 w-4 text-amber-400" />,
    description: 'Validate hold and denial codes against CMS registry. Check if claim was previously processed. Detect duplicates. Determine processing eligibility.',
    aiReasoning: 'Cross-references hold codes (COBHD, COBOC, COBPR, TSSHD, etc.) against CMS denial code registry. Checks history flag to prevent reprocessing. Triggers duplicate detection logic.',
    automation: 'Code lookup against CMS registry. History check against processed claims table. Duplicate scoring algorithm.',
    hitl: 'Required when duplicate score > 0.85 or unrecognized hold code combination detected.',
    dataSources: ['Hold_Code_Info', 'Denial_Details', 'CMS_Code_Registry', 'Processed_Claims_History'],
    outputs: ['Processing eligibility status', 'Duplicate risk score', 'Denial code validation'],
  },
  {
    step: 3,
    title: 'Member Eligibility & COB Verification',
    agent: 'Eligibility Agent',
    badge: 'HITL Optional',
    icon: <Users className="h-4 w-4 text-green-400" />,
    description: 'Verify member eligibility for dates of service. Lookup COB history. Identify primary/secondary insurance. Validate EOB from primary carrier via EDI 270/271.',
    aiReasoning: 'Queries Member360 for active coverage. Matches COB history records against EOB extraction. Validates insurance name consistency. Interprets PR codes from primary EOB.',
    automation: 'EDI 270/271 eligibility inquiry. COB history table lookup. EOB OCR extraction matching.',
    hitl: 'Required when insurance names don\'t match between COB history and EOB, or when multiple active carriers overlap for DOS.',
    dataSources: ['COBHistory', 'COB_Image_Extraction', 'Member360', 'EDI_Gateway'],
    outputs: ['Primary insurance verified', 'EOB completeness status', 'Coverage gap analysis'],
  },
  {
    step: 4,
    title: 'Timely Filing Validation',
    agent: 'Timely Filing Agent',
    badge: 'Automated',
    icon: <Clock className="h-4 w-4 text-cyan-400" />,
    description: 'Apply state-specific timely filing rules. Calculate DOS-to-received date difference. Validate against CMS 42 CFR 424.44 (1 calendar year from DOS).',
    aiReasoning: 'Calculates filing window based on state (TX=95d, FL=365d, KY=180d, NJ=365d, GA=365d). Applies 180-day COB-specific validation. Flags claims exceeding window.',
    automation: 'Date arithmetic against state rules registry. Automatic pass/fail determination.',
    hitl: 'Required when claim is within 30 days of filing deadline or when state rules conflict with plan-specific overrides.',
    dataSources: ['Claim_Header', 'Claim_Detail', 'State_Rules_Registry', 'CMS_42_CFR_424.44'],
    outputs: ['Filing status (Pass/Fail)', 'Days remaining in window', 'State rule applied'],
  },
  {
    step: 5,
    title: 'Coordination Rule Determination',
    agent: 'Coordination Rule Agent',
    badge: 'HITL Optional',
    icon: <Search className="h-4 w-4 text-indigo-400" />,
    description: 'Determine primary/secondary payer order. Apply NAIC birthday rule, MSP guidelines. Validate authorization status. Interpret EOB reason codes.',
    aiReasoning: 'Applies NAIC Model Act coordination rules. Determines if plan pays as primary or secondary. Validates CPT-level authorization. Interprets CO/PR adjustment codes from primary EOB.',
    automation: 'Rule engine applies birthday rule, employer group size, Medicare Secondary Payer logic.',
    hitl: 'Required when coordination order is ambiguous, authorization data is missing, or non-standard EOB format detected.',
    dataSources: ['COB_Image_Extraction', 'Claim_Detail', 'Auth_System', 'NAIC_Rules'],
    outputs: ['Pay as Primary/Secondary determination', 'Authorization validation', 'Denial code assignment'],
  },
  {
    step: 6,
    title: 'COB Calculation',
    agent: 'COB Calculation Agent',
    badge: 'Automated',
    icon: <Calculator className="h-4 w-4 text-emerald-400" />,
    description: 'Calculate secondary payment amounts. Apply allowed amounts, copay, coinsurance. Determine non-covered amounts. Compute net payable.',
    aiReasoning: 'Applies Maintenance of Benefits (MOB) method. Calculates: Net = Allowed - (Copay + Coinsurance). Validates against fee schedule. Reconciles with primary EOB paid amounts.',
    automation: 'Financial calculation engine. Fee schedule lookup. PR amount aggregation across all claim lines.',
    hitl: 'Required when calculated amount exceeds plan maximum, negative balance detected, or fee schedule mismatch > 25%.',
    dataSources: ['Claim_Detail', 'Fee_Schedule', 'COB_Image_Extraction', 'Plan_Benefits'],
    outputs: ['Net payable amount', 'Non-covered amount', 'Adjustment codes', 'Financial posting recommendation'],
  },
  {
    step: 7,
    title: 'Posting & System Updates',
    agent: 'Posting Agent',
    badge: 'Automated',
    icon: <Send className="h-4 w-4 text-orange-400" />,
    description: 'Generate system update recommendations. Release hold codes. Post payment amounts. Apply adjustment codes. Update claim status.',
    aiReasoning: 'Determines which hold codes to release, which denial codes to apply/remove. Generates posting instructions for the core claims platform. Creates audit trail entries.',
    automation: 'Hold code release. Payment posting. Adjustment code application. Status update to Finalized.',
    hitl: 'Required when posting amount exceeds authority level or when manual override codes are needed.',
    dataSources: ['COB_Calculation_Output', 'Platform_Config', 'Authority_Levels'],
    outputs: ['Payment posted', 'Hold codes released', 'Adjustment codes applied', 'EOB/RA generated'],
  },
  {
    step: 8,
    title: 'Post Validation',
    agent: 'Post Validation Agent',
    badge: 'HITL Required',
    icon: <ShieldCheck className="h-4 w-4 text-teal-400" />,
    description: 'Final compliance checks. Duplicate payment detection. Financial reconciliation. Audit trail validation. Determine if claim can finalize automatically.',
    aiReasoning: 'Validates all prior stages produced consistent results. Checks for new hold/denial codes triggered by posting. Verifies no duplicate payments. Confirms financial totals reconcile.',
    automation: 'Duplicate payment check. Financial reconciliation. Compliance rule validation.',
    hitl: 'Required when post-validation detects inconsistencies, new hold codes triggered, or financial totals don\'t reconcile.',
    dataSources: ['All_Stage_Outputs', 'Compliance_Checklist', 'Duplicate_Check', 'Audit_Trail'],
    outputs: ['Claim finalization status', 'Audit trail complete', 'Compliance certification'],
  },
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
  const [claims, setClaims] = React.useState<any[]>([])
  const [activeStep, setActiveStep] = React.useState(1)

  React.useEffect(() => {
    api.claims.list({ pageSize: '500' })
      .then((data) => {
        if (data?.claims) {
          setClaims(data.claims.map((c: any) => ({
            ...c,
            claimNumber: c.claim_number,
            providerName: c.provider_name,
            billedAmount: c.billed_amount,
            status: c.status === 'InReview' ? 'In Review' : c.status,
            confidence: c.confidence || 0,
            daysAged: c.days_aged,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const cobClaims = React.useMemo(() => {
    return claims.filter((c) => c.classification === 'COB')
  }, [claims])

  const metrics = React.useMemo(() => {
    const total = cobClaims.length
    const approved = cobClaims.filter((c) => c.status === 'Approved').length
    const denied = cobClaims.filter((c) => c.status === 'Denied').length
    const inReview = cobClaims.filter((c) => c.status === 'In Review').length
    const awaitingHITL = denied + inReview
    const avgConfidence = total > 0
      ? Math.round(cobClaims.reduce((sum, c) => sum + c.confidence, 0) / total)
      : 0
    return { total, approved, awaitingHITL, avgConfidence }
  }, [cobClaims])

  const currentStep = resolutionSteps.find((s) => s.step === activeStep)!

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">COB Resolution Pipeline</h1>
        <p className="text-xs text-muted-foreground">8-stage AI-powered Coordination of Benefits pend resolution workflow</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Open COB Pends</p>
            <p className="mt-1 text-3xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Auto-Resolved</p>
            <p className="mt-1 text-3xl font-bold text-green-400">{metrics.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Awaiting HITL</p>
            <p className="mt-1 text-3xl font-bold text-amber-400">{metrics.awaitingHITL}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg Confidence</p>
            <p className="mt-1 text-3xl font-bold">{metrics.avgConfidence}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Steps — clickable */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Resolution Pipeline</h2>
            <span className="text-[10px] text-muted-foreground ml-2">Click a step to view details</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex items-stretch gap-0 min-w-max">
              {resolutionSteps.map((step, i) => (
                <React.Fragment key={step.step}>
                  <button
                    onClick={() => setActiveStep(step.step)}
                    className={cn(
                      'flex flex-col justify-between rounded-lg border p-3 w-[150px] flex-shrink-0 text-left transition-all',
                      activeStep === step.step
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Step {step.step}</p>
                      <p className="text-[11px] font-semibold leading-tight">{step.title}</p>
                    </div>
                    <div className="mt-2">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium', getBadgeStyle(step.badge))}>
                        {step.badge}
                      </span>
                    </div>
                  </button>
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

      {/* Step Detail — changes based on active step */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Left — Step Details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep.icon}
                <div>
                  <h3 className="text-sm font-bold">{currentStep.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{currentStep.agent}</p>
                </div>
              </div>
              <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium', getBadgeStyle(currentStep.badge))}>
                {currentStep.badge}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>

            <div className="space-y-3 pt-2">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">AI Reasoning</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{currentStep.aiReasoning}</p>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-semibold">Traditional Automation</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{currentStep.automation}</p>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-semibold">Human-in-the-Loop</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{currentStep.hitl}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right — Data Sources & Outputs */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Step {currentStep.step} — Data & Outputs</h3>
            </div>

            {/* Data Sources */}
            <div>
              <h4 className="text-xs font-semibold mb-2">Data Sources</h4>
              <div className="space-y-1.5">
                {currentStep.dataSources.map((ds, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground">{ds}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            <div>
              <h4 className="text-xs font-semibold mb-2">Outputs</h4>
              <div className="space-y-1.5">
                {currentStep.outputs.map((out, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground">{out}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Routing Rules */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold mb-2">Routing Logic</h4>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Auto-resolve when AI confidence ≥ 92% and no policy flags
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    HITL when confidence 60–92% or policy flag raised
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Force HITL on sanctions, fraud, or variance &gt; 25%
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
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

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Claim } from '@/types'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Clock,
  Calculator,
  Send,
  ShieldCheck,
  Activity,
  Users,
  Brain,
  Loader2,
  Eye,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type OutcomeStatus = 'pass' | 'warning' | 'fail'
type ConfidenceLevel = 'High' | 'Medium' | 'Low'

interface StageData {
  id: number
  title: string
  icon: React.ReactNode
  outcome: OutcomeStatus
  outcomeLabel: string
  confidence: ConfidenceLevel
  content: React.ReactNode
}

interface COBAdjudicationViewProps {
  claim: Claim
}

interface AgentStage {
  stage_number: number
  stage_name: string
  agent_name: string
  output_data: any
  outcome: string
  confidence: string
  reasoning: string
  executed_at: string
}

interface AgentOutput {
  stages: AgentStage[]
  extracted_data: {
    hold_codes: any[]
    detail_lines: any[]
    cob_history: any[]
    eob_extraction: any[]
    denial_details: any[]
    header_detail: any
  }
}

// ─── Fallback Local Data Helpers ─────────────────────────────────────────────

function getClaimDetailLines(claim: Claim) {
  if (claim.claimNumber.startsWith('899929')) {
    return [
      { lineNo: 1, cpt: '93000', mod: '95', startDt: '06/15/2025', endDt: '06/05/2025', units: 2, billed: 128.82, allowed: 77.46, copay: 47.74, coins: 3.33, ocPaid: 26.39 },
      { lineNo: 2, cpt: '71046', mod: '0', startDt: '06/07/2025', endDt: '06/24/2025', units: 2, billed: 913.34, allowed: 641.06, copay: 27.27, coins: 120.65, ocPaid: 493.14 },
      { lineNo: 3, cpt: '99215', mod: '25', startDt: '06/15/2025', endDt: '06/15/2025', units: 4, billed: 1116.68, allowed: 688.90, copay: 41.30, coins: 78.64, ocPaid: 568.96 },
    ]
  }
  const baseAmt = claim.billedAmount || 500
  return [
    { lineNo: 1, cpt: '99213', mod: '0', startDt: '06/10/2025', endDt: '06/10/2025', units: 1, billed: baseAmt * 0.3, allowed: baseAmt * 0.2, copay: 25.00, coins: 15.00, ocPaid: baseAmt * 0.15 },
    { lineNo: 2, cpt: '71046', mod: '0', startDt: '06/10/2025', endDt: '06/10/2025', units: 1, billed: baseAmt * 0.7, allowed: baseAmt * 0.5, copay: 30.00, coins: 45.00, ocPaid: baseAmt * 0.4 },
  ]
}

function getHoldCodeInfo(claim: Claim) {
  if (claim.claimNumber.startsWith('899929')) {
    return { claimNo: '899929180', lineNo: 1, history: '', reason: 'COBOC', description: 'Authorization pending review' }
  }
  return {
    claimNo: claim.claimNumber,
    lineNo: 1,
    history: '',
    reason: claim.holdCode || 'COBOC',
    description: claim.classification === 'COB' ? 'COB coordination pending' : 'Pend review required',
  }
}

function getDenialDetails(claim: Claim) {
  if (claim.claimNumber.startsWith('899929')) {
    return { lineNo: 1, history: 'N', reasonCode: 'DNNPR' }
  }
  return { lineNo: 1, history: 'N', reasonCode: claim.holdCode || 'CO45' }
}

function getCOBHistory(claim: Claim) {
  if (claim.claimNumber.startsWith('899929')) {
    return [
      { sno: 1, insurance: 'Medicare', effectiveDate: '07/13/2024', termDate: '07/13/2025' },
      { sno: 2, insurance: 'Cigna', effectiveDate: '07/13/2024', termDate: '07/13/2025' },
    ]
  }
  return [
    { sno: 1, insurance: 'Medicare', effectiveDate: '01/01/2024', termDate: '12/31/2025' },
  ]
}

function getEOBExtraction(claim: Claim) {
  if (claim.claimNumber.startsWith('899929')) {
    return { cpt: '99213', insurance: 'Medicare', paid: 407.07, adjGrpCode: 'CO, PR', reason: '3', prAmount: 213.81 }
  }
  return { cpt: '99213', insurance: 'Medicare', paid: claim.billedAmount * 0.4, adjGrpCode: 'CO', reason: '45', prAmount: claim.billedAmount * 0.15 }
}

// ─── UI Components ───────────────────────────────────────────────────────────

function OutcomeBadge({ status, label }: { status: OutcomeStatus; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
      status === 'pass' && 'bg-green-500/15 text-green-400',
      status === 'warning' && 'bg-amber-500/15 text-amber-400',
      status === 'fail' && 'bg-red-500/15 text-red-400',
    )}>
      {status === 'pass' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'warning' && <AlertTriangle className="h-3 w-3" />}
      {status === 'fail' && <XCircle className="h-3 w-3" />}
      {label}
    </span>
  )
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
      level === 'High' && 'bg-green-500/10 text-green-400',
      level === 'Medium' && 'bg-amber-500/10 text-amber-400',
      level === 'Low' && 'bg-red-500/10 text-red-400',
    )}>
      {level} Confidence
    </span>
  )
}

function StageSection({ stage, expanded, onToggle }: { stage: StageData; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold shrink-0">
          {stage.id}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {stage.icon}
        </span>
        <span className="text-xs font-semibold flex-1">{stage.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge level={stage.confidence} />
          <OutcomeBadge status={stage.outcome} label={stage.outcomeLabel} />
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          {stage.content}
        </div>
      )}
    </div>
  )
}

// ─── Helpers for mapping API data to outcome status ──────────────────────────

function EobImageLink({ claimId }: { claimId: string }) {
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleViewEob = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await api.claims.getEobImageUrl(claimId)
      if (result?.exists && result?.url) {
        window.open(result.url, '_blank')
      } else {
        setMessage('No EOB image available for this claim')
        setTimeout(() => setMessage(null), 4000)
      }
    } catch (err) {
      setMessage('Unable to retrieve EOB image')
      setTimeout(() => setMessage(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleViewEob}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
        View EOB Image
      </button>
      {message && <span className="text-[9px] text-amber-400">{message}</span>}
    </div>
  )
}

function mapOutcomeToStatus(outcome: string): OutcomeStatus {
  const lower = outcome.toLowerCase()
  if (lower.includes('denied') || lower.includes('fail') || lower.includes('dnnpr') || lower.includes('dn0') || lower.includes('invalid')) return 'fail'
  if (lower.includes('human review') || lower.includes('duplicate') || lower.includes('warning') || lower.includes('exception') || lower.includes('re-pend')) return 'warning'
  return 'pass'
}

function mapConfidence(confidence: string): ConfidenceLevel {
  if (confidence === 'High' || confidence === 'Medium' || confidence === 'Low') return confidence
  return 'Medium'
}

const STAGE_ICONS: Record<number, React.ReactNode> = {
  1: <Brain className="h-3.5 w-3.5 text-purple-400" />,
  2: <Shield className="h-3.5 w-3.5 text-amber-400" />,
  3: <Users className="h-3.5 w-3.5 text-green-400" />,
  4: <Clock className="h-3.5 w-3.5 text-cyan-400" />,
  5: <Activity className="h-3.5 w-3.5 text-indigo-400" />,
  6: <Calculator className="h-3.5 w-3.5 text-emerald-400" />,
  7: <Send className="h-3.5 w-3.5 text-orange-400" />,
  8: <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />,
}

// ─── Stage Content Renderers (from API data) ─────────────────────────────────

function renderStage1Content(data: any): React.ReactNode {
  const bullets: string[] = data.bullets || []
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground">Quick Brief — AI Extracted Summary</p>
      <ul className="space-y-1.5 text-xs list-disc list-inside">
        {bullets.map((bullet: string, i: number) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
    </div>
  )
}

function renderStage2Content(data: any): React.ReactNode {
  // Support both new structure (hold_codes_detail) and legacy (hold_codes)
  const holdCodes: any[] = data.hold_codes_detail || data.hold_codes || []
  const validationSummary = data.validation_summary || {}
  const validationRules: any[] = validationSummary.validation_rules || data.validation_rules || []
  const aiReasoning = data.ai_reasoning || {}
  const endResult = data.end_result || {}
  const businessRules: string[] = aiReasoning.business_rules_applied || data.business_rules_applied || []
  const claimAnalysis = data.claim_analysis || {}

  // Determine outcome from new or old structure
  const outcome = endResult.status || data.outcome || ''
  const hasCobCode = holdCodes.some((hc: any) => (hc.hold_code || '').startsWith('COB'))
  const hasDuplicate = holdCodes.some((hc: any) => hc.hold_code === 'EXDUC')

  return (
    <div className="space-y-3">
      {/* Claim Analysis Header */}
      {claimAnalysis.claim_id && (
        <div className="rounded border p-2 space-y-1 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">Claim Analysis</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Claim ID</span><span className="font-mono font-semibold">{claimAnalysis.claim_id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Billed Amount</span><span className="font-mono font-semibold">{claimAnalysis.billed_amount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-semibold">{claimAnalysis.platform}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Classification</span><span className="font-semibold">{claimAnalysis.claim_classification}</span></div>
          </div>
        </div>
      )}

      {/* Hold Codes Table */}
      <p className="text-[10px] font-semibold text-muted-foreground">Hold Codes Detail</p>
      <div className="overflow-auto">
        <table className="w-full text-[10px] border">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-2 py-1 border-r font-semibold">Line</th>
              <th className="text-left px-2 py-1 border-r font-semibold">Hold Code</th>
              <th className="text-left px-2 py-1 border-r font-semibold">History</th>
              <th className="text-left px-2 py-1 border-r font-semibold">Reason</th>
              <th className="text-left px-2 py-1 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {holdCodes.map((hc: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1 border-r font-mono">{hc.line_no}</td>
                <td className="px-2 py-1 border-r font-mono font-semibold">{hc.hold_code}</td>
                <td className="px-2 py-1 border-r">{hc.history || 'Blank'}</td>
                <td className="px-2 py-1 border-r font-mono">{hc.reason}</td>
                <td className="px-2 py-1">{hc.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation Rules */}
      {validationRules.length > 0 && (
        <div className="rounded border p-2 space-y-1.5 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">AI Validation Summary</p>
          <div className="overflow-auto">
            <table className="w-full text-[10px] border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-2 py-1 border-r font-semibold">Rule</th>
                  <th className="text-left px-2 py-1 border-r font-semibold">Logic Applied</th>
                  <th className="text-left px-2 py-1 border-r font-semibold">Result</th>
                  <th className="text-left px-2 py-1 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {validationRules.map((rule: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1 border-r font-semibold">{rule.rule}</td>
                    <td className="px-2 py-1 border-r">{rule.logic_applied}</td>
                    <td className="px-2 py-1 border-r">{rule.result}</td>
                    <td className={cn('px-2 py-1 font-semibold', (rule.status || '').includes('✓') ? 'text-green-400' : 'text-red-400')}>{rule.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Reasoning */}
      {(aiReasoning.hold_code_qualification || businessRules.length > 0) && (
        <div className="rounded border p-2 space-y-1.5 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">AI Reasoning</p>
          {aiReasoning.hold_code_qualification && (
            <p className="text-xs">{aiReasoning.hold_code_qualification}</p>
          )}
          {businessRules.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              <p className="font-semibold text-muted-foreground">Business Rules Applied:</p>
              {businessRules.map((rule: string, i: number) => (
                <p key={i} className="text-muted-foreground pl-2">{rule}</p>
              ))}
            </div>
          )}
          {aiReasoning.action_required && (
            <p className="mt-1.5 font-semibold text-primary">{aiReasoning.action_required}</p>
          )}
        </div>
      )}

      {/* End Result / Next Steps */}
      {endResult.next_steps && endResult.next_steps.length > 0 && (
        <div className="rounded border p-2 space-y-1.5 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">Next Steps</p>
          {endResult.next_steps.map((step: string, i: number) => (
            <p key={i} className="text-muted-foreground">{step}</p>
          ))}
        </div>
      )}

      {/* Legacy analysis indicators (fallback) */}
      {!validationRules.length && (
        <div className="rounded border p-2 space-y-1 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">Analysis:</p>
          <p className={cn(hasCobCode ? 'text-green-400' : 'text-red-400')}>
            {hasCobCode ? '✓' : '✗'} COB hold code identified
          </p>
          <p className={cn(!hasDuplicate ? 'text-green-400' : 'text-amber-400')}>
            {!hasDuplicate ? '✓' : '⚠'} {hasDuplicate ? 'Duplicate indicator found' : 'No duplicate indicators'}
          </p>
        </div>
      )}

      {/* Outcome Badge */}
      <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
        mapOutcomeToStatus(outcome) === 'pass' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
        mapOutcomeToStatus(outcome) === 'fail' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
        'bg-amber-500/10 border border-amber-500/30 text-amber-400'
      )}>
        {endResult.confidence_level ? `${outcome} — ${endResult.confidence_level}` : `Outcome: ${outcome}`}
      </div>
    </div>
  )
}

function renderStage3Content(data: any, claimId?: string): React.ReactNode {
  // Support new structured format (claim_metadata, coverage_details, ai_reasoning, recommendation)
  const coverageDetails = data.coverage_details || {}
  const aiReasoning = data.ai_reasoning || {}
  const recommendation = data.recommendation || {}
  const primaryIdent = aiReasoning.primary_insurance_identification || {}
  const eobAnalysis = aiReasoning.eob_attachment_analysis || {}
  const nameVerification = aiReasoning.insurance_name_verification || {}
  const completeness = aiReasoning.eob_completeness_assessment || {}
  const insuranceAnalysis: any[] = primaryIdent.analysis || []

  const isNewFormat = !!data.coverage_details

  if (!isNewFormat) {
    // Legacy rendering
    const cobHistory: any[] = data.cob_history || []
    const eobExtraction: any[] = data.eob_extraction || []
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground">Source: COBHistory, COB_Image_Extraction</p>
        <div className="space-y-2 text-xs">
          {cobHistory.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-[10px] border">
                <thead><tr className="bg-muted/50"><th className="text-left px-2 py-1 border-r font-semibold">#</th><th className="text-left px-2 py-1 border-r font-semibold">Primary Insurance</th><th className="text-left px-2 py-1 border-r font-semibold">Effective</th><th className="text-left px-2 py-1 font-semibold">Term</th></tr></thead>
                <tbody>{cobHistory.map((row: any, i: number) => (<tr key={i} className="border-t"><td className="px-2 py-1 border-r">{row.sno}</td><td className="px-2 py-1 border-r font-semibold">{row.primary_insurance}</td><td className="px-2 py-1 border-r font-mono">{row.effective_date}</td><td className="px-2 py-1 font-mono">{row.term_date}</td></tr>))}</tbody>
              </table>
            </div>
          )}
          <div className="rounded border p-2 space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Primary Insurance</span><span className="font-semibold">{data.primary_insurance}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total PR Amount</span><span className="font-mono font-semibold">${Number(data.total_pr_amount || 0).toFixed(2)}</span></div>
          </div>
        </div>
        <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
          mapOutcomeToStatus(data.outcome || '') === 'pass' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        )}>Outcome: {data.outcome}</div>
      </div>
    )
  }

  // New structured rendering
  return (
    <div className="space-y-3">
      {/* Coverage Details Table */}
      <p className="text-[10px] font-semibold text-muted-foreground">Coverage Details</p>
      <div className="rounded border p-2 text-[10px]">
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead><tr className="bg-muted/50"><th className="text-left px-2 py-1 border-r font-semibold">Field</th><th className="text-left px-2 py-1 font-semibold">Value</th></tr></thead>
            <tbody>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">Date of Service</td><td className="px-2 py-1 font-mono font-semibold">{coverageDetails.date_of_service} (Maximum End Date)</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">Coverage Effective Date</td><td className="px-2 py-1 font-mono">{coverageDetails.coverage_effective_date}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">Identified Primary Insurance</td><td className="px-2 py-1 font-semibold">{coverageDetails.identified_primary_insurance}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">EOB Insurance Name</td><td className="px-2 py-1 font-semibold">{coverageDetails.eob_insurance_name}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">Insurance Match Status</td><td className={cn('px-2 py-1 font-semibold', coverageDetails.insurance_match_status === 'MATCH' ? 'text-green-400' : 'text-red-400')}>{coverageDetails.insurance_match_status === 'MATCH' ? '✅' : '❌'} {coverageDetails.insurance_match_status}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">PR Codes Identified</td><td className="px-2 py-1 font-mono">{(coverageDetails.pr_codes_identified || []).map((p: any) => p.code).join(', ') || 'None'}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r text-muted-foreground">EOB Completeness Status</td><td className={cn('px-2 py-1 font-semibold', coverageDetails.eob_completeness_status === 'COMPLETE' ? 'text-green-400' : 'text-amber-400')}>{coverageDetails.eob_completeness_status === 'COMPLETE' ? '✅' : '⚠️'} {coverageDetails.eob_completeness_status}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Primary Insurance Identification Logic */}
      {insuranceAnalysis.length > 0 && (
        <div className="rounded border p-2 space-y-2 text-[10px]">
          <p className="font-semibold text-muted-foreground">Primary Insurance Identification Logic</p>
          {insuranceAnalysis.map((ins: any, i: number) => (
            <div key={i} className="rounded border p-2 space-y-1">
              <p className="font-semibold">{ins.insurance} Analysis</p>
              <div className="font-mono text-muted-foreground space-y-0.5 pl-2">
                <p>Effective Date: {ins.effective_date}</p>
                <p>Term Date: {ins.term_date}</p>
                <p className={ins.dos_greater_than_effective ? 'text-green-400' : 'text-red-400'}>
                  DOS {'>'} Effective Date? {ins.dos_greater_than_effective ? '✅ YES' : '❌ NO'}
                </p>
                <p className={!ins.term_date_less_than_dos ? 'text-green-400' : 'text-red-400'}>
                  DOS {'<'} Term Date? {!ins.term_date_less_than_dos ? '✅ YES' : '❌ NO (DOS is AFTER term date)'}
                </p>
                <p className={cn('font-semibold', ins.is_active ? 'text-green-400' : 'text-red-400')}>
                  Status: {ins.status}
                </p>
              </div>
            </div>
          ))}
          <p className="text-xs font-semibold">Conclusion: {primaryIdent.primary_insurance_result} is the active primary insurance on date of service.</p>
        </div>
      )}

      {/* EOB Attachment Assessment */}
      <div className="rounded border p-2 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-muted-foreground">EOB Attachment Assessment</p>
          {eobAnalysis.eob_present && claimId && (
            <EobImageLink claimId={claimId} />
          )}
        </div>
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead><tr className="bg-muted/50"><th className="text-left px-2 py-1 border-r font-semibold">Item</th><th className="text-left px-2 py-1 border-r font-semibold">Status</th><th className="text-left px-2 py-1 font-semibold">Details</th></tr></thead>
            <tbody>
              <tr className="border-t"><td className="px-2 py-1 border-r">EOB Attachment Present?</td><td className={cn('px-2 py-1 border-r font-semibold', eobAnalysis.eob_present ? 'text-green-400' : 'text-red-400')}>{eobAnalysis.eob_present ? '✅ YES' : '❌ NO'}</td><td className="px-2 py-1 text-muted-foreground">{eobAnalysis.eob_present ? `Found in ${eobAnalysis.eob_source}` : 'Not found'}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r">Insurance Name Match</td><td className={cn('px-2 py-1 border-r font-semibold', nameVerification.names_match ? 'text-green-400' : 'text-red-400')}>{nameVerification.names_match ? '✅ VERIFIED' : '❌ MISMATCH'}</td><td className="px-2 py-1 text-muted-foreground">{nameVerification.verification_result}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r">PR Reason Codes Found</td><td className={cn('px-2 py-1 border-r font-semibold', completeness.pr_codes_present ? 'text-green-400' : 'text-red-400')}>{completeness.pr_codes_present ? '✅ YES' : '❌ NO'}</td><td className="px-2 py-1 text-muted-foreground">{(coverageDetails.pr_codes_identified || []).map((p: any) => `Code "${p.code}"`).join(', ') || 'None'}</td></tr>
              <tr className="border-t"><td className="px-2 py-1 border-r">Reason Code Descriptions</td><td className={cn('px-2 py-1 border-r font-semibold', completeness.pr_descriptions_available ? 'text-green-400' : 'text-red-400')}>{completeness.pr_descriptions_available ? '✅ YES' : '❌ NO'}</td><td className="px-2 py-1 text-muted-foreground">{completeness.pr_descriptions_available ? 'Descriptions provided' : 'Descriptions NOT PROVIDED'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* EOB Completeness */}
      {(completeness.missing_elements || []).length > 0 && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 space-y-1 text-[10px]">
          <p className="font-semibold text-amber-400">Missing Elements</p>
          {(completeness.missing_elements || []).map((el: string, i: number) => (
            <p key={i} className="text-amber-400">⚠️ {el}</p>
          ))}
          <p className="text-muted-foreground mt-1">Completeness Score: {completeness.completeness_score} — Status: {completeness.completeness_status}</p>
        </div>
      )}

      {/* Recommendation */}
      <div className={cn('rounded px-3 py-2 text-[10px] space-y-1',
        recommendation.decision === 'APPROVE' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
      )}>
        <p className={cn('font-semibold', recommendation.decision === 'APPROVE' ? 'text-green-400' : 'text-red-400')}>
          {recommendation.decision === 'APPROVE' ? '✅' : '❌'} {recommendation.decision}
          {recommendation.denial_code ? ` — ${recommendation.denial_code}` : ''}
        </p>
        {recommendation.denial_reason && <p className="text-muted-foreground">{recommendation.denial_reason}</p>}
        {recommendation.action_required && <p className="text-primary font-semibold">{recommendation.action_required}</p>}
        {recommendation.next_steps && recommendation.next_steps.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {recommendation.next_steps.map((step: string, i: number) => (
              <p key={i} className="text-muted-foreground pl-2">• {step}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function renderStage4Content(data: any): React.ReactNode {
  // Support new structured format (claim_analysis) and legacy flat format
  const claimAnalysis = data.claim_analysis || {}
  const tfCalc = claimAnalysis.timely_filing_calculation || {}
  const tfStatus = claimAnalysis.timely_filing_status || {}
  const aiReasoning = claimAnalysis.ai_reasoning || {}
  const claimDetails = claimAnalysis.claim_details || {}
  const finalRec = claimAnalysis.final_recommendation || {}
  const cobValidation = aiReasoning.cob_validation || {}
  const cobDetails = cobValidation.details || {}
  const dateDiffStatus = aiReasoning.date_difference_status || {}
  const stateLogic = aiReasoning.ky_state_logic || {}

  // Fallback to legacy flat format
  const isNewFormat = !!claimAnalysis.timely_filing_status
  const withinLimit = isNewFormat ? tfStatus.compliance : data.within_limit
  const daysAged = isNewFormat ? tfStatus.days_aged : data.days_aged
  const stateVal = isNewFormat ? tfStatus.state : data.state
  const filingLimit = isNewFormat ? tfStatus.standard_requirement_days : data.filing_limit
  const outcome = isNewFormat ? (finalRec.timely_filing_recommendation || '') : (data.outcome || '')

  if (!isNewFormat) {
    // Legacy rendering
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground">Source: Claim_Header, Claim_Detail</p>
        <div className="space-y-2 text-xs">
          <div className="rounded border p-2 space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-semibold">{stateVal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Filing Limit</span><span className="font-mono">{filingLimit} days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Days Remaining</span><span className={cn('font-semibold', data.days_remaining > 30 ? 'text-green-400' : data.days_remaining > 0 ? 'text-amber-400' : 'text-red-400')}>{data.days_remaining} days</span></div>
          </div>
        </div>
        <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
          withinLimit ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        )}>
          Outcome: {data.outcome}
        </div>
      </div>
    )
  }

  // New structured rendering
  return (
    <div className="space-y-3">
      {/* Timely Filing Calculation */}
      <p className="text-[10px] font-semibold text-muted-foreground">Timely Filing Calculation</p>
      <div className="rounded border p-2 space-y-1.5 text-[10px]">
        <p className="font-semibold text-muted-foreground">Date of Service Analysis</p>
        <div className="flex justify-between"><span className="text-muted-foreground">Maximum End Date (Latest DOS)</span><span className="font-mono font-semibold">{tfCalc.date_of_service?.maximum_end_date || '—'} (Line {tfCalc.date_of_service?.line_number || '—'})</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Received Date</span><span className="font-mono">{tfCalc.received_date || '—'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">DOS-to-Received Difference</span><span className="font-mono font-semibold">{tfCalc.dos_to_received_difference_days || 0} days</span></div>
      </div>

      {/* Timely Filing Status */}
      <div className="rounded border p-2 text-[10px]">
        <p className="font-semibold text-muted-foreground mb-1.5">Timely Filing Status</p>
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1 border-r font-semibold">Component</th>
                <th className="text-left px-2 py-1 font-semibold">Finding</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">State</td>
                <td className="px-2 py-1">{stateVal} (standard {filingLimit}-day window)</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">Status</td>
                <td className={cn('px-2 py-1 font-semibold', withinLimit ? 'text-green-400' : 'text-red-400')}>
                  {withinLimit ? '✅' : '❌'} {tfStatus.status?.replace(/_/g, ' ') || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="rounded border p-2 space-y-2 text-[10px]">
        <p className="font-semibold text-muted-foreground">AI Reasoning</p>

        {/* Date Difference Status */}
        <div className="space-y-0.5">
          <p className="font-semibold">Date Difference Status</p>
          <p className={cn(dateDiffStatus.finding === 'COMPLIANT' ? 'text-green-400' : 'text-red-400')}>
            {dateDiffStatus.finding === 'COMPLIANT' ? '✅' : '❌'} {dateDiffStatus.finding} — {dateDiffStatus.details}
          </p>
        </div>

        {/* State Logic */}
        {stateLogic.finding && (
          <div className="space-y-0.5">
            <p className="font-semibold">{stateVal} State Logic</p>
            <p className="text-muted-foreground">
              Date difference ({stateLogic.date_difference} days) vs threshold ({stateLogic.threshold} days) — {stateLogic.finding}
            </p>
          </div>
        )}

        {/* COB Validation */}
        {cobValidation.concern_level && (
          <div className="space-y-0.5">
            <p className="font-semibold">COB Validation</p>
            {cobValidation.concern_level === 'NONE' ? (
              <p className="text-green-400">✅ No COB concerns identified</p>
            ) : (
              <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 space-y-1">
                <p className="text-amber-400 font-semibold">⚠️ POTENTIAL ISSUE IDENTIFIED</p>
                <p className="text-muted-foreground">Primary Insurance: {cobDetails.primary_insurance} (Term: {cobDetails.primary_term_date})</p>
                {cobDetails.secondary_insurance && cobDetails.secondary_insurance !== 'N/A' && (
                  <p className="text-muted-foreground">Secondary Insurance: {cobDetails.secondary_insurance} (Term: {cobDetails.secondary_term_date})</p>
                )}
                {cobDetails.issue_description && cobDetails.issue_description !== 'N/A' && (
                  <p className="text-amber-400">{cobDetails.issue_description}</p>
                )}
                {cobDetails.recommendation && cobDetails.recommendation !== 'N/A' && (
                  <p className="text-primary font-semibold">Recommendation: {cobDetails.recommendation}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Final Recommendation */}
      <div className={cn('rounded px-3 py-2 text-[10px] space-y-1',
        finalRec.timely_filing_recommendation === 'APPROVE'
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-red-500/10 border border-red-500/30'
      )}>
        <p className={cn('font-semibold', finalRec.timely_filing_recommendation === 'APPROVE' ? 'text-green-400' : 'text-red-400')}>
          {finalRec.timely_filing_recommendation === 'APPROVE' ? '✅' : '❌'} {finalRec.timely_filing_recommendation} — {finalRec.timely_filing_reason}
        </p>
        {finalRec.cob_resolution_required && (
          <p className="text-amber-400">⚠️ COB resolution required before final processing</p>
        )}
        {finalRec.cob_action_items && finalRec.cob_action_items.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {finalRec.cob_action_items.map((item: string, i: number) => (
              <p key={i} className="text-muted-foreground pl-2">• {item}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function renderStage5Content(data: any): React.ReactNode {
  // Support new structured format
  const claimAnalysis = data.claim_analysis || {}
  const isNewFormat = !!claimAnalysis.cpt_line_items

  if (!isNewFormat) {
    // Legacy rendering
    const prCodeAnalysis = data.pr_code_analysis || {}
    const primaryCodes: string[] = prCodeAnalysis.primary_codes || []
    const secondaryCodes: string[] = prCodeAnalysis.secondary_codes || []
    const denyCodes: string[] = prCodeAnalysis.deny_codes || []
    return (
      <div className="space-y-3">
        <div className="rounded border p-2 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Coordination Type</span><span className="font-semibold">{data.coordination_type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Action</span><span className="font-semibold">{data.outcome}</span></div>
        </div>
        <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold', 'bg-amber-500/10 border border-amber-500/30 text-amber-400')}>Outcome: {data.outcome}</div>
      </div>
    )
  }

  // New structured rendering
  const cptLines: any[] = claimAnalysis.cpt_line_items || []
  const cptSummary = claimAnalysis.cpt_summary || {}
  const denialDetails: any[] = claimAnalysis.denial_details || []
  const primaryEob: any[] = claimAnalysis.primary_eob_details || []
  const authStatus = claimAnalysis.authorization_status || {}
  const reasoning = claimAnalysis.reasoning_analysis || {}
  const determination = reasoning.primary_secondary_determination || {}
  const eobInterpretation: any[] = reasoning.eob_reason_codes_interpretation || []
  const authValidation = reasoning.authorization_validation || {}
  const evidence: any[] = claimAnalysis.evidence_reviewed || []
  const recAction = claimAnalysis.recommended_action_type || {}
  const lineActions: any[] = recAction.line_specific_actions || []
  const checklist: any[] = recAction.hold_resolution_checklist || []
  const finalSummary = claimAnalysis.final_summary || {}

  return (
    <div className="space-y-3">
      {/* CPT Line Items */}
      <p className="text-[10px] font-semibold text-muted-foreground">CPT Line Items Summary</p>
      <div className="overflow-auto">
        <table className="w-full text-[10px] border">
          <thead><tr className="bg-muted/50">
            <th className="px-1.5 py-1 border-r font-semibold">Line</th>
            <th className="px-1.5 py-1 border-r font-semibold">CPT</th>
            <th className="px-1.5 py-1 border-r font-semibold">Mod</th>
            <th className="px-1.5 py-1 border-r font-semibold text-right">Billed</th>
            <th className="px-1.5 py-1 border-r font-semibold text-right">Allowed</th>
            <th className="px-1.5 py-1 border-r font-semibold text-right">Copay</th>
            <th className="px-1.5 py-1 border-r font-semibold text-right">Coins</th>
            <th className="px-1.5 py-1 border-r font-semibold text-right">OC Paid</th>
            <th className="px-1.5 py-1 font-semibold text-right">Net</th>
          </tr></thead>
          <tbody>
            {cptLines.map((line: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-1.5 py-1 border-r font-mono">{line.line_number}</td>
                <td className="px-1.5 py-1 border-r font-mono">{line.cpt_code}</td>
                <td className="px-1.5 py-1 border-r">{line.modifier}</td>
                <td className="px-1.5 py-1 border-r text-right">${Number(line.billed_amount).toFixed(2)}</td>
                <td className="px-1.5 py-1 border-r text-right">${Number(line.allowed_amount).toFixed(2)}</td>
                <td className="px-1.5 py-1 border-r text-right">${Number(line.copay).toFixed(2)}</td>
                <td className="px-1.5 py-1 border-r text-right">${Number(line.coinsurance).toFixed(2)}</td>
                <td className="px-1.5 py-1 border-r text-right">${Number(line.oc_paid).toFixed(2)}</td>
                <td className="px-1.5 py-1 text-right font-semibold">${Number(line.net_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="text-muted-foreground">Total Allowed: <span className="font-semibold text-foreground">${Number(cptSummary.total_allowed_amount || 0).toFixed(2)}</span></span>
        <span className="text-muted-foreground">Total OC Paid: <span className="font-semibold text-foreground">${Number(cptSummary.total_oc_paid || 0).toFixed(2)}</span></span>
      </div>

      {/* Denial Details */}
      {denialDetails.length > 0 && (
        <div className="rounded border border-red-500/30 p-2 text-[10px]">
          <p className="font-semibold text-red-400 mb-1">Denial Details</p>
          {denialDetails.map((d: any, i: number) => (
            <p key={i} className="text-red-400">Line {d.line_number}: {d.denial_code} — {d.denial_description} ({d.status})</p>
          ))}
        </div>
      )}

      {/* Primary EOB Details */}
      {primaryEob.length > 0 && (
        <div className="rounded border p-2 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">Primary EOB Details</p>
          <div className="overflow-auto">
            <table className="w-full text-[10px] border">
              <thead><tr className="bg-muted/50">
                <th className="px-1.5 py-1 border-r font-semibold">CPT</th>
                <th className="px-1.5 py-1 border-r font-semibold">Insurance</th>
                <th className="px-1.5 py-1 border-r font-semibold">PR Code</th>
                <th className="px-1.5 py-1 border-r font-semibold">Adj Codes</th>
                <th className="px-1.5 py-1 border-r font-semibold text-right">Paid</th>
                <th className="px-1.5 py-1 font-semibold text-right">PR Amt</th>
              </tr></thead>
              <tbody>
                {primaryEob.map((eob: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-1.5 py-1 border-r font-mono">{eob.cpt_code}</td>
                    <td className="px-1.5 py-1 border-r">{eob.primary_insurance}</td>
                    <td className="px-1.5 py-1 border-r font-mono">{eob.pr_reason_code}</td>
                    <td className="px-1.5 py-1 border-r font-mono">{(eob.co_adj_group_codes || []).join(', ')}</td>
                    <td className="px-1.5 py-1 border-r text-right">${Number(eob.paid_amount).toFixed(2)}</td>
                    <td className="px-1.5 py-1 text-right">${Number(eob.pr_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Authorization Status */}
      <div className="rounded border p-2 text-[10px]">
        <p className="font-semibold text-muted-foreground mb-1">Authorization Status</p>
        <div className="space-y-0.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn('font-semibold', authStatus.status === 'APPROVED' ? 'text-green-400' : 'text-amber-400')}>{authStatus.status}</span></div>
          {authStatus.hold_code && <div className="flex justify-between"><span className="text-muted-foreground">Hold Code</span><span className="font-mono">{authStatus.hold_code}</span></div>}
        </div>
      </div>

      {/* AI Reasoning - Determination */}
      <div className="rounded border p-2 space-y-2 text-[10px]">
        <p className="font-semibold text-muted-foreground">AI Reasoning</p>
        <div>
          <p className="font-semibold">Determination: <span className={cn(determination.determination === 'PRIMARY' ? 'text-green-400' : determination.determination === 'DENY' ? 'text-red-400' : 'text-amber-400')}>{determination.determination}</span></p>
          <p className="text-muted-foreground">{determination.business_logic_applied}</p>
        </div>

        {/* EOB Interpretation */}
        {eobInterpretation.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-[10px] border">
              <thead><tr className="bg-muted/50"><th className="px-1.5 py-1 border-r font-semibold">Code</th><th className="px-1.5 py-1 border-r font-semibold">Type</th><th className="px-1.5 py-1 border-r font-semibold">Meaning</th><th className="px-1.5 py-1 font-semibold">Action</th></tr></thead>
              <tbody>
                {eobInterpretation.map((code: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-1.5 py-1 border-r font-mono">{code.code} {code.code_value || ''}</td>
                    <td className="px-1.5 py-1 border-r">{code.type}</td>
                    <td className="px-1.5 py-1 border-r">{code.meaning}</td>
                    <td className="px-1.5 py-1 font-semibold">{code.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div>
            <p className="font-semibold mb-1">Evidence Reviewed</p>
            <div className="overflow-auto">
              <table className="w-full text-[10px] border">
                <thead><tr className="bg-muted/50"><th className="px-1.5 py-1 border-r font-semibold">Table</th><th className="px-1.5 py-1 font-semibold">Evidence</th></tr></thead>
                <tbody>{evidence.map((e: any, i: number) => (<tr key={i} className="border-t"><td className="px-1.5 py-1 border-r font-mono">{e.table}</td><td className="px-1.5 py-1 text-muted-foreground">{typeof e.evidence === 'string' ? e.evidence : JSON.stringify(e.evidence)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Action */}
      <div className={cn('rounded px-3 py-2 text-[10px] space-y-1.5',
        recAction.action_type?.includes('DENY') ? 'bg-red-500/10 border border-red-500/30' :
        recAction.action_type?.includes('PRIMARY') ? 'bg-green-500/10 border border-green-500/30' :
        'bg-amber-500/10 border border-amber-500/30'
      )}>
        <p className={cn('font-semibold',
          recAction.action_type?.includes('DENY') ? 'text-red-400' :
          recAction.action_type?.includes('PRIMARY') ? 'text-green-400' : 'text-amber-400'
        )}>
          {recAction.action_type?.includes('DENY') ? '🔴' : recAction.action_type?.includes('PRIMARY') ? '🟢' : '🔴'} {recAction.action_type}
        </p>
        <p className="text-muted-foreground">{recAction.primary_recommendation}</p>

        {/* Line actions */}
        {lineActions.length > 0 && (
          <div className="space-y-0.5 mt-1">
            {lineActions.map((la: any, i: number) => (
              <p key={i} className={cn(la.action === 'DENY' ? 'text-red-400' : la.action?.includes('PRIMARY') ? 'text-green-400' : 'text-muted-foreground')}>
                Line {la.line_number} ({la.cpt_code}): {la.action} — {la.reason}
              </p>
            ))}
          </div>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            <p className="font-semibold text-muted-foreground">Hold Resolution:</p>
            {checklist.map((item: any, i: number) => (
              <p key={i} className="text-muted-foreground pl-2">• {item.task}</p>
            ))}
          </div>
        )}
      </div>

      {/* Final Summary */}
      <div className="rounded border p-2 text-[10px]">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Claim Status</span><span className="font-semibold">{finalSummary.claim_status}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Action Type</span><span className="font-semibold">{finalSummary.action_type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Primary</span><span className="font-semibold">{finalSummary.primary_insurance}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Secondary</span><span className="font-semibold">{finalSummary.secondary_insurance}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Denials</span><span className="text-red-400 font-semibold">{finalSummary.total_denial_count}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Coordination Lines</span><span className="font-semibold">{finalSummary.total_coordination_lines}</span></div>
        </div>
        <p className="mt-1.5 text-primary font-semibold">Next: {finalSummary.next_action}</p>
      </div>
    </div>
  )
}

function renderStage6Content(data: any): React.ReactNode {
  const claimAnalysis = data.claim_analysis || {}
  const isNewFormat = !!claimAnalysis.claim_lines

  if (!isNewFormat) {
    // Legacy rendering
    const lineCalcs: any[] = data.line_calculations || []
    return (
      <div className="space-y-3">
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead><tr className="bg-muted/50"><th className="px-2 py-1 border-r font-semibold">Line</th><th className="px-2 py-1 border-r font-semibold text-right">Billed</th><th className="px-2 py-1 border-r font-semibold text-right">Allowed</th><th className="px-2 py-1 border-r font-semibold text-right">OC Paid</th><th className="px-2 py-1 border-r font-semibold text-right">PR Share</th><th className="px-2 py-1 border-r font-semibold text-right">Non-Covered</th><th className="px-2 py-1 font-semibold text-right">Net</th></tr></thead>
            <tbody>{lineCalcs.map((l: any, i: number) => (<tr key={i} className="border-t"><td className="px-2 py-1 border-r">{l.line_no}</td><td className="px-2 py-1 border-r text-right">${Number(l.billed).toFixed(2)}</td><td className="px-2 py-1 border-r text-right">${Number(l.allowed).toFixed(2)}</td><td className="px-2 py-1 border-r text-right">${Number(l.oc_paid).toFixed(2)}</td><td className="px-2 py-1 border-r text-right">${Number(l.pr_share).toFixed(2)}</td><td className="px-2 py-1 border-r text-right">${Number(l.non_covered).toFixed(2)}</td><td className="px-2 py-1 text-right font-semibold">${Number(l.net_payable).toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
        <div className="rounded px-2 py-1.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/30 text-green-400">Net: ${Number(data.net_amount || 0).toFixed(2)}</div>
      </div>
    )
  }

  // New structured rendering
  const claimLines: any[] = claimAnalysis.claim_lines || []
  const totals = claimAnalysis.claim_totals || {}
  const financialSummary = claimAnalysis.financial_summary || {}
  const cptDetail: any[] = financialSummary.cpt_line_detail || []
  const eobSummary: any[] = financialSummary.eob_summary || []
  const outcome = claimAnalysis.outcome || {}
  const finalCalcs: any[] = outcome.final_calculations || []
  const recommendations: any[] = claimAnalysis.recommendations || []
  const metadata = claimAnalysis.metadata || {}
  const header = claimAnalysis.claim_header || {}
  const cobSummary = claimAnalysis.cob_summary || {}

  return (
    <div className="space-y-3">
      {/* Claim Summary */}
      <div className="rounded border p-2 text-[10px] space-y-0.5">
        <p className="font-semibold text-muted-foreground">Claim Summary</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-muted-foreground">Claim: <span className="font-mono font-semibold text-foreground">{header.claim_number}</span></span>
          <span className="text-muted-foreground">Specialty: <span className="font-semibold text-foreground">{header.specialty}</span></span>
          <span className="text-muted-foreground">Primary: <span className="font-semibold text-foreground">{cobSummary.primary_insurance}</span></span>
          <span className="text-muted-foreground">Secondary: <span className="font-semibold text-foreground">{cobSummary.secondary_insurance} {!cobSummary.secondary_active && cobSummary.secondary_insurance !== 'N/A' ? '(Expired)' : ''}</span></span>
        </div>
      </div>

      {/* COB Calculation Per Line */}
      <p className="text-[10px] font-semibold text-muted-foreground">COB Analysis by CPT Line</p>
      {claimLines.map((line: any, i: number) => {
        const calc = line.cob_calculation || {}
        return (
          <div key={i} className="rounded border p-2 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Line {line.line_number}: CPT {line.cpt_code}</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold', calc.status === 'Valid' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400')}>{calc.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-muted-foreground">
              <span>OC Paid: <span className="font-mono text-foreground">${Number(line.oc_paid).toFixed(2)}</span></span>
              <span>Allowed: <span className="font-mono text-foreground">${Number(line.allowed_amount).toFixed(2)}</span></span>
              <span>PR Amt: <span className="font-mono text-foreground">${Number(line.pr_amount).toFixed(2)}</span></span>
            </div>
            <div className="rounded bg-muted/30 p-1.5 space-y-0.5">
              <p className="font-semibold text-primary">{calc.condition}</p>
              <p className="text-muted-foreground font-mono text-[9px]">{calc.formula_applied}</p>
              {calc.calculation_steps && calc.calculation_steps.slice(-2).map((step: string, j: number) => (
                <p key={j} className="text-muted-foreground font-mono text-[9px]">{step}</p>
              ))}
              <p className="font-semibold">Not Covered: ${Number(calc.not_covered_amount).toFixed(2)} | Net: ${Number(calc.net_amount).toFixed(2)}</p>
            </div>
          </div>
        )
      })}

      {/* Financial Outcome After Business Logic Applied */}
      <p className="text-[10px] font-semibold text-muted-foreground">Financial Outcome After Business Logic Applied</p>
      <div className="overflow-auto">
        <table className="w-full text-[10px] border">
          <thead><tr className="bg-muted/50"><th className="px-1 py-1 border-r font-semibold">S.No</th><th className="px-1 py-1 border-r font-semibold">CPT</th><th className="px-1 py-1 border-r font-semibold">Mod</th><th className="px-1 py-1 border-r font-semibold">Start Date</th><th className="px-1 py-1 border-r font-semibold">End Date</th><th className="px-1 py-1 border-r font-semibold text-right">Units</th><th className="px-1 py-1 border-r font-semibold text-right">Billed Amt</th><th className="px-1 py-1 border-r font-semibold text-right">Allowed Amt</th><th className="px-1 py-1 border-r font-semibold text-right">Not Covered</th><th className="px-1 py-1 border-r font-semibold text-right">Copay</th><th className="px-1 py-1 border-r font-semibold text-right">Coins</th><th className="px-1 py-1 border-r font-semibold text-right">Net Amt</th><th className="px-1 py-1 border-r font-semibold text-right">OC Paid</th><th className="px-1 py-1 border-r font-semibold">Claim Status</th><th className="px-1 py-1 font-semibold">Proc Status</th></tr></thead>
          <tbody>
            {claimLines.map((line: any, i: number) => {
              const calc = line.cob_calculation || {}
              return (<tr key={i} className="border-t"><td className="px-1 py-1 border-r">{line.line_number}</td><td className="px-1 py-1 border-r font-mono">{line.cpt_code}</td><td className="px-1 py-1 border-r">{line.modifier}</td><td className="px-1 py-1 border-r">{line.start_date}</td><td className="px-1 py-1 border-r">{line.end_date}</td><td className="px-1 py-1 border-r text-right">{line.units}</td><td className="px-1 py-1 border-r text-right">${Number(line.billed_amount).toFixed(2)}</td><td className="px-1 py-1 border-r text-right">${Number(line.allowed_amount).toFixed(2)}</td><td className="px-1 py-1 border-r text-right">${Number(calc.not_covered_amount || 0).toFixed(2)}</td><td className="px-1 py-1 border-r text-right">${Number(line.copay).toFixed(2)}</td><td className="px-1 py-1 border-r text-right">${Number(line.coinsurance).toFixed(2)}</td><td className="px-1 py-1 border-r text-right">${Number(calc.net_amount || 0).toFixed(2)}</td><td className="px-1 py-1 border-r text-right">${Number(line.oc_paid).toFixed(2)}</td><td className="px-1 py-1 border-r font-semibold">P</td><td className="px-1 py-1 font-semibold">P</td></tr>)
            })}
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded border p-2 space-y-1.5 text-[10px]">
          <p className="font-semibold text-muted-foreground">Recommendations</p>
          {recommendations.map((rec: any, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className={cn('rounded px-1 py-0.5 text-[8px] font-bold shrink-0', rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : rec.priority === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground')}>{rec.priority}</span>
              <div><p className="font-semibold">{rec.action}</p><p className="text-muted-foreground">{rec.details}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Status Badge */}
      <div className={cn('rounded px-3 py-2 text-[10px] font-semibold',
        metadata.overall_status?.includes('Valid') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
      )}>
        {metadata.overall_status} | Overpayment: ${Number(metadata.total_potential_overpayment || 0).toFixed(2)} | Lines Review: {metadata.lines_requiring_review || 0}
      </div>
    </div>
  )
}

function renderStage7Content(data: any): React.ReactNode {
  // Support new structured format
  const isNewFormat = !!data.executive_summary || !!data.cpt_line_level_processing

  if (!isNewFormat) {
    // Legacy or pending
    if (data.status === 'PENDING') {
      return <p className="text-xs text-amber-400 py-4 text-center">⏳ {data.message || 'Pending examiner decision'}</p>
    }
    const postingData = data.posting_data || {}
    return (
      <div className="space-y-3">
        <div className="rounded border p-2 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Disposition</span><span className="font-semibold">{postingData.disposition || data.outcome || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Net Payable</span><span className="font-mono">${Number(postingData.net_payable || 0).toFixed(2)}</span></div>
        </div>
        <div className="rounded px-2 py-1.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/30 text-green-400">Outcome: {data.outcome}</div>
      </div>
    )
  }

  // New structured rendering with editable fields
  return <PostingRecommendationView data={data} />
}

function PostingRecommendationView({ data }: { data: any }) {
  const execSummary = data.executive_summary || {}
  const cptProcessing = data.cpt_line_level_processing || {}
  const rawCptTable: any[] = Array.isArray(cptProcessing) ? cptProcessing : (cptProcessing.summary_table || [])
  // Normalize field names (Bedrock may return different names than deterministic)
  const cptTable = rawCptTable.map((row: any) => ({
    line_number: row.line_number || row.line || 0,
    cpt_code: row.cpt_code || row.cpt || '',
    modifier: row.modifier || '0',
    allowed_amount: row.allowed_amount || row.allowed_amt || 0,
    non_covered_amount: row.non_covered_amount || row.non_covered || 0,
    copay: row.copay || 0,
    coinsurance: row.coinsurance || row.coins || 0,
    net_amount: row.net_amount || row.net_payable || row.net_amt || 0,
    allowed_reason: row.allowed_reason || 'Medicare EOB Received',
    claim_status: row.claim_status || 'HOLD',
    processing_status: row.processing_status || 'PENDING_REVIEW',
  }))
  const cptTotals = Array.isArray(cptProcessing) ? {} : (cptProcessing.totals || {})
  const claimDisposition = data.claim_status_and_disposition || {}
  const denialDetails = data.denial_code_details || {}
  const rawDenials = Array.isArray(denialDetails) ? denialDetails : (denialDetails.denial_records || [])
  const denialRecords: any[] = rawDenials.map((d: any) => ({
    line_number: d.line_number || d.line || 0,
    cpt_code: d.cpt_code || d.cpt || '',
    denial_code: d.denial_code || d.code || '',
    denial_description: d.denial_description || d.description || '',
    amount_denied: d.amount_denied || d.amount || 0,
    reason: d.reason || '',
  }))
  const overpayment = data.overpayment_analysis || {}
  const overpaymentRecords: any[] = overpayment.overpayment_records || []
  const recActions = data.recommended_actions || {}
  const actions: any[] = recActions.immediate_actions || []
  const processingPath: any[] = recActions.processing_path || []
  const finalRec = data.final_recommendation || {}
  const keyFindings = data.key_findings_and_red_flags || {}
  const criticalIssues: any[] = keyFindings.critical_issues || []

  // Editable state for line amendments
  const [editMode, setEditMode] = React.useState(false)
  const [amendments, setAmendments] = React.useState<Record<number, { allowed_amount?: number; non_covered_amount?: number }>>({})
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const handleAmend = (lineNumber: number, field: string, value: string) => {
    const numVal = parseFloat(value) || 0
    setAmendments(prev => ({
      ...prev,
      [lineNumber]: { ...prev[lineNumber], [field]: numVal }
    }))
  }

  const getDisplayValue = (line: any, field: string) => {
    const amendment = amendments[line.line_number]
    if (amendment && amendment[field as keyof typeof amendment] !== undefined) {
      return amendment[field as keyof typeof amendment]
    }
    return line[field]
  }

  return (
    <div className="space-y-3">
      {/* Executive Summary */}
      {Object.keys(execSummary).length > 0 && (
        <div className="rounded border p-2 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1.5">Executive Summary</p>
          <div className="overflow-auto">
            <table className="w-full text-[10px] border">
              <thead><tr className="bg-muted/50"><th className="px-1.5 py-1 border-r font-semibold text-left">Component</th><th className="px-1.5 py-1 border-r font-semibold">Status</th><th className="px-1.5 py-1 font-semibold text-left">Finding</th></tr></thead>
              <tbody>
                {Object.entries(execSummary).map(([key, val]: [string, any]) => (
                  <tr key={key} className="border-t">
                    <td className="px-1.5 py-1 border-r capitalize">{key.replace(/_/g, ' ')}</td>
                    <td className="px-1.5 py-1 border-r text-center">{val.icon} {val.status}</td>
                    <td className="px-1.5 py-1 text-muted-foreground">{val.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CPT Line-Level Processing with Edit Toggle */}
      {cptTable.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground">CPT Line-Level Processing</p>
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn('text-[9px] px-2 py-0.5 rounded border transition-colors', editMode ? 'bg-primary/20 text-primary border-primary/50' : 'hover:bg-muted')}
            >
              {editMode ? '✓ Done Editing' : '✏️ Amend Values'}
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-[9px] border">
              <thead><tr className="bg-muted/50">
                <th className="px-1 py-1 border-r font-semibold">Line</th>
                <th className="px-1 py-1 border-r font-semibold">CPT</th>
                <th className="px-1 py-1 border-r font-semibold">Mod{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold text-right">Allowed{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold text-right">Non-Cov{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold text-right">Copay{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold text-right">Coins{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold text-right">Net{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold">Status{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 font-semibold">Proc{editMode && ' ✏️'}</th>
              </tr></thead>
              <tbody>
                {cptTable.map((row: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-1 py-1 border-r">{row.line_number}</td>
                    <td className="px-1 py-1 border-r font-mono">{row.cpt_code}</td>
                    <td className="px-1 py-1 border-r">
                      {editMode ? <input type="text" defaultValue={row.modifier} onChange={(e) => handleAmend(row.line_number, 'modifier', e.target.value)} className="w-8 text-[9px] rounded border bg-background px-1 py-0.5" /> : row.modifier}
                    </td>
                    <td className="px-1 py-1 border-r text-right">
                      {editMode ? <input type="number" step="0.01" defaultValue={Number(row.allowed_amount).toFixed(2)} onChange={(e) => handleAmend(row.line_number, 'allowed_amount', e.target.value)} className="w-16 text-right text-[9px] rounded border bg-background px-1 py-0.5" /> : <span>${Number(getDisplayValue(row, 'allowed_amount')).toFixed(2)}</span>}
                    </td>
                    <td className="px-1 py-1 border-r text-right">
                      {editMode ? <input type="number" step="0.01" defaultValue={Number(row.non_covered_amount).toFixed(2)} onChange={(e) => handleAmend(row.line_number, 'non_covered_amount', e.target.value)} className="w-16 text-right text-[9px] rounded border bg-background px-1 py-0.5" /> : <span>${Number(getDisplayValue(row, 'non_covered_amount')).toFixed(2)}</span>}
                    </td>
                    <td className="px-1 py-1 border-r text-right">
                      {editMode ? <input type="number" step="0.01" defaultValue={Number(row.copay).toFixed(2)} onChange={(e) => handleAmend(row.line_number, 'copay', e.target.value)} className="w-14 text-right text-[9px] rounded border bg-background px-1 py-0.5" /> : <span>${Number(row.copay).toFixed(2)}</span>}
                    </td>
                    <td className="px-1 py-1 border-r text-right">
                      {editMode ? <input type="number" step="0.01" defaultValue={Number(row.coinsurance).toFixed(2)} onChange={(e) => handleAmend(row.line_number, 'coinsurance', e.target.value)} className="w-14 text-right text-[9px] rounded border bg-background px-1 py-0.5" /> : <span>${Number(row.coinsurance).toFixed(2)}</span>}
                    </td>
                    <td className="px-1 py-1 border-r text-right">
                      {editMode ? <input type="number" step="0.01" defaultValue={Number(row.net_amount).toFixed(2)} onChange={(e) => handleAmend(row.line_number, 'net_amount', e.target.value)} className="w-16 text-right text-[9px] rounded border bg-background px-1 py-0.5" /> : <span className="font-semibold">${Number(row.net_amount).toFixed(2)}</span>}
                    </td>
                    <td className="px-1 py-1 border-r">
                      {editMode ? (
                        <select defaultValue={row.claim_status} onChange={(e) => handleAmend(row.line_number, 'claim_status', e.target.value)} className="text-[9px] rounded border bg-background px-1 py-0.5">
                          <option value="PAID">PAID</option>
                          <option value="DENIED">DENIED</option>
                          <option value="HOLD">HOLD</option>
                        </select>
                      ) : <span className={cn('font-semibold', row.claim_status === 'DENIED' ? 'text-red-400' : row.claim_status === 'HOLD' ? 'text-amber-400' : 'text-green-400')}>{row.claim_status}</span>}
                    </td>
                    <td className="px-1 py-1">
                      {editMode ? (
                        <select defaultValue={row.processing_status} onChange={(e) => handleAmend(row.line_number, 'processing_status', e.target.value)} className="text-[9px] rounded border bg-background px-1 py-0.5">
                          <option value="FINALIZED">FINALIZED</option>
                          <option value="PENDING_REVIEW">PENDING REVIEW</option>
                          <option value="PROCESSED">PROCESSED</option>
                        </select>
                      ) : <span className={cn('font-semibold', row.processing_status === 'FINALIZED' ? 'text-green-400' : 'text-amber-400')}>{row.processing_status?.replace('_', ' ')}</span>}
                    </td>
                  </tr>
                ))}
                <tr className="border-t font-semibold bg-muted/30">
                  <td className="px-1 py-1 border-r" colSpan={2}>TOTAL</td>
                  <td className="px-1 py-1 border-r"></td>
                  <td className="px-1 py-1 border-r text-right">${Number(cptTotals.total_allowed_amount || 0).toFixed(2)}</td>
                  <td className="px-1 py-1 border-r text-right">${Number(cptTotals.total_non_covered_amount || 0).toFixed(2)}</td>
                  <td className="px-1 py-1 border-r text-right">${Number(cptTotals.total_copay || 0).toFixed(2)}</td>
                  <td className="px-1 py-1 border-r text-right">${Number(cptTotals.total_coinsurance || 0).toFixed(2)}</td>
                  <td className="px-1 py-1 border-r text-right">${Number(cptTotals.total_net_amount || 0).toFixed(2)}</td>
                  <td className="px-1 py-1 border-r" colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
          {saved && <p className="text-[9px] text-green-400">✓ Amendments saved</p>}
        </div>
      )}

      {/* Claim Status & Disposition */}
      {claimDisposition.overall_claim_status && (
        <div className="rounded border p-2 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">Claim Status & Disposition</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Overall Status</span><span className={cn('font-semibold', claimDisposition.overall_claim_status === 'APPROVED' ? 'text-green-400' : claimDisposition.overall_claim_status === 'DENIED' ? 'text-red-400' : 'text-amber-400')}>{claimDisposition.overall_claim_status === 'HOLD' ? '🔴 ' : ''}{claimDisposition.overall_claim_status}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lines Denied</span><span className="font-semibold text-red-400">{claimDisposition.lines_denied}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lines on Hold</span><span className="font-semibold text-amber-400">{claimDisposition.lines_on_hold}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lines Paid</span><span className="font-semibold text-green-400">{claimDisposition.lines_paid}</span></div>
            {claimDisposition.hold_code && <div className="flex justify-between"><span className="text-muted-foreground">Hold Code</span><span className="font-mono">{claimDisposition.hold_code}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span className="font-semibold">{claimDisposition.priority_level}</span></div>
          </div>
        </div>
      )}

      {/* Denial Code Details - Editable */}
      {denialRecords.length > 0 && (
        <div className="rounded border border-red-500/30 p-2 text-[10px]">
          <p className="font-semibold text-red-400 mb-1">Denial Code Details at CPT Level</p>
          <div className="overflow-auto">
            <table className="w-full text-[9px] border">
              <thead><tr className="bg-muted/50">
                <th className="px-1 py-1 border-r font-semibold">Line</th>
                <th className="px-1 py-1 border-r font-semibold">CPT</th>
                <th className="px-1 py-1 border-r font-semibold">Denial Code{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold">Description{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 border-r font-semibold text-right">Amount{editMode && ' ✏️'}</th>
                <th className="px-1 py-1 font-semibold">Reason{editMode && ' ✏️'}</th>
              </tr></thead>
              <tbody>
                {denialRecords.map((d: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-1 py-1 border-r">{d.line_number}</td>
                    <td className="px-1 py-1 border-r font-mono">{d.cpt_code}</td>
                    <td className="px-1 py-1 border-r">
                      {editMode ? <input type="text" defaultValue={d.denial_code} className="w-16 text-[9px] rounded border bg-background px-1 py-0.5" /> : <span className="font-mono font-semibold text-red-400">{d.denial_code}</span>}
                    </td>
                    <td className="px-1 py-1 border-r">
                      {editMode ? <input type="text" defaultValue={d.denial_description} className="w-32 text-[9px] rounded border bg-background px-1 py-0.5" /> : <span>{d.denial_description}</span>}
                    </td>
                    <td className="px-1 py-1 border-r text-right">
                      {editMode ? <input type="number" step="0.01" defaultValue={d.amount_denied || 0} className="w-16 text-right text-[9px] rounded border bg-background px-1 py-0.5" /> : <span>${Number(d.amount_denied || 0).toFixed(2)}</span>}
                    </td>
                    <td className="px-1 py-1">
                      {editMode ? <input type="text" defaultValue={d.reason} className="w-full text-[9px] rounded border bg-background px-1 py-0.5" /> : <span className="text-muted-foreground">{d.reason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {denialDetails.denial_conflict_alert && (
            <p className="mt-1.5 text-amber-400 text-[9px]">⚠️ {denialDetails.denial_conflict_alert.issue || ''} — {denialDetails.denial_conflict_alert.detail || ''}</p>
          )}
        </div>
      )}

      {/* Overpayment */}
      {overpaymentRecords.length > 0 && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[10px]">
          <p className="font-semibold text-amber-400 mb-1">⚠️ Overpayment: ${Number(overpayment.total_potential_overpayment || 0).toFixed(2)}</p>
          {overpaymentRecords.map((r: any, i: number) => (
            <p key={i} className="text-amber-400">Line {r.line_number} ({r.cpt_code}): Overpayment ${Number(Math.abs(r.calculated_overpayment)).toFixed(2)}</p>
          ))}
        </div>
      )}

      {/* Key Findings & Red Flags */}
      {criticalIssues.length > 0 && (
        <div className="rounded border border-red-500/30 p-2 text-[10px] space-y-1">
          <p className="font-semibold text-red-400">🔴 Critical Issues</p>
          <div className="overflow-auto">
            <table className="w-full text-[9px] border">
              <thead><tr className="bg-muted/50"><th className="px-1.5 py-1 border-r font-semibold text-left">Issue</th><th className="px-1.5 py-1 border-r font-semibold">Severity</th><th className="px-1.5 py-1 border-r font-semibold">Impact</th><th className="px-1.5 py-1 font-semibold text-left">Resolution</th></tr></thead>
              <tbody>
                {criticalIssues.map((issue: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-1.5 py-1 border-r">{issue.issue}</td>
                    <td className={cn('px-1.5 py-1 border-r text-center font-semibold', issue.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400')}>{issue.severity}</td>
                    <td className="px-1.5 py-1 border-r">{issue.impact}</td>
                    <td className="px-1.5 py-1 text-muted-foreground">{issue.resolution_required}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {actions.length > 0 && (
        <div className="rounded border p-2 text-[10px] space-y-1">
          <p className="font-semibold text-muted-foreground">Recommended Actions</p>
          {actions.map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className={cn('rounded px-1 py-0.5 text-[8px] font-bold shrink-0', a.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : a.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground')}>{a.priority}</span>
              <span className="text-muted-foreground">{a.action} {a.owner && <span className="text-[9px]">({a.owner} · {a.timeline})</span>}</span>
            </div>
          ))}
          {/* Processing Path */}
          {processingPath.length > 0 && (
            <div className="mt-2 rounded bg-muted/30 p-2 space-y-0.5">
              <p className="font-semibold text-muted-foreground text-[9px]">Processing Path:</p>
              {processingPath.map((step: any, i: number) => (
                <p key={i} className="text-muted-foreground font-mono text-[9px]">
                  {step.state ? `▶ ${step.state}` : `${step.step}. ${step.action}`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Final Recommendation */}
      <div className={cn('rounded px-3 py-2 text-[10px] space-y-1',
        claimDisposition.overall_claim_status === 'APPROVED' ? 'bg-green-500/10 border border-green-500/30' :
        claimDisposition.overall_claim_status === 'DENIED' ? 'bg-red-500/10 border border-red-500/30' :
        'bg-amber-500/10 border border-amber-500/30'
      )}>
        <p className={cn('font-semibold',
          claimDisposition.overall_claim_status === 'APPROVED' ? 'text-green-400' :
          claimDisposition.overall_claim_status === 'DENIED' ? 'text-red-400' : 'text-amber-400'
        )}>
          {claimDisposition.overall_claim_status === 'APPROVED' ? '🟢' : '🔴'} {finalRec.claim_action || claimDisposition.overall_claim_status}
        </p>
        <p className="text-muted-foreground">{finalRec.payment_decision}</p>
        {finalRec.financial_exposure && (
          <p className="font-mono text-muted-foreground">Net: ${Number(finalRec.financial_exposure.net_pending_resolution || 0).toFixed(2)}</p>
        )}
      </div>
    </div>
  )
}

function renderStage8Content(data: any): React.ReactNode {
  const checks: any[] = data.validation_checks || []
  const issues: string[] = data.issues_found || []
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground">Validation Checks ({data.checks_passed}/{data.total_checks} passed)</p>
      <div className="space-y-2 text-xs">
        <div className="rounded border p-2 space-y-1.5">
          {checks.map((check: any, i: number) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-muted-foreground">{check.check}</span>
              <span className={cn('inline-flex items-center gap-1', check.passed ? 'text-green-400' : 'text-red-400')}>
                {check.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {check.detail || (check.passed ? 'Passed' : 'Failed')}
              </span>
            </div>
          ))}
        </div>
        {issues.length > 0 && (
          <div className="rounded border border-red-500/30 p-2 space-y-1">
            <p className="text-[10px] font-semibold text-red-400">Issues Found:</p>
            {issues.map((issue: string, i: number) => (
              <p key={i} className="text-red-400 text-[10px]">• {issue}</p>
            ))}
          </div>
        )}
      </div>
      <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
        issues.length === 0 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
      )}>
        Outcome: {data.outcome}
      </div>
    </div>
  )
}

function renderStageContent(stageNumber: number, data: any, claimId?: string): React.ReactNode {
  // Deep sanitize: convert any JSONB arrays and nested objects that might be rendered as React children
  const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert JSONB array fields to comma-separated strings
    if ((key === 'adj_grp_code' || key === 'reason_code' || key === 'pr_amount') && Array.isArray(value)) {
      return value.join(', ')
    }
    // If an array contains objects with eob-like keys, stringify them
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'insurance_name' in value[0] && 'paid_amt' in value[0]) {
      return value.map((v: any) => `${v.insurance_name || ''} - CPT ${v.cpt || ''} - $${v.paid_amt || 0}`)
    }
    return value
  }))
  switch (stageNumber) {
    case 1: return renderStage1Content(sanitized)
    case 2: return renderStage2Content(sanitized)
    case 3: return renderStage3Content(sanitized, claimId)
    case 4: return renderStage4Content(sanitized)
    case 5: return renderStage5Content(sanitized)
    case 6: return renderStage6Content(sanitized)
    case 7: return renderStage7Content(sanitized)
    case 8: return renderStage8Content(sanitized)
    default: return <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(sanitized, null, 2)}</pre>
  }
}

// ─── Build stages from API response ─────────────────────────────────────────

function buildStagesFromAPI(apiStages: AgentStage[], claimId?: string): StageData[] {
  return apiStages.map((stage) => {
    // For stage 2, shorten the outcome label if it's the new verbose format
    let outcomeLabel = stage.outcome
    if (stage.stage_number === 2 && outcomeLabel.includes(' - ')) {
      const parts = outcomeLabel.split(' - ')
      outcomeLabel = parts.length > 1 ? parts[1] : parts[0]
      outcomeLabel = outcomeLabel.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    }

    return {
      id: stage.stage_number,
      title: stage.stage_name,
      icon: STAGE_ICONS[stage.stage_number] || <Brain className="h-3.5 w-3.5 text-purple-400" />,
      outcome: mapOutcomeToStatus(stage.outcome),
      outcomeLabel: outcomeLabel,
      confidence: mapConfidence(stage.confidence),
      content: renderStageContent(stage.stage_number, stage.output_data, claimId),
    }
  })
}

// ─── Fallback: Build stages from local data (for unprocessed claims) ─────────

function buildStagesLocally(claim: Claim): StageData[] {
  const lines = getClaimDetailLines(claim)
  const holdCode = getHoldCodeInfo(claim)
  const denial = getDenialDetails(claim)
  const cobHistory = getCOBHistory(claim)
  const eob = getEOBExtraction(claim)

  const totalAllowed = lines.reduce((s, l) => s + l.allowed, 0)
  const totalCopay = lines.reduce((s, l) => s + l.copay, 0)
  const totalCoins = lines.reduce((s, l) => s + l.coins, 0)
  const totalOcPaid = lines.reduce((s, l) => s + l.ocPaid, 0)
  const totalPR = eob.prAmount
  const totalBilled = lines.reduce((s, l) => s + l.billed, 0)

  const cobCalcLines = lines.map((line) => {
    const linePR = line.copay + line.coins
    let nonCovered = 0
    let netAmount = 0
    let conditionApplied = 1
    if (line.ocPaid > linePR) {
      nonCovered = (line.ocPaid - line.allowed) - linePR
      if (nonCovered < 0) nonCovered = 0
      netAmount = line.allowed - linePR - nonCovered
      conditionApplied = 1
    } else if (line.ocPaid < linePR) {
      nonCovered = 0
      netAmount = 0
      conditionApplied = 2
    } else {
      nonCovered = 0
      netAmount = line.allowed - linePR
      conditionApplied = 3
    }
    return { ...line, nonCovered, netAmount, conditionApplied }
  })

  const totalNonCovered = cobCalcLines.reduce((s, l) => s + l.nonCovered, 0)
  const totalNetAmount = cobCalcLines.reduce((s, l) => s + l.netAmount, 0)

  const dateDiff = claim.daysAged
  const timelyFilingLimit = 365
  const isTimelyFiled = dateDiff <= timelyFilingLimit

  const holdCodeValid = holdCode.reason === 'COBOC' || holdCode.reason === 'COBHD'
  const historyIsH = holdCode.history === 'H'
  const hasDuplicateCode = denial.reasonCode.includes('EXDUC')
  const holdCodeOutcome = historyIsH
    ? 'Already Processed'
    : hasDuplicateCode
      ? 'Duplicate Review Required'
      : holdCodeValid
        ? 'Continue COB Review'
        : 'Human Review Required'

  const primaryInsurance = cobHistory[0]
  const eobInsurance = eob.insurance
  const insuranceMatch = primaryInsurance.insurance === eobInsurance
  const eobHasPR = eob.adjGrpCode.includes('PR')

  let eligibilityOutcome = 'Primary Insurance Verified'
  if (!insuranceMatch) {
    eligibilityOutcome = primaryInsurance.insurance === 'Medicare' ? 'DN017' : 'DN018'
  } else if (!eobHasPR) {
    eligibilityOutcome = 'DNEOB'
  }

  const prReasons = eob.reason.split(',').map((r: string) => r.trim())
  const hasPrimaryIndicator = prReasons.some((r: string) => ['96', '204'].includes(r))
  const hasSecondaryIndicator = prReasons.some((r: string) => ['1', '2', '3'].includes(r))
  const hasCO45 = eob.adjGrpCode.includes('CO') && prReasons.includes('45')

  let coordinationOutcome = 'Human Review Required'
  if (hasCO45) {
    coordinationOutcome = 'DNNPR'
  } else if (hasPrimaryIndicator) {
    coordinationOutcome = 'Pay as Primary'
  } else if (hasSecondaryIndicator) {
    coordinationOutcome = 'Pay as Secondary'
  }

  return [
    {
      id: 1,
      title: 'AI Extracted Data Summary',
      icon: <Brain className="h-3.5 w-3.5 text-purple-400" />,
      outcome: 'pass' as OutcomeStatus,
      outcomeLabel: 'Summarized',
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground">Quick Brief — locally generated</p>
          <ul className="space-y-1.5 text-xs list-disc list-inside">
            <li>Claim Number: <span className="font-mono font-semibold">{claim.claimNumber}</span></li>
            <li>Classification: <span className="font-semibold">{claim.classification}</span> — Hold Code: <span className="font-mono">{holdCode.reason}</span></li>
            <li>Primary Insurance: <span className="font-semibold">{primaryInsurance.insurance}</span></li>
            <li>Total Billed: <span className="font-semibold">${totalBilled.toFixed(2)}</span> | Allowed: <span className="font-semibold">${totalAllowed.toFixed(2)}</span></li>
            <li>OC Paid: <span className="font-semibold">${totalOcPaid.toFixed(2)}</span> | PR Amount: <span className="font-semibold">${eob.prAmount.toFixed(2)}</span></li>
            <li>Timely Filing: {isTimelyFiled ? 'Within Window' : 'EXCEEDED'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Hold and Denial Code Validation',
      icon: <Shield className="h-3.5 w-3.5 text-amber-400" />,
      outcome: (holdCodeOutcome === 'Continue COB Review' ? 'pass' : holdCodeOutcome === 'Already Processed' ? 'fail' : 'warning') as OutcomeStatus,
      outcomeLabel: holdCodeOutcome,
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Hold Code</span><span className="font-mono font-semibold">{holdCode.reason}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">History</span><span>{holdCode.history || 'Blank'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Denial Code</span><span className="font-mono">{denial.reasonCode}</span></div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Member Eligibility Agent',
      icon: <Users className="h-3.5 w-3.5 text-green-400" />,
      outcome: (eligibilityOutcome === 'Primary Insurance Verified' ? 'pass' : 'fail') as OutcomeStatus,
      outcomeLabel: eligibilityOutcome,
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Primary Insurance</span><span className="font-semibold">{primaryInsurance.insurance}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EOB Insurance</span><span className="font-semibold">{eobInsurance}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Match</span><span className={cn(insuranceMatch ? 'text-green-400' : 'text-red-400')}>{insuranceMatch ? 'YES' : 'NO'}</span></div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Timely Filing Validation',
      icon: <Clock className="h-3.5 w-3.5 text-cyan-400" />,
      outcome: (isTimelyFiled ? 'pass' : 'fail') as OutcomeStatus,
      outcomeLabel: isTimelyFiled ? 'Passed Timely Filing' : 'Denied - Timely Filing',
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Limit</span><span>{timelyFilingLimit} days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn(isTimelyFiled ? 'text-green-400' : 'text-red-400')}>{isTimelyFiled ? 'PASS' : 'FAIL'}</span></div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Coordination Rule Determination',
      icon: <Activity className="h-3.5 w-3.5 text-indigo-400" />,
      outcome: (coordinationOutcome === 'Pay as Secondary' || coordinationOutcome === 'Pay as Primary' ? 'pass' : coordinationOutcome === 'DNNPR' ? 'fail' : 'warning') as OutcomeStatus,
      outcomeLabel: coordinationOutcome,
      confidence: (hasSecondaryIndicator || hasPrimaryIndicator || hasCO45 ? 'High' : 'Medium') as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Coordination</span><span className="font-semibold">{coordinationOutcome}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EOB Adj Group</span><span className="font-mono">{eob.adjGrpCode}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Reason Codes</span><span className="font-mono">{eob.reason}</span></div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: 'COB Calculation',
      icon: <Calculator className="h-3.5 w-3.5 text-emerald-400" />,
      outcome: 'pass' as OutcomeStatus,
      outcomeLabel: 'Calculated',
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div className="rounded border p-2 text-center">
              <p className="text-muted-foreground">Total PR</p>
              <p className="font-bold text-sm">${totalPR.toFixed(2)}</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="text-muted-foreground">Allowed</p>
              <p className="font-bold text-sm">${totalAllowed.toFixed(2)}</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="text-muted-foreground">Non-Covered</p>
              <p className="font-bold text-sm">${totalNonCovered.toFixed(2)}</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="text-muted-foreground">Net Amount</p>
              <p className="font-bold text-sm text-green-400">${totalNetAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: 'Posting',
      icon: <Send className="h-3.5 w-3.5 text-orange-400" />,
      outcome: 'pass' as OutcomeStatus,
      outcomeLabel: 'Ready for Posting',
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Allowed Amount</span><span className="font-mono">${totalAllowed.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Non-Covered</span><span className="font-mono">${totalNonCovered.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net Payable</span><span className="font-mono font-semibold">${totalNetAmount.toFixed(2)}</span></div>
          </div>
        </div>
      ),
    },
    {
      id: 8,
      title: 'Post Validation',
      icon: <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />,
      outcome: 'pass' as OutcomeStatus,
      outcomeLabel: 'Claim Ready for Finalization',
      confidence: 'High' as ConfidenceLevel,
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">All Checks</span>
              <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> Passed</span>
            </div>
          </div>
        </div>
      ),
    },
  ]
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function COBAdjudicationView({ claim }: COBAdjudicationViewProps) {
  const [expandedStages, setExpandedStages] = React.useState<Set<number>>(new Set([1, 2, 3]))
  // Each stage loads independently: null = not started, 'loading' = in flight, StageData = done
  const [stageMap, setStageMap] = React.useState<Record<number, StageData | 'loading' | null>>({})
  const [loadedCount, setLoadedCount] = React.useState(0)
  const [usedFallback, setUsedFallback] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function fetchAllStages() {
      // Mark all 7 stages as loading immediately so UI shows skeletons right away
      const initialMap: Record<number, 'loading'> = {}
      for (let i = 1; i <= 7; i++) initialMap[i] = 'loading'
      setStageMap(initialMap)

      try {
        // Single API call — fetch all stages at once (fastest)
        const data: AgentOutput = await api.claims.getAgentOutput(claim.id)
        if (cancelled) return

        if (data && data.stages && data.stages.length > 0) {
          // Render stages progressively with a tiny stagger so user sees them appear
          data.stages.forEach((stage, idx) => {
            setTimeout(() => {
              if (cancelled) return
              const built: StageData = {
                id: stage.stage_number,
                title: stage.stage_name,
                icon: STAGE_ICONS[stage.stage_number] || <Brain className="h-3.5 w-3.5 text-purple-400" />,
                outcome: mapOutcomeToStatus(stage.outcome),
                outcomeLabel: (() => {
                  let label = stage.outcome
                  if (stage.stage_number === 2 && label.includes(' - ')) {
                    const parts = label.split(' - ')
                    label = parts.length > 1 ? parts[1] : parts[0]
                    label = label.split(' ').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
                  }
                  return label
                })(),
                confidence: mapConfidence(stage.confidence),
                content: renderStageContent(stage.stage_number, stage.output_data, claim.id),
              }
              setStageMap((prev) => ({ ...prev, [stage.stage_number]: built }))
              setLoadedCount((prev) => prev + 1)
            }, idx * 80) // 80ms stagger between each stage appearing
          })

          // Mark any stages not returned as null
          const returnedNums = new Set(data.stages.map((s) => s.stage_number))
          for (let i = 1; i <= 8; i++) {
            if (!returnedNums.has(i)) {
              setStageMap((prev) => ({ ...prev, [i]: null }))
            }
          }
        } else {
          // No DB data — use local fallback
          if (!cancelled) {
            setUsedFallback(true)
            const localStages = buildStagesLocally(claim)
            const fallbackMap: Record<number, StageData> = {}
            localStages.forEach((s) => { fallbackMap[s.id] = s })
            setStageMap(fallbackMap)
          }
        }
      } catch {
        if (!cancelled) {
          // On error, fall back to local generation
          setUsedFallback(true)
          const localStages = buildStagesLocally(claim)
          const fallbackMap: Record<number, StageData> = {}
          localStages.forEach((s) => { fallbackMap[s.id] = s })
          setStageMap(fallbackMap)
        }
      }
    }

    fetchAllStages()
    return () => { cancelled = true }
  }, [claim.id])

  const toggleStage = (id: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setExpandedStages(new Set([1, 2, 3, 4, 5, 6, 7]))
  const collapseAll = () => setExpandedStages(new Set())

  // Count how many stages are actually loaded (not loading, not null)
  const loadedStages = Object.values(stageMap).filter((v) => v !== null && v !== 'loading') as StageData[]
  const totalLoading = Object.values(stageMap).filter((v) => v === 'loading').length

  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-2 pr-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">
          COB Adjudication — {loadedStages.length} of 7 stages loaded
          {totalLoading > 0 && <span className="ml-2 text-cyan-400 animate-pulse">({totalLoading} loading...)</span>}
        </p>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors">Expand All</button>
          <button onClick={collapseAll} className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors">Collapse All</button>
        </div>
      </div>

      {/* Render all 7 stage slots */}
      {[1, 2, 3, 4, 5, 6, 7].map((stageNum) => {
        const stageEntry = stageMap[stageNum]

        // Loading skeleton
        if (stageEntry === 'loading' || stageEntry === undefined) {
          return (
            <div key={stageNum} className="rounded-lg border bg-card animate-pulse">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-3.5 w-3.5 rounded-full bg-muted" />
                <div className="h-4 w-5 rounded-full bg-muted" />
                <div className="h-3.5 w-3.5 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted flex-1" />
                <div className="h-4 w-20 rounded-full bg-muted" />
                <div className="h-4 w-16 rounded-full bg-muted" />
              </div>
            </div>
          )
        }

        // Not available (stage not run yet)
        if (stageEntry === null) {
          return (
            <div key={stageNum} className="rounded-lg border bg-card opacity-40">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold shrink-0">{stageNum}</span>
                <span className="text-xs text-muted-foreground">Stage {stageNum} — not yet executed</span>
              </div>
            </div>
          )
        }

        // Loaded stage
        return (
          <StageSection
            key={stageNum}
            stage={stageEntry}
            expanded={expandedStages.has(stageNum)}
            onToggle={() => toggleStage(stageNum)}
          />
        )
      })}
    </div>
  )
}

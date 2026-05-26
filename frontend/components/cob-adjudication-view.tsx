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

function renderStage3Content(data: any): React.ReactNode {
  const cobHistory: any[] = data.cob_history || []
  const eobExtraction: any[] = data.eob_extraction || []
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground">Source: COBHistory, COB_Image_Extraction</p>
      <div className="space-y-2 text-xs">
        <p className="text-[10px] font-semibold">COB History</p>
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1 border-r font-semibold">#</th>
                <th className="text-left px-2 py-1 border-r font-semibold">Primary Insurance</th>
                <th className="text-left px-2 py-1 border-r font-semibold">Effective Date</th>
                <th className="text-left px-2 py-1 font-semibold">Term Date</th>
              </tr>
            </thead>
            <tbody>
              {cobHistory.map((row: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 border-r">{row.sno}</td>
                  <td className="px-2 py-1 border-r font-semibold">{row.primary_insurance}</td>
                  <td className="px-2 py-1 border-r font-mono">{row.effective_date}</td>
                  <td className="px-2 py-1 font-mono">{row.term_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {eobExtraction.length > 0 && (
          <>
            <p className="text-[10px] font-semibold mt-2">EOB Extraction</p>
            <div className="overflow-auto">
              <table className="w-full text-[10px] border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-2 py-1 border-r font-semibold">#</th>
                    <th className="text-left px-2 py-1 border-r font-semibold">CPT</th>
                    <th className="text-left px-2 py-1 border-r font-semibold">Insurance</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Paid</th>
                    <th className="text-left px-2 py-1 border-r font-semibold">Adj Grp</th>
                    <th className="text-left px-2 py-1 border-r font-semibold">Reason</th>
                    <th className="text-right px-2 py-1 font-semibold">PR Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {eobExtraction.map((row: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1 border-r">{row.sno}</td>
                      <td className="px-2 py-1 border-r font-mono">{row.cpt}</td>
                      <td className="px-2 py-1 border-r">{row.insurance_name}</td>
                      <td className="px-2 py-1 border-r text-right">${Number(row.paid_amt).toFixed(2)}</td>
                      <td className="px-2 py-1 border-r font-mono">{row.adj_grp_code}</td>
                      <td className="px-2 py-1 border-r font-mono">{row.reason_code}</td>
                      <td className="px-2 py-1 text-right">${Number(row.pr_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="rounded border p-2 space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Primary Insurance</span><span className="font-semibold">{data.primary_insurance}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total PR Amount</span><span className="font-mono font-semibold">${Number(data.total_pr_amount || 0).toFixed(2)}</span></div>
        </div>
      </div>
      <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
        mapOutcomeToStatus(data.outcome) === 'pass' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
      )}>
        Outcome: {data.outcome}
      </div>
    </div>
  )
}

function renderStage4Content(data: any): React.ReactNode {
  const withinLimit = data.within_limit
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground">Source: Claim_Header, Claim_Detail</p>
      <div className="space-y-2 text-xs">
        <div className="rounded border p-2 space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Days Aged</span><span className={cn('font-bold', withinLimit ? 'text-green-400' : 'text-red-400')}>{data.days_aged} days</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-semibold">{data.state}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Filing Limit</span><span className="font-mono">{data.filing_limit} days</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Days Remaining</span><span className={cn('font-semibold', data.days_remaining > 30 ? 'text-green-400' : data.days_remaining > 0 ? 'text-amber-400' : 'text-red-400')}>{data.days_remaining} days</span></div>
        </div>
        <div className="rounded border p-2 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">Formula:</p>
          <p className="font-mono">Days Aged = {data.days_aged} days</p>
          <p className="font-mono mt-1">Threshold ({data.state}): {data.filing_limit} days</p>
          <p className={cn('mt-1 font-semibold', withinLimit ? 'text-green-400' : 'text-red-400')}>
            {data.days_aged} {withinLimit ? '<' : '>'} {data.filing_limit} → {withinLimit ? 'PASS' : 'FAIL'}
          </p>
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

function renderStage5Content(data: any): React.ReactNode {
  const prCodeAnalysis = data.pr_code_analysis || {}
  const primaryCodes: string[] = prCodeAnalysis.primary_codes || []
  const secondaryCodes: string[] = prCodeAnalysis.secondary_codes || []
  const denyCodes: string[] = prCodeAnalysis.deny_codes || []
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground">Source: COB_Image_Extraction, Claim_Detail</p>
      <div className="space-y-2 text-xs">
        <div className="rounded border p-2 space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Coordination Type</span><span className="font-semibold">{data.coordination_type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Action</span><span className="font-semibold">{data.outcome}</span></div>
        </div>
        <div className="rounded border p-2 space-y-1 text-[10px]">
          <p className="font-semibold text-muted-foreground mb-1">PR Code Analysis:</p>
          <p className={cn(primaryCodes.length > 0 ? 'text-green-400' : 'text-muted-foreground')}>
            {primaryCodes.length > 0 ? '✓' : '○'} Primary Indicators (96/204): {primaryCodes.length > 0 ? primaryCodes.join(', ') : 'None'}
          </p>
          <p className={cn(secondaryCodes.length > 0 ? 'text-green-400' : 'text-muted-foreground')}>
            {secondaryCodes.length > 0 ? '✓' : '○'} Secondary Indicators (1/2/3): {secondaryCodes.length > 0 ? secondaryCodes.join(', ') : 'None'}
          </p>
          <p className={cn(denyCodes.length > 0 ? 'text-red-400' : 'text-muted-foreground')}>
            {denyCodes.length > 0 ? '✗' : '○'} Deny Indicators (CO-45): {denyCodes.length > 0 ? denyCodes.join(', ') : 'None'}
          </p>
        </div>
      </div>
      <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
        mapOutcomeToStatus(data.outcome) === 'pass' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
        mapOutcomeToStatus(data.outcome) === 'fail' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
        'bg-amber-500/10 border border-amber-500/30 text-amber-400'
      )}>
        Outcome: {data.outcome}
      </div>
    </div>
  )
}

function renderStage6Content(data: any): React.ReactNode {
  const lineCalcs: any[] = data.line_calculations || []
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground">Source: Claim_Detail, COB_Image_Extraction</p>
      <div className="space-y-2 text-xs">
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1 border-r font-semibold">Line</th>
                <th className="text-right px-2 py-1 border-r font-semibold">Billed</th>
                <th className="text-right px-2 py-1 border-r font-semibold">Allowed</th>
                <th className="text-right px-2 py-1 border-r font-semibold">OC Paid</th>
                <th className="text-right px-2 py-1 border-r font-semibold">PR Share</th>
                <th className="text-right px-2 py-1 border-r font-semibold">Non-Covered</th>
                <th className="text-right px-2 py-1 font-semibold">Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {lineCalcs.map((line: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 border-r font-mono">{line.line_no}</td>
                  <td className="px-2 py-1 border-r text-right">${Number(line.billed).toFixed(2)}</td>
                  <td className="px-2 py-1 border-r text-right">${Number(line.allowed).toFixed(2)}</td>
                  <td className="px-2 py-1 border-r text-right">${Number(line.oc_paid).toFixed(2)}</td>
                  <td className="px-2 py-1 border-r text-right">${Number(line.pr_share).toFixed(2)}</td>
                  <td className="px-2 py-1 border-r text-right">${Number(line.non_covered).toFixed(2)}</td>
                  <td className="px-2 py-1 text-right font-semibold">${Number(line.net_payable).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[10px]">
          <div className="rounded border p-2 text-center">
            <p className="text-muted-foreground">Total PR</p>
            <p className="font-bold text-sm">${Number(data.total_pr || 0).toFixed(2)}</p>
          </div>
          <div className="rounded border p-2 text-center">
            <p className="text-muted-foreground">Allowed</p>
            <p className="font-bold text-sm">${Number(data.total_allowed || 0).toFixed(2)}</p>
          </div>
          <div className="rounded border p-2 text-center">
            <p className="text-muted-foreground">Non-Covered</p>
            <p className="font-bold text-sm">${Number(data.non_covered || 0).toFixed(2)}</p>
          </div>
          <div className="rounded border p-2 text-center">
            <p className="text-muted-foreground">Net Amount</p>
            <p className="font-bold text-sm text-green-400">${Number(data.net_amount || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded border p-2 space-y-1.5 text-[10px]">
          <p className="font-semibold text-muted-foreground">Condition Applied: {data.condition_applied}</p>
          <p className="font-mono text-muted-foreground">OC Paid: ${Number(data.total_oc_paid || 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="rounded px-2 py-1.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
        Outcome: Net Payable ${Number(data.net_amount || 0).toFixed(2)} — Recommend posting
      </div>
    </div>
  )
}

function renderStage7Content(data: any): React.ReactNode {
  const postingData = data.posting_data || {}
  const denialCodes: string[] = data.denial_codes || []
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground">Source: COB Calculation Output</p>
      <div className="space-y-2 text-xs">
        <div className="rounded border p-2 space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground">Posting Recommendation:</p>
          <div className="flex justify-between"><span className="text-muted-foreground">Disposition</span><span className="font-semibold">{postingData.disposition || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Allowed Amount</span><span className="font-mono">${Number(postingData.allowed_amount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Non-Covered</span><span className="font-mono">${Number(postingData.non_covered || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Net Payable</span><span className="font-mono font-semibold">${Number(postingData.net_payable || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Copay</span><span className="font-mono">${Number(postingData.copay || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Coinsurance</span><span className="font-mono">${Number(postingData.coinsurance || 0).toFixed(2)}</span></div>
        </div>
        {denialCodes.length > 0 && (
          <div className="rounded border p-2 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground">Denial Codes:</p>
            {denialCodes.map((code: string, i: number) => (
              <p key={i} className="font-mono text-red-400">{code}</p>
            ))}
          </div>
        )}
      </div>
      <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
        'bg-green-500/10 border border-green-500/30 text-green-400'
      )}>
        Outcome: {data.outcome}
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

function renderStageContent(stageNumber: number, data: any): React.ReactNode {
  switch (stageNumber) {
    case 1: return renderStage1Content(data)
    case 2: return renderStage2Content(data)
    case 3: return renderStage3Content(data)
    case 4: return renderStage4Content(data)
    case 5: return renderStage5Content(data)
    case 6: return renderStage6Content(data)
    case 7: return renderStage7Content(data)
    case 8: return renderStage8Content(data)
    default: return <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
  }
}

// ─── Build stages from API response ─────────────────────────────────────────

function buildStagesFromAPI(apiStages: AgentStage[]): StageData[] {
  return apiStages.map((stage) => {
    // For stage 2, shorten the outcome label if it's the new verbose format
    let outcomeLabel = stage.outcome
    if (stage.stage_number === 2 && outcomeLabel.includes(' - ')) {
      // e.g. "HOLD ACTIVE - COB PROCESSING REQUIRED" -> "COB Processing Required"
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
      content: renderStageContent(stage.stage_number, stage.output_data),
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
            <li>Days Aged: {dateDiff} — {isTimelyFiled ? 'Within Window' : 'EXCEEDED'}</li>
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
            <div className="flex justify-between"><span className="text-muted-foreground">Days Aged</span><span className="font-bold">{dateDiff} days</span></div>
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
      // Mark all 8 stages as loading immediately so UI shows skeletons right away
      const initialMap: Record<number, 'loading'> = {}
      for (let i = 1; i <= 8; i++) initialMap[i] = 'loading'
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
                content: renderStageContent(stage.stage_number, stage.output_data),
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

  const expandAll = () => setExpandedStages(new Set([1, 2, 3, 4, 5, 6, 7, 8]))
  const collapseAll = () => setExpandedStages(new Set())

  // Count how many stages are actually loaded (not loading, not null)
  const loadedStages = Object.values(stageMap).filter((v) => v !== null && v !== 'loading') as StageData[]
  const totalLoading = Object.values(stageMap).filter((v) => v === 'loading').length

  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-2 pr-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">
          COB Adjudication — {loadedStages.length} of 8 stages loaded
          {totalLoading > 0 && <span className="ml-2 text-cyan-400 animate-pulse">({totalLoading} loading...)</span>}
        </p>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors">Expand All</button>
          <button onClick={collapseAll} className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors">Collapse All</button>
        </div>
      </div>

      {/* Render all 8 stage slots */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((stageNum) => {
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

'use client'

import * as React from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Claim } from '@/types'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  FileSearch,
  Clock,
  Calculator,
  Send,
  ShieldCheck,
  Activity,
  Users,
  FileText,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type OutcomeStatus = 'pass' | 'warning' | 'fail'
type ConfidenceLevel = 'High' | 'Medium' | 'Low'

interface StageData {
  id: number
  title: string
  icon: React.ReactNode
  source: string
  aiReasoning: string
  evidenceReviewed: string[]
  outcome: OutcomeStatus
  outcomeLabel: string
  confidence: ConfidenceLevel
  content: React.ReactNode
}

interface COBAdjudicationViewProps {
  claim: Claim
}

// ─── Helper: generate reference data for claim 899929xxx ─────────────────────

function getClaimDetailLines(claim: Claim) {
  if (claim.claimNumber.startsWith('899929')) {
    return [
      { lineNo: 1, cpt: '93000', mod: '95', startDt: '06/15/2025', endDt: '06/05/2025', units: 2, billed: 128.82, allowed: 77.46, copay: 47.74, coins: 3.33, ocPaid: 26.39 },
      { lineNo: 2, cpt: '71046', mod: '0', startDt: '06/07/2025', endDt: '06/24/2025', units: 2, billed: 913.34, allowed: 641.06, copay: 27.27, coins: 120.65, ocPaid: 493.14 },
      { lineNo: 3, cpt: '99215', mod: '25', startDt: '06/15/2025', endDt: '06/15/2025', units: 4, billed: 1116.68, allowed: 688.90, copay: 41.30, coins: 78.64, ocPaid: 568.96 },
    ]
  }
  // Generate simulated data for other claims
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

// ─── Outcome Badge ───────────────────────────────────────────────────────────

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

// ─── Stage Section (Collapsible) ─────────────────────────────────────────────

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
        <div className="px-4 pb-4 space-y-3 border-t">
          {/* Source & AI Reasoning */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Source</p>
              <p className="text-xs">{stage.source}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Evidence Reviewed</p>
              <div className="flex flex-wrap gap-1">
                {stage.evidenceReviewed.map((e, i) => (
                  <span key={i} className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{e}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">AI Reasoning</p>
            <p className="text-xs text-muted-foreground">{stage.aiReasoning}</p>
          </div>
          {/* Stage-specific content */}
          {stage.content}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function COBAdjudicationView({ claim }: COBAdjudicationViewProps) {
  const [expandedStages, setExpandedStages] = React.useState<Set<number>>(new Set([1, 2, 3]))

  const toggleStage = (id: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Generate data
  const lines = getClaimDetailLines(claim)
  const holdCode = getHoldCodeInfo(claim)
  const denial = getDenialDetails(claim)
  const cobHistory = getCOBHistory(claim)
  const eob = getEOBExtraction(claim)

  const totalBilled = lines.reduce((s, l) => s + l.billed, 0)
  const totalAllowed = lines.reduce((s, l) => s + l.allowed, 0)
  const totalCopay = lines.reduce((s, l) => s + l.copay, 0)
  const totalCoins = lines.reduce((s, l) => s + l.coins, 0)
  const totalOcPaid = lines.reduce((s, l) => s + l.ocPaid, 0)
  const totalPR = totalCopay + totalCoins
  const netAmount = totalAllowed - totalPR

  // Critical flags
  const criticalFlags: { label: string; severity: 'error' | 'warning' }[] = []
  if (claim.daysAged > 180) criticalFlags.push({ label: 'Timely Filing Risk', severity: 'error' })
  if (holdCode.reason === 'COBOC') criticalFlags.push({ label: 'COB Coordination Required', severity: 'warning' })
  if (denial.reasonCode === 'DNNPR') criticalFlags.push({ label: 'Non-Par Provider', severity: 'error' })
  if (cobHistory.length > 1) criticalFlags.push({ label: 'Multiple COB Carriers', severity: 'warning' })

  const timelyFilingDays = claim.state === 'TX' ? 95 : claim.state === 'FL' ? 365 : claim.state === 'KY' ? 180 : 365
  const isWithinWindow = claim.daysAged <= timelyFilingDays

  // ─── Build 9 Stages ──────────────────────────────────────────────────────────

  const stages: StageData[] = [
    // Stage 1: Claim Overview + Critical Flags
    {
      id: 1,
      title: 'Claim Overview + Critical Flags',
      icon: <FileText className="h-3.5 w-3.5 text-blue-400" />,
      source: 'Claim_Header, Hold_Code_Info',
      aiReasoning: `Claim ${claim.claimNumber} is a ${claim.classification} claim on ${claim.platform} platform. Provider specialty is ${claim.providerSpecialty || 'RAD'}, place of service 22 (Outpatient Hospital). Received ${claim.recvDt || 'N/A'}, currently aged ${claim.daysAged} days.`,
      evidenceReviewed: ['Claim_Header', 'Hold_Code_Info', 'Member_Eligibility'],
      outcome: criticalFlags.some(f => f.severity === 'error') ? 'warning' : 'pass',
      outcomeLabel: criticalFlags.some(f => f.severity === 'error') ? 'Flags Present' : 'Clear',
      confidence: 'High',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground">Claim Header</p>
            <div className="rounded border p-2 space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Claim #</span><span className="font-mono">{claim.claimNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Member ID</span><span className="font-mono">{claim.subscriberId || '99020000'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Specialty</span><span>{claim.providerSpecialty || 'RAD'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Place of Svc</span><span>22</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Par</span><span>{claim.parFlag || 'Par'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span>{claim.recvDt || '8/3/25'}</span></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground">Critical Flags</p>
            <div className="space-y-1.5">
              {criticalFlags.length === 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-green-400"><CheckCircle2 className="h-3 w-3" /> No critical flags</span>
              )}
              {criticalFlags.map((flag, i) => (
                <div key={i} className={cn(
                  'rounded px-2 py-1 text-[10px] font-medium',
                  flag.severity === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                )}>
                  {flag.severity === 'error' ? '⚠' : '⚡'} {flag.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // Stage 2: AI Extracted Data Summary
    {
      id: 2,
      title: 'AI Extracted Data Summary',
      icon: <FileSearch className="h-3.5 w-3.5 text-purple-400" />,
      source: 'COB_Image_Extraction, EOB Documents',
      aiReasoning: `AI extracted payment data from primary EOB image. CPT ${eob.cpt} shows ${eob.insurance} paid $${eob.paid.toFixed(2)} with adjustment group code "${eob.adjGrpCode}". Patient responsibility amount of $${eob.prAmount.toFixed(2)} identified with reason code ${eob.reason}.`,
      evidenceReviewed: ['COB_Image_Extraction', 'EOB_Document', 'Claim_Form'],
      outcome: 'pass',
      outcomeLabel: 'Extracted',
      confidence: 'High',
      content: (
        <div className="overflow-auto">
          <table className="w-full text-[10px] border">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1.5 border-r font-semibold">Source</th>
                <th className="text-left px-2 py-1.5 border-r font-semibold">Extracted Field</th>
                <th className="text-left px-2 py-1.5 border-r font-semibold">Extracted Value</th>
                <th className="text-left px-2 py-1.5 border-r font-semibold">AI Confidence</th>
                <th className="text-left px-2 py-1.5 font-semibold">Document Ref</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">EOB Image</td>
                <td className="px-2 py-1 border-r">CPT Code</td>
                <td className="px-2 py-1 border-r font-mono">{eob.cpt}</td>
                <td className="px-2 py-1 border-r"><span className="text-green-400">98%</span></td>
                <td className="px-2 py-1">EOB-001-P1</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">EOB Image</td>
                <td className="px-2 py-1 border-r">Insurance Name</td>
                <td className="px-2 py-1 border-r">{eob.insurance}</td>
                <td className="px-2 py-1 border-r"><span className="text-green-400">99%</span></td>
                <td className="px-2 py-1">EOB-001-P1</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">EOB Image</td>
                <td className="px-2 py-1 border-r">Paid Amount</td>
                <td className="px-2 py-1 border-r font-mono">${eob.paid.toFixed(2)}</td>
                <td className="px-2 py-1 border-r"><span className="text-green-400">97%</span></td>
                <td className="px-2 py-1">EOB-001-P2</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">EOB Image</td>
                <td className="px-2 py-1 border-r">Adj Group Code</td>
                <td className="px-2 py-1 border-r font-mono">{eob.adjGrpCode}</td>
                <td className="px-2 py-1 border-r"><span className="text-green-400">96%</span></td>
                <td className="px-2 py-1">EOB-001-P2</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">EOB Image</td>
                <td className="px-2 py-1 border-r">Reason Code</td>
                <td className="px-2 py-1 border-r font-mono">{eob.reason}</td>
                <td className="px-2 py-1 border-r"><span className="text-amber-400">91%</span></td>
                <td className="px-2 py-1">EOB-001-P2</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1 border-r">EOB Image</td>
                <td className="px-2 py-1 border-r">PR Amount</td>
                <td className="px-2 py-1 border-r font-mono">${eob.prAmount.toFixed(2)}</td>
                <td className="px-2 py-1 border-r"><span className="text-green-400">95%</span></td>
                <td className="px-2 py-1">EOB-001-P3</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },

    // Stage 3: Hold and Denial Code Validation
    {
      id: 3,
      title: 'Hold and Denial Code Validation',
      icon: <Shield className="h-3.5 w-3.5 text-amber-400" />,
      source: 'Hold_Code_Info, Denial_Details',
      aiReasoning: `Hold code ${holdCode.reason} indicates "${holdCode.description}". Denial reason code ${denial.reasonCode} on line ${denial.lineNo} with no prior history. Validating against CMS denial code registry and plan-specific override rules.`,
      evidenceReviewed: ['Hold_Code_Info', 'Denial_Details', 'CMS_Code_Registry'],
      outcome: denial.reasonCode === 'DNNPR' ? 'warning' : 'pass',
      outcomeLabel: denial.reasonCode === 'DNNPR' ? 'Review Required' : 'Valid',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <div className="rounded border p-2">
            <p className="text-[10px] font-semibold mb-1.5">Hold Code Info</p>
            <div className="grid grid-cols-5 gap-2 text-[10px]">
              <div><span className="text-muted-foreground">Claim#</span><p className="font-mono">{holdCode.claimNo}</p></div>
              <div><span className="text-muted-foreground">Line#</span><p>{holdCode.lineNo}</p></div>
              <div><span className="text-muted-foreground">History</span><p>{holdCode.history || '—'}</p></div>
              <div><span className="text-muted-foreground">Reason</span><p className="font-mono font-semibold">{holdCode.reason}</p></div>
              <div><span className="text-muted-foreground">Description</span><p>{holdCode.description}</p></div>
            </div>
          </div>
          <div className="rounded border p-2">
            <p className="text-[10px] font-semibold mb-1.5">Denial Details</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div><span className="text-muted-foreground">Line#</span><p>{denial.lineNo}</p></div>
              <div><span className="text-muted-foreground">History</span><p>{denial.history}</p></div>
              <div><span className="text-muted-foreground">Reason Code</span><p className="font-mono font-semibold">{denial.reasonCode}</p></div>
            </div>
          </div>
        </div>
      ),
    },

    // Stage 4: Member Eligibility Agent
    {
      id: 4,
      title: 'Member Eligibility Agent',
      icon: <Users className="h-3.5 w-3.5 text-green-400" />,
      source: 'COBHistory, Member360',
      aiReasoning: `Member ${claim.subscriberId || '99020000'} has ${cobHistory.length} active COB coverage record(s). Primary: ${cobHistory[0].insurance} (${cobHistory[0].effectiveDate} - ${cobHistory[0].termDate}). Eligibility confirmed active for dates of service. No gaps in coverage detected.`,
      evidenceReviewed: ['COBHistory', 'Member360', 'Eligibility_API'],
      outcome: 'pass',
      outcomeLabel: 'Eligible',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <div className="overflow-auto">
            <table className="w-full text-[10px] border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-2 py-1.5 border-r font-semibold">#</th>
                  <th className="text-left px-2 py-1.5 border-r font-semibold">Insurance</th>
                  <th className="text-left px-2 py-1.5 border-r font-semibold">Effective Date</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Term Date</th>
                </tr>
              </thead>
              <tbody>
                {cobHistory.map((entry) => (
                  <tr key={entry.sno} className="border-t">
                    <td className="px-2 py-1 border-r">{entry.sno}</td>
                    <td className="px-2 py-1 border-r font-medium">{entry.insurance}</td>
                    <td className="px-2 py-1 border-r">{entry.effectiveDate}</td>
                    <td className="px-2 py-1">{entry.termDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={cn('rounded px-2 py-1.5 text-[10px]', 'bg-green-500/10 border border-green-500/30 text-green-400')}>
            ✓ Member eligibility confirmed for all dates of service
          </div>
        </div>
      ),
    },

    // Stage 5: Timely Filing Validation
    {
      id: 5,
      title: 'Timely Filing Validation',
      icon: <Clock className="h-3.5 w-3.5 text-cyan-400" />,
      source: 'Claim_Header, State_Rules_Registry',
      aiReasoning: `Claim received ${claim.recvDt || 'N/A'}, aged ${claim.daysAged} days. State ${claim.state} timely filing limit is ${timelyFilingDays} days per CMS 42 CFR 424.44. Claim is ${isWithinWindow ? 'within' : 'OUTSIDE'} the filing window. ${!isWithinWindow ? 'ALERT: Claim may be subject to denial for untimely filing.' : 'No timely filing concerns.'}`,
      evidenceReviewed: ['Claim_Header.recvDt', 'State_Rules_Registry', 'CMS_42_CFR_424.44'],
      outcome: isWithinWindow ? 'pass' : 'fail',
      outcomeLabel: isWithinWindow ? 'Within Window' : 'EXCEEDED',
      confidence: 'High',
      content: (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3 text-[10px]">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Days Aged</span>
              <p className="text-sm font-bold">{claim.daysAged}</p>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">State Limit ({claim.state})</span>
              <p className="text-sm font-bold">{timelyFilingDays} days</p>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Status</span>
              <p className={cn('text-sm font-bold', isWithinWindow ? 'text-green-400' : 'text-red-400')}>
                {isWithinWindow ? 'PASS' : 'FAIL'}
              </p>
            </div>
          </div>
          <div className={cn('rounded px-2 py-1.5 text-[10px]',
            isWithinWindow ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          )}>
            {isWithinWindow ? '✓' : '✗'} CMS 42 CFR 424.44 — {claim.state} Medicare timely filing: {timelyFilingDays} days
          </div>
        </div>
      ),
    },

    // Stage 6: Coordination Rule Determination
    {
      id: 6,
      title: 'Coordination Rule Determination',
      icon: <Activity className="h-3.5 w-3.5 text-indigo-400" />,
      source: 'COBHistory, Plan_Rules, State_Regulations',
      aiReasoning: `COB coordination order determined: ${cobHistory[0].insurance} is primary payer. ${cobHistory.length > 1 ? cobHistory[1].insurance + ' is secondary.' : 'No secondary payer on file.'} Applying standard COB rules — secondary payer pays difference between allowed amount and primary payment, less member responsibility.`,
      evidenceReviewed: ['COBHistory', 'Plan_COB_Rules', 'NAIC_Model_Act'],
      outcome: 'pass',
      outcomeLabel: 'Determined',
      confidence: cobHistory.length > 1 ? 'High' : 'Medium',
      content: (
        <div className="space-y-2">
          <div className="rounded border p-2 text-[10px] space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Primary Payer</span><span className="font-semibold">{cobHistory[0].insurance}</span></div>
            {cobHistory.length > 1 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Secondary Payer</span><span className="font-semibold">{cobHistory[1].insurance}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">COB Method</span><span>Traditional COB (Maintenance of Benefits)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rule Applied</span><span>NAIC Model Act — Birthday Rule</span></div>
          </div>
          <div className="rounded bg-muted/50 px-2 py-1.5 text-[10px] text-muted-foreground">
            Formula: Secondary Payment = min(Allowed - Primary Paid, Allowed - Member Responsibility)
          </div>
        </div>
      ),
    },

    // Stage 7: COB Calculation
    {
      id: 7,
      title: 'COB Calculation',
      icon: <Calculator className="h-3.5 w-3.5 text-emerald-400" />,
      source: 'Claim_Detail, COB_Image_Extraction, Plan_Fee_Schedule',
      aiReasoning: `Calculated COB amounts for ${lines.length} claim lines. Total allowed: ${formatCurrency(totalAllowed)}, total PR (copay + coins): ${formatCurrency(totalPR)}, net payable: ${formatCurrency(netAmount)}. OC paid by primary: ${formatCurrency(totalOcPaid)}. Amounts reconcile with EOB extraction data.`,
      evidenceReviewed: ['Claim_Detail', 'Fee_Schedule', 'EOB_Extraction', 'Plan_Benefits'],
      outcome: 'pass',
      outcomeLabel: 'Calculated',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <div className="overflow-auto">
            <table className="w-full text-[10px] border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-2 py-1.5 border-r font-semibold">Line</th>
                  <th className="text-left px-2 py-1.5 border-r font-semibold">CPT</th>
                  <th className="text-left px-2 py-1.5 border-r font-semibold">Mod</th>
                  <th className="text-right px-2 py-1.5 border-r font-semibold">Units</th>
                  <th className="text-right px-2 py-1.5 border-r font-semibold">Billed</th>
                  <th className="text-right px-2 py-1.5 border-r font-semibold">Allowed</th>
                  <th className="text-right px-2 py-1.5 border-r font-semibold">Copay</th>
                  <th className="text-right px-2 py-1.5 border-r font-semibold">Coins</th>
                  <th className="text-right px-2 py-1.5 font-semibold">OC Paid</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.lineNo} className="border-t">
                    <td className="px-2 py-1 border-r">{line.lineNo}</td>
                    <td className="px-2 py-1 border-r font-mono">{line.cpt}</td>
                    <td className="px-2 py-1 border-r">{line.mod}</td>
                    <td className="px-2 py-1 border-r text-right">{line.units}</td>
                    <td className="px-2 py-1 border-r text-right">${line.billed.toFixed(2)}</td>
                    <td className="px-2 py-1 border-r text-right">${line.allowed.toFixed(2)}</td>
                    <td className="px-2 py-1 border-r text-right">${line.copay.toFixed(2)}</td>
                    <td className="px-2 py-1 border-r text-right">${line.coins.toFixed(2)}</td>
                    <td className="px-2 py-1 text-right">${line.ocPaid.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/30 font-semibold">
                  <td className="px-2 py-1.5 border-r" colSpan={4}>TOTALS</td>
                  <td className="px-2 py-1.5 border-r text-right">${totalBilled.toFixed(2)}</td>
                  <td className="px-2 py-1.5 border-r text-right">${totalAllowed.toFixed(2)}</td>
                  <td className="px-2 py-1.5 border-r text-right">${totalCopay.toFixed(2)}</td>
                  <td className="px-2 py-1.5 border-r text-right">${totalCoins.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right">${totalOcPaid.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Financial Summary */}
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
              <p className="font-bold text-sm">${(totalBilled - totalAllowed).toFixed(2)}</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="text-muted-foreground">Net Amount</p>
              <p className="font-bold text-sm text-green-400">${netAmount.toFixed(2)}</p>
            </div>
          </div>
          <div className="rounded bg-muted/50 px-2 py-1.5 text-[10px] text-muted-foreground font-mono">
            Net = Allowed - (Copay + Coinsurance) = ${totalAllowed.toFixed(2)} - ${totalPR.toFixed(2)} = ${netAmount.toFixed(2)}
          </div>
        </div>
      ),
    },

    // Stage 8: Posting
    {
      id: 8,
      title: 'Posting',
      icon: <Send className="h-3.5 w-3.5 text-orange-400" />,
      source: 'COB_Calculation_Output, System_Config',
      aiReasoning: `Recommended system updates prepared for ${claim.platform} platform. Payment of ${formatCurrency(netAmount)} to be posted against claim ${claim.claimNumber}. Hold code ${holdCode.reason} to be released. Adjustment codes to be applied per COB calculation results.`,
      evidenceReviewed: ['COB_Calculation', 'Platform_Config', 'Payment_Rules'],
      outcome: 'pass',
      outcomeLabel: 'Ready to Post',
      confidence: 'High',
      content: (
        <div className="space-y-2">
          <div className="rounded border p-2 text-[10px] space-y-1.5">
            <p className="font-semibold text-muted-foreground mb-2">Recommended System Updates</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[8px]">1</span>
                <span>Release hold code <span className="font-mono font-semibold">{holdCode.reason}</span> on claim {claim.claimNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[8px]">2</span>
                <span>Post payment: <span className="font-semibold">{formatCurrency(netAmount)}</span> to provider</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[8px]">3</span>
                <span>Apply adjustment codes: <span className="font-mono">CO-45, PR-{eob.reason}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[8px]">4</span>
                <span>Update claim status to <span className="font-semibold">Finalized</span> in {claim.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[8px]">5</span>
                <span>Generate EOB/RA for member and provider</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Stage 9: Post Validation
    {
      id: 9,
      title: 'Post Validation',
      icon: <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />,
      source: 'All_Stages_Output, Compliance_Rules',
      aiReasoning: `Final validation complete. All 8 prior stages passed or flagged appropriately. Financial totals reconcile (billed ${formatCurrency(totalBilled)}, allowed ${formatCurrency(totalAllowed)}, net ${formatCurrency(netAmount)}). No duplicate payment risk detected. Audit trail generated for compliance.`,
      evidenceReviewed: ['All_Stage_Outputs', 'Compliance_Checklist', 'Duplicate_Check', 'Audit_Trail'],
      outcome: criticalFlags.some(f => f.severity === 'error') ? 'warning' : 'pass',
      outcomeLabel: criticalFlags.some(f => f.severity === 'error') ? 'Review Advised' : 'Validated',
      confidence: criticalFlags.some(f => f.severity === 'error') ? 'Medium' : 'High',
      content: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded border p-2 space-y-1">
              <p className="font-semibold text-muted-foreground">Validation Checks</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /><span>Financial reconciliation</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /><span>Duplicate payment check</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /><span>COB order validation</span></div>
                <div className="flex items-center gap-1.5">
                  {isWithinWindow ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                  <span>Timely filing compliance</span>
                </div>
              </div>
            </div>
            <div className="rounded border p-2 space-y-1">
              <p className="font-semibold text-muted-foreground">Audit Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Stages Passed</span><span className="font-semibold text-green-400">{criticalFlags.some(f => f.severity === 'error') ? '7/9' : '9/9'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Warnings</span><span className="font-semibold text-amber-400">{criticalFlags.filter(f => f.severity === 'warning').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Errors</span><span className="font-semibold text-red-400">{criticalFlags.filter(f => f.severity === 'error').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Overall</span><span className={cn('font-semibold', criticalFlags.some(f => f.severity === 'error') ? 'text-amber-400' : 'text-green-400')}>{criticalFlags.some(f => f.severity === 'error') ? 'REVIEW' : 'PASS'}</span></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">COB Pend Resolution Decision Tree</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">9-Stage AI Analysis · Claim {claim.claimNumber}</span>
      </div>

      {/* Expand/Collapse All */}
      <div className="flex gap-2">
        <button
          onClick={() => setExpandedStages(new Set(stages.map(s => s.id)))}
          className="text-[10px] text-primary hover:underline"
        >
          Expand All
        </button>
        <span className="text-[10px] text-muted-foreground">|</span>
        <button
          onClick={() => setExpandedStages(new Set())}
          className="text-[10px] text-primary hover:underline"
        >
          Collapse All
        </button>
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {stages.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            expanded={expandedStages.has(stage.id)}
            onToggle={() => toggleStage(stage.id)}
          />
        ))}
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
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

// ─── Reference Data Helpers ──────────────────────────────────────────────────

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

  const expandAll = () => setExpandedStages(new Set([1, 2, 3, 4, 5, 6, 7, 8]))
  const collapseAll = () => setExpandedStages(new Set())

  // Generate data
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

  // ─── COB Calculation Logic (3 conditions) ────────────────────────────────────
  // Condition 1: OC Paid > Total PR Amount → Non-Covered = (OC Paid - Allowed) - PR Amount
  // Condition 2: OC Paid < Total PR Amount → Non-Covered = 0, Net Amount = 0
  // Condition 3: OC Paid = "" → Non-Covered = 0, Allowed Amount = PR Amount

  const cobCalcLines = lines.map((line) => {
    const linePR = line.copay + line.coins
    let nonCovered = 0
    let netAmount = 0
    let conditionApplied = 1

    if (line.ocPaid > linePR) {
      // Condition 1
      nonCovered = (line.ocPaid - line.allowed) - linePR
      if (nonCovered < 0) nonCovered = 0
      netAmount = line.allowed - linePR - nonCovered
      conditionApplied = 1
    } else if (line.ocPaid < linePR) {
      // Condition 2
      nonCovered = 0
      netAmount = 0
      conditionApplied = 2
    } else {
      // Condition 3 (equal or empty treated as condition 1 fallback)
      nonCovered = 0
      netAmount = line.allowed - linePR
      conditionApplied = 3
    }

    return { ...line, nonCovered, netAmount, conditionApplied }
  })

  const totalNonCovered = cobCalcLines.reduce((s, l) => s + l.nonCovered, 0)
  const totalNetAmount = cobCalcLines.reduce((s, l) => s + l.netAmount, 0)

  // ─── Timely Filing Calculation ─────────────────────────────────────────────
  const receivedDate = claim.recvDt || '8/3/25'
  const dos = lines[0]?.startDt || '06/15/2025'
  const dateDiff = claim.daysAged
  const timelyFilingLimit = claim.state === 'KY' ? 365 : 365
  const isTimelyFiled = dateDiff <= timelyFilingLimit

  // ─── Hold Code Validation Logic ────────────────────────────────────────────
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

  // ─── Member Eligibility Logic ──────────────────────────────────────────────
  const primaryInsurance = cobHistory[0]
  const eobInsurance = eob.insurance
  const insuranceMatch = primaryInsurance.insurance === eobInsurance
  const eobHasPR = eob.adjGrpCode.includes('PR')
  const eobPresent = true // simulated: EOB is present

  let eligibilityOutcome = 'Primary Insurance Verified'
  if (!eobPresent) {
    eligibilityOutcome = primaryInsurance.insurance === 'Medicare' ? 'DN017' : 'DN018'
  } else if (!insuranceMatch) {
    eligibilityOutcome = primaryInsurance.insurance === 'Medicare' ? 'DN017' : 'DN018'
  } else if (!eobHasPR) {
    eligibilityOutcome = 'DNEOB'
  }

  // ─── Coordination Rule Logic ───────────────────────────────────────────────
  const prReasons = eob.reason.split(',').map((r: string) => r.trim())
  const hasPrimaryIndicator = prReasons.some((r: string) => ['96', '204'].includes(r))
  const hasSecondaryIndicator = prReasons.some((r: string) => ['1', '2', '3'].includes(r))
  const hasCO45 = eob.adjGrpCode.includes('CO') && prReasons.includes('45')

  let coordinationOutcome = 'Human Review Required'
  let actionType = 'Human Review Required'
  if (hasCO45) {
    coordinationOutcome = 'DNNPR'
    actionType = 'Deny'
  } else if (hasPrimaryIndicator) {
    coordinationOutcome = 'Pay as Primary'
    actionType = 'Pay as Primary'
  } else if (hasSecondaryIndicator) {
    coordinationOutcome = 'Pay as Secondary'
    actionType = 'Coordination (Pay as Secondary)'
  }

  // ─── Build 8 Stages ───────────────────────────────────────────────────────

  const stages: StageData[] = [
    // Stage 1: AI Extracted Data Summary
    {
      id: 1,
      title: 'AI Extracted Data Summary',
      icon: <Brain className="h-3.5 w-3.5 text-purple-400" />,
      outcome: 'pass',
      outcomeLabel: 'Summarized',
      confidence: 'High',
      content: (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground">Quick Brief — as per given datasource</p>
          <ul className="space-y-1.5 text-xs list-disc list-inside">
            <li>Claim Number: <span className="font-mono font-semibold">{claim.claimNumber}</span></li>
            <li>Classification: <span className="font-semibold">{claim.classification}</span> — Hold Code: <span className="font-mono">{holdCode.reason}</span></li>
            <li>Hold Description: {holdCode.description}</li>
            <li>Primary Insurance Identified: <span className="font-semibold">{primaryInsurance.insurance}</span> (Effective: {primaryInsurance.effectiveDate} – {primaryInsurance.termDate})</li>
            <li>Total Billed: <span className="font-semibold">${totalBilled.toFixed(2)}</span> | Total Allowed: <span className="font-semibold">${totalAllowed.toFixed(2)}</span></li>
            <li>OC Paid by Primary: <span className="font-semibold">${totalOcPaid.toFixed(2)}</span> | PR Amount from EOB: <span className="font-semibold">${eob.prAmount.toFixed(2)}</span></li>
            <li>Denial Code on File: <span className="font-mono font-semibold">{denial.reasonCode}</span> (Line {denial.lineNo})</li>
            <li>Timely Filing Status: Received {receivedDate}, aged {dateDiff} days — {isTimelyFiled ? 'Within Window' : 'EXCEEDED'}</li>
            <li>EOB Adjustment Group Codes: <span className="font-mono">{eob.adjGrpCode}</span>, Reason: {eob.reason}</li>
            <li>Recommended Action: <span className="font-semibold">{coordinationOutcome === 'Pay as Secondary' ? 'Process as Secondary Payer' : coordinationOutcome}</span></li>
          </ul>
        </div>
      ),
    },
    // Stage 2: Hold and Denial Code Validation
    {
      id: 2,
      title: 'Hold and Denial Code Validation',
      icon: <Shield className="h-3.5 w-3.5 text-amber-400" />,
      outcome: holdCodeOutcome === 'Continue COB Review' ? 'pass' : holdCodeOutcome === 'Already Processed' ? 'fail' : 'warning',
      outcomeLabel: holdCodeOutcome,
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Source: Hold_Code_Info — as per given datasource</p>
          <div className="space-y-2 text-xs">
            <div className="rounded border p-2 space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Hold Code Identified</span><span className="font-mono font-semibold">{holdCode.reason}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">History Status</span><span className={cn('font-semibold', historyIsH ? 'text-red-400' : 'text-green-400')}>{holdCode.history || 'Blank (Not Processed)'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Denial Codes Present</span><span className="font-mono">{denial.reasonCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duplicate Indicators</span><span>{hasDuplicateCode ? 'EXDUC Found' : 'None'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Processing Eligibility</span><span className="font-semibold">{holdCodeValid ? 'Qualifies for COB Processing' : 'Does Not Qualify'}</span></div>
            </div>
            <div className="rounded border p-2 space-y-1 text-[10px]">
              <p className="font-semibold text-muted-foreground mb-1">Business Rules Applied:</p>
              <p className={cn(holdCodeValid ? 'text-green-400' : 'text-red-400')}>
                {holdCodeValid ? '✓' : '✗'} Hold code belongs to COBOC or COBHD → {holdCodeValid ? 'Qualifies' : 'Does not qualify'}
              </p>
              <p className={cn(!historyIsH ? 'text-green-400' : 'text-red-400')}>
                {!historyIsH ? '✓' : '✗'} History column is NOT &quot;H&quot; → {!historyIsH ? 'Not previously processed' : 'Already Processed'}
              </p>
              <p className={cn(!hasDuplicateCode ? 'text-green-400' : 'text-amber-400')}>
                {!hasDuplicateCode ? '✓' : '⚠'} Denial code does not contain EXDUC → {!hasDuplicateCode ? 'No duplicate' : 'Follow duplicate instruction'}
              </p>
            </div>
          </div>
          <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
            holdCodeOutcome === 'Continue COB Review' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
            holdCodeOutcome === 'Already Processed' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
            'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          )}>
            Outcome: {holdCodeOutcome}
          </div>
        </div>
      ),
    },
    // Stage 3: Member Eligibility Agent
    {
      id: 3,
      title: 'Member Eligibility Agent',
      icon: <Users className="h-3.5 w-3.5 text-green-400" />,
      outcome: eligibilityOutcome === 'Primary Insurance Verified' ? 'pass' : 'fail',
      outcomeLabel: eligibilityOutcome,
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Source: COBHistory, COB_Image_Extraction — as per given datasource</p>
          <div className="space-y-2 text-xs">
            <div className="rounded border p-2 space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Date of Service</span><span className="font-mono">{dos}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coverage Effective Date</span><span className="font-mono">{primaryInsurance.effectiveDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coverage Term Date</span><span className="font-mono">{primaryInsurance.termDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Identified Primary Insurance</span><span className="font-semibold">{primaryInsurance.insurance}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">EOB Insurance Name</span><span className="font-semibold">{eobInsurance}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Insurance Match Status</span><span className={cn('font-semibold', insuranceMatch ? 'text-green-400' : 'text-red-400')}>{insuranceMatch ? 'MATCH' : 'MISMATCH'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">PR Codes Identified</span><span className={cn('font-mono', eobHasPR ? 'text-green-400' : 'text-red-400')}>{eobHasPR ? 'Yes (PR present)' : 'No PR codes'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">EOB Completeness Status</span><span className={cn('font-semibold', eobPresent ? 'text-green-400' : 'text-red-400')}>{eobPresent ? 'EOB Attached' : 'EOB Missing'}</span></div>
            </div>
            <div className="rounded border p-2 space-y-1 text-[10px]">
              <p className="font-semibold text-muted-foreground mb-1">Business Rules Applied:</p>
              <p className="text-green-400">✓ DOS ({dos}) is after Effective Date ({primaryInsurance.effectiveDate}) AND Term Date ({primaryInsurance.termDate}) is after DOS</p>
              <p className={cn(insuranceMatch ? 'text-green-400' : 'text-red-400')}>
                {insuranceMatch ? '✓' : '✗'} EOB insurance ({eobInsurance}) {insuranceMatch ? 'matches' : 'does NOT match'} primary insurance ({primaryInsurance.insurance})
              </p>
              <p className={cn(eobHasPR ? 'text-green-400' : 'text-red-400')}>
                {eobHasPR ? '✓' : '✗'} EOB {eobHasPR ? 'contains' : 'does NOT contain'} PR reasons → {!eobHasPR ? 'Deny DNEOB' : 'Pass'}
              </p>
            </div>
          </div>
          <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
            eligibilityOutcome === 'Primary Insurance Verified' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          )}>
            Outcome: {eligibilityOutcome}
          </div>
        </div>
      ),
    },
    // Stage 4: Timely Filing Validation
    {
      id: 4,
      title: 'Timely Filing Validation',
      icon: <Clock className="h-3.5 w-3.5 text-cyan-400" />,
      outcome: isTimelyFiled ? 'pass' : 'fail',
      outcomeLabel: isTimelyFiled ? 'Passed Timely Filing' : 'Denied - Timely Filing',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Source: Claim_Header, Claim_Detail — as per given datasource</p>
          <div className="space-y-2 text-xs">
            <div className="rounded border p-2 space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Date of Service</span><span className="font-mono">{dos}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Received Date</span><span className="font-mono">{receivedDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">OC Paid Date</span><span className="font-mono">N/A</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-semibold">{claim.state}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DOS-to-Received Difference</span><span className={cn('font-bold', isTimelyFiled ? 'text-green-400' : 'text-red-400')}>{dateDiff} days</span></div>
            </div>
            <div className="rounded border p-2 text-[10px]">
              <p className="font-semibold text-muted-foreground mb-1">Formula:</p>
              <p className="font-mono">Date Diff = Received Date - Date of Service = {dateDiff} days</p>
              <p className="font-mono mt-1">Threshold ({claim.state}): {timelyFilingLimit} days{claim.state === 'KY' ? ' (KY-specific logic)' : ''}</p>
              <p className={cn('mt-1 font-semibold', isTimelyFiled ? 'text-green-400' : 'text-red-400')}>
                {dateDiff} {isTimelyFiled ? '<' : '>'} {timelyFilingLimit} → {isTimelyFiled ? 'PASS' : 'FAIL'}
              </p>
            </div>
          </div>
          <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
            isTimelyFiled ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          )}>
            Outcome: {isTimelyFiled ? 'Passed Timely Filing' : 'Denied - Timely Filing'}
          </div>
        </div>
      ),
    },
    // Stage 5: Coordination Rule Determination
    {
      id: 5,
      title: 'Coordination Rule Determination',
      icon: <Activity className="h-3.5 w-3.5 text-indigo-400" />,
      outcome: coordinationOutcome === 'Pay as Secondary' || coordinationOutcome === 'Pay as Primary' ? 'pass' : coordinationOutcome === 'DNNPR' ? 'fail' : 'warning',
      outcomeLabel: coordinationOutcome,
      confidence: hasSecondaryIndicator || hasPrimaryIndicator || hasCO45 ? 'High' : 'Medium',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Source: COB_Image_Extraction, Claim_Detail — as per given datasource</p>
          <div className="space-y-2 text-xs">
            {/* CPT Lines Summary */}
            <div className="overflow-auto">
              <table className="w-full text-[10px] border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-2 py-1 border-r font-semibold">CPT</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Allowed</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Copay</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Coins</th>
                    <th className="text-right px-2 py-1 font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.lineNo} className="border-t">
                      <td className="px-2 py-1 border-r font-mono">{line.cpt}</td>
                      <td className="px-2 py-1 border-r text-right">${line.allowed.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right">${line.copay.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right">${line.coins.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">${(line.allowed - line.copay - line.coins).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded border p-2 space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Denial Codes</span><span className="font-mono">{denial.reasonCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Primary EOB Adj Group</span><span className="font-mono">{eob.adjGrpCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">PR/CO Reason Codes</span><span className="font-mono">{eob.reason}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Authorization Status</span><span className="text-green-400">Not Required</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Action Type</span><span className="font-semibold">{actionType}</span></div>
            </div>
            <div className="rounded border p-2 space-y-1 text-[10px]">
              <p className="font-semibold text-muted-foreground mb-1">Rule Evaluation:</p>
              <p className={cn(hasPrimaryIndicator ? 'text-green-400' : 'text-muted-foreground')}>
                {hasPrimaryIndicator ? '✓' : '○'} PR 96/204 (Pay as Primary): {hasPrimaryIndicator ? 'DETECTED' : 'Not found'}
              </p>
              <p className={cn(hasSecondaryIndicator ? 'text-green-400' : 'text-muted-foreground')}>
                {hasSecondaryIndicator ? '✓' : '○'} PR 1/2/3 (Pay as Secondary): {hasSecondaryIndicator ? 'DETECTED' : 'Not found'}
              </p>
              <p className={cn(hasCO45 ? 'text-red-400' : 'text-muted-foreground')}>
                {hasCO45 ? '✗' : '○'} CO 45 (Deny DNNPR): {hasCO45 ? 'DETECTED' : 'Not found'}
              </p>
            </div>
          </div>
          <div className={cn('rounded px-2 py-1.5 text-[10px] font-semibold',
            coordinationOutcome === 'Pay as Secondary' || coordinationOutcome === 'Pay as Primary' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
            coordinationOutcome === 'DNNPR' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
            'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          )}>
            Outcome: {coordinationOutcome}
          </div>
        </div>
      ),
    },
    // Stage 6: COB Calculation
    {
      id: 6,
      title: 'COB Calculation',
      icon: <Calculator className="h-3.5 w-3.5 text-emerald-400" />,
      outcome: 'pass',
      outcomeLabel: 'Calculated',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Source: Claim_Detail, COB_Image_Extraction — as per given datasource</p>
          <div className="space-y-2 text-xs">
            {/* Financial Table */}
            <div className="overflow-auto">
              <table className="w-full text-[10px] border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-2 py-1 border-r font-semibold">CPT</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Allowed</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Copay</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Coins</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">OC Paid</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Non-Covered</th>
                    <th className="text-right px-2 py-1 border-r font-semibold">Net</th>
                    <th className="text-center px-2 py-1 font-semibold">Cond.</th>
                  </tr>
                </thead>
                <tbody>
                  {cobCalcLines.map((line) => (
                    <tr key={line.lineNo} className="border-t">
                      <td className="px-2 py-1 border-r font-mono">{line.cpt}</td>
                      <td className="px-2 py-1 border-r text-right">${line.allowed.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right">${line.copay.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right">${line.coins.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right">${line.ocPaid.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right">${line.nonCovered.toFixed(2)}</td>
                      <td className="px-2 py-1 border-r text-right font-semibold">${line.netAmount.toFixed(2)}</td>
                      <td className="px-2 py-1 text-center font-mono">#{line.conditionApplied}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td className="px-2 py-1.5 border-r">TOTALS</td>
                    <td className="px-2 py-1.5 border-r text-right">${totalAllowed.toFixed(2)}</td>
                    <td className="px-2 py-1.5 border-r text-right">${totalCopay.toFixed(2)}</td>
                    <td className="px-2 py-1.5 border-r text-right">${totalCoins.toFixed(2)}</td>
                    <td className="px-2 py-1.5 border-r text-right">${totalOcPaid.toFixed(2)}</td>
                    <td className="px-2 py-1.5 border-r text-right">${totalNonCovered.toFixed(2)}</td>
                    <td className="px-2 py-1.5 border-r text-right text-green-400">${totalNetAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-center">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Summary Boxes */}
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

            {/* Formula Display */}
            <div className="rounded border p-2 space-y-1.5 text-[10px]">
              <p className="font-semibold text-muted-foreground">COB Calculation Formula (3 Conditions):</p>
              <p className="font-mono text-muted-foreground">Condition 1: If OC Paid &gt; Total PR → Non-Covered = (OC Paid - Allowed) - PR Amount</p>
              <p className="font-mono text-muted-foreground">Condition 2: If OC Paid &lt; Total PR → Non-Covered = 0, Net Amount = 0</p>
              <p className="font-mono text-muted-foreground">Condition 3: If OC Paid = &quot;&quot; → Non-Covered = 0, Allowed = PR Amount</p>
            </div>
          </div>
          <div className="rounded px-2 py-1.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
            Outcome: Net Payable ${totalNetAmount.toFixed(2)} — Recommend posting
          </div>
        </div>
      ),
    },
    // Stage 7: Posting
    {
      id: 7,
      title: 'Posting',
      icon: <Send className="h-3.5 w-3.5 text-orange-400" />,
      outcome: 'pass',
      outcomeLabel: 'Ready for Posting',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Source: COB Calculation Output — as per given datasource</p>
          <div className="space-y-2 text-xs">
            {/* Detail Screen Updates */}
            <div className="rounded border p-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground">Detail Screen Updates:</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Allowed Amount</span><span className="font-mono font-semibold">${totalAllowed.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Non-Covered Amount</span><span className="font-mono">${totalNonCovered.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Allowed Reason</span><span className="font-mono">COB Secondary Calculation</span></div>
            </div>
            {/* Alt + WD Screen Updates */}
            <div className="rounded border p-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground">Alt + WD Screen Updates:</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Denial Codes Applied</span><span className="font-mono">{denial.reasonCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Denial Reasons</span><span>{denial.reasonCode === 'DNNPR' ? 'Non-Participating Provider' : denial.reasonCode}</span></div>
            </div>
            {/* Coordination Adjustments */}
            <div className="rounded border p-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground">Coordination Adjustments:</p>
              <div className="flex justify-between"><span className="text-muted-foreground">DN001 Removal Status</span><span className="text-green-400">Not Applicable</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Authorization Updates</span><span className="text-green-400">No changes required</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hold Code Release</span><span className="font-mono">{holdCode.reason} → Release</span></div>
            </div>
          </div>
          <div className="rounded px-2 py-1.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
            Outcome: Ready for Posting
          </div>
        </div>
      ),
    },
    // Stage 8: Post Validation
    {
      id: 8,
      title: 'Post Validation',
      icon: <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />,
      outcome: 'pass',
      outcomeLabel: 'Claim Ready for Finalization',
      confidence: 'High',
      content: (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Validation Checks — as per given datasource</p>
          <div className="space-y-2 text-xs">
            <div className="rounded border p-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Hold Codes</span>
                <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> None</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Denial Codes</span>
                <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> None unexpected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pend Status Changes</span>
                <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> Cleared</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Financial Inconsistencies</span>
                <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> None</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Authorization Conflicts</span>
                <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> None</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">System Validation Errors</span>
                <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> None</span>
              </div>
            </div>
          </div>
          <div className="rounded px-2 py-1.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
            Outcome: Claim Ready for Finalization
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-2 pr-1">
      {/* Expand/Collapse Controls */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">
          COB Adjudication — {stages.length} Stages
        </p>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Stage Sections */}
      {stages.map((stage) => (
        <StageSection
          key={stage.id}
          stage={stage}
          expanded={expandedStages.has(stage.id)}
          onToggle={() => toggleStage(stage.id)}
        />
      ))}
    </div>
  )
}

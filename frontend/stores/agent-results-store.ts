import { create } from 'zustand'
import type { Claim } from '@/types'

/** Hold code info extracted by AuthAgent */
export interface HoldCodeInfo {
  reason: string
  description: string
  history: boolean
}

/** Claim detail line extracted by ClaimDetailAgent */
export interface ClaimDetailLine {
  lineNo: number
  cpt: string
  modifier: string
  startDate: string
  endDate: string
  units: number
  billedAmt: number
  allowedAmt: number
  copay: number
  coinsurance: number
  ocPaid: number
}

/** COB history entry extracted by EligibilityAgent */
export interface COBHistoryEntry {
  sno: number
  primaryInsurance: string
  effectiveDate: string
  termDate: string
}

/** EOB extraction data from EOB RetrievalAgent */
export interface EOBExtraction {
  cpt: string
  insuranceName: string
  paidAmt: number
  adjGrpCode: string
  reasonCode: string
  prAmount: number
}

/** Denial detail from DenialAgent */
export interface DenialDetail {
  lineNo: number
  history: boolean
  reasonCode: string
}

/** Complete agent result for a claim */
export interface AgentResult {
  claimNumber: string
  processedAt: string
  // Agent outputs
  holdCodeInfo: HoldCodeInfo
  claimDetails: ClaimDetailLine[]
  cobHistory: COBHistoryEntry[]
  eobExtraction: EOBExtraction | null
  denialDetail: DenialDetail
  // Resolution
  confidenceBreakdown: {
    eligibility: number
    pricing: number
    compliance: number
    overall: number
  }
  recommendation: 'auto-resolve' | 'hitl-review' | 'deny'
  reasoningSummary: string
  // Examiner decision (populated after manual review)
  examinerDecision?: {
    action: 'approve' | 'deny' | 'manual-review'
    reason?: string
    notes: string
    decidedBy: string
    decidedAt: string
  }
}

interface AgentResultsState {
  results: Record<string, AgentResult> // keyed by claimNumber
  setResult: (claimNumber: string, result: AgentResult) => void
  getResult: (claimNumber: string) => AgentResult | undefined
  clearResults: () => void
}

// Simulated data generators
const holdReasons: Record<string, { reason: string; description: string }[]> = {
  COB: [
    { reason: 'COBHD', description: 'COB high dollar — other insurance verification required' },
    { reason: 'COBOC', description: 'Undefined other carrier code for COB' },
    { reason: 'COBPR', description: 'COB primary carrier payment pending' },
  ],
  DUAL: [
    { reason: 'DUAL', description: 'Dual eligibility — Medicare/Medicaid crossover verification' },
    { reason: 'MCRDL', description: 'Medicare dual eligible — coordination required' },
  ],
  Auth: [
    { reason: 'AUTH', description: 'Authorization pending review' },
    { reason: 'CRCL2', description: 'Corrected claim requires re-authorization' },
  ],
  Duplicate: [
    { reason: 'PODUP', description: 'Potential duplicate claim detected' },
    { reason: 'PODP3', description: 'Potential duplicate — 3rd occurrence' },
    { reason: 'DUPLM', description: 'Duplicate claim match found' },
  ],
  Pricing: [
    { reason: 'CEH01', description: 'Contract/fee schedule exception hold' },
    { reason: 'CL081', description: 'Claim pricing exception — manual review' },
  ],
  'High Dollar': [
    { reason: 'HDB31', description: 'High dollar billed amount exceeds threshold' },
    { reason: 'DOLLR', description: 'Dollar amount threshold exceeded' },
  ],
  'Corrected Claims': [
    { reason: 'CRCLS', description: 'Corrected claim submitted' },
    { reason: 'CRCLM', description: 'Corrected claim — line modification' },
  ],
  'Other Pend': [
    { reason: 'TSSHD', description: 'Technical Shared Services processing hold' },
    { reason: 'NOSPT', description: 'No supporting documentation' },
  ],
}

const insuranceNames = ['Medicare', 'Cigna', 'United Healthcare', 'Aetna', 'BCBS']
const adjCodes = ['CO, PR', 'PI', 'OA', 'PR']
const denialCodes = ['DNNPR', 'CO45', 'PR27', 'M15', 'CO16', 'CO97']
const cptCodes = ['99213', '99214', '99215', '71046', '36415', '80053', '93000']
const modifiers = ['25', '59', '95', '0']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

/** Generate simulated agent results for a claim */
export function generateAgentResult(claim: Claim): AgentResult {
  const classification = claim.classification
  const holdOptions = holdReasons[classification] || holdReasons['Other Pend']
  const holdInfo = randomFrom(holdOptions)

  // Generate 2-4 claim detail lines
  const lineCount = Math.floor(Math.random() * 3) + 2
  const claimDetails: ClaimDetailLine[] = Array.from({ length: lineCount }, (_, i) => {
    const billed = randomBetween(50, claim.billedAmount / lineCount * 2)
    const allowed = billed * randomBetween(0.4, 0.85)
    const copay = randomBetween(10, 50)
    const coins = randomBetween(5, 200)
    const ocPaid = allowed - copay - coins
    return {
      lineNo: i + 1,
      cpt: randomFrom(cptCodes),
      modifier: randomFrom(modifiers),
      startDate: '06/' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0') + '/2025',
      endDate: '06/' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0') + '/2025',
      units: Math.floor(Math.random() * 4) + 1,
      billedAmt: Math.round(billed * 100) / 100,
      allowedAmt: Math.round(allowed * 100) / 100,
      copay: Math.round(copay * 100) / 100,
      coinsurance: Math.round(coins * 100) / 100,
      ocPaid: Math.round(Math.max(0, ocPaid) * 100) / 100,
    }
  })

  // COB history (for COB/DUAL claims)
  const cobHistory: COBHistoryEntry[] = (classification === 'COB' || classification === 'DUAL') ? [
    { sno: 1, primaryInsurance: randomFrom(insuranceNames), effectiveDate: '07/13/2024', termDate: '07/13/2025' },
    { sno: 2, primaryInsurance: randomFrom(insuranceNames), effectiveDate: '07/13/2024', termDate: '07/13/2025' },
  ] : []

  // EOB extraction (for COB claims)
  const eobExtraction: EOBExtraction | null = classification === 'COB' ? {
    cpt: randomFrom(cptCodes),
    insuranceName: randomFrom(insuranceNames),
    paidAmt: randomBetween(100, claim.billedAmount * 0.6),
    adjGrpCode: randomFrom(adjCodes),
    reasonCode: String(Math.floor(Math.random() * 5) + 1),
    prAmount: randomBetween(50, 500),
  } : null

  // Denial detail
  const denialDetail: DenialDetail = {
    lineNo: 1,
    history: false,
    reasonCode: randomFrom(denialCodes),
  }

  // Confidence breakdown
  const eligibility = randomBetween(70, 99)
  const pricing = randomBetween(65, 99)
  const compliance = randomBetween(75, 99)

  // Classification-based confidence adjustment
  let overallBase = (eligibility + pricing + compliance) / 3
  if (classification === 'High Dollar') overallBase -= 15
  if (classification === 'Duplicate' || classification === 'Pricing') overallBase += 5
  if (classification === 'COB' && !eobExtraction) overallBase -= 10
  const overall = Math.min(99, Math.max(50, Math.round(overallBase)))

  // Recommendation
  const recommendation = overall >= 95 ? 'auto-resolve' as const
    : overall >= 70 ? 'hitl-review' as const
    : 'deny' as const

  // Reasoning summary
  const summaries: Record<string, string[]> = {
    COB: [
      `Primary insurance (${cobHistory[0]?.primaryInsurance || 'Unknown'}) verified active. Secondary payment calculated.`,
      `EOB retrieved — other carrier paid $${eobExtraction?.paidAmt.toFixed(2) || '0'}. Coordination rules applied.`,
      `COB coordination complete. ${recommendation === 'auto-resolve' ? 'Clear case — auto-resolving.' : 'Ambiguous EOB — routing to HITL.'}`,
    ],
    DUAL: [
      `Medicare/Medicaid dual eligibility confirmed. Crossover rules applied.`,
      `Primary carrier (${cobHistory[0]?.primaryInsurance || 'Medicare'}) payment verified.`,
      `${recommendation === 'auto-resolve' ? 'Standard crossover — auto-resolving.' : 'Non-standard crossover — needs review.'}`,
    ],
    Auth: [
      `Authorization status checked — ${holdInfo.reason} hold active.`,
      `Auth-to-claim matching: procedure codes validated against authorization.`,
      `${recommendation === 'auto-resolve' ? 'Auth verified and matched — auto-resolving.' : 'Auth mismatch or expired — needs review.'}`,
    ],
    Duplicate: [
      `Fuzzy match detected potential duplicate (hold: ${holdInfo.reason}).`,
      `Compared claim details: provider, amount, dates — match score calculated.`,
      `${recommendation === 'auto-resolve' ? 'Confirmed duplicate — auto-denying.' : 'Inconclusive match — needs manual review.'}`,
    ],
    Pricing: [
      `Fee schedule lookup: billed $${claim.billedAmount.toFixed(2)}, allowed $${(claim.billedAmount * 0.65).toFixed(2)}.`,
      `Variance: ${((1 - 0.65) * 100).toFixed(0)}% — ${claim.billedAmount > 50000 ? 'exceeds threshold' : 'within acceptable range'}.`,
      `${recommendation === 'auto-resolve' ? 'Pricing within contract terms — auto-resolving.' : 'Pricing exception — needs review.'}`,
    ],
  }

  const reasoningSummary = (summaries[classification] || [
    `Claim processed through standard pipeline. Hold: ${holdInfo.reason}.`,
    `All compliance checks completed.`,
    `${recommendation === 'auto-resolve' ? 'Auto-resolving.' : 'Routing to HITL for review.'}`,
  ]).join(' ')

  return {
    claimNumber: claim.claimNumber,
    processedAt: new Date().toISOString(),
    holdCodeInfo: { reason: holdInfo.reason, description: holdInfo.description, history: false },
    claimDetails,
    cobHistory,
    eobExtraction,
    denialDetail,
    confidenceBreakdown: {
      eligibility: Math.round(eligibility),
      pricing: Math.round(pricing),
      compliance: Math.round(compliance),
      overall,
    },
    recommendation,
    reasoningSummary,
  }
}

export const useAgentResultsStore = create<AgentResultsState>()(
    (set, get) => ({
      results: {},

      setResult: (claimNumber: string, result: AgentResult) => {
        set((state) => ({
          results: { ...state.results, [claimNumber]: result },
        }))
      },

      getResult: (claimNumber: string) => {
        return get().results[claimNumber]
      },

      clearResults: () => {
        set({ results: {} })
      },
    })
)

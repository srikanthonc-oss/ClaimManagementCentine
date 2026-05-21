'use client'

import * as React from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAgentResultsStore } from '@/stores/agent-results-store'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import type { Claim } from '@/types'
import { X, FileText, Bot, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface ClaimDetailViewProps {
  claim: Claim
  processed: boolean
  canExecute: boolean
  onClose: () => void
  onApprove: (notes: string) => void
  onDeny: (notes: string) => void
}

export function ClaimDetailView({ claim, processed, canExecute, onClose, onApprove, onDeny }: ClaimDetailViewProps) {
  const agentResult = useAgentResultsStore((state) => state.results[claim.claimNumber])
  const currentUser = useAuthStore((state) => state.currentUser)
  const [notes, setNotes] = React.useState('')
  const [showNotesError, setShowNotesError] = React.useState(false)
  const [notesErrorMsg, setNotesErrorMsg] = React.useState('')
  const [decisionAction, setDecisionAction] = React.useState<'approve' | 'deny' | 'pend-back' | ''>('')
  const [denialReason, setDenialReason] = React.useState('')
  const [pendBackReason, setPendBackReason] = React.useState('')
  const [freshData, setFreshData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  // Fetch fresh claim data from API on mount
  React.useEffect(() => {
    api.claims.get(claim.id)
      .then((data) => setFreshData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [claim.id])

  // Use fresh API data for agent result and examiner decision if available
  const displayAgentResult = freshData?.agentResult?.result_data || agentResult
  const displayDecision = freshData?.examinerDecision || agentResult?.examinerDecision

  const timelyFilingDays = claim.state === 'TX' ? 95 : claim.state === 'FL' ? 365 : claim.state === 'KY' ? 180 : 365
  const isWithinWindow = claim.daysAged <= timelyFilingDays
  const timelyFilingRule = `${claim.state} · Medicare timely filing: ${timelyFilingDays} days — ${isWithinWindow ? 'within window' : 'EXCEEDED'}`

  const handleSubmitDecision = () => {
    if (!notes.trim()) {
      setShowNotesError(true)
      setNotesErrorMsg('Please enter notes before submitting')
      return
    }
    if (decisionAction === 'deny' && !denialReason) {
      setShowNotesError(true)
      setNotesErrorMsg('Please select a denial reason code')
      return
    }
    if (decisionAction === 'pend-back' && !pendBackReason) {
      setShowNotesError(true)
      setNotesErrorMsg('Please select a reason why AI cannot process this claim')
      return
    }

    if (decisionAction === 'approve') {
      onApprove(notes.trim())
    } else if (decisionAction === 'deny') {
      onDeny(`[${denialReason}] ${notes.trim()}`)
    } else if (decisionAction === 'pend-back') {
      // Send to manual processing — cannot be processed by AI
      onDeny(`[MANUAL-REVIEW: ${pendBackReason}] ${notes.trim()}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 overflow-auto">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl rounded-lg border bg-background shadow-2xl mb-10">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Claim {claim.claimNumber}</h2>
          </div>

          {/* Claim Info Grid */}
          <div className="rounded-lg border p-4 space-y-2.5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Provider:</span>
                <span className="text-xs font-bold">{claim.providerName}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Specialty:</span>
                <span className="text-xs font-bold">{claim.providerSpecialty || '—'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Subscriber:</span>
                <span className="text-xs font-bold font-mono">{claim.subscriberId || '—'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">State:</span>
                <span className="text-xs font-bold">{claim.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Core system:</span>
                <span className="inline-flex rounded bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">{claim.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">LOB:</span>
                <span className="inline-flex rounded bg-muted px-2 py-0.5 text-[10px] font-medium">{claim.classification}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Received:</span>
                <span className="text-xs font-bold">{claim.recvDt || '—'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Days aged:</span>
                <span className="text-xs font-bold">{claim.daysAged}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Billed:</span>
                <span className="text-xs font-bold">{formatCurrency(claim.billedAmount)}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Allowed:</span>
                <span className="text-xs font-bold">{claim.allowedAmount != null ? formatCurrency(claim.allowedAmount) : '—'}</span>
              </div>
            </div>
            {/* Timely Filing Rule */}
            <div className={cn('rounded-md px-3 py-2 mt-2', isWithinWindow ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30')}>
              <p className={cn('text-xs font-medium', isWithinWindow ? 'text-green-400' : 'text-red-400')}>{timelyFilingRule}</p>
              <p className="text-[10px] text-muted-foreground">CMS 42 CFR 424.44 — 1 calendar year from DOS</p>
            </div>
          </div>
        </div>

        {/* Agent Results Section */}
        {processed && agentResult && (
          <div className="px-6 pb-4 space-y-3">
            {/* Data Sources Used */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">Data Sources Used</span>
                <span className="text-[10px] text-muted-foreground">· platforms & applications touched during processing</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 border-l-2 border-blue-500 pl-3">
                  <span className="inline-flex rounded bg-blue-500/20 px-2 py-0.5 text-[9px] font-medium text-blue-400 mt-0.5 shrink-0">core claims</span>
                  <div><p className="text-xs font-semibold">{claim.platform} Core Claims Platform</p><p className="text-[10px] text-muted-foreground">Pend source · final adjudication writeback</p></div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-green-500 pl-3">
                  <span className="inline-flex rounded bg-green-500/20 px-2 py-0.5 text-[9px] font-medium text-green-400 mt-0.5 shrink-0">eligibility</span>
                  <div><p className="text-xs font-semibold">PendResolve · Data Hub (Member360)</p><p className="text-[10px] text-muted-foreground">Eligibility & benefits lookup for {agentResult.cobHistory[0]?.primaryInsurance || 'Medicare'}</p></div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-purple-500 pl-3">
                  <span className="inline-flex rounded bg-purple-500/20 px-2 py-0.5 text-[9px] font-medium text-purple-400 mt-0.5 shrink-0">rules</span>
                  <div><p className="text-xs font-semibold">State Business-Rules Registry ({claim.state} · Medicare)</p><p className="text-[10px] text-muted-foreground">Timely-filing & state validation rules</p></div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-amber-500 pl-3">
                  <span className="inline-flex rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-medium text-amber-400 mt-0.5 shrink-0">ai gateway</span>
                  <div><p className="text-xs font-semibold">AWS AI Gateway · gpt-resolve-v3</p><p className="text-[10px] text-muted-foreground">AI reasoning, classification, recommendation</p></div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-pink-500 pl-3">
                  <span className="inline-flex rounded bg-pink-500/20 px-2 py-0.5 text-[9px] font-medium text-pink-400 mt-0.5 shrink-0">bpm</span>
                  <div><p className="text-xs font-semibold">BPM / Workbench</p><p className="text-[10px] text-muted-foreground">Case routing, HITL queueing, audit trail</p></div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-cyan-500 pl-3">
                  <span className="inline-flex rounded bg-cyan-500/20 px-2 py-0.5 text-[9px] font-medium text-cyan-400 mt-0.5 shrink-0">auth um</span>
                  <div><p className="text-xs font-semibold">Utilization Management (UM) System</p><p className="text-[10px] text-muted-foreground">Authorization lookup & CPT/unit overlap</p></div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-purple-500 pl-3">
                  <span className="inline-flex rounded bg-purple-500/20 px-2 py-0.5 text-[9px] font-medium text-purple-400 mt-0.5 shrink-0">rules</span>
                  <div><p className="text-xs font-semibold">InterQual / MCG Criteria Library</p><p className="text-[10px] text-muted-foreground">Medical-policy criteria evaluation</p></div>
                </div>
              </div>
            </div>

            {/* Claim & EOB Images */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold">Claim & EOB Images</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Private · short-lived signed URLs</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-1">Claim Form</p>
                  <div className="rounded border border-dashed p-3 text-center">
                    <p className="text-[10px] text-muted-foreground italic">{claim.submitType === 'PAPER' ? 'Paper claim form scanned and stored' : 'EDI submission — no paper form'}</p>
                  </div>
                </div>
                {agentResult.eobExtraction && (
                  <div>
                    <p className="text-xs font-medium mb-1">Primary EOB</p>
                    <div className="rounded border p-3">
                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div><p className="text-[10px] text-muted-foreground">Insurance</p><p className="font-medium">{agentResult.eobExtraction.insuranceName}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Paid</p><p className="font-medium">${agentResult.eobExtraction.paidAmt.toFixed(2)}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Adj Code</p><p className="font-mono">{agentResult.eobExtraction.adjGrpCode}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">PR Amount</p><p className="font-medium">${agentResult.eobExtraction.prAmount.toFixed(2)}</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hold Code + Confidence */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold mb-1">Hold Code</p>
                <div className="flex items-center gap-2">
                  <span className="rounded border px-1.5 py-0.5 text-[10px] font-mono">{agentResult.holdCodeInfo.reason}</span>
                  <span className="text-[10px] text-muted-foreground">{agentResult.holdCodeInfo.description}</span>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold mb-1">Confidence Breakdown</p>
                <div className="flex items-center gap-3 text-[10px]">
                  <span>Elig: <strong className={agentResult.confidenceBreakdown.eligibility >= 90 ? 'text-green-400' : 'text-yellow-400'}>{agentResult.confidenceBreakdown.eligibility}%</strong></span>
                  <span>Price: <strong className={agentResult.confidenceBreakdown.pricing >= 90 ? 'text-green-400' : 'text-yellow-400'}>{agentResult.confidenceBreakdown.pricing}%</strong></span>
                  <span>Comp: <strong className={agentResult.confidenceBreakdown.compliance >= 90 ? 'text-green-400' : 'text-yellow-400'}>{agentResult.confidenceBreakdown.compliance}%</strong></span>
                </div>
              </div>
            </div>

            {/* Claim Detail Lines */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold mb-2">Claim Detail Lines</p>
              <div className="overflow-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="border-b">
                    <th className="text-left py-1 pr-2">Line</th>
                    <th className="text-left py-1 pr-2">CPT</th>
                    <th className="text-left py-1 pr-2">Mod</th>
                    <th className="text-right py-1 pr-2">Units</th>
                    <th className="text-right py-1 pr-2">Billed</th>
                    <th className="text-right py-1 pr-2">Allowed</th>
                    <th className="text-right py-1 pr-2">Copay</th>
                    <th className="text-right py-1">OC Paid</th>
                  </tr></thead>
                  <tbody>
                    {agentResult.claimDetails.map((line) => (
                      <tr key={line.lineNo} className="border-b border-border/30">
                        <td className="py-1 pr-2">{line.lineNo}</td>
                        <td className="py-1 pr-2 font-mono">{line.cpt}</td>
                        <td className="py-1 pr-2">{line.modifier}</td>
                        <td className="py-1 pr-2 text-right">{line.units}</td>
                        <td className="py-1 pr-2 text-right">${line.billedAmt.toFixed(2)}</td>
                        <td className="py-1 pr-2 text-right">${line.allowedAmt.toFixed(2)}</td>
                        <td className="py-1 pr-2 text-right">${line.copay.toFixed(2)}</td>
                        <td className="py-1 text-right">${line.ocPaid.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COB History */}
            {agentResult.cobHistory.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold mb-2">COB History</p>
                {agentResult.cobHistory.map((entry) => (
                  <div key={entry.sno} className="flex items-center gap-3 text-xs">
                    <span className="text-[10px] text-muted-foreground">#{entry.sno}</span>
                    <span className="font-medium">{entry.primaryInsurance}</span>
                    <span className="text-muted-foreground">{entry.effectiveDate} — {entry.termDate}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Denial Check */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold mb-1">Denial Check</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded border px-1.5 py-0.5 text-[10px] font-mono">{agentResult.denialDetail.reasonCode}</span>
                <span className="text-muted-foreground">Line {agentResult.denialDetail.lineNo} · History: {agentResult.denialDetail.history ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* AI Resolution Summary */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold">AI Resolution</span>
                <span className={cn('ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold',
                  claim.confidence >= 95 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                )}>Confidence: {claim.confidence}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{agentResult.reasoningSummary}</p>
            </div>
          </div>
        )}

        {/* Not processed state */}
        {!processed && (
          <div className="px-6 pb-4">
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Bot className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Agent processing details will appear after execution</p>
              <p className="text-[10px] text-muted-foreground mt-1">Click &quot;Run Pend Resolution&quot; to process this claim</p>
            </div>
          </div>
        )}

        {/* Examiner Decision Section */}
        {canExecute && processed && claim.confidence < 95 && claim.status === 'In Review' && (
          <div className="px-6 pb-6 pt-3 border-t">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold">Examiner Decision Required</p>
              <span className="text-[10px] text-muted-foreground ml-auto">{currentUser?.name || 'Examiner'}</span>
            </div>

            {/* Action selector */}
            <div className="mb-3">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setDecisionAction('approve')}
                  className={cn('flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    decisionAction === 'approve' ? 'border-green-500 bg-green-500/10 text-green-400' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  ✓ Approve & Release
                </button>
                <button
                  onClick={() => setDecisionAction('deny')}
                  className={cn('flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    decisionAction === 'deny' ? 'border-red-500 bg-red-500/10 text-red-400' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  ✗ Deny with Reason
                </button>
                <button
                  onClick={() => setDecisionAction('pend-back')}
                  className={cn('flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    decisionAction === 'pend-back' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  ↩ Manual Review (Cannot Process With AI)
                </button>
              </div>
            </div>

            {/* Denial reason dropdown (only for deny) */}
            {decisionAction === 'deny' && (
              <div className="mb-3">
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Denial Reason Code</label>
                <select
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select reason...</option>
                  <option value="CO45">CO45 — Charges exceed fee schedule/maximum allowable</option>
                  <option value="CO16">CO16 — Claim lacks information needed for adjudication</option>
                  <option value="CO97">CO97 — Payment adjusted: already adjudicated</option>
                  <option value="PR27">PR27 — Expenses not covered by this payer</option>
                  <option value="CO4">CO4 — Procedure code inconsistent with modifier</option>
                  <option value="DNNPR">DNNPR — Denied non-participating provider</option>
                  <option value="M15">M15 — Separately billed services not allowed</option>
                </select>
              </div>
            )}

            {/* Manual review reason (only for pend-back) */}
            {decisionAction === 'pend-back' && (
              <div className="mb-3">
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Reason (Cannot Process With AI)</label>
                <select
                  value={pendBackReason}
                  onChange={(e) => setPendBackReason(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select reason...</option>
                  <option value="image-not-clear">Image not clear</option>
                  <option value="incomplete-data">Incomplete data from source system</option>
                  <option value="complex-scenario">Complex scenario — requires manual adjudication</option>
                  <option value="system-error">System error during processing</option>
                  <option value="other">Other reasons</option>
                </select>
              </div>
            )}

            {/* Notes field */}
            <div className="mb-3">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                {decisionAction === 'approve' ? 'Approval Notes (required)' : decisionAction === 'deny' ? 'Denial Rationale (required)' : 'Additional Details (required)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setShowNotesError(false) }}
                placeholder={decisionAction === 'approve' ? 'Rationale for approval — citations or override reason...' : decisionAction === 'deny' ? 'Explain why this claim is being denied...' : 'Describe why AI cannot process this claim...'}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {showNotesError && <p className="text-[10px] text-destructive mt-1">{notesErrorMsg}</p>}
            </div>

            {/* Submit button */}
            <Button
              size="sm"
              className={cn('h-8 text-xs gap-1.5 w-full',
                decisionAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                decisionAction === 'deny' ? 'bg-red-600 hover:bg-red-700' :
                'bg-amber-600 hover:bg-amber-700'
              )}
              onClick={handleSubmitDecision}
              disabled={!decisionAction}
            >
              {decisionAction === 'approve' && <><CheckCircle2 className="h-3.5 w-3.5" /> Approve & Release for Payment</>}
              {decisionAction === 'deny' && <><X className="h-3.5 w-3.5" /> Deny Claim</>}
              {decisionAction === 'pend-back' && <><AlertTriangle className="h-3.5 w-3.5" /> Send to Manual Processing</>}
              {!decisionAction && 'Select an action above'}
            </Button>
          </div>
        )}

        {/* Already decided */}
        {processed && claim.status !== 'In Review' && (
          <div className="px-6 pb-4">
            <div className={cn('rounded-lg p-3 flex items-center gap-2',
              claim.status === 'Approved' && claim.confidence >= 95 && claim.confidence < 100 ? 'bg-green-500/10 border border-green-500/30' :
              claim.status === 'Approved' && claim.confidence === 100 ? 'bg-blue-500/10 border border-blue-500/30' :
              claim.status === 'Denied' ? 'bg-red-500/10 border border-red-500/30' :
              'bg-purple-500/10 border border-purple-500/30'
            )}>
              <CheckCircle2 className={cn('h-4 w-4',
                claim.status === 'Approved' && claim.confidence < 100 ? 'text-green-400' :
                claim.status === 'Approved' ? 'text-blue-400' :
                claim.status === 'Denied' ? 'text-red-400' :
                'text-purple-400'
              )} />
              <p className={cn('text-xs font-medium',
                claim.status === 'Approved' && claim.confidence < 100 ? 'text-green-400' :
                claim.status === 'Approved' ? 'text-blue-400' :
                claim.status === 'Denied' ? 'text-red-400' :
                'text-purple-400'
              )}>
                {claim.status === 'Approved' && claim.confidence < 100 ? 'Auto-resolved — released for payment' :
                 claim.status === 'Approved' && claim.confidence === 100 ? 'Manual-Resolved — approved by examiner' :
                 claim.status === 'Denied' ? 'Denied — claim rejected by examiner' :
                 'Manual Processing Required — sent to manual adjudication'}
              </p>
            </div>

            {/* Examiner Decision Details */}
            {agentResult?.examinerDecision && (
              <div className="mt-3 rounded-lg border p-3">
                <p className="text-[10px] font-semibold mb-2">Examiner Decision Record</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-muted-foreground">Decided by:</span>
                    <span className="font-medium">{agentResult.examinerDecision.decidedBy}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(agentResult.examinerDecision.decidedAt).toLocaleString()}</span>
                  </div>
                  {agentResult.examinerDecision.reason && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] text-muted-foreground">Reason:</span>
                      <span className="rounded border px-1.5 py-0.5 text-[10px] font-mono">{agentResult.examinerDecision.reason}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground shrink-0">Notes:</span>
                    <span className="text-muted-foreground">{agentResult.examinerDecision.notes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

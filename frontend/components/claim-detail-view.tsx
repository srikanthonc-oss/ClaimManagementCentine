'use client'

import * as React from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAgentResultsStore } from '@/stores/agent-results-store'
import { useAuthStore } from '@/stores/auth-store'
import { COBAdjudicationView } from '@/components/cob-adjudication-view'
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
      <div className="relative z-50 w-full max-w-4xl rounded-lg border bg-background shadow-2xl mb-10">
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

        {/* COB Adjudication AI Analysis — shown after pend execution */}
        {processed && (
          <div className="px-6 pb-4">
            <COBAdjudicationView claim={claim} />
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
                  ↩ Manual Processing Required
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
              claim.status === 'Approved' && claim.confidence >= 92 ? 'bg-green-500/10 border border-green-500/30' :
              claim.status === 'Approved' ? 'bg-blue-500/10 border border-blue-500/30' :
              claim.status === 'Denied' ? 'bg-red-500/10 border border-red-500/30' :
              'bg-purple-500/10 border border-purple-500/30'
            )}>
              <CheckCircle2 className={cn('h-4 w-4',
                claim.status === 'Approved' && claim.confidence >= 92 ? 'text-green-400' :
                claim.status === 'Approved' ? 'text-blue-400' :
                claim.status === 'Denied' ? 'text-red-400' :
                'text-purple-400'
              )} />
              <p className={cn('text-xs font-medium',
                claim.status === 'Approved' && claim.confidence >= 92 ? 'text-green-400' :
                claim.status === 'Approved' ? 'text-blue-400' :
                claim.status === 'Denied' ? 'text-red-400' :
                'text-purple-400'
              )}>
                {claim.status === 'Approved' && claim.confidence >= 92 ? 'Auto-resolved — released for payment' :
                 claim.status === 'Approved' ? 'Manual-Resolved — approved by examiner' :
                 claim.status === 'Denied' ? 'Denied — claim rejected by examiner' :
                 'Manual Processing Required — sent to manual adjudication'}
              </p>
            </div>

            {/* Examiner Decision Details */}
            {displayDecision && (
              <div className="mt-3 rounded-lg border p-3">
                <p className="text-[10px] font-semibold mb-2">Examiner Decision Record</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-muted-foreground">Decided by:</span>
                    <span className="font-medium">{displayDecision.decided_by_name || displayDecision.decidedBy || 'Examiner'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-muted-foreground">Date:</span>
                    <span className="font-medium">{displayDecision.decided_at || displayDecision.decidedAt ? new Date(displayDecision.decided_at || displayDecision.decidedAt).toLocaleString() : '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-muted-foreground">Action:</span>
                    <span className="rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold">{displayDecision.action || '—'}</span>
                  </div>
                  {(displayDecision.reason || displayDecision.reason) && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] text-muted-foreground">Reason:</span>
                      <span className="rounded border px-1.5 py-0.5 text-[10px] font-mono">{displayDecision.reason}</span>
                    </div>
                  )}
                  {(displayDecision.notes) && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-muted-foreground shrink-0">Notes:</span>
                      <span className="text-muted-foreground">{displayDecision.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

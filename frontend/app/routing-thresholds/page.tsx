'use client'

import * as React from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Shield, Save, CheckCircle2, Loader2 } from 'lucide-react'

export default function RoutingThresholdsPage() {
  const currentUser = useAuthStore((state) => state.currentUser)

  const [thresholds, setThresholds] = React.useState<{ autoResolve: number; hitlLow: number }>({
    autoResolve: 92,
    hitlLow: 60,
  })

  const [saved, setSaved] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch thresholds from API on mount
  React.useEffect(() => {
    api.thresholds.get()
      .then((data) => {
        if (data && typeof data.autoResolve === 'number' && typeof data.hitlLow === 'number') {
          setThresholds({ autoResolve: data.autoResolve, hitlLow: data.hitlLow })
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = () => {
    // Save to backend API
    api.thresholds.update(thresholds.autoResolve, thresholds.hitlLow).catch(() => {})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Only admin can access
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Routing Thresholds</h1>
          <p className="text-xs text-muted-foreground">Global confidence thresholds for claim routing</p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <Shield className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="mt-3 text-sm font-semibold">Access Denied</h3>
          <p className="mt-1 text-xs text-muted-foreground">Only administrators can configure routing thresholds</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading thresholds...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Routing Thresholds</h1>
        <p className="text-xs text-muted-foreground">Configure global confidence thresholds that determine how claims are routed during pend resolution</p>
      </div>

      {/* Threshold Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-bold">Auto-Resolve</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Claims with AI confidence at or above this threshold are automatically approved without human review.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">≥</span>
              <Input
                type="number"
                min={60}
                max={100}
                value={thresholds.autoResolve}
                onChange={(e) => setThresholds((prev) => ({
                  ...prev,
                  autoResolve: Math.min(100, Math.max(prev.hitlLow + 1, parseInt(e.target.value) || 0))
                }))}
                className="h-10 w-20 text-sm text-center font-bold"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] text-green-400 mt-2">Currently: ≥ {thresholds.autoResolve}% → Auto-Approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm font-bold">HITL Review</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Claims with confidence in this range are routed to a human examiner for manual review and decision.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{thresholds.hitlLow}% – {thresholds.autoResolve - 1}%</span>
            </div>
            <p className="text-[10px] text-amber-400 mt-2">Examiner must Approve, Deny, or Pend Back</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm font-bold">Force HITL / High Risk</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Claims below this threshold are flagged as high-risk and require mandatory senior examiner review.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">&lt;</span>
              <Input
                type="number"
                min={0}
                max={90}
                value={thresholds.hitlLow}
                onChange={(e) => setThresholds((prev) => ({
                  ...prev,
                  hitlLow: Math.min(prev.autoResolve - 1, Math.max(0, parseInt(e.target.value) || 0))
                }))}
                className="h-10 w-20 text-sm text-center font-bold"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] text-red-400 mt-2">Currently: &lt; {thresholds.hitlLow}% → Mandatory Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} className="h-9 gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" />
          Save Thresholds
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved successfully
          </span>
        )}
      </div>

      {/* How it works */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-xs font-bold mb-3">How Routing Works</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>1. When &quot;Run Pend Resolution&quot; executes, each claim gets an AI confidence score (0-100%).</p>
            <p>2. The score is compared against these thresholds to determine routing:</p>
            <div className="rounded-lg border p-3 mt-2 space-y-1.5">
              <p><span className="text-green-400 font-medium">≥ {thresholds.autoResolve}%</span> → Claim is auto-approved and released for payment. No human touch needed.</p>
              <p><span className="text-amber-400 font-medium">{thresholds.hitlLow}% – {thresholds.autoResolve - 1}%</span> → Claim is routed to HITL queue. Examiner reviews and decides.</p>
              <p><span className="text-red-400 font-medium">&lt; {thresholds.hitlLow}%</span> → High-risk claim. Mandatory senior examiner review with escalation.</p>
            </div>
            <p className="mt-2">3. Changes take effect on the next &quot;Run Pend Resolution&quot; execution.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

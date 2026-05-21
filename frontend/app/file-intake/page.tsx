'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useUIStore } from '@/stores/ui-store'
import { useDataSourcesStore } from '@/stores/data-sources-store'
import { useAuthStore } from '@/stores/auth-store'
import { parseXLSFile } from '@/lib/xls-parser'
import { formatCurrency, cn } from '@/lib/utils'
import type { FileUploadResult, Classification, Platform, Claim } from '@/types'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Files,
  Database,
  Layers,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function FileIntakePage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform | ''>('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [uploadResult, setUploadResult] = React.useState<FileUploadResult | null>(null)
  const [parsingError, setParsingError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Local state instead of Zustand
  const [claims, setClaims] = React.useState<Claim[]>([])
  const [uploads, setUploads] = React.useState<any[]>([])
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)
  const dataSources = useDataSourcesStore((state) => state.dataSources)
  const fetchDataSources = useDataSourcesStore((state) => state.fetchDataSources)
  const currentUser = useAuthStore((state) => state.currentUser)

  // Fetch claims and upload history from API on mount
  React.useEffect(() => {
    fetchDataSources()

    api.claims.list({ pageSize: '500' })
      .then((data) => {
        if (data?.claims) {
          setClaims(data.claims.map((c: any) => ({
            id: c.id,
            claimNumber: c.claim_number,
            classification: c.classification,
            platform: c.platform,
            providerName: c.provider_name,
            billedAmount: c.billed_amount,
            status: c.status === 'InReview' ? 'In Review' : c.status,
            confidence: c.confidence || 0,
            daysAged: c.days_aged,
            state: c.state,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          })))
        }
      })
      .catch(() => {})

    api.claims.uploads()
      .then((data) => {
        if (Array.isArray(data)) {
          setUploads(data.map((u: any) => ({
            id: u.id,
            fileName: u.file_name,
            platform: u.platform,
            uploadedAt: u.uploaded_at,
            claimsCount: u.claims_count,
            status: 'processed',
            duplicatesSkipped: u.duplicates_skipped || 0,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const allPlatforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  // Available platforms — only those with active data source configured
  const enabledPlatforms = React.useMemo(() => {
    const activeSourceNames = dataSources
      .filter((ds) => ds.status === 'active')
      .map((ds) => ds.name)
    const fromSources = allPlatforms.filter((p) => activeSourceNames.includes(p))
    if (currentUser?.role === 'admin') return fromSources
    const userPlatforms = currentUser?.platforms || []
    return fromSources.filter((p) => userPlatforms.includes(p))
  }, [dataSources, currentUser])

  // Filter claims by selected platforms for stats — empty when none selected
  const filteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return []
    return claims.filter((c) => selectedPlatforms.includes(c.platform))
  }, [claims, selectedPlatforms])

  // Summary cards
  const summaryStats = React.useMemo(() => {
    const totalFiles = uploads.length
    const totalClaims = claims.length
    const activePlatforms = new Set(claims.map((c) => c.platform)).size
    return { totalFiles, totalClaims, activePlatforms }
  }, [uploads, claims])

  // Platform breakdown (uses filtered claims to respect platform selection)
  const platformBreakdown = React.useMemo(() => {
    const breakdown: Record<string, { files: number; claims: number; billed: number }> = {}
    allPlatforms.forEach((p) => { breakdown[p] = { files: 0, claims: 0, billed: 0 } })

    uploads.forEach((u) => {
      if (breakdown[u.platform]) {
        breakdown[u.platform].files += 1
      }
    })

    filteredClaims.forEach((c) => {
      if (breakdown[c.platform]) {
        breakdown[c.platform].claims += 1
        breakdown[c.platform].billed += c.billedAmount
      }
    })

    return allPlatforms
      .map((p) => ({ platform: p, ...breakdown[p] }))
      .filter((row) => row.files > 0 || row.claims > 0)
  }, [uploads, filteredClaims])

  // Category breakdown (filtered by platform selection)
  const categoryBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {}
    filteredClaims.forEach((c) => {
      counts[c.classification] = (counts[c.classification] || 0) + 1
    })
    const total = filteredClaims.length
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
  }, [filteredClaims])

  // Last upload time
  const lastUploadTime = React.useMemo(() => {
    if (uploads.length === 0) return null
    return new Date(uploads[0].uploadedAt)
  }, [uploads])

  const handleBrowseClick = () => {
    if (!selectedPlatform) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsProcessing(true)
    setParsingError(null)
    setUploadResult(null)

    try {
      const result = await parseXLSFile(file)
      console.log('[FileIntake] Parse result:', result.success, 'claims:', result.claims.length, 'errors:', result.errors.length)

      // Assign selected platform to all parsed claims
      if (result.claims.length > 0 && selectedPlatform) {
        result.claims = result.claims.map((claim) => ({
          ...claim,
          platform: selectedPlatform,
        }))
      }

      setUploadResult(result)

      if (result.success && result.claims.length > 0) {
        // Count duplicates before adding
        const existingIds = new Set(claims.map((c) => c.id))
        const dupes = result.claims.filter((c) => existingIds.has(c.id)).length

        // Upload to backend API (source of truth)
        api.claims.upload(result.claims, file.name, selectedPlatform as string)
          .then((resp) => {
            console.log('[Upload] Success:', resp)
            // Add upload to local history
            setUploads((prev) => [{
              id: resp.upload_id || `upload-${Date.now()}`,
              fileName: file.name,
              platform: selectedPlatform as Platform,
              uploadedAt: new Date().toISOString(),
              claimsCount: result.claims.length,
              status: 'processed',
              duplicatesSkipped: dupes,
            }, ...prev])
            // Refresh claims from API
            return api.claims.list({ pageSize: '500' })
          })
          .then((data) => {
            if (data?.claims) {
              setClaims(data.claims.map((c: any) => ({
                id: c.id,
                claimNumber: c.claim_number,
                classification: c.classification,
                platform: c.platform,
                providerName: c.provider_name,
                billedAmount: c.billed_amount,
                status: c.status === 'InReview' ? 'In Review' : c.status,
                confidence: c.confidence || 0,
                daysAged: c.days_aged,
                state: c.state,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
              })))
            }
          })
          .catch((err) => { console.error('[Upload] Error:', err) })

        // Auto-select the uploaded platform in the filter
        if (selectedPlatform && !selectedPlatforms.includes(selectedPlatform)) {
          togglePlatform(selectedPlatform)
        }
        setIsDialogOpen(false)
      } else if (!result.success) {
        const msgs = result.errors.filter((err) => err.severity === 'error').map((err) => err.message).join('; ')
        setParsingError(msgs || 'Failed to parse file')
      }
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Claims File Intake</h1>
          <p className="text-xs text-muted-foreground">
            Upload and process XLS claims data
            {lastUploadTime && (
              <span className="ml-2 text-muted-foreground">
                · Last upload: {lastUploadTime.toLocaleDateString()} {lastUploadTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {claims.length > 0 && currentUser?.role === 'admin' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                api.claims.clearAll().then(() => { setClaims([]); setUploads([]) }).catch(() => {})
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
          {(currentUser?.role === 'admin' || currentUser?.role === 'examiner') && (
            <Button size="sm" className="h-8 gap-2 text-xs" onClick={() => setIsDialogOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </Button>
          )}
        </div>
      </div>

      {/* Success banner */}
      {uploadResult && uploadResult.success && uploadResult.claimsParsed > 0 && !isProcessing && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500 bg-green-500/10 px-4 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-xs text-green-600 dark:text-green-400">
            Added <strong>{uploadResult.claimsParsed}</strong> claims for <strong>{selectedPlatform}</strong> · Total: {claims.length} claims
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {claims.length > 0 && (
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-blue-500/20 p-2">
                <Files className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{summaryStats.totalFiles}</p>
                <p className="text-[10px] text-muted-foreground">Files Uploaded</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-green-500/20 p-2">
                <Database className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{summaryStats.totalClaims.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Claims Loaded</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-purple-500/20 p-2">
                <Layers className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{summaryStats.activePlatforms} of 3</p>
                <p className="text-[10px] text-muted-foreground">Platforms Active</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload History Table */}
      {uploads.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Upload History</span>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/80">
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">File Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Platform</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date Uploaded</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Claims</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-medium">{upload.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium">
                        {upload.platform}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(upload.uploadedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      {new Date(upload.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{upload.claimsCount}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Processed
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setUploads((prev) => prev.filter((u) => u.id !== upload.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uploads.some((u) => u.duplicatesSkipped > 0) && (
            <p className="text-[10px] text-muted-foreground">
              ⓘ {uploads.reduce((sum, u) => sum + u.duplicatesSkipped, 0)} duplicate claims skipped across uploads
            </p>
          )}
        </section>
      )}

      {/* Statistics Section */}
      {claims.length > 0 && (
        <section className="space-y-3">
          {/* Platform Filter */}
          <div className="flex items-center gap-5 rounded-lg border bg-card px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground">Filter by Platform:</span>
            {allPlatforms.map((platform) => {
              const isChecked = selectedPlatforms.includes(platform)
              const isEnabled = enabledPlatforms.includes(platform)
              const count = claims.filter((c) => c.platform === platform).length
              const isDisabled = !isEnabled || count === 0
              return (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fi-platform-${platform.toLowerCase()}`}
                    checked={isChecked && !isDisabled}
                    onCheckedChange={() => { if (!isDisabled) togglePlatform(platform) }}
                    disabled={isDisabled}
                  />
                  <Label
                    htmlFor={`fi-platform-${platform.toLowerCase()}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-1 text-xs font-normal',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span>{platform}</span>
                    <span className="text-muted-foreground">({count})</span>
                  </Label>
                </div>
              )
            })}
            {selectedPlatforms.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearPlatformFilters} className="text-xs h-6 ml-auto">
                Clear
              </Button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Platform Breakdown */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold mb-3">Breakdown by Platform</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-medium text-muted-foreground">Platform</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Files</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Claims</th>
                      <th className="text-right pb-2 font-medium text-muted-foreground">Total Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformBreakdown.map(({ platform, files, claims: claimCount, billed }) => (
                      <tr key={platform} className="border-b border-border/50">
                        <td className="py-2 font-medium">{platform}</td>
                        <td className="py-2 text-right">{files}</td>
                        <td className="py-2 text-right">{claimCount}</td>
                        <td className="py-2 text-right">{formatCurrency(billed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold">Breakdown by Category</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {filteredClaims.length} claims{selectedPlatforms.length > 0 ? ' (filtered)' : ''}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    categoryBreakdown.map(({ category, count, percentage }) => (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{category}</span>
                          <span className="text-[10px] text-muted-foreground">{count} · {percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Empty state */}
      {claims.length === 0 && !isProcessing && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No claims loaded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Click &quot;Upload File&quot; to get started</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isProcessing && setIsDialogOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Claims File</DialogTitle>
            <DialogDescription className="text-xs">Select platform and upload the platform-specific Excel file</DialogDescription>
          </DialogHeader>

          {/* Platform selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Platform</Label>
            {enabledPlatforms.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  No data sources configured. Add a data source in the <button onClick={() => { setIsDialogOpen(false); router.push('/data-sources') }} className="underline font-medium">Data Sources</button> page first.
                </p>
              </div>
            ) : (
              <Select
                value={selectedPlatform}
                onValueChange={(value) => setSelectedPlatform(value as Platform)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {enabledPlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Drop zone */}
          <div
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              selectedPlatform && enabledPlatforms.length > 0
                ? 'border-primary/40 hover:border-primary hover:bg-primary/5'
                : 'border-muted-foreground/20 opacity-50 cursor-not-allowed'
            }`}
            onClick={handleBrowseClick}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" />
                <p className="text-xs text-muted-foreground">Processing {fileName}...</p>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-xs font-medium">
                  {enabledPlatforms.length === 0
                    ? 'Configure a data source first'
                    : selectedPlatform
                      ? 'Drop XLS file here, or click to browse'
                      : 'Select a platform first'}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">Accepts Excel files (.xls, .xlsx, .csv)</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Error */}
          {parsingError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-destructive flex-shrink-0" />
              <p className="text-[10px] text-destructive">{parsingError}</p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Upload only platform specific XLS files
          </p>
          {enabledPlatforms.length < 3 && (
            <p className="text-[10px] text-muted-foreground">
              Need another platform? <button onClick={() => { setIsDialogOpen(false); router.push('/data-sources') }} className="text-primary underline font-medium">Add it in Data Sources</button> to enable it here.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

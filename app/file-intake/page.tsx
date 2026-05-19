'use client'

import * as React from 'react'
import { DynamicTabs } from '@/components/file-intake/dynamic-tabs'
import { ClaimsTable } from '@/components/claims-table'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useClaimsStore } from '@/stores/claims-store'
import { useUIStore } from '@/stores/ui-store'
import { parseXLSFile } from '@/lib/xls-parser'
import type { FileUploadResult, Classification, Platform } from '@/types'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function FileIntakePage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform | ''>('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [uploadResult, setUploadResult] = React.useState<FileUploadResult | null>(null)
  const [activeTab, setActiveTab] = React.useState<string>('')
  const [parsingError, setParsingError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Stores
  const claims = useClaimsStore((state) => state.claims)
  const addClaims = useClaimsStore((state) => state.addClaims)
  const selectedPlatforms = useUIStore((state) => state.selectedPlatforms)
  const togglePlatform = useUIStore((state) => state.togglePlatform)
  const clearPlatformFilters = useUIStore((state) => state.clearPlatformFilters)

  const platforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']

  // Filter by platform
  const platformFilteredClaims = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return claims
    return claims.filter((claim) => selectedPlatforms.includes(claim.platform))
  }, [claims, selectedPlatforms])

  // Classifications from filtered claims
  const classifications = React.useMemo(() => {
    const unique = new Set<Classification>()
    platformFilteredClaims.forEach((claim) => unique.add(claim.classification))
    return Array.from(unique)
  }, [platformFilteredClaims])

  const classificationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    platformFilteredClaims.forEach((claim) => {
      counts[claim.classification] = (counts[claim.classification] || 0) + 1
    })
    return counts
  }, [platformFilteredClaims])

  // Filter by active tab
  const filteredClaims = React.useMemo(() => {
    if (!activeTab) return platformFilteredClaims
    return platformFilteredClaims.filter((claim) => claim.classification === activeTab)
  }, [platformFilteredClaims, activeTab])

  // Platform counts from ALL claims (not filtered)
  const platformCounts = React.useMemo(() => {
    const counts: Record<string, number> = { Facet: 0, Amisys: 0, Xcelys: 0 }
    claims.forEach((claim) => {
      counts[claim.platform] = (counts[claim.platform] || 0) + 1
    })
    return counts
  }, [claims])

  // Reset active tab when filters change
  React.useEffect(() => {
    if (classifications.length === 0) {
      setActiveTab('')
      return
    }
    if (!activeTab || !classifications.includes(activeTab as Classification)) {
      const sorted = [...classifications].sort((a, b) => a.localeCompare(b))
      setActiveTab(sorted[0])
    }
  }, [classifications, activeTab, selectedPlatforms])

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

      // Assign selected platform to all parsed claims
      if (result.claims.length > 0 && selectedPlatform) {
        result.claims = result.claims.map((claim) => ({
          ...claim,
          platform: selectedPlatform,
        }))
      }

      setUploadResult(result)

      if (result.success && result.claims.length > 0) {
        // APPEND claims (not replace) so multiple uploads accumulate
        addClaims(result.claims)
        const unique = new Set<Classification>()
        result.claims.forEach((claim) => unique.add(claim.classification))
        const sorted = Array.from(unique).sort((a, b) => a.localeCompare(b))
        if (sorted.length > 0) setActiveTab(sorted[0])
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
          <h1 className="text-2xl font-bold">File Intake</h1>
          <p className="text-xs text-muted-foreground">Upload and process XLS claims data</p>
        </div>
        <Button size="sm" className="h-8 gap-2 text-xs" onClick={() => setIsDialogOpen(true)}>
          <Upload className="h-3.5 w-3.5" />
          Upload File
        </Button>
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

      {/* Claims Data */}
      {claims.length > 0 && !isProcessing && (
        <section className="space-y-3">
          {/* Heading */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Claims Data</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {platformFilteredClaims.length} claims
            </span>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-5 rounded-lg border bg-card px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground">Platform:</span>
            {platforms.map((platform) => {
              const isChecked = selectedPlatforms.includes(platform)
              const count = platformCounts[platform] || 0
              const checkboxId = `fi-platform-${platform.toLowerCase()}`

              return (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={() => togglePlatform(platform)}
                  />
                  <Label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-1 text-xs font-normal">
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

          {/* Tabs + Table */}
          {classifications.length > 0 ? (
            <DynamicTabs
              classifications={classifications}
              counts={classificationCounts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              <ClaimsTable claims={filteredClaims} />
            </DynamicTabs>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-xs text-muted-foreground">No claims match the selected platform filter</p>
            </div>
          )}
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
            <DialogDescription className="text-xs">Select platform and upload XLS/XLSX file</DialogDescription>
          </DialogHeader>

          {/* Platform selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Platform</Label>
            <Select
              value={selectedPlatform}
              onValueChange={(value) => setSelectedPlatform(value as Platform)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select platform..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Facet">Facet</SelectItem>
                <SelectItem value="Amisys">Amisys</SelectItem>
                <SelectItem value="Xcelys">Xcelys</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              selectedPlatform
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
                  {selectedPlatform ? 'Drop XLS file here, or click to browse' : 'Select a platform first'}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">Accepts .xls and .xlsx up to 50MB</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
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
            Upload multiple files for different platforms. Claims accumulate across uploads.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}

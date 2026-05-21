'use client'

import { ClaimsTable } from '@/components/claims-table'
import type { Claim } from '@/types'

/**
 * Demo page for the ClaimsTable component
 * 
 * This page demonstrates the ClaimsTable component with sample data.
 * Navigate to /claims-table-demo to view this page.
 */

// Generate sample claims data
const generateSampleClaims = (count: number): Claim[] => {
  const classifications = ['DUAL', 'Duplicate', 'COB', 'Pricing', 'Auth', 'Corrected Claims', 'High Dollar', 'Other Pend'] as const
  const platforms = ['Facet', 'Amisys', 'Xcelys'] as const
  const statuses = ['Pending', 'Approved', 'Denied', 'In Review'] as const
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'OH', 'GA', 'PA', 'NC']
  const providers = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Emily Williams',
    'Dr. Robert Martinez',
    'Dr. Jennifer Davis',
    'Dr. David Thompson',
    'Dr. Lisa Anderson',
    'Dr. James Wilson',
    'Dr. Maria Garcia',
    'Dr. Christopher Lee',
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    claimNumber: `CLM-2024-${String(i + 1).padStart(4, '0')}`,
    classification: classifications[i % classifications.length],
    platform: platforms[i % platforms.length],
    providerName: providers[i % providers.length],
    billedAmount: Math.random() * 15000 + 500,
    status: statuses[i % statuses.length],
    confidence: Math.random() * 30 + 70, // 70-100%
    daysAged: Math.floor(Math.random() * 30),
    state: states[i % states.length],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }))
}

export default function ClaimsTableDemoPage() {
  // Generate 100 sample claims for demonstration
  const sampleClaims = generateSampleClaims(100)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ClaimsTable Component Demo</h1>
        <p className="text-muted-foreground">
          A high-performance table component with virtual scrolling, sorting, and search capabilities.
        </p>
      </div>

      <div className="mb-6 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Features Demonstrated:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Virtual scrolling for performance with large datasets</li>
          <li>Click column headers to sort (ascending → descending → unsorted)</li>
          <li>Search by claim number or provider name (debounced 300ms)</li>
          <li>Formatted currency, confidence percentages, and status badges</li>
          <li>Responsive design with horizontal scrolling</li>
          <li>Theme support (try toggling light/dark mode)</li>
        </ul>
      </div>

      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
          💡 Try These Actions:
        </h3>
        <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
          <li>• Search for a specific claim number (e.g., &quot;CLM-2024-0001&quot;)</li>
          <li>• Search for a provider name (e.g., &quot;Johnson&quot;)</li>
          <li>• Click &quot;Billed Amount&quot; to sort by price</li>
          <li>• Click &quot;Days Aged&quot; to see oldest claims first</li>
          <li>• Click &quot;Confidence&quot; to sort by confidence score</li>
          <li>• Scroll through the table to see virtual scrolling in action</li>
        </ul>
      </div>

      <ClaimsTable claims={sampleClaims} />

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Performance Metrics:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Claims:</span>
            <span className="ml-2 font-medium">{sampleClaims.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Virtual Scrolling:</span>
            <span className="ml-2 font-medium">Enabled</span>
          </div>
          <div>
            <span className="text-muted-foreground">Search Debounce:</span>
            <span className="ml-2 font-medium">300ms</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Component Usage:</h3>
        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
          <code>{`import { ClaimsTable } from '@/components/claims-table'

function MyPage() {
  const claims = // ... fetch your claims data
  
  return <ClaimsTable claims={claims} />
}`}</code>
        </pre>
      </div>
    </div>
  )
}

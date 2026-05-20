'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Database,
  GitBranch,
  CheckCircle2,
  Layers,
  ArrowRight,
  FileText,
  ShieldCheck,
  History,
} from 'lucide-react'
import { ERDiagram } from '@/components/er-diagram'

/** Field mapping entry */
interface FieldMapping {
  canonical: string
  facet: string
  amisys: string
  xcelys: string
  type: string
  required: boolean
  allowedValues?: string[]
}

const fieldMappings: FieldMapping[] = [
  { canonical: 'claimNumber', facet: 'CLM_NBR', amisys: 'CLAIM_ID', xcelys: 'ClaimRef', type: 'string', required: true },
  { canonical: 'classification', facet: 'PEND_TYPE', amisys: 'CLASS_CD', xcelys: 'PendCategory', type: 'enum', required: true, allowedValues: ['DUAL', 'Duplicate', 'COB', 'Pricing', 'Auth', 'Corrected Claims', 'High Dollar', 'Other Pend'] },
  { canonical: 'platform', facet: 'SRC_SYS', amisys: 'PLATFORM', xcelys: 'SystemOrigin', type: 'enum', required: true, allowedValues: ['Facet', 'Amisys', 'Xcelys'] },
  { canonical: 'providerName', facet: 'PROV_NAME', amisys: 'PROV_NM', xcelys: 'Provider', type: 'string', required: true },
  { canonical: 'billedAmount', facet: 'BILLED_AMT', amisys: 'BIL_AMT', xcelys: 'ChargeAmt', type: 'number', required: true },
  { canonical: 'status', facet: 'CLM_STATUS', amisys: 'STAT_CD', xcelys: 'ClaimStatus', type: 'enum', required: true, allowedValues: ['Pending', 'Approved', 'Denied', 'In Review'] },
  { canonical: 'confidence', facet: 'AI_CONF', amisys: 'CONFIDENCE', xcelys: 'ConfScore', type: 'number', required: false },
  { canonical: 'daysAged', facet: 'DAYS_PEND', amisys: 'AGE_DAYS', xcelys: 'DaysInPend', type: 'integer', required: true },
  { canonical: 'state', facet: 'MBR_STATE', amisys: 'STATE_CD', xcelys: 'MemberState', type: 'string(2)', required: true },
  { canonical: 'memberId', facet: 'MBR_ID', amisys: 'MEMBER_NBR', xcelys: 'MemberId', type: 'string', required: false },
  { canonical: 'serviceDate', facet: 'SVC_DT', amisys: 'DOS_FROM', xcelys: 'ServiceDate', type: 'date', required: false },
  { canonical: 'diagnosisCode', facet: 'DX_CD', amisys: 'DIAG_CD', xcelys: 'DiagCode', type: 'string', required: false },
]

/** Classification taxonomy */
interface TaxonomyNode {
  name: string
  code: string
  description: string
  autoResolveEligible: boolean
}

const classificationTaxonomy: TaxonomyNode[] = [
  { name: 'COB', code: 'PND-007', description: 'Coordination of Benefits — other insurance verification', autoResolveEligible: true },
  { name: 'DUAL', code: 'PND-003', description: 'Dual eligibility — Medicare/Medicaid crossover', autoResolveEligible: true },
  { name: 'Auth', code: 'PND-012', description: 'Prior authorization required or mismatch', autoResolveEligible: true },
  { name: 'High Dollar', code: 'PND-015', description: 'Billed amount exceeds threshold — senior review', autoResolveEligible: false },
  { name: 'Duplicate', code: 'PND-009', description: 'Potential duplicate claim submission', autoResolveEligible: true },
  { name: 'Pricing', code: 'PND-018', description: 'Fee schedule variance or pricing discrepancy', autoResolveEligible: true },
  { name: 'Corrected Claims', code: 'PND-021', description: 'Corrected/replacement claim processing', autoResolveEligible: true },
  { name: 'Other Pend', code: 'PND-099', description: 'Unclassified or multi-factor pend', autoResolveEligible: false },
]

/** Normalization rules */
interface NormalizationRule {
  field: string
  rule: string
  example: string
}

const normalizationRules: NormalizationRule[] = [
  { field: 'billedAmount', rule: 'Strip currency symbols, commas. Parse as float. Reject negative values.', example: '$1,234.56 → 1234.56' },
  { field: 'status', rule: 'Case-insensitive map: pending/in progress → Pending, approved/completed → Approved, denied/rejected → Denied', example: 'IN PROGRESS → Pending' },
  { field: 'confidence', rule: 'If ≤ 1.0, multiply by 100. Strip % symbol. Round to integer.', example: '0.85 → 85' },
  { field: 'state', rule: 'Uppercase, trim to 2 chars. Validate against US state codes.', example: 'texas → TX' },
  { field: 'daysAged', rule: 'Parse as integer. Floor decimal values. Reject negative.', example: '14.7 → 14' },
  { field: 'serviceDate', rule: 'Normalize to ISO 8601 (YYYY-MM-DD). Accept MM/DD/YYYY, YYYY-MM-DD, Excel serial.', example: '05/20/2025 → 2025-05-20' },
  { field: 'classification', rule: 'Case-insensitive match. Handle typos (duilicate → Duplicate). Split combined values on "+" and take first.', example: 'COB + Duplicate → COB' },
  { field: 'claimNumber', rule: 'Trim whitespace. Reject empty. Preserve alphanumeric and hyphens.', example: ' CLM-001  → CLM-001' },
]

/** Validation rules */
interface ValidationRule {
  id: string
  name: string
  condition: string
  action: string
  severity: 'error' | 'warning'
}

const validationRules: ValidationRule[] = [
  { id: 'VR-001', name: 'High Dollar threshold', condition: 'classification = "High Dollar" AND billedAmount < $50,000', action: 'Reclassify to "Other Pend" or reject', severity: 'warning' },
  { id: 'VR-002', name: 'Confidence range', condition: 'confidence < 0 OR confidence > 100', action: 'Reject row — invalid confidence score', severity: 'error' },
  { id: 'VR-003', name: 'Approved requires confidence', condition: 'status = "Approved" AND confidence = 0', action: 'Flag for review — auto-approval without AI score', severity: 'warning' },
  { id: 'VR-004', name: 'State code format', condition: 'state NOT IN valid US state codes', action: 'Reject row — invalid state', severity: 'error' },
  { id: 'VR-005', name: 'Duplicate claim number', condition: 'claimNumber already exists in store', action: 'Skip row — duplicate detected', severity: 'warning' },
  { id: 'VR-006', name: 'Future service date', condition: 'serviceDate > today', action: 'Flag for review — future date of service', severity: 'warning' },
  { id: 'VR-007', name: 'Billed amount zero', condition: 'billedAmount = 0 AND status ≠ "Denied"', action: 'Flag for review — zero-dollar claim not denied', severity: 'warning' },
  { id: 'VR-008', name: 'Days aged negative', condition: 'daysAged < 0', action: 'Reject row — negative age impossible', severity: 'error' },
  { id: 'VR-009', name: 'Missing provider', condition: 'providerName is empty or null', action: 'Reject row — provider required for adjudication', severity: 'error' },
  { id: 'VR-010', name: 'COB without member ID', condition: 'classification = "COB" AND memberId is empty', action: 'Flag for review — COB requires member lookup', severity: 'warning' },
]

/** Schema changelog */
interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

const schemaChangelog: ChangelogEntry[] = [
  {
    version: 'v2.4',
    date: '2026-05-15',
    changes: [
      'Added diagnosisCode field (optional) for clinical pend routing',
      'Added VR-010 validation: COB claims require memberId',
      'Updated confidence normalization to handle percentage strings (e.g., "85%")',
    ],
  },
  {
    version: 'v2.3',
    date: '2026-04-02',
    changes: [
      'Added serviceDate field (optional) for timely filing validation',
      'Added memberId field (optional) for eligibility lookups',
      'New normalization rule for combined classifications (COB + Duplicate → COB)',
    ],
  },
  {
    version: 'v2.2',
    date: '2026-02-18',
    changes: [
      'Added "Corrected Claims" to classification taxonomy (PND-021)',
      'Updated status normalization: "in progress" now maps to "Pending"',
      'Added VR-006 and VR-007 validation rules',
    ],
  },
  {
    version: 'v2.1',
    date: '2025-12-10',
    changes: [
      'Added confidence field to canonical schema',
      'Introduced auto-resolve eligibility flag on taxonomy',
      'Added High Dollar threshold validation (VR-001)',
    ],
  },
  {
    version: 'v2.0',
    date: '2025-10-01',
    changes: [
      'Major schema revision — migrated from flat file to structured ontology',
      'Added Xcelys platform support (3rd source system)',
      'Introduced normalization rules engine',
      'Entity relationship model defined',
    ],
  },
]

type SectionKey = 'mapping' | 'taxonomy' | 'normalization' | 'validation' | 'changelog'

export default function DataOntologyPage() {
  const [activeSection, setActiveSection] = React.useState<SectionKey>('mapping')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Data Ontology</h1>
        <p className="text-xs text-muted-foreground">Schema mappings, classification taxonomy, normalization rules, and validation constraints across platforms</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-500/20 p-2">
              <Database className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">3</p>
              <p className="text-[10px] text-muted-foreground">Source Platforms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-500/20 p-2">
              <Layers className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{fieldMappings.length}</p>
              <p className="text-[10px] text-muted-foreground">Canonical Fields</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-purple-500/20 p-2">
              <GitBranch className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{classificationTaxonomy.length}</p>
              <p className="text-[10px] text-muted-foreground">Pend Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-red-500/20 p-2">
              <ShieldCheck className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{validationRules.length}</p>
              <p className="text-[10px] text-muted-foreground">Validation Rules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-amber-500/20 p-2">
              <FileText className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold">v2.4</p>
              <p className="text-[10px] text-muted-foreground">Schema Version</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {[
          { key: 'mapping' as const, label: 'Field Mapping' },
          { key: 'taxonomy' as const, label: 'Classification Taxonomy' },
          { key: 'normalization' as const, label: 'Normalization Rules' },
          { key: 'validation' as const, label: 'Validation Rules' },
          { key: 'changelog' as const, label: 'Schema Changelog' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={cn(
              'px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
              activeSection === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Field Mapping Table */}
      {activeSection === 'mapping' && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground">
                Maps source platform fields to the canonical PendResolve schema. Used by the Adapter agent during intake.
              </p>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Canonical Field</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Facet</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Amisys</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Xcelys</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Allowed Values</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldMappings.map((field) => (
                    <tr key={field.canonical} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-medium text-primary">{field.canonical}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-muted-foreground">{field.facet}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-muted-foreground">{field.amisys}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-muted-foreground">{field.xcelys}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-mono">
                          {field.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {field.allowedValues ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {field.allowedValues.map((v) => (
                              <span key={v} className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono">
                                {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {field.required ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classification Taxonomy */}
      {activeSection === 'taxonomy' && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground">
                Pend classification categories with their codes and auto-resolve eligibility.
              </p>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Auto-Resolve</th>
                  </tr>
                </thead>
                <tbody>
                  {classificationTaxonomy.map((node) => (
                    <tr key={node.code} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{node.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-mono">
                          {node.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[300px]">{node.description}</td>
                      <td className="px-4 py-2.5 text-center">
                        {node.autoResolveEligible ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            HITL Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Normalization Rules */}
      {activeSection === 'normalization' && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground">
                Rules applied during intake to standardize values from different source platforms into the canonical schema.
              </p>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Field</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Normalization Rule</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizationRules.map((rule) => (
                    <tr key={rule.field} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-medium text-primary">{rule.field}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[350px]">{rule.rule}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{rule.example.split('→')[0]?.trim()}</code>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <code className="rounded bg-green-500/10 border-green-500/30 border px-1.5 py-0.5 text-[10px] text-green-400">
                            {rule.example.split('→')[1]?.trim()}
                          </code>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Rules */}
      {activeSection === 'validation' && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground">
                Cross-field constraints enforced during intake. Errors reject the row; warnings flag for review but allow ingestion.
              </p>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rule Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Condition</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {validationRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-mono">{rule.id}</span>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{rule.name}</td>
                      <td className="px-4 py-2.5">
                        <code className="text-[10px] text-muted-foreground">{rule.condition}</code>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{rule.action}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                          rule.severity === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}>
                          {rule.severity === 'error' ? 'Error' : 'Warning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schema Changelog */}
      {activeSection === 'changelog' && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground">
                Version history of the canonical schema. Each release documents field additions, rule changes, and platform updates.
              </p>
            </div>
            <div className="divide-y">
              {schemaChangelog.map((entry) => (
                <div key={entry.version} className="px-4 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold">{entry.version}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                    {entry.version === 'v2.4' && (
                      <span className="inline-flex rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-medium text-green-400">
                        Current
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1 ml-5">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entity Relationship Diagram */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold mb-3">Entity Relationship Diagram</h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            Visual data model showing how entities relate in the claims ontology. Drag nodes to rearrange layout. Use scroll to zoom and controls (bottom-left) to fit view.
          </p>
          <div className="relative">
            <ERDiagram />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  Network,
  GitBranch,
  BookOpen,
  Workflow,
  Database,
} from 'lucide-react'

type Tab = 'entity-graph' | 'concept-hierarchy' | 'domain-vocabulary' | 'inference-rules' | 'data-lineage'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'entity-graph', label: 'Entity Graph', icon: <Network className="h-3.5 w-3.5" /> },
  { id: 'concept-hierarchy', label: 'Concept Hierarchy', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'domain-vocabulary', label: 'Domain Vocabulary', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: 'inference-rules', label: 'Inference Rules', icon: <Workflow className="h-3.5 w-3.5" /> },
  { id: 'data-lineage', label: 'Data Lineage', icon: <Database className="h-3.5 w-3.5" /> },
]

const entityRelationships = [
  { from: 'Claim', relation: 'has', to: 'HoldCode', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
  { from: 'Claim', relation: 'has', to: 'DetailLines (CPT)', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
  { from: 'Claim', relation: 'belongs_to', to: 'Member', color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/5' },
  { from: 'Member', relation: 'covered_by', to: 'Insurance', color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/5' },
  { from: 'Insurance', relation: 'issues', to: 'EOB', color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/5' },
  { from: 'EOB', relation: 'proves', to: 'Payment', color: 'text-cyan-400', bg: 'border-cyan-500/30 bg-cyan-500/5' },
  { from: 'Payment', relation: 'determines', to: 'Coordination', color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5' },
]

const domainVocabulary = [
  { term: 'CPT', category: 'Procedure Code', definition: 'Current Procedural Terminology code identifying medical service', example: '99213 (Office visit)' },
  { term: 'EOB', category: 'Document', definition: 'Explanation of Benefits from primary insurance carrier', example: 'Medicare EOB showing $407.07 paid' },
  { term: 'PR', category: 'Adjustment', definition: 'Patient Responsibility adjustment group code', example: 'PR-3 (Copay amount)' },
  { term: 'CO', category: 'Adjustment', definition: 'Contractual Obligation adjustment group code', example: 'CO-45 (Exceeds fee schedule)' },
  { term: 'DOS', category: 'Date', definition: 'Date of Service when medical service was rendered', example: '06/15/2025' },
  { term: 'COB', category: 'Process', definition: 'Coordination of Benefits between multiple insurance carriers', example: 'Medicare primary, Cigna secondary' },
]

const inferenceRules = [
  { condition: 'IF PR-3 AND Insurance=Medicare', conclusion: 'THEN PayAsSecondary', category: 'Payment', color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/5' },
  { condition: 'IF History=\'H\'', conclusion: 'THEN AlreadyProcessed', category: 'Status', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
  { condition: 'IF HoldCode IN (COBOC, COBHD) AND History≠\'H\'', conclusion: 'THEN ContinueCOBReview', category: 'Routing', color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/5' },
  { condition: 'IF DaysAged > StateLimit', conclusion: 'THEN DenyTimelyFiling', category: 'Denial', color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5' },
  { condition: 'IF EOB.Insurance ≠ COBHistory.PrimaryInsurance', conclusion: 'THEN DenyDN017/DN018', category: 'Denial', color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/5' },
]

const dataLineage = [
  { field: 'claim_number', source: 'Core Claims Platform', table: 'claims', agent: 'Intake Adapter' },
  { field: 'hold_code', source: 'Core Claims Platform', table: 'claim_hold_codes', agent: 'Hold Code Agent' },
  { field: 'primary_insurance', source: 'Member360/Eligibility API', table: 'claim_cob_history', agent: 'Eligibility Agent' },
  { field: 'eob_paid_amt', source: 'S3 Document Store (OCR)', table: 'claim_eob_extraction', agent: 'Eligibility Agent' },
  { field: 'received_date', source: 'Core Claims Platform', table: 'claim_header_detail', agent: 'Timely Filing Agent' },
]

export default function SemanticOntologyPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('entity-graph')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Semantic Ontology</h1>
        <p className="text-xs text-muted-foreground">
          Domain model, entity relationships, and semantic meaning of healthcare claims data used by the agentic system
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'entity-graph' && <EntityGraphTab />}
        {activeTab === 'concept-hierarchy' && <ConceptHierarchyTab />}
        {activeTab === 'domain-vocabulary' && <DomainVocabularyTab />}
        {activeTab === 'inference-rules' && <InferenceRulesTab />}
        {activeTab === 'data-lineage' && <DataLineageTab />}
      </div>
    </div>
  )
}

function EntityGraphTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-4">Entity Relationships</h3>
          <div className="space-y-3">
            {entityRelationships.map((rel, i) => (
              <div key={i} className={cn('flex items-center gap-3 rounded-lg border p-3', rel.bg)}>
                <span className="rounded bg-card px-2 py-1 text-xs font-semibold border">{rel.from}</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-px w-6 bg-muted-foreground/30" />
                  <span className={cn('text-[10px] font-medium', rel.color)}>{rel.relation}</span>
                  <div className="h-px w-6 bg-muted-foreground/30" />
                  <span className="text-muted-foreground">→</span>
                </div>
                <span className="rounded bg-card px-2 py-1 text-xs font-semibold border">{rel.to}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2">Relationship Types</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-muted-foreground">Composition (has)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-muted-foreground">Association (belongs_to)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="text-muted-foreground">Coverage (covered_by)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Production (issues)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-muted-foreground">Evidence (proves)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Determination (determines)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConceptHierarchyTab() {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-4">Claims Processing Domain Hierarchy</h3>
        <div className="font-mono text-xs space-y-0.5">
          {/* Root */}
          <TreeNode label="Claims Processing" level={0} isRoot />

          {/* COB Branch */}
          <TreeNode label="Coordination of Benefits (COB)" level={1} hasChildren />
          <TreeNode label="Primary Payer Determination" level={2} hasChildren />
          <TreeNode label="Birthday Rule" level={3} />
          <TreeNode label="MSP Guidelines" level={3} />
          <TreeNode label="Employer Group Size" level={3} isLast />
          <TreeNode label="Secondary Payment Calculation" level={2} hasChildren />
          <TreeNode label="Maintenance of Benefits" level={3} />
          <TreeNode label="Non-Duplication of Benefits" level={3} isLast />
          <TreeNode label="Denial Determination" level={2} hasChildren isLast />
          <TreeNode label="Timely Filing" level={3} />
          <TreeNode label="Non-Participating Provider" level={3} />
          <TreeNode label="Coverage Termination" level={3} isLast />

          {/* Hold Code Branch */}
          <TreeNode label="Hold Code Classification" level={1} hasChildren />
          <TreeNode label="COB Holds (COBOC, COBHD, COBPR)" level={2} />
          <TreeNode label="System Holds (TSSD, AUTH)" level={2} />
          <TreeNode label="Duplicate Holds (EXDUC)" level={2} isLast />

          {/* Financial Branch */}
          <TreeNode label="Financial Adjudication" level={1} hasChildren isLast />
          <TreeNode label="Allowed Amount" level={2} />
          <TreeNode label="Non-Covered Amount" level={2} />
          <TreeNode label="Net Payable" level={2} isLast />
        </div>
      </CardContent>
    </Card>
  )
}

function TreeNode({ label, level, isRoot, hasChildren, isLast }: {
  label: string
  level: number
  isRoot?: boolean
  hasChildren?: boolean
  isLast?: boolean
}) {
  const indent = level * 24

  return (
    <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
      {!isRoot && (
        <span className="text-muted-foreground/50 mr-1.5">
          {isLast ? '└── ' : '├── '}
        </span>
      )}
      <span className={cn(
        isRoot && 'font-bold text-sm text-foreground',
        hasChildren && !isRoot && 'font-semibold text-foreground',
        !hasChildren && !isRoot && 'text-muted-foreground',
      )}>
        {isRoot && '📋 '}{label}
      </span>
    </div>
  )
}

function DomainVocabularyTab() {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Domain Vocabulary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Term</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Category</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Definition</th>
                <th className="pb-2 font-semibold text-muted-foreground">Example</th>
              </tr>
            </thead>
            <tbody>
              {domainVocabulary.map((v) => (
                <tr key={v.term} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-blue-400">{v.term}</td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{v.category}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{v.definition}</td>
                  <td className="py-2.5 font-mono text-muted-foreground">{v.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function InferenceRulesTab() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Agent Inference Rules</h3>
      {inferenceRules.map((rule, i) => (
        <Card key={i} className={cn('border', rule.bg)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', rule.color)}>
                {rule.category}
              </span>
            </div>
            <div className="font-mono text-xs space-y-1">
              <p className="text-muted-foreground">{rule.condition}</p>
              <p className={cn('font-semibold', rule.color)}>{rule.conclusion}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DataLineageTab() {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Data Field Lineage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Field</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Source System</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Table</th>
                <th className="pb-2 font-semibold text-muted-foreground">Responsible Agent</th>
              </tr>
            </thead>
            <tbody>
              {dataLineage.map((d) => (
                <tr key={d.field} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-cyan-400">{d.field}</td>
                  <td className="py-2.5 pr-4">{d.source}</td>
                  <td className="py-2.5 pr-4 font-mono text-muted-foreground">{d.table}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {d.agent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

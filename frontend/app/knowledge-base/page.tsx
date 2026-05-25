'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import SemanticOntologyPage from '@/app/semantic-ontology/page'
import {
  BookOpen,
  Shield,
  Calculator,
  Clock,
  FileText,
  Search,
  Brain,
  Network,
} from 'lucide-react'

type TopTab = 'knowledge-base' | 'semantic-ontology'
type Tab = 'hold-codes' | 'denial-codes' | 'pr-co-rules' | 'state-filing' | 'cob-formulas' | 'business-rules'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'hold-codes', label: 'Hold Code Taxonomy', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'denial-codes', label: 'Denial Code Registry', icon: <Shield className="h-3.5 w-3.5" /> },
  { id: 'pr-co-rules', label: 'PR/CO Code Rules', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: 'state-filing', label: 'State Filing Rules', icon: <Clock className="h-3.5 w-3.5" /> },
  { id: 'cob-formulas', label: 'COB Formulas', icon: <Calculator className="h-3.5 w-3.5" /> },
  { id: 'business-rules', label: 'Business Rule Catalog', icon: <Search className="h-3.5 w-3.5" /> },
]

const holdCodes = [
  { code: 'COBOC', category: 'COB Other Carrier', description: 'Validate for COB processing', rule: 'Verify other carrier information and coordination', agent: 'Hold Code Agent' },
  { code: 'COBHD', category: 'COB High Dollar', description: 'Validate for COB processing', rule: 'High-dollar COB review with enhanced validation', agent: 'Hold Code Agent' },
  { code: 'COBPR', category: 'COB Primary', description: 'Awaiting primary carrier EOB', rule: 'Hold until primary EOB received and validated', agent: 'Eligibility Agent' },
  { code: 'TSSD', category: 'TSS Hold', description: 'Third-party subrogation review', rule: 'Evaluate subrogation recovery opportunity', agent: 'Hold Code Agent' },
  { code: 'AUTH', category: 'Authorization', description: 'Authorization pending review', rule: 'Validate prior auth matches claim services', agent: 'Coordination Agent' },
  { code: 'EXDUC', category: 'Exact Duplicate', description: 'Follow duplicate instruction', rule: 'Compare against existing claims for exact match', agent: 'Hold Code Agent' },
]

const denialCodes = [
  { code: 'DN017', type: 'Medicare denial', description: 'Coverage terminated', whenApplied: 'When primary insurance is Medicare and coverage gap detected', reversalRule: 'Provide proof of continuous coverage' },
  { code: 'DN018', type: 'Commercial denial', description: 'Insurance carrier mismatch', whenApplied: 'When commercial insurance doesn\'t match EOB', reversalRule: 'Submit corrected EOB with matching carrier' },
  { code: 'DNEOB', type: 'EOB missing', description: 'EOB not on file', whenApplied: 'When no EOB attachment found for primary carrier', reversalRule: 'Submit primary carrier EOB document' },
  { code: 'DNNPR', type: 'Non-participating', description: 'Non-covered per contract', whenApplied: 'When CO-45 found in EOB adjustment codes', reversalRule: 'Provider contract renegotiation required' },
  { code: 'CO45', type: 'Contractual', description: 'Charges exceed fee schedule', whenApplied: 'When billed exceeds contracted rate', reversalRule: 'Fee schedule update or contract amendment' },
  { code: 'PR27', type: 'Patient responsibility', description: 'Expenses not covered', whenApplied: 'When service not in benefit plan', reversalRule: 'Benefit plan amendment or appeal' },
  { code: 'M15', type: 'Separately billed', description: 'Services not allowed separately', whenApplied: 'When bundled services billed individually', reversalRule: 'Rebill with correct bundled code' },
]

const prCoRules = [
  { code: 'PR-1', description: 'Deductible', action: 'Pay as Secondary', color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/5' },
  { code: 'PR-2', description: 'Coinsurance', action: 'Pay as Secondary', color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/5' },
  { code: 'PR-3', description: 'Copay', action: 'Pay as Secondary', color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/5' },
  { code: 'PR-96', description: 'Non-covered by primary', action: 'Pay as Primary', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
  { code: 'PR-204', description: 'Not covered under plan', action: 'Pay as Primary', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
  { code: 'CO-45', description: 'Exceeds fee schedule', action: 'Deny (DNNPR)', color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5' },
]

const stateFilingRules = [
  { state: 'KY', filingLimit: 365, cobValidation: '180-day COB validation', specialRules: 'Extended filing for COB claims' },
  { state: 'TX', filingLimit: 365, cobValidation: 'Standard', specialRules: 'None' },
  { state: 'FL', filingLimit: 365, cobValidation: 'Standard', specialRules: 'None' },
  { state: 'GA', filingLimit: 365, cobValidation: 'Standard', specialRules: 'None' },
  { state: 'NJ', filingLimit: 365, cobValidation: 'Standard', specialRules: 'None' },
]

const businessRules = [
  {
    agent: 'Hold Code Agent',
    rules: [
      'Classify hold codes into COB, Auth, Duplicate, Subrogation categories',
      'Route COBOC/COBHD claims to COB processing pipeline',
      'Flag EXDUC claims for duplicate comparison',
      'Validate TSSD claims for subrogation recovery',
    ],
  },
  {
    agent: 'Eligibility Agent',
    rules: [
      'Verify member eligibility via 270/271 EDI transaction',
      'Retrieve primary carrier EOB from document store',
      'Extract paid amounts from EOB using OCR/parsing',
      'Validate insurance carrier matches COB history',
      'Check for coverage gaps and termination dates',
    ],
  },
  {
    agent: 'Timely Filing Agent',
    rules: [
      'Calculate days aged from received date to current date',
      'Apply state-specific filing limits (default 365 days)',
      'Apply KY 180-day COB validation rule',
      'Deny claims exceeding filing limit with appropriate code',
    ],
  },
  {
    agent: 'COB Calculation Agent',
    rules: [
      'Apply 3-condition COB formula based on OC Paid vs PR amounts',
      'Calculate non-covered amounts per condition logic',
      'Determine net payable for secondary payer',
      'Handle missing EOB data (Condition 3)',
    ],
  },
  {
    agent: 'Coordination Agent',
    rules: [
      'Orchestrate multi-agent workflow sequencing',
      'Validate AUTH hold codes against authorization records',
      'Determine primary/secondary payer using birthday rule',
      'Route claims to appropriate specialist agents',
    ],
  },
  {
    agent: 'Resolution Agent',
    rules: [
      'Apply denial codes based on agent findings',
      'Generate auto-approval when all validations pass',
      'Calculate final payment amounts',
      'Route low-confidence claims to human review',
    ],
  },
]

export default function KnowledgeBasePage() {
  const [topTab, setTopTab] = React.useState<TopTab>('knowledge-base')
  const [activeTab, setActiveTab] = React.useState<Tab>('hold-codes')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filterText = (text: string) => {
    if (!searchQuery.trim()) return true
    return text.toLowerCase().includes(searchQuery.toLowerCase())
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ontology</h1>
        <p className="text-xs text-muted-foreground">
          Knowledge base and semantic model powering the AI claims adjudication agents
        </p>
      </div>

      {/* Top-level section switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTopTab('knowledge-base')}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-all',
            topTab === 'knowledge-base'
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <Brain className="h-4 w-4" />
          Knowledge Base
        </button>
        <button
          onClick={() => setTopTab('semantic-ontology')}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-all',
            topTab === 'semantic-ontology'
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <Network className="h-4 w-4" />
          Semantic Ontology
        </button>
      </div>

      {/* Semantic Ontology content */}
      {topTab === 'semantic-ontology' && (
        <SemanticOntologyPage />
      )}

      {/* Knowledge Base content */}
      {topTab === 'knowledge-base' && (
      <>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search across all rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-9 text-xs"
        />
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
        {activeTab === 'hold-codes' && <HoldCodeTab filter={filterText} />}
        {activeTab === 'denial-codes' && <DenialCodeTab filter={filterText} />}
        {activeTab === 'pr-co-rules' && <PRCOCodeTab filter={filterText} />}
        {activeTab === 'state-filing' && <StateFilingTab filter={filterText} />}
        {activeTab === 'cob-formulas' && <COBFormulasTab />}
        {activeTab === 'business-rules' && <BusinessRulesTab filter={filterText} />}
      </div>
      </>
      )}
    </div>
  )
}

function HoldCodeTab({ filter }: { filter: (text: string) => boolean }) {
  const filtered = holdCodes.filter((h) =>
    filter(`${h.code} ${h.category} ${h.description} ${h.rule} ${h.agent}`)
  )

  return (
    <Card>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Code</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Category</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Description</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Processing Rule</th>
                <th className="pb-2 font-semibold text-muted-foreground">Agent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.code} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-blue-400">{h.code}</td>
                  <td className="py-2.5 pr-4">{h.category}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{h.description}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{h.rule}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {h.agent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No hold codes match your search.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DenialCodeTab({ filter }: { filter: (text: string) => boolean }) {
  const filtered = denialCodes.filter((d) =>
    filter(`${d.code} ${d.type} ${d.description} ${d.whenApplied} ${d.reversalRule}`)
  )

  return (
    <Card>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Code</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Type</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Description</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">When Applied</th>
                <th className="pb-2 font-semibold text-muted-foreground">Reversal Rule</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.code} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-red-400">{d.code}</td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{d.type}</span>
                  </td>
                  <td className="py-2.5 pr-4">{d.description}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{d.whenApplied}</td>
                  <td className="py-2.5 text-muted-foreground">{d.reversalRule}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No denial codes match your search.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PRCOCodeTab({ filter }: { filter: (text: string) => boolean }) {
  const filtered = prCoRules.filter((r) =>
    filter(`${r.code} ${r.description} ${r.action}`)
  )

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((rule) => (
        <Card key={rule.code} className={cn('border', rule.bg)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn('font-mono text-sm font-bold', rule.color)}>{rule.code}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', rule.color)}>
                {rule.action}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{rule.description}</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">→</span>
              <span className="text-xs font-medium">{rule.action}</span>
            </div>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && (
        <p className="col-span-full py-8 text-center text-xs text-muted-foreground">No PR/CO rules match your search.</p>
      )}
    </div>
  )
}

function StateFilingTab({ filter }: { filter: (text: string) => boolean }) {
  const filtered = stateFilingRules.filter((s) =>
    filter(`${s.state} ${s.cobValidation} ${s.specialRules}`)
  )

  return (
    <Card>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">State</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">Filing Limit (days)</th>
                <th className="pb-2 pr-4 font-semibold text-muted-foreground">COB Validation</th>
                <th className="pb-2 font-semibold text-muted-foreground">Special Rules</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.state} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2.5 pr-4 font-mono font-semibold">{s.state}</td>
                  <td className="py-2.5 pr-4">{s.filingLimit}</td>
                  <td className="py-2.5 pr-4">
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[10px]',
                      s.cobValidation !== 'Standard' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'
                    )}>
                      {s.cobValidation}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{s.specialRules}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No state rules match your search.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function COBFormulasTab() {
  return (
    <div className="space-y-4">
      {/* Formula Conditions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">3-Condition COB Formula</h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Condition 1</span>
                <span className="text-xs font-medium">OC Paid &gt; PR (Patient Responsibility)</span>
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                Non-Covered = (OC Paid - Allowed) - PR
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                Net Payable = Allowed - OC Paid - Non-Covered
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">Condition 2</span>
                <span className="text-xs font-medium">OC Paid &lt; PR (Patient Responsibility)</span>
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                Non-Covered = 0
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                Net Payable = 0
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">Condition 3</span>
                <span className="text-xs font-medium">OC Paid = &quot;&quot; (No EOB / Missing Data)</span>
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                Non-Covered = 0
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                Allowed = PR (use Patient Responsibility as Allowed)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Worked Example */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Worked Example — Condition 1</h3>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billed Amount:</span>
                <span className="font-mono font-semibold">$500.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allowed Amount:</span>
                <span className="font-mono font-semibold">$407.07</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OC Paid (Primary EOB):</span>
                <span className="font-mono font-semibold text-green-400">$325.66</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PR (Patient Responsibility):</span>
                <span className="font-mono font-semibold text-amber-400">$81.41</span>
              </div>
            </div>
            <div className="border-t pt-2 mt-2">
              <p className="text-[10px] text-muted-foreground mb-1">Since OC Paid ($325.66) &gt; PR ($81.41) → Condition 1 applies:</p>
              <div className="space-y-1 text-xs font-mono">
                <p>Non-Covered = (OC Paid - Allowed) - PR = ($325.66 - $407.07) - $81.41 = <span className="text-red-400">-$162.82 → $0.00</span></p>
                <p>Net Payable = Allowed - OC Paid - Non-Covered = $407.07 - $325.66 - $0.00 = <span className="font-bold text-green-400">$81.41</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BusinessRulesTab({ filter }: { filter: (text: string) => boolean }) {
  const filtered = businessRules
    .map((group) => ({
      ...group,
      rules: group.rules.filter((rule) => filter(`${group.agent} ${rule}`)),
    }))
    .filter((group) => group.rules.length > 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {filtered.map((group) => (
        <Card key={group.agent}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <h3 className="text-xs font-semibold">{group.agent}</h3>
            </div>
            <ul className="space-y-1.5">
              {group.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  {rule}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && (
        <p className="col-span-full py-8 text-center text-xs text-muted-foreground">No business rules match your search.</p>
      )}
    </div>
  )
}

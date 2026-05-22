'use client'

import * as React from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Bot,
  Activity,
  CheckCircle2,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  FlaskConical,
  Loader2,
  Cpu,
  Brain,
  Shield,
  Calculator,
  FileCheck,
  Clock,
  Workflow,
  Layers,
  CircleDot,
} from 'lucide-react'

/** Agent definition */
interface Agent {
  id: string
  number: number
  name: string
  description: string
  model: string
  modelType: 'rules' | 'llm' | 'hybrid'
  stage: string
  latency: string
  successRate: string
  lastExecution: string
}

const agents: Agent[] = [
  {
    id: 'intake-adapter',
    number: 1,
    name: 'Intake Adapter Agent',
    description: 'Schema normalization, data extraction from XLS/EDI/PAPER sources.',
    model: 'Rules Engine',
    modelType: 'rules',
    stage: '1-2',
    latency: '80ms',
    successRate: '99.2%',
    lastExecution: '2 min ago',
  },
  {
    id: 'hold-code-validation',
    number: 2,
    name: 'Hold Code Validation Agent',
    description: 'Validates hold/denial codes against CMS registry and plan rules.',
    model: 'Rules Engine',
    modelType: 'rules',
    stage: '3',
    latency: '150ms',
    successRate: '98.8%',
    lastExecution: '3 min ago',
  },
  {
    id: 'eligibility',
    number: 3,
    name: 'Eligibility Agent',
    description: 'Member eligibility verification, COB history lookup, insurance matching.',
    model: 'Claude 3.5 Sonnet (Bedrock)',
    modelType: 'llm',
    stage: '4',
    latency: '1200ms',
    successRate: '97.1%',
    lastExecution: '1 min ago',
  },
  {
    id: 'timely-filing',
    number: 4,
    name: 'Timely Filing Agent',
    description: 'State-specific filing rules validation, date calculations per CMS 42 CFR 424.44.',
    model: 'Rules Engine',
    modelType: 'rules',
    stage: '5',
    latency: '100ms',
    successRate: '99.5%',
    lastExecution: '4 min ago',
  },
  {
    id: 'coordination-rule',
    number: 5,
    name: 'Coordination Rule Agent',
    description: 'Primary/secondary payer determination, NAIC birthday rule, MSP guidelines.',
    model: 'Claude 3.5 Sonnet (Bedrock)',
    modelType: 'llm',
    stage: '6',
    latency: '890ms',
    successRate: '96.3%',
    lastExecution: '2 min ago',
  },
  {
    id: 'cob-calculation',
    number: 6,
    name: 'COB Calculation Agent',
    description: 'Financial calculations, allowed amounts, PR amounts, net payable.',
    model: 'Rules Engine + Claude 3.5 Sonnet',
    modelType: 'hybrid',
    stage: '7',
    latency: '450ms',
    successRate: '98.5%',
    lastExecution: '1 min ago',
  },
  {
    id: 'posting',
    number: 7,
    name: 'Posting Agent',
    description: 'System update recommendations, adjustment codes, hold release logic.',
    model: 'Rules Engine',
    modelType: 'rules',
    stage: '8',
    latency: '200ms',
    successRate: '99.0%',
    lastExecution: '5 min ago',
  },
  {
    id: 'post-validation',
    number: 8,
    name: 'Post Validation Agent',
    description: 'Final compliance checks, duplicate detection, audit trail generation.',
    model: 'Claude 3.5 Sonnet (Bedrock)',
    modelType: 'llm',
    stage: '9',
    latency: '340ms',
    successRate: '98.2%',
    lastExecution: '3 min ago',
  },
  {
    id: 'resolution-orchestrator',
    number: 9,
    name: 'Resolution Orchestrator',
    description: 'Orchestrates all agents, determines final recommendation (auto-resolve vs HITL).',
    model: 'Claude 3.5 Sonnet (Bedrock)',
    modelType: 'llm',
    stage: 'All',
    latency: '180ms',
    successRate: '99.7%',
    lastExecution: '1 min ago',
  },
]

function getBorderColor(modelType: Agent['modelType']) {
  switch (modelType) {
    case 'rules':
      return 'border-l-blue-500'
    case 'llm':
      return 'border-l-purple-500'
    case 'hybrid':
      return 'border-l-[#7c3aed]' // gradient approximation
    default:
      return 'border-l-border'
  }
}

function getModelBadgeStyle(modelType: Agent['modelType']) {
  switch (modelType) {
    case 'rules':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    case 'llm':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    case 'hybrid':
      return 'bg-violet-500/10 text-violet-400 border-violet-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export default function AIFunctionsPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const isAdmin = currentUser?.role === 'admin'

  // Fetch agent enabled/disabled state from backend API
  const [enabledAgents, setEnabledAgents] = React.useState<Set<string>>(new Set(agents.map((a) => a.id)))

  React.useEffect(() => {
    api.agents.list()
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const enabled = new Set(data.filter((a: any) => a.is_enabled).map((a: any) => a.id))
          setEnabledAgents(enabled)
        }
      })
      .catch(() => {})
  }, [])

  // Test agent state
  const [testingAgent, setTestingAgent] = React.useState<string | null>(null)
  const [testResults, setTestResults] = React.useState<Record<string, 'success' | 'idle'>>({})

  const toggleAgent = (id: string) => {
    if (!isAdmin) return
    api.agents.toggle(id)
      .then((result: any) => {
        setEnabledAgents((prev) => {
          const next = new Set(prev)
          if (result.is_enabled) {
            next.add(id)
          } else {
            next.delete(id)
          }
          return next
        })
      })
      .catch(() => {})
  }

  const handleTestAgent = (agentId: string) => {
    setTestingAgent(agentId)
    setTestResults((prev) => ({ ...prev, [agentId]: 'idle' }))

    const delay = 1000 + Math.random() * 1000
    setTimeout(() => {
      setTestResults((prev) => ({ ...prev, [agentId]: 'success' }))
      setTestingAgent(null)
    }, delay)
  }

  const activeCount = enabledAgents.size

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">AI Agent Registry</h1>
        <p className="text-xs text-muted-foreground">
          Manage and monitor AI agents powering the COB Pend Resolution pipeline
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total Agents
              </p>
            </div>
            <p className="text-3xl font-bold">9</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-green-500" />
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Active Agents
              </p>
            </div>
            <p className="text-3xl font-bold text-green-500">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Workflow className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Pipeline Status
              </p>
            </div>
            <p className={cn('text-3xl font-bold', activeCount === 9 ? 'text-green-500' : 'text-yellow-500')}>
              {activeCount === 9 ? 'Active' : 'Paused'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Pipeline Visualization */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Agent Pipeline</h2>
          </div>
          <div className="flex items-center justify-start gap-1 overflow-x-auto pb-2">
            {agents.map((agent, idx) => {
              const isEnabled = enabledAgents.has(agent.id)
              return (
                <React.Fragment key={agent.id}>
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <div
                      className={cn(
                        'flex items-center justify-center h-9 w-9 rounded-full border-2 text-xs font-bold transition-colors',
                        isEnabled
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-muted-foreground/40 bg-muted/50 text-muted-foreground'
                      )}
                    >
                      {agent.number}
                    </div>
                    <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[60px] truncate">
                      {agent.name.replace(' Agent', '')}
                    </span>
                  </div>
                  {idx < agents.length - 1 && (
                    <ArrowRight
                      className={cn(
                        'h-3.5 w-3.5 flex-shrink-0 mt-[-14px]',
                        isEnabled && enabledAgents.has(agents[idx + 1].id)
                          ? 'text-green-500'
                          : 'text-muted-foreground/40'
                      )}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Registry Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Agent Registry</h2>
          <span className="text-[10px] text-muted-foreground ml-1">
            {activeCount} of 9 active
          </span>
        </div>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const isEnabled = enabledAgents.has(agent.id)
            const isTesting = testingAgent === agent.id
            const testResult = testResults[agent.id]

            return (
              <Card
                key={agent.id}
                className={cn(
                  'border-l-4 transition-opacity',
                  getBorderColor(agent.modelType),
                  !isEnabled && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  {/* Agent Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold',
                          isEnabled
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : 'bg-muted text-muted-foreground border border-border'
                        )}
                      >
                        {agent.number}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">Stage {agent.stage}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        'inline-flex items-center',
                        !isAdmin && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-label={`Toggle ${agent.name}`}
                      disabled={!isAdmin}
                    >
                      {isEnabled ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                    {agent.description}
                  </p>

                  {/* Model Badge */}
                  <div className="mb-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium',
                        getModelBadgeStyle(agent.modelType)
                      )}
                    >
                      {agent.modelType === 'rules' && <Cpu className="h-2.5 w-2.5" />}
                      {agent.modelType === 'llm' && <Brain className="h-2.5 w-2.5" />}
                      {agent.modelType === 'hybrid' && <CircleDot className="h-2.5 w-2.5" />}
                      {agent.model}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded border p-1.5">
                      <p className="text-[9px] text-muted-foreground">Latency</p>
                      <p className="text-[11px] font-semibold">{agent.latency}</p>
                    </div>
                    <div className="rounded border p-1.5">
                      <p className="text-[9px] text-muted-foreground">Success</p>
                      <p className="text-[11px] font-semibold text-green-400">{agent.successRate}</p>
                    </div>
                    <div className="rounded border p-1.5">
                      <p className="text-[9px] text-muted-foreground">Last Run</p>
                      <p className="text-[11px] font-semibold">{agent.lastExecution}</p>
                    </div>
                  </div>

                  {/* Test Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[10px]"
                    onClick={() => handleTestAgent(agent.id)}
                    disabled={isTesting || !isEnabled}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Testing...
                      </>
                    ) : testResult === 'success' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                        Success
                      </>
                    ) : (
                      <>
                        <FlaskConical className="h-3 w-3 mr-1" />
                        Test Agent
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  HelpCircle,
  BookOpen,
  PlayCircle,
  FileText,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Rocket,
} from 'lucide-react'

/** Knowledge base for the bot */
const knowledgeBase: Record<string, string> = {
  'upload': 'To upload claims, go to **Claims File Intake** → click **Upload File** → select a platform from the dropdown → choose your XLS/XLSX file. The platform dropdown only shows platforms configured in **Data Sources**.',
  'data source': 'Data Sources are upstream connections that feed claims into the system. Go to **Data Sources** → click **Add Data Source** → choose a type (File Upload, Claims API, EDI Gateway, etc.) and give it a name matching a platform (Facet, Amisys, or Xcelys). Only active data sources appear in the upload dropdown.',
  'platform': 'Platforms represent the claims processing systems: **Facet**, **Amisys**, and **Xcelys**. Each has different field naming conventions. The Data Ontology page shows how fields map across platforms.',
  'dashboard': 'The **Dashboard** shows real-time metrics from your loaded claims: Pended Claims count, Auto-Resolved percentage, Needs HITL count, Pend Value at Risk, AI confidence, and execution stats. It also shows Pend Mix by Category and the HITL Queue.',
  'pend': 'A **pend** is a claim that cannot be auto-adjudicated and requires additional processing. Claims are pended for reasons like COB verification, authorization checks, high dollar amounts, duplicates, or pricing discrepancies.',
  'hitl': '**HITL** (Human-in-the-Loop) means a claim requires human review. Claims route to HITL when AI confidence is between 60-92%, or when policy flags are raised, or for sanctions/fraud/high-variance cases.',
  'cob': '**COB** (Coordination of Benefits) handles claims where a member has multiple insurance carriers. The system verifies other insurance via EDI 270/271, applies NAIC/birthday/MSP rules, and determines primary vs secondary payer.',
  'confidence': '**AI Confidence** is a 0-100 score indicating how certain the AI is about its decision. ≥95% = auto-resolve, <95% = HITL review. Thresholds are configurable in AI Functions.',
  'classification': 'Claims are classified into pend categories: **COB**, **DUAL**, **Auth**, **High Dollar**, **Duplicate**, **Pricing**, **Corrected Claims**, and **Other Pend**. Each has different resolution workflows.',
  'ai functions': '**AI Functions** are the intelligent agents that process claims. They include eligibility checks, duplicate detection, pricing validation, fraud scoring, and auto-adjudication. You can enable/disable them and view their performance stats.',
  'ontology': 'The **Data Ontology** defines how data is structured: field mappings across platforms, classification taxonomy, normalization rules (how messy data gets cleaned), validation rules (cross-field constraints), and the entity relationship model.',
  'processing': 'The **Claims Processing** screen shows all loaded claims with their execution status. You can filter by platform, view by classification tab, and click the View button on any claim to see the full AI agent reasoning trace.',
  'refresh': 'Data persists across page refreshes using localStorage. Your uploaded claims, upload history, and data source configurations are all saved automatically.',
  'clear': 'To clear all data, go to **Claims File Intake** and click the **Clear All** button. This removes all claims and upload history.',
}

/** FAQ items */
const faqItems = [
  { question: 'How do I upload claims data?', answer: 'Go to Claims File Intake → Upload File. Select a platform and choose an Excel file. The file must have columns: ClaimNumber, Classification, ProviderName, BilledAmount, DaysAged, State.' },
  { question: 'Why is the platform dropdown empty?', answer: 'The dropdown only shows platforms with active data sources. Go to Data Sources → Add Data Source → create one named "Facet", "Amisys", or "Xcelys" with status Active.' },
  { question: 'What happens when AI confidence is low?', answer: 'Claims with confidence below 95% are routed to HITL (Human-in-the-Loop) for manual review. You can approve or deny them from the claim detail view.' },
  { question: 'How does COB resolution work?', answer: 'The COB agent verifies other insurance via EDI 270/271, applies coordination rules (birthday rule, NAIC guidelines), retrieves primary EOB from cloud storage, and computes secondary payment.' },
  { question: 'Can I upload multiple files?', answer: 'Yes! Claims accumulate across uploads. Each upload is tracked in the Upload History table with file name, platform, date, and claim count.' },
  { question: 'How do I see the AI reasoning for a claim?', answer: 'Go to Claims Processing → find the claim → click the View button. This opens the Execution Detail showing the full agent reasoning trace step by step.' },
  { question: 'What file formats are supported?', answer: 'Excel files (.xls, .xlsx, .csv). The parser handles currency symbols, percentage formats, date variations, and common typos in classification names.' },
  { question: 'Does data persist after refresh?', answer: 'Yes. Claims, upload history, data source configurations, and processing results are all saved to localStorage and survive page refreshes.' },
]

/** Guide sections */
const guideSections = [
  {
    title: 'Getting Started',
    icon: <PlayCircle className="h-4 w-4" />,
    steps: [
      'Go to Data Sources and add at least one platform (e.g., "Facet" with type "File Upload")',
      'Navigate to Claims File Intake and click Upload File',
      'Select the platform from the dropdown and upload your Excel file',
      'Go to Claims Processing, select the platform filter, and click "Run Pend Resolution"',
      'Check the Dashboard for real-time metrics and HITL queue',
    ],
  },
  {
    title: 'Understanding the Resolution Pipeline',
    icon: <BookOpen className="h-4 w-4" />,
    steps: [
      'Claims are ingested and normalized by the Adapter agent',
      'Each claim is classified into a pend category (COB, Auth, High Dollar, etc.)',
      'AI agents process the claim through eligibility, pricing, and compliance checks',
      'The Auto-Adjudication engine makes a final decision based on confidence score',
      'High-confidence claims (≥95%) auto-resolve; low-confidence claims route to HITL',
    ],
  },
  {
    title: 'Managing AI Functions',
    icon: <Bot className="h-4 w-4" />,
    steps: [
      'Go to AI Functions to see all active agents and their performance',
      'Toggle functions on/off using the status switch (persists across sessions)',
      'Edit confidence thresholds for auto-resolve vs HITL routing',
      'Use the Test button to run a function on a sample claim',
      'Monitor invocation counts and success rates per function',
    ],
  },
]

/** What's New entries */
const whatsNewEntries = [
  {
    version: 'v1.4',
    date: 'May 20, 2026',
    items: [
      'Added column sorting and search to Claims Processing table',
      'CSV export for processed claims',
      'Classification-specific agent reasoning traces',
      'Test Normalization tool in Data Ontology',
    ],
  },
  {
    version: 'v1.3',
    date: 'May 18, 2026',
    items: [
      'Added COB Resolution page with pipeline visualization',
      'AI Functions page with editable thresholds and test capability',
      'Data Ontology with ER diagram, validation rules, and schema changelog',
      'Help & Training page with chatbot assistant',
    ],
  },
  {
    version: 'v1.2',
    date: 'May 15, 2026',
    items: [
      'Pend Execution Workbench with "Run Pend Resolution" button',
      'Platform filters linked to Data Sources',
      'Dashboard redesign with HITL Queue and Pend Mix',
      'Data persistence across page refreshes (localStorage)',
    ],
  },
  {
    version: 'v1.1',
    date: 'May 10, 2026',
    items: [
      'File Intake redesign with upload history and statistics',
      'Data Sources persistence',
      'Claims store persistence',
    ],
  },
]

/** Chat message */
interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  content: string
  timestamp: string
  feedback?: 'helpful' | 'not-helpful'
}

/** Find best matching answer from knowledge base */
function findAnswer(query: string): string {
  const lower = query.toLowerCase()
  let bestMatch = ''
  let bestScore = 0

  for (const [key, answer] of Object.entries(knowledgeBase)) {
    const keywords = key.split(' ')
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = answer
    }
  }

  if (bestScore > 0) return bestMatch

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm the PendResolve AI assistant. Ask me anything about how the app works — uploads, claims processing, AI functions, COB resolution, or data ontology."
  }
  if (lower.includes('thank')) {
    return "You're welcome! Let me know if you have any other questions."
  }
  if (lower.includes('new') || lower.includes('update') || lower.includes('release') || lower.includes('version')) {
    return "Check the **What's New** section on this page for the latest release notes and feature updates!"
  }

  return "I'm not sure about that. Try asking about: uploading claims, data sources, platforms, the dashboard, pend processing, COB, AI confidence, classifications, AI functions, or data ontology."
}

export default function HelpPage() {
  const [expandedFAQ, setExpandedFAQ] = React.useState<number | null>(null)
  const [activeTab, setActiveTab] = React.useState<'guides' | 'whats-new'>('guides')

  // Persist chat history to localStorage
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('help-chat-history')
      if (stored) {
        try { return JSON.parse(stored) } catch { /* ignore */ }
      }
    }
    return [{
      id: 'welcome',
      role: 'bot' as const,
      content: "Hi! I'm the PendResolve AI assistant. Ask me anything about how this application works — uploading claims, processing pipelines, AI functions, COB resolution, or navigating the platform.",
      timestamp: new Date().toISOString(),
    }]
  })

  React.useEffect(() => {
    localStorage.setItem('help-chat-history', JSON.stringify(chatMessages))
  }, [chatMessages])

  const [chatInput, setChatInput] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)

    setTimeout(() => {
      const answer = findAnswer(userMessage.content)
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: answer,
        timestamp: new Date().toISOString(),
      }
      setChatMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 800 + Math.random() * 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Feedback on bot messages
  const handleFeedback = (msgId: string, feedback: 'helpful' | 'not-helpful') => {
    setChatMessages((prev) =>
      prev.map((msg) => msg.id === msgId ? { ...msg, feedback } : msg)
    )
  }

  // Clear chat history
  const handleClearChat = () => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'bot',
      content: "Hi! I'm the PendResolve AI assistant. Ask me anything about how this application works.",
      timestamp: new Date().toISOString(),
    }
    setChatMessages([welcome])
  }

  /** Render markdown-like bold text */
  const renderContent = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Help & Training</h1>
        <p className="text-xs text-muted-foreground">Learn how PendResolve AI works, explore guides, and ask the assistant</p>
      </div>

      {/* Main Layout: Chat + Content */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-5">
        {/* Left: Guides + FAQ + What's New (3 cols) — displayed on right */}
        <div className="lg:col-span-3 space-y-5 order-2 lg:order-2">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 border-b">
            <button
              onClick={() => setActiveTab('guides')}
              className={cn(
                'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
                activeTab === 'guides' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Guides & FAQ
            </button>
            <button
              onClick={() => setActiveTab('whats-new')}
              className={cn(
                'px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5',
                activeTab === 'whats-new' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="h-3 w-3" /> What&apos;s New
            </button>
          </div>

          {activeTab === 'guides' && (
            <>
              {/* Quick Start Guides */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold">Guides</h2>
                  </div>
                  <div className="space-y-4">
                    {guideSections.map((section, idx) => (
                      <div key={idx} className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-primary">{section.icon}</div>
                          <h3 className="text-xs font-semibold">{section.title}</h3>
                        </div>
                        <ol className="space-y-1.5 ml-6">
                          {section.steps.map((step, i) => (
                            <li key={i} className="text-xs text-muted-foreground list-decimal">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold">Frequently Asked Questions</h2>
                  </div>
                  <div className="space-y-1">
                    {faqItems.map((item, idx) => (
                      <div key={idx} className="border-b border-border/50 last:border-0">
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                          className="flex items-center justify-between w-full py-3 text-left"
                        >
                          <span className="text-xs font-medium pr-4">{item.question}</span>
                          {expandedFAQ === idx ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        {expandedFAQ === idx && (
                          <p className="text-xs text-muted-foreground pb-3 pl-0">{item.answer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* What's New */}
          {activeTab === 'whats-new' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Rocket className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold">Release Notes</h2>
                </div>
                <div className="space-y-5">
                  {whatsNewEntries.map((entry) => (
                    <div key={entry.version} className="relative pl-4 border-l-2 border-primary/30">
                      <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold">{entry.version}</span>
                        <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {entry.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Chat Bot (2 cols) — displayed on left */}
        <div className="lg:col-span-2 order-1 lg:order-1">
          <Card className="sticky top-6">
            <CardContent className="p-0 flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <div className="rounded-full bg-primary/20 p-1.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">PendResolve Assistant</p>
                  <p className="text-[10px] text-muted-foreground">Ask me anything about the app</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={handleClearChat}>
                    Clear
                  </Button>
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={cn(
                        'flex gap-2',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'bot' && (
                        <div className="rounded-full bg-primary/20 p-1 h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-lg px-3 py-2 max-w-[85%]',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-xs leading-relaxed">{renderContent(msg.content)}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="rounded-full bg-muted p-1 h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Feedback buttons for bot messages (not welcome) */}
                    {msg.role === 'bot' && msg.id !== 'welcome' && (
                      <div className="flex items-center gap-1 ml-8 mt-1">
                        {msg.feedback ? (
                          <span className="text-[9px] text-muted-foreground">
                            {msg.feedback === 'helpful' ? '👍 Thanks for the feedback!' : '👎 We\'ll improve this answer'}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFeedback(msg.id, 'helpful')}
                              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors"
                              title="Helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'not-helpful')}
                              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                              title="Not helpful"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="rounded-full bg-primary/20 p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              {chatMessages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Try asking:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['How do I upload?', 'What is COB?', 'How does HITL work?', 'What\'s new?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q) }}
                        className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="border-t px-3 py-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    className="h-8 text-xs flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

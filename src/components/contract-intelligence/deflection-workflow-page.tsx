'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'

import {
  ArrowRight,
  CheckCircle,
  Zap,
  AlertTriangle,
  MessageSquare,
  Mail,
  Share2,
  FileText,
  Users,
  BookOpen,
  RefreshCw,
  ChevronRight,
  CircleDot,
  Plus,
  Upload,
  Paperclip,
  Scale,
  CornerDownLeft,
  Mic,
  Copy,
  Download as DownloadIcon,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ListPlus,
  SquarePen,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SvgIcon } from '@/components/svg-icon'
import { Spinner } from '@/components/ui/spinner'
import ThinkingState from '@/components/thinking-state'
import { TextLoop } from '../../../components/motion-primitives/text-loop'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

/* ── Chat types ────────────────────────────────────────────────────────── */
type Message = {
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'artifact' | 'files'
  isLoading?: boolean
  thinkingContent?: { summary: string; bullets: string[] }
  loadingState?: { showSummary: boolean; visibleBullets: number }
  showThinking?: boolean
}

interface ChatThread {
  id: string
  title: string
  messages: Message[]
  isLoading: boolean
}

function getThinkingContent(variant: 'analysis' | 'draft' | 'review') {
  switch (variant) {
    case 'draft':
      return { summary: 'Planning structure and content before drafting the document.', bullets: ['Identify audience and objective', 'Assemble relevant facts and authorities', 'Outline sections and key arguments'] }
    case 'review':
      return { summary: 'Parsing materials and selecting fields for a concise comparison.', bullets: ['Locate documents and parse key terms', 'Normalize entities and dates', 'Populate rows and verify data consistency'] }
    default:
      return { summary: 'Analyzing the request and gathering relevant information.', bullets: ['Understanding the context and requirements', 'Searching through contract documents', 'Preparing comprehensive response'] }
  }
}

/* ── Design tokens ──────────────────────────────────────────────────────── */
const hy = {
  bg: {
    base: 'var(--bg-base)',
    baseHover: 'var(--bg-base-hover)',
    subtle: 'var(--bg-subtle)',
    component: 'var(--bg-component)',
    input: 'var(--bg-input)',
    interactive: 'var(--bg-interactive)',
  },
  fg: {
    base: 'var(--fg-base)',
    subtle: 'var(--fg-subtle)',
    muted: 'var(--fg-muted)',
    disabled: 'var(--fg-disabled)',
    onColor: 'var(--fg-on-color)',
  },
  border: {
    base: 'var(--border-base)',
    strong: 'var(--border-strong)',
  },
  ui: {
    success: { fg: 'var(--ui-success-fg)', bg: 'var(--ui-success-bg)' },
    warning: { fg: 'var(--ui-warning-fg)', bg: 'var(--ui-warning-bg)' },
    danger:  { fg: 'var(--ui-danger-fg)',  bg: 'var(--ui-danger-bg)' },
    neutral: { fg: 'var(--fg-muted)', bg: 'var(--bg-subtle)' },
    blue:    { fg: 'var(--ui-blue-fg)',    bg: 'var(--ui-blue-bg)' },
    gold:    { fg: 'var(--ui-warning-fg)', bg: 'var(--ui-warning-bg)' },
  },
  radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 },
}

/* ── Sample contracts flowing through the workflow ──────────────────────── */
type Outcome = 'deflected' | 'escalated'
type Channel = 'Teams' | 'Email' | 'Shared Spaces'

interface WorkflowContract {
  id: string
  name: string
  counterparty: string
  submittedBy: string
  channel: Channel
  type: string
  outcome: Outcome
  deflectionReason?: string   // why Harvey auto-resolved
  escalationReason?: string  // why Harvey escalated
  playbookMatch?: string
  harveyNote: string
  turnaround: string
  billingTerms?: string      // extracted post-execution
}

const contracts: WorkflowContract[] = [
  {
    id: 'w1',
    name: 'Standard NDA — Consultant Onboarding',
    counterparty: 'Bright Future LLC',
    submittedBy: 'HR Portal',
    channel: 'Teams',
    type: 'NDA',
    outcome: 'deflected',
    deflectionReason: 'Matched NDA Playbook v4.2 — all terms within standard positions',
    playbookMatch: 'NDA Playbook',
    harveyNote: 'Reviewed against NDA Playbook. 2-year confidentiality period, standard residual knowledge carve-out included. No deviations. Turned and sent back.',
    turnaround: '4 min',
    billingTerms: 'No billing terms — NDA only',
  },
  {
    id: 'w2',
    name: 'Vendor Services Agreement — IT Equipment',
    counterparty: 'TechSupply Co.',
    submittedBy: 'Ops Portal',
    channel: 'Email',
    type: 'Vendor',
    outcome: 'deflected',
    deflectionReason: 'Matched Vendor Services Playbook — Net 45, liability cap within standard range',
    playbookMatch: 'Vendor Services Playbook',
    harveyNote: 'All key terms within golden clause positions. Net 45 payment, 3× annual fee liability cap, standard IP assignment. Auto-approved and returned.',
    turnaround: '7 min',
    billingTerms: 'Net 45 · $84K annual · auto-renewal 60-day opt-out',
  },
  {
    id: 'w3',
    name: 'Programmatic Advertising Partnership Agreement',
    counterparty: 'GroupM Nexus',
    submittedBy: 'Alicia Torres',
    channel: 'Teams',
    type: 'Advertising',
    outcome: 'escalated',
    escalationReason: 'Brand safety clause deviates — counterparty requesting mutual obligations. AI/ML data rights clause is ambiguous.',
    playbookMatch: 'Advertising Agreement Playbook',
    harveyNote: 'Two material deviations flagged. Brand safety clause requests mutual model (golden position: unilateral). Clause 8.3 permits "performance optimization" — broad enough to cover model training. Attorney review required.',
    turnaround: '11 min to legal queue',
    billingTerms: '$4.2M · quarterly invoicing · 30-day payment',
  },
  {
    id: 'w4',
    name: 'Influencer Marketing Agreement',
    counterparty: 'Spark Creative Studio',
    submittedBy: 'Priya Mehta',
    channel: 'Email',
    type: 'Advertising',
    outcome: 'deflected',
    deflectionReason: 'Matched Advertising Agreement Playbook — IP, exclusivity, and payment all within standard range',
    playbookMatch: 'Advertising Agreement Playbook',
    harveyNote: 'Standard influencer terms. IP assignment clear, payment schedule monthly, exclusivity limited to campaign window. No escalation needed.',
    turnaround: '6 min',
    billingTerms: '$42K · monthly payments · 90-day campaign',
  },
  {
    id: 'w5',
    name: 'Cloud Infrastructure — EU Regional Deployment',
    counterparty: 'Siemens Digital',
    submittedBy: 'Marcus Chen',
    channel: 'Shared Spaces',
    type: 'Vendor',
    outcome: 'escalated',
    escalationReason: 'Critical DORA compliance gap — 5-day incident reporting window, undisclosed sub-contractor chain.',
    playbookMatch: 'Vendor Services Playbook',
    harveyNote: 'DORA Article 28 compliance gap. Incident reporting window is 5 days — DORA requires 72 hours for critical ICT providers. Sub-contractor list absent. Non-negotiable for EU deployment. Harvey has drafted required addendum.',
    turnaround: '9 min to legal queue',
    billingTerms: '$8.1M · annual · milestone-based',
  },
]

const channelIcon: Record<Channel, React.ReactNode> = {
  'Teams':         <MessageSquare size={11} />,
  'Email':         <Mail size={11} />,
  'Shared Spaces': <Share2 size={11} />,
}
const channelColor: Record<Channel, { fg: string; bg: string }> = {
  'Teams':         hy.ui.blue,
  'Email':         { fg: 'hsl(260,47%,44%)', bg: 'hsl(251,91%,95%)' },
  'Shared Spaces': hy.ui.gold,
}

/* ── Workflow stage definitions ─────────────────────────────────────────── */
const stages = [
  { id: 'intake',    label: 'Intake',          sub: 'Business submits contract',       owner: 'business' },
  { id: 'harvey',   label: 'Harvey Reviews',   sub: 'Playbooks · golden clauses · risk', owner: 'harvey'   },
  { id: 'decision', label: 'Deflect or Route', sub: 'Auto-resolved or escalated',      owner: 'harvey'   },
  { id: 'legal',    label: 'Legal (if needed)', sub: "Harvey\u2019s first pass ready",    owner: 'legal'    },
  { id: 'execute',  label: 'Execution',        sub: 'Signed · billing extracted',      owner: 'business' },
]

const ownerColor: Record<string, { fg: string; bg: string; label: string }> = {
  business: { fg: hy.ui.neutral.fg, bg: hy.ui.neutral.bg, label: 'Business' },
  harvey:   { fg: hy.ui.blue.fg,    bg: hy.ui.blue.bg,    label: 'Harvey'   },
  legal:    { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: 'Legal'    },
}

/* ── Contract detail drawer ─────────────────────────────────────────────── */
function ContractDrawer({ contract, onClose }: { contract: WorkflowContract; onClose: () => void }) {
  const isDeflected = contract.outcome === 'deflected'
  const outcome = isDeflected
    ? { fg: hy.ui.success.fg, bg: hy.ui.success.bg, label: 'Auto-resolved · sent back' }
    : { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: 'Escalated to legal' }

  return (
    <div style={{ borderRadius: hy.radius.lg, border: `2px solid ${isDeflected ? hy.ui.success.fg : hy.ui.warning.fg}33`, overflow: 'hidden', background: hy.bg.base }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>{contract.name}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: outcome.bg, color: outcome.fg, flexShrink: 0 }}>
              {outcome.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 11, color: hy.fg.muted }}>{contract.counterparty} · {contract.type}</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 999, background: channelColor[contract.channel].bg }}>
              <span style={{ color: channelColor[contract.channel].fg }}>{channelIcon[contract.channel]}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: channelColor[contract.channel].fg }}>{contract.channel}</span>
            </div>
            <span style={{ fontSize: 11, color: hy.fg.muted }}>submitted by {contract.submittedBy}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ fontSize: 11, color: hy.fg.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          {"Close"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Left: Harvey's workflow trace */}
        <div style={{ padding: '16px 20px', borderRight: `1px solid ${hy.border.base}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 14 }}>{"Harvey's trace"}</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: hy.ui.blue.fg }}>1</span>
                </div>
                <div style={{ width: 1, flex: 1, background: hy.border.base, minHeight: 12 }} />
              </div>
              <div style={{ paddingBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.base, marginBottom: 2 }}>{"Intake"}</div>
                <div style={{ fontSize: 11, color: hy.fg.muted }}>Received via {contract.channel} · routed to Harvey</div>
              </div>
            </div>
            {/* Step 2 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={9} color={hy.ui.blue.fg} />
                </div>
                <div style={{ width: 1, flex: 1, background: hy.border.base, minHeight: 12 }} />
              </div>
              <div style={{ paddingBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.base, marginBottom: 2 }}>{"Harvey reviewed"}</div>
                <div style={{ fontSize: 11, color: hy.fg.muted }}>Matched against {contract.playbookMatch} · scored risk · compared against golden clauses</div>
              </div>
            </div>
            {/* Step 3 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 999, background: isDeflected ? hy.ui.success.bg : hy.ui.warning.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isDeflected
                  ? <CheckCircle size={10} color={hy.ui.success.fg} />
                  : <AlertTriangle size={10} color={hy.ui.warning.fg} />}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isDeflected ? hy.ui.success.fg : hy.ui.warning.fg, marginBottom: 2 }}>
                  {isDeflected ? "Auto-resolved" : "Escalated to legal"}
                </div>
                <div style={{ fontSize: 11, color: hy.fg.muted }}>{isDeflected ? contract.deflectionReason : contract.escalationReason}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Harvey's note + billing */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 10 }}>{"Harvey's summary"}</div>
          <div style={{ padding: '10px 12px', borderRadius: hy.radius.md, background: hy.ui.blue.bg, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Zap size={11} color={hy.ui.blue.fg} style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: hy.ui.blue.fg, lineHeight: 1.55, margin: 0 }}>{contract.harveyNote}</p>
            </div>
          </div>
          {contract.billingTerms && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>{"Extracted billing terms"}</div>
              <div style={{ padding: '8px 12px', borderRadius: hy.radius.md, background: hy.ui.success.bg, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <CheckCircle size={11} color={hy.ui.success.fg} style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: hy.ui.success.fg }}>{contract.billingTerms}</span>
              </div>
            </>
          )}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ padding: '3px 10px', borderRadius: 999, background: hy.bg.component, border: `1px solid ${hy.border.base}` }}>
              <span style={{ fontSize: 11, color: hy.fg.muted }}>⏱ {contract.turnaround}</span>
            </div>
            {isDeflected && (
              <span style={{ fontSize: 11, color: hy.ui.success.fg, fontWeight: 500 }}>{"No lawyer involved"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export function DeflectionWorkflowPage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedContract = contracts.find((c) => c.id === selectedId) ?? null

  const deflected = contracts.filter((c) => c.outcome === 'deflected')
  const escalated = contracts.filter((c) => c.outcome === 'escalated')
  const deflectionRate = Math.round((deflected.length / contracts.length) * 100)

  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null)
  const activeChatIdRef = useRef<string | null>(null)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)
  const setActiveChatId = useCallback((id: string | null) => { activeChatIdRef.current = id; setActiveChatIdState(id) }, [])
  const activeChat = chatThreads.find(c => c.id === activeChatId)
  const chatMessages = activeChat?.messages || []
  const isChatLoading = activeChat?.isLoading || false
  const updateChatById = useCallback((chatId: string, updater: (chat: ChatThread) => ChatThread) => { setChatThreads(prev => prev.map(chat => chat.id === chatId ? updater(chat) : chat)) }, [])
  const createNewChat = useCallback(() => { const id = `chat-${Date.now()}`; setChatThreads(prev => [...prev, { id, title: 'Untitled', messages: [], isLoading: false }]); setActiveChatId(id) }, [setActiveChatId])
  const ensureChatExists = useCallback((): string => { const cur = activeChatIdRef.current; if (!cur) { const id = `chat-${Date.now()}`; setChatThreads(prev => [...prev, { id, title: 'Untitled', messages: [], isLoading: false }]); setActiveChatId(id); return id }; return cur }, [setActiveChatId])
  const [chatInputValue, setChatInputValue] = useState('')
  const [isChatInputFocused, setIsChatInputFocused] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBottomGradient, setShowBottomGradient] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInChatMode = chatThreads.length > 0
  const scrollToBottom = useCallback((smooth = true) => { if (messagesContainerRef.current) messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }) }, [])
  useEffect(() => { const h = () => { if (messagesContainerRef.current) { const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current; setIsScrolled(scrollTop > 0); const d = scrollHeight - scrollTop - clientHeight; setIsNearBottom(d < 100); setShowBottomGradient(d > 1) } }; const c = messagesContainerRef.current; if (c) { c.addEventListener('scroll', h); h() }; return () => { if (c) c.removeEventListener('scroll', h) } }, [])
  useEffect(() => { if (isNearBottom && chatMessages.length > 0) { const t = setTimeout(() => scrollToBottom(), 100); return () => clearTimeout(t) } }, [chatMessages, isNearBottom, scrollToBottom])
  const generateResponse = (query: string): string => { const q = query.toLowerCase(); if (q.includes('deflect') || q.includes('automat')) return "Based on your deflection workflow data, Harvey is currently auto-handling 72% of incoming contracts. The remaining 28% are escalated for legal review due to non-standard terms or high-value thresholds.\n\nWould you like me to analyze which contract types could be further automated?"; if (q.includes('escalat') || q.includes('review')) return "Currently escalated contracts:\n\n• **3 contracts** flagged for non-standard indemnification\n• **2 contracts** exceeding $500K threshold\n• **1 contract** with unusual IP assignment terms\n\nWould you like me to draft review notes for any of these?"; return `I'm analyzing your deflection workflow data related to "${query}". I can help with automation rules, escalation analysis, or workflow optimization. What would you like to focus on?` }
  const sendMessage = useCallback((messageText?: string) => { const text = messageText || chatInputValue; if (!text.trim() || isChatLoading) return; const chatId = ensureChatExists(); const title = text.length > 40 ? text.substring(0, 40) + '...' : text; const userMessage: Message = { role: 'user', content: text, type: 'text' }; const thinkingContent = getThinkingContent('analysis'); const assistantMessage: Message = { role: 'assistant', content: '', type: 'text', isLoading: true, thinkingContent, loadingState: { showSummary: false, visibleBullets: 0 } }; updateChatById(chatId, chat => ({ ...chat, isLoading: true, title: chat.messages.length === 0 ? title : chat.title, messages: [...chat.messages, userMessage, assistantMessage] })); setChatInputValue(''); if (textareaRef.current) textareaRef.current.style.height = '20px'; setTimeout(() => scrollToBottom(), 50); setTimeout(() => { updateChatById(chatId, chat => ({ ...chat, messages: chat.messages.map((msg, idx) => idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading ? { ...msg, loadingState: { ...msg.loadingState!, showSummary: true } } : msg) })); scrollToBottom() }, 600); thinkingContent.bullets.forEach((_, bulletIdx) => { setTimeout(() => { updateChatById(chatId, chat => ({ ...chat, messages: chat.messages.map((msg, idx) => idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading ? { ...msg, loadingState: { ...msg.loadingState!, visibleBullets: bulletIdx + 1 } } : msg) })); scrollToBottom() }, 1000 + (bulletIdx * 400)) }); setTimeout(() => { updateChatById(chatId, chat => ({ ...chat, isLoading: false, messages: chat.messages.map((msg, idx) => idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading ? { ...msg, content: generateResponse(text), isLoading: false } : msg) })); setTimeout(() => scrollToBottom(), 100) }, 2500) }, [chatInputValue, isChatLoading, ensureChatExists, updateChatById, scrollToBottom])

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg-base">
      {/* Left side */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Page Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-base shrink-0">
          <div className="flex items-center gap-1">
            <div className="flex items-center text-sm">
              <span className="font-medium text-fg-base" style={{ padding: '4px 6px' }}>Deflection Workflow</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isChatPanelOpen && (
              <button onClick={() => setIsChatPanelOpen(true)} className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors">
                <SvgIcon src="/central_icons/Assistant.svg" alt="Open chat" width={16} height={16} className="text-fg-base" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="medium" className="gap-1.5"><Plus className="h-4 w-4" />Create</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem><FileText className="w-4 h-4" /><span>Create contract</span></DropdownMenuItem>
                <DropdownMenuItem><Upload className="w-4 h-4" /><span>Upload contract</span></DropdownMenuItem>
                <DropdownMenuItem><Zap className="w-4 h-4" /><span>Use a workflow</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { value: `${deflectionRate}%`, label: 'contracts fully deflected', color: hy.ui.success },
              { value: `<10 min`, label: 'avg Harvey turnaround', color: hy.ui.blue },
              { value: '0', label: 'lawyer hours on deflected work', color: hy.ui.success },
              { value: `${escalated.length}`, label: 'contracts need legal review', color: hy.ui.warning },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color.fg, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: hy.fg.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pipeline flow diagram */}
          <div style={{ marginBottom: 28, padding: '20px 24px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 18 }}>{"Workflow — who owns each stage"}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {stages.map((stage, i) => {
                const oc = ownerColor[stage.owner]
                return (
                  <React.Fragment key={stage.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ padding: '12px 14px', borderRadius: hy.radius.md, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderTop: `3px solid ${oc.fg}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base, marginBottom: 3 }}>{stage.label}</div>
                        <div style={{ fontSize: 10, color: hy.fg.muted, marginBottom: 8 }}>{stage.sub}</div>
                        <div style={{ display: 'inline-flex', padding: '1px 7px', borderRadius: 999, background: oc.bg }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: oc.fg, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{oc.label}</span>
                        </div>
                      </div>
                    </div>
                    {i < stages.length - 1 && (
                      <ChevronRight size={16} color={hy.fg.muted} style={{ flexShrink: 0, margin: '0 4px' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Deflection split */}
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 14px', borderRadius: hy.radius.md, background: hy.ui.success.bg, border: `1px solid ${hy.ui.success.fg}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={16} color={hy.ui.success.fg} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hy.ui.success.fg }}>{"Auto-resolved track"}</div>
                  <div style={{ fontSize: 11, color: hy.ui.success.fg, opacity: 0.8 }}>{"Harvey reviews → turns contract → sends back to submitter. No lawyer."}</div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: hy.radius.md, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} color={hy.ui.warning.fg} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hy.ui.warning.fg }}>{"Legal review track"}</div>
                  <div style={{ fontSize: 11, color: hy.ui.warning.fg, opacity: 0.8 }}>{"Harvey's first pass + flagged issues ready. Attorney reviews only what matters."}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Two-column contract list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

            {/* Deflected */}
            <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: hy.ui.success.bg, borderBottom: `1px solid ${hy.ui.success.fg}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} color={hy.ui.success.fg} />
                <span style={{ fontSize: 13, fontWeight: 600, color: hy.ui.success.fg }}>{"Auto-resolved"}</span>
                <span style={{ fontSize: 12, color: hy.ui.success.fg, opacity: 0.7 }}>{"— no lawyer involved"}</span>
                <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 800, color: hy.ui.success.fg }}>{deflected.length}</span>
              </div>
              {deflected.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                  style={{ padding: '12px 18px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', cursor: 'pointer', background: selectedId === c.id ? hy.bg.subtle : hy.bg.base, transition: 'background 100ms' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 999, background: channelColor[c.channel].bg }}>
                          <span style={{ color: channelColor[c.channel].fg }}>{channelIcon[c.channel]}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, color: channelColor[c.channel].fg }}>{c.channel}</span>
                        </div>
                        <span style={{ fontSize: 10, color: hy.fg.muted }}>{c.counterparty}</span>
                        <span style={{ fontSize: 10, color: hy.ui.success.fg, fontWeight: 500 }}>⏱ {c.turnaround}</span>
                      </div>
                    </div>
                    <ChevronRight size={13} color={hy.fg.muted} style={{ marginTop: 2, transform: selectedId === c.id ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Escalated */}
            <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: hy.ui.warning.bg, borderBottom: `1px solid ${hy.ui.warning.fg}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color={hy.ui.warning.fg} />
                <span style={{ fontSize: 13, fontWeight: 600, color: hy.ui.warning.fg }}>{"Escalated to legal"}</span>
                <span style={{ fontSize: 12, color: hy.ui.warning.fg, opacity: 0.7 }}>{"— Harvey's first pass ready"}</span>
                <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 800, color: hy.ui.warning.fg }}>{escalated.length}</span>
              </div>
              {escalated.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                  style={{ padding: '12px 18px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', cursor: 'pointer', background: selectedId === c.id ? hy.bg.subtle : hy.bg.base, transition: 'background 100ms' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 999, background: channelColor[c.channel].bg }}>
                          <span style={{ color: channelColor[c.channel].fg }}>{channelIcon[c.channel]}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, color: channelColor[c.channel].fg }}>{c.channel}</span>
                        </div>
                        <span style={{ fontSize: 10, color: hy.fg.muted }}>{c.counterparty}</span>
                        <span style={{ fontSize: 10, color: hy.ui.warning.fg, fontWeight: 500 }}>⏱ {c.turnaround}</span>
                      </div>
                    </div>
                    <ChevronRight size={13} color={hy.fg.muted} style={{ marginTop: 2, transform: selectedId === c.id ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded contract detail */}
          {selectedContract && (
            <div style={{ marginBottom: 28 }}>
              <ContractDrawer contract={selectedContract} onClose={() => setSelectedId(null)} />
            </div>
          )}

          {/* Learning loop */}
          <div style={{ padding: '18px 22px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <RefreshCw size={14} color={hy.ui.blue.fg} />
              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Continuous learning loop"}</span>
              <span style={{ fontSize: 12, color: hy.fg.muted }}>{"— deflection rate improves over time"}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: <FileText size={13} color={hy.ui.blue.fg} />, label: 'Attorney decisions feed back into playbooks', bg: hy.ui.blue.bg, fg: hy.ui.blue.fg },
                { icon: <BookOpen size={13} color={hy.ui.warning.fg} />, label: 'Playbook rules update from negotiation outcomes', bg: hy.ui.warning.bg, fg: hy.ui.warning.fg },
                { icon: <Zap size={13} color={hy.ui.success.fg} />, label: 'Harvey scores more contracts automatically', bg: hy.ui.success.bg, fg: hy.ui.success.fg },
                { icon: <Users size={13} color={hy.fg.muted} />, label: 'Fewer contracts reach legal over time', bg: hy.bg.component, fg: hy.fg.subtle },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: hy.radius.md, background: item.bg, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</div>
                  <span style={{ fontSize: 11, color: item.fg, lineHeight: 1.5 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
        </div>
      </div>

      {/* Chat Panel Separator */}
      {isChatPanelOpen && <div className="w-px bg-border-base flex-shrink-0" />}

      {/* Chat Panel */}
      <AnimatePresence mode="wait">
        {isChatPanelOpen && (
          <motion.div ref={containerRef} key="chat-panel" className="flex flex-col bg-bg-base overflow-hidden w-[401px]" initial={{ width: 0, opacity: 0 }} animate={{ width: 401, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ width: { duration: 0.3, ease: 'easeOut' }, opacity: { duration: 0.15, ease: 'easeOut' } }} style={{ flexShrink: 0 }}>
            {/* Chat Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ height: '52px' }}>
              <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0 max-w-[calc(100%-48px)]" style={{ flexWrap: 'nowrap' }}>
                {chatThreads.length === 0 ? (
                  <span className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap" style={{ padding: '4px 8px' }}>New chat</span>
                ) : (
                  chatThreads.map((thread) => (
                    <button key={thread.id} onClick={() => setActiveChatId(thread.id)} className={cn('text-sm font-medium rounded-md transition-colors whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0', thread.id === activeChatId ? 'text-fg-base bg-bg-subtle' : 'text-fg-muted hover:text-fg-base hover:bg-bg-subtle')} style={{ padding: '4px 8px', maxWidth: '200px' }} title={thread.title || 'Untitled'}>
                      {(thread.title || 'Untitled').length > 25 ? (thread.title || 'Untitled').substring(0, 25) + '...' : (thread.title || 'Untitled')}
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={createNewChat} className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0" title="New chat"><Plus size={16} className="text-fg-base" /></button>
                <button onClick={() => setIsChatPanelOpen(false)} className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0" title="Close chat"><SvgIcon src="/central_icons/Assistant - Filled.svg" alt="Close chat" width={16} height={16} className="text-fg-base" /></button>
              </div>
            </div>
            {/* Chat Content */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${showBottomGradient ? 'opacity-100' : 'opacity-0'}`} />
              <div ref={messagesContainerRef} className={`flex-1 overflow-y-auto overflow-x-hidden px-5 pt-8 pb-4 ${!isInChatMode ? 'flex items-center justify-center' : ''}`}>
                <div className="mx-auto w-full" style={{ maxWidth: '740px' }}>
                  {!isInChatMode ? (
                    <div className="flex flex-col items-center justify-center gap-6 py-3">
                      <div className="w-full max-w-[624px] px-3 flex flex-col gap-0.5">
                        <h1 className="text-[18px] font-medium leading-[24px] tracking-[-0.3px] text-fg-base">Ask Harvey</h1>
                        <p className="text-sm leading-5 text-fg-subtle">Ask questions about your deflection workflow and automation rules.</p>
                      </div>
                      <div className="w-full max-w-[624px] flex flex-col">
                        <div className="px-3 pb-3"><p className="text-xs leading-4 text-fg-muted">Get started…</p></div>
                        <div className="flex flex-col">
                          {[
                            { icon: '/central_icons/Review.svg', label: 'Analyze deflection performance', prompt: 'Analyze the current deflection rate and identify opportunities to increase automation' },
                            { icon: '/central_icons/Review.svg', label: 'Review escalated contracts', prompt: 'Review the contracts that were escalated for legal review and explain why' },
                            { icon: '/central_icons/Draft.svg', label: 'Optimize automation rules', prompt: 'Suggest optimizations to the automation rules to improve deflection rates' },
                          ].map((action, i) => (
                            <React.Fragment key={action.label}>
                              <button onClick={() => sendMessage(action.prompt)} disabled={isChatLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left">
                                <SvgIcon src={action.icon} alt="" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle">{action.label}</span>
                              </button>
                              {i < 2 && <div className="h-px bg-border-base mx-3" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div key={index} className={index !== chatMessages.length - 1 ? 'mb-6' : ''}>
                        {message.role === 'user' && (
                          <div className="flex flex-col gap-2 items-end pl-[68px]">
                            <div className="bg-bg-subtle px-4 py-3 rounded-[12px]"><div className="text-sm text-fg-base leading-5">{message.content}</div></div>
                            <div className="flex items-center justify-end">
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><ListPlus className="w-3 h-3" />Save prompt</button>
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><SquarePen className="w-3 h-3" />Edit query</button>
                            </div>
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <div className="flex-1 min-w-0">
                            {message.showThinking !== false && (<>{message.isLoading && message.thinkingContent && message.loadingState ? (<ThinkingState variant="analysis" title="Thinking..." durationSeconds={undefined} summary={message.loadingState.showSummary ? message.thinkingContent.summary : undefined} bullets={message.thinkingContent.bullets?.slice(0, message.loadingState.visibleBullets)} isLoading={true} />) : message.thinkingContent ? (<ThinkingState variant="analysis" title="Thought" durationSeconds={3} summary={message.thinkingContent.summary} bullets={message.thinkingContent.bullets} defaultOpen={false} />) : null}</>)}
                            {!message.isLoading && message.content && (
                              <AnimatePresence><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                                <div className="text-sm text-fg-base leading-relaxed pl-2 whitespace-pre-wrap">{message.content}</div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center">
                                    <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                                    <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><DownloadIcon className="w-3 h-3" />Export</button>
                                    <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><RotateCcw className="w-3 h-3" />Rewrite</button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsUp className="w-3 h-3" /></button>
                                    <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsDown className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              </motion.div></AnimatePresence>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* Chat Input */}
            <div className="px-5 pb-5 relative z-20 bg-bg-base">
              <div className="mx-auto" style={{ maxWidth: '732px' }}>
                <div className="bg-[#f6f5f4] dark:bg-[#2a2a2a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong" style={{ boxShadow: '0px 18px 47px 0px rgba(0,0,0,0.03), 0px 7.5px 19px 0px rgba(0,0,0,0.02), 0px 4px 10.5px 0px rgba(0,0,0,0.02)' }}>
                  <div className="p-[10px] flex flex-col gap-[10px]">
                    <div className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-white dark:bg-[#1a1a1a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[4px] w-fit">
                      <img src="/folderIcon.svg" alt="Contracts" className="w-3 h-3" />
                      <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">Contracts</span>
                    </div>
                    <div className="px-[4px]">
                      <div className="relative">
                        <textarea ref={textareaRef} value={chatInputValue} onChange={(e) => { setChatInputValue(e.target.value); e.target.style.height = '20px'; e.target.style.height = Math.max(20, e.target.scrollHeight) + 'px' }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isChatLoading) { e.preventDefault(); sendMessage() } }} onFocus={() => setIsChatInputFocused(true)} onBlur={() => setIsChatInputFocused(false)} disabled={isChatLoading} className="w-full bg-transparent focus:outline-none text-fg-base placeholder-[#9e9b95] resize-none overflow-hidden disabled:opacity-50" style={{ fontSize: '14px', lineHeight: '20px', height: '20px', minHeight: '20px', maxHeight: '300px' }} />
                        {!chatInputValue && !isChatInputFocused && (
                          <div className="absolute inset-0 pointer-events-none text-[#9e9b95] dark:text-[#6b6b6b] flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
                            <TextLoop interval={3000}><span>Analyze deflection performance…</span><span>Review escalated contracts…</span><span>Optimize automation rules…</span></TextLoop>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pl-[10px] pr-[10px] pb-[10px]">
                    <div className="flex items-center">
                      <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors"><Paperclip size={16} className="text-fg-base" /></button>
                      <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors"><Scale size={16} className="text-fg-base" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isChatLoading ? (
                        <button disabled className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] cursor-not-allowed"><Spinner size="sm" /></button>
                      ) : chatInputValue.trim() ? (
                        <button onClick={() => sendMessage()} className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] hover:bg-button-inverted-hover transition-all"><CornerDownLeft size={16} /></button>
                      ) : (
                        <button className="h-[28px] px-[8px] flex items-center justify-center bg-[#e4e1dd] dark:bg-[#3d3d3d] rounded-[6px] hover:bg-[#d9d6d1] dark:hover:bg-[#4a4a4a] transition-all"><Mic className="w-4 h-4 text-fg-base" /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

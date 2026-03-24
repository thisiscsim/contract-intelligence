"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'

import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CornerDownLeft,
  Database,
  Download,
  FileText,
  Filter,
  FolderTree,
  GitBranch,
  HelpCircle,
  Library,
  Link2,
  ListPlus,
  Mail,
  MessageSquare,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Send,
  Share2,
  Shield,
  SquarePen,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
  Briefcase,
  Loader,
  Bot,
  Edit3,
  Play,
  ChevronLeft,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SvgIcon } from '@/components/svg-icon'
import { Spinner } from '@/components/ui/spinner'
import ThinkingState from '@/components/thinking-state'
import { TextLoop } from '../../../components/motion-primitives/text-loop'
import { AnimatedBackground } from '../../../components/motion-primitives/animated-background'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type {
  AtRiskContract,
  ClauseRow,
  KeyDateRow,
  KeyDateType,
  ObligationSeverity,
  PlaybookGap,
  PlaybookRule,
  PlaybookRuleStatus,
  TemplateRow,
} from './mock-data'
import {
  atRiskContracts,
  clauseLibrary,
  harveyActionsFeed,
  keyDates,
  playbookGaps,
  playbookRules,
  teamEffectivenessMetrics,
  teamMembers,
  templates,
} from './mock-data'

/* ── Chat types ─────────────────────────────────────────────────────────── */
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
      return {
        summary: 'Planning structure and content before drafting the document.',
        bullets: ['Identify audience and objective', 'Assemble relevant facts and authorities', 'Outline sections and key arguments']
      }
    case 'review':
      return {
        summary: 'Parsing materials and selecting fields for a concise comparison.',
        bullets: ['Locate documents and parse key terms', 'Normalize entities and dates', 'Populate rows and verify data consistency']
      }
    default:
      return {
        summary: 'Analyzing the request and gathering relevant information.',
        bullets: ['Understanding the context and requirements', 'Searching through contract documents', 'Preparing comprehensive response']
      }
  }
}

/*
 * Harvey design tokens — aligned with src/tokens/css/tokens.light.css
 */
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
    success: {
      fg: 'var(--ui-success-fg)',
      bg: 'var(--ui-success-bg)',
      border: 'var(--ui-success-border)',
    },
    warning: {
      fg: 'var(--ui-warning-fg)',
      bg: 'var(--ui-warning-bg)',
      border: 'var(--ui-warning-border)',
    },
    danger:  { fg: 'var(--ui-danger-fg)',  bg: 'var(--ui-danger-bg)' },
    neutral: { fg: 'var(--fg-muted)', bg: 'var(--bg-subtle)' },
    blue:    { fg: 'var(--ui-blue-fg)',    bg: 'var(--ui-blue-bg)' },
    gold:    { fg: 'var(--ui-warning-fg)', bg: 'var(--ui-warning-bg)' },
    olive:   { fg: 'hsl(85, 25%, 32%)', bg: 'hsl(85, 35%, 92%)' },
    violet:  { fg: 'var(--ui-violet-fg)', bg: 'var(--ui-violet-bg)' },
  },
  radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 },
}

// ── Overview chart data ───────────────────────────────────────────────────────

const riskDistribution = [
  { name: 'Low', value: 1842, color: 'hsl(85,25%,32%)' },
  { name: 'Medium', value: 743, color: 'hsl(32,75%,35%)' },
  { name: 'High', value: 198, color: 'hsl(15,79%,34%)' },
  { name: 'Critical', value: 64, color: 'hsl(343,80%,35%)' },
]


const upcomingObligations = [
  { id: 1, title: 'Auto-renewal opt-out deadline', counterparty: 'HSBC', contract: 'MSA-2024-HSBC', daysLeft: 7, severity: 'critical' as const },
  { id: 2, title: 'Annual SOC 2 certification due', counterparty: 'GlobalTech Ltd', contract: 'DPA-2025-GlobalTech', daysLeft: 6, severity: 'critical' as const },
  { id: 3, title: 'Quarterly SLA report', counterparty: 'Pinnacle Group', contract: 'SLA-2025-Pinnacle', daysLeft: 1, severity: 'high' as const },
  { id: 4, title: 'Data retention review', counterparty: 'GlobalTech Ltd', contract: 'DPA-2025-0234', daysLeft: 13, severity: 'high' as const },
  { id: 5, title: 'Insurance certificate renewal', counterparty: 'Meridian Partners', contract: 'SVC-2024-1102', daysLeft: 19, severity: 'medium' as const },
  { id: 6, title: 'Performance SLA report', counterparty: 'NovaStar Inc', contract: 'SLA-2025-NS', daysLeft: 6, severity: 'critical' as const },
]

const counterpartyData = [
  { name: 'Acme Corp', contracts: 24, avgDays: 18, acceptRate: 72, risk: 'Low', trend: 'stable', topClause: 'Indemnification' },
  { name: 'GlobalTech Ltd', contracts: 19, avgDays: 32, acceptRate: 45, risk: 'Medium', trend: 'worsening', topClause: 'Liability Cap' },
  { name: 'Meridian Partners', contracts: 31, avgDays: 12, acceptRate: 88, risk: 'Low', trend: 'improving', topClause: 'IP Assignment' },
  { name: 'NovaStar Inc', contracts: 15, avgDays: 45, acceptRate: 38, risk: 'High', trend: 'worsening', topClause: 'Termination' },
  { name: 'Apex Financial', contracts: 22, avgDays: 22, acceptRate: 65, risk: 'Medium', trend: 'stable', topClause: 'Data Privacy' },
  { name: 'Titan Industries', contracts: 28, avgDays: 15, acceptRate: 81, risk: 'Low', trend: 'improving', topClause: 'Non-compete' },
  { name: 'Vertex Solutions', contracts: 11, avgDays: 38, acceptRate: 42, risk: 'High', trend: 'stable', topClause: 'Warranty' },
  { name: 'Pinnacle Group', contracts: 17, avgDays: 20, acceptRate: 71, risk: 'Medium', trend: 'improving', topClause: 'SLA Terms' },
]

const tooltipStyle = {
  background: 'hsl(0,0%,100%)',
  border: '1px solid hsl(34,11%,88%)',
  borderRadius: 8,
  fontSize: 13,
  padding: '8px 12px',
}

type ActiveTab =
  | 'overview'
  | 'contracts'
  | 'playbooks'
  // Hidden for Q2 — keeping types intact
  | 'templates'
  | 'clauses'
  | 'key-dates'

const ACTIVE_TABS: ActiveTab[] = [
  'overview',
  'contracts',
  'playbooks',
  'clauses',
  // Hidden for Q2
  // 'templates',
  // 'key-dates',
]

function toTab(s: string): ActiveTab {
  return ACTIVE_TABS.find((t) => t === s) ?? 'overview'
}

// ── Shared primitive components ──────────────────────────────────────────────

function Chip({
  label,
  fg,
  bg,
}: {
  label: string
  fg: string
  bg: string
}) {
  return (
    <span
      style={{
        color: fg,
        backgroundColor: bg,
        padding: '2px 8px',
        borderRadius: hy.radius.xs,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </span>
  )
}

function SeverityChip({ severity }: { severity: ObligationSeverity }) {
  const map: Record<ObligationSeverity, { fg: string; bg: string; label: string }> = {
    low: { ...hy.ui.olive, label: "Low" },
    medium: { ...hy.ui.gold, label: "Medium" },
    high: { ...hy.ui.warning, label: "High" },
    critical: { ...hy.ui.danger, label: "Critical" },
  }
  const { fg, bg, label } = map[severity]
  return <Chip label={label} fg={fg} bg={bg} />
}

function AcceptBar({ rate, width = 64 }: { rate: number; width?: number }) {
  const color =
    rate >= 80 ? hy.ui.success.fg : rate >= 60 ? hy.ui.gold.fg : hy.ui.danger.fg
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          height: 6,
          width,
          background: hy.bg.component,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${rate}%`,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: hy.fg.subtle, minWidth: 32 }}>
        {`${rate}%`}
      </span>
    </div>
  )
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ background: hy.bg.subtle }}>
        {cols.map((h) => (
          <th
            key={h}
            style={{
              padding: '10px 16px',
              textAlign: 'left',
              fontSize: 11,
              fontWeight: 600,
              color: hy.fg.subtle,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              borderBottom: `1px solid ${hy.border.base}`,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${hy.border.base}`,
        borderRadius: hy.radius.md,
        overflow: 'hidden',
        background: hy.bg.base,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  )
}

function TableRow({
  children,
  isLast,
}: {
  children: React.ReactNode
  isLast: boolean
}) {
  return (
    <tr
      className="transition hover:bg-hy-bg-subtle"
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${hy.border.base}`,
      }}
    >
      {children}
    </tr>
  )
}

function Td({
  children,
  isMuted,
}: {
  children: React.ReactNode
  isMuted?: boolean
}) {
  return (
    <td
      style={{
        padding: '12px 16px',
        fontSize: 13,
        color: isMuted ? hy.fg.subtle : hy.fg.base,
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  )
}

function SectionHeader({
  count,
  label,
  action,
}: {
  count?: number
  label: string
  action?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 13, color: hy.fg.muted }}>
        {count !== undefined ? `${count} ${label}` : label}
      </span>
      {action && (
        <button
          type="button"
          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: hy.fg.subtle,
            background: hy.bg.base,
            border: `1px solid ${hy.border.base}`,
            borderRadius: hy.radius.sm,
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          <Filter size={13} />
          {action}
        </button>
      )}
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────────

// ── Contract pipeline ─────────────────────────────────────────────────────────

type RiskCategory =
  | 'Playbook Deviation'
  | 'Regulatory Compliance'
  | 'Counterparty Risk'
  | 'Commercial / Financial'
  | 'Operational / Performance'
  | 'Time-Based / Lifecycle'
  | 'Concentration Risk'

interface AtRiskFlag {
  category: RiskCategory
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  type: string
  description: string
  harveySuggestion: string
}

const riskCategoryColor: Record<RiskCategory, { fg: string; bg: string }> = {
  'Commercial / Financial': hy.ui.danger,
  'Regulatory Compliance': hy.ui.danger,
  'Counterparty Risk': hy.ui.warning,
  'Time-Based / Lifecycle': hy.ui.warning,
  'Playbook Deviation': hy.ui.gold,
  'Operational / Performance': hy.ui.gold,
  'Concentration Risk': hy.ui.blue,
}

const portfolioRiskByCategory: Array<{
  category: RiskCategory
  contracts: number
  exposure: string | null
  description: string
}> = [
  { category: 'Commercial / Financial', contracts: 12, exposure: '$8.2M', description: 'Uncapped liability, unfavorable payment terms, auto-renewal exposure' },
  { category: 'Regulatory Compliance', contracts: 9, exposure: null, description: 'GDPR/DORA gaps, jurisdiction-specific requirements unmet, outdated disclosures' },
  { category: 'Time-Based / Lifecycle', contracts: 8, exposure: '$3.1M', description: 'Renewal windows approaching, past-due obligations, unconverted pilots' },
  { category: 'Counterparty Risk', contracts: 5, exposure: '$4.8M', description: 'Financial distress signals, change-of-control events, sanctions watch-list matches' },
  { category: 'Playbook Deviation', contracts: 4, exposure: '$2.3M', description: 'Accepted positions flagged as reject, missing required clauses, unapproved concessions' },
  { category: 'Operational / Performance', contracts: 3, exposure: null, description: 'SLA commitments currently being missed, exclusivity blocking new deals, MFN trigger risk' },
  { category: 'Concentration Risk', contracts: 2, exposure: '$6.7M', description: 'Revenue overexposed to single counterparty, single-source supplier with no backup' },
]

type IntakeSource = 'Harvey on Teams' | 'ask@harvey.ai' | 'Shared Spaces'
type PipelineStatus = 'Submitted' | 'Ready to Send' | 'Needs Review' | 'In Negotiation' | 'Executed'

type ClauseRiskRating = 'High' | 'Medium' | 'Low'
type ClauseRiskImpact = 'Legal' | 'Financial' | 'Operational' | 'Reputational'

interface ClauseRisk {
  clause: string
  rating: ClauseRiskRating
  impact: ClauseRiskImpact[]
  summary: string
  fallbackRisk?: string
  acceptRisk?: string
}

interface PipelineContract {
  id: string
  name: string
  counterparty: string
  type: string
  submittedBy: string
  intakeSource: IntakeSource
  status: PipelineStatus
  submittedDate: string
  value: string
  harveyScore?: number
  harveyIssues?: string[]
  harveyNote?: string
  clauseRisks?: ClauseRisk[]
  contractId?: string
  isAtRisk?: boolean
  atRiskFlags?: AtRiskFlag[]
  submittedAgo?: string
  harveyReviewedAgo?: string
}

const pipelineContracts: PipelineContract[] = [
  // Awaiting Review
  { id: 'pc1', name: 'Cloud Infrastructure Services Agreement', counterparty: 'Brightwater Capital', type: 'MSA', submittedBy: 'James Liu', intakeSource: 'Harvey on Teams', status: 'Needs Review', submittedDate: 'Mar 9, 2026', value: '$1.4M', harveyScore: 74, submittedAgo: '2h 14m', harveyReviewedAgo: '2h 11m', harveyNote: 'Three clauses deviate from standard playbook. Recommend negotiating liability cap and IP assignment before execution.', clauseRisks: [
    { clause: 'Liability Cap', rating: 'High', impact: ['Financial', 'Legal'], summary: 'No cap on aggregate liability — exposes company to uncapped claims.', fallbackRisk: 'Accepting uncapped liability could result in damages exceeding contract value.', acceptRisk: 'Counterparty has strong negotiating position given contract size.' },
    { clause: 'Auto-Renewal', rating: 'Medium', impact: ['Operational', 'Financial'], summary: 'Auto-renewal triggers without 90-day notice — non-standard (standard: 30 days).', fallbackRisk: 'Missed opt-out window locks in 12-month renewal at current rate.', acceptRisk: 'Risk manageable if calendar alert is set; business may prefer continuity.' },
    { clause: 'IP Assignment', rating: 'Medium', impact: ['Legal', 'Reputational'], summary: 'Assignment clause transfers rights to all deliverables including pre-existing IP.', fallbackRisk: 'Broad assignment may inadvertently transfer platform IP used across other clients.', acceptRisk: 'Narrowing scope may delay deal close by 1–2 weeks.' },
  ]},
  { id: 'pc2', name: 'EU Data Privacy & Transfer Addendum', counterparty: 'Nexus Analytics', type: 'DPA', submittedBy: 'Priya Shah', intakeSource: 'ask@harvey.ai', status: 'Needs Review', submittedDate: 'Mar 8, 2026', value: '—', harveyScore: 81, submittedAgo: '5h 02m', harveyReviewedAgo: '4h 58m', harveyNote: 'Critical GDPR compliance gaps. Must resolve before any EU data processing begins.', clauseRisks: [
    { clause: 'Data Transfer Mechanism', rating: 'High', impact: ['Legal', 'Reputational'], summary: 'No EU transfer mechanism specified — SCCs required for processing EU personal data.', fallbackRisk: 'Processing without SCCs violates GDPR Chapter V; ICO fine risk up to €20M or 4% global turnover.', acceptRisk: 'No acceptable workaround — SCCs or adequacy decision required.' },
    { clause: 'Subprocessor Disclosure', rating: 'High', impact: ['Legal', 'Operational'], summary: 'Subprocessor list absent — GDPR Art. 28(3)(d) requires documented disclosure and consent.', fallbackRisk: 'Regulatory exposure if data subject exercises rights and subprocessor chain is undocumented.', acceptRisk: 'Counterparty may resist full disclosure; agree on categories with individual notice on change.' },
  ]},
  { id: 'pc3', name: 'Enterprise SaaS Subscription & License', counterparty: 'Orbis Financial', type: 'SaaS', submittedBy: 'Tom Brennan', intakeSource: 'Shared Spaces', status: 'Needs Review', submittedDate: 'Mar 7, 2026', value: '$680K', harveyScore: 68, submittedAgo: '1d 3h', harveyReviewedAgo: '1d 2h 55m', harveyNote: 'Two moderate deviations. Warranty and audit rights can likely be resolved in one redline exchange.', clauseRisks: [
    { clause: 'Warranty Disclaimer', rating: 'Medium', impact: ['Legal', 'Financial'], summary: 'Implied fitness-for-purpose warranties not disclaimed — creates implied contractual obligations.', fallbackRisk: 'Without disclaimer, counterparty could argue breach if product does not meet business expectations.', acceptRisk: 'Standard mutual disclaimer generally accepted; low pushback expected.' },
    { clause: 'Audit Rights', rating: 'Medium', impact: ['Operational', 'Financial'], summary: '15-day notice for audit (standard: 45 days) — insufficient time to prepare for compliance reviews.', fallbackRisk: 'Short notice period creates operational disruption and may expose internal systems prematurely.', acceptRisk: 'Counterparty may want shorter window to maintain oversight; negotiate to 30 days as midpoint.' },
  ]},
  { id: 'pc4', name: 'Implementation & Professional Services SOW', counterparty: 'Pinnacle Group', type: 'SOW', submittedBy: 'Sarah Chen', intakeSource: 'Harvey on Teams', status: 'Needs Review', submittedDate: 'Mar 6, 2026', value: '$310K', harveyScore: 52, submittedAgo: '2d 1h', harveyReviewedAgo: '2d 0h 54m', harveyNote: 'One clause deviation, low complexity. Standard indemnification update should close quickly.', clauseRisks: [
    { clause: 'Indemnification', rating: 'Medium', impact: ['Legal', 'Financial'], summary: 'Current scope excludes IP infringement and confidentiality claims — narrower than standard.', fallbackRisk: 'If counterparty files IP claim, company has no contractual indemnity protection.', acceptRisk: 'Accepting narrower scope has precedent risk for future negotiations with this counterparty.' },
  ]},
  // Submitted
  { id: 'pc5', name: 'Bilateral Non-Disclosure Agreement', counterparty: 'Crest Ventures', type: 'NDA', submittedBy: 'Miguel Torres', intakeSource: 'Harvey on Teams', status: 'Submitted', submittedDate: 'Mar 10, 2026', value: '—' },
  { id: 'pc6', name: 'Technology Reseller Master Agreement', counterparty: 'Altair Systems', type: 'MSA', submittedBy: 'Emily Wong', intakeSource: 'ask@harvey.ai', status: 'Submitted', submittedDate: 'Mar 10, 2026', value: '$890K' },
  { id: 'pc7', name: 'Payment Processing Services Agreement', counterparty: 'StellarPay', type: 'Vendor', submittedBy: 'Raj Patel', intakeSource: 'Shared Spaces', status: 'Submitted', submittedDate: 'Mar 9, 2026', value: '$220K' },
  { id: 'pc8', name: 'Annual Software Maintenance & Support', counterparty: 'Meridian Tech', type: 'License', submittedBy: 'Lisa Park', intakeSource: 'ask@harvey.ai', status: 'Submitted', submittedDate: 'Mar 9, 2026', value: '$455K' },
  { id: 'pc9', name: 'Strategic Management Consulting Engagement', counterparty: 'BluePath Advisory', type: 'Consulting', submittedBy: 'James Liu', intakeSource: 'Harvey on Teams', status: 'Submitted', submittedDate: 'Mar 8, 2026', value: '$175K' },
  { id: 'pc15', name: 'Cybersecurity Managed Services Agreement', counterparty: 'Fortress Digital', type: 'MSA', submittedBy: 'Priya Shah', intakeSource: 'Shared Spaces', status: 'Submitted', submittedDate: 'Mar 8, 2026', value: '$640K' },
  { id: 'pc16', name: 'Recruiting & Staffing Services Agreement', counterparty: 'Vantage Talent', type: 'Services', submittedBy: 'Miguel Torres', intakeSource: 'ask@harvey.ai', status: 'Submitted', submittedDate: 'Mar 7, 2026', value: '$120K' },
  // Harvey Reviewed
  { id: 'pc10', name: 'IT Infrastructure Support & Maintenance SLA', counterparty: 'Titan Industries', type: 'SLA', submittedBy: 'Tom Brennan', intakeSource: 'Shared Spaces', status: 'Ready to Send', submittedDate: 'Mar 5, 2026', value: '$1.1M', harveyScore: 22, harveyIssues: [], harveyNote: 'Standard terms, no material deviations from playbook. Ready for execution.' },
  { id: 'pc11', name: 'Strategic Alliance & Revenue Share Agreement', counterparty: 'Apex Financial', type: 'Partnership', submittedBy: 'Sarah Chen', intakeSource: 'ask@harvey.ai', status: 'Ready to Send', submittedDate: 'Mar 4, 2026', value: '$2.1M', harveyScore: 41, harveyIssues: ['Change of control notice 5 days shorter than standard'], harveyNote: 'Low risk. Extend change of control notice from 25 to 30 days. Otherwise aligned with playbook.' },
  { id: 'pc17', name: 'Intellectual Property License Agreement', counterparty: 'Corelight Labs', type: 'License', submittedBy: 'Emily Wong', intakeSource: 'Harvey on Teams', status: 'Ready to Send', submittedDate: 'Mar 3, 2026', value: '$780K', harveyScore: 18, harveyIssues: [], harveyNote: 'IP rights clearly scoped. Royalty structure and audit rights aligned with standard position.' },
  // In Negotiation
  { id: 'pc12', name: 'GDPR Data Processing & Sub-Processor Agreement', counterparty: 'GlobalTech Ltd', type: 'DPA', submittedBy: 'Miguel Torres', intakeSource: 'Shared Spaces', status: 'In Negotiation', submittedDate: 'Mar 1, 2026', value: '—', harveyScore: 58, harveyIssues: ['Counterparty pushing back on subprocessor clause'],
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Regulatory Compliance',
        severity: 'High',
        type: 'Clause conflicts with new regulation',
        description: 'DORA Article 28 requires explicit ICT sub-contractor notification obligations. Current DPA does not include these provisions.',
        harveySuggestion: 'Harvey has drafted DORA amendment language for review. Recommend adding before next regulatory review cycle.',
      },
      {
        category: 'Playbook Deviation',
        severity: 'Medium',
        type: 'Counter to clause accepted without escalation approval',
        description: 'Subprocessor consent mechanism was narrowed from our standard position without documented escalation approval.',
        harveySuggestion: 'Request retrospective approval from legal ops or flag for next playbook review cycle.',
      },
    ],
  },
  { id: 'pc18', name: 'Multi-Tenant Cloud Hosting Agreement', counterparty: 'Stratosphere Inc', type: 'MSA', submittedBy: 'Raj Patel', intakeSource: 'Harvey on Teams', status: 'In Negotiation', submittedDate: 'Feb 27, 2026', value: '$1.8M', harveyScore: 63, harveyIssues: ['Uptime SLA below 99.9% threshold', 'Disaster recovery terms non-standard'] },
  { id: 'pc19', name: 'Financial Data API Access Agreement', counterparty: 'Quorum Analytics', type: 'License', submittedBy: 'Lisa Park', intakeSource: 'ask@harvey.ai', status: 'In Negotiation', submittedDate: 'Feb 25, 2026', value: '$290K', harveyScore: 47, harveyIssues: ['Usage caps more restrictive than requested'] },
  // Executed
  { id: 'pc13', name: 'Enterprise Platform License & Services Agreement', counterparty: 'Acme Corp', type: 'MSA', submittedBy: 'Priya Shah', intakeSource: 'Harvey on Teams', status: 'Executed', submittedDate: 'Feb 20, 2026', value: '$2.4M', harveyScore: 28,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Time-Based / Lifecycle',
        severity: 'Medium',
        type: 'Renewal window approaching — no action taken',
        description: 'Contract renews June 15, 2026. 90-day opt-out window opens March 17. No renewal decision or negotiation brief has been initiated.',
        harveySuggestion: 'Harvey recommends initiating renewal strategy now. Acme Corp has a strong 72% accept rate — opportunity to expand scope.',
      },
      {
        category: 'Concentration Risk',
        severity: 'Low',
        type: 'High revenue concentration in single counterparty',
        description: 'Acme Corp represents $2.4M of this contract. Combined with 24 related contracts, total exposure to Acme is $8.6M — 22% of total revenue portfolio.',
        harveySuggestion: 'No immediate action required. Flagged for GC awareness as part of portfolio concentration monitoring.',
      },
    ],
  },
  { id: 'pc14', name: 'Product Development Confidentiality Agreement', counterparty: 'NovaStar Inc', type: 'NDA', submittedBy: 'Emily Wong', intakeSource: 'ask@harvey.ai', status: 'Executed', submittedDate: 'Feb 15, 2026', value: '—', harveyScore: 15,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Counterparty Risk',
        severity: 'High',
        type: 'Counterparty financial distress indicators',
        description: "NovaStar Inc's risk score is 76 — highest in the portfolio. Harvey detected 3 public indicators of financial stress: delayed Q4 filing, reduction in force announcement, and credit facility drawdown.",
        harveySuggestion: 'Review all 15 active contracts with NovaStar. Consider accelerating payment collection and reviewing termination rights.',
      },
    ],
  },
  { id: 'pc20', name: 'Facilities & Office Services Agreement', counterparty: 'Meridian Partners', type: 'Services', submittedBy: 'Sarah Chen', intakeSource: 'Shared Spaces', status: 'Executed', submittedDate: 'Feb 10, 2026', value: '$840K', harveyScore: 12 },
  { id: 'pc21', name: 'Marketing & Brand License Agreement', counterparty: 'Vertex Solutions', type: 'License', submittedBy: 'James Liu', intakeSource: 'Harvey on Teams', status: 'Executed', submittedDate: 'Feb 4, 2026', value: '$580K', harveyScore: 21 },
  // At-Risk — portfolio monitoring
  {
    id: 'pc22',
    name: 'Walmart Retail Intelligence & Enterprise Analytics Platform',
    counterparty: 'Walmart',
    type: 'MSA',
    submittedBy: 'Sarah Chen',
    intakeSource: 'Harvey on Teams',
    status: 'Executed',
    submittedDate: 'Jan 14, 2019',
    value: '$38.2M',
    harveyScore: 61,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Commercial / Financial',
        severity: 'High',
        type: 'Uncapped liability in active SOW',
        description: 'SOW-011 (AI Ops Integration, $5.8M) contains uncapped aggregate liability for AI output errors — a carve-out from the MSA liability cap. This was not flagged at signing.',
        harveySuggestion: 'Harvey recommends adding a liability cap addendum to SOW-011 before the next renewal cycle. Harvey can draft the amendment.',
      },
      {
        category: 'Concentration Risk',
        severity: 'High',
        type: 'Too much revenue concentrated in one counterparty',
        description: 'Walmart MSA and 7 associated SOWs represent $38.2M — 31% of total revenue portfolio. Loss or renegotiation of this relationship would be material.',
        harveySuggestion: 'No immediate action. GC and CFO should be aware of this concentration in quarterly risk review.',
      },
    ],
  },
  {
    id: 'pc23',
    name: 'HSBC Financial Services AI Platform & Legal Workflow Automation',
    counterparty: 'HSBC',
    type: 'MSA',
    submittedBy: 'James Liu',
    intakeSource: 'Harvey on Teams',
    status: 'Executed',
    submittedDate: 'Jan 8, 2024',
    value: '$1.2M',
    harveyScore: 58,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Time-Based / Lifecycle',
        severity: 'Critical',
        type: 'Auto-renewal opt-out window closing in 6 days',
        description: 'Contract auto-renews March 16 unless written opt-out notice is delivered. Renewal locks in $1.2M at current pricing with no renegotiation.',
        harveySuggestion: 'If renewal is not intended, opt-out notice must be sent by March 14. Harvey can draft the notice immediately.',
      },
      {
        category: 'Regulatory Compliance',
        severity: 'High',
        type: 'Jurisdiction-specific requirements not met',
        description: 'FCA PS24/1 (Consumer Duty) came into force after contract signing. HSBC is a regulated firm — new output monitoring and explainability obligations may apply.',
        harveySuggestion: 'Harvey recommends adding a regulatory compliance addendum before renewal. Legal review required.',
      },
    ],
  },
  {
    id: 'pc24',
    name: 'Brightwater Capital Cloud Migration & Managed Hosting Services',
    counterparty: 'Brightwater Capital',
    type: 'MSA',
    submittedBy: 'Tom Brennan',
    intakeSource: 'Shared Spaces',
    status: 'In Negotiation',
    submittedDate: 'Mar 9, 2026',
    value: '$1.4M',
    harveyScore: 74,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Playbook Deviation',
        severity: 'High',
        type: 'Missing required clause — no limitation of liability',
        description: 'Current draft has no aggregate liability cap. Internal policy requires a cap of at least 12 months fees. This gap was not caught in the initial Harvey review.',
        harveySuggestion: 'Do not execute without adding a liability cap. Harvey has flagged this as a policy violation — escalation to legal ops required before sign-off.',
      },
      {
        category: 'Commercial / Financial',
        severity: 'Medium',
        type: 'Payment terms expose the company',
        description: 'Net-90 payment terms agreed (standard is Net-30). No late payment interest clause. Brightwater could delay payment 3x longer than standard with no financial consequence.',
        harveySuggestion: 'Add a late payment interest clause at 1.5%/month and consider negotiating payment terms back to Net-45 minimum.',
      },
    ],
  },
  {
    id: 'pc25',
    name: 'NovaStar Inc Master Services Agreement',
    counterparty: 'NovaStar Inc',
    type: 'MSA',
    submittedBy: 'Emily Wong',
    intakeSource: 'ask@harvey.ai',
    status: 'Executed',
    submittedDate: 'Feb 15, 2025',
    value: '$920K',
    harveyScore: 76,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Counterparty Risk',
        severity: 'High',
        type: 'Counterparty in financial distress',
        description: "NovaStar filed a delayed 10-K, announced a 15% reduction in force, and drew down $40M on their revolving credit facility in the last 60 days — classic early distress signals.",
        harveySuggestion: 'Review termination-for-convenience rights. Consider accelerating any outstanding invoices. Harvey can prepare a risk brief for the CFO.',
      },
      {
        category: 'Time-Based / Lifecycle',
        severity: 'High',
        type: 'Opt-out window closes in 8 days',
        description: 'MSA auto-renews May 2. 45-day opt-out notice is due by March 18. Given counterparty distress, renewing may not be advisable.',
        harveySuggestion: 'Harvey recommends sending opt-out notice by March 16 to preserve optionality. Harvey can draft the notice now.',
      },
    ],
  },
  {
    id: 'pc26',
    name: 'Pinnacle Group SLA Agreement — Quarterly Performance',
    counterparty: 'Pinnacle Group',
    type: 'SLA',
    submittedBy: 'Raj Patel',
    intakeSource: 'Harvey on Teams',
    status: 'Executed',
    submittedDate: 'Jan 5, 2025',
    value: '$410K',
    harveyScore: 55,
    isAtRisk: true,
    atRiskFlags: [
      {
        category: 'Operational / Performance',
        severity: 'High',
        type: 'SLA commitments currently being missed',
        description: 'SLA requires 99.9% uptime. Harvey detected from integrated monitoring data that actual uptime for February was 99.71% — below contractual threshold. A service credit of $8,200 may be owed.',
        harveySuggestion: 'Harvey recommends issuing a self-report notice to Pinnacle Group and proactively applying the service credit. This protects against breach claims.',
      },
    ],
  },
]

const intakeSourceIcon: Record<IntakeSource, React.ReactNode> = {
  'Harvey on Teams': <MessageSquare size={13} />,
  'ask@harvey.ai': <Mail size={13} />,
  'Shared Spaces': <Share2 size={13} />,
}

const intakeSourceColor: Record<IntakeSource, { fg: string; bg: string }> = {
  'Harvey on Teams': { fg: hy.ui.violet.fg, bg: hy.ui.violet.bg },
  'ask@harvey.ai': { fg: hy.ui.blue.fg, bg: 'hsl(214,95%,93%)' },
  'Shared Spaces': { fg: hy.ui.olive.fg, bg: hy.ui.olive.bg },
}

const pipelineStatusColor: Record<PipelineStatus, { fg: string; bg: string }> = {
  'Submitted': { fg: hy.ui.neutral.fg, bg: hy.ui.neutral.bg },
  'Ready to Send': { fg: hy.ui.success.fg, bg: hy.ui.success.bg },
  'Needs Review': { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg },
  'In Negotiation': { fg: hy.ui.blue.fg, bg: 'hsl(214,95%,93%)' },
  'Executed': { fg: hy.ui.olive.fg, bg: hy.ui.olive.bg },
}

const actionTypeIcon: Record<string, React.ReactNode> = {
  playbook_drift: <Zap size={14} color={hy.ui.gold.fg} />,
  regulatory: <Shield size={14} color={hy.ui.blue.fg} />,
  key_date: <Calendar size={14} color={hy.ui.warning.fg} />,
  clause: <BookOpen size={14} color={hy.ui.violet.fg} />,
  risk: <AlertTriangle size={14} color={hy.ui.danger.fg} />,
  sync: <RefreshCw size={14} color={hy.ui.success.fg} />,
}

function IntakeSourceBadge({ source }: { source: IntakeSource }) {
  const { fg, bg } = intakeSourceColor[source]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: fg, background: bg, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' as const }}>
      {intakeSourceIcon[source]}
      {source}
    </span>
  )
}

function HarveyScoreBadge({ score }: { score: number }) {
  const { fg, bg } = score >= 70 ? hy.ui.danger : score >= 40 ? hy.ui.warning : hy.ui.success
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: fg, background: bg, padding: '3px 8px', borderRadius: 4 }}>
      <AlertTriangle size={11} />
      {score}
    </span>
  )
}

type ActivePanel = 'submitted' | 'reviewed' | 'awaiting' | null

function SubmittedPanel({ onClose }: { onClose: () => void }) {
  const submitted = pipelineContracts.filter((c) => c.status === 'Submitted')
  const bySource = (['Harvey on Teams', 'ask@harvey.ai', 'Shared Spaces'] as IntakeSource[]).map((src) => ({
    source: src,
    contracts: submitted.filter((c) => c.intakeSource === src),
  }))
  return (
    <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Sent to Harvey / Legal"}</span>
          <span style={{ fontSize: 12, color: hy.fg.muted, marginLeft: 8 }}>{"247 contracts — all access points"}</span>
        </div>
        <button type="button" onClick={onClose} className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: hy.fg.muted }}>
          <X size={15} />
        </button>
      </div>
      {bySource.map(({ source, contracts }) => (
        <div key={source}>
          <div style={{ padding: '10px 20px 8px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IntakeSourceBadge source={source} />
            <span style={{ fontSize: 12, color: hy.fg.muted }}>{contracts.length} contracts this week</span>
          </div>
          {contracts.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < contracts.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{c.name}</div>
                <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 2 }}>{c.counterparty} · Submitted by {c.submittedBy} · {c.submittedDate}</div>
              </div>
              <div style={{ fontSize: 12, color: hy.fg.muted }}>{c.value}</div>
              <Chip label="In Queue" fg={hy.ui.neutral.fg} bg={hy.ui.neutral.bg} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function AwaitingPanel({ onClose }: { onClose: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const awaiting = pipelineContracts.filter((c) => c.status === 'Needs Review')
  return (
    <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Needs your review"}</span>
          <span style={{ fontSize: 12, color: hy.fg.muted, marginLeft: 8 }}>{"Harvey found gray areas — your judgment needed before sending"}</span>
        </div>
        <button type="button" onClick={onClose} className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: hy.fg.muted }}>
          <X size={15} />
        </button>
      </div>
      {awaiting.map((c) => {
        const isExpanded = expandedId === c.id
        return (
          <div key={c.id} style={{ borderBottom: `1px solid ${hy.border.base}` }}>
            {/* Contract row */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
              className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ color: hy.fg.muted, flexShrink: 0 }}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{c.name}</div>
                <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 2 }}>{c.counterparty} · {c.submittedBy} · {c.submittedDate}</div>
              </div>
              <IntakeSourceBadge source={c.intakeSource} />
              <div style={{ fontSize: 12, color: hy.fg.muted }}>{c.value}</div>
              {c.harveyScore !== undefined && <HarveyScoreBadge score={c.harveyScore} />}
            </button>
            {/* Expanded Harvey analysis */}
            {isExpanded && (
              <div style={{ padding: '0 20px 16px 48px' }}>
                <div style={{ background: hy.bg.subtle, borderRadius: hy.radius.md, padding: '16px 18px' }}>
                  {/* Summary */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: hy.fg.subtle, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Harvey's Assessment"}</div>
                  {c.harveyNote && (
                    <div style={{ fontSize: 13, color: hy.fg.base, lineHeight: 1.55, marginBottom: 16 }}>{c.harveyNote}</div>
                  )}
                  {/* Clause-level risk table */}
                  {(c.clauseRisks ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Clause Risk Assessment"}</div>
                      {c.clauseRisks!.map((cr) => {
                        const ratingColor = cr.rating === 'High' ? hy.ui.danger : cr.rating === 'Medium' ? hy.ui.warning : hy.ui.success
                        return (
                          <div key={cr.clause} style={{ background: hy.bg.base, borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{cr.clause}</span>
                              <Chip label={cr.rating} fg={ratingColor.fg} bg={ratingColor.bg} />
                              <div style={{ display: 'flex', gap: 4, marginLeft: 2 }}>
                                {cr.impact.map((imp) => (
                                  <Chip key={imp} label={imp} fg={hy.fg.muted} bg={hy.bg.component} />
                                ))}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: hy.fg.base, marginBottom: 8, lineHeight: 1.5 }}>{cr.summary}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {cr.fallbackRisk && (
                                <div style={{ fontSize: 11, background: hy.ui.warning.bg, borderRadius: 4, padding: '6px 8px' }}>
                                  <div style={{ fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 2 }}>{"Risk if we push back"}</div>
                                  <div style={{ color: hy.ui.warning.fg, lineHeight: 1.45 }}>{cr.fallbackRisk}</div>
                                </div>
                              )}
                              {cr.acceptRisk && (
                                <div style={{ fontSize: 11, background: hy.ui.blue.bg, borderRadius: 4, padding: '6px 8px' }}>
                                  <div style={{ fontWeight: 600, color: hy.ui.blue.fg, marginBottom: 2 }}>{"Risk if we accept"}</div>
                                  <div style={{ color: hy.ui.blue.fg, lineHeight: 1.45 }}>{cr.acceptRisk}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: hy.bg.base, background: hy.fg.base, border: 'none', borderRadius: hy.radius.sm, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      <Send size={12} />
                      {"Approve & send to client"}
                    </button>
                    <button
                      type="button"
                      className="transition hover:bg-hy-bg-base-hover focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: hy.fg.base, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      {"Request revision"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HarveyReviewedPanel({ onClose }: { onClose: () => void }) {
  const reviewed = pipelineContracts.filter((c) => c.status === 'Ready to Send')
  return (
    <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Ready to send"}</span>
          <span style={{ fontSize: 12, color: hy.fg.muted, marginLeft: 8 }}>{"Harvey reviewed and is confident — safe to send directly"}</span>
        </div>
        <button type="button" onClick={onClose} className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: hy.fg.muted }}>
          <X size={15} />
        </button>
      </div>
      {reviewed.map((c, i) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: i < reviewed.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
          <CheckCircle size={16} color={hy.ui.success.fg} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{c.name}</span>
              <span style={{ fontSize: 12, color: hy.fg.muted }}>·</span>
              <span style={{ fontSize: 12, color: hy.fg.muted }}>{c.counterparty}</span>
            </div>
            {c.harveyNote && <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.5 }}>{c.harveyNote}</div>}
            <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 4 }}>{c.submittedDate} · <span>{c.submittedBy}</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <IntakeSourceBadge source={c.intakeSource} />
            {c.harveyScore !== undefined && <HarveyScoreBadge score={c.harveyScore} />}
          </div>
        </div>
      ))}
    </div>
  )
}

const COL = '2fr 160px 140px 80px 90px'

function ContractTableRow({ c, action }: { c: PipelineContract; action?: React.ReactNode }) {
  const { fg, bg } = pipelineStatusColor[c.status]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 0, padding: '12px 20px' }}>
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: hy.fg.muted }}>{c.type} · {c.submittedDate}</span>
          <IntakeSourceBadge source={c.intakeSource} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: hy.fg.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.counterparty}</div>
      <div><Chip label={c.status} fg={fg} bg={bg} /></div>
      <div>{c.harveyScore !== undefined ? <HarveyScoreBadge score={c.harveyScore} /> : <span style={{ fontSize: 12, color: hy.fg.muted }}>—</span>}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <span style={{ fontSize: 12, color: hy.fg.muted }}>{c.value}</span>
        {action}
      </div>
    </div>
  )
}

function InboxSection() {
  const readyToSend = pipelineContracts.filter((c) => c.status === 'Ready to Send')
  const needsReview = pipelineContracts.filter((c) => c.status === 'Needs Review')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Ready to send ── */}
      <div style={{ borderRadius: hy.radius.lg, overflow: 'hidden', border: `1.5px solid ${hy.ui.success.fg}` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: hy.ui.success.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={16} color={hy.ui.success.fg} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: hy.ui.success.fg }}>{"Ready to send"}</span>
              <span style={{ fontSize: 12, color: hy.ui.success.fg, marginLeft: 8, opacity: 0.8 }}>{"Harvey reviewed and is confident — no issues found"}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: hy.ui.success.fg }}>2,478 contracts</span>
            <button type="button" className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: hy.radius.sm, border: `1.5px solid ${hy.ui.success.fg}`, background: hy.ui.success.fg, color: hy.bg.base, cursor: 'pointer' }}>
              {"Send all →"}
            </button>
          </div>
        </div>
        {/* Rows */}
        <div style={{ background: hy.bg.base }}>
          {readyToSend.map((c, i) => (
            <div key={c.id} style={{ borderTop: `1px solid ${hy.border.base}` }}>
              <ContractTableRow
                c={c}
                action={
                  <button type="button" className="transition hover:opacity-80 focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: hy.radius.sm, border: 'none', background: hy.ui.success.fg, color: hy.bg.base, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                    {"Send"}
                  </button>
                }
              />
            </div>
          ))}
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
            <button type="button" style={{ fontSize: 12, color: hy.ui.success.fg, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
              {"View all 2,478 ready to send →"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Needs your review ── */}
      <div style={{ borderRadius: hy.radius.lg, overflow: 'hidden', border: `1.5px solid ${hy.ui.warning.fg}` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: hy.ui.warning.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color={hy.ui.warning.fg} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: hy.ui.warning.fg }}>{"Needs your review"}</span>
              <span style={{ fontSize: 12, color: hy.ui.warning.fg, marginLeft: 8, opacity: 0.8 }}>{"Harvey found gray areas — your judgment is needed before sending"}</span>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: hy.ui.warning.fg }}>{needsReview.length} contracts</span>
        </div>
        {/* Rows */}
        <div style={{ background: hy.bg.base }}>
          {needsReview.map((c) => {
            const isExpanded = expandedId === c.id
            return (
              <div key={c.id} style={{ borderTop: `1px solid ${hy.border.base}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 0, padding: '12px 20px' }}>
                  <div style={{ minWidth: 0, paddingRight: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: hy.fg.muted }}>{c.type} · {c.submittedDate}</span>
                      <IntakeSourceBadge source={c.intakeSource} />
                    </div>
                    {/* Issue previews */}
                    {(c.clauseRisks ?? []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' as const }}>
                        {c.clauseRisks!.map((cr) => {
                          const rc = cr.rating === 'High' ? hy.ui.danger : cr.rating === 'Medium' ? hy.ui.warning : hy.ui.success
                          return <Chip key={cr.clause} label={cr.clause} fg={rc.fg} bg={rc.bg} />
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: hy.fg.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.counterparty}</div>
                  <div><Chip label="Needs Review" fg={hy.ui.warning.fg} bg={hy.ui.warning.bg} /></div>
                  <div>{c.harveyScore !== undefined && <HarveyScoreBadge score={c.harveyScore} />}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 12, color: hy.fg.muted }}>{c.value}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: hy.radius.sm, border: `1.5px solid ${hy.ui.warning.fg}`, background: 'none', color: hy.ui.warning.fg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const }}
                    >
                      {isExpanded ? "Close" : "Review"}
                      {!isExpanded && <ChevronRight size={11} />}
                    </button>
                  </div>
                </div>
                {/* Expanded clause risk detail */}
                {isExpanded && c.clauseRisks && (
                  <div style={{ padding: '0 20px 16px 20px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}` }}>
                    <div style={{ fontSize: 12, color: hy.fg.subtle, padding: '10px 0 10px', lineHeight: 1.5 }}>{c.harveyNote}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                      {c.clauseRisks.map((cr) => {
                        const rc = cr.rating === 'High' ? hy.ui.danger : cr.rating === 'Medium' ? hy.ui.warning : hy.ui.success
                        return (
                          <div key={cr.clause} style={{ background: hy.bg.base, borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{cr.clause}</span>
                              <Chip label={cr.rating} fg={rc.fg} bg={rc.bg} />
                              {cr.impact.map((imp) => <Chip key={imp} label={imp} fg={hy.fg.muted} bg={hy.bg.component} />)}
                            </div>
                            <div style={{ fontSize: 12, color: hy.fg.subtle, marginBottom: 8 }}>{cr.summary}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {cr.fallbackRisk && (
                                <div style={{ fontSize: 11, background: hy.ui.warning.bg, borderRadius: 4, padding: '6px 8px' }}>
                                  <div style={{ fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 2 }}>{"Risk if we push back"}</div>
                                  <div style={{ color: hy.ui.warning.fg }}>{cr.fallbackRisk}</div>
                                </div>
                              )}
                              {cr.acceptRisk && (
                                <div style={{ fontSize: 11, background: hy.ui.blue.bg, borderRadius: 4, padding: '6px 8px' }}>
                                  <div style={{ fontWeight: 600, color: hy.ui.blue.fg, marginBottom: 2 }}>{"Risk if we accept"}</div>
                                  <div style={{ color: hy.ui.blue.fg }}>{cr.acceptRisk}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button type="button" className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: hy.bg.base, background: hy.fg.base, border: 'none', borderRadius: hy.radius.sm, padding: '6px 14px', cursor: 'pointer' }}>
                        <Send size={12} />{"Approve & send to client"}
                      </button>
                      <button type="button" className="transition hover:bg-hy-bg-base-hover focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: hy.fg.base, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '6px 14px', cursor: 'pointer' }}>
                        {"Request revision"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Smart DMS — data & components ────────────────────────────────────────────

type ContractCategory = 'Revenue' | 'Expense' | 'NDA' | 'DPA' | 'Employment' | 'IP' | 'Regulatory' | 'Settlement' | 'Other'
type ExecutionStatus = 'Executed' | 'Unexecuted' | 'Unknown'
type ChildRelType = 'SOW' | 'Amendment' | 'Renewal' | 'Addendum' | 'Order Form'

interface ContractChild {
  id: string
  name: string
  rel: ChildRelType
  signed: string
  executionStatus: ExecutionStatus
  value?: string
}

interface ContractFamily {
  id: string
  parentName: string
  counterparty: string
  category: ContractCategory
  signed: string
  value: string
  children: ContractChild[]
}

interface DMSReviewItem {
  id: string
  contractName: string
  counterparty: string
  harveyCategory: ContractCategory
  confidence: number
  alternativeCategory?: ContractCategory
  executionStatus: ExecutionStatus
  flagReason: string
  source: string
  pages: number
}

const contractTypeBreakdown: Array<{ category: ContractCategory; count: number; confidence: number; color: { fg: string; bg: string } }> = [
  { category: 'Revenue', count: 3241, confidence: 96, color: hy.ui.success },
  { category: 'Expense', count: 2876, confidence: 94, color: hy.ui.blue },
  { category: 'NDA', count: 1893, confidence: 98, color: hy.ui.olive },
  { category: 'DPA', count: 891, confidence: 92, color: hy.ui.violet },
  { category: 'Employment', count: 723, confidence: 97, color: hy.ui.gold },
  { category: 'IP', count: 412, confidence: 89, color: hy.ui.gold },
  { category: 'Regulatory', count: 188, confidence: 83, color: hy.ui.warning },
  { category: 'Settlement', count: 67, confidence: 71, color: hy.ui.danger },
  { category: 'Other', count: 623, confidence: 62, color: hy.ui.neutral },
]

const executionStatusBreakdown: Array<{ status: ExecutionStatus; count: number; label: string; color: { fg: string; bg: string } }> = [
  { status: 'Executed', count: 8102, label: 'Fully signed', color: hy.ui.success },
  { status: 'Unexecuted', count: 1847, label: 'Draft / unsigned', color: hy.ui.gold },
  { status: 'Unknown', count: 298, label: 'Harvey needs to check', color: hy.ui.neutral },
]

const contractFamilies: ContractFamily[] = [
  {
    id: 'fam-1',
    parentName: 'Walmart Retail Intelligence & Enterprise Analytics Platform',
    counterparty: 'Walmart',
    category: 'Revenue',
    signed: 'Jan 14, 2019',
    value: '$38.2M',
    children: [
      { id: 'c1-1', name: 'SOW-001 — Supplier Analytics Dashboard Build-Out', rel: 'SOW', signed: 'Feb 3, 2019', executionStatus: 'Executed', value: '$2.1M' },
      { id: 'c1-2', name: 'SOW-004 — Real-Time Fraud Detection & Scoring Module', rel: 'SOW', signed: 'Sep 12, 2020', executionStatus: 'Executed', value: '$3.4M' },
      { id: 'c1-3', name: 'SOW-011 — AI-Powered Operations Integration (Phase 3)', rel: 'SOW', signed: 'Mar 1, 2023', executionStatus: 'Executed', value: '$5.8M' },
      { id: 'c1-4', name: 'SOW-014 — Legal AI & Contract Lifecycle Expansion', rel: 'SOW', signed: 'Nov 20, 2024', executionStatus: 'Executed', value: '$4.2M' },
      { id: 'c1-5', name: 'Amendment No. 2 — Expanded Aggregate Liability Cap ($50M)', rel: 'Amendment', signed: 'Jul 8, 2021', executionStatus: 'Executed' },
      { id: 'c1-6', name: 'Amendment No. 5 — GDPR/SCCs Data Processing Addendum', rel: 'Addendum', signed: 'May 25, 2022', executionStatus: 'Executed' },
      { id: 'c1-7', name: 'Renewal & Expansion — FY2024–FY2026 Term', rel: 'Renewal', signed: 'Dec 31, 2023', executionStatus: 'Executed', value: '$12.7M' },
      { id: 'c1-8', name: 'SOW-016 — Supply Chain Risk Analytics Pilot', rel: 'SOW', signed: '—', executionStatus: 'Unexecuted', value: '$890K' },
    ],
  },
  {
    id: 'fam-2',
    parentName: "Acme Corp Platform Subscription, Licensing & Professional Services",
    counterparty: 'Acme Corp',
    category: 'Revenue',
    signed: 'Feb 20, 2026',
    value: '$2.4M',
    children: [
      { id: 'c2-1', name: 'Order Form 001 — Core Platform Annual Subscription', rel: 'Order Form', signed: 'Feb 20, 2026', executionStatus: 'Executed', value: '$1.6M' },
      { id: 'c2-2', name: 'Order Form 002 — Generative AI Legal Research Add-On', rel: 'Order Form', signed: 'Feb 20, 2026', executionStatus: 'Executed', value: '$800K' },
      { id: 'c2-3', name: 'Data Processing & Sub-Processor Disclosure Addendum', rel: 'Addendum', signed: 'Feb 20, 2026', executionStatus: 'Executed' },
    ],
  },
  {
    id: 'fam-3',
    parentName: 'Brightwater Capital Cloud Migration & Managed Hosting Services',
    counterparty: 'Brightwater Capital',
    category: 'Expense',
    signed: '—',
    value: '$1.4M',
    children: [
      { id: 'c3-1', name: 'SOW — Phase 1 Hybrid Infrastructure Build-Out & Configuration', rel: 'SOW', signed: '—', executionStatus: 'Unexecuted', value: '$620K' },
      { id: 'c3-2', name: 'SLA Addendum — 99.95% Uptime, Tier 1 Support & Incident Response', rel: 'Addendum', signed: '—', executionStatus: 'Unexecuted' },
    ],
  },
  {
    id: 'fam-4',
    parentName: 'GlobalTech Ltd Data Processing, GDPR Compliance & Sub-Processor Framework',
    counterparty: 'GlobalTech Ltd',
    category: 'DPA',
    signed: 'Mar 10, 2021',
    value: '—',
    children: [
      { id: 'c4-1', name: 'Annex I — EU Standard Contractual Clauses (Module 2)', rel: 'Addendum', signed: 'Mar 10, 2021', executionStatus: 'Executed' },
      { id: 'c4-2', name: 'Annex IV — Updated Sub-Processor Disclosure Schedule v2', rel: 'Addendum', signed: 'Aug 15, 2022', executionStatus: 'Executed' },
      { id: 'c4-3', name: 'Amendment No. 1 — DORA Article 28 ICT Risk Compliance Language', rel: 'Amendment', signed: '—', executionStatus: 'Unexecuted' },
    ],
  },
  {
    id: 'fam-5',
    parentName: 'Apex Financial Strategic Channel Partnership & Revenue Share',
    counterparty: 'Apex Financial',
    category: 'Revenue',
    signed: 'Mar 4, 2026',
    value: '$2.1M',
    children: [
      { id: 'c5-1', name: 'Addendum A — Joint Marketing Initiatives & Co-Branding Rights', rel: 'Addendum', signed: 'Mar 4, 2026', executionStatus: 'Executed' },
      { id: 'c5-2', name: 'Schedule 1 — Referral Commission Tiers & Payout Schedule', rel: 'Order Form', signed: 'Mar 4, 2026', executionStatus: 'Executed', value: '$340K' },
    ],
  },
  {
    id: 'fam-6',
    parentName: 'Stratosphere Inc Multi-Tenant Private Cloud Infrastructure Platform',
    counterparty: 'Stratosphere Inc',
    category: 'Expense',
    signed: '—',
    value: '$1.8M',
    children: [
      { id: 'c6-1', name: 'Annex B — Disaster Recovery, BCP & RTO/RPO Commitments', rel: 'Addendum', signed: '—', executionStatus: 'Unexecuted' },
      { id: 'c6-2', name: 'Security Schedule — Penetration Testing, VAPT & Audit Rights', rel: 'Addendum', signed: '—', executionStatus: 'Unexecuted' },
      { id: 'c6-3', name: 'SOW-001 — Legacy System Migration & Data Portability Services', rel: 'SOW', signed: '—', executionStatus: 'Unexecuted', value: '$210K' },
    ],
  },
  {
    id: 'fam-7',
    parentName: 'HSBC Financial Services AI Platform & Legal Workflow Automation',
    counterparty: 'HSBC',
    category: 'Revenue',
    signed: 'Jan 8, 2024',
    value: '$1.2M',
    children: [
      { id: 'c7-1', name: 'Order Form 001 — Platform Access & Named User Licenses (Year 1)', rel: 'Order Form', signed: 'Jan 8, 2024', executionStatus: 'Executed', value: '$1.2M' },
      { id: 'c7-2', name: 'Financial Services Regulatory Compliance Addendum (FCA/PRA)', rel: 'Addendum', signed: 'Jan 8, 2024', executionStatus: 'Executed' },
      { id: 'c7-3', name: 'Amendment No. 1 — Auto-Renewal Opt-Out Notice Extension', rel: 'Amendment', signed: '—', executionStatus: 'Unexecuted' },
    ],
  },
]

const dmsReviewQueue: DMSReviewItem[] = [
  {
    id: 'dms-1',
    contractName: 'Vendor Procurement Operating Framework & Third-Party Risk Protocol — FY2018',
    counterparty: 'Internal / Procurement',
    harveyCategory: 'Regulatory',
    confidence: 52,
    alternativeCategory: 'Expense',
    executionStatus: 'Unknown',
    flagReason: 'Document contains both vendor payment schedules and regulatory compliance obligations. Harvey cannot determine primary classification without understanding internal record-keeping intent.',
    source: 'SharePoint — Legal Archive',
    pages: 94,
  },
  {
    id: 'dms-2',
    contractName: 'Project Horizon — Letter of Intent re: Blue Wave Analytics Strategic Acquisition',
    counterparty: 'Blue Wave Analytics',
    harveyCategory: 'Revenue',
    confidence: 63,
    alternativeCategory: 'Settlement',
    executionStatus: 'Unknown',
    flagReason: "LOI contains non-binding acquisition terms alongside binding exclusivity and mutual NDA provisions. Harvey cannot confirm whether the underlying deal closed — if it didn't, this may be a 'Settlement' or 'Other'.",
    source: 'Email attachment via ask@harvey.ai',
    pages: 8,
  },
  {
    id: 'dms-3',
    contractName: 'Confidential Settlement & General Release — Litigation Matter #2021-047',
    counterparty: 'Redacted per outside counsel instruction',
    harveyCategory: 'Settlement',
    confidence: 74,
    executionStatus: 'Unknown',
    flagReason: "Counterparty identity is redacted throughout. Harvey is confident in 'Settlement' classification but cannot verify execution status — the signature block is on a separate exhibit not included in this upload.",
    source: 'Uploaded directly — Outside Counsel',
    pages: 31,
  },
  {
    id: 'dms-4',
    contractName: 'Regulatory Affairs & Compliance Advisory Services — Dr. Susan Kaplan',
    counterparty: 'Dr. Susan Kaplan (individual)',
    harveyCategory: 'Employment',
    confidence: 68,
    alternativeCategory: 'Expense',
    executionStatus: 'Executed',
    flagReason: "Independent contractor vs. employment classification is ambiguous. Jurisdiction is California — Harvey flagged potential AB5 misclassification exposure. Attorney review recommended before filing.",
    source: 'HR Shared Drive',
    pages: 14,
  },
  {
    id: 'dms-5',
    contractName: 'Crest Ventures Strategic Channel Partnership Memorandum of Understanding',
    counterparty: 'Crest Ventures',
    harveyCategory: 'Revenue',
    confidence: 47,
    alternativeCategory: 'NDA',
    executionStatus: 'Unexecuted',
    flagReason: "MOU contains reciprocal confidentiality and non-solicitation obligations typical of a standalone NDA, alongside binding revenue-sharing terms. Dual-purpose document requires attorney classification before archiving.",
    source: 'Harvey on Teams',
    pages: 6,
  },
  {
    id: 'dms-6',
    contractName: 'OmniSoft Perpetual ERP License & Maintenance Agreement v3.1 (OmniSoft acquired by Vertex Solutions 2022)',
    counterparty: 'Vertex Solutions (successor to OmniSoft)',
    harveyCategory: 'Expense',
    confidence: 79,
    executionStatus: 'Executed',
    flagReason: "Original licensor OmniSoft was acquired by Vertex Solutions in 2022. Harvey flagged that the assignment clause has not been formally acknowledged in writing — successor entity rights should be confirmed to ensure the license remains valid.",
    source: 'SharePoint — IT Archive',
    pages: 47,
  },
]

type LibrarySubView = 'overview' | 'families' | 'review-queue'

function ContractLibraryView() {
  const [subView, setSubView] = useState<LibrarySubView>('overview')
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [searchFamily, setSearchFamily] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ContractCategory | 'All'>('All')

  const totalAnalyzed = 10247
  const totalContracts = 10891
  const pct = Math.round((totalAnalyzed / totalContracts) * 100)
  const classified = contractTypeBreakdown.reduce((s, t) => s + t.count, 0)
  const parentChildLinks = 1423
  const flaggedCount = dmsReviewQueue.length

  const filteredFamilies = contractFamilies.filter((f) => {
    const matchSearch = !searchFamily || f.parentName.toLowerCase().includes(searchFamily.toLowerCase()) || f.counterparty.toLowerCase().includes(searchFamily.toLowerCase())
    const matchCat = categoryFilter === 'All' || f.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Harvey DMS ingestion banner */}
      <div style={{ padding: '16px 20px', borderRadius: hy.radius.lg, border: `1px solid ${hy.ui.blue.fg}`, background: hy.ui.blue.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={15} color={hy.ui.blue.fg} />
            <span style={{ fontSize: 14, fontWeight: 600, color: hy.ui.blue.fg }}>{"Harvey is organizing your contract library"}</span>
          </div>
          <span style={{ fontSize: 12, color: hy.ui.blue.fg }}>
            <RefreshCw size={11} style={{ display: 'inline', marginRight: 4 }} />
            {"Last sync: 3 minutes ago — SharePoint · Harvey on Teams · ask@harvey.ai"}
          </span>
        </div>
        <div style={{ height: 6, background: `${hy.ui.blue.fg}33`, borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: hy.ui.blue.fg, borderRadius: 999 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
          {[
            { label: "Contracts ingested", value: totalAnalyzed.toLocaleString(), sub: `of ${totalContracts.toLocaleString()} (${pct}%)` },
            { label: "Classified", value: classified.toLocaleString(), sub: "by type" },
            { label: "Parent-child links", value: parentChildLinks.toLocaleString(), sub: "relationships mapped" },
            { label: "Execution status", value: executionStatusBreakdown[0].count.toLocaleString(), sub: "confirmed executed" },
            { label: "Flagged for review", value: flaggedCount.toString(), sub: `${Math.round(((totalAnalyzed - flaggedCount) / totalAnalyzed) * 100)}% auto-classified`, warn: true },
          ].map(({ label, value, sub, warn }) => (
            <div key={label} style={{ padding: '0 16px', borderRight: `1px solid ${hy.ui.blue.fg}33` }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: warn ? hy.ui.warning.fg : hy.ui.blue.fg, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: warn ? hy.ui.warning.fg : hy.ui.blue.fg, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: warn ? hy.ui.warning.fg : `${hy.ui.blue.fg}bb`, marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-view tabs */}
      <div className="flex items-center gap-1 mb-1">
        <AnimatedBackground
          defaultValue={subView}
          onValueChange={(value) => value && setSubView(value as LibrarySubView)}
          className="bg-bg-subtle rounded-md"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {([
            { key: 'overview', label: 'Classification Overview' },
            { key: 'families', label: 'Contract Families' },
            { key: 'review-queue', label: 'Review Queue', count: flaggedCount },
          ] as { key: LibrarySubView; label: string; count?: number }[]).map(({ key, label, count }) => (
            <button
              key={key}
              data-id={key}
              className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {label}
              {count !== undefined && <span className="ml-1.5 text-xs font-semibold text-fg-muted">{count}</span>}
            </button>
          ))}
        </AnimatedBackground>
      </div>

      {/* Classification Overview */}
      {subView === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
            {/* Contract type grid */}
            <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={14} color={hy.fg.muted} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Classification by type"}</div>
                  <div style={{ fontSize: 12, color: hy.fg.muted }}>{"Harvey's confidence score per category"}</div>
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                {contractTypeBreakdown.map((item, i) => {
                  const barWidth = Math.round((item.count / classified) * 100)
                  const confColor = item.confidence >= 90 ? hy.ui.success.fg : item.confidence >= 75 ? hy.ui.gold.fg : hy.ui.danger.fg
                  const autoClassified = Math.round(item.count * (item.confidence / 100))
                  return (
                    <div key={item.category} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 52px 180px', alignItems: 'center', gap: 14, padding: '11px 20px', borderBottom: i < contractTypeBreakdown.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 3, height: 22, borderRadius: 999, background: item.color.fg, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{item.category}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 5, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barWidth}%`, background: item.color.fg, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.subtle, minWidth: 44, textAlign: 'right' }}>{item.count.toLocaleString()}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: confColor }}>{item.confidence}%</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ height: 4, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.confidence}%`, background: confColor, borderRadius: 999 }} />
                        </div>
                        <div style={{ fontSize: 11, color: hy.fg.muted }}>
                          {autoClassified.toLocaleString()} auto-classified
                          {item.confidence < 80 && <span style={{ color: hy.ui.warning.fg, marginLeft: 6 }}>· {item.count - autoClassified} flagged</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Execution status panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base, marginBottom: 2 }}>{"Execution status"}</div>
                <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 14 }}>{`Harvey's signature detection across ${totalAnalyzed.toLocaleString()} analyzed contracts`}</div>
                {executionStatusBreakdown.map((item) => {
                  const pctOfAnalyzed = Math.round((item.count / totalAnalyzed) * 100)
                  return (
                    <div key={item.status} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.status === 'Executed' && <CheckCircle size={13} color={hy.ui.success.fg} />}
                          {item.status === 'Unexecuted' && <Clock size={13} color={hy.ui.gold.fg} />}
                          {item.status === 'Unknown' && <HelpCircle size={13} color={hy.ui.neutral.fg} />}
                          <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{item.status}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: item.color.fg }}>{item.count.toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: hy.fg.muted, marginLeft: 4 }}>{pctOfAnalyzed}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pctOfAnalyzed}%`, background: item.color.fg, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{item.label}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, padding: '14px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, marginBottom: 10 }}>{"Harvey's recommendations"}</div>
                {[
                  { icon: <CheckSquare size={13} color={hy.ui.success.fg} />, text: "8,102 contracts confirmed executed — no action needed." },
                  { icon: <AlertTriangle size={13} color={hy.ui.warning.fg} />, text: "298 contracts have unknown execution status. Harvey recommends reviewing signature blocks." },
                  { icon: <Link2 size={13} color={hy.ui.blue.fg} />, text: "47 Revenue contracts lack a parent MSA. Harvey can suggest parent candidates." },
                  { icon: <HelpCircle size={13} color={hy.ui.danger.fg} />, text: "Settlement category has lowest confidence (71%). Attorney review recommended before closing records." },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
                    <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.5 }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Families */}
      {subView === 'families' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: hy.fg.subtle }}>
            {`Harvey has mapped ${parentChildLinks.toLocaleString()} parent-child relationships across your library. Each family shows the parent agreement and all linked child documents (SOWs, amendments, renewals, addenda).`}
          </div>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: hy.fg.muted, pointerEvents: 'none' }} />
              <input
                type="search"
                placeholder="Search families or counterparty…"
                value={searchFamily}
                onChange={(e) => setSearchFamily(e.target.value)}
                style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 13, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, background: hy.bg.base, color: hy.fg.base, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['All', 'Revenue', 'Expense', 'DPA', 'NDA'] as Array<ContractCategory | 'All'>).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                  style={{ fontSize: 12, fontWeight: categoryFilter === cat ? 600 : 400, padding: '5px 12px', borderRadius: 6, border: `1px solid ${categoryFilter === cat ? hy.fg.base : hy.border.base}`, background: categoryFilter === cat ? hy.bg.component : 'transparent', color: categoryFilter === cat ? hy.fg.base : hy.fg.subtle, cursor: 'pointer' }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: hy.fg.muted, marginLeft: 'auto' }}>{filteredFamilies.length} families · {filteredFamilies.reduce((s, f) => s + f.children.length, 0)} child documents</span>
          </div>

          {/* Families list */}
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 140px 100px 80px 100px 60px', gap: 0, padding: '8px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              {['', "Parent agreement", "Counterparty", "Category", "Signed", "Value", "Children"].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {filteredFamilies.map((fam, fi) => {
              const isExpanded = expandedFamilyId === fam.id
              const catItem = contractTypeBreakdown.find((c) => c.category === fam.category)
              const executedChildren = fam.children.filter((c) => c.executionStatus === 'Executed').length
              return (
                <div key={fam.id} style={{ borderBottom: fi < filteredFamilies.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedFamilyId(isExpanded ? null : fam.id)}
                    className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                    style={{ display: 'grid', gridTemplateColumns: '24px 2fr 140px 100px 80px 100px 60px', gap: 0, alignItems: 'center', padding: '13px 20px', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'transparent' }}
                  >
                    {isExpanded
                      ? <ChevronDown size={14} color={hy.fg.muted} />
                      : <ChevronRight size={14} color={hy.fg.muted} />
                    }
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{fam.parentName}</div>
                      <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Link2 size={10} />
                        {`${fam.children.length} child documents · ${executedChildren} executed`}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: hy.fg.subtle }}>{fam.counterparty}</div>
                    <div>
                      {catItem && <Chip label={fam.category} fg={catItem.color.fg} bg={catItem.color.bg} />}
                    </div>
                    <div style={{ fontSize: 12, color: fam.signed === '—' ? hy.ui.warning.fg : hy.fg.subtle }}>
                      {fam.signed === '—' ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} />Unsigned</span> : fam.signed}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{fam.value}</div>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{fam.children.length}</span>
                    </div>
                  </button>

                  {/* Children */}
                  {isExpanded && (
                    <div style={{ background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}`, padding: '8px 0 8px 44px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '20px 2fr 120px 100px 80px 100px', gap: 0, padding: '4px 20px 8px', marginBottom: 2 }}>
                        {['', "Document", "Relationship", "Execution", "Signed", "Value"].map((h, i) => (
                          <div key={i} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
                        ))}
                      </div>
                      {fam.children.map((child, ci) => {
                        const statusColor = child.executionStatus === 'Executed' ? hy.ui.success : child.executionStatus === 'Unexecuted' ? hy.ui.gold : hy.ui.neutral
                        return (
                          <div
                            key={child.id}
                            style={{ display: 'grid', gridTemplateColumns: '20px 2fr 120px 100px 80px 100px', gap: 0, alignItems: 'center', padding: '9px 20px', borderTop: ci > 0 ? `1px solid ${hy.border.base}` : 'none' }}
                          >
                            <div style={{ width: 1, height: '100%', background: hy.border.base, margin: '0 auto' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 1, background: hy.border.base }} />
                              <span style={{ fontSize: 12, color: hy.fg.base }}>{child.name}</span>
                            </div>
                            <div><Chip label={child.rel} fg={hy.ui.blue.fg} bg={hy.ui.blue.bg} /></div>
                            <div><Chip label={child.executionStatus} fg={statusColor.fg} bg={statusColor.bg} /></div>
                            <div style={{ fontSize: 12, color: hy.fg.subtle }}>{child.signed}</div>
                            <div style={{ fontSize: 12, color: hy.fg.subtle }}>{child.value ?? '—'}</div>
                          </div>
                        )
                      })}
                      <div style={{ padding: '10px 20px 4px' }}>
                        <button
                          type="button"
                          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: hy.ui.blue.fg, background: hy.ui.blue.bg, border: `1px solid ${hy.ui.blue.fg}`, borderRadius: hy.radius.sm, padding: '5px 12px', cursor: 'pointer' }}
                        >
                          <Plus size={12} />
                          {"Add child document"}
                        </button>
                        <button
                          type="button"
                          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: hy.fg.subtle, background: 'transparent', border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '5px 12px', cursor: 'pointer', marginLeft: 8 }}
                        >
                          <FolderTree size={12} />
                          {"View full family tree"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <div style={{ padding: '12px 20px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: hy.fg.muted }}>Showing {filteredFamilies.length} of {parentChildLinks.toLocaleString()} families — page 1 of {Math.ceil(parentChildLinks / 6)}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['← Prev', 'Next →'].map((label) => (
                  <button key={label} type="button" style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.muted, cursor: 'pointer' }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Queue */}
      {subView === 'review-queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}`, borderRadius: hy.radius.md, padding: '12px 16px' }}>
            <HelpCircle size={15} color={hy.ui.warning.fg} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hy.ui.warning.fg }}>{`${dmsReviewQueue.filter((i) => !resolvedIds.has(i.id)).length} contracts need your input before Harvey can finalize their classification`}</div>
              <div style={{ fontSize: 12, color: hy.ui.warning.fg, marginTop: 2 }}>{"Harvey flagged these because confidence is below 80% or execution status is ambiguous. Confirm, override, or escalate each item."}</div>
            </div>
          </div>

          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 80px 100px 1fr 160px', gap: 0, padding: '8px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              {["Contract", "Harvey's guess", "Confidence", "Execution", "Flag reason", "Actions"].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {dmsReviewQueue.map((item, i) => {
              const isResolved = resolvedIds.has(item.id)
              const confColor = item.confidence >= 70 ? hy.ui.gold : hy.ui.danger
              const execColor = item.executionStatus === 'Executed' ? hy.ui.success : item.executionStatus === 'Unexecuted' ? hy.ui.gold : hy.ui.neutral
              const catItem = contractTypeBreakdown.find((c) => c.category === item.harveyCategory)
              return (
                <div
                  key={item.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 120px 80px 100px 1fr 160px', gap: 0, alignItems: 'start', padding: '14px 20px', borderBottom: i < dmsReviewQueue.length - 1 ? `1px solid ${hy.border.base}` : 'none', background: isResolved ? hy.ui.success.bg : 'transparent', opacity: isResolved ? 0.7 : 1 }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{item.contractName}</div>
                    <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{item.counterparty} · {item.pages}pp · {item.source}</div>
                  </div>
                  <div>
                    {catItem && <Chip label={item.harveyCategory} fg={catItem.color.fg} bg={catItem.color.bg} />}
                    {item.alternativeCategory && (
                      <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 4 }}>
                        or <span style={{ color: hy.fg.subtle }}>{item.alternativeCategory}</span>?
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: confColor.fg }}>{item.confidence}%</div>
                    <div style={{ height: 4, background: hy.bg.component, borderRadius: 999, overflow: 'hidden', marginTop: 3, width: 48 }}>
                      <div style={{ height: '100%', width: `${item.confidence}%`, background: confColor.fg, borderRadius: 999 }} />
                    </div>
                  </div>
                  <div><Chip label={item.executionStatus} fg={execColor.fg} bg={execColor.bg} /></div>
                  <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.5, paddingRight: 12 }}>{item.flagReason}</div>
                  <div>
                    {isResolved ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: hy.ui.success.fg }}>
                        <CheckCircle size={13} /> {"Resolved"}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => setResolvedIds((prev) => { const next = new Set(prev); next.add(item.id); return next })}
                          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                          style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: hy.radius.sm, border: `1px solid ${hy.ui.success.fg}`, background: hy.ui.success.bg, color: hy.ui.success.fg, cursor: 'pointer', textAlign: 'left' }}
                        >
                          <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
                          {"Confirm Harvey's guess"}
                        </button>
                        <button
                          type="button"
                          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                          style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.base, cursor: 'pointer', textAlign: 'left' }}
                        >
                          {"Override category"}
                        </button>
                        <button
                          type="button"
                          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                          style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: hy.radius.sm, border: 'none', background: 'transparent', color: hy.fg.muted, cursor: 'pointer', textAlign: 'left' }}
                        >
                          {"Escalate to attorney"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PortfolioRiskSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const atRiskContracts = pipelineContracts.filter((c) => c.isAtRisk)

  // Group by highest-severity category per contract
  const grouped = portfolioRiskByCategory.map((cat) => ({
    ...cat,
    items: atRiskContracts.filter((c) =>
      c.atRiskFlags?.some((f) => f.category === cat.category)
    ),
  })).filter((g) => g.items.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Portfolio summary banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: "Contracts flagged", value: '43', sub: "across 7 risk categories", color: hy.ui.danger },
          { label: "Financial exposure", value: '$25.1M', sub: "across flagged contracts", color: hy.ui.warning },
          { label: "Require immediate action", value: '11', sub: "critical severity", color: hy.ui.danger },
          { label: "Harvey next steps ready", value: '38', sub: "Harvey can draft remediation", color: hy.ui.blue },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: hy.fg.muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: color.fg, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Distinction callout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: '12px 16px', borderRadius: hy.radius.md, border: `1px solid ${hy.ui.warning.fg}`, background: hy.ui.warning.bg, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={14} color={hy.ui.warning.fg} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 3 }}>{"Real-time review (32 contracts)"}</div>
            <div style={{ fontSize: 12, color: hy.ui.warning.fg, lineHeight: 1.5 }}>{"Harvey reviewed incoming contracts and found gray areas requiring your judgment before sending. These are active in your negotiation queue."}</div>
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderRadius: hy.radius.md, border: `1px solid ${hy.ui.danger.fg}`, background: hy.ui.danger.bg, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Shield size={14} color={hy.ui.danger.fg} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: hy.ui.danger.fg, marginBottom: 3 }}>{"Portfolio monitoring (43 contracts)"}</div>
            <div style={{ fontSize: 12, color: hy.ui.danger.fg, lineHeight: 1.5 }}>{"Harvey continuously scans your contract portfolio and flags risks in existing agreements — regulatory changes, counterparty events, lifecycle triggers, and commercial exposure. Harvey can suggest next steps but cannot act without your approval."}</div>
          </div>
        </div>
      </div>

      {/* Risk groups */}
      {grouped.map((group) => {
        const color = riskCategoryColor[group.category as RiskCategory]
        return (
          <div key={group.category}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 3, height: 18, borderRadius: 999, background: color.fg }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: color.fg }}>{group.category}</span>
              <Chip label={`${group.items.length} contracts`} fg={color.fg} bg={color.bg} />
              {group.exposure && <span style={{ fontSize: 12, color: hy.fg.muted }}>{group.exposure} exposure</span>}
              <div style={{ flex: 1, height: 1, background: `${color.fg}33` }} />
            </div>
            <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
              {group.items.map((contract, ci) => {
                const flags = contract.atRiskFlags?.filter((f) => f.category === group.category) ?? []
                const isExpanded = expandedId === `${group.category}-${contract.id}`
                const topFlag = flags[0]
                const sevColor = topFlag?.severity === 'High' || topFlag?.severity === 'Critical' ? hy.ui.danger : topFlag?.severity === 'Medium' ? hy.ui.warning : hy.ui.gold
                return (
                  <div key={contract.id} style={{ borderBottom: ci < group.items.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : `${group.category}-${contract.id}`)}
                      className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ display: 'grid', gridTemplateColumns: '24px 2fr 140px 200px 100px 100px', gap: 12, alignItems: 'center', padding: '13px 20px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {isExpanded ? <ChevronDown size={14} color={hy.fg.muted} /> : <ChevronRight size={14} color={hy.fg.muted} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{contract.name}</div>
                        <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 1 }}>{contract.contractId ?? contract.id} · {contract.type}</div>
                      </div>
                      <div style={{ fontSize: 12, color: hy.fg.subtle }}>{contract.counterparty}</div>
                      <div style={{ fontSize: 12, color: hy.fg.subtle }}>{topFlag?.type ?? '—'}</div>
                      <div><Chip label={topFlag?.severity ?? '—'} fg={sevColor.fg} bg={sevColor.bg} /></div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{contract.value ?? '—'}</div>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '0 20px 18px 56px', borderTop: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
                        {flags.map((flag, fi) => (
                          <div key={fi} style={{ marginTop: 14, padding: '12px 14px', borderRadius: hy.radius.md, border: `1px solid ${(flag.severity === 'High' ? hy.ui.danger : flag.severity === 'Medium' ? hy.ui.warning : hy.ui.gold).fg}`, background: (flag.severity === 'High' ? hy.ui.danger : flag.severity === 'Medium' ? hy.ui.warning : hy.ui.gold).bg }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <Chip label={flag.type} fg={(flag.severity === 'High' ? hy.ui.danger : flag.severity === 'Medium' ? hy.ui.warning : hy.ui.gold).fg} bg="transparent" />
                              <Chip label={flag.severity} fg={(flag.severity === 'High' ? hy.ui.danger : flag.severity === 'Medium' ? hy.ui.warning : hy.ui.gold).fg} bg={(flag.severity === 'High' ? hy.ui.danger : flag.severity === 'Medium' ? hy.ui.warning : hy.ui.gold).bg} />
                            </div>
                            <div style={{ fontSize: 13, color: hy.fg.base, lineHeight: 1.6, marginBottom: 10 }}>{flag.description}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: hy.radius.sm, background: hy.bg.base, border: `1px solid ${hy.border.base}` }}>
                              <Zap size={13} color={hy.ui.blue.fg} style={{ flexShrink: 0, marginTop: 1 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.blue.fg, marginBottom: 3 }}>{"Harvey's suggested next step"}</div>
                                <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.5 }}>{flag.harveySuggestion}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContractsPipelineTable() {
  const [contractsView, setContractsView] = useState<'pipeline' | 'library'>('pipeline')
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | 'All' | 'At-Risk'>('All')
  const [search, setSearch] = useState('')
  const TOTAL = 2847
  const statuses: Array<PipelineStatus | 'All' | 'At-Risk'> = ['All', 'Submitted', 'Ready to Send', 'Needs Review', 'In Negotiation', 'Executed', 'At-Risk']
  const statusCounts: Record<string, number> = { All: TOTAL, Submitted: 247, 'Ready to Send': 2478, 'Needs Review': 32, 'In Negotiation': 67, Executed: 23, 'At-Risk': 43 }
  const filtered = (
    statusFilter === 'At-Risk'
      ? pipelineContracts.filter((c) => c.isAtRisk)
      : statusFilter === 'All'
        ? pipelineContracts
        : pipelineContracts.filter((c) => c.status === statusFilter)
  ).filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.counterparty.toLowerCase().includes(search.toLowerCase()))
  const shownCount = filtered.length
  const totalForFilter = statusCounts[statusFilter] ?? TOTAL

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', background: hy.bg.subtle, borderRadius: hy.radius.md, padding: 3, border: `1px solid ${hy.border.base}` }}>
          {([
            { key: 'pipeline', label: "Pipeline", icon: <TrendingUp size={13} /> },
            { key: 'library', label: "Library", icon: <Database size={13} />, badge: "Smart DMS" },
          ] as { key: 'pipeline' | 'library'; label: string; icon: React.ReactNode; badge?: string }[]).map(({ key, label, icon, badge }) => {
            const isActive = contractsView === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setContractsView(key)}
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? hy.fg.base : hy.fg.subtle, background: isActive ? hy.bg.base : 'transparent', border: isActive ? `1px solid ${hy.border.base}` : '1px solid transparent', borderRadius: hy.radius.sm, cursor: 'pointer', boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}
              >
                {icon}
                {label}
                {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: hy.ui.blue.bg, color: hy.ui.blue.fg }}>{badge}</span>}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: hy.fg.muted }}>
          {contractsView === 'pipeline' ? `${TOTAL.toLocaleString()} active contracts` : '10,891 contracts in library'}
        </div>
      </div>

      {contractsView === 'library' && <ContractLibraryView />}

      {contractsView === 'pipeline' && statusFilter === 'At-Risk' && (
        <PortfolioRiskSection />
      )}

      {contractsView === 'pipeline' && <>

      {statusFilter !== 'At-Risk' && <>

      {/* Pipeline health — full detail view */}
      {statusFilter === 'All' && !search && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PipelineHealthPanel />
          {/* Intake source breakdown */}
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, marginBottom: 2 }}>{"Intake sources"}</div>
            <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 14 }}>{"This week"}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {([
                { source: 'Harvey on Teams' as IntakeSource, count: 21, pct: 45 },
                { source: 'ask@harvey.ai' as IntakeSource, count: 16, pct: 34 },
                { source: 'Shared Spaces' as IntakeSource, count: 10, pct: 21 },
              ]).map(({ source, count, pct }) => {
                const { fg } = intakeSourceColor[source]
                return (
                  <div key={source}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <IntakeSourceBadge source={source} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: fg, borderRadius: 999 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Inbox: ready + needs review — only shown on All tab with no search */}
      {statusFilter === 'All' && !search && <InboxSection />}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Filter size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: hy.fg.muted, pointerEvents: 'none' }} />
          <input
            type="search"
            placeholder="Search contracts or counterparty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 13, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, background: hy.bg.base, color: hy.fg.base, outline: 'none' }}
          />
        </div>
        <div style={{ fontSize: 12, color: hy.fg.muted, whiteSpace: 'nowrap' as const }}>
          Showing {shownCount} of <strong style={{ color: hy.fg.subtle }}>{totalForFilter.toLocaleString()}</strong> contracts
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${hy.border.base}` }}>
        {statuses.map((s) => {
          const isActive = s === statusFilter
          const isNeedsReview = s === 'Needs Review'
          const isReady = s === 'Ready to Send'
          const isAtRisk = s === 'At-Risk'
          const activeColor = isNeedsReview ? hy.ui.warning.fg : isReady ? hy.ui.success.fg : isAtRisk ? hy.ui.danger.fg : hy.fg.base
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, padding: '8px 14px', border: 'none', borderBottom: isActive ? `2px solid ${activeColor}` : '2px solid transparent', background: 'none', color: isActive ? activeColor : hy.fg.muted, cursor: 'pointer', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {s}
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? activeColor : hy.fg.muted, background: isActive ? (isNeedsReview ? hy.ui.warning.bg : isReady ? hy.ui.success.bg : isAtRisk ? hy.ui.danger.bg : hy.bg.component) : 'none', padding: '1px 5px', borderRadius: 10 }}>
                {statusCounts[s]?.toLocaleString() ?? ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 0, padding: '8px 20px', borderBottom: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
          {["Contract", "Counterparty", "Status", "Risk", "Value"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>
        {filtered.map((c, i) => (
          <div key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
            <ContractTableRow c={c} />
          </div>
        ))}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: hy.bg.subtle }}>
          <span style={{ fontSize: 12, color: hy.fg.muted }}>Showing {shownCount} of {totalForFilter.toLocaleString()} — page 1 of {Math.ceil(totalForFilter / 20).toLocaleString()}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['← Prev', 'Next →'].map((label) => (
              <button key={label} type="button" style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.muted, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
      </>}
      </>}
    </div>
  )
}

// ── Harvey Agents audit log ────────────────────────────────────────────────────

type AgentStatus = 'completed' | 'running' | 'attention'

type AgentLogEntry = {
  id: string
  agent: string
  stage: '01' | '02' | '03'
  stageLabel: string
  status: AgentStatus
  title: string
  detail: string
  affected?: string
  timestamp: string
  linkTab?: ActiveTab
}

const agentLog: AgentLogEntry[] = [
  { id: 'al1', agent: 'Document Classifier', stage: '01', stageLabel: 'Contract Intake', status: 'completed', title: 'Auto-classified 44 contracts', detail: '36 high-confidence · 8 flagged for review · avg confidence 91%', affected: '44 contracts', timestamp: '2 min ago', linkTab: 'contracts' },
  { id: 'al2', agent: 'Risk Scorer', stage: '02', stageLabel: 'Review Outcomes', status: 'attention', title: 'High-risk deviation flagged — Acme Corp MSA', detail: 'Uncapped liability clause detected · deviates from playbook standard by 3 positions', affected: 'Acme Corp MSA', timestamp: '14 min ago', linkTab: 'contracts' },
  { id: 'al3', agent: 'Obligation Monitor', stage: '03', stageLabel: 'Portfolio Health', status: 'attention', title: '3 opt-out deadlines within 14 days', detail: 'Walmart renewal window closes Mar 18 · HSBC SLA renewal Mar 22 · NovaStar NDA Mar 24', affected: '3 contracts', timestamp: '31 min ago', linkTab: 'key-dates' },
  { id: 'al4', agent: 'Playbook Enforcer', stage: '02', stageLabel: 'Review Outcomes', status: 'completed', title: 'Playbook checks passed — 28 contracts approved', detail: 'All 28 contracts cleared liability, IP, and governing law rules without exception', affected: '28 contracts', timestamp: '1 hr ago', linkTab: 'playbooks' },
  { id: 'al5', agent: 'Intake Router', stage: '01', stageLabel: 'Contract Intake', status: 'running', title: 'Processing 23 contracts from morning intake batch', detail: 'Harvey on Teams (14) · ask@harvey.ai (6) · Shared Spaces (3)', affected: '23 contracts', timestamp: '1 hr ago' },
  { id: 'al6', agent: 'Portfolio Risk Tracker', stage: '03', stageLabel: 'Portfolio Health', status: 'attention', title: 'Concentration risk identified — HSBC exposure cluster', detail: 'HSBC entity accounts for $4.8M across 6 contracts · exceeds 18% single-counterparty threshold', affected: '6 contracts', timestamp: '2 hr ago', linkTab: 'contracts' },
  { id: 'al7', agent: 'Clause Analyzer', stage: '02', stageLabel: 'Review Outcomes', status: 'completed', title: 'Force majeure gap closed — 4 contracts updated', detail: 'Harvey matched updated pandemic clause from library · all 4 accepted without override', affected: '4 contracts', timestamp: '3 hr ago', linkTab: 'clauses' },
  { id: 'al8', agent: 'Source Monitor', stage: '01', stageLabel: 'Contract Intake', status: 'completed', title: 'New intake channel connected — Salesforce CPQ', detail: '3 enterprise agreements routed automatically to Revenue contract queue', affected: '3 contracts', timestamp: '4 hr ago' },
  { id: 'al9', agent: 'Contract Organizer', stage: '03', stageLabel: 'Portfolio Health', status: 'completed', title: '2 new contract families identified', detail: 'Walmart Group (7 contracts) and HSBC Financial Services (6 contracts) auto-grouped', affected: '13 contracts', timestamp: '5 hr ago', linkTab: 'contracts' },
  { id: 'al10', agent: 'Risk Scorer', stage: '02', stageLabel: 'Review Outcomes', status: 'completed', title: 'GDPR/DORA compliance review completed — GlobalTech NDA', detail: 'Data processing terms reviewed · 2 clauses flagged for legal counsel before execution', affected: 'GlobalTech NDA', timestamp: '6 hr ago', linkTab: 'contracts' },
  { id: 'al11', agent: 'Obligation Monitor', stage: '03', stageLabel: 'Portfolio Health', status: 'completed', title: 'Quarterly obligation digest generated', detail: '12 key dates in next 90 days · $3.1M in payment obligations · 4 renewal decisions required', affected: '12 dates', timestamp: 'Yesterday', linkTab: 'key-dates' },
  { id: 'al12', agent: 'Playbook Enforcer', stage: '02', stageLabel: 'Review Outcomes', status: 'attention', title: 'Playbook rule outdated — IP Assignment clause', detail: 'Recent court decisions in Delaware affect standard position · 14 executed contracts potentially affected', affected: '14 contracts', timestamp: 'Yesterday', linkTab: 'playbooks' },
]

const stageAgents: Record<'01' | '02' | '03', { name: string; status: AgentStatus }[]> = {
  '01': [
    { name: 'Intake Router', status: 'running' },
    { name: 'Document Classifier', status: 'running' },
    { name: 'Source Monitor', status: 'running' },
  ],
  '02': [
    { name: 'Playbook Enforcer', status: 'running' },
    { name: 'Clause Analyzer', status: 'running' },
    { name: 'Risk Scorer', status: 'attention' },
  ],
  '03': [
    { name: 'Obligation Monitor', status: 'attention' },
    { name: 'Portfolio Risk Tracker', status: 'running' },
    { name: 'Contract Organizer', status: 'running' },
  ],
}

const agentStatusColor: Record<AgentStatus, string> = {
  completed: hy.ui.success.fg,
  running: hy.ui.blue.fg,
  attention: hy.ui.warning.fg,
}

const agentStatusBg: Record<AgentStatus, string> = {
  completed: hy.ui.success.bg,
  running: hy.ui.blue.bg,
  attention: hy.ui.warning.bg,
}

const agentStatusLabel: Record<AgentStatus, string> = {
  completed: 'Completed',
  running: 'Running',
  attention: 'Needs attention',
}

function StageAgentBar({ stage }: { stage: '01' | '02' | '03' }) {
  const agents = stageAgents[stage]
  const attentionCount = agents.filter((a) => a.status === 'attention').length
  const runningCount = agents.filter((a) => a.status === 'running').length
  const hasAttention = attentionCount > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 2px' }}>
      <Zap size={11} color={hasAttention ? hy.ui.warning.fg : hy.fg.muted} />
      <span style={{ fontSize: 11, color: hy.fg.muted }}>
        {runningCount > 0 && <span>{runningCount} {"agents running"}</span>}
        {hasAttention && <span style={{ color: hy.ui.warning.fg, fontWeight: 500 }}>{runningCount > 0 ? ' · ' : ''}{attentionCount} {"need attention"}</span>}
      </span>
    </div>
  )
}

function HarveyAgentsLog({ onTabChange }: { onTabChange: (tab: ActiveTab) => void }) {
  const stageBadgeColor: Record<string, { fg: string; bg: string }> = {
    '01': hy.ui.blue,
    '02': hy.ui.violet,
    '03': hy.ui.olive,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Summary bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {(['01', '02', '03'] as const).map((stage) => {
          const agents = stageAgents[stage]
          const attention = agentLog.filter((e) => e.stage === stage && e.status === 'attention').length
          const completed = agentLog.filter((e) => e.stage === stage && e.status === 'completed').length
          const stageLabel = stage === '01' ? "Contract Intake" : stage === '02' ? "Review Outcomes" : "Portfolio Health"
          const color = stageBadgeColor[stage]
          return (
            <div
              key={stage}
              style={{
                padding: '16px 20px',
                borderRadius: hy.radius.lg,
                border: `1px solid ${hy.border.base}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ padding: '2px 7px', borderRadius: 999, background: color.bg, fontSize: 10, fontWeight: 700, color: color.fg }}>{stage}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{stageLabel}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>{agents.length}</div>
                  <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{"agents running"}</div>
                </div>
                {attention > 0 && (
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: hy.ui.warning.fg, lineHeight: 1 }}>{attention}</div>
                    <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{"need attention"}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.ui.success.fg, lineHeight: 1 }}>{completed}</div>
                  <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{"completed"}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Audit log */}
      <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Agent Activity Log"}</span>
          <span style={{ fontSize: 11, color: hy.fg.muted }}>{"Last 24 hours"}</span>
        </div>
        {agentLog.map((entry, i) => {
          const color = stageBadgeColor[entry.stage]
          const statusFg = agentStatusColor[entry.status]
          const statusBg = agentStatusBg[entry.status]
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => entry.linkTab && onTabChange(entry.linkTab)}
              className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{
                display: 'grid',
                gridTemplateColumns: '8px 160px 1fr auto',
                alignItems: 'start',
                gap: 14,
                width: '100%',
                padding: '13px 20px',
                background: entry.status === 'attention' ? `${hy.ui.warning.bg}88` : 'transparent',
                border: 'none',
                borderBottom: i < agentLog.length - 1 ? `1px solid ${hy.border.base}` : 'none',
                cursor: entry.linkTab ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              {/* Status dot */}
              <div style={{ marginTop: 5, width: 8, height: 8, borderRadius: 999, background: statusFg, flexShrink: 0 }} />

              {/* Agent + stage */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ padding: '1px 6px', borderRadius: 999, background: color.bg, fontSize: 10, fontWeight: 700, color: color.fg, flexShrink: 0 }}>{entry.stage}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.agent}</span>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: statusBg,
                  }}
                >
                  <span style={{ fontSize: 10, color: statusFg, fontWeight: 500 }}>{agentStatusLabel[entry.status]}</span>
                </div>
              </div>

              {/* Title + detail */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, marginBottom: 3 }}>{entry.title}</div>
                <div style={{ fontSize: 12, color: hy.fg.subtle }}>{entry.detail}</div>
                {entry.affected && (
                  <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 4 }}>{entry.affected}</div>
                )}
              </div>

              {/* Timestamp */}
              <div style={{ fontSize: 11, color: hy.fg.muted, flexShrink: 0, marginTop: 2, textAlign: 'right' }}>{entry.timestamp}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Pipeline health ────────────────────────────────────────────────────────────

type StageHealth = 'ok' | 'approaching' | 'over'
type StuckReason = 'Time-based' | 'Counterparty' | 'Document' | 'Approver'

interface PipelineStageData {
  id: string
  label: string
  count: number
  avgTime: string
  sla: string
  benchmark: string
  status: StageHealth
  overCount?: number
}

interface StuckContract {
  id: string
  name: string
  stage: string
  timeInStage: string
  slaTarget: string
  overBy: string
  reason: StuckReason
  detail: string
}

const pipelineStages: PipelineStageData[] = [
  { id: 'received',     label: 'Received',          count: 47,   avgTime: '<1 hr',   sla: '2 hrs',   benchmark: '1 hr',     status: 'ok' },
  { id: 'triaged',      label: 'Triaged',            count: 44,   avgTime: '6 min',   sla: '15 min',  benchmark: '10 min',   status: 'ok' },
  { id: 'harvey',       label: 'Harvey Review',      count: 23,   avgTime: '4.2 min', sla: '30 min',  benchmark: '5 min',    status: 'ok' },
  { id: 'legal',        label: 'Legal Review',       count: 18,   avgTime: '3.2 days',sla: '3 days',  benchmark: '2.5 days', status: 'over', overCount: 3 },
  { id: 'signature',    label: 'Awaiting Signature', count: 12,   avgTime: '1.1 days',sla: '5 days',  benchmark: '3 days',   status: 'approaching', overCount: 1 },
  { id: 'executed',     label: 'Executed',           count: 2478, avgTime: '—',       sla: '—',       benchmark: '—',        status: 'ok' },
]

const stuckContracts: StuckContract[] = [
  { id: 'sk1', name: 'Acme Corp — Master Services Agreement',      stage: 'Legal Review',       timeInStage: '8 days',  slaTarget: '3 days', overBy: '5 days over',   reason: 'Approver',    detail: 'Awaiting GC sign-off — assigned 5 days ago, no response' },
  { id: 'sk2', name: 'GlobalTech Solutions NDA',                   stage: 'Legal Review',       timeInStage: '5 days',  slaTarget: '3 days', overBy: '2 days over',   reason: 'Counterparty',detail: 'No counterparty response since Mar 5 — document opened but not actioned' },
  { id: 'sk3', name: 'HSBC Financial Services Framework',          stage: 'Awaiting Signature', timeInStage: '12 days', slaTarget: '5 days', overBy: '7 days over',   reason: 'Document',    detail: 'Missing Exhibit B (Data Processing Schedule) — counterparty has not provided' },
  { id: 'sk4', name: 'Walmart Supply Chain Agreement',             stage: 'Legal Review',       timeInStage: '4 days',  slaTarget: '3 days', overBy: '1 day over',    reason: 'Approver',    detail: 'Primary reviewer on leave — no reassignment has been made' },
  { id: 'sk5', name: 'NovaStar Technology MSA',                    stage: 'Harvey Review',      timeInStage: '2.1 hrs', slaTarget: '30 min', overBy: '1.6 hrs over',  reason: 'Document',    detail: 'Schedule 1 attachment failed to parse — manual review required before Harvey can proceed' },
]

const stuckReasonColor: Record<StuckReason, { fg: string; bg: string }> = {
  'Time-based':  hy.ui.warning,
  'Counterparty': hy.ui.blue,
  'Document':    hy.ui.gold,
  'Approver':    hy.ui.danger,
}

const stageHealthColor: Record<StageHealth, string> = {
  ok:          hy.ui.success.fg,
  approaching: hy.ui.warning.fg,
  over:        hy.ui.danger.fg,
}

const stageHealthBg: Record<StageHealth, string> = {
  ok:          hy.ui.success.bg,
  approaching: hy.ui.warning.bg,
  over:        hy.ui.danger.bg,
}

function PipelineHealthPanel() {
  const total = pipelineStages.filter((s) => s.id !== 'executed').reduce((sum, s) => sum + s.count, 0)
  const stuckCount = stuckContracts.length
  const overSLACount = pipelineStages.reduce((sum, s) => sum + (s.overCount ?? 0), 0)

  return (
    <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Pipeline Health"}</span>
          <span style={{ fontSize: 12, color: hy.fg.muted }}>{total} {"contracts in flight"}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {overSLACount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: hy.ui.danger.bg, border: `1px solid ${hy.ui.danger.fg}33` }}>
              <AlertTriangle size={11} color={hy.ui.danger.fg} />
              <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.danger.fg }}>{overSLACount} {"over SLA"}</span>
            </div>
          )}
          {stuckCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}33` }}>
              <AlertTriangle size={11} color={hy.ui.warning.fg} />
              <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.warning.fg }}>{stuckCount} {"stuck"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline stages */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto' as const }}>
        {pipelineStages.map((stage, i) => {
          const isLast = i === pipelineStages.length - 1
          const isExecuted = stage.id === 'executed'
          const statusFg = stageHealthColor[stage.status]
          const statusBg = stageHealthBg[stage.status]

          return (
            <React.Fragment key={stage.id}>
              <div
                style={{
                  flex: isExecuted ? '0 0 100px' : '1 1 0',
                  minWidth: isExecuted ? 100 : 110,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '10px 12px',
                  borderRadius: hy.radius.md,
                  background: isExecuted ? hy.ui.success.bg : stage.overCount ? `${hy.ui.danger.bg}88` : hy.bg.subtle,
                  border: `1px solid ${isExecuted ? hy.ui.success.fg + '33' : stage.overCount ? hy.ui.danger.fg + '33' : hy.border.base}`,
                }}
              >
                {/* Stage name */}
                <div style={{ fontSize: 11, fontWeight: 600, color: isExecuted ? hy.ui.success.fg : hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{stage.label}</div>

                {/* Count */}
                <div style={{ fontSize: 28, fontWeight: 700, color: isExecuted ? hy.ui.success.fg : hy.fg.base, lineHeight: 1 }}>
                  {stage.count.toLocaleString()}
                </div>

                {!isExecuted && (
                  <>
                    {/* Avg time */}
                    <div style={{ fontSize: 11, color: hy.fg.subtle }}>{"Avg"} {stage.avgTime}</div>

                    {/* SLA row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 999, background: statusFg, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: hy.fg.muted }}>{"SLA"} {stage.sla}</span>
                      </div>
                      {stage.overCount && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: hy.ui.danger.fg }}>{stage.overCount} {"over"}</span>
                      )}
                    </div>

                    {/* Harvey benchmark */}
                    <div style={{ fontSize: 10, color: hy.fg.muted, borderTop: `1px solid ${hy.border.base}`, paddingTop: 5, marginTop: 2 }}>
                      <span style={{ color: hy.ui.blue.fg, fontWeight: 500 }}>{"Mkt avg"}</span> {stage.benchmark}
                    </div>
                  </>
                )}
              </div>

              {/* Arrow connector */}
              {!isLast && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
                  <ChevronRight size={14} color={hy.fg.muted} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Stuck contracts */}
      {stuckContracts.length > 0 && (
        <div style={{ borderTop: `1px solid ${hy.border.base}` }}>
          <div style={{ padding: '10px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={13} color={hy.ui.warning.fg} />
            <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Stuck Contracts"}</span>
            <span style={{ fontSize: 11, color: hy.fg.muted }}>{"Harvey detected delays requiring action"}</span>
          </div>
          {stuckContracts.map((sc, i) => {
            const reasonColor = stuckReasonColor[sc.reason]
            return (
              <div
                key={sc.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 2fr 120px 1fr',
                  alignItems: 'center',
                  gap: 16,
                  padding: '10px 20px',
                  borderTop: `1px solid ${hy.border.base}`,
                  background: i % 2 === 0 ? 'transparent' : hy.bg.subtle,
                }}
              >
                {/* Reason chip */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: reasonColor.bg, border: `1px solid ${reasonColor.fg}33`, width: 'fit-content' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: reasonColor.fg }}>{sc.reason}</span>
                </div>

                {/* Contract name + stage */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.name}</div>
                  <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{sc.stage}</div>
                </div>

                {/* Time over SLA */}
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: hy.ui.danger.fg }}>{sc.overBy}</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 1 }}>{sc.timeInStage} / {sc.slaTarget} {"SLA"}</div>
                </div>

                {/* Detail */}
                <div style={{ fontSize: 11, color: hy.fg.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.detail}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PipelineHealthSummary({ onTabChange }: { onTabChange: (tab: ActiveTab) => void }) {
  const overSLACount = pipelineStages.reduce((sum, s) => sum + (s.overCount ?? 0), 0)
  const stuckCount = stuckContracts.length

  return (
    <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${hy.border.base}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Pipeline"}</span>
          {overSLACount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: hy.ui.danger.bg }}>
              <AlertTriangle size={10} color={hy.ui.danger.fg} />
              <span style={{ fontSize: 10, fontWeight: 600, color: hy.ui.danger.fg }}>{overSLACount} {"over SLA"}</span>
            </div>
          )}
          {stuckCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: hy.ui.warning.bg }}>
              <AlertTriangle size={10} color={hy.ui.warning.fg} />
              <span style={{ fontSize: 10, fontWeight: 600, color: hy.ui.warning.fg }}>{stuckCount} {"stuck"}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onTabChange('contracts')}
          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
          style={{ fontSize: 12, fontWeight: 500, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {"Full pipeline →"}
        </button>
      </div>

      {/* Compact stage strip */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' as const }}>
        {pipelineStages.map((stage, i) => {
          const isLast = i === pipelineStages.length - 1
          const isExecuted = stage.id === 'executed'
          const healthFg = isExecuted ? hy.ui.success.fg : stageHealthColor[stage.status]

          return (
            <React.Fragment key={stage.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: isExecuted ? '0 0 80px' : '1 1 0', minWidth: 80 }}>
                {/* Stage name */}
                <div style={{ fontSize: 10, fontWeight: 500, color: hy.fg.muted, textAlign: 'center' as const, lineHeight: 1.2 }}>{stage.label}</div>
                {/* Count + health dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: healthFg, flexShrink: 0 }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: isExecuted ? hy.ui.success.fg : hy.fg.base, lineHeight: 1 }}>
                    {stage.count.toLocaleString()}
                  </span>
                </div>
                {/* Over SLA note */}
                {stage.overCount && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: hy.ui.danger.fg }}>{stage.overCount} {"over"}</span>
                )}
              </div>
              {!isLast && (
                <ChevronRight size={12} color={hy.fg.muted} style={{ flexShrink: 0, margin: '0 2px', alignSelf: 'center' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Unified Pipeline page ──────────────────────────────────────────────────────

type NewPipelineStageId = 'received' | 'in-review' | 'awaiting-signature' | 'executed' | 'obligations'

interface NewStageData {
  id: NewPipelineStageId
  label: string
  count: number
  sla: string
  avgTime: string
  status: StageHealth
  overCount?: number
  subtitle: string
  harveyBadge?: string
  agentStageKey: '01' | '02' | '03'
}

const newPipelineStages: NewStageData[] = [
  {
    id: 'received',
    label: 'Received',
    count: 47,
    sla: '2 hrs',
    avgTime: '<1 hr',
    status: 'ok',
    subtitle: '3 sources · 44 auto-classified',
    agentStageKey: '01',
  },
  {
    id: 'in-review',
    label: 'In Review',
    count: 41,
    sla: '3 days',
    avgTime: '3.2 days',
    status: 'over',
    overCount: 3,
    subtitle: 'Harvey pre-screened all · 18 with legal',
    harveyBadge: 'Harvey pre-screened',
    agentStageKey: '02',
  },
  {
    id: 'awaiting-signature',
    label: 'Awaiting Signature',
    count: 12,
    sla: '5 days',
    avgTime: '1.1 days',
    status: 'approaching',
    overCount: 1,
    subtitle: '1 approaching SLA',
    agentStageKey: '02',
  },
  {
    id: 'executed',
    label: 'Executed',
    count: 2478,
    sla: '—',
    avgTime: '—',
    status: 'ok',
    subtitle: 'This year · active portfolio',
    agentStageKey: '03',
  },
  {
    id: 'obligations',
    label: 'Obligations',
    count: 2478,
    sla: '—',
    avgTime: '—',
    status: 'approaching',
    overCount: 3,
    subtitle: '3 critical milestones · 12 due in 30 days',
    agentStageKey: '03',
  },
]

const statusToNewStage: Record<PipelineStatus, NewPipelineStageId> = {
  Submitted: 'received',
  'Needs Review': 'in-review',
  'Ready to Send': 'in-review',
  'In Negotiation': 'in-review',
  Executed: 'executed',
}

const awaitingSignatureList = [
  { id: 'as1', name: 'IT Infrastructure Support & Maintenance SLA', counterparty: 'Titan Industries', type: 'SLA', value: '$1.1M', daysWaiting: 7, sla: 5, intakeSource: 'Shared Spaces' as IntakeSource },
  { id: 'as2', name: 'Strategic Alliance & Revenue Share Agreement', counterparty: 'Apex Financial', type: 'Partnership', value: '$2.1M', daysWaiting: 8, sla: 5, intakeSource: 'ask@harvey.ai' as IntakeSource },
  { id: 'as3', name: 'HSBC Financial Services Framework Agreement', counterparty: 'HSBC Financial', type: 'Framework', value: '$4.8M', daysWaiting: 16, sla: 5, intakeSource: 'Harvey on Teams' as IntakeSource },
  { id: 'as4', name: 'Intellectual Property License Agreement', counterparty: 'Corelight Labs', type: 'License', value: '$780K', daysWaiting: 9, sla: 5, intakeSource: 'Harvey on Teams' as IntakeSource },
  { id: 'as5', name: 'Enterprise SaaS Subscription & License', counterparty: 'Orbis Financial', type: 'SaaS', value: '$680K', daysWaiting: 3, sla: 5, intakeSource: 'Shared Spaces' as IntakeSource },
]

const submitterDept: Record<string, string> = {
  'James Liu':     'Sales',
  'Priya Shah':    'Legal Ops',
  'Tom Brennan':   'Finance',
  'Sarah Chen':    'Partnerships',
  'Miguel Torres': 'Enterprise Sales',
  'Emily Wong':    'Product',
  'Raj Patel':     'IT',
  'Lisa Park':     'Procurement',
}

const reviewPlaybookLabel: Record<string, string> = {
  MSA:         'MSA Standard Playbook v3.2',
  DPA:         'Data Privacy Playbook v2.1',
  NDA:         'NDA Standard Playbook v4.0',
  SaaS:        'SaaS Subscription Playbook v2.0',
  SOW:         'Services Playbook v2.8',
  License:     'IP & Licensing Playbook v1.9',
  Partnership: 'Partnership Playbook v2.0',
  SLA:         'SLA Standard Playbook v1.5',
  Vendor:      'Vendor Services Playbook v2.1',
  Consulting:  'Consulting Playbook v1.8',
  Services:    'Services Playbook v2.8',
  Framework:   'Framework Agreement Playbook v2.3',
}

function PipelinePage({ onTabChange }: { onTabChange: (tab: ActiveTab) => void }) {
  const [selectedStage, setSelectedStage] = useState<NewPipelineStageId | null>('in-review')
  const [inReviewSubView, setInReviewSubView] = useState<'queue' | 'stuck'>('queue')
  const [receivedView, setReceivedView] = useState<'contracts' | 'dms'>('contracts')
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null)

  const activeStageData = selectedStage ? newPipelineStages.find((s) => s.id === selectedStage) : null
  const agentStageKey: '01' | '02' | '03' = activeStageData?.agentStageKey ?? '02'

  const stageContracts =
    selectedStage === 'awaiting-signature' || selectedStage === 'obligations'
      ? []
      : selectedStage === null
        ? pipelineContracts
        : pipelineContracts.filter((c) => statusToNewStage[c.status] === selectedStage)

  const stageLogs = agentLog.filter(
    (e) =>
      !selectedStage ||
      (selectedStage === 'received' && e.stage === '01') ||
      ((selectedStage === 'in-review' || selectedStage === 'awaiting-signature') && e.stage === '02') ||
      ((selectedStage === 'executed' || selectedStage === 'obligations') && e.stage === '03')
  )

  const stageColors: Record<string, { fg: string; bg: string }> = {
    '01': hy.ui.blue,
    '02': hy.ui.violet,
    '03': hy.ui.olive,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Portfolio strip (top) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { icon: <BookOpen size={14} color={hy.ui.danger.fg} />, color: hy.ui.danger, label: "Playbooks", count: '3', detail: "need update", sub: 'IP Assignment · Force majeure · NDA', tab: 'playbooks' as ActiveTab },
          { icon: <Library size={14} color={hy.ui.warning.fg} />, color: hy.ui.warning, label: "Clause changes", count: '4', detail: "pending review", sub: 'GDPR Art. 28 · DORA · Liability cap', tab: 'clauses' as ActiveTab },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => onTabChange(item.tab)}
            className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.base, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: hy.radius.md, background: item.color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: item.color.fg }}>{item.count} {item.detail}</div>
              <div style={{ fontSize: 11, color: hy.fg.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.sub}</div>
            </div>
            <ChevronRight size={13} color={hy.fg.muted} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* ── Pipeline stages with embedded agents ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>

        {/* Active funnel: first 4 stages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flex: '1 1 0', minWidth: 0 }}>
          {newPipelineStages.filter((s) => s.id !== 'obligations').map((stage) => {
            const isSelected = selectedStage === stage.id
            const isExecuted = stage.id === 'executed'
            const isInReview = stage.id === 'in-review'
            const healthFg = isExecuted ? hy.ui.success.fg : stageHealthColor[stage.status]
            const healthBg = isExecuted ? hy.ui.success.bg : stageHealthBg[stage.status]
            const stageAgentKey = stage.agentStageKey
            const running = stageAgents[stageAgentKey].filter((a) => a.status === 'running').length
            const attention = agentLog.filter((e) => e.stage === stageAgentKey && e.status === 'attention').length
            const hasAgentIssue = attention > 0
            const needsReviewCount = pipelineContracts.filter((c) => statusToNewStage[c.status] === 'in-review' && c.status === 'Needs Review').length
            const stuckInReviewCount = stuckContracts.filter((sc) => sc.stage === 'Legal Review').length

            // In Review tile has a special split layout
            if (isInReview) {
              return (
                <div
                  key={stage.id}
                  style={{
                    borderRadius: hy.radius.lg,
                    border: isSelected ? `2px solid ${healthFg}` : `1px solid ${hy.border.base}`,
                    background: isSelected ? healthBg : hy.bg.base,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top section: review queue CTA */}
                  <button
                    type="button"
                    onClick={() => { setSelectedStage('in-review'); setInReviewSubView('queue') }}
                    className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                    style={{ padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? healthFg : hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                        {"In Review"}
                      </span>
                      <div style={{ width: 7, height: 7, borderRadius: 999, background: healthFg }} />
                    </div>
                    {/* Needs review count — the main CTA */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: hy.ui.warning.fg, lineHeight: 1 }}>{needsReviewCount}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: hy.ui.warning.fg }}>{"need your review"}</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: hy.radius.xs, background: hy.ui.blue.bg, width: 'fit-content' }}>
                      <Zap size={9} color={hy.ui.blue.fg} />
                      <span style={{ fontSize: 9, fontWeight: 600, color: hy.ui.blue.fg }}>{"Harvey pre-screened all"}</span>
                    </div>
                    <div style={{ borderTop: `1px solid ${isSelected ? healthFg + '33' : hy.border.base}`, paddingTop: 6, marginTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: isSelected ? healthFg : hy.fg.muted }}>SLA {stage.sla}</span>
                        <span style={{ fontSize: 10, color: hy.fg.muted }}>·</span>
                        <span style={{ fontSize: 10, color: hy.ui.danger.fg }}>Avg {stage.avgTime}</span>
                      </div>
                    </div>
                  </button>
                  {/* Bottom section: stuck — separate clickable area */}
                  {stuckInReviewCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSelectedStage('in-review'); setInReviewSubView('stuck') }}
                      className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: inReviewSubView === 'stuck' && isSelected ? hy.ui.danger.bg : hy.bg.subtle, borderTop: `1px solid ${hy.ui.danger.fg}33`, border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <AlertTriangle size={11} color={hy.ui.danger.fg} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: hy.ui.danger.fg }}>{stuckInReviewCount} {"stuck"}</span>
                      <span style={{ fontSize: 10, color: hy.fg.muted, flex: 1 }}>{"over SLA — needs action"}</span>
                      <ChevronRight size={11} color={hy.ui.danger.fg} />
                    </button>
                  )}
                </div>
              )
            }

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStage(isSelected ? null : stage.id)}
                className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{
                  padding: '16px 18px',
                  borderRadius: hy.radius.lg,
                  border: isSelected ? `2px solid ${healthFg}` : `1px solid ${hy.border.base}`,
                  background: isSelected ? healthBg : hy.bg.base,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Label + badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? healthFg : hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    {stage.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {stage.overCount && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: hy.ui.danger.fg, background: hy.ui.danger.bg, padding: '1px 5px', borderRadius: 999 }}>
                        {stage.overCount} over SLA
                      </span>
                    )}
                    <div style={{ width: 7, height: 7, borderRadius: 999, background: healthFg }} />
                  </div>
                </div>
                {/* Count */}
                <div style={{ fontSize: 36, fontWeight: 700, color: isSelected ? healthFg : hy.fg.base, lineHeight: 1 }}>
                  {stage.count.toLocaleString()}
                </div>
                {/* Harvey badge */}
                {stage.harveyBadge && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: hy.radius.xs, background: hy.ui.blue.bg, width: 'fit-content' }}>
                    <Zap size={9} color={hy.ui.blue.fg} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: hy.ui.blue.fg }}>{stage.harveyBadge}</span>
                  </div>
                )}
                {/* Subtitle */}
                <div style={{ fontSize: 10, color: isSelected ? healthFg : hy.fg.muted, lineHeight: 1.4 }}>{stage.subtitle}</div>
                {/* Divider + SLA + agent status */}
                <div style={{ borderTop: `1px solid ${isSelected ? healthFg + '33' : hy.border.base}`, paddingTop: 8 }}>
                  {!isExecuted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: isSelected ? healthFg : hy.fg.muted }}>SLA {stage.sla}</span>
                      <span style={{ fontSize: 10, color: hy.fg.muted }}>·</span>
                      <span style={{ fontSize: 10, color: stage.status !== 'ok' ? hy.ui.danger.fg : (isSelected ? healthFg : hy.fg.muted) }}>Avg {stage.avgTime}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: hasAgentIssue ? hy.ui.warning.fg : hy.ui.success.fg, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: hasAgentIssue ? hy.ui.warning.fg : hy.fg.muted }}>{running} {"running"}</span>
                    {hasAgentIssue && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: hy.ui.warning.fg }}>· {attention} {"need attention"}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Separator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0, width: 24 }}>
          <div style={{ flex: 1, width: 1, background: hy.border.base }} />
          <ChevronRight size={12} color={hy.fg.muted} />
          <div style={{ flex: 1, width: 1, background: hy.border.base }} />
        </div>

        {/* Post-execution: Obligations tile */}
        {(() => {
          const stage = newPipelineStages.find((s) => s.id === 'obligations')!
          const isSelected = selectedStage === stage.id
          const stageAgentKey = stage.agentStageKey
          const running = stageAgents[stageAgentKey].filter((a) => a.status === 'running').length
          const attention = agentLog.filter((e) => e.stage === stageAgentKey && e.status === 'attention').length
          const hasAgentIssue = attention > 0
          return (
            <button
              type="button"
              onClick={() => setSelectedStage(isSelected ? null : stage.id)}
              className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{
                padding: '16px 18px',
                borderRadius: hy.radius.lg,
                border: isSelected ? `2px solid ${hy.ui.gold.fg}` : `1px dashed ${hy.border.base}`,
                background: isSelected ? hy.ui.gold.bg : hy.bg.subtle,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flexShrink: 0,
                width: 200,
              }}
            >
              {/* Label + badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? hy.ui.gold.fg : hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                  {stage.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {stage.overCount && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: hy.ui.gold.fg, background: hy.ui.gold.bg, padding: '1px 5px', borderRadius: 999 }}>
                      {stage.overCount} critical
                    </span>
                  )}
                  <div style={{ width: 7, height: 7, borderRadius: 999, background: hy.ui.gold.fg }} />
                </div>
              </div>
              {/* Count */}
              <div style={{ fontSize: 36, fontWeight: 700, color: isSelected ? hy.ui.gold.fg : hy.fg.base, lineHeight: 1 }}>
                {stage.count.toLocaleString()}
              </div>
              {/* Subtitle */}
              <div style={{ fontSize: 10, color: isSelected ? hy.ui.gold.fg : hy.fg.muted, lineHeight: 1.4 }}>{stage.subtitle}</div>
              {/* Divider + agent status */}
              <div style={{ borderTop: `1px solid ${isSelected ? hy.ui.gold.fg + '33' : hy.border.base}`, paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: hasAgentIssue ? hy.ui.warning.fg : hy.ui.success.fg, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: hasAgentIssue ? hy.ui.warning.fg : hy.fg.muted }}>{running} {"running"}</span>
                  {hasAgentIssue && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: hy.ui.warning.fg }}>· {attention} {"need attention"}</span>
                  )}
                </div>
              </div>
            </button>
          )
        })()}

      </div>

      {/* ── SLA insight (In Review) ── */}
      {(!selectedStage || selectedStage === 'in-review') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: hy.radius.md, background: hy.ui.blue.bg, border: `1px solid ${hy.border.base}` }}>
          <span style={{ fontSize: 12, color: hy.fg.subtle }}>Review SLA: 3 days</span>
          <span style={{ fontSize: 12, color: hy.fg.muted }}>·</span>
          <span style={{ fontSize: 12, color: hy.ui.warning.fg }}>Averaging 3.2 days right now</span>
          <span style={{ fontSize: 12, color: hy.fg.muted }}>·</span>
          <span style={{ fontSize: 12, color: hy.ui.success.fg }}>Harvey cut this from 8.1 days — 61% faster</span>
          {selectedStage === 'in-review' && stuckContracts.length > 0 && (
            <>
              <span style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: hy.ui.warning.bg }}>
                <AlertTriangle size={10} color={hy.ui.warning.fg} />
                <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.warning.fg }}>{stuckContracts.length} stuck</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Two-column: contract list + agent panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, alignItems: 'start' }}>

        {/* ── Contract list ── */}
        <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '10px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: hy.bg.subtle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {selectedStage === 'received' ? (
                (['contracts', 'dms'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setReceivedView(tab)}
                    className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                    style={{ fontSize: 12, fontWeight: receivedView === tab ? 600 : 400, color: receivedView === tab ? hy.fg.base : hy.fg.muted, padding: '4px 12px', background: 'none', border: 'none', borderBottom: receivedView === tab ? `2px solid ${hy.fg.base}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}
                  >
                    {tab === 'contracts' ? "Contracts" : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {"Smart DMS"}
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: hy.ui.blue.bg, color: hy.ui.blue.fg }}>AI</span>
                      </span>
                    )}
                  </button>
                ))
              ) : selectedStage === 'in-review' ? (
                <>
                  {([
                    { key: 'queue' as const, label: "Review queue", count: pipelineContracts.filter((c) => c.status === 'Needs Review').length, color: hy.ui.warning },
                    { key: 'stuck' as const, label: "Stuck", count: stuckContracts.filter((sc) => sc.stage === 'Legal Review').length, color: hy.ui.danger },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setInReviewSubView(tab.key)}
                      className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: inReviewSubView === tab.key ? 600 : 400, color: inReviewSubView === tab.key ? tab.color.fg : hy.fg.muted, padding: '4px 12px', background: 'none', border: 'none', borderBottom: inReviewSubView === tab.key ? `2px solid ${tab.color.fg}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}
                    >
                      {tab.label}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: inReviewSubView === tab.key ? tab.color.bg : hy.bg.component, color: inReviewSubView === tab.key ? tab.color.fg : hy.fg.muted }}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>
                  {activeStageData?.label ?? 'All stages'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onTabChange('contracts')}
              className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ fontSize: 12, fontWeight: 500, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {"View all →"}
            </button>
          </div>

          {/* Smart DMS */}
          {selectedStage === 'received' && receivedView === 'dms' && <ContractLibraryView />}

          {/* In Force (obligations) list */}
          {selectedStage === 'obligations' && (
            <>
              <div style={{ padding: '6px 20px', display: 'grid', gridTemplateColumns: '44px 1fr 100px 80px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                {['Due', 'Obligation', 'Counterparty', 'Priority'].map((h) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
                ))}
              </div>
              {upcomingObligations.map((ob, i) => {
                const sevFg = ob.severity === 'critical' ? hy.ui.danger.fg : ob.severity === 'high' ? hy.ui.warning.fg : hy.fg.muted
                const sevBg = ob.severity === 'critical' ? hy.ui.danger.bg : ob.severity === 'high' ? hy.ui.warning.bg : hy.bg.component
                return (
                  <div key={ob.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 100px 80px', gap: 12, alignItems: 'center', padding: '11px 20px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none' }}>
                    <div style={{ height: 34, borderRadius: hy.radius.sm, background: sevBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: sevFg, lineHeight: 1 }}>{ob.daysLeft}</span>
                      <span style={{ fontSize: 9, color: sevFg }}>days</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ob.title}</div>
                      <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 1 }}>{ob.contract}</div>
                    </div>
                    <div style={{ fontSize: 12, color: hy.fg.subtle }}>{ob.counterparty}</div>
                    <SeverityChip severity={ob.severity} />
                  </div>
                )
              })}
            </>
          )}

          {/* Awaiting signature */}
          {selectedStage === 'awaiting-signature' && (
            <>
              <div style={{ padding: '6px 20px', display: 'grid', gridTemplateColumns: '1fr 120px 110px 80px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                {['Contract', 'Source', 'Waiting', 'Value'].map((h) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
                ))}
              </div>
              {awaitingSignatureList.map((c, i) => {
                const isOver = c.daysWaiting > c.sla
                const isApproaching = !isOver && c.daysWaiting >= c.sla - 1
                const timeFg = isOver ? hy.ui.danger.fg : isApproaching ? hy.ui.warning.fg : hy.fg.muted
                return (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 80px', gap: 12, alignItems: 'center', padding: '11px 20px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 1 }}>{c.counterparty} · {c.type}</div>
                    </div>
                    <IntakeSourceBadge source={c.intakeSource} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: timeFg }}>{c.daysWaiting}d waiting</div>
                      <div style={{ fontSize: 10, color: hy.fg.muted }}>SLA: {c.sla}d</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, textAlign: 'right' as const }}>{c.value}</div>
                  </div>
                )
              })}
            </>
          )}

          {/* Standard contract list */}
          {selectedStage !== 'awaiting-signature' && selectedStage !== 'obligations' && !(selectedStage === 'received' && receivedView === 'dms') && (
            <>
              {/* Received: intake sources bar */}
              {selectedStage === 'received' && (
                <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${hy.border.base}` }}>
                  <span style={{ fontSize: 11, color: hy.fg.muted, flexShrink: 0 }}>{"This week"}</span>
                  {([
                    { source: 'Harvey on Teams' as IntakeSource, count: 21, pct: 45 },
                    { source: 'ask@harvey.ai' as IntakeSource, count: 16, pct: 34 },
                    { source: 'Shared Spaces' as IntakeSource, count: 10, pct: 21 },
                  ]).map(({ source, count, pct }) => {
                    const { fg } = intakeSourceColor[source]
                    return (
                      <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <IntakeSourceBadge source={source} />
                        <div style={{ flex: 1, height: 3, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: fg, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: hy.fg.base, flexShrink: 0 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* In Review: Stuck sub-view */}
              {selectedStage === 'in-review' && inReviewSubView === 'stuck' && (
                <>
                  <div style={{ padding: '10px 20px', display: 'grid', gridTemplateColumns: '90px 1fr 110px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                    {["Reason", "Contract", "Time over SLA"].map((h) => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
                    ))}
                  </div>
                  {stuckContracts.filter((sc) => sc.stage === 'Legal Review').map((sc, i) => {
                    const reasonColor = stuckReasonColor[sc.reason]
                    return (
                      <div key={sc.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px', alignItems: 'start', gap: 12, padding: '12px 20px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', background: i % 2 === 0 ? 'transparent' : hy.bg.subtle }}>
                        <div style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, background: reasonColor.bg, width: 'fit-content' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: reasonColor.fg }}>{sc.reason}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{sc.name}</div>
                          <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{sc.detail}</div>
                          <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 3 }}>{"In stage"} {sc.timeInStage} · SLA: {sc.slaTarget}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: hy.ui.danger.fg }}>{sc.overBy}</div>
                          <button type="button" className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ marginTop: 4, fontSize: 11, fontWeight: 500, color: hy.ui.blue.fg, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{"Reassign →"}</button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
              {/* Column headers — only for non-stuck views */}
              {(selectedStage !== 'in-review' || inReviewSubView === 'queue') && (
                selectedStage === 'in-review' ? (
                  <div style={{ padding: '6px 20px', display: 'grid', gridTemplateColumns: '1fr 200px 100px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                    {["Contract", "Submitted by", "Action"].map((h) => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '6px 20px', display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                    {["Contract", "Source", "Value"].map((h) => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
                    ))}
                  </div>
                )
              )}
              {(selectedStage !== 'in-review' || inReviewSubView === 'queue') && (() => {
                // For In Review: show only Needs Review contracts in queue; approved/negotiation go to "already handled"
                const sorted = selectedStage === 'in-review'
                  ? [
                      ...stageContracts.filter((c) => c.status === 'Needs Review'),
                      ...stageContracts.filter((c) => c.status !== 'Needs Review'),
                    ]
                  : stageContracts
                return sorted.slice(0, 8)
              })().map((c, i, arr) => {
                const isInReview = selectedStage === 'in-review'
                // Insert a divider before the first non-Needs-Review row in In Review
                const prevIsNeedsReview = i > 0 && arr[i - 1]?.status === 'Needs Review'
                const showHandledDivider = isInReview && c.status !== 'Needs Review' && prevIsNeedsReview
                const isExpanded = expandedContractId === c.id
                const riskCount = c.clauseRisks?.length ?? 0
                const issueCount = c.harveyIssues?.length ?? 0
                const playbook = reviewPlaybookLabel[c.type] ?? 'Standard Contract Playbook v1.0'
                const clauseCount = riskCount > 0 ? riskCount : (c.clauseRisks ? 0 : null)
                const dept = submitterDept[c.submittedBy] ?? 'Business'

                // Harvey verdict for in-review rows
                const harveyColor = riskCount > 0
                  ? (c.harveyScore !== undefined && c.harveyScore >= 65 ? hy.ui.danger : hy.ui.warning)
                  : issueCount > 0 ? hy.ui.gold : hy.ui.success
                const harveyVerdict = riskCount > 0
                  ? `${riskCount} clause ${riskCount === 1 ? 'risk' : 'risks'}`
                  : issueCount > 0
                    ? `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}`
                    : 'No issues found'

                if (isInReview) {
                  return (
                    <div key={c.id}>
                      {/* Section divider between queue and handled items */}
                      {showHandledDivider && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}`, borderBottom: `1px solid ${hy.border.base}` }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{"Already handled"}</span>
                        </div>
                      )}
                      <div style={{ borderTop: (i > 0 && !showHandledDivider) ? `1px solid ${hy.border.base}` : 'none', borderLeft: c.status === 'Needs Review' ? `3px solid ${hy.ui.warning.fg}` : '3px solid transparent' }}>
                      {/* In Review main row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px', gap: 12, alignItems: 'center', padding: '12px 20px', background: c.status === 'Needs Review' ? `${hy.ui.warning.bg}44` : 'transparent' }}>

                        {/* Contract column */}
                        <div style={{ minWidth: 0 }}>
                          {/* Contract name + Harvey verdict */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</span>
                            {c.harveyNote && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: harveyColor.bg, color: harveyColor.fg, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <CheckSquare size={9} />
                                Harvey: {harveyVerdict}
                              </span>
                            )}
                          </div>
                          {/* Counterparty · type · value */}
                          <div style={{ fontSize: 11, color: hy.fg.muted, marginBottom: c.submittedAgo ? 3 : 0 }}>
                            {c.counterparty} · {c.type} · {c.value !== '—' ? c.value : 'value TBD'}
                          </div>
                          {/* Compact timestamps */}
                          {c.submittedAgo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Clock size={9} color={hy.fg.muted} />
                              <span style={{ fontSize: 10, color: hy.fg.muted }}>{c.submittedAgo} ago</span>
                              <span style={{ fontSize: 10, color: hy.fg.muted }}>·</span>
                              <Zap size={9} color={hy.ui.blue.fg} />
                              <span style={{ fontSize: 10, color: hy.fg.muted }}>Harvey <span style={{ color: hy.ui.blue.fg }}>{c.harveyReviewedAgo} ago</span></span>
                            </div>
                          )}
                        </div>

                        {/* Submitted by column */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            {/* Avatar initials */}
                            <div style={{ width: 24, height: 24, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: hy.ui.blue.fg }}>
                                {c.submittedBy.split(' ').map((n) => n[0]).join('')}
                              </span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.submittedBy}</div>
                              <div style={{ fontSize: 10, color: hy.fg.muted }}>{dept}</div>
                            </div>
                          </div>
                        </div>

                        {/* Action column */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {c.status === 'Needs Review' && c.harveyNote ? (
                            <button
                              type="button"
                              onClick={() => setExpandedContractId(isExpanded ? null : c.id)}
                              className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: hy.bg.base, background: hy.fg.base, border: 'none', borderRadius: hy.radius.sm, padding: '6px 12px', cursor: 'pointer' }}
                            >
                              {isExpanded ? "Close" : "Review"}
                              {!isExpanded && <ChevronRight size={11} />}
                            </button>
                          ) : c.status === 'Ready to Send' ? (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: hy.ui.success.bg, color: hy.ui.success.fg }}>
                              {"Approved"}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: hy.ui.blue.bg, color: hy.ui.blue.fg }}>
                              {"In negotiation"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded review workspace */}
                      {isExpanded && c.harveyNote && (
                        <div style={{ margin: '0 20px 16px', borderRadius: hy.radius.md, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>

                          {/* Review workflow steps banner */}
                          <div style={{ padding: '10px 16px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 18, height: 18, borderRadius: 999, background: hy.ui.success.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckSquare size={10} color={hy.ui.success.fg} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.success.fg }}>{"Harvey reviewed"}</span>
                            </div>
                            <div style={{ width: 24, height: 1, background: hy.border.base, margin: '0 8px' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 18, height: 18, borderRadius: 999, background: hy.ui.warning.bg, border: `2px solid ${hy.ui.warning.fg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 8, fontWeight: 800, color: hy.ui.warning.fg }}>2</span>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: hy.ui.warning.fg }}>{"Your review needed"}</span>
                            </div>
                            <div style={{ width: 24, height: 1, background: hy.border.base, margin: '0 8px' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
                              <div style={{ width: 18, height: 18, borderRadius: 999, background: hy.bg.component, border: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 8, fontWeight: 700, color: hy.fg.muted }}>3</span>
                              </div>
                              <span style={{ fontSize: 11, color: hy.fg.muted }}>{"Approve or send back"}</span>
                            </div>
                            <div style={{ flex: 1 }} />
                            <span style={{ fontSize: 10, color: hy.fg.muted }}>{"Submitted by"} <strong style={{ color: hy.fg.subtle }}>{c.submittedBy}</strong> · {dept} · {c.submittedDate}</span>
                          </div>

                          {/* Harvey first pass header */}
                          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8, background: hy.bg.base }}>
                            <CheckSquare size={13} color={hy.ui.blue.fg} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Harvey's First Pass"}</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginLeft: 6 }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: hy.ui.blue.fg, background: hy.ui.blue.bg, padding: '1px 7px', borderRadius: 4 }}>
                                <BookOpen size={10} />
                                {playbook}
                              </div>
                              {clauseCount !== null && clauseCount > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: hy.ui.violet.fg, background: hy.ui.violet.bg, padding: '1px 7px', borderRadius: 4 }}>
                                  <Library size={10} />
                                  {"Benchmarked"} {clauseCount} {clauseCount === 1 ? "clause" : "clauses"} {"vs library"}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Harvey's overall verdict */}
                          <div style={{ padding: '12px 16px', fontSize: 12, color: hy.fg.subtle, lineHeight: 1.55, borderBottom: (c.clauseRisks?.length ?? 0) > 0 || (c.harveyIssues?.length ?? 0) > 0 ? `1px solid ${hy.border.base}` : 'none', background: hy.bg.base }}>
                            {c.harveyNote}
                          </div>

                          {/* Clause-level risks */}
                          {(c.clauseRisks ?? []).length > 0 && (
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8, background: hy.bg.subtle }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Clause findings — requires your review"}</div>
                              {c.clauseRisks!.map((cr) => {
                                const rc = cr.rating === 'High' ? hy.ui.danger : cr.rating === 'Medium' ? hy.ui.warning : hy.ui.success
                                return (
                                  <div key={cr.clause} style={{ background: hy.bg.base, borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' as const }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{cr.clause}</span>
                                      <span style={{ fontSize: 10, fontWeight: 600, color: rc.fg, background: rc.bg, padding: '1px 6px', borderRadius: 999 }}>{cr.rating}</span>
                                      {cr.impact.map((imp) => (
                                        <span key={imp} style={{ fontSize: 10, color: hy.fg.muted, background: hy.bg.component, padding: '1px 6px', borderRadius: 999 }}>{imp}</span>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.45 }}>{cr.summary}</div>
                                    {(cr.fallbackRisk || cr.acceptRisk) && (
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                                        {cr.fallbackRisk && (
                                          <div style={{ fontSize: 11, background: hy.ui.warning.bg, borderRadius: 4, padding: '6px 8px' }}>
                                            <div style={{ fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 2 }}>{"If we push back"}</div>
                                            <div style={{ color: hy.ui.warning.fg, lineHeight: 1.4 }}>{cr.fallbackRisk}</div>
                                          </div>
                                        )}
                                        {cr.acceptRisk && (
                                          <div style={{ fontSize: 11, background: hy.ui.blue.bg, borderRadius: 4, padding: '6px 8px' }}>
                                            <div style={{ fontWeight: 600, color: hy.ui.blue.fg, marginBottom: 2 }}>{"If we accept"}</div>
                                            <div style={{ color: hy.ui.blue.fg, lineHeight: 1.4 }}>{cr.acceptRisk}</div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Harvey issues (non-clause) */}
                          {(c.harveyIssues ?? []).length > 0 && (
                            <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column' as const, gap: 6, background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}` }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Issues flagged"}</div>
                              {c.harveyIssues!.map((issue, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: hy.fg.subtle }}>
                                  <AlertTriangle size={11} color={hy.ui.warning.fg} style={{ marginTop: 2, flexShrink: 0 }} />
                                  {issue}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Your decision */}
                          <div style={{ padding: '12px 16px', borderTop: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 10 }}>{"Your decision"}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                              <button type="button" className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: hy.bg.base, background: hy.fg.base, border: 'none', borderRadius: hy.radius.sm, padding: '7px 14px', cursor: 'pointer' }}>
                                <Send size={11} />{"Approve & send"}
                              </button>
                              <button type="button" className="transition hover:bg-hy-bg-base-hover focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 400, color: hy.fg.base, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '7px 14px', cursor: 'pointer' }}>
                                {"Redline with Harvey"}
                              </button>
                              <button type="button" className="transition hover:bg-hy-bg-base-hover focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 400, color: hy.ui.warning.fg, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '7px 14px', cursor: 'pointer' }}>
                                {"Send back to"} {c.submittedBy}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )
                }

                // Non-in-review stages: original layout
                return (
                  <div key={c.id} style={{ borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 12, alignItems: 'center', padding: '11px 20px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{c.counterparty} · {c.type}</div>
                      </div>
                      <IntakeSourceBadge source={c.intakeSource} />
                      <div style={{ textAlign: 'right' as const, fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{c.value}</div>
                    </div>
                  </div>
                )
              })}
              {stageContracts.length > 8 && (
                <div style={{ padding: '10px 20px', borderTop: `1px solid ${hy.border.base}`, display: 'flex', justifyContent: 'center', background: hy.bg.subtle }}>
                  <button
                    type="button"
                    onClick={() => onTabChange('contracts')}
                    className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                    style={{ fontSize: 12, fontWeight: 500, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {`View all ${stageContracts.length} contracts →`}
                  </button>
                </div>
              )}
            </>
          )}
          {/* end queue subview */}
        </div>

        {/* ── Agent panel (right column, always visible) ── */}
        <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden', position: 'sticky' as const, top: 16 }}>
          {/* Header */}
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Harvey Agents"}</span>
              {activeStageData && (
                <span style={{ fontSize: 11, color: hy.fg.muted }}>— {activeStageData.label}</span>
              )}
            </div>
          </div>
          {/* Stat pills */}
          {(() => {
            const key = agentStageKey
            const running = stageAgents[key].filter((a) => a.status === 'running').length
            const attention = agentLog.filter((e) => e.stage === key && e.status === 'attention').length
            const done = agentLog.filter((e) => e.stage === key && e.status === 'completed').length
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderBottom: `1px solid ${hy.border.base}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: hy.ui.blue.bg }}>
                  <div style={{ width: 5, height: 5, borderRadius: 999, background: hy.ui.blue.fg }} />
                  <span style={{ fontSize: 11, color: hy.ui.blue.fg }}>{running} running</span>
                </div>
                {attention > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: hy.ui.warning.bg }}>
                    <AlertTriangle size={9} color={hy.ui.warning.fg} />
                    <span style={{ fontSize: 11, color: hy.ui.warning.fg }}>{attention} need attention</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: hy.ui.success.bg }}>
                  <div style={{ width: 5, height: 5, borderRadius: 999, background: hy.ui.success.fg }} />
                  <span style={{ fontSize: 11, color: hy.ui.success.fg }}>{done} done</span>
                </div>
              </div>
            )
          })()}
          {/* Activity log */}
          {stageLogs.slice(0, 8).map((entry, i) => {
            const color = stageColors[entry.stage]
            const statusFg = agentStatusColor[entry.status]
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => entry.linkTab && onTabChange(entry.linkTab)}
                className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 16px',
                  background: entry.status === 'attention' ? `${hy.ui.warning.bg}88` : 'transparent',
                  border: 'none',
                  borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none',
                  cursor: entry.linkTab ? 'pointer' : 'default',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ marginTop: 4, width: 6, height: 6, borderRadius: 999, background: statusFg, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ padding: '1px 5px', borderRadius: 999, background: color.bg, fontSize: 9, fontWeight: 700, color: color.fg, flexShrink: 0 }}>{entry.agent}</div>
                    <span style={{ fontSize: 11, color: hy.fg.muted, flexShrink: 0 }}>{entry.timestamp}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, marginBottom: 1 }}>{entry.title}</div>
                  <div style={{ fontSize: 11, color: hy.fg.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{entry.detail}</div>
                </div>
              </button>
            )
          })}
        </div>

      </div>

    </div>
  )
}

function StageHeader({ num, label, description }: { num: string; label: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: hy.radius.sm,
            background: hy.bg.component,
            border: `1px solid ${hy.border.base}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: hy.fg.muted,
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {num}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{label}</span>
      </div>
      <div style={{ flex: 1, height: 1, background: hy.border.base }} />
      <span style={{ fontSize: 11, color: hy.fg.muted, flexShrink: 0 }}>{description}</span>
    </div>
  )
}

function OverviewTab({ onTabChange }: { onTabChange: (tab: ActiveTab) => void }) {
  const totalContracts = 2847
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [ccView, setCcView] = useState<'overview' | 'agents'>('overview')

  const togglePanel = (panel: ActivePanel) => setActivePanel((p) => (p === panel ? null : panel))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Sub-tab switcher */}
      <div className="flex items-center gap-1 mb-1">
        <AnimatedBackground
          defaultValue={ccView}
          onValueChange={(value) => value && setCcView(value as 'overview' | 'agents')}
          className="bg-bg-subtle rounded-md"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <button data-id="overview" className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base" style={{ fontSize: '14px', lineHeight: '20px' }}>Overview</button>
          <button data-id="agents" className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base" style={{ fontSize: '14px', lineHeight: '20px' }}>Harvey Agents</button>
        </AnimatedBackground>
      </div>

      {ccView === 'agents' && (
        <HarveyAgentsLog onTabChange={onTabChange} />
      )}

      {ccView === 'overview' && <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Stage 01: Intake ─────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StageHeader num="01" label={"Contract Intake"} description={"47 new this week · 44 auto-classified · 3 flagged for review · 3 agents running"} />

        {/* New this week — full-width intake summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {/* New this week */}
          <button
            type="button"
            onClick={() => togglePanel('submitted')}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ padding: '20px 24px', borderRadius: hy.radius.lg, border: activePanel === 'submitted' ? `2px solid ${hy.fg.base}` : `1px solid ${hy.border.base}`, display: 'flex', flexDirection: 'column', gap: 6, background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.muted, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{"New this week"}</span>
              <ChevronDown size={13} style={{ transform: activePanel === 'submitted' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: hy.fg.muted }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>47</span>
              <span style={{ fontSize: 13, color: hy.fg.muted, fontWeight: 500 }}>{`of ${totalContracts.toLocaleString()} total`}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' as const }}>
              <IntakeSourceBadge source="Harvey on Teams" />
              <IntakeSourceBadge source="ask@harvey.ai" />
              <IntakeSourceBadge source="Shared Spaces" />
            </div>
          </button>

          {/* Harvey reviewing */}
          <div
            style={{ padding: '20px 24px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} color={hy.fg.muted} />
              {"Harvey reviewing"}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>23</div>
            <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 2 }}>{"Avg. 4.2 min per contract · AI-powered"}</div>
            <div style={{ marginTop: 6, height: 4, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '72%', background: hy.ui.blue.fg, borderRadius: 999, opacity: 0.7 }} />
            </div>
          </div>

          {/* Auto-classification */}
          <button
            type="button"
            onClick={() => onTabChange('contracts')}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ padding: '20px 24px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, display: 'flex', flexDirection: 'column', gap: 6, background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.muted, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Database size={12} color={hy.fg.muted} />
                <span>{"Auto-classified"}</span>
              </div>
              <ChevronRight size={12} color={hy.fg.muted} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>44</span>
              <span style={{ fontSize: 13, color: hy.fg.muted, fontWeight: 500 }}>{"of 47 this week"}</span>
            </div>
            {/* Confidence bar: high / medium / needs review */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', height: 5, borderRadius: 999, overflow: 'hidden', gap: 1 }}>
                <div style={{ flex: 36, background: hy.ui.success.fg, opacity: 0.85 }} />
                <div style={{ flex: 8, background: hy.ui.warning.fg, opacity: 0.85 }} />
                <div style={{ flex: 3, background: hy.ui.danger.fg, opacity: 0.85 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                <span style={{ fontSize: 10, color: hy.ui.success.fg }}>36 {"high confidence"}</span>
                <span style={{ fontSize: 10, color: hy.ui.warning.fg }}>8 {"review"}</span>
                <span style={{ fontSize: 10, color: hy.ui.danger.fg }}>3 {"low"}</span>
              </div>
            </div>
          </button>
        </div>

        {activePanel === 'submitted' && <SubmittedPanel onClose={() => setActivePanel(null)} />}
      </section>

      {/* ── Stage 02: Review & Standards ─────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StageHeader num="02" label={"Review Outcomes"} description={"42 min avg · 2,478 approved · 32 require your attention · 3 agents running"} />

        <PipelineHealthSummary onTabChange={onTabChange} />

        {/* Top row: review outcomes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {/* Avg review time */}
          <div
            style={{ padding: '20px 24px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} color={hy.fg.muted} />
              {"Avg. review time"}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>42m</div>
            <div style={{ fontSize: 12, color: hy.ui.success.fg, marginTop: 2 }}>{"vs. 118m manual — 76m saved"}</div>
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 4, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '36%', background: hy.ui.success.fg, borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 3 }}>{"36% of manual baseline"}</div>
            </div>
          </div>

          {/* Ready to send */}
          <button
            type="button"
            onClick={() => togglePanel('reviewed')}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ padding: '20px 24px', borderRadius: hy.radius.lg, border: activePanel === 'reviewed' ? `2px solid ${hy.ui.success.fg}` : `1px solid ${hy.border.base}`, display: 'flex', flexDirection: 'column', gap: 6, background: hy.ui.success.bg, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: hy.ui.success.fg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={13} />
                <span>{"Ready to send"}</span>
              </div>
              <ChevronDown size={13} style={{ transform: activePanel === 'reviewed' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: hy.ui.success.fg }} />
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: hy.ui.success.fg, lineHeight: 1 }}>2,478</div>
            <div style={{ fontSize: 12, color: hy.ui.success.fg, marginTop: 2 }}>{"Harvey reviewed — no red flags"}</div>
          </button>

          {/* Needs your review */}
          <button
            type="button"
            onClick={() => togglePanel('awaiting')}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ padding: '20px 24px', borderRadius: hy.radius.lg, border: activePanel === 'awaiting' ? `2px solid ${hy.ui.warning.fg}` : `1px solid ${hy.border.base}`, display: 'flex', flexDirection: 'column', gap: 6, background: hy.ui.warning.bg, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: hy.ui.warning.fg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle size={13} />
                <span>{"Needs your review"}</span>
              </div>
              <ChevronDown size={13} style={{ transform: activePanel === 'awaiting' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: hy.ui.warning.fg }} />
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: hy.ui.warning.fg, lineHeight: 1 }}>32</div>
            <div style={{ fontSize: 12, color: hy.ui.warning.fg, marginTop: 2 }}>{"Harvey flagged for your judgment"}</div>
          </button>
        </div>

        {activePanel === 'reviewed' && <HarveyReviewedPanel onClose={() => setActivePanel(null)} />}
        {activePanel === 'awaiting' && <AwaitingPanel onClose={() => setActivePanel(null)} />}
      </section>

      {/* ── Stage 03: Portfolio ───────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StageHeader num="03" label={"Portfolio Health"} description={"2,847 contracts · 43 at risk · $25.1M exposure identified · 3 agents running"} />

        {/* Standards health — portfolio-managed, inform review */}
        <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            <button
              type="button"
              onClick={() => onTabChange('playbooks')}
              className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: 'none', border: 'none', borderRight: `1px solid ${hy.border.base}`, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <BookOpen size={13} color={hy.fg.muted} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Playbooks"}</span>
                </div>
                <ChevronRight size={12} color={hy.fg.muted} />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>8</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>{"active rules"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.ui.danger.fg, lineHeight: 1 }}>3</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>{"need update"}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{"82% pass rate this week · 3 rules drifting from market"}</div>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('templates')}
              className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: 'none', border: 'none', borderRight: `1px solid ${hy.border.base}`, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <FileText size={13} color={hy.fg.muted} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Templates"}</span>
                </div>
                <ChevronRight size={12} color={hy.fg.muted} />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>24</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>{"templates"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.ui.success.fg, lineHeight: 1 }}>94%</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>{"NDA usage rate"}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{"8 deployed this week · 3 due for refresh"}</div>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('clauses')}
              className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Library size={13} color={hy.fg.muted} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Clause Library"}</span>
                </div>
                <ChevronRight size={12} color={hy.fg.muted} />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>143</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>{"standard clauses"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: hy.ui.danger.fg, lineHeight: 1 }}>4</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>{"coverage gaps"}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{"78% auto-match rate · 4 gaps Harvey can't fill yet"}</div>
            </button>
          </div>
        </div>

        {/* Contract Library health summary */}
        <div
          style={{
            borderRadius: hy.radius.lg,
            border: `1px solid ${hy.border.base}`,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Contract Library"}</div>
              <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 2 }}>{"Harvey has classified 10,247 of 10,891 contracts — 94% automated"}</div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange('contracts')}
              className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ fontSize: 12, fontWeight: 600, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {"Organize library →"}
            </button>
          </div>
          <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6 }}>
            {contractTypeBreakdown.map((item) => (
              <button
                key={item.category}
                type="button"
                onClick={() => onTabChange('contracts')}
                className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 6px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'center', borderRadius: 6 }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: item.color.fg }}>{item.count.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: hy.fg.muted, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.category}</div>
                <div style={{ height: 3, background: hy.bg.component, borderRadius: 999, overflow: 'hidden', width: '100%' }}>
                  <div style={{ height: '100%', width: `${item.confidence}%`, background: item.color.fg, borderRadius: 999, opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: 9, color: hy.fg.muted }}>{item.confidence}%</div>
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 20px', borderTop: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: hy.ui.warning.fg }} />
              <span style={{ fontSize: 11, color: hy.fg.muted }}>{"112 contracts need classification review"}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: hy.ui.success.fg }} />
              <span style={{ fontSize: 11, color: hy.fg.muted }}>{"7 contract families identified"}</span>
            </div>
            <button
              type="button"
              onClick={() => onTabChange('contracts')}
              className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: hy.ui.warning.fg, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {"Review 112 flagged →"}
            </button>
          </div>
        </div>

        {/* Obligations + Risk side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Upcoming obligations */}
          <div
            style={{
              borderRadius: hy.radius.lg,
              border: `1px solid ${hy.border.base}`,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Upcoming Obligations"}</div>
                <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 2 }}>{"Key deadlines requiring attention"}</div>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('key-dates')}
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 13, color: hy.ui.blue.fg, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {"View all →"}
              </button>
            </div>
            {upcomingObligations.map((ob) => {
              const sevColor = ob.severity === 'critical' ? hy.ui.danger.fg : ob.severity === 'high' ? hy.ui.warning.fg : hy.fg.muted
              const sevBg = ob.severity === 'critical' ? hy.ui.danger.bg : ob.severity === 'high' ? hy.ui.warning.bg : hy.bg.component
              return (
                <div
                  key={ob.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr 72px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: `1px solid ${hy.border.base}`,
                  }}
                >
                  <div
                    style={{
                      height: 32,
                      borderRadius: hy.radius.sm,
                      background: sevBg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: sevColor, lineHeight: 1 }}>{ob.daysLeft}</span>
                    <span style={{ fontSize: 9, color: sevColor, marginTop: 1 }}>{"days"}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ob.title}</div>
                    <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ob.counterparty} · {ob.contract}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Chip
                      label={ob.severity.charAt(0).toUpperCase() + ob.severity.slice(1)}
                      fg={sevColor}
                      bg={sevBg}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Portfolio Risk Exposure */}
          <div
            style={{
              borderRadius: hy.radius.lg,
              border: `1px solid ${hy.border.base}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '14px 20px 12px', borderBottom: `1px solid ${hy.border.base}` }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base }}>{"Portfolio Risk Exposure"}</div>
              <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 2 }}>
                {"43 contracts flagged · $25.1M in identified exposure"}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <div style={{ position: 'relative', flex: '0 0 55%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioRiskByCategory}
                      dataKey="contracts"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={100}
                      paddingAngle={2}
                      strokeWidth={0}
                      isAnimationActive
                    >
                      {portfolioRiskByCategory.map((item) => (
                        <Cell
                          key={item.category}
                          fill={riskCategoryColor[item.category].fg}
                          opacity={0.85}
                          style={{ cursor: 'pointer', outline: 'none' }}
                          onClick={() => onTabChange('contracts')}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: number, name: string) => [`${value} contracts`, name]) as any}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: hy.radius.sm,
                        border: `1px solid ${hy.border.base}`,
                        background: hy.bg.base,
                        color: hy.fg.base,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: hy.fg.base, lineHeight: 1 }}>43</div>
                  <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 4, lineHeight: 1.3 }}>{"contracts"}<br />{"flagged"}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hy.ui.danger.fg, marginTop: 5 }}>$25.1M</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px 12px 4px', gap: 2, overflowY: 'auto' }}>
                {portfolioRiskByCategory.map((item) => {
                  const color = riskCategoryColor[item.category]
                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => onTabChange('contracts')}
                      className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 6px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderRadius: 4, width: '100%' }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: color.fg, flexShrink: 0, opacity: 0.85 }} />
                      <span style={{ flex: 1, fontSize: 11, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.category}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: color.fg, flexShrink: 0 }}>{item.contracts}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ padding: '10px 20px', borderTop: `1px solid ${hy.border.base}` }}>
              <button
                type="button"
                onClick={() => onTabChange('contracts')}
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 12, fontWeight: 600, color: hy.ui.danger.fg, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {"View all at-risk contracts →"}
              </button>
            </div>
          </div>
        </div>

      </section>

      </div>}
    </div>
  )
}

// ── Playbooks ─────────────────────────────────────────────────────────────────

type PlaybookView = 'updates' | 'gaps' | 'ai-alignment'

function PlaybookUpdateCard({ rule, isExpanded, onToggle }: { rule: PlaybookRule; isExpanded: boolean; onToggle: () => void }) {
  const statusMap: Record<PlaybookRuleStatus, { fg: string; bg: string; label: string }> = {
    aligned: { ...hy.ui.success, label: "Aligned" },
    drifting: { ...hy.ui.gold, label: "Drifting" },
    outdated: { ...hy.ui.danger, label: "Outdated" },
  }
  const { fg, bg, label } = statusMap[rule.status]
  const isUrgent = rule.status === 'outdated'
  return (
    <div style={{ borderBottom: `1px solid ${hy.border.base}` }}>
      <button
        type="button"
        onClick={onToggle}
        className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 2fr 180px 100px 80px 130px',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          width: '100%',
          background: isUrgent ? `${hy.ui.danger.bg}66` : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {isExpanded
          ? <ChevronDown size={14} color={hy.fg.muted} />
          : <ChevronRight size={14} color={hy.fg.muted} />
        }
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{rule.category}</div>
          <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>Current: {rule.standardPosition}</div>
        </div>
        <div style={{ fontSize: 12, color: hy.fg.subtle }}>{rule.evidence}</div>
        <div><Chip label={label} fg={fg} bg={bg} /></div>
        <AcceptBar rate={rule.acceptRate} />
        {rule.suggestedUpdate ? (
          <div style={{ fontSize: 12, color: hy.ui.blue.fg, fontWeight: 500 }}>{rule.suggestedUpdate}</div>
        ) : (
          <span style={{ fontSize: 12, color: hy.fg.muted }}>No update needed</span>
        )}
      </button>
      {isExpanded && (
        <div style={{ padding: '0 20px 20px 56px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div style={{ padding: '12px 14px', borderRadius: hy.radius.sm, border: `1px solid ${hy.ui.danger.fg}`, background: `${hy.ui.danger.bg}99` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.danger.fg, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>
                {"Risk if you keep current position"}
              </div>
              <div style={{ fontSize: 13, color: hy.fg.base }}>{rule.keepRisk}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: hy.radius.sm, border: `1px solid ${hy.ui.success.fg}`, background: `${hy.ui.success.bg}99` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.success.fg, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>
                {"Risk if you apply update"}
              </div>
              <div style={{ fontSize: 13, color: hy.fg.base }}>{rule.updateRisk}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{"Fallback position"}</div>
              <div style={{ fontSize: 12, color: hy.fg.subtle, padding: '8px 10px', background: hy.bg.component, borderRadius: hy.radius.sm }}>{rule.fallbackPosition}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{"Rule details"}</div>
              <div style={{ fontSize: 12, color: hy.fg.subtle }}>
                <div style={{ marginBottom: 4 }}>Last updated: {rule.lastUpdated}</div>
                <div style={{ marginBottom: 4 }}>Based on {rule.recentDeals} deals in last 90 days</div>
                {rule.affectedContracts && <div>Affects ~{rule.affectedContracts} active contracts</div>}
              </div>
            </div>
          </div>
          {rule.suggestedUpdate && rule.status !== 'aligned' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: hy.radius.sm, border: `1px solid ${hy.ui.success.fg}`, background: hy.ui.success.fg, color: hy.bg.base, cursor: 'pointer' }}
              >
                {"Apply update"}
              </button>
              <button
                type="button"
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.base, cursor: 'pointer' }}
              >
                {"Review in context"}
              </button>
              <button
                type="button"
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 12, fontWeight: 500, padding: '7px 16px', borderRadius: hy.radius.sm, border: 'none', background: 'transparent', color: hy.fg.muted, cursor: 'pointer' }}
              >
                {"Dismiss"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlaybookGapCard({ gap, isExpanded, onToggle }: { gap: PlaybookGap; isExpanded: boolean; onToggle: () => void }) {
  const riskColor = gap.riskLevel === 'High' ? hy.ui.danger : gap.riskLevel === 'Medium' ? hy.ui.gold : hy.ui.olive
  return (
    <div style={{ borderBottom: `1px solid ${hy.border.base}` }}>
      <button
        type="button"
        onClick={onToggle}
        className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 2fr 80px 60px 1fr',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          background: 'transparent',
        }}
      >
        {isExpanded
          ? <ChevronDown size={14} color={hy.fg.muted} />
          : <ChevronRight size={14} color={hy.fg.muted} />
        }
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{gap.term}</div>
          <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>{gap.description.slice(0, 80)}…</div>
        </div>
        <Chip label={gap.riskLevel} fg={riskColor.fg} bg={riskColor.bg} />
        <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{gap.frequency}<span style={{ fontSize: 11, fontWeight: 400, color: hy.fg.muted }}> negotiations</span></div>
        <div style={{ fontSize: 12, color: hy.ui.blue.fg, fontStyle: 'italic' }}>{gap.harveySuggestion.slice(0, 90)}…</div>
      </button>
      {isExpanded && (
        <div style={{ padding: '0 20px 20px 56px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}` }}>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{"Gap description"}</div>
            <div style={{ fontSize: 13, color: hy.fg.base, lineHeight: 1.6 }}>{gap.description}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{"Harvey's suggested fallback"}</div>
              <div style={{ fontSize: 12, color: hy.fg.subtle, padding: '10px 12px', background: hy.ui.blue.bg, border: `1px solid ${hy.ui.blue.fg}`, borderRadius: hy.radius.sm, lineHeight: 1.6 }}>{gap.suggestedFallback}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{"Frequently seen counterparties"}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {gap.affectedCounterparties.map((cp: string) => (
                  <Chip key={cp} label={cp} fg={hy.fg.subtle} bg={hy.bg.component} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: hy.fg.subtle, marginBottom: 12 }}>{gap.harveySuggestion}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: hy.radius.sm, border: `1px solid ${hy.ui.blue.fg}`, background: hy.ui.blue.fg, color: hy.bg.base, cursor: 'pointer' }}
              >
                <Plus size={13} />
                {"Create playbook"}
              </button>
              <button
                type="button"
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.base, cursor: 'pointer' }}
              >
                {"Review Harvey draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlaybooksTab({ rules, gaps }: { rules: PlaybookRule[]; gaps: PlaybookGap[] }) {
  const [view, setView] = useState<PlaybookView>('updates')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aiAlignedOverrides, setAiAlignedOverrides] = useState<Record<string, boolean>>({})

  const needsUpdate = rules.filter((r) => r.status !== 'aligned')
  const aligned = rules.filter((r) => r.status === 'aligned')
  const aiActiveCount = rules.filter((r) => (aiAlignedOverrides[r.id] !== undefined ? aiAlignedOverrides[r.id] : r.aiAligned)).length
  const totalAutoReviews = rules.reduce((sum, r) => sum + r.usedInAutoReview, 0)

  const toggleExpanded = (id: string) => setExpandedId((prev) => (prev === id ? null : id))
  const toggleAiAlignment = (id: string) => {
    setAiAlignedOverrides((prev) => ({
      ...prev,
      [id]: !(prev[id] !== undefined ? prev[id] : rules.find((r) => r.id === id)?.aiAligned),
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: "Active playbook rules", value: rules.length.toString(), sub: `${aligned.length} aligned`, icon: <BookOpen size={16} color={hy.fg.muted} /> },
          { label: "Updates proposed", value: needsUpdate.length.toString(), sub: "Harvey flagged", icon: <RefreshCw size={16} color={hy.ui.warning.fg} />, warn: needsUpdate.length > 0 },
          { label: "Coverage gaps", value: gaps.length.toString(), sub: `${gaps.filter((g) => g.riskLevel === 'High').length} high risk`, icon: <Target size={16} color={hy.ui.danger.fg} />, danger: gaps.some((g) => g.riskLevel === 'High') },
          { label: "AI-aligned rules", value: `${aiActiveCount} / ${rules.length}`, sub: `${totalAutoReviews.toLocaleString()} auto-reviews this month`, icon: <Zap size={16} color={hy.ui.blue.fg} />, blue: true },
        ].map(({ label, value, sub, icon }) => {
          const borderColor = hy.border.base
          const bgColor = hy.bg.base
          const textColor = hy.fg.base
          const subColor = hy.fg.muted
          return (
            <div key={label} style={{ padding: '16px 20px', borderRadius: hy.radius.lg, border: `1px solid ${borderColor}`, background: bgColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>{icon}<span style={{ fontSize: 11, fontWeight: 500, color: subColor }}>{label}</span></div>
              <div style={{ fontSize: 28, fontWeight: 700, color: textColor, lineHeight: 1, margin: '4px 0 4px' }}>{value}</div>
              <div style={{ fontSize: 11, color: subColor }}>{sub}</div>
            </div>
          )
        })}
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 mb-1">
        <AnimatedBackground
          defaultValue={view}
          onValueChange={(value) => { if (value) { setView(value as PlaybookView); setExpandedId(null) } }}
          className="bg-bg-subtle rounded-md"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {([
            { key: 'updates', label: 'Playbook Updates', count: needsUpdate.length },
            { key: 'gaps', label: 'New Playbook Development', count: gaps.length },
            { key: 'ai-alignment', label: 'AI Usage Alignment', count: aiActiveCount },
          ] as { key: PlaybookView; label: string; count: number }[]).map(({ key, label, count }) => (
            <button
              key={key}
              data-id={key}
              className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {label}
              <span className="ml-1.5 text-xs font-semibold text-fg-muted">{count}</span>
            </button>
          ))}
        </AnimatedBackground>
      </div>

      {/* § 9.1 — Playbook Updates */}
      {view === 'updates' && (
        <div>
          {needsUpdate.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}`, borderRadius: hy.radius.md, padding: '12px 16px', marginBottom: 16 }}>
              <AlertTriangle size={15} color={hy.ui.warning.fg} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: hy.ui.warning.fg }}>{`Harvey identified ${needsUpdate.length} playbook rules that need attention`}</div>
                <div style={{ fontSize: 12, color: hy.ui.warning.fg, marginTop: 2 }}>
                  {"Based on deal data from the last 90 days. Updating these rules will reduce negotiation friction and align Harvey's auto-review with current practice."}
                </div>
              </div>
            </div>
          )}
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden', background: hy.bg.base }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 180px 100px 80px 130px', gap: 12, padding: '8px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              {['', "Rule / Current position", "Harvey evidence", "Status", "Accept rate", "Suggested update"].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {/* Outdated/drifting first */}
            {needsUpdate.map((r) => (
              <PlaybookUpdateCard key={r.id} rule={r} isExpanded={expandedId === r.id} onToggle={() => toggleExpanded(r.id)} />
            ))}
            {/* Aligned rules */}
            {aligned.map((r) => (
              <PlaybookUpdateCard key={r.id} rule={r} isExpanded={expandedId === r.id} onToggle={() => toggleExpanded(r.id)} />
            ))}
          </div>
        </div>
      )}

      {/* § 9.2 — New Playbook Development */}
      {view === 'gaps' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: hy.ui.blue.bg, border: `1px solid ${hy.ui.blue.fg}`, borderRadius: hy.radius.md, padding: '12px 16px', marginBottom: 16 }}>
            <TrendingUp size={15} color={hy.ui.blue.fg} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hy.ui.blue.fg }}>{`Harvey identified ${gaps.length} high-frequency terms with no playbook coverage`}</div>
              <div style={{ fontSize: 12, color: hy.ui.blue.fg, marginTop: 2 }}>
                {"These terms are being negotiated repeatedly without standardized positions. Harvey can draft starter language for each — no manual drafting required."}
              </div>
            </div>
          </div>
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden', background: hy.bg.base }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 80px 60px 1fr', gap: 12, padding: '8px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              {['', "Term / Description", "Risk", "Frequency", "Harvey insight"].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {gaps.map((gap) => (
              <PlaybookGapCard key={gap.id} gap={gap} isExpanded={expandedId === gap.id} onToggle={() => toggleExpanded(gap.id)} />
            ))}
          </div>
        </div>
      )}

      {/* § 9.3 — AI Usage Alignment */}
      {view === 'ai-alignment' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: hy.ui.success.bg, border: `1px solid ${hy.ui.success.fg}`, borderRadius: hy.radius.md, padding: '12px 16px', marginBottom: 16 }}>
            <Zap size={15} color={hy.ui.success.fg} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hy.ui.success.fg }}>{"AI-aligned rules apply approved playbook language automatically — no additional approval required"}</div>
              <div style={{ fontSize: 12, color: hy.ui.success.fg, marginTop: 2 }}>
                {"When Harvey reviews a contract, it uses aligned rules directly. Toggle a rule off to require human sign-off before Harvey applies it."}
              </div>
            </div>
          </div>
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden', background: hy.bg.base }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 160px 100px 80px 120px 80px', gap: 12, padding: '10px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              {["Rule / Current position", "Fallback", "AI confidence", "Accept rate", "Used this month", "AI aligned"].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {rules.map((r, i) => {
              const isEnabled = aiAlignedOverrides[r.id] !== undefined ? aiAlignedOverrides[r.id] : r.aiAligned
              const confColor = r.aiConfidence >= 90 ? hy.ui.success.fg : r.aiConfidence >= 75 ? hy.ui.gold.fg : hy.ui.danger.fg
              return (
                <div
                  key={r.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 160px 100px 80px 120px 80px', gap: 12, alignItems: 'center', padding: '13px 20px', borderBottom: i < rules.length - 1 ? `1px solid ${hy.border.base}` : 'none', background: !isEnabled ? `${hy.ui.warning.bg}55` : 'transparent' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{r.category}</div>
                    <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 1 }}>{r.standardPosition}</div>
                  </div>
                  <div style={{ fontSize: 11, color: hy.fg.subtle, lineHeight: 1.4 }}>{r.fallbackPosition.slice(0, 60)}{r.fallbackPosition.length > 60 ? '…' : ''}</div>
                  <div>
                    {r.aiConfidence > 0 ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: confColor }}>{r.aiConfidence}%</div>
                        <div style={{ height: 4, background: hy.bg.component, borderRadius: 999, overflow: 'hidden', marginTop: 3, width: 60 }}>
                          <div style={{ height: '100%', width: `${r.aiConfidence}%`, background: confColor, borderRadius: 999 }} />
                        </div>
                      </div>
                    ) : <span style={{ fontSize: 12, color: hy.fg.muted }}>Not enabled</span>}
                  </div>
                  <AcceptBar rate={r.acceptRate} />
                  <div>
                    {r.usedInAutoReview > 0 ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{r.usedInAutoReview.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: hy.fg.muted }}>reviews</div>
                      </div>
                    ) : <span style={{ fontSize: 12, color: hy.fg.muted }}>—</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAiAlignment(r.id)}
                    className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    aria-label={isEnabled ? `Disable AI alignment for ${r.category}` : `Enable AI alignment for ${r.category}`}
                  >
                    <div style={{ width: 36, height: 20, borderRadius: 999, background: isEnabled ? hy.ui.success.fg : hy.bg.component, border: `1px solid ${isEnabled ? hy.ui.success.fg : hy.border.base}`, position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: isEnabled ? 18 : 2, width: 14, height: 14, borderRadius: 999, background: hy.bg.base, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: 11, color: isEnabled ? hy.ui.success.fg : hy.fg.muted, fontWeight: 500 }}>
                      {isEnabled ? "Active" : "Off"}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: hy.bg.subtle, borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}` }}>
            <div style={{ fontSize: 12, color: hy.fg.subtle }}>
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} color={hy.fg.muted} />
              {"AI-aligned rules use approved language from your official playbooks. When toggled on, Harvey applies them without requiring an additional internal approval step, reducing review time by an average of 1.2 days per contract."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Templates ─────────────────────────────────────────────────────────────────

const templateDetails: Record<string, {
  contractsFromTemplate: number
  lastUsed: string
  requiredReviews: string[]
  jurisdictionVariants: string[]
  signatureOptions: string[]
  harveyUpdate?: string
}> = {
  't1': { contractsFromTemplate: 189, lastUsed: 'Mar 9, 2026', requiredReviews: ['Privacy Review', 'Antitrust Review'], jurisdictionVariants: ['US', 'UK', 'EU'], signatureOptions: ['Electronic', 'Wet'], harveyUpdate: undefined },
  't2': { contractsFromTemplate: 61, lastUsed: 'Mar 7, 2026', requiredReviews: ['Privacy Review'], jurisdictionVariants: ['UK', 'EU'], signatureOptions: ['Electronic', 'Wet'], harveyUpdate: undefined },
  't3': { contractsFromTemplate: 88, lastUsed: 'Mar 8, 2026', requiredReviews: ['Privacy Review', 'CSO Review'], jurisdictionVariants: ['EU', 'Germany', 'France', 'Netherlands'], signatureOptions: ['Electronic'], harveyUpdate: 'DORA compliance language needs update — 156 contracts may be affected. Harvey can draft amendments.' },
  't4': { contractsFromTemplate: 22, lastUsed: 'Mar 6, 2026', requiredReviews: ['Privacy Review', 'CSO Review'], jurisdictionVariants: ['UK'], signatureOptions: ['Electronic', 'Wet'], harveyUpdate: 'UK GDPR post-Brexit divergence detected. 3 clauses need jurisdiction-specific language.' },
  't5': { contractsFromTemplate: 412, lastUsed: 'Mar 10, 2026', requiredReviews: [], jurisdictionVariants: ['US', 'CA', 'NY', 'TX'], signatureOptions: ['Electronic', 'Wet'], harveyUpdate: undefined },
  't6': { contractsFromTemplate: 143, lastUsed: 'Mar 9, 2026', requiredReviews: ['Antitrust Review'], jurisdictionVariants: ['US'], signatureOptions: ['Electronic', 'Wet'], harveyUpdate: undefined },
  't7': { contractsFromTemplate: 34, lastUsed: 'Mar 5, 2026', requiredReviews: ['CSO Review', 'Privacy Review'], jurisdictionVariants: ['US', 'EU', 'APAC'], signatureOptions: ['Electronic'], harveyUpdate: 'Uptime SLA thresholds below industry standard in 2 jurisdictions. Suggest update.' },
}

function TemplatesTab({ rows }: { rows: TemplateRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const statusMap: Record<string, { fg: string; bg: string }> = {
    Standardized: hy.ui.success,
    'In progress': hy.ui.blue,
    Divergent: hy.ui.danger,
  }
  const totalContractsFromTemplates = rows.reduce((sum, r) => sum + (templateDetails[r.id]?.contractsFromTemplate ?? 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: "Templates", value: rows.length.toString(), sub: `${rows.filter(r => r.status === 'Standardized').length} standardized` },
          { label: "Contracts from templates", value: totalContractsFromTemplates.toLocaleString(), sub: "created in Harvey" },
          { label: "Need updates", value: rows.filter(r => templateDetails[r.id]?.harveyUpdate).length.toString(), sub: "Harvey flagged", warn: true },
          { label: "Pending review", value: rows.filter(r => r.status === 'In progress').length.toString(), sub: "in progress" },
        ].map(({ label, value, sub, warn }) => (
          <div key={label} style={{ padding: '16px 20px', borderRadius: hy.radius.lg, border: `1px solid ${warn ? hy.ui.warning.fg : hy.border.base}`, background: warn ? hy.ui.warning.bg : hy.bg.base }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: warn ? hy.ui.warning.fg : hy.fg.muted }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: warn ? hy.ui.warning.fg : hy.fg.base, lineHeight: 1, margin: '4px 0' }}>{value}</div>
            <div style={{ fontSize: 11, color: warn ? hy.ui.warning.fg : hy.fg.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Template list */}
      <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 110px 120px 100px 80px', padding: '8px 20px', borderBottom: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
          {["Template", "Business line", "Jurisdiction", "Status", "Contracts used", "Regulatory"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {rows.map((row, i) => {
          const { fg, bg } = statusMap[row.status] ?? hy.ui.neutral
          const detail = templateDetails[row.id]
          const isExpanded = expandedId === row.id
          const hasUpdate = !!detail?.harveyUpdate
          return (
            <div key={row.id} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : row.id)}
                className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ display: 'grid', gridTemplateColumns: '2fr 120px 110px 120px 100px 80px', alignItems: 'center', padding: '12px 20px', width: '100%', background: hasUpdate ? `${hy.ui.warning.bg}55` : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{row.name}</span>
                    {hasUpdate && <Chip label="Update needed" fg={hy.ui.warning.fg} bg={hy.ui.warning.bg} />}
                  </div>
                  {detail?.lastUsed && <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 2 }}>Last used {detail.lastUsed}</div>}
                </div>
                <div style={{ fontSize: 12, color: hy.fg.subtle }}>{row.businessLine}</div>
                <div style={{ fontSize: 12, color: hy.fg.subtle }}>{row.jurisdiction}</div>
                <div><Chip label={row.status} fg={fg} bg={bg} /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{detail?.contractsFromTemplate.toLocaleString() ?? '—'}</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted }}>from template</div>
                </div>
                <div>
                  {row.regulatoryImpact ? <Chip label={row.regulatoryImpact} fg={hy.ui.warning.fg} bg={hy.ui.warning.bg} /> : <span style={{ fontSize: 12, color: hy.fg.muted }}>—</span>}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && detail && (
                <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
                  {detail.harveyUpdate && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}`, borderRadius: hy.radius.sm, padding: '10px 14px', margin: '14px 0 12px' }}>
                      <AlertTriangle size={15} color={hy.ui.warning.fg} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 4 }}>{"Harvey detected a required update"}</div>
                        <div style={{ fontSize: 12, color: hy.ui.warning.fg }}>{detail.harveyUpdate}</div>
                      </div>
                      <button type="button" style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: hy.radius.sm, border: `1px solid ${hy.ui.warning.fg}`, background: hy.ui.warning.fg, color: hy.bg.base, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                        {"Draft amendments"}
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Required reviews"}</div>
                      {detail.requiredReviews.length > 0 ? detail.requiredReviews.map((r) => (
                        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Shield size={11} color={hy.ui.blue.fg} />
                          <span style={{ fontSize: 12, color: hy.fg.subtle }}>{r}</span>
                        </div>
                      )) : <span style={{ fontSize: 12, color: hy.fg.muted }}>None required</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Jurisdictions"}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                        {detail.jurisdictionVariants.map((j) => <Chip key={j} label={j} fg={hy.fg.subtle} bg={hy.bg.component} />)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Signature options"}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {detail.signatureOptions.map((s) => <Chip key={s} label={s} fg={hy.ui.olive.fg} bg={hy.ui.olive.bg} />)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Actions"}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        <button type="button" style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: hy.radius.sm, border: 'none', background: hy.fg.base, color: hy.bg.base, cursor: 'pointer', textAlign: 'left' }}>
                          {"Draft new contract →"}
                        </button>
                        <button type="button" style={{ fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.base, cursor: 'pointer', textAlign: 'left' }}>
                          {"Edit template"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Clause Library ─────────────────────────────────────────────────────────────

const clauseAnalytics = [
  { name: 'Indemnification', modifications: 38, rejections: 12, escalations: 8, peerAccept: 54, ourAccept: 58, trend: 'changing' },
  { name: 'Liability cap', modifications: 9, rejections: 3, escalations: 1, peerAccept: 82, ourAccept: 86, trend: 'stable' },
  { name: 'Termination for cause', modifications: 5, rejections: 1, escalations: 0, peerAccept: 89, ourAccept: 91, trend: 'stable' },
  { name: 'Data processing (GDPR)', modifications: 24, rejections: 7, escalations: 5, peerAccept: 68, ourAccept: 72, trend: 'stable' },
  { name: 'IP assignment', modifications: 41, rejections: 22, escalations: 14, peerAccept: 40, ourAccept: 44, trend: 'contested' },
]

function ClausesTab({ clauses }: { clauses: ClauseRow[] }) {
  const [activeView, setActiveView] = useState<'library' | 'analytics' | 'counterparty'>('library')

  const trendMap: Record<string, { fg: string; bg: string; label: string }> = {
    stable: { ...hy.ui.success, label: "Stable" },
    changing: { ...hy.ui.gold, label: "Changing" },
    contested: { ...hy.ui.danger, label: "Contested" },
  }

  return (
    <>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${hy.border.base}`, marginBottom: 20 }}>
        {([['library', "Clause Library"], ['analytics', "Trends & Analytics"], ['counterparty', "By Counterparty"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveView(id)}
            className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: activeView === id ? 500 : 400,
              color: activeView === id ? hy.fg.base : hy.fg.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeView === id ? `2px solid ${hy.fg.base}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeView === 'library' && (
        <>
          <SectionHeader count={clauses.length} label={"clauses"} action={"Filter"} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clauses.map((clause) => {
              const { fg, bg, label } = trendMap[clause.trending]
              const ratingColor = clause.riskRating === 'High' ? hy.ui.danger : clause.riskRating === 'Medium' ? hy.ui.warning : hy.ui.success
              return (
                <div
                  key={clause.id}
                  style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, padding: '16px 20px' }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>{clause.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, background: hy.bg.component, padding: '2px 6px', borderRadius: hy.radius.xs }}>{clause.version}</span>
                      <span style={{ fontSize: 11, color: hy.fg.subtle, background: hy.bg.subtle, padding: '2px 6px', borderRadius: hy.radius.xs }}>{clause.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Chip label={`${clause.riskRating} risk`} fg={ratingColor.fg} bg={ratingColor.bg} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: hy.fg.muted }}>{"Accept rate"}</span>
                        <AcceptBar rate={clause.acceptanceRate} width={48} />
                      </div>
                      <Chip label={label} fg={fg} bg={bg} />
                    </div>
                  </div>
                  {/* Excerpt */}
                  <p style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>
                    &ldquo;{clause.excerpt}&rdquo;
                  </p>
                  {/* Risk assessment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: hy.ui.warning.bg, borderRadius: hy.radius.sm, padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 4 }}>{"Risk if we push back"}</div>
                      <div style={{ fontSize: 12, color: hy.ui.warning.fg, lineHeight: 1.5 }}>{clause.riskAssessment.fallbackRisk}</div>
                    </div>
                    <div style={{ background: hy.ui.blue.bg, borderRadius: hy.radius.sm, padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.blue.fg, marginBottom: 4 }}>{"Risk if we accept"}</div>
                      <div style={{ fontSize: 12, color: hy.ui.blue.fg, lineHeight: 1.5 }}>{clause.riskAssessment.acceptRisk}</div>
                    </div>
                  </div>
                  {/* Impact tags */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {clause.riskAssessment.impacts.map((imp: string) => (
                      <Chip key={imp} label={imp} fg={hy.fg.muted} bg={hy.bg.component} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeView === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Modification/rejection bar chart */}
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, padding: '18px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: hy.fg.base, marginBottom: 2 }}>{"Clause modification & escalation frequency"}</div>
            <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 16 }}>{"Last 90 days — clauses most frequently modified, rejected, or escalated"}</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={clauseAnalytics} barSize={14} barGap={2} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: hy.fg.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="modifications" name="Modified" fill={hy.ui.gold.fg} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                <Bar dataKey="rejections" name="Rejected" fill={hy.ui.danger.fg} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                <Bar dataKey="escalations" name="Escalated" fill={hy.ui.violet.fg} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[{ label: 'Modified', color: hy.ui.gold.fg }, { label: 'Rejected', color: hy.ui.danger.fg }, { label: 'Escalated', color: hy.ui.violet.fg }].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: hy.fg.muted }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Peer comparison table */}
          <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} color={hy.fg.base} />
              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Peer comparison"}</span>
              <span style={{ fontSize: 12, color: hy.fg.muted, marginLeft: 4 }}>{"Anonymous benchmark against comparable agreements"}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 140px', padding: '8px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              {["Clause", "Our accept %", "Peer accept %", "Trend", "Harvey's take"].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {clauseAnalytics.map((row, i) => {
              const delta = row.ourAccept - row.peerAccept
              const deltaColor = delta > 5 ? hy.ui.success.fg : delta < -5 ? hy.ui.danger.fg : hy.fg.muted
              const { fg, bg, label: tLabel } = trendMap[row.trend]
              const harveyTake = row.trend === 'contested'
                ? 'Below peer avg — consider updating clause language'
                : row.trend === 'changing'
                ? 'Acceptance declining — review recent pushback'
                : 'Performing in line with market'
              return (
                <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 140px', alignItems: 'center', padding: '11px 20px', borderBottom: i < clauseAnalytics.length - 1 ? `1px solid ${hy.border.base}` : 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{row.name}</span>
                  <AcceptBar rate={row.ourAccept} width={40} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AcceptBar rate={row.peerAccept} width={40} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: deltaColor }}>{delta > 0 ? `+${delta}` : delta}</span>
                  </div>
                  <Chip label={tLabel} fg={fg} bg={bg} />
                  <span style={{ fontSize: 11, color: hy.fg.subtle }}>{harveyTake}</span>
                </div>
              )
            })}
          </div>

          {/* Harvey-flagged clauses needing attention */}
          <div style={{ borderRadius: hy.radius.md, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} color={hy.fg.base} />
              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{"Harvey recommendations"}</span>
            </div>
            {[
              { clause: 'IP assignment', action: 'Update to narrow scope — acceptance rate (44%) is 16 points below peer benchmark. Draft new v2.9 language.', rating: 'High' as const },
              { clause: 'Indemnification', action: 'Add subprocessor carve-out — 38 modifications in 90 days signal consistent counterparty pushback.', rating: 'Medium' as const },
            ].map((rec, i) => {
              const rc = rec.rating === 'High' ? hy.ui.danger : hy.ui.warning
              return (
                <div key={rec.clause} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i === 0 ? `1px solid ${hy.border.base}` : 'none' }}>
                  <Chip label={rec.rating} fg={rc.fg} bg={rc.bg} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{rec.clause}: </span>
                    <span style={{ fontSize: 13, color: hy.fg.subtle }}>{rec.action}</span>
                  </div>
                  <button type="button" style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: hy.radius.sm, border: 'none', background: hy.fg.base, color: hy.bg.base, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                    {"Draft update"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeView === 'counterparty' && (
        <>
          <SectionHeader count={counterpartyData.length} label={"counterparties"} action={"Filter"} />
          <TableWrapper>
            <TableHeader cols={["Counterparty", "Contracts", "Avg negotiation", "Accept rate", "Risk", "Trend", "Top contested clause"]} />
            <tbody>
              {counterpartyData.map((cp, i) => {
                const riskMap: Record<string, { fg: string; bg: string }> = {
                  Low: hy.ui.success,
                  Medium: hy.ui.gold,
                  High: hy.ui.danger,
                }
                const trendColorMap: Record<string, string> = {
                  improving: hy.ui.success.fg,
                  stable: hy.fg.muted,
                  worsening: hy.ui.danger.fg,
                }
                const { fg: rFg, bg: rBg } = riskMap[cp.risk] ?? hy.ui.neutral
                return (
                  <TableRow key={cp.name} isLast={i === counterpartyData.length - 1}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: hy.radius.md, background: hy.bg.component, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: hy.fg.subtle, flexShrink: 0 }}>
                          {cp.name.split(' ').map((w) => w[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 500 }}>{cp.name}</span>
                      </div>
                    </Td>
                    <Td isMuted>{cp.contracts}</Td>
                    <Td isMuted>{cp.avgDays}d avg</Td>
                    <Td><AcceptBar rate={cp.acceptRate} /></Td>
                    <Td><Chip label={cp.risk} fg={rFg} bg={rBg} /></Td>
                    <Td>
                      <span style={{ fontSize: 12, fontWeight: 500, color: trendColorMap[cp.trend] ?? hy.fg.muted }}>
                        {cp.trend.charAt(0).toUpperCase() + cp.trend.slice(1)}
                      </span>
                    </Td>
                    <Td isMuted>{cp.topClause}</Td>
                  </TableRow>
                )
              })}
            </tbody>
          </TableWrapper>
        </>
      )}
    </>
  )
}

// ── Key Dates ─────────────────────────────────────────────────────────────────

const keyDateTypeColor: Record<KeyDateType, { fg: string; bg: string }> = {
  'Opt-out': hy.ui.gold,
  'Renewal': hy.ui.blue,
  'Payment': hy.ui.olive,
  'Compliance': hy.ui.warning,
  'Reporting': hy.ui.violet,
  'Milestone': hy.ui.neutral,
}

const counterpartyTypeColor: Record<string, { fg: string; bg: string }> = {
  Client: hy.ui.success,
  Vendor: hy.ui.blue,
  Partner: hy.ui.olive,
  Regulator: hy.ui.violet,
}

function urgencyLabel(daysLeft: number): { label: string; color: { fg: string; bg: string }; borderColor: string } {
  if (daysLeft < 0) return { label: "Overdue", color: hy.ui.danger, borderColor: hy.ui.danger.fg }
  if (daysLeft === 0) return { label: "Due today", color: hy.ui.gold, borderColor: hy.ui.gold.fg }
  if (daysLeft <= 7) return { label: "This week", color: hy.ui.warning, borderColor: hy.ui.warning.fg }
  if (daysLeft <= 30) return { label: "This month", color: hy.ui.blue, borderColor: hy.ui.blue.fg }
  if (daysLeft <= 90) return { label: "This quarter", color: hy.ui.neutral, borderColor: hy.border.base }
  return { label: "Later", color: hy.ui.neutral, borderColor: hy.border.base }
}

function KeyDateCard({ date, isExpanded, onToggle }: { date: KeyDateRow; isExpanded: boolean; onToggle: () => void }) {
  const typeColor = keyDateTypeColor[date.type]
  const cpColor = counterpartyTypeColor[date.counterpartyType] ?? hy.ui.neutral
  const urgency = urgencyLabel(date.daysLeft)
  const isUrgent = date.daysLeft <= 0
  const isToday = date.daysLeft === 0

  // Parse day/month from dueDate string for the visual date badge
  const dateParts = date.dueDate.split(' ')
  const dateMonth = dateParts[0] ?? ''
  const dateDay = dateParts[1]?.replace(',', '') ?? ''

  return (
    <div
      style={{
        borderRadius: hy.radius.lg,
        border: `1px solid ${isUrgent ? urgency.color.fg : hy.border.base}`,
        background: isUrgent ? `${urgency.color.bg}` : hy.bg.base,
        overflow: 'hidden',
      }}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="transition hover:bg-hy-bg-subtle focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
        style={{ width: '100%', display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 0, alignItems: 'stretch', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
      >
        {/* Date column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', background: isUrgent ? urgency.color.fg : hy.bg.component, borderRight: `1px solid ${isUrgent ? urgency.color.fg : hy.border.base}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: isUrgent ? `${urgency.color.bg}` : hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{dateMonth}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: isUrgent ? hy.bg.base : hy.fg.base, lineHeight: 1, margin: '2px 0' }}>{dateDay}</div>
          {isToday
            ? <div style={{ fontSize: 10, fontWeight: 700, color: hy.bg.base, textTransform: 'uppercase' as const }}>TODAY</div>
            : <div style={{ fontSize: 11, color: isUrgent ? `${urgency.color.bg}cc` : hy.fg.muted }}>{date.daysLeft}d left</div>
          }
        </div>

        {/* Main content */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' as const }}>
            <Chip label={date.type} fg={typeColor.fg} bg={isUrgent ? `${typeColor.fg}22` : typeColor.bg} />
            <SeverityChip severity={date.severity} />
            {date.autoRenew && (
              <Chip label={"Auto-renews"} fg={hy.ui.warning.fg} bg={isUrgent ? `${hy.ui.warning.fg}22` : hy.ui.warning.bg} />
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: isUrgent ? urgency.color.fg : hy.fg.base, marginBottom: 4 }}>{date.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={12} color={isUrgent ? urgency.color.fg : hy.fg.muted} />
              <span style={{ fontSize: 13, fontWeight: 500, color: isUrgent ? urgency.color.fg : hy.fg.base }}>{date.counterparty}</span>
              <Chip label={date.counterpartyType} fg={cpColor.fg} bg={isUrgent ? `${cpColor.fg}22` : cpColor.bg} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: isUrgent ? `${urgency.color.fg}99` : hy.fg.muted, background: isUrgent ? `${urgency.color.fg}22` : hy.bg.component, padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace' }}>{date.contractId}</span>
              <span style={{ fontSize: 12, color: isUrgent ? urgency.color.fg : hy.fg.subtle }}>{date.contractName}</span>
            </div>
            {date.value && (
              <span style={{ fontSize: 13, fontWeight: 600, color: isUrgent ? urgency.color.fg : hy.fg.base }}>{date.value}</span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
          {isExpanded
            ? <ChevronDown size={15} color={isUrgent ? urgency.color.fg : hy.fg.muted} />
            : <ChevronRight size={15} color={isUrgent ? urgency.color.fg : hy.fg.muted} />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${isUrgent ? urgency.color.fg : hy.border.base}`, background: hy.bg.subtle }}>
          {/* Clause text */}
          <div style={{ padding: '16px 20px 0 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>
              {"Contract language"}
            </div>
            <div style={{ borderLeft: `3px solid ${typeColor.fg}`, paddingLeft: 14, paddingTop: 8, paddingBottom: 8, background: hy.bg.base, borderRadius: `0 ${hy.radius.sm}px ${hy.radius.sm}px 0`, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.7, fontStyle: 'italic' }}>
                &ldquo;{date.clauseText}&rdquo;
              </div>
              <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 6 }}>
                {date.contractId} · {date.contractName}
              </div>
            </div>
          </div>

          {/* Harvey suggestion */}
          {date.harveySuggestion && (
            <div style={{ padding: '0 20px 16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: hy.radius.md, border: `1px solid ${isUrgent ? urgency.color.fg : hy.ui.blue.fg}`, background: isUrgent ? `${urgency.color.bg}` : hy.ui.blue.bg }}>
                <Zap size={15} color={isUrgent ? urgency.color.fg : hy.ui.blue.fg} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isUrgent ? urgency.color.fg : hy.ui.blue.fg, marginBottom: 4 }}>
                    {"Harvey's suggestion"}
                  </div>
                  <div style={{ fontSize: 13, color: isUrgent ? urgency.color.fg : hy.fg.base, lineHeight: 1.6 }}>
                    {date.harveySuggestion}
                  </div>
                </div>
                {date.harveyAction && (
                  <button
                    type="button"
                    className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                    style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: hy.radius.sm, border: `1px solid ${isUrgent ? urgency.color.fg : hy.ui.blue.fg}`, background: isUrgent ? urgency.color.fg : hy.ui.blue.fg, color: hy.bg.base, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                  >
                    {date.harveyAction}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type KeyDateTypeFilter = KeyDateType | 'All'

function KeyDatesTab({ dates }: { dates: KeyDateRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<KeyDateTypeFilter>('All')
  const [showOnlyCritical, setShowOnlyCritical] = useState(false)

  const filtered = dates
    .filter((d) => typeFilter === 'All' || d.type === typeFilter)
    .filter((d) => !showOnlyCritical || d.severity === 'critical')
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const criticalCount = dates.filter((d) => d.severity === 'critical').length
  const thisWeekCount = dates.filter((d) => d.daysLeft <= 7).length
  const optOutCount = dates.filter((d) => d.type === 'Opt-out').length
  const paymentCount = dates.filter((d) => d.type === 'Payment').length

  const groups: Array<{ label: string; color: { fg: string; bg: string }; items: KeyDateRow[]; borderColor: string }> = [
    { label: "Due today", color: hy.ui.danger, borderColor: hy.ui.danger.fg, items: filtered.filter((d) => d.daysLeft === 0) },
    { label: "This week", color: hy.ui.danger, borderColor: hy.ui.danger.fg, items: filtered.filter((d) => d.daysLeft >= 1 && d.daysLeft <= 7) },
    { label: "This month", color: hy.ui.warning, borderColor: hy.ui.warning.fg, items: filtered.filter((d) => d.daysLeft > 7 && d.daysLeft <= 30) },
    { label: "This quarter", color: hy.ui.blue, borderColor: hy.ui.blue.fg, items: filtered.filter((d) => d.daysLeft > 30 && d.daysLeft <= 90) },
    { label: "Beyond 90 days", color: hy.ui.neutral, borderColor: hy.border.base, items: filtered.filter((d) => d.daysLeft > 90) },
  ]

  const typeOptions: KeyDateTypeFilter[] = ['All', 'Opt-out', 'Renewal', 'Payment', 'Compliance', 'Reporting', 'Milestone']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: "Critical", value: criticalCount, sub: "require immediate action", color: hy.ui.danger, icon: <AlertTriangle size={15} color={hy.ui.danger.fg} /> },
          { label: "Due this week", value: thisWeekCount, sub: "deadlines in 7 days", color: hy.ui.warning, icon: <Clock size={15} color={hy.ui.warning.fg} /> },
          { label: "Opt-out deadlines", value: optOutCount, sub: "auto-renewal risk", color: hy.ui.gold, icon: <Calendar size={15} color={hy.ui.gold.fg} /> },
          { label: "Payments due", value: paymentCount, sub: "tracked obligations", color: hy.ui.olive, icon: <Send size={15} color={hy.ui.olive.fg} /> },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${value > 0 && color === hy.ui.danger ? color.fg : hy.border.base}`, background: value > 0 && color === hy.ui.danger ? color.bg : hy.bg.base }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>{icon}<span style={{ fontSize: 11, fontWeight: 500, color: hy.fg.muted }}>{label}</span></div>
            <div style={{ fontSize: 32, fontWeight: 700, color: value > 0 ? color.fg : hy.fg.base, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: hy.fg.muted, marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {typeOptions.map((t) => {
            const isActive = typeFilter === t
            const tColor = t !== 'All' ? keyDateTypeColor[t as KeyDateType] : null
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, padding: '5px 12px', borderRadius: 6, border: `1px solid ${isActive && tColor ? tColor.fg : isActive ? hy.fg.base : hy.border.base}`, background: isActive && tColor ? tColor.bg : isActive ? hy.bg.component : 'transparent', color: isActive && tColor ? tColor.fg : isActive ? hy.fg.base : hy.fg.subtle, cursor: 'pointer' }}
              >
                {t}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowOnlyCritical((v) => !v)}
          className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
          style={{ marginLeft: 'auto', fontSize: 12, fontWeight: showOnlyCritical ? 600 : 400, padding: '5px 12px', borderRadius: 6, border: `1px solid ${showOnlyCritical ? hy.ui.danger.fg : hy.border.base}`, background: showOnlyCritical ? hy.ui.danger.bg : 'transparent', color: showOnlyCritical ? hy.ui.danger.fg : hy.fg.subtle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <AlertTriangle size={12} />
          {"Critical only"}
        </button>
      </div>

      {/* Grouped timeline */}
      {groups.map((group) => {
        if (group.items.length === 0) return null
        return (
          <div key={group.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: group.color.fg }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: group.color.fg, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{group.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: group.color.fg, background: group.color.bg, padding: '1px 7px', borderRadius: 999 }}>{group.items.length}</span>
              </div>
              <div style={{ flex: 1, height: 1, background: `${group.color.fg}33` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((date) => (
                <KeyDateCard
                  key={date.id}
                  date={date}
                  isExpanded={expandedId === date.id}
                  onToggle={() => setExpandedId((prev) => (prev === date.id ? null : date.id))}
                />
              ))}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: hy.fg.muted, fontSize: 13 }}>
          {"No key dates match the current filters."}
        </div>
      )}
    </div>
  )
}

// ── At-Risk ───────────────────────────────────────────────────────────────────

function RiskScore({ score }: { score: number }) {
  const color =
    score >= 80 ? hy.ui.danger.fg : score >= 65 ? hy.ui.warning.fg : hy.ui.gold.fg
  const bg =
    score >= 80 ? hy.ui.danger.bg : score >= 65 ? hy.ui.warning.bg : hy.ui.gold.bg
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: bg,
        color,
        fontWeight: 700,
        fontSize: 15,
        flexShrink: 0,
      }}
    >
      {score}
    </div>
  )
}

function AtRiskTab({ contracts: riskContracts }: { contracts: AtRiskContract[] }) {
  return (
    <>
      <SectionHeader count={riskContracts.length} label={"at-risk contracts"} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {riskContracts.map((c) => (
          <div
            key={c.id}
            style={{
              background: hy.bg.base,
              border: `1px solid ${hy.border.base}`,
              borderRadius: hy.radius.md,
              padding: '16px 20px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <RiskScore score={c.riskScore} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 13, color: hy.fg.subtle }}>
                  {c.counterparty}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: hy.fg.muted,
                    background: hy.bg.component,
                    padding: '2px 6px',
                    borderRadius: hy.radius.xs,
                  }}
                >
                  {c.contractId}
                </span>
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: '0 0 0 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {c.issues.map((issue: string) => (
                  <li
                    key={issue}
                    style={{ fontSize: 12, color: hy.fg.subtle }}
                  >
                    {issue}
                  </li>
                ))}
              </ul>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: hy.fg.muted,
                }}
              >
                {"Last reviewed"}: {c.lastReviewed}
              </div>
            </div>
            <button
              type="button"
              className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: hy.ui.blue.fg,
                background: hy.ui.blue.bg,
                border: 'none',
                borderRadius: hy.radius.sm,
                padding: '6px 14px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {"Generate redlines"}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Team Effectiveness ────────────────────────────────────────────────────────

function TeamTab() {
  const m = teamEffectivenessMetrics
  const timeSaved = m.avgManualMinutes - m.avgReviewTimeMinutes
  const summaryCards = [
    {
      label: "AI review rate",
      value: `${m.aiReviewRate}%`,
      sub: "of reviews use AI assistance",
    },
    {
      label: "Avg. review time",
      value: `${m.avgReviewTimeMinutes}m`,
      sub: `vs. ${m.avgManualMinutes}m manual (${timeSaved}m saved)`,
    },
    {
      label: "Suggestions accepted",
      value: `${m.suggestionsAccepted}%`,
      sub: "acceptance rate this month",
    },
    {
      label: "Reviews this month",
      value: m.reviewsThisMonth.toString(),
      sub: `${m.estimatedHoursSaved} estimated hours saved`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {summaryCards.map((c) => (
          <div
            key={c.label}
            style={{
              background: hy.bg.base,
              border: `1px solid ${hy.border.base}`,
              borderRadius: hy.radius.md,
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: hy.fg.subtle,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: hy.fg.base,
                lineHeight: 1,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 6 }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Team member table */}
      <TableWrapper>
        <TableHeader
          cols={[
            "Team member",
            "Reviews",
            "Accept rate",
            "Avg. review time",
          ]}
        />
        <tbody>
          {teamMembers.map((member: { name: string; reviews: number; acceptanceRate: number; avgTimeMinutes: number }, i: number) => (
            <TableRow key={member.name} isLast={i === teamMembers.length - 1}>
              <Td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: hy.bg.component,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: hy.fg.subtle,
                      flexShrink: 0,
                    }}
                  >
                    {member.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </div>
                  <span style={{ fontWeight: 500 }}>{member.name}</span>
                </div>
              </Td>
              <Td isMuted>{member.reviews}</Td>
              <Td>
                <AcceptBar rate={member.acceptanceRate} />
              </Td>
              <Td isMuted>{member.avgTimeMinutes}m</Td>
            </TableRow>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  )
}

const CI_BASE = '/contract-intelligence'

const SECTION_LABELS: Record<ActiveTab, string> = {
  overview: 'Pipeline',
  contracts: 'Contracts',
  playbooks: 'Playbooks',
  clauses: 'Clause Library',
  // Hidden for Q2
  templates: 'Templates',
  'key-dates': 'Key Dates',
}

// ── Q2 Simple Pipeline View ──────────────────────────────────────────────────

const autoReviewedContracts = [
  { name: 'Bilateral NDA — Crest Ventures', type: 'NDA', source: 'Teams', submitter: 'Sarah Chen', time: '8 min ago' },
  { name: 'SaaS Subscription Renewal — Altair', type: 'SaaS', source: 'Email', submitter: 'Tom Brennan', time: '14 min ago' },
  { name: 'Vendor NDA — StellarPay', type: 'NDA', source: 'Teams', submitter: 'Lisa Park', time: '22 min ago' },
  { name: 'Staff Augmentation SOW — Vantage', type: 'SOW', source: 'Spaces', submitter: 'James Wu', time: '31 min ago' },
  { name: 'Data Processing Addendum — Meridian', type: 'DPA', source: 'Email', submitter: 'Michael Torres', time: '45 min ago' },
  { name: 'Software License Renewal — Corelight', type: 'License', source: 'Teams', submitter: 'Sarah Chen', time: '1h ago' },
  { name: 'Consulting Engagement Letter — BluePath', type: 'Consulting', source: 'Email', submitter: 'Anna Kowalski', time: '1h ago' },
  { name: 'Maintenance & Support Renewal — Meridian Tech', type: 'License', source: 'Spaces', submitter: 'Tom Brennan', time: '2h ago' },
]

const needsYourReview = [
  {
    name: 'Cloud Infrastructure Services Agreement',
    counterparty: 'Brightwater Capital',
    type: 'MSA',
    source: 'Email',
    submittedBy: 'Sarah Chen',
    dept: 'Procurement',
    issues: ['Liability cap missing — counterparty proposes uncapped', 'Auto-renewal with 90-day notice — our standard is 60-day', 'IP assignment scope too broad — includes derivative works'],
    harveyNote: 'Two high-risk deviations and one moderate. Liability cap and IP assignment need your attention — auto-renewal is likely negotiable.',
    score: 74,
    time: '2h ago',
    playbook: 'Enterprise MSA Playbook v2.1',
  },
  {
    name: 'EU Data Privacy & Transfer Addendum',
    counterparty: 'Nexus Analytics',
    type: 'DPA',
    source: 'Teams',
    submittedBy: 'Michael Torres',
    dept: 'Legal',
    issues: ['No EU transfer mechanism specified', 'Subprocessor list absent — GDPR Art. 28 violation risk'],
    harveyNote: 'Missing transfer mechanism is a compliance blocker. Subprocessor omission could delay execution.',
    score: 81,
    time: '5h ago',
    playbook: 'Data Processing Agreement Playbook v1.3',
  },
  {
    name: 'Enterprise SaaS Subscription & License',
    counterparty: 'Orbis Financial',
    type: 'SaaS',
    source: 'Spaces',
    submittedBy: 'Tom Brennan',
    dept: 'IT',
    issues: ['Warranty disclaimer missing — standard requires 12-month warranty', 'Audit rights — 15-day notice vs. our 30-day standard'],
    harveyNote: 'Two moderate deviations. Warranty and audit rights can likely be resolved in one redline exchange.',
    score: 68,
    time: '1d ago',
    playbook: 'SaaS Vendor Agreement Playbook v3.0',
  },
]

/* ── Agent helpers ──────────────────────────────────────────────────────── */

function useAnimatedSteps(steps: string[], running: boolean) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!running) { setCurrentStep(0); setDone(false); return }
    if (currentStep >= steps.length) { setDone(true); return }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 1200)
    return () => clearTimeout(timer)
  }, [running, currentStep, steps.length])
  return { currentStep, done }
}

const MODEL_COLORS: Record<string, { c: string; b: string }> = {
  opus: { c: '#7C3AED', b: '#F3E8FF' },
  sonnet: { c: hy.ui.blue.fg, b: hy.ui.blue.bg },
  haiku: { c: hy.ui.success.fg, b: hy.ui.success.bg },
}

function SkillsPanel({ title, skills, onClose }: { title: string; skills: { name: string; source: string; model: string; desc: string; preview: string }[]; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const modelCounts = skills.reduce<Record<string, number>>((acc, sk) => { acc[sk.model] = (acc[sk.model] || 0) + 1; return acc }, {})

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: hy.bg.base, borderLeft: `1px solid ${hy.border.base}`, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${hy.border.base}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color={hy.fg.muted} /></button>
        </div>
        <div style={{ fontSize: 11, color: hy.fg.muted }}>
          {skills.length} skills{modelCounts.haiku ? ` · ${modelCounts.haiku} Haiku` : ''}{modelCounts.sonnet ? ` · ${modelCounts.sonnet} Sonnet` : ''}{modelCounts.opus ? ` · ${modelCounts.opus} Opus` : ''}
        </div>
      </div>
      <div style={{ padding: '12px 20px', fontSize: 11, color: hy.fg.muted, lineHeight: 1.5, borderBottom: `1px solid ${hy.border.base}` }}>
        Each skill is a set of instructions that controls a subagent's behavior. Skills run as parallel subagents — cheap models (Haiku) handle classification, expensive models (Opus) handle reasoning. Edit instructions directly to change how the agent works.
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {skills.map((sk, i) => {
          const isOpen = expanded === i
          const mc = MODEL_COLORS[sk.model] || MODEL_COLORS.haiku
          return (
            <div key={sk.name} style={{ marginBottom: 10, padding: '12px 14px', borderRadius: hy.radius.md, border: `1px solid ${isOpen ? mc.c + '40' : hy.border.base}`, background: isOpen ? mc.b : hy.bg.subtle, transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{sk.name}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, padding: '2px 6px', borderRadius: 8, color: mc.c, background: mc.b, border: `1px solid ${mc.c}30`, letterSpacing: '0.04em' }}>{sk.model}</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: hy.bg.component, color: hy.fg.muted }}>{sk.source}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.5, marginBottom: 8 }}>{sk.desc}</div>
              {isOpen && (
                <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, color: hy.fg.base, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '10px 12px', whiteSpace: 'pre-wrap' as const, marginBottom: 8 }}>{sk.preview}</div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setExpanded(isOpen ? null : i)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: hy.radius.xs, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.subtle, cursor: 'pointer' }}>{isOpen ? 'Hide instructions' : 'View instructions'}</button>
                <button type="button" style={{ fontSize: 11, padding: '3px 10px', borderRadius: hy.radius.xs, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.subtle, cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${hy.border.base}` }}>
        <button type="button" style={{ width: '100%', padding: 8, borderRadius: hy.radius.sm, border: `1px dashed ${hy.border.base}`, background: hy.bg.subtle, fontSize: 12, color: hy.fg.muted, cursor: 'pointer' }}>+ Add custom skill</button>
      </div>
    </div>
  )
}

function AgentStepProgress({ steps, currentStep, done }: { steps: string[]; currentStep: number; done: boolean }) {
  return (
    <div style={{ marginTop: 8 }}>
      {steps.map((step, i) => {
        const isActive = i === currentStep && !done
        const isComplete = i < currentStep || done
        const isPending = i > currentStep && !done
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', opacity: isPending ? 0.4 : 1 }}>
            {isComplete && <CheckCircle size={13} color={hy.ui.success.fg} />}
            {isActive && <Loader size={13} color={hy.ui.blue.fg} className="animate-spin" />}
            {isPending && <Clock size={13} color={hy.fg.muted} />}
            <span style={{ fontSize: 12, color: isComplete ? hy.ui.success.fg : isActive ? hy.ui.blue.fg : hy.fg.muted, fontWeight: isActive ? 600 : 400 }}>{step}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Review agent data ─────────────────────────────────────────────────── */

const REVIEW_ISSUES: Record<number, Array<{ id: string; clause: string; severity: 'high' | 'medium' | 'low'; summary: string; playbookRule: string; recommendation: string; suggestedLanguage: string; priorContext?: string }>> = {
  0: [
    { id: '0-1', clause: 'Limitation of Liability', severity: 'high', summary: 'Uncapped liability \u2014 counterparty proposes no aggregate cap on direct damages.', playbookRule: 'Enterprise MSA Playbook v2.1, Rule 4.2: Aggregate liability must be capped at no more than 2x total annual fees paid under the agreement. Uncapped liability is an unacceptable position.', recommendation: 'Reject and counter with standard 2x annual fees cap. Brightwater accepted a similar cap in their most recent renewal \u2014 use that as leverage.', suggestedLanguage: '\u201CThe aggregate liability of either party under this Agreement shall not exceed two (2) times the total annual fees paid or payable by Customer in the twelve (12) months preceding the claim.\u201D', priorContext: 'Brightwater accepted 1.5x cap in 2024 MSA renewal after one round of negotiation.' },
    { id: '0-2', clause: 'Auto-Renewal Notice Period', severity: 'medium', summary: 'Auto-renewal requires 90-day notice to opt out \u2014 our standard is 60 days.', playbookRule: 'Enterprise MSA Playbook v2.1, Rule 9.1: Opt-out notice period should be 60 days. Periods up to 90 days are acceptable deviations if other terms are favorable.', recommendation: 'Accept as reasonable deviation. The 90-day window is within the acceptable range and Brightwater\u2019s other terms are favorable overall.', suggestedLanguage: 'No change required. Current language: \u201CEither party may elect not to renew by providing written notice at least ninety (90) days prior to the end of the then-current term.\u201D' },
    { id: '0-3', clause: 'IP Assignment Scope', severity: 'high', summary: 'IP assignment includes \u201Cderivative works\u201D \u2014 scope is overly broad and could capture customer configurations.', playbookRule: 'Enterprise MSA Playbook v2.1, Rule 6.1: Vendor retains IP in its platform only. Customer retains all IP in its data, configurations, and content. Broad assignments covering \u201Cderivative works\u201D are unacceptable.', recommendation: 'Narrow scope to vendor platform IP only. Remove \u201Cderivative works\u201D from the assignment clause and explicitly carve out customer-created configurations.', suggestedLanguage: '\u201CVendor retains all intellectual property rights in the Vendor Platform. Customer retains all intellectual property rights in Customer Data, Customer configurations, and any content created by or on behalf of Customer. For the avoidance of doubt, no assignment of derivative works is granted under this Agreement.\u201D' },
  ],
  1: [
    { id: '1-1', clause: 'EU Transfer Mechanism', severity: 'high', summary: 'No Standard Contractual Clauses (SCCs) or adequacy decision referenced for EU data transfers.', playbookRule: 'Data Processing Agreement Playbook v1.3, Rule 2.1: All cross-border data transfers from the EU must reference an approved transfer mechanism \u2014 either EU SCCs (Module 2 or 3) or a relevant adequacy decision. Absence is a compliance blocker.', recommendation: 'This is a hard blocker. Require Nexus Analytics to incorporate EU SCCs (Module 2, Controller-to-Processor) as an exhibit before execution.', suggestedLanguage: '\u201CFor transfers of Personal Data from the European Economic Area to any country not subject to an adequacy decision, the parties shall enter into the Standard Contractual Clauses (Module 2: Controller to Processor) as set forth in Exhibit A.\u201D' },
    { id: '1-2', clause: 'Subprocessor Disclosure', severity: 'high', summary: 'No subprocessor list provided \u2014 GDPR Article 28 requires prior disclosure of all subprocessors.', playbookRule: 'Data Processing Agreement Playbook v1.3, Rule 3.4: Processor must provide a complete list of subprocessors as an exhibit. Controller must have the right to object to new subprocessors within 30 days.', recommendation: 'Require Nexus Analytics to attach a subprocessor list as Exhibit B, including entity name, location, and processing purpose. Add a 30-day objection right for new subprocessors.', suggestedLanguage: '\u201CProcessor shall maintain and make available to Controller a current list of all Subprocessors (Exhibit B), including entity name, jurisdiction, and nature of processing. Processor shall notify Controller at least thirty (30) days prior to engaging any new Subprocessor, and Controller shall have the right to object.\u201D' },
  ],
  2: [
    { id: '2-1', clause: 'Warranty Disclaimer', severity: 'medium', summary: 'Agreement disclaims all warranties \u2014 our playbook requires a minimum 12-month warranty on platform functionality.', playbookRule: 'SaaS Vendor Agreement Playbook v3.0, Rule 5.1: Vendor must warrant that the platform will perform materially in accordance with documentation for at least 12 months from the effective date.', recommendation: 'Counter with standard 12-month warranty clause. Orbis Financial has accepted similar warranty terms in prior SaaS agreements across the industry.', suggestedLanguage: '\u201CVendor warrants that the Platform will perform materially in accordance with the applicable Documentation for a period of twelve (12) months from the Effective Date. In the event of a breach of this warranty, Vendor shall, at its sole expense, correct the non-conforming functionality.\u201D' },
    { id: '2-2', clause: 'Audit Rights Notice Period', severity: 'low', summary: 'Audit rights require only 15 business days\u2019 notice \u2014 our standard is 30 days.', playbookRule: 'SaaS Vendor Agreement Playbook v3.0, Rule 8.3: Customer audit rights must include at least 30 days\u2019 written notice. Shorter periods are acceptable deviations if other audit terms are favorable.', recommendation: 'Accept as minor deviation. The 15-day notice period is shorter than standard but the audit scope and frequency terms are otherwise favorable.', suggestedLanguage: 'No change required. Current language: \u201CCustomer may audit Vendor\u2019s records and systems upon fifteen (15) business days\u2019 prior written notice, no more than once per calendar year.\u201D' },
  ],
}

const CONTRACT_REVIEW_SKILLS = [
  { name: 'Playbook Review Algo', source: 'Internal', model: 'sonnet', desc: 'Compare clause vs playbook \u2192 accept / flag / reject', preview: 'For each clause in the incoming contract:\n1. Match to the corresponding playbook rule\n2. Compare against Standard position \u2014 if match, ACCEPT\n3. Check against Acceptable deviations \u2014 if match, ACCEPT WITH NOTE\n4. Check against Unacceptable positions \u2014 if match, FLAG\n5. If no match found, ESCALATE for manual review\n\nOutput per-clause verdict with confidence score and supporting rationale.' },
  { name: 'Clause Library Lookup', source: 'Corpus', model: 'haiku', desc: 'Preferred language for this clause type', preview: 'Query the org-wide clause library for this clause type.\n\nReturn:\n- Standard (preferred) language text\n- Fallback language if available\n- Acceptance rate for each variant\n- Most recent usage date\n\nUsed by the review agent to suggest replacement language when flagging a clause.' },
  { name: 'Prior Agreement Comparison', source: 'Corpus', model: 'sonnet', desc: 'How have we handled this before?', preview: 'Search executed contracts for prior agreements with the same counterparty or similar clause language.\n\nReturn:\n- Up to 5 most relevant prior agreements\n- How this clause was resolved in each (accepted/modified/rejected)\n- The final agreed language\n- Any escalation notes from prior reviews\n\nHelps the reviewer understand precedent before deciding.' },
  { name: 'Cross-Clause Consistency', source: 'Internal', model: 'sonnet', desc: 'Detect conflicts between related clauses', preview: 'Check for internal consistency across related clause pairs:\n- Indemnity cap vs Liability cap (should be aligned)\n- Governing law vs Dispute resolution (jurisdiction match)\n- Confidentiality vs Data privacy (no gaps)\n- Termination vs Auto-renewal (no contradictions)\n- IP assignment vs License grant (no conflicts)\n\nFlag any inconsistencies with severity and suggested resolution.' },
  { name: 'Structure Parser', source: 'Internal', model: 'haiku', desc: 'Extract key terms, clause types, doc structure', preview: 'Parse the incoming contract document:\n1. Identify all parties and their roles\n2. Extract defined terms and their definitions\n3. Map document structure (sections, subsections, schedules)\n4. Classify each section by clause type\n5. Extract key commercial terms (dates, amounts, thresholds)\n\nOutput structured JSON for downstream agents.' },
  { name: 'Redline Generator', source: 'Internal', model: 'opus', desc: 'Track-changes from playbook + clause library', preview: 'Generate a complete redlined version of the contract.\n\nFor each flagged clause:\n1. Retrieve preferred language from clause library\n2. Apply playbook guidance for this clause type\n3. Generate tracked-changes markup (deletions in red, insertions in blue)\n4. Add margin comments explaining each change\n5. Reference the playbook rule that triggered the change\n\nOutput a .docx-compatible redline with all changes tracked.' },
  { name: 'Issues List Formatter', source: 'Internal', model: 'haiku', desc: 'Flagged items for counterparty discussion', preview: 'Compile all flagged items into a structured issues list.\n\nFor each issue:\n- Issue number and clause reference\n- Current language (counterparty\'s position)\n- Our position (from playbook)\n- Suggested compromise (if applicable)\n- Priority: MUST RESOLVE / SHOULD DISCUSS / NICE TO HAVE\n\nSort by priority. Format as a clean table for counterparty discussion.' },
  { name: 'Review Summary Writer', source: 'Internal', model: 'sonnet', desc: 'Risk posture, deviations, escalations', preview: 'Write an executive summary of the contract review.\n\nInclude:\n- Overall risk assessment (Low / Medium / High) with reasoning\n- Number of clauses reviewed vs flagged vs accepted\n- Key deviations from playbook with business impact\n- Recommended escalations (if any) with urgency\n- Comparison to org-wide norms for this contract type\n\nKeep to 200 words max. Write for a senior lawyer audience.' },
]

const REVIEW_AGENT_STEPS = [
  'Parsing document structure and extracting parties\u2026',
  'Classifying contract type: SaaS Vendor Agreement\u2026',
  'Matching to playbook: SaaS Vendor Agreement Playbook v3.0\u2026',
  'Reviewing 14 clauses against playbook positions\u2026',
  'Checking clause library for preferred language\u2026',
  'Searching prior agreements with Apex Dynamics\u2026',
  'Running cross-clause consistency checks\u2026',
  'Generating redline with tracked changes\u2026',
  'Compiling issues list and review summary\u2026',
  'Done \u2014 review ready.',
]

/* ── Pipeline / Review view ────────────────────────────────────────────── */

function SimplePipelineView() {
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [editAgent, setEditAgent] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoComplete, setDemoComplete] = useState(false)
  const [reviewContract, setReviewContract] = useState<number | null>(null)
  const [issueActions, setIssueActions] = useState<Record<string, 'accept' | 'override' | 'negotiate'>>({})
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({})
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [outputTab, setOutputTab] = useState<'issues' | 'redline' | 'summary'>('issues')
  const demoAnim = useAnimatedSteps(REVIEW_AGENT_STEPS, demoRunning)

  // When the animated steps finish, mark demo as complete
  useEffect(() => {
    if (demoAnim.done && demoRunning) {
      const t = setTimeout(() => { setDemoRunning(false); setDemoComplete(true) }, 800)
      return () => clearTimeout(t)
    }
  }, [demoAnim.done, demoRunning])

  if (editAgent) {
    const CHECKLIST_ITEMS = [
      { id: 'type', label: 'Detect contract type', desc: 'Classify as NDA, MSA, DPA, SOW, License, etc. and select the right playbook', editable: false },
      { id: 'playbook', label: 'Match clauses to playbook', desc: 'Compare each clause against your org’s standard, acceptable, and unacceptable positions', editable: true },
      { id: 'clause_lib', label: 'Check clause library', desc: 'Look up preferred language for each clause type and suggest replacements when deviating', editable: true },
      { id: 'prior', label: 'Compare prior agreements', desc: 'Search last 12 months of executed contracts with this counterparty for precedent', editable: true },
      { id: 'cross', label: 'Cross-clause consistency', desc: 'Flag conflicts between related clauses (e.g. indemnity cap vs liability cap, governing law vs dispute resolution)', editable: true },
      { id: 'redline', label: 'Generate redline', desc: 'Produce a tracked-changes .docx with margin comments referencing the playbook rule', editable: false },
      { id: 'issues', label: 'Create issues list', desc: 'Compile flagged items into a prioritized list for counterparty discussion', editable: false },
      { id: 'summary', label: 'Write review summary', desc: 'Executive summary with risk assessment, key deviations, and recommended escalations', editable: false },
    ]

    const LEARNING_LOG = [
      { date: 'Mar 21', type: 'pattern', agent: 'Playbook Maintenance', desc: 'Kirkland & Ellis always pushes back on standard non-solicitation — agent now auto-suggests Fallback B for Kirkland deals.' },
      { date: 'Mar 19', type: 'threshold', agent: 'Playbook Maintenance', desc: 'Liability cap threshold lowered from 2x to 1.5x annual fees — 3 counterparties rejected the current cap in the last 30 days.' },
      { date: 'Mar 15', type: 'new_variant', agent: 'Clause Library Maintenance', desc: 'New AI-specific data processing language detected across 4 recent DPAs. Added as Fallback variant for Data Privacy clause.' },
      { date: 'Mar 12', type: 'pattern', agent: 'Clause Library Maintenance', desc: 'PE deal NDAs increasingly use carve-out language for non-solicitation. PE-specific variant now ranked #2 in library.' },
      { date: 'Mar 8', type: 'accuracy', agent: 'Playbook Maintenance', desc: 'Enterprise MSA playbook accuracy dropped from 78% to 62% — flagged 3 rules for review. DORA compliance clauses were the primary driver.' },
      { date: 'Mar 1', type: 'scheduled', agent: 'Both', desc: 'Monthly maintenance run completed. Playbook agent: 3 rules flagged across 4 playbooks. Clause library agent: 4 new variants detected, 2 tier re-rankings.' },
    ]

    const logTypeColors: Record<string, { fg: string; bg: string; label: string }> = {
      pattern: { fg: hy.ui.blue.fg, bg: hy.ui.blue.bg, label: 'Pattern' },
      threshold: { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: 'Threshold' },
      new_variant: { fg: hy.ui.success.fg, bg: hy.ui.success.bg, label: 'New variant' },
      accuracy: { fg: hy.ui.danger.fg, bg: hy.ui.danger.bg, label: 'Accuracy' },
      scheduled: { fg: hy.fg.muted, bg: hy.bg.component, label: 'Scheduled' },
    }

    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => setEditAgent(false)}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ fontSize: 13, color: hy.fg.subtle, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            &#8592; Back to Review
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: hy.fg.base }}>Edit Contract Review Agent</span>
        </div>

        {/* Agent Configuration — single row */}
        <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: '14px 20px', background: hy.bg.base, marginBottom: 20, display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 3 }}>Triggers</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>ask@harvey.ai (Email), Synced folders (Spaces, Teams), Manual upload</div>
          </div>
          <div style={{ width: 1, background: hy.border.base, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 3 }}>Output Format</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>Redline .docx + Issues list + Review summary</div>
          </div>
        </div>

        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left column: What this agent checks */}
          <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: 20, background: hy.bg.base }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: hy.fg.base }}>What this agent checks</div>
              <span style={{ fontSize: 11, color: hy.ui.success.fg, fontWeight: 600 }}>{CHECKLIST_ITEMS.length}/{CHECKLIST_ITEMS.length} active</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {CHECKLIST_ITEMS.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 0',
                    borderBottom: i < CHECKLIST_ITEMS.length - 1 ? `1px solid ${hy.border.base}` : 'none',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: hy.ui.success.fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <CheckCircle size={12} color="#fff" strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                  {item.editable && (
                    <button
                      type="button"
                      className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: hy.radius.xs, border: `1px solid ${hy.border.base}`, background: hy.bg.base, color: hy.fg.subtle, cursor: 'pointer', flexShrink: 0, marginTop: 1 }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Agent learning log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: 20, background: hy.bg.base }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: hy.fg.base }}>Agent learning log</div>
                <span style={{ fontSize: 11, color: hy.fg.muted }}>{LEARNING_LOG.length} changes this month</span>
              </div>
              <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 14, lineHeight: 1.5 }}>
                Changes proposed by maintenance agents based on your executed contracts. All changes require admin approval before taking effect.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {LEARNING_LOG.map((entry, i) => {
                  const tc = logTypeColors[entry.type] || logTypeColors.scheduled
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '10px 0',
                        borderBottom: i < LEARNING_LOG.length - 1 ? `1px solid ${hy.border.base}` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: hy.fg.muted, fontWeight: 500, minWidth: 44 }}>{entry.date}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 8, color: tc.fg, background: tc.bg }}>{tc.label}</span>
                        <span style={{ fontSize: 10, color: hy.fg.muted, marginLeft: 'auto' }}>{entry.agent}</span>
                      </div>
                      <div style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5, paddingLeft: 50 }}>{entry.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* How skills work */}
            <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: '16px 20px', background: hy.bg.subtle }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, marginBottom: 6 }}>How skills work</div>
              <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.6 }}>
                Each checklist item above is powered by a skill — a set of instructions that tells the agent exactly what to do. The learning log shows when maintenance agents propose skill changes based on your real contract data. Power users can view and edit the raw instructions via the Skills panel on the agent banner.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Full-screen contract review detail view ──
  if (reviewContract !== null) {
    const rc = needsYourReview[reviewContract]
    const issues = REVIEW_ISSUES[reviewContract] || []
    const resolvedCount = issues.filter((iss) => issueActions[iss.id]).length
    const allResolved = resolvedCount === issues.length && issues.length > 0
    const scoreColor = rc.score >= 75 ? hy.ui.success.fg : rc.score >= 60 ? hy.ui.gold.fg : hy.ui.warning.fg

    const sevColor = (s: string) =>
      s === 'high' ? { fg: hy.ui.danger.fg, bg: hy.ui.danger.bg } :
      s === 'medium' ? { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg } :
      { fg: hy.ui.blue.fg, bg: hy.ui.blue.bg }

    const actionBorderColor = (id: string) => {
      const a = issueActions[id]
      if (a === 'accept') return hy.ui.success.fg
      if (a === 'override') return hy.ui.blue.fg
      if (a === 'negotiate') return hy.ui.gold.fg
      return hy.border.base
    }

    const tabs: Array<{ key: 'issues' | 'redline' | 'summary'; label: string }> = [
      { key: 'issues', label: 'Issues List' },
      { key: 'redline', label: 'Redline Preview' },
      { key: 'summary', label: 'Review Summary' },
    ]

    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => { setReviewContract(null); setIssueActions({}); setOverrideNotes({}); setExpandedIssue(null); setOutputTab('issues') }}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{ fontSize: 12, color: hy.fg.subtle, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12, padding: 0 }}
          >
            <ChevronLeft size={14} /> Back to pipeline
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: hy.fg.base }}>{rc.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: hy.ui.neutral.bg, color: hy.fg.subtle }}>{rc.type}</span>
          </div>
          <div style={{ fontSize: 12, color: hy.fg.muted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{rc.counterparty}</span>
            <span style={{ opacity: 0.4 }}>&middot;</span>
            <span>Submitted by {rc.submittedBy} ({rc.dept})</span>
            <span style={{ opacity: 0.4 }}>&middot;</span>
            <span>{rc.time}</span>
            <span style={{ opacity: 0.4 }}>&middot;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: hy.ui.blue.fg }}>
              <BookOpen size={10} /> {rc.playbook}
            </span>
            <span style={{ opacity: 0.4 }}>&middot;</span>
            <span>Score: <strong style={{ color: scoreColor }}>{rc.score}</strong></span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${hy.border.base}`, marginBottom: 20 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setOutputTab(tab.key)}
              className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
              style={{
                fontSize: 13, fontWeight: outputTab === tab.key ? 600 : 400, color: outputTab === tab.key ? hy.fg.base : hy.fg.muted,
                background: 'none', border: 'none', borderBottom: outputTab === tab.key ? `2px solid ${hy.fg.base}` : '2px solid transparent',
                padding: '10px 20px', cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Issues List tab ── */}
        {outputTab === 'issues' && (
          <div>
            {/* Progress bar */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: hy.bg.component, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: hy.ui.success.fg, width: `${issues.length > 0 ? (resolvedCount / issues.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: allResolved ? hy.ui.success.fg : hy.fg.subtle, flexShrink: 0 }}>
                {resolvedCount}/{issues.length} resolved
              </span>
            </div>

            {/* Issue cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {issues.map((issue) => {
                const sc = sevColor(issue.severity)
                const isExpanded = expandedIssue === issue.id
                const action = issueActions[issue.id]
                const borderColor = actionBorderColor(issue.id)

                return (
                  <div key={issue.id} style={{ border: `1px solid ${borderColor}`, borderRadius: hy.radius.md, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    {/* Collapsed header */}
                    <button
                      type="button"
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                      className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                      style={{
                        width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                        background: action ? (action === 'accept' ? hy.ui.success.bg : action === 'override' ? hy.ui.blue.bg : hy.ui.gold.bg) : hy.bg.subtle,
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: sc.bg, color: sc.fg, textTransform: 'uppercase' as const, flexShrink: 0 }}>
                        {issue.severity}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, flex: 1 }}>{issue.clause}</span>
                      {action && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: action === 'accept' ? hy.ui.success.fg : action === 'override' ? hy.ui.blue.fg : hy.ui.gold.fg, background: hy.bg.base }}>
                          {action === 'accept' ? 'Accepted' : action === 'override' ? 'Overridden' : 'Negotiate'}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: hy.fg.muted, flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{issue.summary}</span>
                      <ChevronRight size={14} color={hy.fg.muted} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: hy.bg.base }}>
                        {/* Playbook rule */}
                        <div style={{ padding: '10px 14px', borderRadius: hy.radius.sm, background: hy.bg.subtle, border: `1px solid ${hy.border.base}` }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, marginBottom: 4, letterSpacing: '0.04em' }}>
                            Source of truth &middot; Admin managed
                          </div>
                          <div style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.6 }}>{issue.playbookRule}</div>
                        </div>

                        {/* Harvey\u2019s recommendation */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.base, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Bot size={12} color={hy.ui.blue.fg} /> Harvey\u2019s Recommendation
                          </div>
                          <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.6 }}>{issue.recommendation}</div>
                        </div>

                        {/* Suggested replacement language */}
                        <div style={{ padding: '10px 14px', borderRadius: hy.radius.sm, background: hy.ui.success.bg }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: hy.ui.success.fg, textTransform: 'uppercase' as const, marginBottom: 4 }}>Suggested Language</div>
                          <div style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.6, fontStyle: 'italic' }}>{issue.suggestedLanguage}</div>
                        </div>

                        {/* Prior context */}
                        {issue.priorContext && (
                          <div style={{ fontSize: 11, color: hy.ui.blue.fg, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                            <Clock size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span>{issue.priorContext}</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setIssueActions((prev) => ({ ...prev, [issue.id]: 'accept' }))}
                            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                            style={{
                              fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: hy.radius.sm, cursor: 'pointer',
                              background: action === 'accept' ? hy.ui.success.fg : hy.ui.success.bg, color: action === 'accept' ? '#fff' : hy.ui.success.fg,
                              border: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}
                          >
                            <CheckCircle size={12} /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => setIssueActions((prev) => ({ ...prev, [issue.id]: 'override' }))}
                            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                            style={{
                              fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: hy.radius.sm, cursor: 'pointer',
                              background: action === 'override' ? hy.ui.blue.fg : hy.ui.blue.bg, color: action === 'override' ? '#fff' : hy.ui.blue.fg,
                              border: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}
                          >
                            <Edit3 size={12} /> Override
                          </button>
                          <button
                            type="button"
                            onClick={() => setIssueActions((prev) => ({ ...prev, [issue.id]: 'negotiate' }))}
                            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                            style={{
                              fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: hy.radius.sm, cursor: 'pointer',
                              background: action === 'negotiate' ? hy.ui.gold.fg : hy.ui.gold.bg, color: action === 'negotiate' ? '#fff' : hy.ui.gold.fg,
                              border: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}
                          >
                            <AlertTriangle size={12} /> Negotiate
                          </button>
                        </div>

                        {/* Override textarea */}
                        {action === 'override' && (
                          <div>
                            <textarea
                              placeholder="Enter override rationale\u2026"
                              value={overrideNotes[issue.id] || ''}
                              onChange={(e) => setOverrideNotes((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                              style={{
                                width: '100%', minHeight: 60, padding: '8px 12px', fontSize: 12, lineHeight: 1.5,
                                borderRadius: hy.radius.sm, border: `1px solid ${hy.border.strong}`, background: hy.bg.base,
                                color: hy.fg.base, resize: 'vertical', fontFamily: 'inherit',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Generate Final Redline button */}
            {allResolved && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  type="button"
                  className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                  style={{
                    fontSize: 14, fontWeight: 700, padding: '12px 32px', borderRadius: hy.radius.sm, cursor: 'pointer',
                    background: hy.fg.base, color: hy.bg.base, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <FileText size={14} /> Generate Final Redline
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Redline Preview tab ── */}
        {outputTab === 'redline' && (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: hy.radius.sm, background: hy.fg.base, color: hy.bg.base, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <FileText size={11} /> Download .docx
              </button>
              <button
                type="button"
                className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
                style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: hy.radius.sm, background: hy.bg.base, color: hy.fg.base, border: `1px solid ${hy.border.base}`, cursor: 'pointer' }}
              >
                Copy
              </button>
            </div>

            {/* Simulated document */}
            <div style={{
              border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, background: hy.bg.base,
              padding: '40px 60px', maxWidth: 720, fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 13, lineHeight: 1.8, color: hy.fg.base,
            }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{rc.name}</div>
                <div style={{ fontSize: 12, color: hy.fg.muted }}>Between {rc.counterparty} and Harvey Inc. &middot; Tracked Changes Draft</div>
              </div>

              {/* Section 7.1 — Limitation of Liability */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>7.1 Limitation of Liability</div>
                <p style={{ margin: 0 }}>
                  The aggregate liability of either party arising out of or in connection with this Agreement shall{' '}
                  <span style={{ textDecoration: 'line-through', color: hy.ui.danger.fg, background: hy.ui.danger.bg }}>
                    not be limited and shall extend to all direct and consequential damages
                  </span>{' '}
                  <span style={{ color: hy.ui.success.fg, background: hy.ui.success.bg, fontWeight: 500 }}>
                    not exceed two (2) times the total annual fees paid or payable by Customer in the twelve (12) months preceding the claim
                  </span>
                  . Neither party shall be liable for any indirect, incidental, or punitive damages.
                </p>
                <div style={{ fontSize: 10, color: hy.fg.muted, fontStyle: 'italic', marginTop: 6, fontFamily: 'inherit' }}>
                  [Comment: Playbook Rule 4.2 — Liability must be capped at 2x annual fees]
                </div>
              </div>

              {/* Section 12.3 — Data Processing */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>12.3 Data Processing</div>
                <p style={{ margin: 0 }}>
                  The Processor shall process personal data only on documented instructions from the Controller, in accordance with applicable data protection law.{' '}
                  <span style={{ color: hy.ui.success.fg, background: hy.ui.success.bg, fontWeight: 500 }}>
                    The parties shall ensure compliance with the EU AI Act (Regulation (EU) 2024/1689) where AI systems are used in the processing of personal data under this Agreement. The Processor shall maintain a register of AI systems used in data processing and provide transparency reports upon request.
                  </span>
                </p>
                <div style={{ fontSize: 10, color: hy.fg.muted, fontStyle: 'italic', marginTop: 6, fontFamily: 'inherit' }}>
                  [Comment: Inserted AI Act compliance language per DPA Playbook Rule 2.3]
                </div>
              </div>

              {/* Section 15.2 — Termination */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>15.2 Termination for Convenience</div>
                <p style={{ margin: 0 }}>
                  Either party may terminate this Agreement for convenience upon sixty (60) days\u2019 prior written notice to the other party. Upon termination, all outstanding fees shall become immediately due and payable.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: hy.ui.success.fg, fontFamily: 'sans-serif' }}>
                  <CheckCircle size={12} /> Accepted \u2014 within playbook tolerance
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Review Summary tab ── */}
        {outputTab === 'summary' && (
          <div>
            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, padding: '16px 20px', background: hy.bg.base, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, marginBottom: 6 }}>Overall Risk</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: hy.ui.warning.fg }}>Medium</div>
              </div>
              <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, padding: '16px 20px', background: hy.bg.base, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, marginBottom: 6 }}>Issues Flagged</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: hy.fg.base }}>{issues.length}</div>
              </div>
              <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, padding: '16px 20px', background: hy.bg.base, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, marginBottom: 6 }}>Recommendation</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: hy.ui.success.fg }}>Proceed with redline</div>
              </div>
            </div>

            {/* Findings breakdown */}
            <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: 20, background: hy.bg.base, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base, marginBottom: 14 }}>Findings Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {issues.map((issue) => {
                  const sc = sevColor(issue.severity)
                  return (
                    <div key={issue.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${hy.border.base}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: sc.bg, color: sc.fg, textTransform: 'uppercase' as const, flexShrink: 0 }}>
                        {issue.severity}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, flexShrink: 0, minWidth: 160 }}>{issue.clause}</span>
                      <span style={{ fontSize: 12, color: hy.fg.subtle }}>{issue.summary}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Counterparty context */}
            <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: 20, background: hy.bg.subtle }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base, marginBottom: 6 }}>Counterparty Context</div>
              <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.6, marginBottom: 12 }}>
                Harvey found <strong>4 prior agreements</strong> with {rc.counterparty} in the last 24 months. Key patterns:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5 }}>
                  {rc.counterparty} typically accepts liability caps between 1.5x and 2x annual fees after one round of negotiation.
                </li>
                <li style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5 }}>
                  Prior DPA was executed with full subprocessor disclosure — they have an internal compliance team that can produce this quickly.
                </li>
                <li style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5 }}>
                  Average negotiation cycle with {rc.counterparty} is 8 business days (vs. org average of 14 days).
                </li>
                <li style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5 }}>
                  No escalations or disputes in prior agreements — considered a cooperative counterparty.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Contract Review Agent banner ── */}
      <div style={{
        marginBottom: 20,
        padding: '14px 20px',
        background: hy.ui.success.bg,
        border: `1px solid ${hy.ui.success.border}`,
        borderRadius: hy.radius.lg,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Zap size={16} color={hy.ui.success.fg} strokeWidth={1.8} />
        <span style={{ fontSize: 13, fontWeight: 600, color: hy.ui.success.fg }}>Contract Review Agent</span>
        <span style={{ fontSize: 11, color: hy.ui.success.fg, opacity: 0.8 }}>
          Triggered by ask@harvey.ai, synced folders, or upload &middot; Uses playbook + clause library + prior agreements
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setSkillsOpen((o) => !o)}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{
              fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: hy.radius.sm,
              background: 'rgba(255,255,255,0.6)', color: hy.ui.success.fg,
              border: `1px solid ${hy.ui.success.border}`, cursor: 'pointer',
            }}
          >
            Skills ({CONTRACT_REVIEW_SKILLS.length})
          </button>
          <button
            type="button"
            onClick={() => setEditAgent(true)}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{
              fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: hy.radius.sm,
              background: 'rgba(255,255,255,0.6)', color: hy.ui.success.fg,
              border: `1px solid ${hy.ui.success.border}`, cursor: 'pointer',
            }}
          >
            Edit Agent
          </button>
          <button
            type="button"
            onClick={() => { if (demoComplete) { setDemoComplete(false) } else { setDemoRunning(true) } }}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{
              fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: hy.radius.sm,
              background: demoRunning ? hy.ui.blue.fg : hy.ui.success.fg, color: hy.bg.base,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {demoRunning ? <><Loader size={11} className="animate-spin" /> Running&hellip;</> : demoComplete ? 'New Review' : <><Play size={11} /> Run Review</>}
          </button>
        </div>
      </div>

      {/* ── Demo: Contract Review Agent run ── */}
      {(demoRunning || demoComplete) && (() => {
        const demoContract = {
          name: 'SaaS Platform License Agreement — Apex Dynamics',
          file: 'Apex_Dynamics_SaaS_License_v2_redline.docx',
          type: 'SaaS Vendor Agreement',
          counterparty: 'Apex Dynamics Inc.',
          playbook: 'SaaS Vendor Agreement Playbook v3.0',
          clausesReviewed: 14,
          clausesFlagged: 5,
          clausesAccepted: 9,
        }
        const demoIssues = [
          {
            clause: 'Limitation of Liability',
            severity: 'high' as const,
            playbookRule: 'Cap at 2x annual fees; reject uncapped liability',
            contractLanguage: 'Liability is limited to fees paid in the 6 months preceding the claim.',
            agentVerdict: 'FLAGGED — Cap is 0.5x, below our 2x minimum. This is significantly below market.',
            suggestedRedline: 'Replace with: "aggregate liability shall not exceed two (2) times the annual fees paid under this Agreement."',
            priorAgreement: 'Last deal with Apex (2024): settled at 1.5x after one round of negotiation.',
          },
          {
            clause: 'Data Privacy & Processing',
            severity: 'high' as const,
            playbookRule: 'Require DPA as exhibit; must include sub-processor list and breach notification <72hrs',
            contractLanguage: 'Vendor shall process data in accordance with applicable law. No separate DPA referenced.',
            agentVerdict: 'FLAGGED — No DPA exhibit attached. Missing sub-processor disclosure and breach notification SLA.',
            suggestedRedline: 'Insert new Section 8.1: "Data Processing Addendum. The parties shall execute the DPA attached as Exhibit C…"',
            priorAgreement: null,
          },
          {
            clause: 'Auto-Renewal & Termination',
            severity: 'medium' as const,
            playbookRule: 'Require 90-day opt-out notice; reject auto-renewal >1 year',
            contractLanguage: 'Agreement auto-renews for successive 2-year terms unless terminated with 30 days’ notice.',
            agentVerdict: 'FLAGGED — 2-year auto-renewal exceeds our 1-year max. 30-day notice window is too short (our standard: 90 days).',
            suggestedRedline: 'Reduce renewal term to 1 year; extend notice period to 90 days.',
            priorAgreement: 'Org standard: 94% of SaaS deals use 1-year renewal with 90-day notice.',
          },
          {
            clause: 'IP Ownership',
            severity: 'medium' as const,
            playbookRule: 'Customer retains all IP in its data; vendor retains platform IP; reject broad IP assignments',
            contractLanguage: 'All customizations, configurations, and derivative works created during the engagement shall be the property of Vendor.',
            agentVerdict: 'FLAGGED — "configurations and derivative works" is overly broad. Customer-created configurations should remain customer IP.',
            suggestedRedline: 'Narrow to: "Vendor retains IP in its platform. Customer retains IP in all data, configurations, and content created by Customer."',
            priorAgreement: null,
          },
          {
            clause: 'Indemnification',
            severity: 'low' as const,
            playbookRule: 'Mutual indemnification for third-party IP claims; vendor must indemnify for data breaches',
            contractLanguage: 'Vendor indemnifies Customer for third-party IP claims only. No data breach indemnification.',
            agentVerdict: 'FLAGGED — Missing vendor indemnification for data breaches. This is standard for SaaS agreements.',
            suggestedRedline: 'Add: "Vendor shall indemnify Customer against losses arising from any breach of Vendor’s data protection obligations."',
            priorAgreement: 'Apex agreed to data breach indemnification in the 2024 NDA. Likely acceptable here.',
          },
        ]
        const acceptedClauses = [
          'Governing Law (Delaware — matches standard)',
          'Payment Terms (Net 30 — matches standard)',
          'Confidentiality (Mutual, 3-year survival — matches standard)',
          'Representations & Warranties (Standard mutual reps)',
          'Force Majeure (Standard language)',
          'Assignment (Requires consent — matches standard)',
          'Notices (Email + registered mail — acceptable)',
          'Dispute Resolution (Arbitration, AAA rules — acceptable deviation)',
          'Audit Rights (Annual, 30-day notice — matches standard)',
        ]
        const riskScore = 62
        const riskColor = riskScore >= 80 ? hy.ui.success.fg : riskScore >= 60 ? hy.ui.gold.fg : hy.ui.warning.fg

        const sevColor = (s: string) =>
          s === 'high' ? { fg: hy.ui.danger.fg, bg: hy.ui.danger.bg } :
          s === 'medium' ? { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg } :
          { fg: hy.ui.blue.fg, bg: hy.ui.blue.bg }

        return (
          <div style={{ marginBottom: 24, borderRadius: hy.radius.lg, border: `1px solid ${hy.ui.blue.fg}`, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', background: hy.ui.blue.bg, borderBottom: `1px solid ${hy.ui.blue.fg}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bot size={16} color={hy.ui.blue.fg} />
              <span style={{ fontSize: 14, fontWeight: 600, color: hy.ui.blue.fg }}>Contract Review Agent</span>
              <span style={{ fontSize: 12, color: hy.ui.blue.fg }}>&middot; {demoContract.name}</span>
              {demoComplete && (
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: hy.ui.success.bg, color: hy.ui.success.fg, border: `1px solid ${hy.ui.success.border}` }}>
                  Complete
                </span>
              )}
            </div>

            {/* Step progress while running */}
            {demoRunning && (
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${hy.border.base}` }}>
                <AgentStepProgress steps={REVIEW_AGENT_STEPS} currentStep={demoAnim.currentStep} done={demoAnim.done} />
              </div>
            )}

            {/* Full results when complete */}
            {demoComplete && (
              <div style={{ background: hy.bg.base }}>
                {/* Summary bar */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: hy.fg.muted }}>Compliance Score:</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: riskColor }}>{riskScore}</span>
                  </div>
                  <div style={{ width: 1, height: 20, background: hy.border.base }} />
                  <div style={{ fontSize: 12, color: hy.fg.subtle }}>
                    <span style={{ fontWeight: 600, color: hy.ui.success.fg }}>{demoContract.clausesAccepted}</span> accepted &middot;{' '}
                    <span style={{ fontWeight: 600, color: hy.ui.warning.fg }}>{demoContract.clausesFlagged}</span> flagged &middot;{' '}
                    <span style={{ fontWeight: 500 }}>{demoContract.clausesReviewed}</span> total
                  </div>
                  <div style={{ width: 1, height: 20, background: hy.border.base }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: hy.ui.blue.fg }}>
                    <BookOpen size={11} /> {demoContract.playbook}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button type="button" className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: hy.radius.sm, background: hy.fg.base, color: hy.bg.base, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FileText size={11} /> Download Redline
                    </button>
                  </div>
                </div>

                {/* Executive summary */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}`, background: hy.bg.subtle }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base, marginBottom: 6 }}>Executive Summary</div>
                  <div style={{ fontSize: 12, color: hy.fg.subtle, lineHeight: 1.6 }}>
                    This SaaS license agreement from Apex Dynamics contains <strong>5 clauses requiring attention</strong>, including 2 high-severity issues
                    (uncapped liability and missing DPA). The auto-renewal term of 2 years exceeds org standards. IP ownership language is overly broad in Vendor’s
                    favor. Prior negotiation history with Apex suggests they are receptive to our standard terms — liability cap was resolved in one round in the 2024 deal.
                    <strong> Recommended: proceed with redline, prioritize liability cap and DPA.</strong>
                  </div>
                </div>

                {/* Flagged issues */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color={hy.ui.warning.fg} /> Flagged Issues ({demoIssues.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {demoIssues.map((issue) => {
                      const sc = sevColor(issue.severity)
                      return (
                        <div key={issue.clause} style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, overflow: 'hidden' }}>
                          {/* Issue header */}
                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{issue.clause}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: sc.bg, color: sc.fg, textTransform: 'uppercase' as const }}>{issue.severity}</span>
                          </div>
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Playbook rule */}
                            <div style={{ fontSize: 11, color: hy.fg.muted }}>
                              <span style={{ fontWeight: 600 }}>Playbook rule:</span> {issue.playbookRule}
                            </div>
                            {/* Contract language */}
                            <div style={{ padding: '8px 12px', borderRadius: hy.radius.sm, background: 'hsl(356,100%,98%)', border: '1px solid hsl(356,50%,90%)' }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: hy.ui.danger.fg, marginBottom: 3, textTransform: 'uppercase' as const }}>Contract Language</div>
                              <div style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{issue.contractLanguage}&rdquo;</div>
                            </div>
                            {/* Agent verdict */}
                            <div style={{ fontSize: 12, color: hy.ui.warning.fg, fontWeight: 500 }}>
                              <Bot size={11} style={{ display: 'inline', marginRight: 4 }} />{issue.agentVerdict}
                            </div>
                            {/* Suggested redline */}
                            <div style={{ padding: '8px 12px', borderRadius: hy.radius.sm, background: hy.ui.success.bg, border: `1px solid ${hy.ui.success.border}` }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: hy.ui.success.fg, marginBottom: 3, textTransform: 'uppercase' as const }}>Suggested Redline</div>
                              <div style={{ fontSize: 12, color: hy.fg.base, lineHeight: 1.5 }}>{issue.suggestedRedline}</div>
                            </div>
                            {/* Prior agreement (if any) */}
                            {issue.priorAgreement && (
                              <div style={{ fontSize: 11, color: hy.ui.blue.fg, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                                <Clock size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                                <span>{issue.priorAgreement}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Accepted clauses */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${hy.border.base}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color={hy.ui.success.fg} /> Accepted Clauses ({acceptedClauses.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {acceptedClauses.map((c) => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: hy.radius.sm, background: hy.ui.success.bg, color: hy.ui.success.fg, border: `1px solid ${hy.ui.success.border}` }}>
                        <CheckCircle size={10} /> {c}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
                  <button type="button" className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: hy.bg.base, background: hy.fg.base, border: 'none', borderRadius: hy.radius.sm, padding: '8px 16px', cursor: 'pointer' }}>
                    <Send size={12} /> Approve &amp; Send Redline
                  </button>
                  <button type="button" className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: hy.fg.base, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '8px 16px', cursor: 'pointer' }}>
                    Edit Redline with Harvey
                  </button>
                  <button type="button" className="focus-visible:outline-none focus-visible:shadow-button-neutral-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: hy.ui.warning.fg, background: hy.bg.base, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.sm, padding: '8px 16px', cursor: 'pointer' }}>
                    Escalate to Senior Counsel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Unified contract table ── */}
      <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 100px 120px 120px', gap: 0, padding: '8px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
          {['Contract', 'Type', 'Source', 'Submitted by', 'Time'].map((h) => (
            <div key={h} style={{ fontSize: 12, fontWeight: 500, color: hy.fg.muted }}>{h}</div>
          ))}
        </div>

        {/* ── Section: Needs your review ── */}
        <div style={{ padding: '10px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={13} color={hy.ui.warning.fg} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 600, color: hy.ui.warning.fg }}>Needs your review</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: hy.ui.warning.bg, color: hy.ui.warning.fg }}>{needsYourReview.length}</span>
          <span style={{ fontSize: 11, color: hy.fg.muted, marginLeft: 'auto' }}>First pass ready</span>
        </div>
        {needsYourReview.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => { setReviewContract(i); setIssueActions({}); setOverrideNotes({}); setExpandedIssue(null); setOutputTab('issues') }}
            className="transition focus-visible:outline-none focus-visible:shadow-button-neutral-focus"
            style={{
              width: '100%', display: 'grid', gridTemplateColumns: '2fr 100px 100px 120px 120px', gap: 0, padding: '10px 20px', alignItems: 'center',
              borderBottom: i < needsYourReview.length - 1 ? `1px solid ${hy.border.base}` : 'none',
              background: hy.bg.base, cursor: 'pointer', textAlign: 'left', border: 'none',
              borderBottomWidth: i < needsYourReview.length - 1 ? 1 : 0, borderBottomStyle: 'solid', borderBottomColor: hy.border.base,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: hy.ui.warning.bg, color: hy.ui.warning.fg, flexShrink: 0 }}>
                {c.issues.length} {c.issues.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>
            <span style={{ fontSize: 12, color: hy.fg.subtle }}>{c.type}</span>
            <span style={{ fontSize: 12, color: hy.fg.subtle }}>{c.source}</span>
            <span style={{ fontSize: 12, color: hy.fg.subtle }}>{c.submittedBy}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: hy.fg.muted }}>{c.time}</span>
              <ChevronRight size={14} color={hy.fg.muted} />
            </div>
          </button>
        ))}

        {/* ── Section: Harvey auto-reviewed ── */}
        <div style={{ padding: '10px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={13} color={hy.ui.success.fg} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 600, color: hy.ui.success.fg }}>Harvey auto-reviewed</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: hy.ui.success.bg, color: hy.ui.success.fg }}>{autoReviewedContracts.length}</span>
          <span style={{ fontSize: 11, color: hy.fg.muted, marginLeft: 'auto' }}>No escalation needed</span>
        </div>
        {autoReviewedContracts.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 100px 100px 120px 120px', gap: 0, padding: '10px 20px', alignItems: 'center',
              borderBottom: i < autoReviewedContracts.length - 1 ? `1px solid ${hy.border.base}` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <CheckCircle size={13} color={hy.ui.success.fg} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</span>
            </div>
            <span style={{ fontSize: 12, color: hy.fg.subtle }}>{c.type}</span>
            <span style={{ fontSize: 12, color: hy.fg.subtle }}>{c.source}</span>
            <span style={{ fontSize: 12, color: hy.fg.subtle }}>{c.submitter}</span>
            <span style={{ fontSize: 12, color: hy.fg.muted }}>{c.time}</span>
          </div>
        ))}
      </div>

      {/* ── Skills slide-over panel ── */}
      {skillsOpen && (
        <SkillsPanel title="Contract Review Agent Skills" skills={CONTRACT_REVIEW_SKILLS} onClose={() => setSkillsOpen(false)} />
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ContractIntelligencePage() {
  const { tab } = useParams<{ tab: string }>()
  const activeSection = toTab(tab ?? 'overview')
  const router = useRouter()

  const handleSectionChange = useCallback(
    (tab: ActiveTab) => {
      router.push(`${CI_BASE}/${tab}`)
    },
    [router]
  )

  const sectionLabel = SECTION_LABELS[activeSection]

  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null)
  const activeChatIdRef = useRef<string | null>(null)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)

  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id
    setActiveChatIdState(id)
  }, [])

  const activeChat = chatThreads.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || []
  const isLoading = activeChat?.isLoading || false

  const updateChatById = useCallback((chatId: string, updater: (chat: ChatThread) => ChatThread) => {
    setChatThreads(prev => prev.map(chat => chat.id === chatId ? updater(chat) : chat))
  }, [])

  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`
    setChatThreads(prev => [...prev, { id: newChatId, title: 'Untitled', messages: [], isLoading: false }])
    setActiveChatId(newChatId)
  }, [setActiveChatId])

  const ensureChatExists = useCallback((): string => {
    const currentChatId = activeChatIdRef.current
    if (!currentChatId) {
      const newChatId = `chat-${Date.now()}`
      setChatThreads(prev => [...prev, { id: newChatId, title: 'Untitled', messages: [], isLoading: false }])
      setActiveChatId(newChatId)
      return newChatId
    }
    return currentChatId
  }, [setActiveChatId])

  const [chatInputValue, setChatInputValue] = useState('')
  const [isChatInputFocused, setIsChatInputFocused] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBottomGradient, setShowBottomGradient] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInChatMode = chatThreads.length > 0

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
        setIsScrolled(scrollTop > 0)
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        setIsNearBottom(distanceFromBottom < 100)
        setShowBottomGradient(distanceFromBottom > 1)
      }
    }
    const container = messagesContainerRef.current
    if (container) { container.addEventListener('scroll', handleScroll); handleScroll() }
    return () => { if (container) container.removeEventListener('scroll', handleScroll) }
  }, [])

  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      const t = setTimeout(() => scrollToBottom(), 100)
      return () => clearTimeout(t)
    }
  }, [messages, isNearBottom, scrollToBottom])

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('playbook') || q.includes('rule'))
      return "Based on your current playbook configuration, I\u2019ve identified key rules that need attention:\n\n1. **Confidentiality Period** \u2014 87 of 96 negotiations settled at 2 years; current standard of 3 years is rarely held\n2. **AI/ML Training Restrictions** \u2014 Only 38% acceptance; counterparties requesting anonymized-data carve-outs\n3. **Payment Terms** \u2014 79 of 91 vendor negotiations accepted Net 45; Net 30 is rarely held\n\nWould you like me to draft updated rule language for any of these?"
    if (q.includes('clause') || q.includes('risk') || q.includes('liability'))
      return "Analyzing your clause library against recent negotiation data:\n\n\u2022 **AI/ML Training Restrictions** \u2014 38% acceptance, falling 22% \u2014 suggest permitting anonymized aggregate data\n\u2022 **Subprocessor Disclosure** \u2014 53% acceptance, non-compliant with GDPR Art. 28\n\u2022 **Brand Safety Rights** \u2014 44% acceptance, industry moving to mutual model\n\u2022 **Liability Cap** \u2014 82% acceptance, stable \u2014 no changes needed\n\nWould you like me to suggest updated golden positions for the declining clauses?"
    if (q.includes('contract') || q.includes('pipeline') || q.includes('review'))
      return "Current pipeline status:\n\n\u2022 **4 contracts** in review \u2014 Harvey has completed first-pass analysis on all\n\u2022 **2 contracts** awaiting signature\n\u2022 **1 contract** in drafting\n\u2022 **Top escalation**: GroupM Nexus advertising agreement ($4.2M) \u2014 brand safety clause deviates from golden position\n\nWould you like me to prioritize these by risk level?"
    return `I\u2019m analyzing your contract intelligence data related to "${query}". I can help with playbook reviews, clause analysis, pipeline triage, or compliance checks. What would you like to focus on?`
  }

  const sendMessage = useCallback((messageText?: string) => {
    const text = messageText || chatInputValue
    if (!text.trim() || isLoading) return
    const chatId = ensureChatExists()
    const title = text.length > 40 ? text.substring(0, 40) + '...' : text
    const userMessage: Message = { role: 'user', content: text, type: 'text' }
    const thinkingContent = getThinkingContent('analysis')
    const assistantMessage: Message = { role: 'assistant', content: '', type: 'text', isLoading: true, thinkingContent, loadingState: { showSummary: false, visibleBullets: 0 } }
    updateChatById(chatId, chat => ({ ...chat, isLoading: true, title: chat.messages.length === 0 ? title : chat.title, messages: [...chat.messages, userMessage, assistantMessage] }))
    setChatInputValue('')
    if (textareaRef.current) textareaRef.current.style.height = '20px'
    setTimeout(() => scrollToBottom(), 50)
    setTimeout(() => { updateChatById(chatId, chat => ({ ...chat, messages: chat.messages.map((msg, idx) => idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading ? { ...msg, loadingState: { ...msg.loadingState!, showSummary: true } } : msg) })); scrollToBottom() }, 600)
    thinkingContent.bullets.forEach((_, bulletIdx) => {
      setTimeout(() => { updateChatById(chatId, chat => ({ ...chat, messages: chat.messages.map((msg, idx) => idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading ? { ...msg, loadingState: { ...msg.loadingState!, visibleBullets: bulletIdx + 1 } } : msg) })); scrollToBottom() }, 1000 + (bulletIdx * 400))
    })
    setTimeout(() => { updateChatById(chatId, chat => ({ ...chat, isLoading: false, messages: chat.messages.map((msg, idx) => idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading ? { ...msg, content: generateResponse(text), isLoading: false } : msg) })); setTimeout(() => scrollToBottom(), 100) }, 2500)
  }, [chatInputValue, isLoading, ensureChatExists, updateChatById, scrollToBottom])

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg-base">
      {/* Left side — Header + Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Page Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-base shrink-0">
          <div className="flex items-center gap-1">
            <div className="flex items-center text-sm">
              <span className="font-medium text-fg-base" style={{ padding: '4px 6px' }}>{sectionLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isChatPanelOpen && (
              <button
                onClick={() => setIsChatPanelOpen(true)}
                className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors"
              >
                <SvgIcon src="/central_icons/Assistant.svg" alt="Open chat" width={16} height={16} className="text-fg-base" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="medium" className="gap-1.5">
                  <Plus size={16} />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem>
                  <FileText className="w-4 h-4" />
                  <span>Create contract</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="w-4 h-4" />
                  <span>Upload contract</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Zap className="w-4 h-4" />
                  <span>Use a workflow</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div style={{ padding: '20px 28px', maxWidth: 1200, margin: '0 auto' }}>

            {/* Tab content */}
            {(activeSection === 'overview' || activeSection === 'contracts') && (
              <SimplePipelineView />
            )}
            {activeSection === 'playbooks' && (
              <PlaybooksTab rules={playbookRules} gaps={playbookGaps} />
            )}
            {activeSection === 'clauses' && (
              <ClausesTab clauses={clauseLibrary} />
            )}

          </div>
        </div>
      </div>

      {/* Chat Panel Separator */}
      {isChatPanelOpen && <div className="w-px bg-border-base flex-shrink-0" />}

      {/* Chat Panel */}
      <AnimatePresence mode="wait">
        {isChatPanelOpen && (
          <motion.div
            ref={containerRef}
            key="chat-panel"
            className="flex flex-col bg-bg-base overflow-hidden w-[401px]"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 401, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ width: { duration: 0.3, ease: 'easeOut' }, opacity: { duration: 0.15, ease: 'easeOut' } }}
            style={{ flexShrink: 0 }}
          >
            {/* Chat Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ height: '52px' }}>
              <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0 max-w-[calc(100%-48px)]" style={{ flexWrap: 'nowrap' }}>
                {chatThreads.length === 0 ? (
                  <span className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap" style={{ padding: '4px 8px' }}>New chat</span>
                ) : (
                  chatThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setActiveChatId(thread.id)}
                      className={cn(
                        'text-sm font-medium rounded-md transition-colors whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0',
                        thread.id === activeChatId ? 'text-fg-base bg-bg-subtle' : 'text-fg-muted hover:text-fg-base hover:bg-bg-subtle'
                      )}
                      style={{ padding: '4px 8px', maxWidth: '200px' }}
                      title={thread.title || 'Untitled'}
                    >
                      {(thread.title || 'Untitled').length > 25 ? (thread.title || 'Untitled').substring(0, 25) + '...' : (thread.title || 'Untitled')}
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={createNewChat} className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0" title="New chat">
                  <Plus size={16} className="text-fg-base" />
                </button>
                <button onClick={() => setIsChatPanelOpen(false)} className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0" title="Close chat">
                  <SvgIcon src="/central_icons/Assistant - Filled.svg" alt="Close chat" width={16} height={16} className="text-fg-base" />
                </button>
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
                        <p className="text-sm leading-5 text-fg-subtle">Ask questions about your contracts, playbooks, or clause library.</p>
                      </div>
                      <div className="w-full max-w-[624px] flex flex-col">
                        <div className="px-3 pb-3"><p className="text-xs leading-4 text-fg-muted">Get started&hellip;</p></div>
                        <div className="flex flex-col">
                          {[
                            { icon: '/central_icons/Review.svg', label: 'Review pipeline contracts needing attention', prompt: 'Review the contracts in my pipeline that need attention and summarize the key issues' },
                            { icon: '/central_icons/Review.svg', label: 'Analyze clause risk exposure', prompt: 'Analyze the risk exposure across my clause library and flag high-risk positions' },
                            { icon: '/central_icons/Draft.svg', label: 'Draft playbook rule updates', prompt: 'Draft updated playbook rules based on recent contract negotiation trends' },
                            { icon: '/central_icons/Review.svg', label: 'Summarize pipeline status', prompt: 'Summarize the current contract pipeline status and highlight escalations' },
                          ].map((action, i) => (
                            <React.Fragment key={action.label}>
                              <button onClick={() => sendMessage(action.prompt)} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left">
                                <SvgIcon src={action.icon} alt="" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle">{action.label}</span>
                              </button>
                              {i < 3 && <div className="h-px bg-border-base mx-3" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={index} className={index !== messages.length - 1 ? 'mb-6' : ''}>
                        {message.role === 'user' && (
                          <div className="flex flex-col gap-2 items-end pl-[68px]">
                            <div className="bg-bg-subtle px-4 py-3 rounded-[12px]">
                              <div className="text-sm text-fg-base leading-5">{message.content}</div>
                            </div>
                            <div className="flex items-center justify-end">
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><ListPlus className="w-3 h-3" />Save prompt</button>
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><SquarePen className="w-3 h-3" />Edit query</button>
                            </div>
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <div className="flex-1 min-w-0">
                            {message.showThinking !== false && (
                              <>
                                {message.isLoading && message.thinkingContent && message.loadingState ? (
                                  <ThinkingState variant="analysis" title="Thinking..." durationSeconds={undefined} summary={message.loadingState.showSummary ? message.thinkingContent.summary : undefined} bullets={message.thinkingContent.bullets?.slice(0, message.loadingState.visibleBullets)} isLoading={true} />
                                ) : message.thinkingContent ? (
                                  <ThinkingState variant="analysis" title="Thought" durationSeconds={3} summary={message.thinkingContent.summary} bullets={message.thinkingContent.bullets} defaultOpen={false} />
                                ) : null}
                              </>
                            )}
                            {!message.isLoading && message.content && (
                              <AnimatePresence>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                                  <div className="text-sm text-fg-base leading-relaxed pl-2 whitespace-pre-wrap">{message.content}</div>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center">
                                      <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                                      <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Download className="w-3 h-3" />Export</button>
                                      <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><RotateCcw className="w-3 h-3" />Rewrite</button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsUp className="w-3 h-3" /></button>
                                      <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsDown className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                </motion.div>
                              </AnimatePresence>
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
                <div
                  className="bg-[#f6f5f4] dark:bg-[#2a2a2a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong"
                  style={{ boxShadow: '0px 18px 47px 0px rgba(0,0,0,0.03), 0px 7.5px 19px 0px rgba(0,0,0,0.02), 0px 4px 10.5px 0px rgba(0,0,0,0.02)' }}
                >
                  <div className="p-[10px] flex flex-col gap-[10px]">
                    <div className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-white dark:bg-[#1a1a1a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[4px] w-fit">
                      <img src="/folderIcon.svg" alt="Contracts" className="w-3 h-3" />
                      <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">Contracts</span>
                    </div>
                    <div className="px-[4px]">
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={chatInputValue}
                          onChange={(e) => { setChatInputValue(e.target.value); e.target.style.height = '20px'; e.target.style.height = Math.max(20, e.target.scrollHeight) + 'px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isLoading) { e.preventDefault(); sendMessage() } }}
                          onFocus={() => setIsChatInputFocused(true)}
                          onBlur={() => setIsChatInputFocused(false)}
                          disabled={isLoading}
                          className="w-full bg-transparent focus:outline-none text-fg-base placeholder-[#9e9b95] resize-none overflow-hidden disabled:opacity-50"
                          style={{ fontSize: '14px', lineHeight: '20px', height: '20px', minHeight: '20px', maxHeight: '300px' }}
                        />
                        {!chatInputValue && !isChatInputFocused && (
                          <div className="absolute inset-0 pointer-events-none text-[#9e9b95] dark:text-[#6b6b6b] flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
                            <TextLoop interval={3000}>
                              <span>Review pipeline contracts needing attention&hellip;</span>
                              <span>Analyze clause risk exposure&hellip;</span>
                              <span>Draft playbook rule updates&hellip;</span>
                              <span>Summarize pipeline status&hellip;</span>
                            </TextLoop>
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
                      {isLoading ? (
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

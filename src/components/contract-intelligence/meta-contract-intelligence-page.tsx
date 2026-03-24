'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  Library,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Shield,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
  Paperclip,
  Scale,
  CornerDownLeft,
  Mic,
  Copy,
  Download,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ListPlus,
  SquarePen,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SvgIcon } from '@/components/svg-icon'
import { Spinner } from '@/components/ui/spinner'
import ThinkingState from '@/components/thinking-state'
import { TextLoop } from '../../../components/motion-primitives/text-loop'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

type CITab = 'trends' | 'playbooks' | 'clauses' | 'escalations' | 'contracts'
type IntakeSource = 'Harvey on Teams' | 'ask@legal.ai' | 'Shared Spaces'

/* ── Mock data ──────────────────────────────────────────────────────────── */

type RuleChangeReason = 'fallback-standard' | 'non-compliant' | 'market-shift'

interface PlaybookRule {
  id: string
  name: string
  currentPosition: string
  reason: RuleChangeReason
  insight: string           // why change: "87% using fallback" or "Non-compliant: GDPR Art. 28"
  recommendedPosition: string
  impactArea: string[]
}

interface Playbook {
  id: string
  name: string
  type: string
  version: string
  lastUpdated: string
  totalRules: number
  status: 'needs-update' | 'monitor' | 'healthy'
  rules: PlaybookRule[]
}

const playbooks: Playbook[] = [
  {
    id: 'pb1',
    name: 'NDA Playbook',
    type: 'NDA',
    version: 'v4.2',
    lastUpdated: 'Nov 2025',
    totalRules: 11,
    status: 'needs-update',
    rules: [
      {
        id: 'r1a',
        name: 'Confidentiality Period — 3 years',
        currentPosition: '3-year confidentiality period post-termination',
        reason: 'fallback-standard',
        insight: '87 of last 96 negotiations settled at 2 years (Fallback 1). You\'re negotiating down every time — 2 years is the market standard.',
        recommendedPosition: 'Update standard to 2 years. Keep 3-year as opening position only for high-value deals (>$2M).',
        impactArea: ['Time & Duration'],
      },
      {
        id: 'r1b',
        name: 'Residual Knowledge Carve-out — excluded',
        currentPosition: 'No residual knowledge carve-out',
        reason: 'market-shift',
        insight: '62% of counterparties now request a residual knowledge carve-out. Refusals are delaying close by an average of 4.1 days.',
        recommendedPosition: 'Add standard residual knowledge carve-out for information retained in unaided memory of employees.',
        impactArea: ['IP', 'Operational'],
      },
    ],
  },
  {
    id: 'pb2',
    name: 'Data License Playbook',
    type: 'Data',
    version: 'v2.1',
    lastUpdated: 'Jan 2026',
    totalRules: 14,
    status: 'needs-update',
    rules: [
      {
        id: 'r2a',
        name: 'AI/ML Training — Full Prohibition',
        currentPosition: 'All use of licensed data for AI/ML training strictly prohibited',
        reason: 'market-shift',
        insight: 'Only 38% acceptance. Counterparties are requesting anonymized-data carve-outs in 9 of the last 12 negotiations. Deals are stalling at this clause.',
        recommendedPosition: 'Permit AI/ML training on fully anonymized aggregate data only. Add explicit exclusion for raw PII and individual-level data.',
        impactArea: ['AI/ML', 'Commercial'],
      },
      {
        id: 'r2b',
        name: 'Sub-processor Disclosure — Categories Only',
        currentPosition: 'Disclose categories of sub-processors, not named entities',
        reason: 'non-compliant',
        insight: 'Non-compliant with GDPR Art. 28(3)(d) for EU data subjects. ICO guidance updated Jan 2026 requires named sub-processor list or change-notification mechanism.',
        recommendedPosition: 'Maintain category list + add 30-day advance notice of material sub-processor changes with opt-out right.',
        impactArea: ['Privacy', 'Legal'],
      },
    ],
  },
  {
    id: 'pb3',
    name: 'Vendor Services Playbook',
    type: 'Vendor',
    version: 'v2.8',
    lastUpdated: 'Dec 2025',
    totalRules: 18,
    status: 'monitor',
    rules: [
      {
        id: 'r3a',
        name: 'Payment Terms — Net 30',
        currentPosition: 'Net 30 days from invoice date',
        reason: 'fallback-standard',
        insight: '79 of 91 vendor negotiations accepted Net 45 (Fallback 1) in the last quarter. Net 30 is rarely held.',
        recommendedPosition: 'Update standard to Net 45 for vendors <$500K. Keep Net 30 for critical vendors.',
        impactArea: ['Financial', 'Operational'],
      },
    ],
  },
  {
    id: 'pb4',
    name: 'Advertising Agreement Playbook',
    type: 'Advertising',
    version: 'v1.5',
    lastUpdated: 'Feb 2026',
    totalRules: 16,
    status: 'monitor',
    rules: [
      {
        id: 'r4a',
        name: 'Brand Safety — Unilateral Right',
        currentPosition: 'Unilateral right to remove ads for brand safety reasons',
        reason: 'market-shift',
        insight: 'Acceptance rate down to 44% (was 71% in Q3 2025). Industry peers have moved to mutual brand safety obligations.',
        recommendedPosition: 'Add mutual obligation — counterparty can also invoke brand safety for clearly harmful content. Unilateral right retained for core violations.',
        impactArea: ['Commercial', 'Reputational'],
      },
    ],
  },
  {
    id: 'pb5',
    name: 'Content Partnership Playbook',
    type: 'Partnerships',
    version: 'v2.0',
    lastUpdated: 'Mar 2026',
    totalRules: 12,
    status: 'healthy',
    rules: [],
  },
]

/* ── Golden clause library ──────────────────────────────────────────────── */
type ClauseCategory = 'Liability' | 'Privacy' | 'IP' | 'Commercial' | 'AI/ML' | 'Platform'

interface GoldenClause {
  id: string
  name: string
  category: ClauseCategory
  goldenPosition: string          // The approved standard text/position
  acceptanceRate: number
  trendDirection: 'rising' | 'falling' | 'stable'
  trendPct: number
  linkedPlaybooks: string[]        // Playbook names that use this clause
  lastReviewed: string
  note: string
  suggestedUpdate?: string         // If non-null, Harvey suggests updating the golden position
  sourceAttribution?: string       // Cross-system context: where Harvey found supporting evidence
}

const goldenClauses: GoldenClause[] = [
  {
    id: 'gc1',
    name: 'AI/ML Training Restrictions',
    category: 'AI/ML',
    goldenPosition: 'Prohibit all use of licensed data for AI/ML model training',
    acceptanceRate: 38,
    trendDirection: 'falling',
    trendPct: 22,
    linkedPlaybooks: ['Data License Playbook'],
    lastReviewed: 'Jan 2026',
    note: 'Acceptance has dropped from 60% to 38% over 6 months. Market shifting toward anonymized-data carve-outs.',
    suggestedUpdate: 'Permit AI/ML training on fully anonymized aggregate data only.',
    sourceAttribution: 'Harvey found in Salesforce: 9 of 12 counterparties accepted anonymized carve-out in recent deals',
  },
  {
    id: 'gc2',
    name: 'Subprocessor Disclosure',
    category: 'Privacy',
    goldenPosition: 'Disclose categories of subprocessors only',
    acceptanceRate: 53,
    trendDirection: 'falling',
    trendPct: 14,
    linkedPlaybooks: ['Data License Playbook', 'Vendor Services Playbook'],
    lastReviewed: 'Dec 2025',
    note: 'Non-compliant with GDPR Art. 28 per Jan 2026 ICO guidance. Update required.',
    suggestedUpdate: 'Category list + 30-day advance notice of material changes with opt-out right.',
    sourceAttribution: 'Harvey found in Salesforce + SharePoint: 7 recent contracts required named sub-processor list',
  },
  {
    id: 'gc3',
    name: 'Brand Safety Rights',
    category: 'Commercial',
    goldenPosition: 'Unilateral right to remove ads for brand safety reasons, no counterparty recourse',
    acceptanceRate: 44,
    trendDirection: 'falling',
    trendPct: 18,
    linkedPlaybooks: ['Advertising Agreement Playbook'],
    lastReviewed: 'Nov 2025',
    note: 'Industry moving to mutual model. 34 deviations in Q1 2026.',
    suggestedUpdate: 'Mutual brand safety obligations — counterparty right limited to clearly harmful content.',
    sourceAttribution: 'Harvey found in Salesforce: GroupM, Nielsen, Publicis accepted mutual model in Q1 2026',
  },
  {
    id: 'gc4',
    name: 'Liability Cap',
    category: 'Liability',
    goldenPosition: '3× annual fees, mutual, excluding gross negligence and wilful misconduct',
    acceptanceRate: 82,
    trendDirection: 'stable',
    trendPct: 1,
    linkedPlaybooks: ['Vendor Services Playbook', 'Content Partnership Playbook', 'Advertising Agreement Playbook'],
    lastReviewed: 'Feb 2026',
    note: 'Well accepted across all agreement types. No changes recommended.',
  },
  {
    id: 'gc5',
    name: 'IP Ownership — Deliverables',
    category: 'IP',
    goldenPosition: 'Work-for-hire; all deliverables including derivative works assigned to company',
    acceptanceRate: 57,
    trendDirection: 'falling',
    trendPct: 11,
    linkedPlaybooks: ['Content Partnership Playbook', 'Vendor Services Playbook'],
    lastReviewed: 'Jan 2026',
    note: 'Partners pushing back on broad work-for-hire. Pre-existing IP carve-out increasingly expected.',
    suggestedUpdate: 'Exclude counterparty pre-existing IP from assignment. Company retains rights to custom deliverables only.',
    sourceAttribution: 'Harvey found in SharePoint: 4 of 5 content partners requested pre-existing IP carve-out',
  },
  {
    id: 'gc6',
    name: 'Auto-Renewal Notice Window',
    category: 'Commercial',
    goldenPosition: '60-day written notice to opt out of auto-renewal',
    acceptanceRate: 88,
    trendDirection: 'rising',
    trendPct: 4,
    linkedPlaybooks: ['Vendor Services Playbook', 'Data License Playbook'],
    lastReviewed: 'Mar 2026',
    note: 'Acceptance improved after reducing from 90-day window in March update.',
  },
  {
    id: 'gc7',
    name: 'Data Residency — EU',
    category: 'Privacy',
    goldenPosition: 'Primary storage in US; EU data may be stored in EU-approved locations',
    acceptanceRate: 71,
    trendDirection: 'stable',
    trendPct: 2,
    linkedPlaybooks: ['Data License Playbook'],
    lastReviewed: 'Feb 2026',
    note: 'Stable. DORA may require update for EU financial services partners in H2 2026.',
  },
  {
    id: 'gc8',
    name: 'Confidentiality Period',
    category: 'Commercial',
    goldenPosition: '3 years post-termination',
    acceptanceRate: 48,
    trendDirection: 'falling',
    trendPct: 15,
    linkedPlaybooks: ['NDA Playbook'],
    lastReviewed: 'Nov 2025',
    note: '87% of negotiations settle at 2 years. Standard is rarely held.',
    suggestedUpdate: 'Update standard to 2 years. Use 3 years as opening position for deals >$2M.',
    sourceAttribution: 'Harvey found in DocuSign: 87% of executed NDAs settled at 2-year confidentiality period',
  },
]

/* ── Escalations ────────────────────────────────────────────────────────── */
interface Escalation {
  id: string
  name: string
  counterparty: string
  type: string
  submittedBy: string
  dept: string
  intakeSource: IntakeSource
  submittedAgo: string
  harveyReviewedAgo: string
  riskLevel: 'high' | 'medium' | 'low'
  harveyNote: string
  keyIssues: Array<{ clause: string; issue: string; recommendation: string }>
  value: string
}

const escalations: Escalation[] = [
  {
    id: 'esc1',
    name: 'Programmatic Advertising Partnership Agreement',
    counterparty: 'GroupM Nexus',
    type: 'Advertising',
    submittedBy: 'Alicia Torres',
    dept: 'Global Sales',
    intakeSource: 'Harvey on Teams',
    submittedAgo: '3h 22m',
    harveyReviewedAgo: '3h 18m',
    riskLevel: 'high',
    harveyNote: 'Reviewed against Advertising Agreement Playbook v1.5. Brand safety clause deviates materially — counterparty requesting mutual obligations, which deviates from the golden clause position. AI/ML data rights clause is ambiguous and could allow model training on ad performance data.',
    keyIssues: [
      { clause: 'Brand Safety', issue: 'Counterparty requests mutual obligations — golden clause is unilateral', recommendation: 'Accept mutual model per Harvey\'s drafted language — market is moving this way and a playbook update is already flagged.' },
      { clause: 'AI/ML Data Rights', issue: 'Clause 8.3 permits "performance optimization" — broad enough to cover model training on ad data', recommendation: 'Add explicit exclusion: "performance data may not be used to train or fine-tune machine learning models."' },
    ],
    value: '$4.2M',
  },
  {
    id: 'esc2',
    name: 'Cloud Infrastructure — EU Regional Deployment',
    counterparty: 'Siemens Digital',
    type: 'Vendor',
    submittedBy: 'Marcus Chen',
    dept: 'Infrastructure',
    intakeSource: 'ask@legal.ai',
    submittedAgo: '1d 2h',
    harveyReviewedAgo: '1d 1h 54m',
    riskLevel: 'high',
    harveyNote: 'Reviewed against Vendor Services Playbook v2.8. Critical DORA Article 28 compliance gap. Vendor SLA has 5-day incident reporting window — DORA requires 72 hours for critical ICT providers. Sub-contractor chain is undisclosed, which is required for EU deployment.',
    keyIssues: [
      { clause: 'ICT Incident Reporting', issue: '5-day reporting window — DORA requires 72 hours for critical incidents', recommendation: 'Require amendment to §12.2 before signing. Non-negotiable for EU deployment.' },
      { clause: 'Sub-contractor Disclosure', issue: 'No sub-contractor list — DORA Art. 28(3)(d) requires documented disclosure', recommendation: 'Request Schedule B (sub-contractor list) before execution. Harvey has drafted the required addendum.' },
      { clause: 'Audit Rights', issue: '30-day notice period — DORA requires access on reasonable notice', recommendation: 'Reduce to 5 business days for regulatory audit scenarios.' },
    ],
    value: '$8.1M',
  },
  {
    id: 'esc3',
    name: 'Research Data License — Academic Program',
    counterparty: 'MIT Media Lab',
    type: 'Data',
    submittedBy: 'Raj Patel',
    dept: 'Partnerships',
    intakeSource: 'Shared Spaces',
    submittedAgo: '5h 10m',
    harveyReviewedAgo: '5h 06m',
    riskLevel: 'medium',
    harveyNote: 'Reviewed against Data License Playbook v2.1. Permitted use clause is narrower than the golden position, limiting use to "social media research" — more restrictive than needed but not harmful. Publication approval rights are absent — recommend adding.',
    keyIssues: [
      { clause: 'Publication Rights', issue: 'No publication approval clause — counterparty can publish findings without prior review', recommendation: 'Add standard 30-day pre-publication review right. Harvey has pre-drafted language.' },
    ],
    value: '—',
  },
  {
    id: 'esc4',
    name: 'Content Creator Monetization Agreement',
    counterparty: 'Premiere Creator Co.',
    type: 'Partnerships',
    submittedBy: 'Sarah Kim',
    dept: 'Creator Partnerships',
    intakeSource: 'Harvey on Teams',
    submittedAgo: '6h 45m',
    harveyReviewedAgo: '6h 41m',
    riskLevel: 'low',
    harveyNote: 'Reviewed against Content Partnership Playbook v2.0. All key terms are within standard golden clause positions. Revenue share structure matches the Q1 2026 approved model. IP ownership is clearly scoped to platform content only.',
    keyIssues: [],
    value: '$280K/yr',
  },
]

/* ── All contracts ──────────────────────────────────────────────────────── */
type ContractStatus = 'In Review' | 'Awaiting Signature' | 'Active' | 'Executed' | 'Drafting'

interface ContractRow {
  id: string
  name: string
  counterparty: string
  type: string
  submittedBy: string
  dept: string
  intakeSource: IntakeSource
  status: ContractStatus
  value: string
  submittedDate: string
  daysOpen: number
}

const allContracts: ContractRow[] = [
  { id: 'c1',  name: 'Programmatic Advertising Partnership Agreement', counterparty: 'GroupM Nexus',     type: 'Advertising',  submittedBy: 'Alicia Torres',  dept: 'Global Sales',         intakeSource: 'Harvey on Teams', status: 'In Review',          value: '$4.2M',    submittedDate: 'Mar 15, 2026', daysOpen: 3 },
  { id: 'c2',  name: 'Cloud Infrastructure — EU Regional Deployment',  counterparty: 'Siemens Digital',  type: 'Vendor',       submittedBy: 'Marcus Chen',    dept: 'Infrastructure',       intakeSource: 'ask@legal.ai',   status: 'In Review',          value: '$8.1M',    submittedDate: 'Mar 17, 2026', daysOpen: 1 },
  { id: 'c3',  name: 'Research Data License — Academic Program',       counterparty: 'MIT Media Lab',    type: 'Data',         submittedBy: 'Raj Patel',      dept: 'Partnerships',         intakeSource: 'Shared Spaces',  status: 'In Review',          value: '—',        submittedDate: 'Mar 18, 2026', daysOpen: 0 },
  { id: 'c4',  name: 'Content Creator Monetization Agreement',        counterparty: 'Premiere Creator', type: 'Partnerships', submittedBy: 'Sarah Kim',      dept: 'Creator Partnerships', intakeSource: 'Harvey on Teams', status: 'In Review',          value: '$280K',    submittedDate: 'Mar 17, 2026', daysOpen: 1 },
  { id: 'c5',  name: 'Enterprise API Access Agreement',               counterparty: 'DataBridge Inc.',  type: 'Platform',     submittedBy: 'Tom Nguyen',     dept: 'Platform',             intakeSource: 'Shared Spaces',  status: 'Awaiting Signature', value: '$620K',    submittedDate: 'Mar 12, 2026', daysOpen: 6 },
  { id: 'c6',  name: 'Global Reseller Framework Agreement',           counterparty: 'Axiom Partners',   type: 'Advertising',  submittedBy: 'Priya Mehta',    dept: 'Global Sales',         intakeSource: 'ask@legal.ai',   status: 'Awaiting Signature', value: '$1.9M',    submittedDate: 'Mar 10, 2026', daysOpen: 8 },
  { id: 'c7',  name: 'Data Processing Addendum — EU Compliance',      counterparty: 'EuroTech GmbH',    type: 'Data',         submittedBy: 'Lena Fischer',   dept: 'Compliance',           intakeSource: 'Harvey on Teams', status: 'Drafting',           value: '—',        submittedDate: 'Mar 14, 2026', daysOpen: 4 },
  { id: 'c8',  name: 'Managed Security Services Agreement',           counterparty: 'Fortress Digital', type: 'Vendor',       submittedBy: 'James Owusu',    dept: 'Security',             intakeSource: 'Shared Spaces',  status: 'Active',             value: '$2.4M',    submittedDate: 'Jan 10, 2026', daysOpen: 67 },
  { id: 'c9',  name: 'Strategic Alliance & Revenue Share',            counterparty: 'Apex Financial',   type: 'Partnerships', submittedBy: 'Sarah Kim',      dept: 'Creator Partnerships', intakeSource: 'Harvey on Teams', status: 'Active',             value: '$3.1M',    submittedDate: 'Feb 2, 2026',  daysOpen: 44 },
  { id: 'c10', name: 'Brand Partnership — Seasonal Campaign',         counterparty: 'Nike Global',      type: 'Advertising',  submittedBy: 'Alicia Torres',  dept: 'Global Sales',         intakeSource: 'ask@legal.ai',   status: 'Executed',           value: '$7.8M',    submittedDate: 'Dec 1, 2025',  daysOpen: 107 },
  { id: 'c11', name: 'Software Development Services SOW',             counterparty: 'Meridian Tech',    type: 'Vendor',       submittedBy: 'Marcus Chen',    dept: 'Infrastructure',       intakeSource: 'Shared Spaces',  status: 'Executed',           value: '$880K',    submittedDate: 'Jan 22, 2026', daysOpen: 55 },
]

/* ── Status/source colors ───────────────────────────────────────────────── */
type StatusDef = { fg: string; bg: string; label: string }

const playbookStatusMap: Record<Playbook['status'], StatusDef> = {
  'needs-update': { fg: hy.ui.danger.fg,  bg: hy.ui.danger.bg,  label: 'Needs update' },
  'monitor':      { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: 'Monitor' },
  'healthy':      { fg: hy.ui.success.fg, bg: hy.ui.success.bg, label: 'Healthy' },
}

const ruleReasonMap: Record<RuleChangeReason, StatusDef> = {
  'fallback-standard': { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: '90% using fallback' },
  'non-compliant':     { fg: hy.ui.danger.fg,  bg: hy.ui.danger.bg,  label: 'Non-compliant' },
  'market-shift':      { fg: hy.ui.blue.fg,    bg: hy.ui.blue.bg,    label: 'Market shift' },
}

const riskColors: Record<Escalation['riskLevel'], StatusDef> = {
  high:   { fg: hy.ui.danger.fg,  bg: hy.ui.danger.bg,  label: 'High risk' },
  medium: { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: 'Medium risk' },
  low:    { fg: hy.ui.success.fg, bg: hy.ui.success.bg, label: 'Ready to approve' },
}

const contractStatusColor: Record<ContractStatus, StatusDef> = {
  'In Review':          { fg: hy.ui.warning.fg, bg: hy.ui.warning.bg, label: 'In Review' },
  'Awaiting Signature': { fg: hy.ui.blue.fg,    bg: hy.ui.blue.bg,    label: 'Awaiting Sig.' },
  'Drafting':           { fg: hy.ui.neutral.fg, bg: hy.ui.neutral.bg, label: 'Drafting' },
  'Active':             { fg: hy.ui.success.fg, bg: hy.ui.success.bg, label: 'Active' },
  'Executed':           { fg: hy.ui.neutral.fg, bg: hy.ui.neutral.bg, label: 'Executed' },
}

const categoryColors: Record<ClauseCategory, { fg: string; bg: string }> = {
  'Liability':  hy.ui.danger,
  'Privacy':    hy.ui.blue,
  'IP':         hy.ui.blue,
  'Commercial': hy.ui.gold,
  'AI/ML':      { fg: '#6d28d9', bg: '#ede9fe' },
  'Platform':   hy.ui.neutral,
}

const intakeSourceIcon: Record<IntakeSource, React.ReactNode> = {
  'Harvey on Teams': <MessageSquare size={10} />,
  'ask@legal.ai':    <Mail size={10} />,
  'Shared Spaces':   <Share2 size={10} />,
}
const intakeSourceColor: Record<IntakeSource, { fg: string; bg: string }> = {
  'Harvey on Teams': hy.ui.blue,
  'ask@legal.ai':    hy.ui.blue,
  'Shared Spaces':   hy.ui.gold,
}

function IntakeSourceBadge({ source }: { source: IntakeSource }) {
  const { fg, bg } = intakeSourceColor[source]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, background: bg }}>
      <span style={{ color: fg }}>{intakeSourceIcon[source]}</span>
      <span style={{ fontSize: 10, fontWeight: 500, color: fg }}>{source}</span>
    </div>
  )
}

/* ── Triage Agent data ───────────────────────────────────────────────────── */
type TriageStatus = 'classifying' | 'sent-back'

interface TriageContract {
  id: string
  name: string
  counterparty: string
  submittedBy: string
  dept: string
  intakeSource: IntakeSource
  submittedAgo: string
  triageStatus: TriageStatus
  playbookMatch?: string
  riskEstimate?: 'high' | 'medium' | 'low'
}

const triageContracts: TriageContract[] = [
  {
    id: 't1', name: 'Annual Software License Renewal', counterparty: 'Adobe Inc.',
    submittedBy: 'Tom Nguyen', dept: 'Platform', intakeSource: 'Harvey on Teams',
    submittedAgo: '4m', triageStatus: 'classifying',
  },
  {
    id: 'ta1', name: 'Standard NDA — Consultant Onboarding', counterparty: 'Bright Future LLC',
    submittedBy: 'HR Portal', dept: 'HR', intakeSource: 'Harvey on Teams',
    submittedAgo: '1h', triageStatus: 'sent-back', playbookMatch: 'NDA Playbook', riskEstimate: 'low',
  },
  {
    id: 'ta2', name: 'Vendor Services Agreement — IT Equipment', counterparty: 'TechSupply Co.',
    submittedBy: 'Ops Portal', dept: 'Operations', intakeSource: 'ask@legal.ai',
    submittedAgo: '2h', triageStatus: 'sent-back', playbookMatch: 'Vendor Services Playbook', riskEstimate: 'low',
  },
  {
    id: 't2', name: 'Influencer Marketing Agreement', counterparty: 'Spark Creative Studio',
    submittedBy: 'Priya Mehta', dept: 'Global Sales', intakeSource: 'ask@legal.ai',
    submittedAgo: '12m', triageStatus: 'sent-back', playbookMatch: 'Advertising Agreement Playbook', riskEstimate: 'low',
  },
  {
    id: 't3', name: 'Data Processing Addendum — US Operations', counterparty: 'Cloudflare Inc.',
    submittedBy: 'Lena Fischer', dept: 'Compliance', intakeSource: 'Shared Spaces',
    submittedAgo: '31m', triageStatus: 'sent-back', playbookMatch: 'Data License Playbook', riskEstimate: 'low',
  },
]

const triageStatusLabel: Record<TriageStatus, string> = {
  classifying: 'Analyzing…',
  'sent-back': 'Sent back to submitter',
}
const triageStatusColor: Record<TriageStatus, { fg: string; bg: string }> = {
  classifying: hy.ui.blue,
  'sent-back':  hy.ui.success,
}

/* ── Connected systems of record ────────────────────────────────────────── */
interface SystemIntegration {
  id: string
  name: string
  abbr: string
  color: string           // brand color for the avatar chip
  contractCount: number
  status: 'live' | 'syncing'
  lastSync: string        // e.g. '2m ago', 'Live', '1h ago'
  description: string
}

const systemIntegrations: SystemIntegration[] = [
  { id: 'sf',  name: 'Salesforce',   abbr: 'SF', color: '#1589EE', contractCount: 4, status: 'live',    lastSync: '2m ago',  description: 'Sales & commercial agreements' },
  { id: 'sp',  name: 'SharePoint',   abbr: 'SP', color: '#0078D4', contractCount: 3, status: 'live',    lastSync: 'Live',    description: 'Document repository' },
  { id: 'ds',  name: 'DocuSign',     abbr: 'DS', color: '#FFCC00', contractCount: 2, status: 'live',    lastSync: 'Live',    description: 'Executed & awaiting signature' },
  { id: 'wd',  name: 'Workday',      abbr: 'WD', color: '#F36F21', contractCount: 1, status: 'live',    lastSync: '1h ago',  description: 'Vendor & HR agreements' },
  { id: 'gd',  name: 'Google Drive', abbr: 'GD', color: '#34A853', contractCount: 1, status: 'syncing', lastSync: '5m ago',  description: 'Partnership documents' },
]

/* ── Derived counts (single source of truth) ────────────────────────────── */
const playbooksNeedingUpdate = playbooks.filter((p) => p.status === 'needs-update').length        // 2
const clausesWithSuggestedUpdate = goldenClauses.filter((c) => c.suggestedUpdate).length          // 4 (gc1,gc2,gc3,gc5,gc8 = 5 actually; let me count: gc1,gc2,gc3,gc5,gc8 = 5)
const escalationsPendingReview = escalations.filter((e) => e.riskLevel !== 'low').length          // 3

function useAskHarveyPrompts() {
  return [
    "Which playbook rules need updating based on recent contracts?",
    "Which clauses are most contested across my in-review contracts?",
    "What's the average risk level of contracts submitted this week?",
    "Show me contracts that deviate from the NDA Playbook",
    "Are there any GDPR compliance gaps in active contracts?",
  ]
}

/* ── Command Center ─────────────────────────────────────────────────────── */
function TrendsView({ onTabChange, isAskHarveyOpen, setIsAskHarveyOpen }: {
  onTabChange: (tab: CITab) => void
  isAskHarveyOpen: boolean
  setIsAskHarveyOpen: (open: boolean) => void
}) {
  const inReviewCount = allContracts.filter((c) => c.status === 'In Review').length
  const sentBackCount = triageContracts.filter((c) => c.triageStatus === 'sent-back').length
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const reviewingContract = reviewingId ? escalations.find((e) => e.id === reviewingId) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Performance strip — top of page */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
          <div style={{ width: 38, height: 38, borderRadius: hy.radius.md, background: hy.ui.success.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color={hy.ui.success.fg} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Avg turnaround"}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: hy.ui.success.fg, lineHeight: 1 }}>24h</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: hy.ui.success.fg }}>3×</span>
              <span style={{ fontSize: 11, color: hy.fg.muted }}>{"faster · was 72h SLA"}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
          <div style={{ width: 38, height: 38, borderRadius: hy.radius.md, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={16} color={hy.ui.blue.fg} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Business self-serve"}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: hy.ui.blue.fg, lineHeight: 1 }}>73%</span>
              <span style={{ fontSize: 11, color: hy.fg.muted }}>{"closed without escalation"}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
          <div style={{ width: 38, height: 38, borderRadius: hy.radius.md, background: hy.ui.gold.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={16} color={hy.ui.gold.fg} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{"Pipeline value"}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: hy.ui.gold.fg, lineHeight: 1 }}>$17M+</span>
              <span style={{ fontSize: 11, color: hy.fg.muted }}>{"active + in review"}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Agent cards — Contract Agent full row, then Playbook + Clause below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Contract Agent (full width) ── */}
        <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 18px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: hy.radius.md, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Inbox size={14} color={hy.ui.blue.fg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: hy.fg.base }}>{"Contract Agent"}</div>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{"Triage, classify, and review contracts"}</div>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: hy.ui.blue.fg, lineHeight: 1 }}>{sentBackCount + inReviewCount}</div>
              <div style={{ fontSize: 10, color: hy.fg.muted }}>{"active"}</div>
            </div>
          </div>

          {/* 2-column internal layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr' }}>

            {/* ── Section 1: Triage ── */}
            <div style={{ borderRight: `1px solid ${hy.border.base}` }}>
              <div style={{ padding: '10px 18px', background: hy.bg.component, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: hy.ui.blue.fg }}>1</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Triage"}</span>
                <span style={{ fontSize: 11, color: hy.fg.muted }}>{"Fully automated or needs legal"}</span>
              </div>

              {/* Flat triage list */}
              {triageContracts.map((c, i) => {
                const sc = triageStatusColor[c.triageStatus]
                const isInProgress = c.triageStatus === 'classifying'
                return (
                  <div key={c.id} style={{ padding: '10px 18px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isInProgress && (
                        <span className="relative flex size-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex size-full rounded-full opacity-75" style={{ background: sc.fg }} />
                          <span className="relative inline-flex size-1.5 rounded-full" style={{ background: sc.fg }} />
                        </span>
                      )}
                      {!isInProgress && <CheckCircle size={9} color={sc.fg} />}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: sc.bg, color: sc.fg }}>
                        {triageStatusLabel[c.triageStatus]}
                      </span>
                      {c.playbookMatch && (
                        <>
                          <span style={{ fontSize: 10, color: hy.fg.muted }}>·</span>
                          <BookOpen size={9} color={hy.fg.muted} />
                          <span style={{ fontSize: 10, color: hy.fg.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.playbookMatch}</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              <div style={{ padding: '8px 18px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}` }}>
                <span style={{ fontSize: 11, color: hy.ui.success.fg, fontWeight: 500 }}>{sentBackCount} {"sent back"}</span>
                <span style={{ fontSize: 11, color: hy.fg.muted }}> · 1 {"analyzing"}</span>
              </div>
            </div>

            {/* ── Section 2: Review — Harvey's first pass ── */}
            <div>
              <div style={{ padding: '10px 20px', background: hy.bg.component, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 999, background: hy.ui.warning.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: hy.ui.warning.fg }}>2</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{"Review"}</span>
                <span style={{ fontSize: 11, color: hy.fg.muted }}>{"Harvey analyzed · attorney review needed"}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: hy.fg.muted }}>{"Tools:"}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: hy.ui.danger.bg, color: hy.ui.danger.fg }}>{"Playbooks"}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: hy.ui.gold.bg, color: hy.ui.gold.fg }}>{"Clause Library"}</span>
                </div>
              </div>

              {escalations.map((esc, i) => {
                const risk = riskColors[esc.riskLevel]
                const isReviewing = reviewingId === esc.id
                const topIssue = esc.keyIssues[0]
                return (
                  <div key={esc.id} style={{ padding: '10px 20px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: risk.bg, color: risk.fg, flexShrink: 0 }}>{risk.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{esc.name}</span>
                      </div>
                      {topIssue ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          <Zap size={9} color={hy.ui.blue.fg} style={{ marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: hy.ui.blue.fg, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{topIssue.issue}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={9} color={hy.ui.success.fg} />
                          <span style={{ fontSize: 10, color: hy.ui.success.fg }}>{"No issues found — within all playbook standards"}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewingId(isReviewing ? null : esc.id)}
                      style={{ fontSize: 11, fontWeight: 600, color: isReviewing ? hy.fg.muted : hy.bg.base, background: isReviewing ? hy.bg.component : hy.fg.base, border: `1px solid ${isReviewing ? hy.border.base : hy.fg.base}`, borderRadius: hy.radius.sm, padding: '5px 13px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}
                    >
                      {isReviewing ? "Close" : "Review →"}
                    </button>
                  </div>
                )
              })}

              <div style={{ padding: '8px 20px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}` }}>
                <button type="button" onClick={() => onTabChange('escalations')} style={{ fontSize: 11, color: hy.fg.subtle, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {`See all ${inReviewCount} contracts →`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Playbook + Clause Agents (2-column row) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>

        {/* ── Playbook Agent ── */}
        <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 18px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: hy.radius.md, background: hy.ui.danger.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={14} color={hy.ui.danger.fg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: hy.fg.base }}>{"Playbook Agent"}</div>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{"Recommends rule updates from contract trends"}</div>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: hy.ui.danger.fg, lineHeight: 1 }}>{playbooksNeedingUpdate}</div>
              <div style={{ fontSize: 10, color: hy.fg.muted }}>{"to update"}</div>
            </div>
          </div>

          {/* Rule rows */}
          {playbooks.filter((p) => p.status === 'needs-update').flatMap((p) => p.rules).slice(0, 3).map((rule, i) => {
            const reason = ruleReasonMap[rule.reason]
            return (
              <div key={rule.id} style={{ padding: '9px 18px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{rule.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 999, background: reason.bg, color: reason.fg }}>{reason.label}</span>
                    <span style={{ fontSize: 10, color: hy.fg.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{rule.currentPosition}</span>
                  </div>
                </div>
                <button type="button" onClick={() => onTabChange('playbooks')} style={{ fontSize: 10, fontWeight: 600, color: hy.ui.blue.fg, background: hy.ui.blue.bg, border: 'none', borderRadius: hy.radius.sm, padding: '3px 8px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                  {"Update →"}
                </button>
              </div>
            )
          })}

          {/* Footer */}
          <div style={{ padding: '7px 18px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <button type="button" onClick={() => onTabChange('playbooks')} style={{ fontSize: 11, color: hy.fg.subtle, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {`See all ${playbooks.filter(p => p.status !== 'healthy').reduce((s, p) => s + p.rules.length, 0)} rule recommendations →`}
            </button>
          </div>
        </div>

        {/* ── Clause Agent ── */}
        <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 18px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: hy.radius.md, background: hy.ui.gold.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Library size={14} color={hy.ui.gold.fg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: hy.fg.base }}>{"Clause Agent"}</div>
              <div style={{ fontSize: 11, color: hy.fg.muted }}>{"Recommends golden position updates from trends"}</div>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: hy.ui.gold.fg, lineHeight: 1 }}>{clausesWithSuggestedUpdate}</div>
              <div style={{ fontSize: 10, color: hy.fg.muted }}>{"drifting"}</div>
            </div>
          </div>

          {/* Clause rows */}
          {goldenClauses.filter((c) => c.suggestedUpdate).slice(0, 3).map((cl, i) => {
            const trendColor = cl.trendDirection === 'falling' ? hy.ui.danger : hy.ui.warning
            return (
              <div key={cl.id} style={{ padding: '9px 18px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{cl.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: trendColor.bg, color: trendColor.fg, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                      {cl.acceptanceRate}%{cl.trendDirection === 'falling' ? ' ↓' : ''}
                    </span>
                  </div>
                  {cl.sourceAttribution && (
                    <div style={{ fontSize: 10, color: hy.fg.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{cl.sourceAttribution}</div>
                  )}
                </div>
                <button type="button" onClick={() => onTabChange('clauses')} style={{ fontSize: 10, fontWeight: 600, color: hy.ui.blue.fg, background: hy.ui.blue.bg, border: 'none', borderRadius: hy.radius.sm, padding: '3px 8px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                  {"Update →"}
                </button>
              </div>
            )
          })}

          {/* Footer */}
          <div style={{ padding: '7px 18px', background: hy.bg.subtle, borderTop: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <button type="button" onClick={() => onTabChange('clauses')} style={{ fontSize: 11, color: hy.fg.subtle, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {`See all ${clausesWithSuggestedUpdate} position updates →`}
            </button>
          </div>
        </div>

        </div>{/* end 2-col Playbook+Clause row */}

      </div>{/* end agent cards flex column */}

      {/* Inline document review workspace */}
      {reviewingContract && (
        <div style={{ borderRadius: hy.radius.lg, border: `2px solid ${hy.ui.warning.fg}`, overflow: 'hidden' }}>
          {/* Review header */}
          <div style={{ padding: '12px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: hy.radius.md, background: hy.ui.warning.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={13} color={hy.ui.warning.fg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: hy.fg.base }}>{reviewingContract.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: riskColors[reviewingContract.riskLevel].bg, color: riskColors[reviewingContract.riskLevel].fg }}>{riskColors[reviewingContract.riskLevel].label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Zap size={9} color={hy.ui.blue.fg} />
                <span style={{ fontSize: 11, color: hy.ui.blue.fg, fontWeight: 500 }}>{"Harvey reviewed against playbooks + golden clauses"}</span>
                <span style={{ fontSize: 11, color: hy.fg.muted }}>· {reviewingContract.counterparty} · {reviewingContract.value}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Button size="small"><CheckSquare size={12} /> {"Approve & send back"}</Button>
              <Button size="small" variant="outline">{"Redline with Harvey"}</Button>
              <button type="button" onClick={() => setReviewingId(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: hy.radius.sm, background: 'none', border: `1px solid ${hy.border.base}`, cursor: 'pointer' }}>
                <X size={13} color={hy.fg.muted} />
              </button>
            </div>
          </div>

          {/* Two-column: document + analysis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 420 }}>

            {/* Left: Document viewer */}
            <div style={{ borderRight: `1px solid ${hy.border.base}`, padding: '24px 32px', background: hy.bg.base, fontFamily: 'Georgia, serif', overflowY: 'auto' as const }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 16, fontFamily: 'system-ui' }}>{"Document"}</div>
              <p style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.8, marginBottom: 16 }}>
                {"This Agreement is entered into as of the date last signed below (the \u201cEffective Date\u201d) between the parties identified in the Order Form."}
              </p>
              <p style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.8, marginBottom: 16 }}>
                {"1. SERVICES. Provider shall deliver the services described in the applicable Order Form. All deliverables shall be deemed works-for-hire."}
              </p>
              {/* Issue highlight 1 */}
              {reviewingContract.keyIssues[0] && (
                <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
                  <span style={{ background: hy.ui.danger.bg, color: hy.fg.base, borderRadius: 3, padding: '1px 3px' }}>
                    {"8.3 BRAND SAFETY. Either party retains the unilateral right to remove content for brand safety reasons without liability or notice to the other party. Counterparty may additionally invoke brand safety obligations for content deemed harmful under mutual agreement standards."}
                  </span>
                  {' '}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: hy.ui.danger.bg, borderRadius: 4, padding: '2px 6px', cursor: 'default', fontFamily: 'system-ui', fontSize: 10, fontWeight: 600, color: hy.ui.danger.fg }}>
                    ⚠ {reviewingContract.keyIssues[0].clause}
                  </span>
                </p>
              )}
              <p style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.8, marginBottom: 16 }}>
                {"9. LIABILITY. Each party's total liability shall not exceed the amounts paid in the prior three (3) months. This cap shall not apply to gross negligence or willful misconduct."}
              </p>
              {/* Issue highlight 2 */}
              {reviewingContract.keyIssues[1] && (
                <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
                  <span style={{ background: hy.ui.warning.bg, color: hy.fg.base, borderRadius: 3, padding: '1px 3px' }}>
                    {"12.1 DATA RIGHTS. Counterparty may use performance data for analytics, reporting, and optimization purposes, including the training and improvement of automated systems and models."}
                  </span>
                  {' '}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: hy.ui.warning.bg, borderRadius: 4, padding: '2px 6px', cursor: 'default', fontFamily: 'system-ui', fontSize: 10, fontWeight: 600, color: hy.ui.warning.fg }}>
                    ⚠ {reviewingContract.keyIssues[1].clause}
                  </span>
                </p>
              )}
              <p style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.8 }}>
                {"13. TERM. This Agreement commences on the Effective Date and continues for twelve (12) months unless earlier terminated as provided herein."}
              </p>
            </div>

            {/* Right: Harvey analysis sidebar */}
            <div style={{ background: hy.bg.subtle, padding: '20px 18px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{"Harvey's Analysis"}</div>

              {/* Summary */}
              <div style={{ padding: '10px 12px', borderRadius: hy.radius.md, background: hy.ui.blue.bg, border: `1px solid ${hy.ui.blue.fg}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <Zap size={11} color={hy.ui.blue.fg} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.blue.fg }}>{"Harvey's summary"}</span>
                </div>
                <p style={{ fontSize: 12, color: hy.ui.blue.fg, lineHeight: 1.5, margin: 0 }}>{reviewingContract.harveyNote}</p>
              </div>

              {/* Action items */}
              {reviewingContract.keyIssues.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>{"AI suggestions · click to apply"}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {reviewingContract.keyIssues.map((issue, idx) => (
                      <div key={idx} style={{ background: hy.bg.base, borderRadius: hy.radius.md, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={11} color={hy.ui.danger.fg} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{issue.clause}</span>
                        </div>
                        <div style={{ padding: '8px 12px' }}>
                          <p style={{ fontSize: 11, color: hy.fg.subtle, lineHeight: 1.45, marginBottom: 8 }}>{issue.issue}</p>
                          <div style={{ padding: '7px 9px', borderRadius: hy.radius.sm, background: hy.ui.blue.bg, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                              <Zap size={10} color={hy.ui.blue.fg} style={{ marginTop: 1, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: hy.ui.blue.fg, lineHeight: 1.4 }}>{issue.recommendation}</span>
                            </div>
                          </div>
                          <Button size="small" className="w-full justify-center">
                            <CheckSquare size={11} /> {"Apply suggestion"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* ── PlaybooksView ──────────────────────────────────────────────────────── */
function PlaybooksView() {
  const [expandedId, setExpandedId] = useState<string | null>(playbooks.find((p) => p.status === 'needs-update')?.id ?? null)
  const rulesNeedingUpdate = playbooks.reduce((sum, p) => sum + (p.status === 'needs-update' ? p.rules.length : 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Tool context banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: hy.radius.md, background: hy.bg.subtle, border: `1px solid ${hy.border.base}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}33` }}>
          <Shield size={11} color={hy.ui.warning.fg} />
          <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.warning.fg }}>{"Contract Review Agent tool"}</span>
        </div>
        <span style={{ fontSize: 12, color: hy.fg.subtle }}>
          {"Harvey uses these playbooks to review every incoming contract. Keep rules current so the Review Agent applies the right standards."}
        </span>
        <div style={{ marginLeft: 'auto', textAlign: 'right' as const, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: playbooksNeedingUpdate > 0 ? hy.ui.danger.fg : hy.ui.success.fg }}>{rulesNeedingUpdate} rule{rulesNeedingUpdate !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: 11, color: hy.fg.muted }}> {"flagged for update"}</span>
        </div>
      </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
      {/* Column headers */}
      <div style={{ padding: '8px 20px', display: 'grid', gridTemplateColumns: '1fr 90px 80px 100px 44px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
        {["Playbook", "Type", "Updated", "Status", ""].map((h) => (
          <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>

      {playbooks.map((pb, i) => {
        const status = playbookStatusMap[pb.status]
        const isExpanded = expandedId === pb.id
        const rulesNeedingChange = pb.rules.length

        return (
          <div key={pb.id} style={{ borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', borderLeft: pb.status === 'needs-update' ? `3px solid ${hy.ui.danger.fg}` : pb.status === 'monitor' ? `3px solid ${hy.ui.warning.fg}` : `3px solid transparent` }}>
            {/* Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 100px 44px', gap: 12, alignItems: 'center', padding: '13px 20px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base }}>{pb.name}</div>
                <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 2 }}>
                  {pb.version} · {pb.totalRules} rules
                  {rulesNeedingChange > 0 && (
                    <span style={{ marginLeft: 6, fontWeight: 600, color: pb.status === 'needs-update' ? hy.ui.danger.fg : hy.ui.warning.fg }}>
                      · {rulesNeedingChange} {rulesNeedingChange === 1 ? 'rule' : 'rules'} to update
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, color: hy.fg.subtle }}>{pb.type}</span>
              <span style={{ fontSize: 11, color: hy.fg.muted }}>{pb.lastUpdated}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: status.bg, color: status.fg, display: 'inline-block', width: 'fit-content' }}>{status.label}</span>
              {pb.rules.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : pb.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: hy.radius.sm, background: 'none', border: `1px solid ${hy.border.base}`, cursor: 'pointer' }}
                >
                  <ChevronDown size={13} color={hy.fg.muted} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                </button>
              ) : <div />}
            </div>

            {/* Expanded rules */}
            {isExpanded && pb.rules.length > 0 && (
              <div style={{ margin: '0 20px 16px', borderRadius: hy.radius.md, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: hy.fg.subtle }}>{"Rules to update"}</span>
                </div>
                {pb.rules.map((rule, ri) => {
                  const reason = ruleReasonMap[rule.reason]
                  return (
                    <div key={rule.id} style={{ padding: '14px', borderTop: ri > 0 ? `1px solid ${hy.border.base}` : 'none', background: hy.bg.base }}>
                      {/* Rule header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{rule.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: reason.bg, color: reason.fg }}>{reason.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: hy.fg.muted }}>
                            {"Current:"} <span style={{ color: hy.fg.subtle }}>{rule.currentPosition}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {rule.impactArea.map((area) => (
                            <span key={area} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: hy.bg.component, color: hy.fg.muted }}>{area}</span>
                          ))}
                        </div>
                      </div>
                      {/* Why change */}
                      <div style={{ padding: '8px 10px', borderRadius: hy.radius.sm, background: reason.bg + '66', marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: reason.fg, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{"Why update"}</div>
                        <div style={{ fontSize: 11, color: hy.fg.subtle, lineHeight: 1.5 }}>{rule.insight}</div>
                      </div>
                      {/* Recommendation */}
                      <div style={{ padding: '8px 10px', borderRadius: hy.radius.sm, background: hy.ui.blue.bg, marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: hy.ui.blue.fg, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Zap size={9} /> {"Harvey recommends"}
                        </div>
                        <div style={{ fontSize: 11, color: hy.ui.blue.fg, lineHeight: 1.5 }}>{rule.recommendedPosition}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small">{"Update rule"}</Button>
                        <Button size="small" variant="outline">{"See affected contracts"}</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
    </div>
  )
}

/* ── ClausesView (Golden Clause Library) ────────────────────────────────── */
function ClausesView() {
  const [activeFilter, setActiveFilter] = useState<ClauseCategory | 'All'>('All')
  const filters: Array<ClauseCategory | 'All'> = ['All', 'Liability', 'Privacy', 'IP', 'Commercial', 'AI/ML', 'Platform']
  const visible = activeFilter === 'All' ? goldenClauses : goldenClauses.filter((c) => c.category === activeFilter)
  const withUpdates = goldenClauses.filter((c) => c.suggestedUpdate).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Tool context banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: hy.radius.md, background: hy.bg.subtle, border: `1px solid ${hy.border.base}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: hy.ui.warning.bg, border: `1px solid ${hy.ui.warning.fg}33`, flexShrink: 0 }}>
          <Shield size={11} color={hy.ui.warning.fg} />
          <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.warning.fg }}>{"Contract Review Agent tool"}</span>
        </div>
        <span style={{ fontSize: 12, color: hy.fg.subtle }}>
          {"These are your approved golden clause positions — Harvey benchmarks every contract in review against these standards. "}
          <span style={{ fontWeight: 600, color: withUpdates > 0 ? hy.ui.warning.fg : hy.ui.success.fg }}>
            {withUpdates > 0 ? `${withUpdates} clauses have suggested updates from recent contract trends — update the standard so the Review Agent uses current positions.` : 'All clauses are current.'}
          </span>
        </span>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
        {filters.map((f) => {
          const isActive = activeFilter === f
          const color = f !== 'All' ? categoryColors[f as ClauseCategory] : hy.ui.neutral
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, padding: '4px 12px', borderRadius: 999, background: isActive ? color.bg : hy.bg.base, color: isActive ? color.fg : hy.fg.muted, border: `1px solid ${isActive ? color.fg + '44' : hy.border.base}`, cursor: 'pointer' }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Golden clause table */}
      <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
        <div style={{ padding: '8px 20px', display: 'grid', gridTemplateColumns: '1fr 90px 1fr 80px 80px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
          {["Clause", "Category", "Your golden position", "Acceptance", "Trend"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>
        {visible.map((cl, i) => {
          const cat = categoryColors[cl.category]
          const hasSuggestedUpdate = !!cl.suggestedUpdate
          return (
            <div key={cl.id} style={{ borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', borderLeft: hasSuggestedUpdate ? `3px solid ${hy.ui.warning.fg}` : `3px solid transparent` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr 80px 80px', gap: 12, alignItems: 'start', padding: '13px 20px' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, marginBottom: 2 }}>{cl.name}</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted }}>{`Used in:`} {cl.linkedPlaybooks.join(', ')}</div>
                  {hasSuggestedUpdate && (
                    <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: hy.radius.xs, background: hy.ui.warning.bg }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: hy.ui.warning.fg, marginBottom: 2 }}>{"Suggested update"}</div>
                      <div style={{ fontSize: 11, color: hy.ui.warning.fg }}>{cl.suggestedUpdate}</div>
                    </div>
                  )}
                  {cl.note && !hasSuggestedUpdate && (
                    <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 3 }}>{cl.note}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 999, background: cat.bg, color: cat.fg, display: 'inline-block', width: 'fit-content', marginTop: 2 }}>{cl.category}</span>
                <span style={{ fontSize: 11, color: hy.fg.subtle, lineHeight: 1.5, marginTop: 2 }}>{cl.goldenPosition}</span>
                <div style={{ marginTop: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: cl.acceptanceRate < 50 ? hy.ui.danger.fg : cl.acceptanceRate < 70 ? hy.ui.warning.fg : hy.ui.success.fg }}>
                    {cl.acceptanceRate}%
                  </span>
                  <div style={{ fontSize: 10, color: hy.fg.muted }}>{"accepted"}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {cl.trendDirection === 'falling'
                    ? <TrendingDown size={11} color={hy.ui.danger.fg} />
                    : cl.trendDirection === 'rising'
                      ? <TrendingUp size={11} color={hy.ui.success.fg} />
                      : <span style={{ fontSize: 11, color: hy.fg.muted }}>—</span>}
                  {cl.trendDirection !== 'stable' && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: cl.trendDirection === 'falling' ? hy.ui.danger.fg : hy.ui.success.fg }}>
                      {cl.trendDirection === 'falling' ? '−' : '+'}{cl.trendPct}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── EscalationsView ────────────────────────────────────────────────────── */
function EscalationsView() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const pending = escalations.filter((e) => e.riskLevel !== 'low')
  const ready   = escalations.filter((e) => e.riskLevel === 'low')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Workflow banner */}
      <div style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, background: hy.bg.subtle, display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: hy.ui.success.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={13} color={hy.ui.success.fg} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.success.fg }}>{"Business submitted"}</div>
            <div style={{ fontSize: 10, color: hy.fg.muted }}>{"Teams, email, or Spaces"}</div>
          </div>
        </div>
        <div style={{ width: 32, height: 1, background: hy.border.base, margin: '0 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={12} color={hy.ui.blue.fg} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: hy.ui.blue.fg }}>{"Harvey reviewed"}</div>
            <div style={{ fontSize: 10, color: hy.fg.muted }}>{"playbooks · golden clauses"}</div>
          </div>
        </div>
        <div style={{ width: 32, height: 1, background: hy.border.base, margin: '0 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: hy.ui.warning.bg, border: `2px solid ${hy.ui.warning.fg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: hy.ui.warning.fg }}>3</span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: hy.ui.warning.fg }}>{"Your decision"}</div>
            <div style={{ fontSize: 10, color: hy.fg.muted }}>{pending.length} {"to review · "}{ready.length} {"ready"}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: hy.bg.base, border: `1px solid ${hy.border.base}` }}>
          <Users size={10} color={hy.fg.muted} />
          <span style={{ fontSize: 10, color: hy.fg.muted }}>{"Business owns the contract · legal reviews escalations only"}</span>
        </div>
      </div>

      {/* Contract list */}
      <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
        <div style={{ padding: '8px 20px', display: 'grid', gridTemplateColumns: '1fr 180px 130px 90px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
          {["Contract", "Submitted by", "Source", "Action"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {escalations.map((esc, i) => {
          const risk = riskColors[esc.riskLevel]
          const isExpanded = expandedId === esc.id
          return (
            <div key={esc.id} style={{ borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', borderLeft: esc.riskLevel === 'high' ? `3px solid ${hy.ui.danger.fg}` : esc.riskLevel === 'medium' ? `3px solid ${hy.ui.warning.fg}` : `3px solid ${hy.ui.success.fg}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 130px 90px', gap: 12, alignItems: 'center', padding: '12px 20px', background: esc.riskLevel === 'high' ? `${hy.ui.danger.bg}33` : esc.riskLevel === 'medium' ? `${hy.ui.warning.bg}33` : 'transparent' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{esc.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999, background: risk.bg, color: risk.fg, flexShrink: 0 }}>{risk.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, color: hy.fg.muted }}>{esc.counterparty} · {esc.type} · {esc.value}</span>
                    <span style={{ fontSize: 10, color: hy.fg.muted }}>·</span>
                    <Clock size={9} color={hy.fg.muted} />
                    <span style={{ fontSize: 10, color: hy.fg.muted }}>{esc.submittedAgo} ago</span>
                    <span style={{ fontSize: 10, color: hy.fg.muted }}>·</span>
                    <Zap size={9} color={hy.ui.blue.fg} />
                    <span style={{ fontSize: 10, color: hy.fg.muted }}>Harvey <span style={{ color: hy.ui.blue.fg }}>{esc.harveyReviewedAgo} ago</span></span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: hy.ui.blue.fg }}>{esc.submittedBy.split(' ').map((n) => n[0]).join('')}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{esc.submittedBy}</div>
                    <div style={{ fontSize: 10, color: hy.fg.muted }}>{esc.dept}</div>
                  </div>
                </div>
                <IntakeSourceBadge source={esc.intakeSource} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {esc.riskLevel === 'low' ? (
                    <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: hy.ui.success.fg, background: hy.ui.success.bg, border: 'none', borderRadius: hy.radius.sm, padding: '5px 12px', cursor: 'pointer' }}>
                      <CheckSquare size={10} /> {"Approve"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : esc.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: hy.bg.base, background: hy.fg.base, border: 'none', borderRadius: hy.radius.sm, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      {isExpanded ? "Close" : "Review"}
                      {!isExpanded && <ChevronRight size={11} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded review workspace */}
              {isExpanded && (
                <div style={{ margin: '0 20px 16px', borderRadius: hy.radius.md, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: hy.ui.blue.bg, borderBottom: `1px solid ${hy.border.base}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Zap size={12} color={hy.ui.blue.fg} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: hy.ui.blue.fg }}>{"Harvey's first pass — reviewed against playbooks & golden clauses"}</span>
                  </div>
                  <div style={{ padding: '12px 14px', fontSize: 12, color: hy.fg.subtle, lineHeight: 1.6, borderBottom: `1px solid ${hy.border.base}`, background: hy.bg.base }}>
                    {esc.harveyNote}
                  </div>
                  {esc.keyIssues.length > 0 && (
                    <div style={{ padding: '12px 14px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>{"Action items"}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {esc.keyIssues.map((issue, idx) => (
                          <div key={idx} style={{ background: hy.bg.base, borderRadius: hy.radius.sm, border: `1px solid ${hy.border.base}`, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Shield size={11} color={hy.ui.danger.fg} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>{issue.clause}</span>
                            </div>
                            <div style={{ fontSize: 12, color: hy.fg.subtle, marginBottom: 6, lineHeight: 1.45 }}>{issue.issue}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 8px', borderRadius: hy.radius.xs, background: hy.ui.blue.bg }}>
                              <Zap size={10} color={hy.ui.blue.fg} style={{ marginTop: 1, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: hy.ui.blue.fg, lineHeight: 1.45 }}>{issue.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '12px 14px', background: hy.bg.base }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 10 }}>{"Your decision"}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                      <Button size="small"><CheckSquare size={11} /> {"Approve & send back"}</Button>
                      <Button size="small" variant="outline">{"Redline with Harvey"}</Button>
                      <Button size="small" variant="outline" style={{ color: hy.ui.warning.fg }}><Send size={11} /> {"Send back to"} {esc.submittedBy}</Button>
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

/* ── AllContractsView ───────────────────────────────────────────────────── */
function AllContractsView() {
  const [activeStatus, setActiveStatus] = useState<ContractStatus | 'All'>('All')
  const statuses: Array<ContractStatus | 'All'> = ['All', 'In Review', 'Awaiting Signature', 'Drafting', 'Active', 'Executed']
  const visible = activeStatus === 'All' ? allContracts : allContracts.filter((c) => c.status === activeStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Status filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
        {statuses.map((s) => {
          const isActive = activeStatus === s
          const color = s !== 'All' ? contractStatusColor[s] : hy.ui.neutral
          const count = s === 'All' ? allContracts.length : allContracts.filter((c) => c.status === s).length
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActiveStatus(s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: isActive ? 600 : 400, padding: '4px 12px', borderRadius: 999, background: isActive ? color.bg : hy.bg.base, color: isActive ? color.fg : hy.fg.muted, border: `1px solid ${isActive ? color.fg + '44' : hy.border.base}`, cursor: 'pointer' }}
            >
              {s}
              <span style={{ fontSize: 10, fontWeight: 600, padding: '0px 4px', borderRadius: 999, background: isActive ? color.fg + '22' : hy.bg.component, color: isActive ? color.fg : hy.fg.muted }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}`, overflow: 'hidden' }}>
        <div style={{ padding: '8px 20px', display: 'grid', gridTemplateColumns: '1fr 100px 140px 130px 80px 60px', gap: 12, background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
          {["Contract", "Type", "Submitted by", "Source", "Status", "Value"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>
        {visible.map((c, i) => {
          const statusDef = contractStatusColor[c.status]
          const isOverdue = (c.status === 'In Review' || c.status === 'Drafting') && c.daysOpen > 1
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 130px 80px 60px', gap: 12, alignItems: 'center', padding: '11px 20px', borderTop: i > 0 ? `1px solid ${hy.border.base}` : 'none', borderLeft: isOverdue ? `3px solid ${hy.ui.warning.fg}` : '3px solid transparent' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</div>
                <div style={{ fontSize: 10, color: hy.fg.muted, marginTop: 1 }}>
                  {c.counterparty} · {c.submittedDate}
                  {c.daysOpen > 0 && <span style={{ marginLeft: 5, color: isOverdue ? hy.ui.warning.fg : hy.fg.muted }}>{c.daysOpen}d open</span>}
                </div>
              </div>
              <span style={{ fontSize: 11, color: hy.fg.subtle }}>{c.type}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: hy.ui.blue.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: hy.ui.blue.fg }}>{c.submittedBy.split(' ').map((n) => n[0]).join('')}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: hy.fg.base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.submittedBy}</div>
                  <div style={{ fontSize: 10, color: hy.fg.muted }}>{c.dept}</div>
                </div>
              </div>
              <IntakeSourceBadge source={c.intakeSource} />
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: statusDef.bg, color: statusDef.fg, display: 'inline-block', width: 'fit-content' }}>{statusDef.label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: hy.fg.subtle }}>{c.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Tab nav ────────────────────────────────────────────────────────────── */
const TABS: Array<{ id: CITab; label: string; count?: number; countColor?: { fg: string; bg: string } }> = [
  { id: 'trends',      label: 'Command Center' },
  { id: 'playbooks',   label: 'Playbooks',      count: playbooksNeedingUpdate,       countColor: hy.ui.danger },
  { id: 'clauses',     label: 'Clause Library', count: clausesWithSuggestedUpdate,   countColor: hy.ui.warning },
  { id: 'escalations', label: 'Escalations',    count: escalationsPendingReview,     countColor: hy.ui.warning },
  { id: 'contracts',   label: 'All Contracts',  count: allContracts.length,          countColor: hy.ui.neutral },
]

/* ── Page root ──────────────────────────────────────────────────────────── */
export function MetaContractIntelligencePage() {
  const { section } = useParams<{ section: string }>()
  const router = useRouter()

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
      return "Based on your current playbook configuration, I\u2019ve identified 2 playbooks that need attention:\n\n1. **Enterprise SaaS Playbook** \u2014 3 rules require updates due to recent regulatory changes\n2. **NDA Standard Playbook** \u2014 1 rule flagged for review\n\nWould you like me to draft updated rule language for either of these?"
    if (q.includes('clause') || q.includes('risk') || q.includes('liability'))
      return "Analyzing your clause library against recent negotiation data:\n\n\u2022 **Indemnification** \u2014 High risk, 58% accept rate, trending contested\n\u2022 **Liability cap** \u2014 Low risk, 86% accept rate, stable\n\u2022 **Termination for cause** \u2014 Low risk, 91% accept rate\n\nWould you like me to suggest updated fallback language for the high-risk clauses?"
    if (q.includes('contract') || q.includes('pipeline') || q.includes('review'))
      return "Current pipeline status:\n\n\u2022 **8 contracts** auto-reviewed by Harvey \u2014 no escalation needed\n\u2022 **3 contracts** need your review \u2014 flagged issues include uncapped liability, broad IP assignment, and missing data processing terms\n\nWould you like me to prioritize these by risk level?"
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

  const activeTab: CITab =
    section === 'playbooks'   ? 'playbooks' :
    section === 'clauses'     ? 'clauses' :
    section === 'escalations' ? 'escalations' :
    section === 'contracts'   ? 'contracts' :
    'trends'

  const handleTabChange = (tab: CITab) => {
    router.push(`/meta-contract-intelligence/${tab}`)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg-base">
      {/* Left side — Header + Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Page Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-base shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm">
              <span className="font-medium text-fg-base" style={{ padding: '4px 6px' }}>Contracts</span>
            </div>
            <div className="group relative">
              <div className="flex cursor-default items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5">
                <span className="relative flex size-1.5">
                  <span className="animate-ping absolute inline-flex size-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
                <span className="text-xs font-medium text-success">{"Synced 2 min ago"}</span>
              </div>
              <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-52 rounded-lg border bg-primary p-3 shadow-lg group-hover:block">
                <div className="mb-2 text-xs font-semibold text-primary">{"Connected systems"}</div>
                {systemIntegrations.map((sys) => (
                  <div key={sys.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: sys.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: sys.abbr === 'DS' ? '#333' : '#fff' }}>{sys.abbr}</span>
                      </div>
                      <span className="text-xs text-primary">{sys.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('size-1.5 rounded-full', sys.status === 'live' ? 'bg-success' : 'bg-warning')} />
                      <span className="text-xs text-muted">{sys.lastSync}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                  <Plus className="h-4 w-4" />
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
            <TrendsView onTabChange={handleTabChange} isAskHarveyOpen={isChatPanelOpen} setIsAskHarveyOpen={setIsChatPanelOpen} />
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
                          <div className="px-3 pb-3"><p className="text-xs leading-4 text-fg-muted">Get started\u2026</p></div>
                          <div className="flex flex-col">
                            {[
                              { icon: '/central_icons/Review.svg', label: 'Review contracts needing attention', prompt: 'Review the contracts that need my attention and summarize the key issues' },
                              { icon: '/central_icons/Review.svg', label: 'Analyze clause risk exposure', prompt: 'Analyze the risk exposure across my clause library and flag high-risk positions' },
                              { icon: '/central_icons/Draft.svg', label: 'Draft playbook rule updates', prompt: 'Draft updated playbook rules based on recent regulatory changes' },
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
                                <span>Review contracts needing attention\u2026</span>
                                <span>Analyze clause risk exposure\u2026</span>
                                <span>Draft playbook rule updates\u2026</span>
                                <span>Summarize pipeline status\u2026</span>
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

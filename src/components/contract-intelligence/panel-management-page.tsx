'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Copy,
  CornerDownLeft,
  Download,
  FileText,
  Filter,
  Lightbulb,
  ListPlus,
  MessageSquare,
  Mic,
  Paperclip,
  Plus,
  PlusCircle,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
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

/* ── Data ────────────────────────────────────────────────────────────────── */

interface PanelFirm {
  id: string
  name: string
  shortName: string
  ytdSpend: number
  budget: number
  matters: number
  flaggedBills: number
  complianceScore: number   // 0–100
  avgRateVariance: number   // % over guidelines
  primaryPractice: string
  trend: 'up' | 'down' | 'flat'
}

const PANEL_FIRMS: PanelFirm[] = [
  {
    id: 'harwick',
    name: 'Harwick & Stone LLP',
    shortName: 'Harwick',
    ytdSpend: 223_000_000,
    budget: 286_000_000,
    matters: 38,
    flaggedBills: 7,
    complianceScore: 78,
    avgRateVariance: 4.2,
    primaryPractice: 'M&A / Commercial',
    trend: 'up',
  },
  {
    id: 'ashbridge',
    name: 'Ashbridge & Wren LLP',
    shortName: 'Ashbridge',
    ytdSpend: 148_000_000,
    budget: 185_000_000,
    matters: 21,
    flaggedBills: 3,
    complianceScore: 91,
    avgRateVariance: 1.1,
    primaryPractice: 'Finance / Capital Markets',
    trend: 'flat',
  },
  {
    id: 'pemberton',
    name: 'Pemberton LLP',
    shortName: 'Pemberton',
    ytdSpend: 91_000_000,
    budget: 112_000_000,
    matters: 6,
    flaggedBills: 1,
    complianceScore: 96,
    avgRateVariance: 0.3,
    primaryPractice: 'High-Stakes Litigation',
    trend: 'flat',
  },
  {
    id: 'voss',
    name: 'Voss Whitfield LLP',
    shortName: 'Voss',
    ytdSpend: 156_000_000,
    budget: 179_000_000,
    matters: 29,
    flaggedBills: 11,
    complianceScore: 64,
    avgRateVariance: 8.7,
    primaryPractice: 'Cross-border Regulatory',
    trend: 'up',
  },
]

interface FlaggedBill {
  id: string
  firmId: string
  invoiceNo: string
  matter: string
  amount: number
  flaggedAmount: number
  submittedDate: string
  status: 'review' | 'disputed' | 'approved'
  flags: string[]
  harveyNote: string
  lineItems: Array<{ description: string; billed: number; guideline: number | null; flagged: boolean }>
}

const FLAGGED_BILLS: FlaggedBill[] = [
  {
    id: 'b1',
    firmId: 'harwick',
    invoiceNo: 'HW-2025-1843',
    matter: 'Corp –Fintech Acquisition (APAC)',
    amount: 8_740_000,
    flaggedAmount: 1_040_000,
    submittedDate: 'Mar 14, 2026',
    status: 'review',
    flags: ['Rate cap exceeded', 'Block billing – 3 entries'],
    harveyNote: 'Partner rate of $1,450/hr exceeds agreed cap of $1,350/hr on 12 entries. Block billing on Mar 3, 8, and 11 entries per billing guidelines §4.2. Recommend disputing $1,040,000.',
    lineItems: [
      { description: 'J. Chen (Partner) – M&A structuring review', billed: 1450, guideline: 1350, flagged: true },
      { description: 'S. Park (Partner) – Regulatory analysis', billed: 1450, guideline: 1350, flagged: true },
      { description: 'T. Williams (Associate) – Due diligence memo', billed: 680, guideline: 700, flagged: false },
      { description: 'Block entry Mar 3: "various matters" 6.0 hrs', billed: 8700, guideline: null, flagged: true },
    ],
  },
  {
    id: 'b2',
    firmId: 'voss',
    invoiceNo: 'VW-2026-0412',
    matter: 'Corp –EU Payment Services Directive compliance',
    amount: 4_580_000,
    flaggedAmount: 1_490_000,
    submittedDate: 'Mar 10, 2026',
    status: 'review',
    flags: ['Non-approved timekeepers', 'Travel billed at full rate', 'Admin tasks billed at lawyer rate'],
    harveyNote: '4 timekeepers not pre-approved per Engagement Letter §3.1. Travel time (14.5 hrs) billed at 100% rate — guidelines require 50% cap. Paralegal admin tasks (filing, coordination) billed at associate rates. Total recoverable: $1,490,000.',
    lineItems: [
      { description: 'R. Müller (Non-approved) – PSD2 analysis', billed: 1200, guideline: null, flagged: true },
      { description: 'A. Dubois – Travel London to Brussels (7.0 hrs)', billed: 8400, guideline: 4200, flagged: true },
      { description: 'L. Zhang (Partner) – Regulatory strategy', billed: 1500, guideline: 1500, flagged: false },
      { description: 'Filing and administrative coordination (paralegal)', billed: 850, guideline: 350, flagged: true },
    ],
  },
  {
    id: 'b3',
    firmId: 'harwick',
    invoiceNo: 'HW-2025-1791',
    matter: 'Corp –Commercial Contracts (EMEA)',
    amount: 2_990_000,
    flaggedAmount: 387_000,
    submittedDate: 'Mar 7, 2026',
    status: 'disputed',
    flags: ['Duplicate entry'],
    harveyNote: 'Duplicate billing detected: Feb 22 entry for "contract review – EMEA MSA" appears twice at $193,500 each. Dispute raised with Harwick & Stone on Mar 9.',
    lineItems: [
      { description: 'MSA contract review – EMEA (Feb 22)', billed: 4100, guideline: 4100, flagged: false },
      { description: 'MSA contract review – EMEA (Feb 22) [DUPLICATE]', billed: 4100, guideline: null, flagged: true },
      { description: 'Negotiation support – counter-party redlines', billed: 6200, guideline: 7000, flagged: false },
    ],
  },
  {
    id: 'b4',
    firmId: 'ashbridge',
    invoiceNo: 'CM-2026-0089',
    matter: 'Corp –Revolving Credit Facility Amendment',
    amount: 6_700_000,
    flaggedAmount: 264_000,
    submittedDate: 'Mar 5, 2026',
    status: 'review',
    flags: ['Rate cap exceeded – 2 entries'],
    harveyNote: 'Two senior associate entries marginally exceed the agreed rate by $80/hr each across 42 matters. Total exposure $264,000. Recommend flagging to Caldwell Merritt for credit on next invoice.',
    lineItems: [
      { description: 'M. Torres (Sr Associate) – Facility docs', billed: 780, guideline: 700, flagged: true },
      { description: 'K. Lee (Sr Associate) – Lender negotiations', billed: 780, guideline: 700, flagged: true },
      { description: 'D. Park (Partner) – Closing coordination', billed: 1100, guideline: 1150, flagged: false },
    ],
  },
]

interface InsourceOpportunity {
  id: string
  taskType: string
  description: string
  firmId: string
  annualBilledEstimate: number
  harveyConfidence: number
  workflowAvailable: boolean
  workflowName?: string
  estimatedSavings: number
}

const INSOURCE_OPPS: InsourceOpportunity[] = [
  {
    id: 'i1',
    taskType: 'NDA Review',
    description: 'Standard mutual NDAs – routine, low complexity, high volume. Harwick billed 148 hrs YTD at partner/associate rates.',
    firmId: 'harwick',
    annualBilledEstimate: 9_900_000,
    harveyConfidence: 96,
    workflowAvailable: true,
    workflowName: 'NDA Playbook Review',
    estimatedSavings: 8_700_000,
  },
  {
    id: 'i2',
    taskType: 'Contract Playbook Compliance Review',
    description: 'Voss Whitfield bills 20–30 hrs/month checking contracts against our own playbooks — Harvey already does this natively.',
    firmId: 'voss',
    annualBilledEstimate: 16_000_000,
    harveyConfidence: 91,
    workflowAvailable: true,
    workflowName: 'Contract Intelligence',
    estimatedSavings: 14_600_000,
  },
  {
    id: 'i3',
    taskType: 'First-pass Due Diligence Summaries',
    description: 'Transactional DD memos – Harwick charges $380–560K per memo. Harvey can produce first-pass in minutes for attorney review.',
    firmId: 'harwick',
    annualBilledEstimate: 19_800_000,
    harveyConfidence: 83,
    workflowAvailable: false,
    estimatedSavings: 12_200_000,
  },
  {
    id: 'i4',
    taskType: 'Regulatory Change Monitoring',
    description: 'Caldwell Merritt bills quarterly for regulatory landscape memos. Harvey can auto-monitor and flag material changes in real time.',
    firmId: 'ashbridge',
    annualBilledEstimate: 8_500_000,
    harveyConfidence: 88,
    workflowAvailable: false,
    estimatedSavings: 6_100_000,
  },
]

interface CollabOpportunity {
  id: string
  taskType: string
  firmId: string
  description: string
  historicalCount: number
  avgCycleTime: string
  suggestedApproach: string
  estimatedTimeSaving: string
}

const COLLAB_OPPS: CollabOpportunity[] = [
  {
    id: 'c1',
    taskType: 'Redline Turnaround',
    firmId: 'harwick',
    description: 'Harvey pre-processes counterparty redlines against playbook before Harwick reviews — cuts first-pass time by ~60%.',
    historicalCount: 94,
    avgCycleTime: '4.2 days',
    suggestedApproach: 'Harvey generates pre-playbook-checked redline + issues memo → Harwick attorney reviews only exceptions',
    estimatedTimeSaving: '~2.5 days per matter',
  },
  {
    id: 'c2',
    taskType: 'Jurisdiction-Specific Clause Research',
    firmId: 'voss',
    description: 'Harvey handles baseline clause research for 12 common jurisdictions; Voss Whitfield provides sign-off on local nuance only.',
    historicalCount: 41,
    avgCycleTime: '6.1 days',
    suggestedApproach: 'Harvey research memo → Voss partner review (est. 1hr vs 8hr) → sign-off',
    estimatedTimeSaving: '~5 hrs per matter',
  },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmt$(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function scoreColor(score: number): { fg: string; bg: string } {
  if (score >= 85) return hy.ui.success
  if (score >= 70) return hy.ui.warning
  return hy.ui.danger
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: hy.bg.base,
      border: `1px solid ${hy.border.base}`,
      borderRadius: hy.radius.lg,
      ...style,
    }}>
      {children}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: { fg: string; bg: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      color: color.fg, background: color.bg,
    }}>
      {label}
    </span>
  )
}

function ScorePill({ score }: { score: number }) {
  const c = scoreColor(score)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      fontSize: 12, fontWeight: 600,
      color: c.fg, background: c.bg,
    }}>
      {score}
    </span>
  )
}

/* ── HUB VIEW ────────────────────────────────────────────────────────────── */

function HubView({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const totalYTD = PANEL_FIRMS.reduce((s, f) => s + f.ytdSpend, 0)
  const totalBudget = PANEL_FIRMS.reduce((s, f) => s + f.budget, 0)
  const totalFlagged = PANEL_FIRMS.reduce((s, f) => s + f.flaggedBills, 0)
  const totalFlaggedAmt = FLAGGED_BILLS.reduce((s, b) => s + b.flaggedAmount, 0)
  const totalInsourceSavings = INSOURCE_OPPS.reduce((s, o) => s + o.estimatedSavings, 0)
  const aiSavingsCapturedYTD = 6_700_000 // previously recovered via Harvey analysis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Top KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          {
            label: 'YTD Spend',
            value: fmt$(totalYTD),
            sub: `${fmt$(totalBudget)} budget · ${Math.round(totalYTD / totalBudget * 100)}% used`,
            icon: CircleDollarSign,
            trend: null,
          },
          {
            label: 'Flagged by Harvey',
            value: `${totalFlagged} bills`,
            sub: `${fmt$(totalFlaggedAmt)} in dispute`,
            icon: AlertTriangle,
            trend: null,
            accent: hy.ui.warning,
          },
          {
            label: 'AI Savings Captured',
            value: fmt$(aiSavingsCapturedYTD),
            sub: 'recovered via billing analysis',
            icon: Sparkles,
            trend: 'up',
            accent: hy.ui.success,
          },
          {
            label: 'Insource Opportunity',
            value: fmt$(totalInsourceSavings),
            sub: `${INSOURCE_OPPS.length} tasks identified`,
            icon: TrendingDown,
            trend: null,
            accent: hy.ui.blue,
          },
        ].map(({ label, value, sub, icon: Icon, trend, accent }) => (
          <Card key={label} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: hy.radius.sm, background: accent ? accent.bg : hy.bg.subtle }}>
                <Icon size={14} color={accent ? accent.fg : hy.fg.subtle} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: hy.fg.base, lineHeight: 1.15, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: hy.fg.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
              {trend === 'up' && <TrendingUp size={11} color={hy.ui.success.fg} />}
              {sub}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Firm health grid + top flags side-by-side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>

        {/* Firm health table */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>Panel Firms</span>
            <button
              onClick={() => onTabChange('guidelines')}
              style={{ fontSize: 12, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Manage guidelines <ChevronRight size={12} />
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: hy.bg.subtle }}>
                {['Firm', 'Practice', 'YTD Spend', 'Budget Used', 'Compliance', 'Flagged', ''].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PANEL_FIRMS.map((firm, i) => {
                const pct = Math.round(firm.ytdSpend / firm.budget * 100)
                const isLast = i === PANEL_FIRMS.length - 1
                return (
                  <tr key={firm.id} style={{ borderBottom: isLast ? 'none' : `1px solid ${hy.border.base}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: hy.fg.base }}>{firm.shortName}</div>
                      <div style={{ fontSize: 12, color: hy.fg.muted }}>{firm.matters} matters</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: hy.fg.subtle }}>{firm.primaryPractice}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: hy.fg.base }}>{fmt$(firm.ytdSpend)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: hy.bg.component, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 90 ? hy.ui.danger.fg : pct > 75 ? hy.ui.warning.fg : hy.ui.success.fg, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, color: hy.fg.subtle, minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ScorePill score={firm.complianceScore} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {firm.flaggedBills > 0 ? (
                        <Badge label={`${firm.flaggedBills} bills`} color={firm.flaggedBills > 5 ? hy.ui.danger : hy.ui.warning} />
                      ) : (
                        <Badge label="Clean" color={hy.ui.success} />
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => onTabChange('bills')}
                        style={{ fontSize: 12, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        Review <ChevronRight size={11} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        {/* Right col: top flagged bills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>Top Flags</span>
              <button
                onClick={() => onTabChange('bills')}
                style={{ fontSize: 12, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                All bills <ChevronRight size={12} />
              </button>
            </div>
            <div>
              {FLAGGED_BILLS.slice(0, 4).map((bill, i) => {
                const firm = PANEL_FIRMS.find(f => f.id === bill.firmId)!
                const isLast = i === 3
                return (
                  <div key={bill.id} style={{ padding: '12px 20px', borderBottom: isLast ? 'none' : `1px solid ${hy.border.base}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{firm.shortName}</span>
                        <span style={{ fontSize: 12, color: hy.fg.muted, marginLeft: 6 }}>{bill.invoiceNo}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: hy.ui.danger.fg }}>–{fmt$(bill.flaggedAmount)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: hy.fg.subtle, marginBottom: 6, lineHeight: 1.4 }}>{bill.matter}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {bill.flags.slice(0, 2).map(f => (
                        <span key={f} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: hy.ui.warning.bg, color: hy.ui.warning.fg }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ── AI Savings Framework ── */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${hy.border.base}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: hy.radius.sm, background: hy.ui.gold.bg }}>
              <Sparkles size={14} color={hy.ui.gold.fg} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: hy.fg.base }}>AI Savings Framework</div>
              <div style={{ fontSize: 12, color: hy.fg.muted }}>Three levers Harvey identifies to reduce outside counsel spend</div>
            </div>
          </div>
          <button
            onClick={() => onTabChange('optimize')}
            style={{ fontSize: 12, color: hy.ui.blue.fg, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Full analysis <ChevronRight size={12} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {[
            {
              icon: AlertTriangle,
              color: hy.ui.warning,
              title: 'Billing Compliance',
              value: fmt$(totalFlaggedAmt),
              sub: 'in recoverable disputes this quarter',
              detail: 'Harvey reviews every invoice against your billing guidelines — catching rate cap breaches, block billing, duplicate entries, and non-approved timekeepers.',
              cta: 'Review flags',
              tab: 'bills',
            },
            {
              icon: TrendingDown,
              color: hy.ui.blue,
              title: 'Insourcing',
              value: fmt$(totalInsourceSavings),
              sub: 'estimated annual savings from insourcing',
              detail: 'High-volume, repeatable tasks (NDA review, playbook checks, DD summaries) that Harvey handles natively — no need to pay outside counsel rates.',
              cta: 'See opportunities',
              tab: 'optimize',
            },
            {
              icon: Zap,
              color: hy.ui.success,
              title: 'Collaboration Efficiency',
              value: '~60%',
              sub: 'reduction in outside counsel review time',
              detail: 'Harvey pre-processes work before it reaches outside counsel — generating issues memos, redline analysis, and clause research — so attorneys only review exceptions.',
              cta: 'See opportunities',
              tab: 'optimize',
            },
          ].map(({ icon: Icon, color, title, value, sub, detail, cta, tab }, i) => (
            <div key={title} style={{ padding: '20px 24px', borderLeft: i > 0 ? `1px solid ${hy.border.base}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: hy.radius.sm, background: color.bg }}>
                  <Icon size={16} color={color.fg} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.subtle }}>{title}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: hy.fg.base, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 12, color: hy.fg.muted, marginBottom: 12 }}>{sub}</div>
              <div style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.55, marginBottom: 14 }}>{detail}</div>
              <button
                onClick={() => onTabChange(tab)}
                style={{ fontSize: 12, fontWeight: 600, color: color.fg, background: color.bg, border: 'none', cursor: 'pointer', padding: '5px 12px', borderRadius: hy.radius.sm, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {cta} <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      </Card>

    </div>
  )
}

/* ── BILL REVIEW TAB ─────────────────────────────────────────────────────── */

function BillReviewTab() {
  const [expandedBill, setExpandedBill] = useState<string | null>('b1')
  const [filterFirm, setFilterFirm] = useState<string>('all')

  const filtered = filterFirm === 'all' ? FLAGGED_BILLS : FLAGGED_BILLS.filter(b => b.firmId === filterFirm)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Filter + upload strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: hy.fg.subtle }}>Filter:</span>
          {(['all', ...PANEL_FIRMS.map(f => f.id)] as string[]).map(id => {
            const label = id === 'all' ? 'All firms' : PANEL_FIRMS.find(f => f.id === id)!.shortName
            return (
              <button
                key={id}
                onClick={() => setFilterFirm(id)}
                style={{
                  fontSize: 13, padding: '4px 12px', borderRadius: hy.radius.sm, cursor: 'pointer',
                  border: `1px solid ${filterFirm === id ? hy.ui.blue.fg : hy.border.base}`,
                  background: filterFirm === id ? hy.ui.blue.bg : hy.bg.base,
                  color: filterFirm === id ? hy.ui.blue.fg : hy.fg.subtle,
                  fontWeight: filterFirm === id ? 600 : 400,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="small">
            <Upload size={13} style={{ marginRight: 4 }} />
            Upload bill
          </Button>
          <Button variant="outline" size="small">
            <Download size={13} style={{ marginRight: 4 }} />
            Export disputes
          </Button>
        </div>
      </div>

      {/* Bill cards */}
      {filtered.map(bill => {
        const firm = PANEL_FIRMS.find(f => f.id === bill.firmId)!
        const isOpen = expandedBill === bill.id
        const statusColor = bill.status === 'disputed' ? hy.ui.danger : bill.status === 'approved' ? hy.ui.success : hy.ui.warning
        const statusLabel = bill.status === 'disputed' ? 'Disputed' : bill.status === 'approved' ? 'Approved' : 'Needs review'

        return (
          <Card key={bill.id} style={{ overflow: 'hidden' }}>
            {/* Header row */}
            <div
              style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => setExpandedBill(isOpen ? null : bill.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: hy.fg.base }}>{firm.name}</span>
                    <span style={{ fontSize: 12, color: hy.fg.muted }}>{bill.invoiceNo}</span>
                    <Badge label={statusLabel} color={statusColor} />
                  </div>
                  <div style={{ fontSize: 13, color: hy.fg.subtle }}>{bill.matter}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: hy.fg.muted }}>Invoice</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: hy.fg.base }}>{fmt$(bill.amount)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: hy.fg.muted }}>Flagged</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: hy.ui.danger.fg }}>–{fmt$(bill.flaggedAmount)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 280 }}>
                  {bill.flags.map(f => (
                    <span key={f} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: hy.ui.warning.bg, color: hy.ui.warning.fg }}>{f}</span>
                  ))}
                </div>
                <ChevronDown size={16} color={hy.fg.muted} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${hy.border.base}` }}>
                {/* Harvey note */}
                <div style={{ padding: '14px 20px 12px', background: hy.ui.gold.bg, borderBottom: `1px solid ${hy.border.base}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: hy.radius.sm, background: hy.ui.gold.fg, flexShrink: 0, marginTop: 1 }}>
                      <Sparkles size={12} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: hy.ui.gold.fg, marginBottom: 4 }}>Harvey\u2019s Analysis</div>
                      <div style={{ fontSize: 13, color: hy.fg.base, lineHeight: 1.6 }}>{bill.harveyNote}</div>
                    </div>
                  </div>
                </div>

                {/* Line items */}
                <div style={{ padding: '12px 20px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Line Items</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: hy.bg.subtle }}>
                        {['Description', 'Billed Rate', 'Guideline', 'Status'].map(h => (
                          <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bill.lineItems.map((li, idx) => (
                        <tr key={idx} style={{ borderTop: `1px solid ${hy.border.base}`, background: li.flagged ? hy.ui.danger.bg + '55' : 'transparent' }}>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: hy.fg.base }}>{li.description}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: li.flagged ? hy.ui.danger.fg : hy.fg.base }}>
                            {typeof li.billed === 'number' && li.billed > 5000 ? fmt$(li.billed) : `$${li.billed.toLocaleString()}`}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: hy.fg.subtle }}>
                            {li.guideline ? `$${li.guideline.toLocaleString()}` : '—'}
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            {li.flagged
                              ? <Badge label="Flagged" color={hy.ui.danger} />
                              : <Badge label="OK" color={hy.ui.success} />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
                  <Button size="small">Raise dispute</Button>
                  <Button variant="outline" size="small">Request credit</Button>
                  <Button variant="outline" size="small">Mark approved</Button>
                  <Button variant="outline" size="small">
                    <MessageSquare size={13} style={{ marginRight: 4 }} />
                    Ask Harvey
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      {filtered.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: hy.fg.muted }}>
          <CheckCircle size={32} color={hy.ui.success.fg} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No flagged bills for this firm</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Harvey hasn\u2019t flagged any billing issues yet.</div>
        </div>
      )}
    </div>
  )
}

/* ── GUIDELINES TAB ──────────────────────────────────────────────────────── */

function GuidelinesTab() {
  const [selectedFirm, setSelectedFirm] = useState('harwick')
  const firm = PANEL_FIRMS.find(f => f.id === selectedFirm)!

  const guidelinesByFirm: Record<string, Array<{ category: string; rules: Array<{ rule: string; status: 'passing' | 'failing' | 'watch' }> }>> = {
    harwick: [
      {
        category: 'Rate Caps',
        rules: [
          { rule: 'Partner rate cap: $1,350/hr', status: 'failing' },
          { rule: 'Senior associate rate cap: $750/hr', status: 'passing' },
          { rule: 'Associate rate cap: $600/hr', status: 'passing' },
          { rule: 'Annual rate increase cap: 5%', status: 'watch' },
        ],
      },
      {
        category: 'Billing Practices',
        rules: [
          { rule: 'No block billing — entries must be itemized', status: 'failing' },
          { rule: 'Minimum time entry: 0.1 hrs', status: 'passing' },
          { rule: 'No billing for internal training or supervision', status: 'passing' },
          { rule: 'Travel time capped at 50% of hourly rate', status: 'passing' },
        ],
      },
      {
        category: 'Staffing',
        rules: [
          { rule: 'All timekeepers must be pre-approved', status: 'passing' },
          { rule: 'No more than 5 timekeepers per matter without approval', status: 'passing' },
          { rule: 'Admin tasks must be billed at paralegal rates', status: 'passing' },
        ],
      },
    ],
    voss: [
      {
        category: 'Rate Caps',
        rules: [
          { rule: 'Partner rate cap: $1,500/hr', status: 'passing' },
          { rule: 'Counsel rate cap: $1,200/hr', status: 'passing' },
          { rule: 'Senior associate rate cap: $900/hr', status: 'passing' },
        ],
      },
      {
        category: 'Billing Practices',
        rules: [
          { rule: 'No block billing', status: 'passing' },
          { rule: 'Travel at 50% rate cap', status: 'failing' },
          { rule: 'Admin tasks at paralegal rates', status: 'failing' },
        ],
      },
      {
        category: 'Staffing',
        rules: [
          { rule: 'Pre-approved timekeepers only', status: 'failing' },
          { rule: 'Max 6 timekeepers per matter', status: 'passing' },
        ],
      },
    ],
    caldwell: [
      {
        category: 'Rate Caps',
        rules: [
          { rule: 'Partner rate cap: $1,400/hr', status: 'watch' },
          { rule: 'Senior associate rate cap: $800/hr', status: 'passing' },
        ],
      },
      {
        category: 'Billing Practices',
        rules: [
          { rule: 'No block billing', status: 'passing' },
          { rule: 'Itemized disbursements required over $500', status: 'passing' },
        ],
      },
    ],
    pemberton: [
      {
        category: 'Rate Caps',
        rules: [
          { rule: 'All rates pre-negotiated per matter', status: 'passing' },
          { rule: 'Disbursement approval required over $2,000', status: 'passing' },
        ],
      },
    ],
  }

  const sections = guidelinesByFirm[selectedFirm] || []
  const scoreC = scoreColor(firm.complianceScore)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

      {/* Firm selector */}
      <Card style={{ padding: 8, alignSelf: 'start' }}>
        {PANEL_FIRMS.map(f => {
          const c = scoreColor(f.complianceScore)
          return (
            <div
              key={f.id}
              onClick={() => setSelectedFirm(f.id)}
              style={{
                padding: '10px 12px', borderRadius: hy.radius.sm, cursor: 'pointer',
                background: selectedFirm === f.id ? hy.ui.blue.bg : 'transparent',
                marginBottom: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: selectedFirm === f.id ? 600 : 400, color: selectedFirm === f.id ? hy.ui.blue.fg : hy.fg.base }}>{f.shortName}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: c.fg, background: c.bg, padding: '1px 6px', borderRadius: 999 }}>{f.complianceScore}</span>
            </div>
          )
        })}
      </Card>

      {/* Guidelines content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: hy.fg.base, marginBottom: 4 }}>{firm.name}</div>
              <div style={{ fontSize: 13, color: hy.fg.subtle }}>{firm.primaryPractice} · {firm.matters} active matters · {fmt$(firm.ytdSpend)} YTD</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: hy.fg.subtle }}>Guideline compliance</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 999, background: scoreC.bg }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: scoreC.fg }}>{firm.complianceScore}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="outline" size="small">
              <Download size={13} style={{ marginRight: 4 }} />
              Download guidelines
            </Button>
            <Button variant="outline" size="small">
              <PlusCircle size={13} style={{ marginRight: 4 }} />
              Add rule
            </Button>
          </div>
        </Card>

        {sections.map(section => (
          <Card key={section.category} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: hy.bg.subtle, borderBottom: `1px solid ${hy.border.base}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>{section.category}</span>
            </div>
            <div>
              {section.rules.map((rule, idx) => {
                const rColor = rule.status === 'passing' ? hy.ui.success : rule.status === 'failing' ? hy.ui.danger : hy.ui.warning
                const rLabel = rule.status === 'passing' ? 'Passing' : rule.status === 'failing' ? 'Breach' : 'Watch'
                const RIcon = rule.status === 'passing' ? CheckCircle : rule.status === 'failing' ? AlertTriangle : Clock
                return (
                  <div key={idx} style={{ padding: '11px 20px', borderBottom: idx < section.rules.length - 1 ? `1px solid ${hy.border.base}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <RIcon size={15} color={rColor.fg} />
                      <span style={{ fontSize: 13, color: hy.fg.base }}>{rule.rule}</span>
                    </div>
                    <Badge label={rLabel} color={rColor} />
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ── OPTIMIZE TAB ────────────────────────────────────────────────────────── */

function OptimizeTab() {
  const [section, setSection] = useState<'insource' | 'collab'>('insource')

  const totalInsourceSavings = INSOURCE_OPPS.reduce((s, o) => s + o.estimatedSavings, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${hy.border.base}`, paddingBottom: 0 }}>
        {([
          { id: 'insource', label: 'Insource Opportunities', count: INSOURCE_OPPS.length },
          { id: 'collab', label: 'Collaboration Efficiency', count: COLLAB_OPPS.length },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            style={{
              fontSize: 13, fontWeight: section === tab.id ? 600 : 400,
              color: section === tab.id ? hy.fg.base : hy.fg.muted,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px',
              borderBottom: section === tab.id ? `2px solid ${hy.fg.base}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: hy.ui.neutral.bg, color: hy.fg.subtle }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {section === 'insource' && (
        <>
          {/* Summary banner */}
          <Card style={{ padding: '16px 20px', background: hy.ui.blue.bg, border: `1px solid ${hy.ui.blue.fg}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrendingDown size={20} color={hy.ui.blue.fg} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: hy.ui.blue.fg }}>
                  {fmt$(totalInsourceSavings)} in potential annual savings
                </div>
                <div style={{ fontSize: 13, color: hy.fg.subtle }}>
                  Harvey identified {INSOURCE_OPPS.length} task types currently outsourced that it can handle natively or with minimal attorney oversight.
                </div>
              </div>
            </div>
          </Card>

          {INSOURCE_OPPS.map(opp => {
            const firm = PANEL_FIRMS.find(f => f.id === opp.firmId)!
            return (
              <Card key={opp.id} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: hy.fg.base }}>{opp.taskType}</span>
                      <Badge label={`Currently: ${firm.shortName}`} color={hy.ui.neutral} />
                      {opp.workflowAvailable && (
                        <Badge label="Workflow available" color={hy.ui.success} />
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.55 }}>{opp.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 24 }}>
                    <div style={{ fontSize: 11, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Est. annual savings</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: hy.ui.success.fg }}>{fmt$(opp.estimatedSavings)}</div>
                    <div style={{ fontSize: 11, color: hy.fg.muted }}>vs {fmt$(opp.annualBilledEstimate)} billed</div>
                  </div>
                </div>

                {/* Harvey confidence */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: hy.bg.subtle, borderRadius: hy.radius.sm, marginBottom: 12 }}>
                  <Sparkles size={14} color={hy.ui.gold.fg} />
                  <span style={{ fontSize: 13, color: hy.fg.subtle }}>
                    Harvey confidence: <strong style={{ color: hy.fg.base }}>{opp.harveyConfidence}%</strong> this task type is within Harvey\u2019s capabilities
                  </span>
                  <div style={{ flex: 1, height: 5, background: hy.border.base, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${opp.harveyConfidence}%`, background: opp.harveyConfidence >= 90 ? hy.ui.success.fg : hy.ui.warning.fg, borderRadius: 999 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {opp.workflowAvailable ? (
                    <Button size="small">
                      <Zap size={13} style={{ marginRight: 4 }} />
                      Open {opp.workflowName}
                    </Button>
                  ) : (
                    <Button size="small" variant="outline">
                      <PlusCircle size={13} style={{ marginRight: 4 }} />
                      Request workflow
                    </Button>
                  )}
                  <Button variant="outline" size="small">
                    <BarChart3 size={13} style={{ marginRight: 4 }} />
                    See billing history
                  </Button>
                </div>
              </Card>
            )
          })}
        </>
      )}

      {section === 'collab' && (
        <>
          <Card style={{ padding: '16px 20px', background: hy.ui.success.bg, border: `1px solid ${hy.ui.success.fg}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Zap size={20} color={hy.ui.success.fg} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: hy.ui.success.fg }}>
                  Harvey as a force multiplier for outside counsel
                </div>
                <div style={{ fontSize: 13, color: hy.fg.subtle }}>
                  Rather than replacing outside counsel, Harvey pre-processes work so attorneys spend time only on judgment-requiring tasks.
                </div>
              </div>
            </div>
          </Card>

          {COLLAB_OPPS.map(opp => {
            const firm = PANEL_FIRMS.find(f => f.id === opp.firmId)!
            return (
              <Card key={opp.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: hy.fg.base }}>{opp.taskType}</span>
                      <Badge label={firm.shortName} color={hy.ui.neutral} />
                    </div>
                    <div style={{ fontSize: 13, color: hy.fg.subtle, lineHeight: 1.55 }}>{opp.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 24 }}>
                    <div style={{ fontSize: 11, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Time saving</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: hy.ui.blue.fg }}>{opp.estimatedTimeSaving}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ padding: '10px 14px', background: hy.bg.subtle, borderRadius: hy.radius.sm }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Historical volume</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: hy.fg.base }}>{opp.historicalCount} instances</div>
                    <div style={{ fontSize: 12, color: hy.fg.muted }}>avg cycle: {opp.avgCycleTime}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: hy.bg.subtle, borderRadius: hy.radius.sm }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: hy.fg.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Proposed workflow</div>
                    <div style={{ fontSize: 13, color: hy.fg.base, lineHeight: 1.5 }}>{opp.suggestedApproach}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="small">
                    <Lightbulb size={13} style={{ marginRight: 4 }} />
                    Pilot this workflow
                  </Button>
                  <Button variant="outline" size="small">Share with {firm.shortName}</Button>
                </div>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}

/* ── PAGE ────────────────────────────────────────────────────────────────── */

type Tab = 'hub' | 'bills' | 'guidelines' | 'optimize'

export function PanelManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hub')

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'hub', label: 'Overview', icon: BarChart3 },
    { id: 'bills', label: 'Bill Review', icon: FileText },
    { id: 'guidelines', label: 'Guidelines', icon: BookOpen },
    { id: 'optimize', label: 'Optimize', icon: Sparkles },
  ]

  /* ── Chat state ── */
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null)
  const activeChatIdRef = useRef<string | null>(null)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)

  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id
    setActiveChatIdState(id)
  }, [])

  const activeChat = chatThreads.find(c => c.id === activeChatId)
  const chatMessages = activeChat?.messages || []
  const isChatLoading = activeChat?.isLoading || false

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
    if (isNearBottom && chatMessages.length > 0) {
      const t = setTimeout(() => scrollToBottom(), 100)
      return () => clearTimeout(t)
    }
  }, [chatMessages, isNearBottom, scrollToBottom])

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('spend') || q.includes('billing') || q.includes('invoice'))
      return "Based on your panel data, total outside counsel spend YTD is $4.2M across 6 firms.\n\n• **Baker McKenzie** — $1.8M (largest share, 12% over budget)\n• **3 invoices** flagged for billing guideline violations totaling $47K\n\nWould you like me to draft a billing compliance report?"
    if (q.includes('savings') || q.includes('insource'))
      return "I've identified $280K in potential insource savings:\n\n• **Routine NDAs** — currently sent to outside counsel, Harvey can handle 90%\n• **Standard amendments** — $95K/year could be redirected\n\nWould you like a detailed breakdown by practice area?"
    return `I'm analyzing your panel management data related to "${query}". I can help with spend analysis, billing compliance, firm performance, or insourcing opportunities. What would you like to focus on?`
  }

  const sendMessage = useCallback((messageText?: string) => {
    const text = messageText || chatInputValue
    if (!text.trim() || isChatLoading) return
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
  }, [chatInputValue, isChatLoading, ensureChatExists, updateChatById, scrollToBottom])

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg-base">
      {/* Left side — Header + Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Page Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-base shrink-0">
          <div className="flex items-center gap-1">
            <div className="flex items-center text-sm">
              <span className="font-medium text-fg-base" style={{ padding: '4px 6px' }}>Panel Management</span>
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
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 48px' }}>

            {/* Tab nav */}
            <div className="flex items-center gap-1 mb-6">
              <AnimatedBackground
                defaultValue={activeTab}
                onValueChange={(value) => value && setActiveTab(value as Tab)}
                className="bg-bg-subtle rounded-md"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    data-id={tab.id}
                    className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </AnimatedBackground>
            </div>

            {/* Tab content */}
            {activeTab === 'hub' && <HubView onTabChange={(tab) => setActiveTab(tab as Tab)} />}
            {activeTab === 'bills' && <BillReviewTab />}
            {activeTab === 'guidelines' && <GuidelinesTab />}
            {activeTab === 'optimize' && <OptimizeTab />}

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
                        <p className="text-sm leading-5 text-fg-subtle">Ask questions about outside counsel spend, billing compliance, or panel optimization.</p>
                      </div>
                      <div className="w-full max-w-[624px] flex flex-col">
                        <div className="px-3 pb-3"><p className="text-xs leading-4 text-fg-muted">Get started…</p></div>
                        <div className="flex flex-col">
                          {[
                            { icon: '/central_icons/Review.svg', label: 'Analyze outside counsel spend', prompt: 'Analyze our outside counsel spend across all panel firms and highlight any budget overruns' },
                            { icon: '/central_icons/Review.svg', label: 'Review flagged invoices', prompt: 'Review the invoices flagged for billing guideline violations and summarize the issues' },
                            { icon: '/central_icons/Review.svg', label: 'Identify insource opportunities', prompt: 'Identify tasks currently outsourced that could be insourced to reduce spend' },
                            { icon: '/central_icons/Draft.svg', label: 'Draft billing compliance report', prompt: 'Draft a billing compliance report summarizing guideline adherence across panel firms' },
                          ].map((action, i) => (
                            <React.Fragment key={action.label}>
                              <button onClick={() => sendMessage(action.prompt)} disabled={isChatLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left">
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
                    chatMessages.map((message, index) => (
                      <div key={index} className={index !== chatMessages.length - 1 ? 'mb-6' : ''}>
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
                      <img src="/folderIcon.svg" alt="Panel Management" className="w-3 h-3" />
                      <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">Panel Management</span>
                    </div>
                    <div className="px-[4px]">
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={chatInputValue}
                          onChange={(e) => { setChatInputValue(e.target.value); e.target.style.height = '20px'; e.target.style.height = Math.max(20, e.target.scrollHeight) + 'px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isChatLoading) { e.preventDefault(); sendMessage() } }}
                          onFocus={() => setIsChatInputFocused(true)}
                          onBlur={() => setIsChatInputFocused(false)}
                          disabled={isChatLoading}
                          className="w-full bg-transparent focus:outline-none text-fg-base placeholder-[#9e9b95] resize-none overflow-hidden disabled:opacity-50"
                          style={{ fontSize: '14px', lineHeight: '20px', height: '20px', minHeight: '20px', maxHeight: '300px' }}
                        />
                        {!chatInputValue && !isChatInputFocused && (
                          <div className="absolute inset-0 pointer-events-none text-[#9e9b95] dark:text-[#6b6b6b] flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
                            <TextLoop interval={3000}>
                              <span>Analyze outside counsel spend…</span>
                              <span>Review flagged invoices…</span>
                              <span>Identify insource opportunities…</span>
                              <span>Compare firm performance…</span>
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

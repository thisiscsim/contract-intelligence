'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Library,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Activity,
  Clock,
  FolderOpen,
  Mail,
  Zap,
} from 'lucide-react'

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
    success: { fg: 'var(--ui-success-fg)', bg: 'var(--ui-success-bg)', border: 'var(--ui-success-border)' },
    warning: { fg: 'var(--ui-warning-fg)', bg: 'var(--ui-warning-bg)', border: 'var(--ui-warning-border)' },
    danger:  { fg: 'var(--ui-danger-fg)',  bg: 'var(--ui-danger-bg)' },
    neutral: { fg: 'var(--fg-muted)', bg: 'var(--bg-subtle)' },
    blue:    { fg: 'var(--ui-blue-fg)',    bg: 'var(--ui-blue-bg)' },
    gold:    { fg: 'var(--ui-warning-fg)', bg: 'var(--ui-warning-bg)' },
    olive:   { fg: 'hsl(85, 25%, 32%)', bg: 'hsl(85, 35%, 92%)' },
    violet:  { fg: 'var(--ui-violet-fg)', bg: 'var(--ui-violet-bg)' },
    jade:    { fg: 'hsl(185, 58%, 28%)', bg: 'hsl(180, 8%, 88%)' },
  },
  radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
}

const serif =
  '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif'
const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
const tooltipStyle = {
  background: hy.bg.base,
  border: `1px solid ${hy.border.strong}`,
  borderRadius: hy.radius.md,
  fontSize: 13,
  padding: '8px 12px',
}

function Tag({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode
  variant?: keyof typeof hy.ui
}) {
  const p = hy.ui[variant] ?? hy.ui.neutral
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: hy.radius.full,
        background: p.bg,
        color: p.fg,
        border: 'border' in p ? `1px solid ${(p as any).border}` : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const PIPELINE_PATH = '/contract-intelligence/overview'

const weeklyTrend = [
  { day: 'Mon', submitted: 14, autoResolved: 11 },
  { day: 'Tue', submitted: 9, autoResolved: 7 },
  { day: 'Wed', submitted: 18, autoResolved: 15 },
  { day: 'Thu', submitted: 11, autoResolved: 9 },
  { day: 'Fri', submitted: 12, autoResolved: 8 },
]

const playbookUpdates = [
  {
    name: 'SaaS Vendor Agreement',
    status: 'Updated',
    detail: 'DORA compliance clauses added to data processing section',
    time: '2h ago',
    variant: 'blue' as const,
    suggestion: 'Harvey suggests adding the new DORA Article 28 language to all active SaaS vendor agreements.',
    contracts: 6,
    autoResRate: 88,
  },
  {
    name: 'Enterprise MSA',
    status: 'Flagged',
    detail: '3 contracts deviated from liability cap rule this week',
    time: '5h ago',
    variant: 'warning' as const,
    suggestion: 'Consider lowering the threshold from 2x to 1.5x annual fees — 3 counterparties rejected the current cap.',
    contracts: 14,
    autoResRate: 62,
  },
  {
    name: 'NDA — Bilateral',
    status: 'Performing well',
    detail: '94% auto-resolution rate, no escalations in 30 days',
    time: '1d ago',
    variant: 'success' as const,
    suggestion: null,
    contracts: 31,
    autoResRate: 94,
  },
  {
    name: 'Data Processing Agreement',
    status: 'Needs review',
    detail: 'EU AI Act provisions not yet incorporated — 12 active DPAs affected',
    time: '2d ago',
    variant: 'danger' as const,
    suggestion: 'Harvey recommends adding Article 6 AI transparency provisions. 12 DPAs expiring in Q2 need this update.',
    contracts: 12,
    autoResRate: 41,
  },
]

const clauseTrends = [
  { clause: 'Limitation of Liability', contested: 48, accepted: 34, rejected: 18, trend: 'up' as const, note: 'Counterparties pushing back on aggregate caps more frequently', suggestion: 'Consider offering a tiered cap structure — deals over $500K are 3x more likely to contest.' },
  { clause: 'Data Privacy / GDPR', contested: 44, accepted: 38, rejected: 18, trend: 'up' as const, note: 'DORA and EU AI Act driving new sub-processor requirements', suggestion: 'Add AI-specific data processing language to align with incoming EU AI Act obligations.' },
  { clause: 'IP Assignment', contested: 40, accepted: 43, rejected: 17, trend: 'stable' as const, note: 'Pre-existing IP carve-outs remain the main negotiation point', suggestion: null },
  { clause: 'Indemnification', contested: 48, accepted: 34, rejected: 18, trend: 'down' as const, note: 'Mutual indemnification becoming more accepted across deal types', suggestion: null },
  { clause: 'Auto-Renewal / Termination', contested: 28, accepted: 61, rejected: 11, trend: 'stable' as const, note: '90-day notice period now standard; fewer disputes', suggestion: null },
]

const clauseNegotiationData = clauseTrends.map(c => ({
  clause: c.clause.length > 18 ? c.clause.slice(0, 18) + '…' : c.clause,
  Accepted: c.accepted,
  Contested: c.contested,
  Rejected: c.rejected,
}))

const AGENT_RUNS = [
  { id: 1, agent: 'Contract Review', target: 'Bilateral NDA — Crest Ventures', trigger: 'ask@harvey.ai', status: 'completed', result: '4 redlines · Low risk', started: 'Mar 19, 9:32 AM', finished: 'Mar 19, 9:34 AM', durationMin: 2 },
  { id: 2, agent: 'Contract Review', target: 'SaaS Subscription Renewal — Altair', trigger: 'Synced folder', status: 'completed', result: '6 redlines · Medium risk', started: 'Mar 19, 9:40 AM', finished: 'Mar 19, 9:42 AM', durationMin: 2 },
  { id: 3, agent: 'Contract Review', target: 'Data Processing Addendum — Meridian', trigger: 'ask@harvey.ai', status: 'running', result: 'Reviewing…', started: 'Mar 19, 9:53 AM', finished: '—', durationMin: null },
  { id: 4, agent: 'Playbook Maintenance', target: 'All playbooks (4)', trigger: 'Monthly cron', status: 'completed', result: '3 rules flagged', started: 'Mar 1, 6:00 AM', finished: 'Mar 1, 6:18 AM', durationMin: 18 },
  { id: 5, agent: 'Clause Library Maintenance', target: 'Org-wide (8 clause types)', trigger: 'Monthly cron', status: 'completed', result: '4 new variants', started: 'Mar 1, 6:05 AM', finished: 'Mar 1, 6:18 AM', durationMin: 13 },
  { id: 6, agent: 'Playbook Creation', target: 'PE NDA Playbook', trigger: 'Manual', status: 'completed', result: '20% → 93% (5 iter)', started: 'Mar 18, 2:14 PM', finished: 'Mar 18, 2:42 PM', durationMin: 28 },
]

// ── Component ────────────────────────────────────────────────────────────────

export function PrototypeCommandCenter() {
  const router = useRouter()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-base">
      <ScrollArea className="h-full">
        <div style={{ fontFamily: sans, background: hy.bg.base, color: hy.fg.base }}>
          {/* Header */}
          <div style={{ padding: '24px 40px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h1 style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em' }}>
                  Command Center
                </h1>
                <Tag variant="gold">Beta</Tag>
              </div>
              <div style={{ fontSize: 12, color: hy.fg.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: hy.ui.success.fg }} />
                Today's activity · March 19
              </div>
            </div>
          </div>

          <div style={{ padding: '0 40px 32px' }}>

            {/* ── Row 1: Pipeline hero cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* Auto-reviewed */}
              <button
                type="button"
                onClick={() => router.push(PIPELINE_PATH)}
                style={{
                  padding: '16px 20px',
                  borderRadius: hy.radius.lg,
                  border: `1px solid ${hy.ui.success.border}`,
                  background: hy.ui.success.bg,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Zap size={14} color={hy.ui.success.fg} strokeWidth={1.8} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: hy.ui.success.fg }}>Harvey auto-reviewed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, color: hy.ui.success.fg }}>8</span>
                  <span style={{ fontSize: 12, color: hy.fg.subtle }}>No escalation needed · avg 14 min</span>
                </div>
              </button>

              {/* Needs review */}
              <button
                type="button"
                onClick={() => router.push(PIPELINE_PATH)}
                style={{
                  padding: '16px 20px',
                  borderRadius: hy.radius.lg,
                  border: `1px solid ${hy.ui.warning.border}`,
                  background: hy.ui.warning.bg,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Eye size={14} color={hy.ui.warning.fg} strokeWidth={1.8} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: hy.ui.warning.fg }}>Needs your review</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, color: hy.ui.warning.fg }}>3</span>
                  <span style={{ fontSize: 12, color: hy.fg.subtle }}>First pass ready · 12 submitted today</span>
                </div>
              </button>
            </div>

            {/* Event Sources */}
            <div style={{ marginTop: 16, marginBottom: 16, border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.lg, padding: 14, background: hy.bg.base }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: hy.fg.base }}>Event Sources</span>
                <span style={{ fontSize: 11, color: hy.ui.success.fg, fontWeight: 500 }}>&middot; 3 channels connected</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Email channel */}
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: hy.radius.sm, background: hy.bg.subtle, border: `1px solid ${hy.border.base}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Mail size={12} color={hy.fg.subtle} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>ask@harvey.ai</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: hy.ui.success.fg, flexShrink: 0 }} />
                  </div>
                  <span style={{ fontSize: 11, color: hy.fg.muted }}>Email Channel &middot; 12 today</span>
                </div>
                {/* Synced Folders channel */}
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: hy.radius.sm, background: hy.bg.subtle, border: `1px solid ${hy.border.base}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <FolderOpen size={12} color={hy.fg.subtle} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>Synced Folders</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: hy.ui.success.fg, flexShrink: 0 }} />
                  </div>
                  <span style={{ fontSize: 11, color: hy.fg.muted }}>File System Channel &middot; 4 today</span>
                </div>
                {/* Scheduled channel */}
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: hy.radius.sm, background: hy.bg.subtle, border: `1px solid ${hy.border.base}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Clock size={12} color={hy.fg.subtle} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: hy.fg.base }}>Monthly Cron</span>
                  </div>
                  <span style={{ fontSize: 11, color: hy.fg.muted }}>Scheduled &middot; 2 agents &middot; next: Apr 1</span>
                </div>
              </div>
            </div>

            {/* ── Row 2: 2 KPI boxes + weekly chart, all in one row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 24 }}>
              {/* KPI: Auto-resolution rate */}
              <div style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}` }}>
                <div style={{ fontSize: 11, color: hy.fg.muted, marginBottom: 6 }}>Auto-resolution rate</div>
                <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: hy.ui.success.fg, lineHeight: 1 }}>67%</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: hy.ui.success.fg, fontWeight: 500, marginTop: 6 }}>
                  <TrendingUp size={12} />
                  12% vs last week
                </div>
              </div>

              {/* KPI: Avg time to resolution */}
              <div style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}` }}>
                <div style={{ fontSize: 11, color: hy.fg.muted, marginBottom: 6 }}>Avg. time to resolve</div>
                <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: hy.fg.base, lineHeight: 1 }}>14m</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: hy.ui.success.fg, fontWeight: 500, marginTop: 6 }}>
                  <TrendingDown size={12} />
                  6m vs last week
                </div>
              </div>

              {/* Compact weekly chart */}
              <div style={{ padding: '14px 18px', borderRadius: hy.radius.lg, border: `1px solid ${hy.border.base}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>This week</span>
                  <span style={{ fontSize: 10, color: hy.fg.muted }}>Submitted vs auto-resolved</span>
                </div>
                <div style={{ height: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrend} barGap={2}>
                      <CartesianGrid vertical={false} stroke={hy.border.base} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: hy.fg.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: hy.fg.muted }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip contentStyle={{ ...tooltipStyle, fontSize: 11 }} />
                      <Bar dataKey="submitted" fill={hy.ui.blue.fg} radius={[3, 3, 0, 0]} name="Submitted" />
                      <Bar dataKey="autoResolved" fill={hy.ui.success.fg} radius={[3, 3, 0, 0]} name="Auto-resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ── Row 3: Playbook + Clause side by side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

              {/* ── Playbook Intelligence (left) ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>Playbook Intelligence</span>
                  <button
                    type="button"
                    onClick={() => router.push('/contract-intelligence/playbooks')}
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: hy.fg.subtle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    View all <ChevronRight size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {playbookUpdates.map((pb) => {
                    const p = hy.ui[pb.variant] ?? hy.ui.neutral
                    const rateColor = pb.autoResRate >= 80 ? hy.ui.success.fg : pb.autoResRate >= 60 ? hy.ui.gold.fg : hy.ui.warning.fg
                    return (
                      <div
                        key={pb.name}
                        style={{
                          padding: '12px 14px',
                          borderRadius: hy.radius.md,
                          border: 'border' in p ? `1px solid ${(p as any).border}` : `1px solid ${hy.border.base}`,
                          background: hy.bg.base,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <BookOpen size={12} color={p.fg} strokeWidth={1.8} />
                          <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{pb.name}</span>
                          <Tag variant={pb.variant}>{pb.status}</Tag>
                        </div>

                        <div style={{ fontSize: 11, color: hy.fg.subtle, marginBottom: 6, lineHeight: 1.35 }}>{pb.detail}</div>

                        {/* Progress bar + stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 3, background: hy.bg.component, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pb.autoResRate}%`, background: rateColor, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: rateColor, flexShrink: 0 }}>{pb.autoResRate}%</span>
                          <span style={{ fontSize: 10, color: hy.fg.muted, flexShrink: 0 }}>{pb.contracts} contracts</span>
                        </div>

                        {/* Harvey suggestion */}
                        {pb.suggestion && (
                          <div style={{ marginTop: 6, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                            <Zap size={10} color={hy.ui.blue.fg} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: hy.ui.blue.fg, lineHeight: 1.35 }}>{pb.suggestion}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Clause Trends (right) ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>Clause Trends</span>
                  <button
                    type="button"
                    onClick={() => router.push('/contract-intelligence/clauses')}
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: hy.fg.subtle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    View all <ChevronRight size={13} />
                  </button>
                </div>
                <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, overflow: 'hidden' }}>
                  {clauseTrends.map((c, i) => {
                    const total = c.accepted + c.contested + c.rejected
                    const trendIcon = c.trend === 'up'
                      ? <TrendingUp size={11} color={hy.ui.warning.fg} />
                      : c.trend === 'down'
                        ? <TrendingDown size={11} color={hy.ui.success.fg} />
                        : null
                    const trendLabel = c.trend === 'up' ? 'More contested' : c.trend === 'down' ? 'Fewer disputes' : 'Stable'
                    const trendColor = c.trend === 'up' ? hy.ui.warning.fg : c.trend === 'down' ? hy.ui.success.fg : hy.fg.muted

                    return (
                      <div
                        key={c.clause}
                        style={{
                          padding: '10px 14px',
                          borderBottom: i < clauseTrends.length - 1 ? `1px solid ${hy.border.base}` : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <Library size={12} color={hy.fg.muted} strokeWidth={1.5} />
                          <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{c.clause}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                            {trendIcon}
                            <span style={{ fontSize: 10, fontWeight: 500, color: trendColor }}>{trendLabel}</span>
                          </div>
                        </div>

                        {/* Stacked bar + percentages */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: c.suggestion ? 5 : 0 }}>
                          <div style={{ flex: 1, display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${(c.accepted / total) * 100}%`, background: hy.ui.success.fg }} />
                            <div style={{ width: `${(c.contested / total) * 100}%`, background: hy.ui.gold.fg }} />
                            <div style={{ width: `${(c.rejected / total) * 100}%`, background: hy.ui.danger.fg }} />
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: hy.ui.success.fg, fontWeight: 500 }}>{c.accepted}%</span>
                            <span style={{ fontSize: 10, color: hy.ui.gold.fg, fontWeight: 500 }}>{c.contested}%</span>
                            <span style={{ fontSize: 10, color: hy.ui.danger.fg, fontWeight: 500 }}>{c.rejected}%</span>
                          </div>
                        </div>

                        {/* Harvey suggestion */}
                        {c.suggestion && (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                            <Zap size={10} color={hy.ui.blue.fg} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: hy.ui.blue.fg, lineHeight: 1.35 }}>{c.suggestion}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Row 4: Recent Agent Runs ── */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Activity size={15} color={hy.fg.subtle} strokeWidth={1.8} />
                <span style={{ fontSize: 15, fontWeight: 500 }}>Recent Agent Runs</span>
              </div>
              <div style={{ border: `1px solid ${hy.border.base}`, borderRadius: hy.radius.md, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: hy.bg.component, borderBottom: `1px solid ${hy.border.base}` }}>
                      {['Agent', 'Target', 'Trigger', 'Status', 'Result', 'Started', 'Finished', 'Duration'].map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 500,
                            color: hy.fg.muted,
                            borderBottom: `1px solid ${hy.border.base}`,
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AGENT_RUNS.map((run, i) => (
                      <tr
                        key={run.id}
                        style={{
                          borderBottom: i < AGENT_RUNS.length - 1 ? `1px solid ${hy.border.base}` : 'none',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = hy.bg.baseHover }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 500 }}>{run.agent}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: hy.fg.subtle, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.target}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: hy.fg.muted }}>{run.trigger}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <Tag variant={run.status === 'completed' ? 'success' : 'blue'}>
                            {run.status === 'completed' ? 'Completed' : 'Running'}
                          </Tag>
                        </td>
                        <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 500, color: run.status === 'completed' ? hy.ui.success.fg : hy.ui.blue.fg }}>{run.result}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: hy.fg.subtle, whiteSpace: 'nowrap' }}>{run.started}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: hy.fg.subtle, whiteSpace: 'nowrap' }}>{run.finished}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 500, color: hy.fg.base, whiteSpace: 'nowrap' }}>{run.durationMin != null ? `${run.durationMin} min` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

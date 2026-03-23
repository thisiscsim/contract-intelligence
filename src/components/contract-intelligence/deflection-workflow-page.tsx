'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

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
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border-base bg-bg-base">
      <ScrollArea className="h-full">
        <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ padding: '3px 10px', borderRadius: 999, background: hy.ui.blue.bg, border: `1px solid ${hy.ui.blue.fg}22` }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: hy.ui.blue.fg }}>{"Commercial Contracting"}</span>
                </div>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: hy.fg.base, margin: '0 0 6px' }}>{"Redesigned for Deflection"}</h1>
              <p style={{ fontSize: 13, color: hy.fg.muted, margin: 0 }}>{"Every contract submission classified: fully automated or legal review needed. Harvey handles what doesn't need a lawyer."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/meta-contract-intelligence/trends')}>
              {"Command Center →"}
            </Button>
          </div>

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
      </ScrollArea>
    </div>
  )
}

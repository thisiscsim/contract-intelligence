/**
 * Contract Intelligence Command Center — realistic mock data for demo.
 * Real company names and clause text; no Lorem ipsum or placeholders.
 */

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type ContractStatus = 'Active' | 'Under Review' | 'Expiring' | 'Expired'
export type ObligationSeverity = 'low' | 'medium' | 'high' | 'critical'
export type Trend = 'improving' | 'stable' | 'worsening'
export type StandardizationStatus = 'Standardized' | 'In progress' | 'Divergent'
export type PlaybookRuleStatus = 'aligned' | 'outdated' | 'drifting'

// —— Overview metrics (click-through to respective tabs)
export const overviewMetrics = [
  { label: 'Playbook health', value: '94%', change: '3 rules need review', trend: 'neutral' as const, tab: 'playbooks' },
  { label: 'Templates', value: '47', change: '2 need regulatory update', trend: 'up' as const, tab: 'templates' },
  { label: 'Key dates', value: '23', change: '5 due in next 7 days', trend: 'up' as const, tab: 'key-dates' },
  { label: 'AI review rate', value: '78%', change: '+12% vs last month', trend: 'up' as const, tab: 'team' },
  { label: 'At-risk contracts', value: '8', change: 'Score ≥ 70', trend: 'up' as const, tab: 'at-risk' },
]

// —— Harvey Actions feed (proactive notifications)
export const harveyActionsFeed = [
  {
    id: '1',
    type: 'playbook_drift' as const,
    title: 'Playbook drift detected',
    detail: 'Payment terms: 68% of recent deals closed at Net-45. Rule still says Net-30.',
    time: '12m ago',
    linkTab: 'playbooks',
  },
  {
    id: '2',
    type: 'regulatory' as const,
    title: 'DORA impact on templates',
    detail: '3 templates and 156 contracts may need amendment language.',
    time: '1h ago',
    linkTab: 'templates',
  },
  {
    id: '3',
    type: 'key_date' as const,
    title: 'Opt-out window closing',
    detail: 'HSBC Master Services Agreement — auto-renewal opt-out in 7 days.',
    time: '2h ago',
    linkTab: 'key-dates',
  },
  {
    id: '4',
    type: 'clause' as const,
    title: 'Clause trending contested',
    detail: 'Indemnification (v6.0) acceptance rate 58% — consider refresh.',
    time: '3h ago',
    linkTab: 'clauses',
  },
  {
    id: '5',
    type: 'risk' as const,
    title: 'High-risk contract flagged',
    detail: 'Blue Owl — DPA with uncapped liability; score 82.',
    time: '4h ago',
    linkTab: 'at-risk',
  },
  {
    id: '6',
    type: 'sync' as const,
    title: 'SharePoint sync completed',
    detail: '892 contracts indexed from Legal shared drive.',
    time: '5h ago',
    linkTab: 'overview',
  },
]

// —— Playbook Health
export interface PlaybookRule {
  id: string
  category: string
  standardPosition: string
  acceptRate: number
  recentDeals: number
  status: PlaybookRuleStatus
  suggestedUpdate: string | null
  evidence: string
  // Extended fields for §9 overhaul
  fallbackPosition: string
  aiAligned: boolean
  aiConfidence: number
  usedInAutoReview: number
  approvalRequired: boolean
  lastUpdated: string
  updateRisk: string
  keepRisk: string
  affectedContracts?: number
}

export const playbookRules: PlaybookRule[] = [
  {
    id: 'pb-1',
    category: 'Payment terms',
    standardPosition: 'Net-30 payment terms',
    acceptRate: 32,
    recentDeals: 24,
    status: 'outdated',
    suggestedUpdate: 'Net-45 (align with 68% of recent closings)',
    evidence: '18 of 24 deals in last 90 days closed at Net-45 (Walmart, Citi, Repsol).',
    fallbackPosition: 'Net-60 if counterparty operates in EMEA and revenue >$10M ARR',
    aiAligned: true,
    aiConfidence: 94,
    usedInAutoReview: 312,
    approvalRequired: false,
    lastUpdated: 'Jun 2023',
    updateRisk: 'Low — industry standard has shifted; updating reduces friction without conceding value.',
    keepRisk: 'High — current position rejected 68% of the time, causing unnecessary negotiation cycles.',
    affectedContracts: 47,
  },
  {
    id: 'pb-2',
    category: 'Liability cap',
    standardPosition: 'Liability cap: 12 months fees',
    acceptRate: 88,
    recentDeals: 31,
    status: 'aligned',
    suggestedUpdate: null,
    evidence: 'Consistently accepted; 2 counter-proposals in Q1.',
    fallbackPosition: '6 months fees if counterparty is a regulated financial institution',
    aiAligned: true,
    aiConfidence: 97,
    usedInAutoReview: 289,
    approvalRequired: false,
    lastUpdated: 'Jan 2025',
    updateRisk: 'N/A — position is stable',
    keepRisk: 'Low — strong acceptance rate; no action recommended.',
  },
  {
    id: 'pb-3',
    category: 'Indemnification',
    standardPosition: 'Mutual indemnification for IP and confidentiality',
    acceptRate: 54,
    recentDeals: 19,
    status: 'drifting',
    suggestedUpdate: 'Carve out subprocessor claims from mutual cap',
    evidence: 'HSBC, Blue Owl pushed back on scope; 46% accepted as-is.',
    fallbackPosition: 'One-way indemnification if counterparty is the data controller',
    aiAligned: true,
    aiConfidence: 81,
    usedInAutoReview: 198,
    approvalRequired: true,
    lastUpdated: 'Mar 2024',
    updateRisk: 'Medium — adding subprocessor carve-outs is defensible but may invite reciprocal requests.',
    keepRisk: 'Medium — uncapped mutual indemnity exposes both parties; 46% of counterparties currently sign as-is.',
    affectedContracts: 22,
  },
  {
    id: 'pb-4',
    category: 'Termination',
    standardPosition: '30 days notice for convenience',
    acceptRate: 91,
    recentDeals: 28,
    status: 'aligned',
    suggestedUpdate: null,
    evidence: 'Standard position holding; no material pushback.',
    fallbackPosition: '60 days notice for enterprise customers with >$500K annual contract value',
    aiAligned: true,
    aiConfidence: 99,
    usedInAutoReview: 341,
    approvalRequired: false,
    lastUpdated: 'Sep 2022',
    updateRisk: 'N/A — position is stable',
    keepRisk: 'Low — widely accepted; maintain current language.',
  },
  {
    id: 'pb-5',
    category: 'Data processing',
    standardPosition: "Standard Clauses (SCCs) for int'l transfers",
    acceptRate: 72,
    recentDeals: 22,
    status: 'aligned',
    suggestedUpdate: null,
    evidence: 'Dentsu requested addendum; otherwise accepted.',
    fallbackPosition: 'Binding Corporate Rules (BCRs) for intra-group transfers within EU',
    aiAligned: true,
    aiConfidence: 88,
    usedInAutoReview: 167,
    approvalRequired: false,
    lastUpdated: 'Feb 2025',
    updateRisk: 'N/A — regulatory baseline is stable',
    keepRisk: 'Low — SCCs remain the standard; DORA addendum may be required for DORA-scoped entities.',
  },
  {
    id: 'pb-6',
    category: 'Auto-renewal',
    standardPosition: 'Annual auto-renewal with 60-day opt-out window',
    acceptRate: 79,
    recentDeals: 16,
    status: 'aligned',
    suggestedUpdate: null,
    evidence: 'Consistent acceptance across enterprise segment.',
    fallbackPosition: '30-day opt-out if customer requests shorter window',
    aiAligned: false,
    aiConfidence: 0,
    usedInAutoReview: 0,
    approvalRequired: true,
    lastUpdated: 'Nov 2023',
    updateRisk: 'N/A',
    keepRisk: 'Low — Harvey can auto-apply this rule; enable AI alignment to reduce manual review.',
  },
  {
    id: 'pb-7',
    category: 'Governing law',
    standardPosition: 'New York law; courts of New York County',
    acceptRate: 83,
    recentDeals: 34,
    status: 'aligned',
    suggestedUpdate: null,
    evidence: 'Stable for US counterparties; EU counterparties frequently request English law.',
    fallbackPosition: 'English law for EU/UK counterparties; arbitration (ICC) for APAC',
    aiAligned: true,
    aiConfidence: 96,
    usedInAutoReview: 278,
    approvalRequired: false,
    lastUpdated: 'Apr 2023',
    updateRisk: 'N/A',
    keepRisk: 'Low — well-established; jurisdiction fallback covers non-US deals.',
  },
]

// —— Playbook Gaps (§9.2 — terms frequently negotiated without playbook coverage)
export interface PlaybookGap {
  id: string
  term: string
  frequency: number
  riskLevel: 'High' | 'Medium' | 'Low'
  description: string
  suggestedFallback: string
  affectedCounterparties: string[]
  harveySuggestion: string
}

export const playbookGaps: PlaybookGap[] = [
  {
    id: 'gap-1',
    term: 'Force Majeure — Pandemic/Cyber',
    frequency: 38,
    riskLevel: 'High',
    description: 'Post-COVID counterparties routinely negotiate force majeure language that explicitly covers pandemics and cyber incidents. No playbook rule exists; legal manually redlines each time.',
    suggestedFallback: 'Exclude cyber events caused by party\'s own negligence from FM relief; include 48-hour notice requirement.',
    affectedCounterparties: ['GlobalTech Ltd', 'Meridian Partners', 'Apex Financial', 'NovaStar Inc'],
    harveySuggestion: 'Harvey has seen 38 negotiations on this term in 90 days. Standardizing now would save ~2.4 lawyer-hours per deal.',
  },
  {
    id: 'gap-2',
    term: 'AI/ML Output Liability',
    frequency: 27,
    riskLevel: 'High',
    description: 'Counterparties increasingly seek warranties on AI-generated outputs or indemnity for AI errors. No approved position exists; escalated to GC each time.',
    suggestedFallback: 'Disclaim warranties on AI outputs; offer SLA-based remedies for material errors; no indemnity for third-party AI model outputs.',
    affectedCounterparties: ['Acme Corp', 'Titan Industries', 'Pinnacle Group'],
    harveySuggestion: 'This is the fastest-growing unresolved term in 2026. Harvey recommends creating a playbook before it appears in high-value deals.',
  },
  {
    id: 'gap-3',
    term: 'Subcontractor / Supply Chain Disclosure',
    frequency: 19,
    riskLevel: 'Medium',
    description: 'Enterprise buyers are requesting lists of critical subcontractors and audit rights over supply chains, particularly for regulated industries.',
    suggestedFallback: 'Disclose tier-1 subcontractors upon request; no audit rights without 30-day notice and reasonable scope limitation.',
    affectedCounterparties: ['HSBC', 'Apex Financial', 'Vertex Solutions'],
    harveySuggestion: 'Regulators are driving this requirement. A standardized disclosure schedule would eliminate ad-hoc negotiation in 19 pending contracts.',
  },
  {
    id: 'gap-4',
    term: 'Benchmark / MFN Pricing',
    frequency: 14,
    riskLevel: 'Medium',
    description: 'Some counterparties request most-favored-nation pricing clauses or benchmarking rights after year 2. Currently handled case-by-case with inconsistent outcomes.',
    suggestedFallback: 'Allow benchmarking after 24 months with 90-day cure period; exclude custom features from comparison scope.',
    affectedCounterparties: ['Walmart', 'Citi', 'Pinnacle Group'],
    harveySuggestion: 'Inconsistent MFN handling has led to 3 disputes in the past year. Harvey recommends a standard fallback to protect pricing integrity.',
  },
]

// —— Templates (inventory, jurisdiction, regulatory)
export interface TemplateRow {
  id: string
  name: string
  businessLine: string
  jurisdiction: string
  status: StandardizationStatus
  contractCount: number
  regulatoryImpact: string | null
}

export const templates: TemplateRow[] = [
  { id: 't1', name: 'MSA — Technology Vendors', businessLine: 'Procurement', jurisdiction: 'US', status: 'Standardized', contractCount: 312, regulatoryImpact: null },
  { id: 't2', name: 'MSA — Technology Vendors', businessLine: 'Procurement', jurisdiction: 'UK', status: 'Standardized', contractCount: 89, regulatoryImpact: null },
  { id: 't3', name: 'DPA — EU/EEA', businessLine: 'Privacy', jurisdiction: 'EU', status: 'In progress', contractCount: 156, regulatoryImpact: 'DORA' },
  { id: 't4', name: 'DPA — EU/EEA', businessLine: 'Privacy', jurisdiction: 'UK', status: 'Divergent', contractCount: 44, regulatoryImpact: 'UK GDPR' },
  { id: 't5', name: 'NDA — Mutual', businessLine: 'Legal', jurisdiction: 'US', status: 'Standardized', contractCount: 520, regulatoryImpact: null },
  { id: 't6', name: 'SOW — Professional Services', businessLine: 'Procurement', jurisdiction: 'US', status: 'Standardized', contractCount: 198, regulatoryImpact: null },
  { id: 't7', name: 'SLA — Cloud', businessLine: 'Technology', jurisdiction: 'Multi', status: 'In progress', contractCount: 67, regulatoryImpact: null },
]

// —— Clause Library
export type ClauseRiskRating = 'High' | 'Medium' | 'Low'
export type ClauseRiskImpact = 'Legal' | 'Financial' | 'Operational' | 'Reputational'

export interface ClauseRiskAssessment {
  acceptRisk: string
  fallbackRisk: string
  impacts: ClauseRiskImpact[]
}

export interface ClauseRow {
  id: string
  name: string
  category: string
  version: string
  acceptanceRate: number
  trending: 'stable' | 'changing' | 'contested'
  excerpt: string
  riskRating: ClauseRiskRating
  riskAssessment: ClauseRiskAssessment
}

export const clauseLibrary: ClauseRow[] = [
  {
    id: 'c1',
    name: 'Indemnification',
    category: 'Liability',
    version: 'v6.0',
    acceptanceRate: 58,
    trending: 'changing',
    excerpt: 'Each party shall indemnify, defend, and hold harmless the other party and its affiliates from and against any third-party claims arising from (a) breach of confidentiality, (b) infringement of IP, and (c) gross negligence or willful misconduct, subject to the liability cap in Section 12.',
    riskRating: 'High',
    riskAssessment: {
      impacts: ['Legal', 'Financial'],
      acceptRisk: 'Accepting without carve-outs for subprocessor liability exposes company to third-party claims with no contractual ceiling.',
      fallbackRisk: 'Pushing mutual carve-outs may stall negotiation; 46% of counterparties reject first-pass version.',
    },
  },
  {
    id: 'c2',
    name: 'Liability cap',
    category: 'Liability',
    version: 'v4.1',
    acceptanceRate: 86,
    trending: 'stable',
    excerpt: 'Except for excluded claims, each party\u2019s aggregate liability shall not exceed the total fees paid or payable by Customer in the twelve (12) months preceding the claim. Neither party shall be liable for indirect, consequential, or punitive damages.',
    riskRating: 'Low',
    riskAssessment: {
      impacts: ['Financial'],
      acceptRisk: 'Standard 12-month cap is broadly accepted; deviation below 6 months creates financial exposure on larger deals.',
      fallbackRisk: 'Counterparties rarely contest; minimal negotiation risk on current wording.',
    },
  },
  {
    id: 'c3',
    name: 'Termination for cause',
    category: 'Term & termination',
    version: 'v3.2',
    acceptanceRate: 91,
    trending: 'stable',
    excerpt: 'Either party may terminate this Agreement upon thirty (30) days\u2019 written notice if the other party materially breaches and fails to cure within the cure period. Termination for cause does not relieve Customer of fees due for services rendered.',
    riskRating: 'Low',
    riskAssessment: {
      impacts: ['Operational', 'Legal'],
      acceptRisk: 'Well-tested clause; 30-day cure period is market standard. Shortening below 15 days increases disputes.',
      fallbackRisk: 'Extending notice to 60+ days weakens ability to exit a non-performing counterparty quickly.',
    },
  },
  {
    id: 'c4',
    name: 'Data processing (GDPR)',
    category: 'Privacy',
    version: 'v5.0',
    acceptanceRate: 72,
    trending: 'stable',
    excerpt: 'To the extent Vendor processes Personal Data on behalf of Customer, Vendor shall (i) act only on documented instructions, (ii) ensure appropriate technical and organizational measures, and (iii) use Standard Contractual Clauses where required for transfers.',
    riskRating: 'Medium',
    riskAssessment: {
      impacts: ['Legal', 'Reputational'],
      acceptRisk: 'Omitting SCCs for EU transfers creates GDPR Chapter V violation risk; ICO enforcement possible.',
      fallbackRisk: 'Stricter data residency requirements demanded by some counterparties may conflict with cloud architecture.',
    },
  },
  {
    id: 'c5',
    name: 'IP assignment',
    category: 'IP',
    version: 'v2.8',
    acceptanceRate: 44,
    trending: 'contested',
    excerpt: 'Customer shall own all right, title, and interest in and to the Deliverables. Vendor assigns all rights in pre-existing materials incorporated into the Deliverables to the extent necessary for Customer\u2019s use under this Agreement.',
    riskRating: 'High',
    riskAssessment: {
      impacts: ['Legal', 'Reputational', 'Financial'],
      acceptRisk: 'Broad assignment of pre-existing IP may inadvertently transfer platform components reused across clients, creating conflicting ownership claims.',
      fallbackRisk: 'Narrowing assignment to work product only is the preferred fallback; 56% of counterparties accept after first redline.',
    },
  },
]

// —— Key dates (renewals, opt-out, compliance, payment, milestone)
export type KeyDateType = 'Renewal' | 'Opt-out' | 'Compliance' | 'Reporting' | 'Milestone' | 'Payment'

export interface KeyDateRow {
  id: string
  title: string
  contractName: string
  contractId: string
  counterparty: string
  counterpartyType: 'Client' | 'Vendor' | 'Partner' | 'Regulator'
  type: KeyDateType
  dueDate: string
  daysLeft: number
  severity: ObligationSeverity
  value?: string
  autoRenew: boolean
  clauseText: string
  harveySuggestion?: string
  harveyAction?: string
}

export const keyDates: KeyDateRow[] = [
  {
    id: 'kd1',
    title: 'Auto-renewal opt-out deadline',
    contractName: 'Master Services Agreement',
    contractId: 'MSA-2024-HSBC',
    counterparty: 'HSBC',
    counterpartyType: 'Client',
    type: 'Opt-out',
    dueDate: 'Mar 16, 2026',
    daysLeft: 6,
    severity: 'critical',
    value: '$1.2M',
    autoRenew: true,
    clauseText: 'Either party may elect not to renew this Agreement by providing written notice of non-renewal no later than sixty (60) days prior to the expiration of the then-current Term. Absent such notice, this Agreement shall automatically renew for successive one (1) year periods.',
    harveySuggestion: 'Opt-out window closes March 16. If you do not send written notice by March 14 (allowing 2 days for delivery), this contract auto-renews at $1.2M for another year. Harvey recommends sending notice now unless renewal is intended.',
    harveyAction: 'Draft opt-out notice',
  },
  {
    id: 'kd2',
    title: 'Annual SOC 2 Type II certification due',
    contractName: 'Data Processing Agreement',
    contractId: 'DPA-2025-GlobalTech',
    counterparty: 'GlobalTech Ltd',
    counterpartyType: 'Vendor',
    type: 'Compliance',
    dueDate: 'Mar 15, 2026',
    daysLeft: 5,
    severity: 'critical',
    autoRenew: false,
    clauseText: 'Vendor shall provide Customer with a current SOC 2 Type II audit report no later than March 15 of each calendar year. Failure to provide such certification within five (5) business days of the due date constitutes a material breach and entitles Customer to terminate for cause.',
    harveySuggestion: 'GlobalTech has not yet submitted their SOC 2 report. Harvey recommends sending a formal reminder today. If no response by March 13, you have grounds to escalate to a cure notice under Section 14.2.',
    harveyAction: 'Send compliance reminder',
  },
  {
    id: 'kd3',
    title: 'Q1 SLA performance report due',
    contractName: 'SLA Agreement',
    contractId: 'SLA-2025-Pinnacle',
    counterparty: 'Pinnacle Group',
    counterpartyType: 'Client',
    type: 'Reporting',
    dueDate: 'Mar 10, 2026',
    daysLeft: 0,
    severity: 'high',
    autoRenew: false,
    clauseText: 'Service Provider shall deliver a written performance report within ten (10) calendar days following the end of each fiscal quarter, documenting uptime, incident response times, and SLA compliance against the metrics set out in Schedule B.',
    harveySuggestion: "Today is the Q1 report deadline. Harvey has pulled uptime data from your systems: 99.94% uptime, 0 SLA breaches in Q1. Harvey can draft the report for your review and send it to Pinnacle Group's contact on file.",
    harveyAction: 'Draft SLA report',
  },
  {
    id: 'kd4',
    title: 'Annual license fee payment',
    contractName: 'Software License Agreement',
    contractId: 'LIC-2024-Vertex',
    counterparty: 'Vertex Solutions',
    counterpartyType: 'Vendor',
    type: 'Payment',
    dueDate: 'Mar 12, 2026',
    daysLeft: 2,
    severity: 'critical',
    value: '$580K',
    autoRenew: false,
    clauseText: 'Licensee shall pay the Annual License Fee set out in Exhibit A within thirty (30) days of receipt of invoice. Payments not received by the due date shall accrue interest at the rate of 1.5% per month. Late payment for more than fifteen (15) days entitles Licensor to suspend access.',
    harveySuggestion: 'Invoice #INV-2026-0312 for $580K is due in 2 days. Harvey confirmed the amount matches the fee schedule in Exhibit A. Harvey recommends initiating payment today to avoid the 1.5%/month late interest and potential access suspension.',
    harveyAction: 'Flag for AP team',
  },
  {
    id: 'kd5',
    title: 'Data retention policy review',
    contractName: 'Data Processing Agreement',
    contractId: 'DPA-2025-0234',
    counterparty: 'GlobalTech Ltd',
    counterpartyType: 'Vendor',
    type: 'Compliance',
    dueDate: 'Mar 22, 2026',
    daysLeft: 12,
    severity: 'high',
    autoRenew: false,
    clauseText: 'Customer shall review and confirm compliance with the data retention schedule attached as Annex 3 on an annual basis. Customer shall provide written confirmation of retention posture within thirty (30) days of each anniversary of the Effective Date.',
    harveySuggestion: 'Harvey found that 3 data categories in Annex 3 (clickstream, session logs, derived analytics) may have extended retention periods under your current configuration. Harvey recommends confirming with your DPO before the March 22 deadline.',
    harveyAction: 'Review retention schedule',
  },
  {
    id: 'kd6',
    title: 'Professional liability insurance renewal',
    contractName: 'Services Agreement',
    contractId: 'SVC-2024-1102',
    counterparty: 'Meridian Partners',
    counterpartyType: 'Client',
    type: 'Compliance',
    dueDate: 'Mar 28, 2026',
    daysLeft: 18,
    severity: 'medium',
    autoRenew: false,
    clauseText: 'Service Provider shall maintain Professional Liability insurance with minimum coverage of $5,000,000 per occurrence and shall furnish Customer with a certificate of insurance no later than March 28 of each year. Lapse in coverage of more than five (5) days constitutes a default.',
    harveySuggestion: "Current policy expires March 25. Harvey detected that your broker's renewal quote was issued on Feb 28 but hasn't been executed. Harvey recommends completing renewal before March 25 and uploading the updated certificate.",
    harveyAction: 'Upload insurance certificate',
  },
  {
    id: 'kd7',
    title: 'Opt-out window: MSA renewal',
    contractName: 'Master Services Agreement',
    contractId: 'MSA-2025-NovaStar',
    counterparty: 'NovaStar Inc',
    counterpartyType: 'Client',
    type: 'Opt-out',
    dueDate: 'Mar 18, 2026',
    daysLeft: 8,
    severity: 'high',
    value: '$920K',
    autoRenew: true,
    clauseText: 'This Agreement shall automatically renew for an additional one (1) year term unless either party delivers written notice of non-renewal at least forty-five (45) days prior to expiration of the then-current Term. The current Term expires May 2, 2026.',
    harveySuggestion: 'NovaStar has a risk score of 76 — one of your highest-risk counterparties. Harvey recommends evaluating whether renewal is strategically desirable before the opt-out window closes. Harvey can also prepare a renegotiation brief if you choose to renew with updated terms.',
    harveyAction: 'Draft renegotiation brief',
  },
  {
    id: 'kd8',
    title: 'Phase 2 milestone payment',
    contractName: 'Implementation SOW',
    contractId: 'SOW-2025-Titan-02',
    counterparty: 'Titan Industries',
    counterpartyType: 'Client',
    type: 'Payment',
    dueDate: 'Apr 1, 2026',
    daysLeft: 22,
    severity: 'medium',
    value: '$340K',
    autoRenew: false,
    clauseText: 'Customer shall pay the Phase 2 Milestone Fee of $340,000 within fifteen (15) business days following written confirmation from Service Provider that Phase 2 deliverables have been accepted pursuant to the acceptance criteria in Attachment C.',
    harveySuggestion: 'Phase 2 acceptance was confirmed in writing on March 9. The 15-business-day payment window means payment is due by April 1. Harvey has confirmed deliverables meet Attachment C criteria and recommends issuing the invoice now.',
    harveyAction: 'Generate invoice',
  },
  {
    id: 'kd9',
    title: 'SOW milestone review & sign-off',
    contractName: 'Professional Services SOW',
    contractId: 'SOW-2024-0667',
    counterparty: 'Apex Financial',
    counterpartyType: 'Client',
    type: 'Milestone',
    dueDate: 'Mar 31, 2026',
    daysLeft: 21,
    severity: 'medium',
    autoRenew: false,
    clauseText: 'Customer shall conduct a milestone review meeting within ten (10) business days of Service Provider\'s written milestone completion notice. If Customer does not provide written objection within five (5) business days of such review, the milestone shall be deemed accepted.',
    harveySuggestion: 'Completion notice was submitted March 8. The review window expires March 31. Harvey recommends scheduling the review call this week to ensure Apex Financial has adequate time to raise any objections before deemed acceptance occurs.',
    harveyAction: 'Schedule review meeting',
  },
  {
    id: 'kd10',
    title: 'DORA ICT risk framework submission',
    contractName: 'Financial Services Compliance Addendum',
    contractId: 'REG-2026-DORA-001',
    counterparty: 'Internal / Regulator',
    counterpartyType: 'Regulator',
    type: 'Compliance',
    dueDate: 'Apr 30, 2026',
    daysLeft: 51,
    severity: 'high',
    autoRenew: false,
    clauseText: 'Pursuant to Regulation (EU) 2022/2554 (DORA) Article 17, the regulated entity shall maintain and annually review an ICT risk management framework. Documentation of the framework, including incident classification and resilience testing results, must be available for supervisory review by April 30, 2026.',
    harveySuggestion: 'Harvey identified 3 vendor contracts (DPA-2025-GlobalTech, SVC-2024-1102, MSA-2024-HSBC) that reference ICT services and may require DORA-specific amendment language. Harvey recommends beginning the gap analysis now to meet the April 30 deadline without a rush.',
    harveyAction: 'Begin DORA gap analysis',
  },
  {
    id: 'kd11',
    title: 'Strategic alliance renewal decision',
    contractName: 'Strategic Alliance & Revenue Share Agreement',
    contractId: 'MSA-2024-Apex',
    counterparty: 'Apex Financial',
    counterpartyType: 'Partner',
    type: 'Renewal',
    dueDate: 'Jun 15, 2026',
    daysLeft: 97,
    severity: 'medium',
    value: '$2.1M',
    autoRenew: true,
    clauseText: 'This Agreement shall renew automatically for successive one (1) year terms unless either party provides written notice of non-renewal not less than ninety (90) days prior to the end of the then-current Term. The current Term ends September 15, 2026.',
    harveySuggestion: 'The 90-day opt-out window opens June 17. Harvey recommends initiating a renewal review now — Apex Financial\'s accept rate is 65% (improving trend) and the alliance has generated $840K in referral revenue YTD. Harvey can prepare a renewal performance brief.',
    harveyAction: 'Prepare renewal brief',
  },
  {
    id: 'kd12',
    title: 'Enterprise platform contract renewal',
    contractName: 'Enterprise Platform License Agreement',
    contractId: 'MSA-2024-0891',
    counterparty: 'Acme Corp',
    counterpartyType: 'Client',
    type: 'Renewal',
    dueDate: 'Jun 15, 2026',
    daysLeft: 97,
    severity: 'low',
    value: '$2.4M',
    autoRenew: true,
    clauseText: 'Unless terminated in accordance with Section 18, this Agreement shall automatically renew for an additional term of one (1) year on each anniversary of the Effective Date. Customer may prevent renewal by providing sixty (60) days written notice prior to the applicable renewal date.',
    harveySuggestion: "Acme Corp has a strong relationship — 24 contracts, 72% accept rate, no disputes. Harvey recommends proactively engaging on renewal terms 90 days out (mid-March) to propose expanded scope given Acme's recent growth. Harvey can draft a renewal proposal.",
    harveyAction: 'Draft renewal proposal',
  },
]

// —— Team effectiveness
export const teamEffectivenessMetrics = {
  aiReviewRate: 78,
  avgReviewTimeMinutes: 42,
  avgManualMinutes: 118,
  suggestionsAccepted: 76,
  reviewsThisMonth: 184,
  estimatedHoursSaved: 233,
}

export const teamMembers = [
  { name: 'Sarah Chen', reviews: 52, acceptanceRate: 82, avgTimeMinutes: 38 },
  { name: 'James Okonkwo', reviews: 48, acceptanceRate: 74, avgTimeMinutes: 45 },
  { name: 'Maria Santos', reviews: 41, acceptanceRate: 79, avgTimeMinutes: 40 },
  { name: 'David Park', reviews: 43, acceptanceRate: 71, avgTimeMinutes: 51 },
]

// —— At-risk contracts
export interface AtRiskContract {
  id: string
  name: string
  counterparty: string
  riskScore: number
  issues: string[]
  contractId: string
  lastReviewed: string
}

export const atRiskContracts: AtRiskContract[] = [
  {
    id: 'ar1',
    name: 'Data Processing Agreement',
    counterparty: 'Blue Owl',
    riskScore: 82,
    issues: ['Uncapped liability', 'Subprocessor consent beyond standard', 'Data return period 90 days (standard 30)'],
    contractId: 'DPA-2024-BO-782',
    lastReviewed: 'Feb 12, 2026',
  },
  {
    id: 'ar2',
    name: 'Master Services Agreement',
    counterparty: 'NovaStar Inc',
    riskScore: 76,
    issues: ['Indemnification scope narrower than playbook', 'Termination for convenience 60 days (standard 30)'],
    contractId: 'MSA-2025-NS-441',
    lastReviewed: 'Mar 1, 2026',
  },
  {
    id: 'ar3',
    name: 'Software License Agreement',
    counterparty: 'Vertex Solutions',
    riskScore: 71,
    issues: ['Warranty disclaimers beyond standard', 'Audit rights 30 days notice (standard 45)'],
    contractId: 'LIC-2024-VS-089',
    lastReviewed: 'Jan 28, 2026',
  },
]

// —— Contracts (for Overview recent list and any tables)
export interface ContractRow {
  id: string
  name: string
  counterparty: string
  type: string
  status: ContractStatus
  risk: RiskLevel
  expiry: string
  value: string
}

export const contracts: ContractRow[] = [
  { id: 'MSA-2024-0891', name: 'Master Services Agreement', counterparty: 'Acme Corp', type: 'MSA', status: 'Active', risk: 'Low', expiry: 'Jun 15, 2026', value: '$2.4M' },
  { id: 'DPA-2025-0234', name: 'Data Processing Agreement', counterparty: 'GlobalTech Ltd', type: 'DPA', status: 'Active', risk: 'Medium', expiry: 'Jan 22, 2027', value: '—' },
  { id: 'SVC-2024-1102', name: 'Service Agreement', counterparty: 'Meridian Partners', type: 'SVC', status: 'Under Review', risk: 'Low', expiry: 'Mar 28, 2026', value: '$840K' },
  { id: 'NDA-2025-0445', name: 'Non-Disclosure Agreement', counterparty: 'NovaStar Inc', type: 'NDA', status: 'Active', risk: 'High', expiry: 'Apr 10, 2026', value: '—' },
  { id: 'SOW-2024-0667', name: 'Statement of Work', counterparty: 'Apex Financial', type: 'SOW', status: 'Expiring', risk: 'Medium', expiry: 'Mar 31, 2026', value: '$310K' },
  { id: 'MSA-2025-0123', name: 'Master Services Agreement', counterparty: 'Titan Industries', type: 'MSA', status: 'Active', risk: 'Low', expiry: 'Dec 01, 2027', value: '$1.1M' },
  { id: 'LIC-2024-0789', name: 'License Agreement', counterparty: 'Vertex Solutions', type: 'LIC', status: 'Under Review', risk: 'High', expiry: 'May 20, 2026', value: '$580K' },
  { id: 'SLA-2025-0312', name: 'Service Level Agreement', counterparty: 'Pinnacle Group', type: 'SLA', status: 'Active', risk: 'Medium', expiry: 'Sep 15, 2026', value: '$220K' },
]

---
title: "Decision Artifacts"
description: "Templates and frameworks for the key decision artifacts in enterprise AI transformation."
section: "Proof"
layout: standard
slug: "decision-artifacts"
---
# Decision Artifacts

Strategy is expressed through decisions. These artifacts are the working documents of an AI transformation office. Each is shown inline as a worked example and available as a downloadable template.

For architectural decision rationale (why we chose this approach), see [Decision Records](decision-records.md). This page provides operational templates for executing and governing the approach.

---

## Board AI Status Memo

**TO:** Board of Directors
**FROM:** Chief AI Officer
**DATE:** Q1 2026
**RE:** AI Program Status — Quarterly Update

### Executive Summary

The AI portfolio delivered $18.2M in realized value in Q1 against $11.4M in total program spend year-to-date. Three use cases have been promoted from pilot to production. One use case has been paused pending data quality remediation. Regulatory posture across EU and APAC jurisdictions is compliant; a new obligation under the EU AI Act takes effect in Q3 and requires board ratification of the updated risk classification policy.

### Portfolio Status

| Use Case | Status | Value Delivered (YTD) | Risk Level |
|---|---|---|---|
| Credit underwriting assist | Production | $9.1M (measured, finance-signed) | High |
| Claims triage automation | Production | $5.6M (measured, finance-signed) | Medium |
| Procurement spend analysis | Production | $3.5M (measured, finance-signed) | Low |
| Customer churn prediction | Pilot | $0 (not yet promoted) | Medium |
| Contract review assist | Paused — data quality | $0 | High |

### Investment vs. Return

| | Amount |
|---|---|
| YTD program spend | $11.4M |
| Realized value (actuals, finance-signed) | $18.2M |
| Projected value Q2–Q4 (pipeline) | $31.0M |
| Payback ratio (YTD actuals only) | 1.6x |

Projected value figures are excluded from the payback ratio. Only finance-signed actuals are included in return calculations.

### Risk Posture

| Risk | Mitigation Status |
|---|---|
| Credit model drift (fairness metrics) | Monitoring in place; no threshold breach in Q1. Quarterly external audit scheduled for Q2. |
| Shadow AI in legal department | DLP controls deployed in January. Incident count dropped from 14 (Q4) to 3 (Q1). Approved alternative rolled out to 180 users. |
| Contract review data quality | Use case paused. Remediation plan approved. Target re-launch: Q2 week 6. |

### Regulatory Compliance

| Jurisdiction | Status | Notes |
|---|---|---|
| EU AI Act | Compliant — current obligations | Q3 obligation for high-risk systems requires updated risk classification policy (see Decisions Required) |
| MAS (Singapore) | Compliant | Annual attestation filed February 2026 |
| GDPR | Compliant | Data handling agreements in place for all production use cases |

### Key Decisions Required

1. **Ratify updated AI risk classification policy** to meet Q3 EU AI Act obligations. Legal and compliance have reviewed. Requires board resolution by end of Q2.
2. **Approve $4.2M incremental investment** for Phase 2 of the credit underwriting program. Business case attached. CFO has reviewed; recommends approval.
3. **Confirm governance authority** for cross-jurisdictional agent deployments. Current policy is silent on agents operating across regulatory boundaries. CAIO and General Counsel have drafted proposed language for board endorsement.

[Download template](templates/board-memo-template.md)

---

## AI Investment Scorecard

Use this scorecard to evaluate and compare AI use case candidates before committing to pilot investment. Score each criterion 1 to 5. Aggregate scores guide prioritization, not replace judgment.

### Scoring Guide

| Criterion | 1 (Low) | 3 (Moderate) | 5 (High) |
|---|---|---|---|
| Strategic alignment | Tangential to strategy | Supports a strategic priority | Core to top-3 strategic objective |
| Data readiness | Data does not exist or is inaccessible | Data exists with known quality issues | Clean, accessible, documented data |
| Process readiness | Process undefined or highly variable | Process documented, some exceptions | Stable, well-documented, measurable process |
| Expected value | Under $500K annual | $500K–$2M annual | Over $2M annual |
| Governance complexity | Multiple jurisdictions, high-risk category | Single jurisdiction, medium risk | Low risk, standard controls sufficient |
| Time to value | 18+ months to first measurement | 6–18 months | Under 6 months to measurable outcome |

### Scored Use Cases

| Criterion | Credit Underwriting | HR Screening | Inventory Forecast | Internal IT Helpdesk |
|---|---|---|---|---|
| Strategic alignment | 5 | 3 | 4 | 2 |
| Data readiness | 4 | 2 | 5 | 4 |
| Process readiness | 4 | 3 | 5 | 5 |
| Expected value | 5 | 2 | 4 | 2 |
| Governance complexity | 2 | 1 | 4 | 5 |
| Time to value | 3 | 3 | 5 | 5 |
| **Total** | **23** | **14** | **27** | **23** |
| **Recommendation** | Proceed (high value, manage governance) | Hold (data and governance gaps) | Proceed (strong on all dimensions) | Proceed (quick win, low risk) |

**Note on governance complexity:** Lower scores indicate higher complexity, not lower importance. A score of 2 on governance complexity means governance requirements are substantial and must be factored into sequencing and resource allocation.

[Download template](templates/investment-scorecard-template.md)

---

## Model Inventory Template

The model inventory is a living register of all AI systems in production or active pilot. It is the foundation for governance coverage reporting, regulatory attestation, and incident tracking. Every AI system the organization operates should have an entry. The inventory owner is the CAIO's office; business owners are responsible for keeping their entries current.

| Model / System | Business Owner | Technical Owner | Data Sources | Risk Tier | Deployment Status | Last Evaluated | Incidents (12 mo) | Regulatory Scope |
|---|---|---|---|---|---|---|---|---|
| Credit underwriting assist | VP Credit Risk | ML Engineering Lead | Core banking, bureau feeds, CRM | Tier 3 | Production | 2026-02-15 | 1 (resolved) | EU AI Act (high-risk), sector-specific (EBA) |
| Customer churn prediction | VP Growth | Analytics Platform | CRM, product usage, support tickets | Tier 2 | Pilot | 2026-01-28 | 0 | None |
| Procurement spend analysis | CPO | Data Engineering | ERP, vendor master, purchase orders | Tier 1 | Production | 2025-12-10 | 0 | GDPR (data minimization review complete) |
| Contract review assist | General Counsel | Legal Tech Team | Contract repository, SharePoint | Tier 3 | Paused | 2026-02-01 | 0 | EU AI Act (high-risk candidate, under review) |

**Risk Tier Definitions:**

- Tier 1: Low impact, reversible decisions, no personal data
- Tier 2: Moderate impact, human review in workflow, limited personal data
- Tier 3: High impact or consequential decisions affecting individuals
- Tier 4: Autonomous action with financial, legal, or safety consequences

[Download template](templates/model-inventory-template.md)

---

## Phase-Gate Review Template

**Program:** Enterprise Credit Intelligence
**Gate:** Phase 1 to Phase 2
**Review Date:** 2026-02-20
**Reviewers:** CAIO, VP Credit Risk, CFO representative, CISO
**Decision:** Go (with conditions)

### Phase 1 Objectives

| Objective | Met? | Evidence |
|---|---|---|
| Demonstrate measurable improvement in underwriter decision quality | Yes | 18% reduction in manual override rate vs. baseline (finance-signed, 90-day measurement period) |
| Validate data pipeline integrity end-to-end | Yes | Data quality audit completed; 2 issues identified and resolved prior to gate |
| Confirm regulatory classification | Partial | EU AI Act high-risk classification confirmed; sector-specific EBA guidance review in progress (not blocking) |
| Establish monitoring baseline | Yes | Dashboard operational; drift thresholds set and validated against 60 days of production data |
| User adoption above 75% among target population | Yes | 84% of underwriters using tool on >80% of eligible cases |

### Risks Surfaced

- **Data quality in bureau feed (Severity: Medium):** One bureau had 3.2% missing fields during November. Root cause identified (API version mismatch). Resolved January 2026. No evidence of model impact; confirmed by model performance review.
- **Fairness metric variance across demographic segments (Severity: High):** Approval rate disparity between two demographic segments exceeded internal threshold in December. Investigation concluded variance attributable to legitimate credit factors. External audit scheduled for Q2 as control.
- **EBA guidance pending (Severity: Low):** Sector-specific guidance not yet final. Legal monitoring; no action required until published.

### Governance Compliance

- [x] Data handling agreement in place and current
- [x] Risk classification documented and signed by CISO
- [x] Monitoring and alerting operational
- [x] Incident response runbook tested
- [x] User training complete (94% completion rate)
- [x] Rollback procedure documented and tested
- [ ] External fairness audit complete — *scheduled Q2, required before Phase 3 gate*

### Go/No-Go Recommendation

**Recommendation: Go**

Phase 1 objectives substantially met. The fairness variance finding is acknowledged and controlled: the Q2 external audit is a binding condition, not an optional follow-on. Phase 2 scope (expanded user population and additional use case verticals) is approved to proceed.

### Conditions for Phase 2

1. External fairness audit must be completed and findings reviewed before Phase 3 gate can open
2. EBA guidance must be incorporated into the regulatory documentation within 30 days of publication
3. Data quality monitoring on bureau feeds must be maintained at current frequency; any recurrence triggers escalation to CAIO within 24 hours

[Download template](templates/phase-gate-review-template.md)

---

## Risk Classification Worksheet

Use this worksheet to determine the risk tier for any AI use case at intake. Score each dimension independently, then sum for the aggregate tier.

### Scoring Dimensions

| Dimension | Score 1 | Score 2 | Score 3 | Score 4 |
|---|---|---|---|---|
| **Data sensitivity** | Non-personal, public data | Internal business data | Personal data (non-sensitive categories) | Sensitive personal data (financial, health, legal, biometric) |
| **Decision impact** | Informational only; human decides independently | Influences a human decision | Determines an outcome with human ratification | Determines an outcome autonomously or with minimal human review |
| **Autonomy level** | Human-driven; AI as reference tool | AI recommendation, human action | AI initiates action, human can intercept | AI takes action; intervention requires explicit override |
| **Regulatory scope** | No specific regulatory requirement | General data protection requirements | Sector-specific regulations (financial services, healthcare, insurance) | EU AI Act high-risk category or equivalent national law |

### Tier Assignment

| Aggregate Score | Risk Tier | Required Controls |
|---|---|---|
| 4–6 | Tier 1: Standard | Standard data handling, documented use case, owner assigned |
| 7–10 | Tier 2: Enhanced | Tier 1 plus: monitoring dashboard, defined metrics, quarterly review |
| 11–13 | Tier 3: Senior Approval + Audit | Tier 2 plus: CAIO sign-off, CISO review, documented audit trail, annual external review |
| 14–16 | Tier 4: Board Oversight | Tier 3 plus: board-level reporting, external audit before production, legal opinion |

### Worked Example: Claims Triage Automation

A proposed system will automatically classify incoming insurance claims by severity and route them to the appropriate adjuster queue. Claims below $5,000 will be auto-approved if they meet defined criteria; claims above $5,000 or outside criteria will always go to a human adjuster.

| Dimension | Score | Rationale |
|---|---|---|
| Data sensitivity | 3 | Processes personal data (policyholder identity, incident details); not sensitive categories |
| Decision impact | 3 | Auto-approval for low-value claims; human ratification for all others |
| Autonomy level | 3 | Auto-approves within defined bounds; human adjuster reviews everything above threshold |
| Regulatory scope | 3 | Insurance sector regulations apply; not EU AI Act high-risk category under current guidance |
| **Total** | **12** | **Tier 3: Senior Approval + Audit** |

**Outcome:** CAIO and CISO sign-off required before pilot launch. Annual external audit required as a condition of continued production operation. Monitoring dashboard must be operational on day one of pilot.

[Download template](templates/risk-classification-worksheet.md)

---

## Before/After Program Redesign

The table below contrasts the structural patterns of ad-hoc AI programs with the patterns of a mature AI operating model. This is not one organization's story. It is the consistent delta observed when programs move from reactive to structured.

| Dimension | Before: Ad-Hoc AI | After: Structured Operating Model |
|---|---|---|
| **Team Structure** | Data scientists embedded in business units, no central function, no shared standards, duplicated capability across teams | Hub with central governance, standards, and shared infrastructure; spokes with qualified practitioners in major business units; clear lines of escalation |
| **Decision Rights** | Use case approvals handled informally by local IT or business unit management; no threshold-based escalation; governance discovered after deployment, if at all | Defined intake process; risk tier determines approval authority; CAIO has program-level authority; board ratifies policy, not individual decisions |
| **Governance Process** | Post-hoc review when incidents occur; risk assessment ad-hoc and inconsistent; no model inventory; regulatory compliance handled by legal as one-off requests | Pre-deployment risk classification at intake; living model inventory with governance coverage tracked; regulatory obligations mapped to use cases; quarterly governance review |
| **Measurement** | Activity metrics (models deployed, users trained); projected savings cited in board updates; no finance sign-off; no baseline documentation; actuals rarely measured | Three-layer measurement (activity, outcome, value); finance sign-off on all value claims; documented baselines before pilots launch; actuals and projections reported separately |
| **Incident Handling** | No defined escalation path; incidents surfaced by business unit to IT without standard classification; post-mortems inconsistent; no cross-program learning | Classified incident taxonomy (model, data, process, governance); defined escalation by tier; post-mortem format standardized; findings fed back into governance policy |
| **Portfolio Management** | No portfolio view; each use case self-reported by its sponsor; redundant initiatives not visible; no mechanism to exit failed use cases | Quarterly portfolio review against strategic alignment, value delivered, and governance compliance; consolidation and exit decisions made at program level; no exceptions to exit criteria |
| **Regulatory Posture** | Regulatory requirements identified reactively; legal engaged when problems arise; no mapping of obligations to specific use cases; single-jurisdiction thinking | Regulatory horizon scanning embedded in governance calendar; obligations mapped to use cases by jurisdiction; attestation readiness maintained continuously; multi-jurisdiction programs flagged at intake |

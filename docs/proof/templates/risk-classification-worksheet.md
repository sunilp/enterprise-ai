# AI Risk Classification Worksheet -- Template

**System name:** _[Name of the AI system being classified]_
**Assessed by:** _[Name, Role]_
**Date:** _[Date]_
**Next reclassification due:** _[Date -- typically 12 months or on material change]_

---

## How to Use This Worksheet

Score the AI system across four dimensions. Each dimension uses a 1-4 scale. Sum the four scores to produce a raw total (4-16). Apply the tier assignment table to determine the system's risk tier.

Complete one worksheet per AI system. If a single platform hosts multiple distinct AI use cases with materially different risk profiles, complete a separate worksheet for each.

---

## Dimension 1: Consequence of Failure

_What is the worst credible harm if this system fails, produces incorrect output, or is misused?_

| Level | Score | Definition |
|---|---|---|
| Minimal | 1 | Errors affect internal operations only. No customer, patient, or third-party harm. Easily corrected before any downstream impact. |
| Moderate | 2 | Errors may cause inconvenience or minor financial loss to individuals. Harm is reversible. A human review layer is in place. |
| Significant | 3 | Errors could cause material financial harm, operational disruption, or affect a protected characteristic. Partial reversibility. |
| Severe | 4 | Errors could cause physical harm, irreversible financial loss, denial of essential services, or legal consequences for individuals. |

**Score selected:** _[ 1 / 2 / 3 / 4 ]_

**Justification:** _[One sentence explaining why this score was chosen for this specific system.]_

---

## Dimension 2: Autonomy and Human Oversight

_To what degree does this system act without human review before its output has effect?_

| Level | Score | Definition |
|---|---|---|
| Human-in-the-loop | 1 | Every system output is reviewed and approved by a human before any action is taken. |
| Human-on-the-loop | 2 | A human monitors system decisions and can intervene. Automated action occurs unless overridden within a defined window. |
| Human-in-the-exception | 3 | The system acts autonomously in normal cases. Humans review only flagged or anomalous cases. |
| Fully autonomous | 4 | The system acts without human review. No routine human checkpoint exists in the operational workflow. |

**Score selected:** _[ 1 / 2 / 3 / 4 ]_

**Justification:** _[One sentence explaining why this score was chosen for this specific system.]_

---

## Dimension 3: Data Sensitivity

_What is the sensitivity of the data the system processes, stores, or accesses?_

| Level | Score | Definition |
|---|---|---|
| Public or anonymised | 1 | Data is publicly available or fully anonymised in a way that cannot be reasonably reversed. No personal data. |
| Internal or pseudonymised | 2 | Internal business data. May include pseudonymised personal data where re-identification is unlikely without additional keys. |
| Personal or confidential | 3 | Personally identifiable information (PII), commercially sensitive data, or data subject to a specific contractual confidentiality obligation. |
| Special category or regulated | 4 | Health data, biometric data, financial account data, criminal records, or any data classified as special category under applicable law. |

**Score selected:** _[ 1 / 2 / 3 / 4 ]_

**Justification:** _[One sentence explaining why this score was chosen for this specific system.]_

---

## Dimension 4: Regulatory Exposure

_What is the organisation's exposure to regulatory enforcement or compliance obligation arising from this system?_

| Level | Score | Definition |
|---|---|---|
| Minimal | 1 | No specific AI regulation applies. General data protection and corporate governance obligations only. |
| Indirect | 2 | The system operates in a regulated sector (e.g., financial services, healthcare) but is not itself subject to specific AI regulation. |
| Direct -- emerging | 3 | Specific AI regulation applies or is anticipated within 12 months. Compliance programme underway but not complete. |
| Direct -- active | 4 | Subject to active regulatory requirement with defined compliance deadlines and potential enforcement action for non-compliance. |

**Score selected:** _[ 1 / 2 / 3 / 4 ]_

**Justification:** _[One sentence explaining why this score was chosen for this specific system.]_

---

## Scoring Formula and Tier Assignment

**Raw score:** _[Sum of Dimension 1 + 2 + 3 + 4]_ = _[ _ ]_

| Raw Score | Risk Tier | Governance Requirement |
|---|---|---|
| 4-6 | **Tier 4 -- Low** | Register in model inventory. Annual review. Standard change management. |
| 7-9 | **Tier 3 -- Moderate** | Register in model inventory. Semi-annual review. Risk assessment on deployment. Change approval required. |
| 10-12 | **Tier 2 -- High** | Full model risk management lifecycle. Quarterly review. Independent validation before production. CISO and risk committee sign-off. |
| 13-16 | **Tier 1 -- Critical** | Highest governance controls. Board-level awareness. Pre-deployment independent audit. Continuous monitoring. Regulatory notification where required. |

**Assigned tier:** _[ Tier 1 / Tier 2 / Tier 3 / Tier 4 ]_

---

## Override Provision

_In some cases, a scoring total may not fully capture a material risk factor. Use this section to record any override to the calculated tier, with mandatory justification._

Override applied: _[ Yes / No ]_

If yes:
- Calculated tier: _[Tier]_
- Override tier: _[Tier]_
- Override reason: _[Mandatory. State the specific factor not captured in the scoring dimensions that justifies the override.]_
- Approved by: _[Name, Role, Date]_

---

## Sign-off

| Role | Name | Date |
|---|---|---|
| Assessor | | |
| Risk / Compliance reviewer | | |
| Business Owner | | |

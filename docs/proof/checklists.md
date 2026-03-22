# Assessment Checklists

These checklists are designed for practical use in AI transformation programs. They are not theoretical frameworks. Each item represents a specific, verifiable condition that can be assessed by a named person and documented with evidence.

For each item, record: the assessment date, the assessor, the status (complete, in progress, not started, not applicable), and any relevant notes or evidence references.

!!! tip "Using These Checklists"
    Do not use checklists as self-assessments by the team doing the work. The most valuable assessment is conducted by someone independent of the deployment team, with authority to delay launch if gaps are found. Checklists used only for self-validation become compliance theater.

---

## 1. AI Readiness Assessment

Use this checklist to assess organizational readiness before launching an AI transformation program. Address gaps before proceeding to the pilot phase.

### Strategy

- [ ] The organization has a documented AI strategy aligned to business objectives, not just a list of use cases
- [ ] Executive leadership has made an explicit, documented commitment to AI investment and timeline
- [ ] Decision rights are defined: who approves AI initiatives, who can block them, and at what thresholds
- [ ] The CAIO or equivalent role exists with appropriate authority and budget

### Data

- [ ] Core data assets required for priority use cases are identified, located, and accessible
- [ ] Data quality baselines are documented for data assets required by priority use cases
- [ ] Data governance processes cover AI-specific use cases (training data, inference data, output data)
- [ ] A data classification scheme exists and is applied to data assets AI systems will access

### Process

- [ ] At least three high-priority AI use cases have been documented with sufficient process clarity for AI deployment (inputs, outputs, decision logic, exception handling)
- [ ] Process owners are identified for each priority use case and are actively engaged in the AI program

### Talent

- [ ] The current AI skills inventory is documented by role and department
- [ ] The skills gap between current state and target state is quantified
- [ ] A workforce development plan exists with named programs, owners, and timelines

### Governance

- [ ] A draft AI policy exists and is under active development or already approved
- [ ] A use case intake process exists or is being designed
- [ ] Risk classification criteria for AI use cases are defined

---

## 2. Pilot Launch Readiness

Use this checklist before launching any AI pilot. All items should be complete before users are onboarded.

- [ ] The business outcome the pilot is intended to demonstrate is documented in one sentence
- [ ] The baseline measurement for the primary outcome metric is documented, dated, and signed off by the business owner and a finance partner
- [ ] The success threshold is defined: the specific measured result that will constitute a successful pilot
- [ ] The measurement owner is named (a person, not a team) and has confirmed their role and the measurement methodology
- [ ] The future-state workflow is documented: what will users do differently when AI is available?
- [ ] The pilot scope is defined: which users, which processes, which time period
- [ ] User onboarding and training materials are complete and have been reviewed by at least one prospective user
- [ ] A data handling agreement or equivalent is in place for any personal or sensitive data the pilot will process
- [ ] A rollback procedure is documented and tested: how will the pilot be wound down if needed?
- [ ] The evaluation date is scheduled in advance on the calendars of the business owner and the measurement owner

---

## 3. Production Deployment Gate

Use this checklist at Gate 2 to determine whether a pilot is ready to promote to production. Items marked with a star are hard stops: production deployment cannot proceed if these items are incomplete.

- [ ] **Measured pilot results meet the pre-defined success threshold** (hard stop)
- [ ] **Attribution methodology is documented and has been reviewed by a finance partner** (hard stop)
- [ ] **Future-state workflow redesign is complete and confirmed by the process owner** (hard stop)
- [ ] **Data handling and privacy review is complete and approved** (hard stop)
- [ ] Production infrastructure is confirmed ready: capacity, availability, monitoring, and alerting
- [ ] Rollback procedure for production deployment is documented and tested
- [ ] Support model is defined: who handles user issues, model degradation, and escalations
- [ ] Security review is complete, including access controls, audit logging, and vulnerability assessment
- [ ] The monitoring dashboard is operational and has been reviewed by the operations team
- [ ] Model performance monitoring is configured with defined thresholds for alerting
- [ ] Business continuity plan is documented: how does the process operate if the AI system is unavailable?
- [ ] User training for production deployment is complete or scheduled before go-live date

---

## 4. Agent Deployment Readiness

Use this checklist before deploying any agentic AI system. The higher the agent's action tier (see [ADR-003](decision-records.md#adr-003-agent-deployment-authorization-model)), the more rigorously each item must be validated.

- [ ] The agent's action scope is explicitly documented: what can the agent do, what can it not do, and what are the hard limits?
- [ ] Trust boundaries are defined and technically enforced: which systems, data stores, and external services can the agent access?
- [ ] Human-in-the-loop checkpoints are defined for decisions above a specified impact threshold
- [ ] An escalation protocol exists for situations the agent cannot handle: what triggers escalation, how is it surfaced, and who responds?
- [ ] A human override mechanism is implemented and tested: any authorized user can halt agent action within a defined timeframe
- [ ] Anomaly monitoring is configured to detect agent behavior outside expected parameters
- [ ] The authorization decision is documented and signed by the CAIO and CISO (and executive sponsor for Tier 3 agents)
- [ ] A tabletop exercise has been conducted simulating an agent failure or unintended action scenario
- [ ] Data retention and audit logging for all agent actions is confirmed operational
- [ ] The rollback or containment procedure for the agent has been tested end-to-end

---

## 5. Board Reporting Readiness

Use this checklist before publishing the quarterly board AI report. Board reports that fail this checklist should be returned to the author for revision, not submitted.

- [ ] All financial impact figures are labeled as either "measured actuals" or "projections." No blending of the two in the same number.
- [ ] Every measured actual has a documented methodology footnote (what was measured, over what period, using what comparison)
- [ ] The risk section names specific risks, not generic categories. At least three named risks with current status and mitigation approach.
- [ ] The portfolio view shows each initiative's current stage, investment to date, and return to date (or leading indicators if return is not yet visible)
- [ ] Shadow AI exposure is reported, with an estimate basis and mitigation status
- [ ] The report includes at least one decision the board is being asked to make or ratify
- [ ] The format is consistent with the previous quarter's report (boards should not need to re-orient to a new format)
- [ ] The report has been reviewed by the CFO (for financial figures) and the CISO (for risk section) before submission

# Decision Records

Architecture Decision Records (ADRs) are a structured format for documenting significant decisions, the context that drove them, and the consequences that followed. In AI transformation, ADRs serve a dual purpose: they force rigor in the decision-making process and they create an institutional record that survives personnel changes.

These templates are designed for AI transformation decisions specifically. Adapt the fields to your organization's existing ADR format if one exists.

For operational executive templates (board memos, scorecards, inventories), see [Decision Artifacts](decision-artifacts.md).

---

## ADR-001: AI Operating Model Selection

**Status:** Template
**Date:** [Decision date]
**Deciders:** [CEO, CIO, CAIO, and relevant executive stakeholders]

### Context

The organization is deploying AI across multiple business units and functions. Without a defined operating model, each unit will make independent decisions about governance, vendor selection, infrastructure, and risk management. This fragmentation creates duplicated costs, inconsistent quality, unmanaged risk, and an inability to scale what works.

Three primary operating models exist for enterprise AI:

- **Centralized:** All AI capability, governance, and deployment authority sits in a central function (typically the CAIO's team or a Center of Excellence). Business units are consumers, not producers.
- **Hub-and-spoke:** A central hub defines standards, governance, and shared infrastructure. Distributed "spokes" in business units have qualified AI practitioners who operate within hub-defined guardrails.
- **Federated:** Business units operate largely independently. Central governance is minimal and focused on risk boundaries rather than standards. Typically appropriate for holding company structures or highly autonomous business unit cultures.

### Decision

[Document the selected model here.]

### Rationale

| Factor | Centralized | Hub-and-Spoke | Federated |
|---|---|---|---|
| Governance consistency | Highest | High | Variable |
| Speed to deploy | Slowest | Moderate | Fastest |
| Business unit alignment | Lowest | High | Highest |
| Shared infrastructure efficiency | Highest | High | Lowest |
| Appropriate for regulated industries | Yes | Yes | Risky |
| Scales with organizational complexity | Poorly | Well | Reasonably |

The hub-and-spoke model is appropriate for most large enterprises because it balances central governance with business unit proximity. Centralized models are appropriate for organizations in early AI maturity stages or in highly regulated sectors where consistency is non-negotiable. Federated models are appropriate when business units operate as largely independent entities with distinct regulatory environments.

### Consequences

**If centralized:**
- Central team becomes a bottleneck as demand grows. Plan for scaling mechanisms (triage processes, self-service capabilities) from the start.
- Business unit engagement will require active effort. Central teams that do not maintain business unit relationships produce governance frameworks that business units route around.

**If hub-and-spoke:**
- Spoke practitioners must be genuinely qualified. "AI ambassador" programs that place enthusiastic non-practitioners in spoke roles produce confusion, not capability.
- Standards must be clear enough for spokes to operate independently. Ambiguous standards produce inconsistent outcomes at the spoke level.

**If federated:**
- Risk aggregation is the primary concern. Individual units may make locally reasonable decisions that create systemic risk. A minimum viable governance layer at the center is required even in federated models.

### Alternatives Considered

[Document alternatives that were seriously evaluated but not selected, with the reason for rejection.]

### Review Date

[Date at which this decision will be reviewed. Operating model decisions should be reviewed annually.]

---

## ADR-002: GenAI Governance Framework

**Status:** Template
**Date:** [Decision date]
**Deciders:** [CAIO, CIO, General Counsel, CISO, and Chief Risk Officer]

### Context

Deploying generative AI in enterprise contexts without a governance framework creates legal, reputational, and operational risk. Governance frameworks can be built internally, purchased from vendors, or constructed as a hybrid. Each approach has different capability, cost, and velocity implications.

The governance framework must address: use case intake and classification, risk assessment methodology, approval authority at each risk tier, monitoring and incident response, and employee obligations.

### Decision

[Document the selected approach: build, buy, or hybrid.]

### Rationale

**Build:**
- Full control over framework design and evolution
- Requires significant internal expertise to design well
- Takes 3 to 6 months to reach operational state
- No external dependency for framework updates as regulations change
- Appropriate when the organization has strong existing risk governance capability and the AI program is large enough to justify the investment

**Buy:**
- Faster to operational state (typically 4 to 8 weeks for implementation)
- Vendor frameworks embed industry norms and regulatory interpretations
- Creates vendor dependency for framework evolution
- Quality varies significantly across vendors
- Appropriate when the organization lacks internal governance expertise or needs rapid deployment

**Hybrid:**
- Core risk classification and policy built internally; tooling and workflow automation purchased
- Balances control with speed
- Most appropriate for organizations with moderate AI maturity and existing governance infrastructure

### Consequences

**Buy and hybrid approaches** create dependency on vendor roadmaps for regulatory updates. EU AI Act, state-level AI regulations, and sector-specific guidance are evolving. A vendor's interpretation of those requirements may diverge from regulatory guidance.

**Build approaches** require ongoing maintenance investment. A governance framework that is not actively maintained degrades. Assign a permanent owner with the authority and budget to update the framework as the program and the regulatory environment evolve.

### Alternatives Considered

[Document alternatives evaluated.]

### Review Date

[Governance framework decisions should be reviewed semi-annually given regulatory evolution rate.]

---

## ADR-003: Agent Deployment Authorization Model

**Status:** Template
**Date:** [Decision date]
**Deciders:** [CAIO, CTO, CISO, and General Counsel]

### Context

Agentic AI systems take actions autonomously: they browse the web, call APIs, write to databases, send emails, execute code, and interact with external systems. The risk profile of agent deployments is qualitatively different from the risk profile of AI-assisted decision support. Agents can cause irreversible harm at machine speed.

An authorization model defines: who can approve agent deployments, what actions agents are permitted to take without human confirmation, what actions require human-in-the-loop confirmation, and what actions are prohibited regardless of business case.

### Decision

[Document the selected authorization model.]

### Rationale

Three authorization tiers are typical:

**Tier 1: Read-only agents.** Agents that retrieve and synthesize information but take no external actions. Lowest risk. Can be authorized by business unit AI lead within hub-and-spoke governance.

**Tier 2: Bounded-action agents.** Agents that take defined, reversible actions within explicit boundaries (e.g., update a CRM field, schedule a meeting, send an internal notification). Moderate risk. Require CAIO-level approval and defined rollback procedures.

**Tier 3: High-impact agents.** Agents that take external actions with financial, legal, or reputational consequences (e.g., send customer communications, execute transactions, modify production systems). Highest risk. Require executive sponsor and CISO approval, continuous monitoring, and human-in-the-loop at defined checkpoints.

### Consequences

An authorization model that is too restrictive will cause business units to deploy agents outside the framework (shadow AI). An authorization model that is too permissive will result in agent incidents that damage confidence in the entire AI program.

All agent deployments must include: defined trust boundaries (what the agent can and cannot access), an escalation protocol for situations the agent cannot handle, a human override mechanism, and monitoring for anomalous behavior.

### Alternatives Considered

**Case-by-case authorization with no standing framework:** Creates inconsistency and delays. Every agent deployment requires a novel risk assessment. Not scalable.

**Blanket prohibition on agent deployment:** Avoids the governance challenge but cedes competitive ground as agent capabilities mature. Not sustainable.

### Review Date

[Agent authorization models should be reviewed quarterly given the rapid evolution of agent capabilities and associated risk patterns.]

---

## ADR-004: AI Measurement Framework Design

**Status:** Template
**Date:** [Decision date]
**Deciders:** [CAIO, CFO, and business unit leaders]

### Context

The organization needs a consistent approach to measuring AI impact across all use cases. Without a shared measurement framework, each team will measure differently, results will be incomparable, portfolio decisions will be uninformed, and board reporting will lack credibility.

The framework must define: the three measurement layers (activity, outcome, value), the methodology for establishing baselines, the attribution approach for isolating AI's contribution, and the reporting cadence and format.

### Decision

[Document the selected measurement framework approach.]

### Rationale

The measurement framework must balance rigor with practicality. Academic-grade attribution methodology is often impractical in operational contexts. The framework should define the minimum acceptable methodology for each use case tier, with more rigorous requirements for higher-value and higher-risk deployments.

**Key design decisions within the framework:**

**Baseline documentation standard:** What constitutes an acceptable baseline? Minimum: a documented metric, a data source, a time period, and a sign-off from the business owner and a finance partner.

**Attribution methodology by use case tier:** Low-value use cases can use pre/post comparison with documented confound acknowledgment. High-value use cases require controlled comparison or matched cohort analysis.

**Measurement period:** How long before results are considered valid? Recommendation: minimum 90 days for operational use cases, 6 months for strategic use cases.

**Reporting separation:** Actuals and projections must be reported separately in all contexts. Never blend them.

### Consequences

A measurement framework without enforcement is decorative. Designate a measurement oversight role (typically within the CAIO's office or Finance) with the authority to reject pilot launches that do not have documented baselines and to flag reports that blend actuals with projections.

### Alternatives Considered

**Decentralized measurement (each team measures independently):** Results in incomparable data. Portfolio decisions become impossible. Board reporting lacks credibility.

**No formal framework:** Business units default to activity metrics and projected savings. Actual value delivered is never known.

### Review Date

[Measurement framework should be reviewed annually, or after any significant change in portfolio scale or complexity.]

---

## ADR-005: Shadow AI Response Strategy

**Status:** Template
**Date:** [Decision date]
**Deciders:** [CAIO, CISO, General Counsel, and HR]

### Context

Shadow AI is the use of AI tools by employees outside of approved organizational channels. It is universal. Every enterprise with AI-capable employees has shadow AI. The question is not whether shadow AI exists. It is what the organization's response to it is.

Response options exist on a spectrum from prohibition to permissive. Pure prohibition is ineffective: AI tools are freely available, and employees motivated to use them will use them regardless of policy. Pure permissiveness abandons governance entirely and creates unacceptable data and liability exposure.

### Decision

[Document the selected response strategy.]

### Rationale

Three viable response strategies exist:

**Managed tolerance:** Establish a clear policy that distinguishes between acceptable and unacceptable shadow AI use. Personal productivity tools used on non-sensitive tasks in personal accounts: tolerated. Sensitive data processed through consumer AI tools: prohibited. Pair the policy with a fast-track intake process so employees can get approved alternatives quickly.

**Rapid sanctioning:** Move the approved tool portfolio fast enough that shadow AI has no functional advantage over approved tools. If the approved copilot is better than the consumer alternative, shadow AI usage declines naturally. This requires sustained investment in the approved tool portfolio.

**Detection and remediation:** Deploy tooling that identifies shadow AI usage (browser plugins, network monitoring, DLP integration) and establishes a remediation process that is educational rather than punitive on first occurrence. Reserved for organizations with high regulatory risk in specific departments (e.g., legal, finance, clinical).

Most organizations will use a combination of managed tolerance and rapid sanctioning. Detection and remediation should be applied selectively to high-risk departments.

### Consequences

**Punitive responses to shadow AI produce chilling effects.** Employees who fear discipline for using AI tools that genuinely help them will stop reporting AI-related incidents, route around governance more creatively, and disengage from the official AI program. Design the response to redirect, not punish.

**The approved tool portfolio must be genuinely good.** The fastest way to reduce shadow AI is to make the approved alternative better than the shadow alternative. This requires sustained investment and a feedback loop from employees to the CAIO's team.

### Alternatives Considered

**Blanket prohibition with disciplinary enforcement:** Reduces visible shadow AI usage. Does not eliminate actual usage. Creates adversarial dynamic between employees and AI governance. Counterproductive.

**No policy:** Creates legal, data, and liability exposure. Not viable.

### Review Date

[Shadow AI strategy should be reviewed semi-annually. Tool availability and employee behavior patterns evolve rapidly.]

---
title: "Reference Patterns"
description: "Production-tested architectural patterns for enterprise AI deployment, from retrieval-augmented generation to multi-agent orchestration."
section: "Architecture"
layout: showcase
slug: "reference-patterns"
---
# Reference Patterns

Not all AI deployments require the same architecture. The control requirements, governance overhead, and organizational maturity needed vary by pattern.

Treating every AI deployment as if it carries the same risk profile leads to one of two outcomes: under-controlling high-autonomy systems because the overhead of comprehensive controls seemed disproportionate, or over-controlling low-risk tools because the full governance stack was applied uniformly. Both are mistakes. The patterns below make the distinctions explicit.

---

## Four Deployment Patterns

### Assistive AI

Copilots, suggestions, drafting assistance. The human decides; the AI recommends. Low autonomy, low risk, highest adoption rate across the enterprise.

**What it looks like in practice:** Writing assistants, code completion, document summarization, research synthesis. Output is consumed by a human who applies judgment before acting on it.

**Control requirements:** Basic access control and usage monitoring are sufficient. Output quality sampling -- periodic human review of AI-generated content -- catches systematic errors before they propagate. Input filtering for PII and sensitive data applies, but full inline policy enforcement at every inference call is not required.

**Governance:** Lightweight approval process. Standard acceptable use policy covering what data can be submitted and what outputs can be shared externally. No use-case-specific risk assessment required for standard deployments.

**Maturity required:** Level 1-2. This pattern can be deployed without a mature control architecture, which is why it is the right starting point for most enterprises. The absence of autonomy limits the blast radius of control gaps.

**When to use:** High-volume knowledge work -- drafting, research, synthesis, code review. Internal productivity use cases. Content creation where human review precedes publication.

**When to avoid:** Regulated decision-making where the AI recommendation might carry undue weight without adequate human scrutiny. Customer-facing outputs without a human review step. Any context where the AI output is treated as a decision rather than input to a decision.

---

### Workflow Automation

Rules-based and AI-augmented process automation. The AI operates within a structured scope with defined inputs, outputs, and exception paths. Moderate autonomy within bounded parameters.

**What it looks like in practice:** Invoice processing, document classification, data extraction and routing, form completion, triage queues. The process structure is defined; AI handles the judgment steps within it.

**Control requirements:** Input and output validation at workflow boundaries -- confirming that data entering and leaving the AI step meets expected schemas and value ranges. Exception routing for cases that fall outside the AI's confidence thresholds. Audit trail at the workflow level, capturing which inputs produced which outputs and which cases were escalated.

**Governance:** Process-level risk assessment before deployment, not a full enterprise risk review. Approval tied to the specific workflow scope: what data is processed, what actions are triggered, what the exception handling looks like. Change management requirements when workflow logic or training data is updated.

**Maturity required:** Level 2-3. The organization needs working data pipelines, defined exception handling procedures, and the operational discipline to monitor workflow performance over time. Workflow automation deployed without reliable input validation creates compounding errors.

**When to use:** Standardized processes with clear, documentable rules. High-volume tasks where automation ROI justifies the deployment overhead. Processes where errors are recoverable -- mistakes can be caught in exception queues or downstream review steps.

**When to avoid:** Processes that depend on contextual judgment that cannot be encoded as rules. Low-volume, high-stakes decisions where the cost of an error exceeds the cost of human processing. Processes with high rate-of-change in their rules structure, where the automation overhead would exceed the savings.

---

### Agentic Operations

Autonomous agents executing multi-step tasks with tool use. High autonomy. The agent plans, executes, and iterates without human approval at each step. This is where control architecture requirements escalate significantly.

**What it looks like in practice:** Agents that research, draft, and file reports. Agents that execute multi-step workflows across systems. Agents that respond to events, take corrective actions, and log outcomes. Any deployment where the AI is calling tools, reading and writing data, and completing tasks with minimal human touchpoints.

**Control requirements:** The full control architecture is required. Identity and entitlements define what the agent can access and what actions it can take -- these must be scoped tightly to the specific task, not inherited from a broad service account. Audit and lineage capture every action, tool call, and output. Human override mechanisms are explicitly designed into the workflow: defined escalation triggers, pause conditions, and circuit breakers. Observability covers behavioral drift, anomalous action patterns, and cost trajectories.

**Governance:** Agent-specific risk assessment before deployment. Bounded autonomy definition -- a documented statement of what the agent is authorized to do and what falls outside its scope. Incident playbook for failure modes specific to that agent's toolset and action space. Review cycle defined at deployment for ongoing monitoring.

**Maturity required:** Level 3-4. Deploying agentic systems without the control architecture in place is the most common source of serious AI incidents. The autonomy that makes agents valuable is the same autonomy that amplifies the consequences of control failures.

For the strategic implications of the agentic shift, see [The Agentic Shift](../agentic-strategy/the-shift.md).

**When to use:** Exception-heavy processes where agent judgment adds more value than rule-based automation. Sufficient volume to justify the deployment and monitoring overhead. Processes where errors are recoverable or where human checkpoints exist at consequential decision points. Clear success criteria that can be measured continuously.

**When to avoid:** Novel or ambiguous situations where the agent's training data does not cover the decision space. Processes involving irreversible actions -- financial transactions, external communications, system deletions -- without explicit human checkpoint before execution. Deployments where the monitoring infrastructure to detect behavioral drift does not yet exist.

---

### Regulated Human-in-Loop

AI recommends; human approves. Required by regulatory mandate or professional liability in domains where AI-driven decisions carry legal, financial, or clinical consequences. The structure resembles assistive AI but carries a harder requirement: the human approval step is not optional and must be documented.

**What it looks like in practice:** Financial advice with advisor sign-off. Clinical decision support with clinician approval. Legal analysis reviewed by counsel before acting. Credit decisions with documented human review. Any use case where a regulator, court, or professional standards body requires traceable human accountability for the final decision.

**Control requirements:** Full audit trail is non-negotiable. Decision attribution must clearly separate the AI recommendation from the human decision -- the record must show that a human reviewed, considered, and approved the output, not merely that they were nominally in the loop. Explainability requirements: the AI output must be interpretable enough for the human approver to exercise genuine judgment. Override documentation: when the human departs from the AI recommendation, the rationale must be recorded.

**Governance:** Regulatory-specific compliance framework. This is not a general AI governance process -- it is a domain-specific compliance requirement that sits within the existing regulatory structure for the function. Professional oversight requirements apply: in some domains, only certain credentials authorize the approval step.

**Maturity required:** Level 2-3. The maturity requirement is lower than agentic operations because the human in the loop limits blast radius. But the compliance overhead is higher, and organizations deploying this pattern without the audit infrastructure in place create regulatory exposure that often exceeds the value the AI is generating.

**When to use:** Regulatory mandate. Professional liability requirements. High-consequence, potentially irreversible decisions where human accountability is required by law, by professional standards, or by risk appetite.

**When to avoid:** High-volume, low-stakes tasks where the compliance overhead is not justified by the risk profile. If the decision consequence does not warrant formal human accountability documentation, the regulated human-in-loop pattern adds cost without proportionate benefit. Use assistive AI instead.

---

## Summary

| Pattern | Autonomy | Control Requirements | Governance Overhead | Maturity Required |
|---|---|---|---|---|
| Assistive AI | Low | Basic | Light | Level 1-2 |
| Workflow Automation | Moderate | Medium | Moderate | Level 2-3 |
| Agentic Operations | High | Full | Heavy | Level 3-4 |
| Regulated Human-in-Loop | Low (human decides) | Full (audit) | Heavy (compliance) | Level 2-3 |

---

Most enterprises should have all four patterns operating simultaneously. The architectural mistake is treating all AI deployments as if they require the same controls. The organizational mistake is deploying agentic patterns before the control architecture exists to support them.

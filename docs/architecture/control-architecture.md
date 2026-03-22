# Control Architecture

The control architecture is the nervous system of the enterprise AI operating model. Without it, governance is aspiration. With it, governance is infrastructure.

The [Governance Architecture](../governance/architecture.md) page covers the policy and process layers: what the rules are and how teams navigate approvals, risk assessments, and incident response. This page covers the technical control plane that enforces those rules at runtime. Policy without a control plane is a document. A control plane without policy is instrumentation with no purpose. Both are required.

## Seven Control Domains

The control plane spans seven domains. Each operates continuously, not at review-cycle speed. Gaps in any domain create exposure that policy cannot compensate for.

---

### Identity & Access

**What it does:** Identity and access management establishes who and what can reach which models, data sources, and executable actions. This includes human identities (employees, contractors, third parties) and non-human ones: agents, service accounts, orchestration pipelines, and API integrations. In agentic architectures, the non-human identity problem is larger than the human one.

**Why it matters:** Unauthorized access is the entry point for most AI incidents, including data exposure, model misuse, and privilege escalation through agent tool calls.

**Failure mode:** Without agent identity, an orchestration pipeline running with a shared service account has effectively inherited every permission ever granted to that account. Blast radius is unlimited.

---

### Entitlements

**What it does:** Entitlements define the permission boundaries for automated actions -- what an agent is allowed to do without explicit human approval for each step. They express bounded autonomy: here is the set of tools this agent can call, the data it can read, the systems it can write to, and the limits on each. Outside those bounds, the agent cannot act.

**Why it matters:** Entitlements are the mechanism that separates "AI that helps" from "AI that acts without accountability." They are how organizations deploy autonomous systems without deploying unlimited liability.

**Failure mode:** Without entitlements, agent authorization defaults to whatever the underlying service account can do, which is usually everything the platform was ever connected to. A misconfigured agent does not just fail -- it takes consequential action in the wrong scope.

---

### Audit & Lineage

**What it does:** Audit and lineage produces an immutable record of every material AI action: which model was called, with what inputs, at what time, by which identity, against which data, producing which output, and triggering which downstream effects. Lineage extends this to data provenance -- where did the context that informed a decision actually come from.

**Why it matters:** Without audit trails, incident response is reconstruction from memory, and compliance queries cannot be answered with evidence.

**Failure mode:** When an AI-assisted decision produces a harmful outcome and the organization cannot reconstruct how it happened, the regulatory and legal exposure is compounded by the inability to respond. Audit gaps turn incidents into crises.

---

### Policy Enforcement

**What it does:** Policy enforcement applies automated guardrails at the boundary of every AI interaction: input filtering (PII detection, prompt injection screening, scope constraints), output filtering (content classifiers, accuracy thresholds, response format checks), and operational controls (cost limits, rate limiting, latency budgets). These controls run inline, at inference time, not as a post-hoc review.

**Why it matters:** Policy enforcement must operate at deployment speed. A guardrail that requires human review at each step is not a guardrail -- it is a bottleneck that teams will route around.

**Failure mode:** Organizations that rely on post-deployment review to catch policy violations will always be discovering violations after users have already encountered them. The review cycle is measured in days; the deployment cycle is measured in hours.

---

### Human Override

**What it does:** Human override defines the circuit breakers, escalation triggers, and manual intervention points built into every autonomous workflow. The design principle is explicit: every autonomous action must have a reachable override. This means identifying, at design time, the conditions under which a human is notified, the conditions under which execution pauses awaiting approval, and the conditions under which a system is taken offline.

**Why it matters:** Autonomous systems that cannot be stopped quickly are not autonomous -- they are uncontrolled. Override capability is what makes escalating autonomy organizationally defensible.

**Failure mode:** A system with no designed override path is a system where the only available intervention is shutting down the infrastructure it runs on. That is not a control. It is a last resort.

---

### Retention & Disposal

**What it does:** Retention and disposal governs the data lifecycle for AI artifacts: training datasets, fine-tuning corpora, model weights, inference logs, intermediate outputs, and evaluation results. It defines how long each artifact is retained, where it is stored, who can access it, and how it is disposed of when the retention period ends or the use case is decommissioned.

**Why it matters:** AI systems accumulate sensitive data across their lifecycle in ways that differ from traditional applications -- inference logs contain reconstructible user inputs; training data may include personal data subject to deletion obligations under GDPR, CCPA, and related frameworks.

**Failure mode:** Retention and disposal is the most commonly neglected control domain until a regulatory inquiry arrives. Organizations then discover they are holding AI artifacts they did not know existed, cannot locate, and cannot demonstrate were used appropriately. Remediation at that point is expensive and adversarial.

---

### Observability

**What it does:** Observability covers monitoring, alerting, drift detection, and performance tracking across deployed AI systems. It surfaces behavioral changes over time -- accuracy degradation, distribution shift, increased refusal rates, anomalous cost patterns -- and routes them to the teams responsible for response. This is distinct from traditional application performance monitoring.

**Why it matters:** Traditional APM answers: is the system running? AI observability must additionally answer: is the system performing correctly, and has its behavior changed since deployment?

**Failure mode:** AI systems degrade silently. A model that was accurate at deployment can drift over months as underlying data distributions shift, without producing errors that surface through conventional monitoring. Without AI-specific observability, organizations discover degradation through user complaints or business outcome metrics, not through the system that should have caught it first.

---

## The Granularity Tradeoff

Control architecture involves a fundamental tradeoff between granularity and operational overhead.

**Fine-grained controls** -- per-agent entitlements, action-level audit, inline policy checks for every inference call -- provide precise security boundaries. They also generate operational overhead: more policies to maintain, more surfaces to instrument, more alerts to triage. Fine-grained controls are more secure when they function correctly and more brittle when they are misconfigured.

**Coarse-grained controls** -- shared entitlement groups, batch audit processing, policy checks at workflow boundaries rather than action boundaries -- are simpler to operate and easier to reason about. The tradeoff is blast radius: when a coarse-grained control fails or is misconfigured, the scope of impact is larger. A shared entitlement group that is too permissive exposes everything it covers, not just the component where the error occurred.

The right point on this spectrum depends on the risk profile of the workload. Agentic systems with write access to operational systems warrant fine-grained controls despite the overhead. Internal productivity tools with read-only access to internal documents can tolerate coarser boundaries. The error is applying the same granularity to everything -- either creating unnecessary overhead for low-risk systems or leaving high-risk systems under-controlled because the granular approach was too expensive to maintain.

Calibrate granularity to the consequence of a control failure, not to the cost of the control itself.

---

For the policy and process layers that the control architecture enforces, see [Governance Architecture](../governance/architecture.md).

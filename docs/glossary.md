# Glossary

This glossary defines key terms used throughout the Enterprise AI Transformation playbook. Terms are organized alphabetically. Cross-references point to the relevant sections of the playbook for deeper treatment.

---

**A2A (Agent-to-Agent Protocol)**
A communication protocol that enables AI agents to interact with other AI agents in a standardized way. A2A defines how agents discover each other's capabilities, negotiate task handoffs, and coordinate on multi-step workflows. Relevant to multi-agent system design and the enterprise agent deployment authorization model.

**Agent Governance**
The set of policies, processes, and controls that define how autonomous AI agents are authorized, deployed, monitored, and constrained in enterprise environments. Agent governance is distinct from AI governance broadly because agents take actions, not just recommendations. See [ADR-003](proof/decision-records.md#adr-003-agent-deployment-authorization-model).

**AI Maturity Model**
A framework for assessing an organization's current state of AI capability across multiple dimensions: strategy, data, process, talent, and governance. Maturity models typically describe four to five levels from "ad hoc" to "optimized." Used in the Foundation phase to establish baseline and prioritize investment. See [Assessment](assessment/ai-readiness.md).

**AI Process Architect**
A practitioner role responsible for redesigning business processes to capture the value that AI efficiency gains create. Distinct from the AI engineer (who builds the system) and the business analyst (who documents current state). The AI Process Architect designs the future-state workflow that ensures productivity gains appear on the balance sheet rather than evaporating into low-value activity redistribution.

**Agentic AI**
AI systems that pursue goals autonomously over multiple steps, using tools, making decisions, and taking actions without requiring human confirmation at each step. Agentic AI differs from AI-assisted decision support in that it acts rather than advises. The risk profile is correspondingly higher. See [Agentic Strategy](agentic-strategy/the-shift.md).

**Authorization Framework**
The documented rules that govern which AI agents or AI systems are permitted to take which actions, under what conditions, and subject to what oversight. An authorization framework for agents typically defines action tiers, approval authorities, human-in-the-loop requirements, and prohibited actions.

**CAIO (Chief AI Officer)**
The executive responsible for the organization's AI strategy, governance, and deployment program. The CAIO role is distinct from the CTO (who owns technology infrastructure) and the CDO (who owns data strategy), though there is overlap in all three. In organizations without a dedicated CAIO, the CIO or CTO typically assumes this mandate with delegated authority.

**Capability Stack**
The layered architecture model for enterprise AI, from infrastructure through applications. Each layer requires investment, ownership, and governance.

**Control Architecture**
The technical control plane that enforces governance policy at deployment speed. Covers identity, entitlements, audit, policy enforcement, human override, retention, and observability.

**Control Plane**
The system layer responsible for policy enforcement, access control, audit, and observability across AI deployments. Distinct from the data plane (where models run) and the management plane (where humans set policy).

**Data Readiness**
An assessment of whether the data assets required for a specific AI use case meet the quality, accessibility, governance, and volume standards required for effective AI deployment. A use case with low data readiness is not a candidate for near-term deployment regardless of business value potential. See [Assessment](assessment/ai-readiness.md).

**Decision Rights**
The documented allocation of authority to make AI-related decisions: who approves use cases, who can reject them, who sets governance standards, who can override a risk classification, and who authorizes production deployment. Ambiguous decision rights are among the top causes of governance failure in AI programs.

**Escalation Protocol**
A defined procedure specifying the conditions under which an AI system (particularly an agent) must pause autonomous action and transfer control to a human operator. Escalation protocols define the trigger conditions, the notification mechanism, the human response time SLA, and the fallback behavior if the human does not respond within the SLA window.

**FinOps (AI FinOps)**
The practice of managing AI infrastructure costs through visibility, accountability, and optimization. In the context of generative AI, FinOps addresses model inference costs, fine-tuning costs, data storage costs, and the total cost of ownership across the AI portfolio. Analogous to cloud FinOps but applied to AI-specific cost drivers.

**GenAI Model Risk**
The risk that a generative AI model produces outputs that cause harm: inaccurate information presented as fact, biased outputs that discriminate, sensitive data disclosed in model outputs, or content that creates legal or reputational liability. GenAI model risk is a category within the broader AI risk taxonomy and requires specific controls distinct from traditional model risk management.

**Governance Velocity**
The speed at which the AI governance function can process use case approvals, risk assessments, and deployment authorizations. Low governance velocity creates a bottleneck that causes business units to route around the governance process (shadow AI). Governance velocity is a design target: the process should be fast enough that compliance is easier than circumvention.

**Human-Agent Collaboration**
The design pattern in which human operators and AI agents work together on tasks, with defined roles for each. Effective human-agent collaboration requires: clear task allocation between human and agent, defined handoff triggers, escalation protocols, and monitoring mechanisms that give humans visibility into agent actions without requiring constant oversight.

**Hub-and-Spoke Model**
An AI operating model in which a central hub function (typically the CAIO's team or a Center of Excellence) defines standards, governance, and shared infrastructure. Distributed spoke teams embedded in business units operate within hub-defined guardrails. The hub sets the rules; the spokes deploy within them. See [ADR-001](proof/decision-records.md#adr-001-ai-operating-model-selection).

**Knowledge Architecture**
The design of how organizational knowledge is structured, stored, retrieved, and maintained for use by AI systems, particularly retrieval-augmented generation (RAG) systems. Knowledge architecture decisions affect AI output quality, freshness, and accuracy. Poor knowledge architecture is a primary cause of enterprise AI systems producing stale or inaccurate outputs.

**LDP (Layered Data Provenance)**
A protocol for tracking the origin, transformation history, and chain of custody of data as it moves through AI systems and multi-agent pipelines. LDP enables auditable AI by making it possible to answer "where did this output come from?" for any AI-generated artifact.

**MCP (Model Context Protocol)**
A protocol that standardizes how AI models access and interact with external data sources, tools, and services. MCP defines the interface between AI models and the systems they need to use, enabling more reliable and auditable tool use in agentic systems.

**Operating Architecture**
The team structure and decision ownership model for building and running enterprise AI. Defines platform teams, domain AI teams, governance function, production support, and incident ownership.

**Measurement Stack**
The three-layer measurement system used to connect AI activity to business value: activity metrics (adoption, usage) feed outcome metrics (time saved, error reduction), which feed value metrics (P&L impact). The measurement stack makes explicit the causal chain from AI usage to financial result. See [Measurement Design](measurement/design.md).

**Phase Gate**
A structured decision point between transformation phases that determines whether the organization is ready to proceed to the next phase, needs to extend the current phase, or should pause to address gaps. Phase gates prevent problems from early phases from propagating to later ones. See [Phase Gates](transformation/phase-gates.md).

**Pilot Purgatory**
The condition in which an AI pilot has been running longer than its defined pilot period without a clear decision to promote to production or exit. Pilot purgatory occurs when measurement is insufficient for a confident decision, when the success threshold was not defined in advance, or when no one with authority is making the promotion/exit call. The fix is a hard deadline, explicit success criteria, and a named decision maker.

**Portfolio Logic**
The principle that AI investment decisions should be made at the portfolio level, not at the individual use case level. Portfolio logic asks: what is the right mix of use cases across value potential, risk level, time to return, and strategic alignment? It prevents over-investment in low-value use cases and ensures the portfolio balances short-term wins with long-term transformation bets. See [Portfolio](portfolio/prioritization.md).

**Process Debt**
The accumulated inconsistency, undocumentation, and variation in business processes that makes AI deployment difficult or impossible without prior standardization. Process debt is often invisible until AI deployment makes it visible and consequential. Organizations with high process debt must treat process standardization as a prerequisite for AI scale. See [Case Study 3](proof/case-studies.md#case-study-3-healthcare).

**Shadow AI**
The use of AI tools by employees outside of approved organizational channels, without the knowledge or authorization of the AI governance function. Shadow AI is universal in AI-capable organizations. The appropriate response is not prohibition (which is ineffective) but managed tolerance combined with a fast-track approval process and a competitive approved tool portfolio. See [ADR-005](proof/decision-records.md#adr-005-shadow-ai-response-strategy).

**System of Action**
The architectural layer where AI executes operations: workflow orchestration, agent execution, automated processes. Distinct from the System of Intelligence (where AI reasons) and System of Engagement (where users interact).

**System of Intelligence**
The architectural layer where AI reasons: analytics, ML models, knowledge bases, decision engines. Most AI investment concentrates here, but value requires integration with Systems of Engagement and Action.

**Trust Boundary**
The defined limit of what an AI system or agent is permitted to access, act upon, or influence. Trust boundaries are technical controls (access permissions, API scope, data classification enforcement) as well as policy controls (authorization framework, use policy). Every agent deployment must have explicit, enforced trust boundaries.

**Value Concentration**
The pattern in which AI value is realized in a small number of high-impact use cases while the majority of the AI portfolio delivers marginal or unmeasurable returns. Value concentration is the rule in enterprise AI portfolios, not the exception. It implies that portfolio management (deciding where to invest more and where to exit) is more important than portfolio expansion (adding more use cases).

**Workforce Transition**
The planned change management and capability development process that accompanies AI deployment. Workforce transition addresses: which roles change, which skills are added or become obsolete, how employees are supported in developing new capabilities, and how compensation and career paths evolve. AI programs that treat workforce transition as an afterthought produce productivity gains on paper and organizational resistance in practice. See [Workforce](workforce/role-evolution.md).

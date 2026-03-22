---
title: "Operating Architecture"
description: "The operating architecture for enterprise AI, covering MLOps, platform engineering, and production deployment patterns."
section: "Architecture"
layout: standard
slug: "operating-architecture"
---
# Operating Architecture

Architecture describes what to build. Operating architecture describes how teams are structured to build and run it. A capability stack without an operating model is a diagram. An operating model without architecture is organizational theater. Both are required, and the boundary between them is where most AI programs lose coherence.

For structural model options -- centralized, hub-and-spoke, federated -- see [Structural Models](../operating-model/structural-models.md). This page focuses on the team roles and decision ownership within those structures.

---

## Five Team Functions

### Platform Team

The platform team builds and maintains shared infrastructure: model services, orchestration frameworks, the control plane, and the developer surfaces that domain teams use to build on top of them. Its job is to function as an internal product team, not an internal services team. The distinction matters. A services team responds to tickets. A product team ships capabilities that reduce what domain teams have to build themselves.

The platform team owns the stack from infrastructure through model services and the control plane. It does not own use cases, and it does not own business outcomes. When platform teams try to own both infrastructure and use case delivery, they become the centralized CoE bottleneck that caps organizational scale.

The right success metric for a platform team is time from approved use case to production. Not team utilization. Not ticket throughput. Time to production measures whether the platform is actually enabling the organization or whether it is an obstacle with good intentions.

---

### Domain AI Teams

Domain AI teams are embedded in business units. They build use cases on platform services. They own business outcomes. They do not own the platform, and they should not be building infrastructure from scratch.

The reporting line is critical and frequently wrong. Domain AI teams should report to business unit leaders, not to the platform team. A domain AI team that reports to the platform team is structurally incapable of owning business outcomes, because its accountability chain runs through the wrong hierarchy. Business unit leaders will not accept outcome accountability for teams they do not control.

Domain AI teams need enough technical depth to use the platform effectively and enough domain knowledge to identify use cases worth building. The technical-to-domain ratio varies by function. A domain AI team in a highly automated operational function needs more technical depth. One in a complex advisory function needs more domain expertise. Neither is a pure software team.

---

### Governance Function

The governance function sets standards, reviews risk, manages the model inventory, and coordinates across domains. Its job is to make the organization capable of deploying AI at scale without accumulating unmanaged risk.

The governance function is not a gate. A gate adds latency to every deployment and creates an adversarial relationship between the people building AI systems and the people responsible for their safety. The governance function should be an enabler with authority: it builds the frameworks, approval templates, and risk toolkits that make compliance faster than non-compliance. It intervenes when standards are not met. It does not review every deployment in detail unless the risk profile requires it.

Authority matters here. A governance function without authority to enforce standards has no practical effect. It can issue guidance that teams ignore and write reports that nobody acts on. The governance function must have the ability to pause deployments, require remediation, and escalate non-compliance to the CAIO. Without that, it is a paper control.

---

### Production Support

Production support operates AI systems after deployment. Incident response, SLA management, on-call coverage, system health monitoring, and the operational interfaces with platform and domain teams when something goes wrong.

This is a distinct function from the platform team. The platform team builds. Production support runs. Conflating them creates a common failure: the team that built the system is also the team that responds to incidents at 2am, which means build velocity drops as the portfolio grows and on-call load increases. Separating build and run also clarifies accountability. When a system is underperforming, it is clear whether the issue is a build problem (platform or domain team) or an operations problem (production support).

AI production support requires different skills than traditional application operations. Models degrade differently than deterministic software. Performance issues are often invisible until they surface as business impact. SLA definitions need to account for model behavior, not just system availability. The team needs enough understanding of AI system behavior to distinguish a model quality issue from an infrastructure issue.

---

### Incident Ownership

Clear escalation paths must be defined before the first incident, not during it.

Who owns the response when an AI system produces incorrect output at scale? Who is accountable when incorrect output causes financial loss? Who manages the regulatory inquiry when a model decision is challenged? These questions have different answers depending on the severity, the domain, and the nature of the failure. The answers must be documented, tested, and understood by all functions before production deployment.

The absence of pre-defined incident ownership does not mean incidents are handled well through improvisation. It means the organization spends the first phase of every incident establishing who is responsible, which is the worst possible use of early incident time.

---

## Decision Ownership

RACI for key decisions across the five functions. R = Responsible, A = Accountable, C = Consulted, I = Informed.

| Decision | Platform Team | Domain AI Team | Governance | Production Support | CAIO |
|---|:---:|:---:|:---:|:---:|:---:|
| Model deployment to production | C | R | A | I | I |
| Data access for new use case | I | R | A | -- | I |
| Incident response (Sev 1-2) | C | I | I | R | A |
| Policy exception request | -- | R | A | -- | I |
| New vendor/model procurement | C | R | A | -- | A |
| Production SLA definition | A | C | I | R | I |

Two patterns in this table deserve attention. First, the governance function holds Accountability on every decision that touches risk or standards. Accountability sits in governance, not in the teams doing the work. This is intentional. Domain teams own responsibility for execution; governance owns accountability for compliance. Second, the CAIO holds Accountability on incident response for Sev 1-2. Senior incidents require executive ownership, not because the CAIO manages the response, but because consequences at that severity require someone with organizational authority to make decisions and absorb accountability for them.

---

## Platform Scope Tradeoff

The most consequential platform team decision is scope: how much of the stack does the platform team own and maintain as shared capability?

A broad platform -- model services, orchestration frameworks, RAG infrastructure, observability, the full control plane -- takes longer to build and requires more platform investment. When it works, it delivers high leverage: every domain team deploys faster because the foundational work is done. The risk is that broad platforms take 12 to 24 months to reach a state where domain teams can build on them productively. Organizations under pressure to show AI impact may not have that runway.

A narrow platform -- basic model endpoints, minimal shared tooling -- ships faster and lets domain teams start building immediately. Each domain team handles more of its own infrastructure. Use cases reach production in months, not years. The cost is accumulated fragmentation: each domain team builds its own version of the same components, governance surfaces become inconsistent, and the reuse that justifies shared infrastructure never materializes. When the organization eventually decides to consolidate, the remediation effort is proportional to how long the fragmented approach ran.

The answer is not architectural purity. It is a deliberate bet on the organization's current constraints. A narrow platform with a documented path to broader coverage is preferable to a broad platform that takes too long and loses organizational credibility before it ships.

The platform team's scope should be set at the start of each planning cycle, not by accumulation. Scope creep in both directions -- platform teams taking on use case delivery, or domain teams building platform components -- is the most reliable predictor of operating model dysfunction.

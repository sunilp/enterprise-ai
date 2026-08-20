---
title: The Agentic Shift
description: How agentic AI changes enterprise architecture from request-response to delegated authority, and what organizations must do differently.
layout: standard
slug: the-shift
discipline: design
order: 6
dek: Why agentic AI is delegated authority rather than a software feature, and what that changes in governance, cost, metrics and the human role.
summary:
  decide: Which workflows, redesigned around agent capabilities, produce materially better outcomes, and how much autonomy the oversight you have actually built can support.
  cost: Agents that mirror the org chart digitize silos; Gartner predicts over 40% of agentic AI projects cancelled by the end of 2027 on escalating costs, unclear business value and inadequate risk controls.
  metric: Task completion rate and cost-per-outcome, measured through live task audits rather than offline test sets.
---
# The Agentic Shift

Traditional ML made predictions. GenAI made text. Agentic AI takes actions.

That is not an incremental upgrade. It is a categorical change in what AI systems do inside your organization, and it demands a different governance model, a different cost structure, and a different relationship between humans and machines.

Agentic AI is delegated operational authority. An agent acts on behalf of your organization, against your systems, with your data. Governing it as a software feature is a category error. The correct frame is closer to how you govern an employee with elevated access: defined scope, auditable actions, clear escalation paths, and the ability to revoke authority.

If you are still evaluating agentic AI the way you evaluated your last ML project, you are measuring the wrong things and asking the wrong questions.

---

## What Is Actually Different

### Static vs. Dynamic Execution

A traditional ML model receives a fixed input, runs a fixed computation, and returns a fixed output. The scope is bounded by design. An agentic system receives a goal and figures out how to achieve it. It selects tools, calls APIs, interprets results, adjusts its approach, and decides when it is done.

That dynamism is the value. It is also the risk.

### Recommendations vs. Actions

ML recommends. Agents act.

A churn prediction model tells you which customers are at risk. An agent can identify those customers, draft retention offers, send emails, update your CRM, and escalate edge cases. The model required a human to close the loop. The agent closes it.

This shifts the failure mode from "bad advice" to "bad action taken at scale."

### Metrics Are Completely Different

| Dimension | Traditional ML | GenAI | Agentic AI |
|---|---|---|---|
| What you measure | Accuracy, F1, AUC | BLEU, ROUGE, human eval | Task completion rate, cost-per-outcome |
| Validation approach | Offline test sets | Benchmark suites | Live task audits, red-teaming |
| Failure mode | Wrong prediction | Wrong text | Wrong action, compounded |
| Latency concern | Inference speed | Token latency | End-to-end task duration |
| Cost model | Per-inference | Per-token | Per-task (variable, unpredictable) |

### Model Validation vs. Real-Time Oversight

With ML, you validate before deployment. With agents, you monitor during execution. A model's behavior is fixed once deployed. An agent's behavior is emergent. It depends on what tools are available, what the environment returns, and how the goal is framed. Your governance infrastructure needs to match.

### Humans Use a Tool vs. Humans Collaborate with an Agent

When a human uses a BI tool, they direct every step. When a human collaborates with an agent, they define the goal and then supervise, intervene, and override as needed. The human's role shifts from operator to supervisor. That shift is not automatic. It has to be designed.

---

## Comparing the Three Paradigms

| Dimension | Traditional ML | GenAI | Agentic AI |
|---|---|---|---|
| **Inputs** | Structured features | Unstructured text, images | Goals, context, permissions |
| **Outputs** | Predictions, classifications | Text, code, summaries | Completed tasks, state changes |
| **Governance** | Pre-deployment validation | Output review, content policy | Real-time oversight, intervention capability |
| **Org change required** | Moderate (new tooling) | Moderate-high (new workflows) | High (redesigned roles and processes) |
| **Risk profile** | Bias, accuracy drift | Hallucination, misuse | Irreversible actions, compounding errors |
| **FinOps model** | Predictable inference costs | Predictable token costs | Variable per-task cost |
| **Human role** | Directed user | Reviewer and prompt writer | Supervisor and exception handler |

---

## The Market Reality

Agents are not a future-state curiosity. They are already generating enterprise value.

- Agents were hardly spoken of in 2024. They account for about **17% of total AI value** reported by companies in 2025 and are expected to reach **29% by 2028** (BCG, 2025). That value goes to the organizations that deploy agents with the control architecture to sustain them.
- **23% of respondents** say their organization is scaling an agentic AI system in at least one business function (McKinsey, 2025).
- But only **11% are actively using agentic systems in production**, against 38% piloting and 30% still exploring (Deloitte, 2025). The gap between piloting and operating tells you how many agent projects are stalled.
- **Gartner predicts that over 40% of agentic AI projects will be cancelled by the end of 2027**, citing escalating costs, unclear business value and inadequate risk controls (Gartner, 2025).

The window between early mover advantage and commodity availability is narrow. But shipping something broken does not help you.

---

## The Anti-Pattern to Avoid

### The Persona-Based Agent

Organizations building their first agent systems often do the following: they take an existing org chart, assign one agent per function, and call it a multi-agent system. Sales agent. HR agent. Finance agent. Each one mirrors an existing silo.

This is wrong.

It digitizes the inefficiencies of your current org structure instead of redesigning around what agents can actually do. A well-designed agentic workflow cuts across functions. It assembles capability dynamically around a task, not around a department.

Building persona-based agents is the organizational equivalent of putting a new engine in a horse-drawn carriage and wondering why it is not faster.

:::warning
**The Persona-Based Agent Anti-Pattern**

If your agent architecture maps directly to your org chart, you have digitized your silos. You have not transformed your operations. Agents should be designed around tasks and outcomes, not around departments and titles.
:::

---

## Where Agents Actually Work

Agents are not universally applicable. They perform best in a specific deployment context.

**The sweet spot:** exception-heavy environments where tasks are too fluid for deterministic rules, but errors are recoverable.

Characteristics of good early deployment targets:

- High variation in inputs (rules-based automation cannot handle the range)
- Recoverable errors (a wrong action can be undone or corrected without material harm)
- Clear success criteria (so you can measure task completion objectively)
- Sufficient volume to justify the overhead of agent infrastructure
- Access to the tools and data the agent needs to actually complete the task

High-stakes, irreversible environments are not good starting points regardless of technical readiness. The governance and human oversight infrastructure required for those settings takes time to build correctly.

There is a direct tradeoff between agent autonomy and control overhead. A fully supervised agent that checks with a human at every decision point is safe but slow. A fully autonomous agent that acts without human checkpoints is fast but fragile. More autonomous agents generate higher value potential and require proportionally more governance infrastructure: richer audit trails, tighter permission scopes, faster anomaly detection, and more reliable rollback mechanisms. The right autonomy level is not a technical decision. It depends on organizational maturity, risk tolerance, and the quality of the oversight infrastructure you have actually built. Organizations that skip the infrastructure and go straight to full autonomy accumulate risk they cannot see until something goes wrong.

:::insight
**Starting Point Criteria**

Score each candidate use case on three dimensions: error recoverability (high/medium/low), task fluidity (how much variation exists in how the task is done), and volume (enough to measure). High recoverability plus high fluidity plus sufficient volume is your best early deployment profile.
:::

For detailed architectural requirements by deployment pattern, see [Reference Patterns](../architecture/reference-patterns.md).

---

## What This Means for Leadership

The frame for agentic AI is not "what can we automate?" That question leads to persona-based agents and digitized silos.

The right question is: "What workflows, if redesigned around agent capabilities, would produce materially better outcomes?"

That is a different analysis. It requires understanding what agents are good at (dynamic task execution, parallel processing, tireless execution of well-defined steps), what they are bad at (novel judgment, ethical nuance, stakeholder relationships), and where the combination of human and agent produces something neither could achieve alone.

That is the analysis your leadership team should be doing now.

The architectural consequence of this shift is that the runtime around the model, the harness, becomes the platform. The model is interchangeable. The harness is where identity, policy, tools, memory, and oversight live. For a longer treatment, see [The Model Is Not the Product. The Harness Is.](https://sunilprakash.com/writing/harness-is-the-platform/) and the Field Note [Anthropic just told you the harness is the product](https://agenticlab.sunilprakash.com/field-notes/003-anthropic-told-you-harness-is-product/).

---

## Sources

1. Boston Consulting Group. "Are You Generating Value from AI? The Widening Gap." September 2025. Build for the Future 2025 Global Study, 1,250 CxOs and senior executives.
2. McKinsey & Company. "The State of AI in 2025: Agents, Innovation, and Transformation." November 2025. 1,993 respondents across 105 nations.
3. Deloitte. "Agentic AI Strategy." Tech Trends 2026, December 2025, reporting Deloitte's 2025 Emerging Technology Trends survey.
4. Gartner. "Gartner Predicts Over 40% of Agentic AI Projects Will Be Canceled by End of 2027." Press release, June 25, 2025.

For the complete source list and methodology, see [Sources & Methodology](../sources.md).

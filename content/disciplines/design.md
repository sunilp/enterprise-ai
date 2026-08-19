---
title: Design
description: "The capability stack, systems model, control architecture, reference patterns, and the shift to agents and protocols."
slug: design
layout: hub
hub: true
permalink: design
discipline: design
number: 4
question: "What system, at what complexity, does the workflow need?"
decisions:
  - Match each workflow to the deployment pattern and level of control it needs
  - Decide where to build and where to buy at each layer of the capability stack
  - Set how tightly AI couples to existing systems and how fine-grained its controls run
proof: [decision-artifacts]
---
Transformation eventually becomes a design problem. Strategy says what to change; architecture says what to build. Programs stall less often because the strategy is wrong than because there is nothing coherent to build toward: local decisions, vendor point solutions, and AI components with no operating logic holding them together.

Design is the discipline that prevents that. It starts from the systems the enterprise already runs and asks how AI connects them, because the hard problem is integration, not intelligence. It treats the capability stack as a capital allocation framework, so money reaches the data, knowledge and control layers that visible applications depend on. It specifies the control plane that enforces policy at runtime, and the team functions that build and run it.

Above all, it matches complexity to the workflow. An assistive copilot, a bounded automation, an autonomous agent and a regulated human-in-the-loop decision each warrant a different level of control. The shift to agents raises the stakes: an agent holds delegated authority, and the runtime around the model, with its identity, policy and protocols, becomes the platform.

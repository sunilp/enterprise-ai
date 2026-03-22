# GenAI Model Risk

Traditional model risk management was designed for a world of deterministic, narrow models. A credit scoring model produces a score. A fraud detection model produces a probability. You can validate these systems because they behave consistently given the same input.

GenAI breaks every assumption that traditional model risk management is built on. Most risk frameworks have not caught up.

## Why Traditional Model Risk Management Fails for GenAI

The foundational assumption of traditional model risk is reproducibility: run the same input through the model twice, get the same output. Validation is possible because behavior is stable.

GenAI is non-deterministic by design. The same prompt can produce materially different outputs across calls. Temperature settings, system prompt variations, and model updates can shift outputs dramatically. You cannot validate a system that does not behave consistently, using the same methods you would use for a regression model.

The other foundational assumption is narrow scope: the model does one thing, and you can test whether it does that thing well. GenAI models have emergent capabilities that were not designed in. A model fine-tuned on customer service transcripts may produce medical advice, generate code, or draft legal opinions when prompted. You cannot exhaustively test a system with unbounded output space.

The gaps this creates are significant:

| Traditional ML Risk | GenAI Risk | Why It Is Different |
|---|---|---|
| Model drift (statistical) | Hallucination and confabulation | Outputs are wrong but confident and fluent |
| Adversarial examples (edge cases) | Prompt injection | Instructions can be hidden in data or user input |
| Training data bias | Generative bias and stereotype amplification | Bias manifests in open-ended language generation |
| Model underperformance | Emergent capability misuse | Model does things it was not intended to do |
| Data leakage (training) | Runtime data leakage | Sensitive data exfiltrated via prompts |
| IP risk (training data) | IP and copyright in outputs | Model may reproduce copyrighted text verbatim |

## The Scale of the Problem

GenAI error rates in production deployments hover around 20% (Gartner, 2024). This means roughly one in five outputs contains a meaningful inaccuracy. For a system answering customer questions, writing internal reports, or summarizing contracts, a 20% error rate is not a statistical footnote. It is a material operational and legal risk.

The more alarming figure: 84% of organizations are not systematically tracking GenAI accuracy in production (Gartner, 2024). Most organizations have deployed systems they cannot tell you are working correctly.

!!! danger "The Confidence-Accuracy Gap"
    GenAI models do not know when they are wrong. They produce confident, fluent, grammatically correct outputs whether they are accurate or fabricating. This is categorically different from a model that returns a low-confidence score you can threshold on. There is no built-in signal for "I do not know." Your monitoring and validation infrastructure must supply that signal externally.

## A GenAI-Specific Risk Framework

The risk framework for GenAI requires five distinct risk categories. Each requires different controls and monitoring approaches.

### 1. Accuracy and Hallucination Risk

The core risk: the model produces outputs that are factually incorrect, and neither the model nor the end user realizes it.

Hallucination takes several forms:

- **Factual confabulation**: stating false facts with confidence (wrong dates, invented citations, incorrect statistics)
- **Reasoning errors**: logical steps that appear sound but lead to incorrect conclusions
- **Entity drift**: substituting similar but incorrect entities (wrong company name, wrong regulation, wrong person)
- **Citation fabrication**: generating plausible-sounding but nonexistent sources

Controls:
- Retrieval-Augmented Generation (RAG) with cited sources and ground-truth verification
- Output classifiers trained on known hallucination patterns
- Human review sampling protocols with defined accuracy thresholds
- Red team exercises targeting factual claims in your specific domain

Monitoring: Track accuracy on a domain-specific evaluation set continuously. Do not rely on user-reported errors as your primary signal. Users normalize incorrect outputs faster than you expect.

### 2. Prompt Injection and Adversarial Attack Risk

Prompt injection is the AI-era equivalent of SQL injection. Malicious instructions embedded in user input, retrieved documents, or external data can override system instructions and cause the model to behave in unintended ways.

Attack vectors:

- **Direct injection**: user instructs the model to ignore its system prompt
- **Indirect injection**: malicious instructions embedded in a document the model is summarizing
- **Jailbreaks**: carefully crafted inputs that bypass safety fine-tuning
- **Multi-turn manipulation**: building context across a conversation to gradually shift model behavior

!!! warning "Indirect Injection is the Harder Problem"
    Direct injection (users trying to manipulate the chatbot) is visible and manageable. Indirect injection, where the model processes external data containing adversarial instructions, is far more dangerous. A document summarization system that reads a contract containing hidden instructions is a concrete attack surface. If your system processes any external or user-supplied content, indirect injection is a live risk.

Controls:
- Input sanitization and instruction boundary enforcement
- Privilege separation: distinguish between trusted system instructions and untrusted user/external input
- Output monitoring for anomalous behavior patterns
- Regular red team exercises with adversarial prompting

### 3. Data Leakage and Privacy Risk

GenAI introduces privacy risks at multiple points in the stack:

| Risk Point | Mechanism | Control |
|---|---|---|
| Training data | PII memorized during training, reproducible via extraction prompts | Verify vendor training data handling; prefer models trained on redacted data |
| Fine-tuning data | Sensitive organizational data used to fine-tune leaks to other users | Use isolated fine-tuning environments; audit training data before submission |
| Runtime context | Sensitive data in prompts retained in model provider logs or training pipelines | Review vendor data retention policies; use data residency controls |
| RAG retrieval | Retrieval systems returning documents the user should not access | Enforce document-level access controls in retrieval, not just at the application layer |
| Output extraction | Attacker crafts prompts to extract memorized sensitive content | Monitor for extraction patterns; implement output filtering |

For regulated industries (financial services, healthcare, legal), data leakage risk at the runtime context level is particularly acute. Many organizations have inadvertently processed patient data, customer PII, or material non-public information through third-party GenAI APIs without reviewing the data handling terms.

### 4. Bias and Fairness in Generative Outputs

Bias in generative models is more complex than bias in classification models. A classification model has a measurable output space. A generative model has an unbounded one.

The specific risks:

- Differential quality: outputs for some user groups are systematically lower quality than others
- Stereotype amplification: the model produces outputs that reinforce cultural stereotypes in ways that cause harm or create liability
- Representation gaps: the model performs poorly on languages, dialects, or cultural contexts underrepresented in training data
- Tone and framing bias: the model frames topics differently depending on who is asking or being described

Bias testing for GenAI requires purpose-built evaluation approaches:

1. Define the fairness criteria relevant to your use case (equal quality across demographic groups, equivalent accuracy across languages, etc.)
2. Build evaluation sets that surface the specific failure modes you care about
3. Establish baseline measurements at deployment
4. Monitor for drift over time, particularly after model updates

!!! info "Model Updates Reset Your Baseline"
    When your GenAI vendor updates the underlying model (which happens without notice for most API-based deployments), all of your bias and accuracy measurements become stale simultaneously. Your monitoring infrastructure must detect model version changes and trigger re-evaluation automatically.

### 5. IP and Copyright Risk

GenAI models trained on internet-scale data have ingested enormous quantities of copyrighted material. The legal status of what they can reproduce is unsettled in most jurisdictions, but the practical risk is real and present.

Key exposure points:

- **Verbatim reproduction**: the model reproduces copyrighted text, code, or other content in its outputs
- **Derivative works**: outputs are substantially similar to copyrighted works even if not verbatim copies
- **Training data liability**: your use of a model trained on data that was scraped without license could create downstream liability
- **Code generation**: AI-generated code may reproduce GPL or other copylicensed code in ways that trigger license obligations

Controls:
- Use models from vendors with clear IP indemnification policies
- Implement output screening for known copyrighted content where feasible
- Define organizational policy on AI-generated content disclosure
- Consult IP counsel on code generation use cases specifically

## Model Validation for GenAI

Traditional model validation asks: does the model perform as specified? For GenAI, the answer to that question is almost always "it depends on the prompt."

Effective GenAI validation requires:

**Pre-deployment validation:**
- Define a domain-specific evaluation set covering your expected use cases and known edge cases
- Measure accuracy, hallucination rate, and output quality on this set before deployment
- Conduct adversarial red teaming with domain-relevant attacks
- Verify privacy and data handling behavior matches vendor contractual commitments
- Document model version, configuration, and system prompt as part of the model record

**Ongoing validation:**
- Continuous accuracy monitoring against the evaluation set
- Automated detection of model version changes
- Regular human review sampling (not just automated metrics)
- Scheduled red team exercises, not just at deployment

**Change management:**
- Model updates (including vendor-side updates) require re-validation before continuing in production
- System prompt changes require re-validation
- RAG corpus updates require re-validation of retrieval accuracy

## Continuous Monitoring Requirements

The monitoring stack for GenAI must cover what traditional model monitoring misses.

| Metric | What to Measure | Alert Threshold |
|---|---|---|
| Hallucination rate | Percentage of outputs containing factual errors | Depends on use case; set at deployment |
| Retrieval accuracy (RAG) | Percentage of retrievals that are relevant and correct | Degradation from baseline |
| Refusal rate | Percentage of inputs refused by safety filters | Sudden spikes or drops |
| Prompt injection detection rate | Flagged injection attempts per 1000 calls | Any significant volume |
| PII in outputs | Percentage of outputs containing PII | Zero tolerance for unapproved cases |
| Latency and cost per call | P95 latency; cost per 1000 calls | Budget and SLA thresholds |
| User-reported accuracy | Error reports and corrections | Trend over time |

The most important monitoring practice: review a random sample of real outputs regularly. Metrics can mask problems that a human reviewer would catch immediately. No dashboard replaces direct observation.

## Summary

GenAI model risk is not a harder version of traditional model risk. It is a different problem. Non-deterministic outputs, emergent capabilities, prompt sensitivity, and the confidence-accuracy gap all require new frameworks, new validation approaches, and new monitoring infrastructure.

The 84% of organizations not tracking GenAI accuracy are not cutting corners. They are applying a traditional monitoring philosophy to a system that breaks its assumptions. The first step is acknowledging the difference.

---

## Sources

1. Gartner. "Identifies Critical GenAI Blind Spots That CIOs Must Urgently Address." November 2025.

For the complete source list and methodology, see [Sources & Methodology](../sources.md).

# AI Model Inventory -- Template

**Organisation:** _[Organisation name]_
**Inventory owner:** _[Name, Role]_
**Last updated:** _[Date]_
**Next scheduled review:** _[Date]_

---

## Model Inventory

_Add one row per deployed or actively piloted AI model. Include both purchased/vendor models and internally developed models._

| Model ID | Model Name | Model Type | Vendor / Developer | Business Owner | Technical Owner | Use Case Description | Deployment Environment | Risk Tier | Regulatory Exposure | Data Classification | Training Data Cutoff | Last Validation Date | Next Review Date | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| _[ID]_ | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | |

---

## Field Definitions

Use these definitions to ensure consistent, comparable entries across the inventory.

**Model ID**
A unique identifier for the model entry. Use a structured format such as `AI-[YEAR]-[SEQUENCE]` (e.g., `AI-2026-001`). Do not reuse IDs if a model is decommissioned.

**Model Name**
The internal or vendor-assigned name of the model. If using a foundation model (e.g., GPT-4o, Claude 3.5), record the specific version in the Notes field.

**Model Type**
The primary category of the model. Common values: `Generative / LLM`, `Predictive / Classification`, `Predictive / Regression`, `Computer Vision`, `NLP / Text Analysis`, `Recommendation`, `Optimisation`, `Other`.

**Vendor / Developer**
The organisation that built or supplied the model. For internal builds, record `Internal`. For open-source models, record the originating project or lab.

**Business Owner**
The accountable business leader responsible for the outcomes produced by this model. This is not the technical owner -- it is the person who owns the business process the model operates within.

**Technical Owner**
The engineer, data scientist, or team responsible for model deployment, monitoring, and maintenance.

**Use Case Description**
One to two sentences describing what decision or process the model supports. Be specific: "Scores inbound loan applications for default risk" is better than "Credit risk model."

**Deployment Environment**
Where the model runs. Values: `Production`, `Staging`, `Pilot`, `Development`, `Decommissioned`.

**Risk Tier**
The organisation's internal risk classification. Align to your risk classification framework. Typical values: `Tier 1 (Critical)`, `Tier 2 (High)`, `Tier 3 (Moderate)`, `Tier 4 (Low)`. See the Risk Classification Worksheet for scoring guidance.

**Regulatory Exposure**
List applicable regulations or frameworks. Examples: `EU AI Act (High-Risk)`, `SR 11-7`, `GDPR`, `FCA`, `HIPAA`, `None`. Record "None" explicitly rather than leaving blank.

**Data Classification**
The sensitivity classification of data the model processes. Align to your data classification policy. Common values: `Public`, `Internal`, `Confidential`, `Restricted`.

**Training Data Cutoff**
For models with a fixed training corpus, record the cutoff date (e.g., `2024-04`). For continuously updated or fine-tuned models, record `Rolling`. For vendor models where this information is unavailable, record `Unknown`.

**Last Validation Date**
The date the model was last formally validated against its performance thresholds. This includes both technical validation (accuracy, drift) and business validation (outcome quality). Leave blank if not yet validated.

**Next Review Date**
The scheduled date for the next formal review. Derive from the Review Cadence table below.

**Status**
Current operational state. Values: `Active`, `Pilot`, `Under Review`, `Suspended`, `Decommissioned`.

**Notes**
Any material information not captured in other fields. Examples: known limitations, pending audits, regulatory exemptions, version specifics.

---

## Review Cadence

_Set review frequency based on risk tier. Adjust to fit your organisation's governance calendar._

| Risk Tier | Minimum Review Frequency | Trigger for Immediate Review |
|---|---|---|
| Tier 1 (Critical) | Quarterly | Any performance degradation, regulatory change, or material incident |
| Tier 2 (High) | Semi-annually | Performance degradation exceeding defined thresholds, or regulatory change |
| Tier 3 (Moderate) | Annually | Material change to the business process the model supports |
| Tier 4 (Low) | Annually | Significant change in deployment context |

_A "material incident" includes: model output causing customer harm, regulatory inquiry, significant accuracy degradation, or identification of bias affecting a protected characteristic._

---

## Inventory Change Log

_Record significant changes to the inventory itself -- not model-level changes, which belong in individual model records._

| Date | Changed by | Change description |
|---|---|---|
| | | |

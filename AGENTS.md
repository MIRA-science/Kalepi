# AGENTS.md — Kalepi shared brief

This is the source of truth for everyone building Kalepi — humans and coding agents alike. Read it before touching any code, schema, or integration. When in doubt, refer back here.

**Companion artifacts:**
- `README.md` — high-level user story and scenario
- MIRA schema: `../MIRA-schema/mira.yaml` — canonical schema reference
- Inter-lab user story: `../inter-lab-user-story/AGENTS.md` — sibling spec

---

## TL;DR

Alice is a program officer at a science foundation. She inputs a strategy document — her mission statement plus a set of funded proposals (each with project description and researcher CVs). Kalepi extracts the relevant scientific works, maps them onto the MIRA graph, and returns a structured set of epistemic impact signals per grant.

---

## Scope

**In scope (v1):**
- Ingesting a funder strategy document (mission statement + proposals + researcher CVs)
- Extracting relevant works (papers, patents, datasets) from those proposals
- Mapping extracted works onto MIRA nodes (Claim, Evidence, Study, Question, Protocol)
- Computing a configurable set of metrics on those nodes (TBD — see [Metrics & signals](#metrics--signals))
- Returning a structured impact report to the funder

**Secondary:**
- Defining a Funding extension to the MIRA schema (if needed to link grants to Studies/Protocols)
- Authoring or editing MIRA nodes from within the Kalepi tool

**Out of scope (v1):**
- Raw data hosting or full-text paper storage
- Write-back to researcher graphs
- Centralized grant authority or permissions orchestration
- Cross-funder comparison or benchmarking
- Real-time monitoring of ongoing grants

---

## Actors & personas

**Alice** — Program officer at a science foundation. She holds the strategy document: mission statement + a set of funded proposals. She is not a researcher; she needs a high-level structured signal per grant, not a raw graph traversal.

Key insight: Alice's unit of analysis is the **individual grant**. Each evaluation is scoped to one grant's funded work.

*(Researcher personas — to be added in later workshops.)*

---

## Data model & schema

Kalepi uses the MIRA schema (`../MIRA-schema/mira.yaml`). The primary node types in play:

| Node | MIRA class | Kalepi role |
|------|-----------|-------------|
| Question | `mira:Question` | Scientific unknown the funded work addressed or left open |
| Claim | `mira:Claim` | Atomic assertion produced by funded research |
| Evidence | `mira:Evidence` | Empirical observation backing a Claim |
| Study | `mira:Study` | Scientific activity that grounded the Evidence |
| Protocol | `mira:Protocol` | Method reused across funded Studies |

**Funding extension (TBD):** A `kalepi:Grant` node (or equivalent) may be added to link funder investments to Study/Protocol nodes. Schema decisions are deferred until the first workshop.

**Serialization:** JSON-LD on the wire; RDF as the underlying model (following MIRA conventions).

---

## Input format

The funder submits a **strategy document** containing:
1. Mission statement (free text)
2. One or more funded proposals, each with:
   - Project description
   - Abbreviated CVs of proposing researchers

From this document, Kalepi identifies relevant works and maps them to the MIRA graph.

---

## Metrics & signals

The complete list of epistemic impact signals is TBD — a full specification will be provided by the project team. Placeholder signal categories:

- **Citation-based** — downstream Claim references, paper citation counts
- **Trust indicators** — replication, challenge, consensus markers
- **Question coverage** — Questions addressed vs. left open by funded work
- **Protocol reuse** — how often funded Protocols appear in new Studies

*(This section will be expanded with a concrete list before the first workshop.)*

---

## Rules & constraints (normative)

**R1 — Extraction is assistive, not authoritative.** Automated extraction of Claims, Evidence, and Studies from papers is a starting point. Human review is required before metrics are finalized.

**R2 — Schema before metrics.** No metric is computed on raw text. All source material must be mapped to MIRA nodes first.

**R3 — Pointers, not payloads.** Kalepi stores identifiers and links to external works, not full-text copies.

**R4 — Diverse signals, not a single score.** Impact is expressed as a structured set of indicators, not collapsed into one number.

**R5 — Grant-level view.** The primary unit of analysis is the individual grant, not the funder's portfolio.

**R6 — Schema extension by addition only.** If MIRA must be extended for funding concepts, new node/edge types are added; existing MIRA semantics are not modified.

---

## v1 prototype scope & acceptance criteria

**Canonical test case:** Alice uploads a strategy document containing a mission statement and two funded proposals (with researcher CVs).

**v1 is done when:**
1. The system identifies and extracts a list of relevant works (papers, patents) from the proposals and CVs
2. MIRA elements — at minimum Claims and Evidence — are extracted from those works
3. At least one signal category (TBD) is computed on those elements
4. The result is returned to Alice as a structured impact report

---

## Open questions (NOT decided)

*(To be filled at the first Kalepi workshop.)*

# Kalepi — Kaleidoscope of Epistemic Impact of Scientific Funding

A user story for the MIRA ecosystem: how a funder traces the epistemic impact of their investments.

**Status:** Draft v0.1 — pre-workshop, greenfield. No design decisions are final yet.

---

## The scenario

Alice is a program officer at a science foundation. She has a strategy document: a mission statement and a portfolio of funded proposals — each with a project description and the abbreviated CVs of the researchers involved.

Alice wants to know: *did our funding move the needle?* She hands Kalepi her strategy doc. The tool identifies the relevant works that emerged from those proposals (papers, patents, datasets), maps them onto the MIRA graph (Claims, Evidence, Studies, Questions), and returns a structured set of signals — citation counts, trust indicators, open questions closed — that let her assess epistemic impact across her portfolio.

---

## The workflow

```
Funder strategy doc
  (mission + proposals + researcher CVs)
          │
          ▼
     [Extraction]
  Relevant works identified
  (papers, patents, datasets)
          │
          ▼
     [Mapping]
  MIRA elements extracted
  (Claims, Evidence, Studies,
   Questions, Protocols)
          │
          ▼
     [Metrics]
  Signals computed
  (citations, trust indicators,
   open questions closed, ...)
          │
          ▼
    Funder impact report
```

---

## Installation


### Using nix for reproductible environment

Enter the dev shell (requires [Nix](https://nixos.org/) and [direnv](https://direnv.net/)):

```sh
direnv allow
```

This puts `uv`, `pnpm`, and `make` in your PATH.


## Backend

```sh
uv sync
uv run kalepi
```

API available at `http://localhost:8000` — try `GET /claim`.

## Frontend

```sh
pnpm install
pnpm --filter @kalepi/app dev
```

App available at `http://localhost:5173`.

---

## Generate MIRA types

Both the Python and TypeScript packages are generated from the canonical MIRA schema. Run once (and again whenever the schema changes):

```sh
make generate
```

## MIRA schema elements

Kalepi reads and populates the following MIRA node types:

| Node | Role in Kalepi |
|------|----------------|
| **Question** | Scientific unknown the funded work addressed or left open |
| **Claim** | Atomic assertion produced by funded research |
| **Evidence** | Empirical observation backing a Claim |
| **Study** | Scientific activity that grounded the Evidence |
| **Protocol** | Method reused across funded Studies |

A funding extension (node type TBD) will link grants to the Studies and Protocols they enabled.

---

## Core principles

- **Pointers, not payloads** — Kalepi stores identifiers and links, not raw papers or datasets
- **Schema-first** — all extracted elements conform to the MIRA schema before metrics are computed
- **Diverse signals** — impact is not a single number; Kalepi surfaces a kaleidoscope of epistemic indicators
- **Grant-level view** — the unit of analysis is the individual grant, not the full portfolio
- **Human-in-the-loop** — automated extraction is a starting point, not a final verdict

---

## Related resources

- MIRA schema: https://github.com/MIRA-science/schema — canonical schema reference
- Inter-lab user story: https://github.com/MIRA-science/inter-lab-user-story — sibling user story for cross-lab exchange
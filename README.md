# Fastwork Senior QA Challenge
### Milestone Quotation & Payment Flow — Test Strategy & Automation

![Playwright Tests](https://github.com/itthikorn-sut/fastwork-qa-challenge/actions/workflows/playwright.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Playwright](https://img.shields.io/badge/Playwright-1.44-green?logo=playwright)
![Tests](https://img.shields.io/badge/Tests-51%20passing-brightgreen)

---

## Overview

This project validates the **Milestone Quotation and Payment Flow** — a multi-round contract system where a seller proposes milestones, a buyer accepts and pays, and funds are released per-round upon work acceptance.

The approach uses **risk-based testing** with a fully self-contained test environment (mock UI + mock API), enabling deterministic and reproducible test execution with zero dependency on production systems.

**[→ View Test Strategy & Plan](plan.md)**

---

## Architecture

```
Browser (Mock UI)
      │
      ▼
Mock API Server (Express + TypeScript)
      │
      ├── POST /api/v1/quotations                      Create quotation
      ├── POST /api/v1/quotations/:id/accept           Buyer accepts
      ├── POST /api/v1/payments                        Process payment
      ├── POST /api/v1/quotations/:id/milestones/:n/submit   Seller submits work
      ├── POST /api/v1/quotations/:id/milestones/:n/accept   Buyer accepts + transfer
      ├── POST /api/v1/quotations/:id/terminate        Terminate contract
      └── GET  /api/v1/quotations/:id                 Get quotation state
```

```
fastwork-qa-challenge/
├── automation/
│   ├── tests/
│   │   ├── api/          # API-level tests (no browser)
│   │   ├── ui/           # Browser UI validation tests
│   │   └── e2e/          # Full end-to-end tests
│   ├── pages/            # Page Object Models
│   ├── utils/            # Mock server + API helpers
│   └── fixtures/         # Shared test data
├── mock-ui/              # Simulated quotation & payment UI
├── docs/                 # Performance & security test designs
├── .github/workflows/    # CI/CD pipeline
├── playwright.config.ts
└── plan.md               # Full test strategy document
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Run all tests (mock server starts automatically)
npx playwright test

# Open interactive HTML report
npx playwright show-report

# Run tests by category
npm run test:api     # API tests only
npm run test:ui      # UI tests only

# Start mock server + UI manually (for manual exploration)
npm run mock:server
# → open http://localhost:3000
```

---

## Test Suite — 51 Tests

### Coverage by Category

| Category | File | Tests | Scope |
|---|---|---|---|
| API — Quotation Validation | `tests/api/quotation.api.spec.ts` | 13 | Business rules, edge cases |
| API — Payment Scenarios | `tests/api/payment.api.spec.ts` | 20 | Failures, idempotency, concurrency |
| UI — Form Validation | `tests/ui/quotation.ui.spec.ts` | 9 | Client-side validation behavior |
| E2E — Happy Path | `tests/e2e/happy-path.spec.ts` | 4 | Full 4-step flow |
| E2E — Termination | `tests/e2e/termination.spec.ts` | 5 | Contract termination states |

### Key Scenarios Covered

#### Business Rule Validation
- Milestone rounds: 2–5 only (below and above boundary)
- Per-round amount: > 100 THB (exact boundary tested)
- Total quotation: > 3,000 THB (exact boundary tested)
- Due date: must be future (past date rejected)
- Required fields: title, description, deliverables per round

#### Payment Failure Handling
- Invalid card number format → `400`
- Invalid expiry / CVV format → `400`
- Unsupported currency → `400`
- Missing required fields → `400`
- Declined card (insufficient funds) → `402`
- Amount exceeds limit → `402`
- Payment on non-accepted quotation → `409`

#### Senior-Level Scenarios
| Scenario | What is tested |
|---|---|
| **Idempotency** | Same `idempotency_key` returns identical `payment_id` — no double charge |
| **Concurrency** | 5 simultaneous requests with same key all return consistent result |
| **Partial failure** | Payment success transitions quotation from `accepted` → `paid` atomically |
| **Data consistency** | Charged amount in response exactly matches requested amount |
| **State machine** | Quotation status progresses correctly through all states |

---

## Business Flow

```
Seller creates quotation (2–5 rounds)
         │
         ▼
Buyer reviews & accepts
         │
         ▼
Buyer pays (full amount upfront)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
For each round:    OR    Terminate contract
Seller submits work       (stops further processing)
Buyer accepts
Funds transferred
    │
    ▼
Contract completed
```

---

## Mock API — Failure Simulation

| Trigger | Response | Scenario |
|---|---|---|
| Card number ending `0000` | `402` | Declined / insufficient funds |
| `amount > 1,000,000` | `402` | Amount exceeds limit |
| `amount < 0.01` | `400` | Invalid amount |
| Invalid card format | `400` | Malformed card data |
| Unsupported currency | `400` | e.g. GBP |
| Same `idempotency_key` | `200` (cached) | Idempotent replay |
| Duplicate payment (no key) | `409` | Already paid |

---

## CI/CD

GitHub Actions runs the full test suite on every push and pull request.

**Pipeline steps:**
1. Checkout → Install Node.js 20 → `npm ci`
2. Install Playwright Chromium (`--with-deps`)
3. Start mock server (auto-managed by Playwright `webServer`)
4. Run all 51 tests
5. Upload HTML report as artifact (retained 14 days)

**[→ View workflow](.github/workflows/playwright.yml)**

---

## Design Documents

| Document | Description |
|---|---|
| [Performance Test Design](docs/performance-test-design.md) | k6 load scenarios: 1 / 10 / 100 / 500 users, 2 GB upload stress test, acceptance thresholds |
| [Security Test Design](docs/security-test-design.md) | PCI-DSS controls, OWASP Top 10, card masking, TLS, injection, authorization |

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev) | UI automation, API testing, E2E orchestration |
| [TypeScript](https://www.typescriptlang.org) | Type-safe test code and mock server |
| [Express](https://expressjs.com) | Mock API server |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

---

## Key Design Decisions

**Why a mock system?**
Testing against a real payment gateway introduces flakiness, cost, and non-determinism. The mock API encodes all business rules and simulates every failure condition deterministically — making tests fast, reliable, and CI-safe.

**Why Page Object Model?**
UI selectors are centralized in `pages/`. Tests stay readable and a UI change only requires updating one file.

**Why API tests alongside UI tests?**
UI validation can be bypassed. API-level tests verify the server enforces all business rules independently, which is the actual security boundary.

---

*Built for the Fastwork Senior QA Challenge*

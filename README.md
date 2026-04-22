# Fastwork Senior QA Challenge
### Milestone Quotation & Payment Flow — Test Strategy & Automation



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

## Test Suite — 120 Tests (96 Passing + 8 Expected Failures + 20 Security)

### Coverage by Category

| Category | File | Tests | Scope |
|---|---|---|---|
| API — Quotation Validation | `tests/api/quotation.api.spec.ts` | 24 | Business rules, edge cases, account status |
| API — Payment Scenarios | `tests/api/payment.api.spec.ts` | 23 | Failures, idempotency, concurrency, data consistency |
| API — Maintenance Window Demo | `tests/api/demo-bypass-window.spec.ts` | 4 | Time simulation header, boundary testing |
| **Security & Compliance (Bonus)** | **`tests/security/compliance.spec.ts`** | **20** | **PCI-DSS & GDPR compliance: data masking, injection prevention, auth, audit logging** |
| UI — Form Validation | `tests/ui/quotation.ui.spec.ts` | 9 | Client-side validation behavior |
| UI — Payment & Account Status | `tests/ui/payment.ui.spec.ts` | 18 | Payment form, card validation, account status checks |
| E2E — Happy Path | `tests/e2e/happy-path.spec.ts` | 4 | Full 4-step flow |
| E2E — Termination | `tests/e2e/termination.spec.ts` | 5 | Contract termination states |
| E2E — Contract Completion | `tests/e2e/contract-completion.spec.ts` | 4 | Milestone acceptance, fund transfer, completion |
| Findings (Expected Failures) | `tests/findings.spec.ts` | 6 | Bug documentation: validation gaps, UI issues |
| **TOTAL** | | **120 tests** | **96 passing + 8 expected + 20 security** |

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
4. Run all 104 tests (96 passing + 8 expected findings)
5. Upload HTML report with videos/screenshots as artifact (retained 14 days)

**[→ View workflow](.github/workflows/playwright.yml)**

---

## Security & Compliance Testing (Bonus Challenge)

This project includes **20 comprehensive security compliance tests** validating **PCI-DSS** and **GDPR** requirements.

### Security Test Coverage

| Category | Tests | PCI-DSS Requirement | GDPR Article |
|---|---|---|---|
| **Card Data Protection** | S-01 to S-04 | Req 3 (Protect stored cardholder data) | Article 32 (Security) |
| **Input Validation & Injection** | S-08 to S-11 | Req 6 (Secure applications) | Article 32 (Security) |
| **Authentication & Authorization** | S-12 to S-14 | Req 8 (Identify & authenticate access) | Article 32 (Security) |
| **Audit Logging** | S-15 to S-17 | Req 10 (Track & monitor all access) | Article 5 (Principles) |
| **Transport Security** | S-05 to S-07 | Req 4 (Encrypt transmission) | Article 32 (Security) |
| **Data Minimization & Retention** | GDPR-01 to GDPR-03 | — | Article 5(1)(c), 5(1)(e), 17 |

### Key Security Tests

- **Card Masking** — Card numbers masked as `****-****-****-XXXX` in responses (S-02)
- **CVV Never Logged** — CVV values never stored or returned (S-03, S-16)
- **Input Validation** — SQL injection, XSS, oversized payloads rejected (S-08 to S-11)
- **Authorization** — Cross-user access prevented, role-based controls (S-12 to S-14)
- **Data Minimization** — Only necessary PII collected, no excessive data storage (GDPR-01)
- **Audit Logging** — Safe fields logged (payment_id, amount, timestamp), no card data (S-17)

### Run Security Tests

```bash
# Run only security compliance tests
npx playwright test automation/tests/security/compliance.spec.ts

# Run with list reporter to see all test results
npx playwright test automation/tests/security/compliance.spec.ts --reporter=list

# View detailed HTML report with traces and videos
npx playwright show-report
```

**Documentation:**
- **[Security Testing Guide](automation/tests/security/TESTING-GUIDE.md)** — How to run and understand API security tests
- **[Security Test Design](docs/security-test-design.md)** — PCI-DSS & GDPR compliance mapping

---

## Performance Testing — k6 Load Tests (Bonus Challenge)

Beyond functional testing, this project includes performance and load testing using [k6](https://k6.io) — an open-source load testing tool.

### Load Test Scenarios

| Test | File | Purpose |
|---|---|---|
| **Quotation Creation** | `k6/quotation-load.js` | API throughput under concurrent quotation creation (1 → 100 VUs) |
| **Payment Processing** | `k6/payment-load.js` | Payment latency & error rates under stress (1 → 500 VUs) |

### Running k6 Tests

```bash
# Install k6 (https://k6.io/docs/getting-started/installation/)
# macOS: brew install k6
# Linux: apt-get install k6
# Windows: choco install k6

# Start mock server in one terminal
npm run mock:server

# In another terminal, run quotation load test
npm run perf:quotation
# or
k6 run k6/quotation-load.js

# Run payment load test
npm run perf:payment
# or
k6 run k6/payment-load.js

# With custom base URL
k6 run -e BASE_URL=http://api.example.com k6/payment-load.js
```

### Load Test Design

**Quotation Creation Test:**
- Ramp-up: 1 user → 10 → 100 users over 3m 30s
- Each VU creates fresh quotation with 2 milestones
- SLA: p(95) < 2s, p(99) < 5s, error rate < 1%

**Payment Processing Test:**
- Ramp-up: 1 user → 10 → 100 → 500 users over 7 minutes
- Pre-creates 10 accepted quotations in setup phase
- Each VU performs payment with unique idempotency key
- SLA: p(95) < 2s, error rate < 1%
- **Peak:** 500 concurrent users for 3 minutes to find breaking point

**Metrics Tracked:**
- HTTP request duration (latency histogram)
- Error rate per endpoint
- Throughput (requests/second)
- Custom metrics: `payment_duration_ms`, `quotation_create_errors`

### [→ View k6 Test Details](k6/README.md)

---

## Design Documents

| Document | Description |
|---|---|
| [Test Cases Catalog](automation/tests/TEST-CASES.md) | Complete enumeration of all 104 test cases with IDs (TC-* and FINDING-*) mapped to .spec.ts |
| [Test Strategy & Plan](plan.md) | Full QA strategy, business rules, test matrix, architecture, and requirements |
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

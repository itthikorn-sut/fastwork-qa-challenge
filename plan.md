# 🧪 Fastwork QA Challenge – Test Strategy & Execution Plan

## 1. Objective

This project aims to validate the **Milestone Quotation and Payment Flow** with a focus on:

* Business rule correctness
* Payment reliability
* State consistency across multi-round milestones
* System robustness under edge cases

References:

* UI Flow: Create Quotation & Payment Flow
* Requirement Spec: Senior QA Challenge

---

## 2. Testing Approach

This strategy applies **risk-based testing** and **system-level thinking**, prioritizing critical business flows over exhaustive coverage.

### Key Focus Areas:

* 💰 Payment correctness (critical)
* 🔁 Milestone state transitions
* ⚠️ Failure handling & recovery
* 🔄 Data consistency (UI ↔ API)

---

## 3. System Under Test (Test Architecture)

To ensure deterministic and reproducible testing:

### Components:

* **Mock UI** → Simulates quotation + payment flow
* **Mock API Server** → Simulates `/api/v1/payments`
* **Playwright Test Runner** → Executes UI + API tests

### Flow:

UI → Mock API → Response → UI update → Assertion

### Rationale:

* Avoid dependency on production systems
* Enable simulation of edge cases (e.g., 500 errors, insufficient funds)
* Ensure CI/CD reproducibility

---

## 4. Business Flow Overview

1. Seller creates milestone quotation (2–5 rounds)
2. Buyer reviews and accepts quotation
3. Buyer makes payment via credit card
4. Seller submits work per round
5. Buyer accepts → system transfers money per round
6. Buyer may terminate at final round

---

## 5. Critical Business Rules

* Milestone rounds: **2–5 only**
* Each round: **> 100 THB**
* Total quotation: **> 3000 THB**
* Date: must be **future**
* Required fields:

  * Title
  * Description
  * Deliverables

---

## 6. Risk Analysis

### 🔴 High Risk

* Incorrect payment amount charged
* Duplicate payment (no idempotency)
* Incorrect fund transfer per milestone
* Payment success but system state inconsistent

### 🟠 Medium Risk

* Validation failures not enforced
* UI vs API mismatch
* Time-based failures (service downtime)

### 🟡 Low Risk

* UI formatting issues
* Optional fields handling

---

## 7. Test Design Strategy

### 7.1 Test Types

| Type          | Purpose                           |
| ------------- | --------------------------------- |
| UI Test       | Validate user flow and validation |
| API Test      | Validate payment logic            |
| E2E Test      | Validate full system behavior     |
| Negative Test | Validate error handling           |

---

## 8. Core Test Scenarios (High Impact)

### 8.1 Happy Path (E2E)

* Create valid quotation (3 rounds)
* Buyer accepts
* Payment success
* Work submission → acceptance → transfer

---

### 8.2 Payment Failure Scenarios

* Invalid card format → 400
* Insufficient funds → 402
* Missing required fields → 400

---

### 8.3 Validation Scenarios

* Less than 2 rounds → reject
* More than 5 rounds → reject
* Amount < 100 → reject
* Total < 3000 → reject
* Past date → reject

---

### 8.4 Termination Scenario

* Buyer terminates at round 3
* Verify:

  * No further processing
  * Correct state update

---

## 9. Advanced Test Scenarios (Senior-Level)

### 9.1 Idempotency

* Re-send payment request → should not double charge

### 9.2 Concurrency

* Buyer clicks “Pay” multiple times rapidly

### 9.3 Partial Failure

* Payment success but UI fails to update
* API success but DB not updated (simulated)

### 9.4 Data Consistency

* UI amount = API charged amount

---

## 10. Mock API Design

### Endpoint: POST /api/v1/payments

### Logic:

* Validate required fields
* Validate card format
* Validate amount constraints
* Simulate failure conditions

### Example Rules:

* Invalid card → 400
* amount < 0.01 → 400
* amount > 1,000,000 → 402
* unsupported currency → 400
* valid → 200 SUCCESS

---

## 11. Automation Strategy

### Tool: Playwright

### Scope:

* UI automation (mock UI)
* API testing (mock server)
* E2E scenario validation

### Structure:

```
automation/
  tests/
    ui/
    api/
  pages/
  utils/
  fixtures/
```

---

### Test Prioritization:

1. Happy path (E2E)
2. Payment failure cases
3. Validation rules

---

## 12. CI/CD Strategy

### Tool: GitHub Actions

### Pipeline:

* Install dependencies
* Start mock server
* Run Playwright tests
* Generate report

### Trigger:

* Push / Pull Request

---

## 13. Performance Testing (Design)

### Scenario:

Upload file up to 2GB

### Metrics:

* Response time
* Throughput
* Error rate
* CPU / Memory usage

### Load Levels:

| Users | Purpose  |
| ----- | -------- |
| 1     | baseline |
| 10    | normal   |
| 100   | stress   |
| 500   | limit    |

---

## 14. Security Testing (Design)

### Focus:

* PCI-DSS compliance
* Sensitive data handling

### Test Cases:

* Credit card not stored in plaintext
* Masked card display
* HTTPS enforcement
* No sensitive logs

---

## 15. Assumptions

* Payment API is mockable
* No real DB validation required
* Email notification is out of scope

---

## 16. Limitations

* No integration with real payment gateway
* No backend state persistence
* Mock UI is simplified

---

## 17. Challenges & Solutions

### Challenge:

No real system to test against

### Solution:

Implemented mock UI + mock API for deterministic testing

---

### Challenge:

Simulating real payment failures

### Solution:

Encoded business logic into mock API

---

## 18. Key Insights

* Payment systems require **idempotency and consistency checks**
* UI validation alone is insufficient without API validation
* Mocking enables reliable and reproducible test environments

---

## 19. Conclusion

This approach ensures:

* High confidence in critical business flows
* Reliable automation execution
* Clear visibility for reviewers

The solution prioritizes **correctness, stability, and scalability** over superficial test coverage.

---

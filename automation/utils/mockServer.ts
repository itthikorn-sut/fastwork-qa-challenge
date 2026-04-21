import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../mock-ui')));

// In-memory store for idempotency
const processedPayments = new Map<string, object>();

// In-memory store for quotation state
const quotations = new Map<string, QuotationState>();
let quotationSeq = 0;

interface Milestone {
  round: number;
  amount: number;
  title: string;
  description: string;
  deliverables: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'accepted' | 'transferred';
}

interface QuotationState {
  id: string;
  seller_id: string;
  buyer_id: string;
  milestones: Milestone[];
  total_amount: number;
  status: 'draft' | 'accepted' | 'rejected' | 'paid' | 'in_progress' | 'completed' | 'terminated';
  paid_at?: string;
  rejection_reason?: string;
}

// POST /api/v1/quotations - create quotation
app.post('/api/v1/quotations', (req: Request, res: Response) => {
  const { seller_id, buyer_id, milestones } = req.body;

  if (!seller_id || !buyer_id || !milestones) {
    return res.status(400).json({ error: 'Missing required fields: seller_id, buyer_id, milestones' });
  }


  if (!Array.isArray(milestones) || milestones.length < 2 || milestones.length > 5) {
    return res.status(400).json({ error: 'Milestone rounds must be between 2 and 5' });
  }

  const errors: string[] = [];
  let total = 0;

  for (const [i, m] of milestones.entries()) {
    const round = i + 1;
    if (!m.title) errors.push(`Round ${round}: title is required`);
    else if (m.title.length > 100) errors.push(`Round ${round}: title must not exceed 100 characters`);
    if (!m.description) errors.push(`Round ${round}: description is required`);
    else if (m.description.length > 2000) errors.push(`Round ${round}: description must not exceed 2000 characters`);
    if (!m.deliverables) errors.push(`Round ${round}: deliverables is required`);
    else if (m.deliverables.length > 500) errors.push(`Round ${round}: deliverables must not exceed 500 characters`);
    if (!m.due_date) errors.push(`Round ${round}: due_date is required`);
    if (m.amount === undefined || m.amount === null) {
      errors.push(`Round ${round}: amount is required`);
    } else if (m.amount <= 100) {
      errors.push(`Round ${round}: amount must be greater than 100 THB`);
    }

    if (m.due_date) {
      const due = new Date(m.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due <= today) errors.push(`Round ${round}: due_date must be a future date`);
    }

    total += m.amount || 0;
  }

  if (total <= 3000) {
    errors.push(`Total quotation amount must be greater than 3000 THB (current: ${total} THB)`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const id = `QUO-${Date.now()}-${++quotationSeq}`;
  const quotation: QuotationState = {
    id,
    seller_id,
    buyer_id,
    milestones: milestones.map((m: Milestone, i: number) => ({
      ...m,
      round: i + 1,
      status: 'pending',
    })),
    total_amount: total,
    status: 'draft',
  };
  quotations.set(id, quotation);

  return res.status(201).json({ quotation_id: id, total_amount: total, status: 'draft' });
});

// POST /api/v1/quotations/:id/accept - buyer accepts quotation
app.post('/api/v1/quotations/:id/accept', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  if (quotation.status !== 'draft') {
    return res.status(409).json({ error: `Cannot accept quotation in status: ${quotation.status}` });
  }
  quotation.status = 'accepted';
  return res.status(200).json({ quotation_id: quotation.id, status: 'accepted' });
});

// POST /api/v1/quotations/:id/reject - buyer declines quotation
app.post('/api/v1/quotations/:id/reject', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  if (quotation.status !== 'draft') {
    return res.status(409).json({ error: `Cannot reject quotation in status: ${quotation.status}` });
  }
  const { reason } = req.body;
  quotation.status = 'rejected';
  quotation.rejection_reason = reason || 'No reason provided';
  return res.status(200).json({
    quotation_id: quotation.id,
    status: 'rejected',
    reason: quotation.rejection_reason,
  });
});

// Helper: returns true if time falls in maintenance window 23:55–00:15
function isServiceWindow(timeOverride?: string): boolean {
  let h: number, m: number;
  if (timeOverride && /^\d{2}:\d{2}$/.test(timeOverride)) {
    [h, m] = timeOverride.split(':').map(Number);
  } else {
    const now = new Date();
    h = now.getHours(); m = now.getMinutes();
  }
  return (h === 23 && m >= 55) || (h === 0 && m <= 15);
}

// POST /api/v1/payments - process payment
app.post('/api/v1/payments', (req: Request, res: Response) => {
  // Service window check (23:55–00:15); x-simulated-time header overrides for tests
  const simulatedTime = req.headers['x-simulated-time'] as string | undefined;
  if (isServiceWindow(simulatedTime)) {
    return res.status(503).json({ error: 'Service unavailable: maintenance window 23:55–00:15. Please try again after 00:15.' });
  }

  // 401 check: reject requests with explicit invalid token
  const auth = req.headers['authorization'];
  if (auth && auth !== 'Bearer valid-token') {
    return res.status(401).json({ error: 'UNAUTHORIZE: Invalid or expired token' });
  }

  const { quotation_id, credit_card_number, credit_card_owner_name, expiration_date, cvv, amount, currency, idempotency_key } = req.body;

  // Idempotency check
  if (idempotency_key && processedPayments.has(idempotency_key)) {
    return res.status(200).json(processedPayments.get(idempotency_key));
  }

  // Required fields
  const missing: string[] = [];
  if (!quotation_id) missing.push('quotation_id');
  if (!credit_card_number) missing.push('credit_card_number');
  if (!credit_card_owner_name) missing.push('credit_card_owner_name');
  if (!expiration_date) missing.push('expiration_date');
  if (!cvv) missing.push('cvv');
  if (amount === undefined || amount === null) missing.push('amount');
  if (!currency) missing.push('currency');
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing });
  }

  // Card number format: 14–16 digits (14 = Diners, 15 = Amex, 16 = Visa/MC/JCB/UnionPay)
  const cardDigits = String(credit_card_number).replace(/\s/g, '');
  if (!/^\d{14,16}$/.test(cardDigits)) {
    return res.status(400).json({ error: 'Invalid card number format. Must be 14–16 digits.' });
  }

  // Expiration date format: MM/YY
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration_date)) {
    return res.status(400).json({ error: 'Invalid expiration_date format. Use MM/YY.' });
  }

  // CVV: 3-4 digits
  if (!/^\d{3,4}$/.test(String(cvv))) {
    return res.status(400).json({ error: 'Invalid CVV format. Must be 3-4 digits.' });
  }

  // Simulate payment-gateway 500 for dedicated error-simulation card
  if (cardDigits === '9999999999999999') {
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR: Payment gateway unavailable' });
  }


  // Amount validation
  if (typeof amount !== 'number' || amount < 0.01) {
    return res.status(400).json({ error: 'Amount must be at least 0.01' });
  }
  if (amount > 1_000_000) {
    return res.status(402).json({ error: 'Insufficient funds or amount exceeds limit' });
  }

  // Currency validation — supported: THB, VND, IDR
  const supportedCurrencies = ['THB', 'VND', 'IDR'];
  if (!supportedCurrencies.includes(String(currency).toUpperCase())) {
    return res.status(400).json({ error: `Unsupported currency: ${currency}. Supported: ${supportedCurrencies.join(', ')}` });
  }

  // Quotation state validation
  const quotation = quotations.get(quotation_id);
  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  // Cross-user authorization: only the quotation's buyer may pay
  const userId = req.headers['x-user-id'] as string | undefined;
  if (userId && quotation.buyer_id !== userId) {
    return res.status(403).json({ error: 'Forbidden: only the buyer of this quotation may initiate payment' });
  }

  if (quotation.status !== 'accepted') {
    return res.status(409).json({ error: `Quotation must be accepted before payment. Current status: ${quotation.status}` });
  }

  // Account status check at payment time
  if (quotation.buyer_id.startsWith('INACTIVE-')) {
    return res.status(403).json({ error: 'Forbidden: buyer account is inactive' });
  }
  if (quotation.seller_id.startsWith('INACTIVE-')) {
    return res.status(403).json({ error: 'Forbidden: seller account is inactive' });
  }

  // Omise test-card decline lookup — mirrors docs.omise.co/api-testing
  const OMISE_DECLINE: Record<string, { error: string; failure_code: string }> = {
    // insufficient_fund
    '4111111111140011': { error: 'Card declined: insufficient funds',      failure_code: 'insufficient_fund' },
    '5555551111110011': { error: 'Card declined: insufficient funds',      failure_code: 'insufficient_fund' },
    '3530111111190011': { error: 'Card declined: insufficient funds',      failure_code: 'insufficient_fund' },
    '6250947000000014': { error: 'Card declined: insufficient funds',      failure_code: 'insufficient_fund' },
    // stolen_or_lost_card
    '4111111111130012': { error: 'Card declined: stolen or lost card',     failure_code: 'stolen_or_lost_card' },
    '5555551111100012': { error: 'Card declined: stolen or lost card',     failure_code: 'stolen_or_lost_card' },
    '3530111111180012': { error: 'Card declined: stolen or lost card',     failure_code: 'stolen_or_lost_card' },
    '6250947000000022': { error: 'Card declined: stolen or lost card',     failure_code: 'stolen_or_lost_card' },
    // failed_processing
    '4111111111120013': { error: 'Card declined: failed processing',       failure_code: 'failed_processing' },
    '5555551111190013': { error: 'Card declined: failed processing',       failure_code: 'failed_processing' },
    '3530111111170013': { error: 'Card declined: failed processing',       failure_code: 'failed_processing' },
    '377138160000009':  { error: 'Card declined: failed processing',       failure_code: 'failed_processing' }, // Amex
    '6250947000000030': { error: 'Card declined: failed processing',       failure_code: 'failed_processing' },
    // payment_rejected
    '4111111111110014': { error: 'Card declined: payment rejected',        failure_code: 'payment_rejected' },
    '5555551111180014': { error: 'Card declined: payment rejected',        failure_code: 'payment_rejected' },
    '3530111111160014': { error: 'Card declined: payment rejected',        failure_code: 'payment_rejected' },
    '6250947000000048': { error: 'Card declined: payment rejected',        failure_code: 'payment_rejected' },
    // failed_fraud_check
    '4111111111190016': { error: 'Card declined: failed fraud check',      failure_code: 'failed_fraud_check' },
    '5555551111160016': { error: 'Card declined: failed fraud check',      failure_code: 'failed_fraud_check' },
    '3530111111140016': { error: 'Card declined: failed fraud check',      failure_code: 'failed_fraud_check' },
    '6250947000000055': { error: 'Card declined: failed fraud check',      failure_code: 'failed_fraud_check' },
    // invalid_account_number
    '4111111111180017': { error: 'Card declined: invalid account number',  failure_code: 'invalid_account_number' },
    '5555551111150017': { error: 'Card declined: invalid account number',  failure_code: 'invalid_account_number' },
    '3530111111130017': { error: 'Card declined: invalid account number',  failure_code: 'invalid_account_number' },
    '6250947000000063': { error: 'Card declined: invalid account number',  failure_code: 'invalid_account_number' },
    // 3ds_enrollment_failure
    '4111111111150002': { error: '3DS enrollment failed',                  failure_code: '3ds_enrollment_failure' },
    '5555551111120002': { error: '3DS enrollment failed',                  failure_code: '3ds_enrollment_failure' },
    '3530111111100002': { error: '3DS enrollment failed',                  failure_code: '3ds_enrollment_failure' },
    '6250947000000071': { error: '3DS enrollment failed',                  failure_code: '3ds_enrollment_failure' },
    // 3ds_validation_failure
    '4111111111140003': { error: '3DS validation failed: wrong OTP or timeout', failure_code: '3ds_validation_failure' },
    '5555551111110003': { error: '3DS validation failed: wrong OTP or timeout', failure_code: '3ds_validation_failure' },
    '3530111111190003': { error: '3DS validation failed: wrong OTP or timeout', failure_code: '3ds_validation_failure' },
    '377138161111003':  { error: '3DS validation failed: wrong OTP or timeout', failure_code: '3ds_validation_failure' }, // Amex
    '6250947000000089': { error: '3DS validation failed: wrong OTP or timeout', failure_code: '3ds_validation_failure' },
  };

  const decline = OMISE_DECLINE[cardDigits];
  if (decline) {
    return res.status(402).json(decline);
  }

  // Success
  quotation.status = 'paid';
  quotation.paid_at = new Date().toISOString();

  const result = {
    payment_id: `PAY-${Date.now()}`,
    quotation_id,
    amount,
    currency: String(currency).toUpperCase(),
    status: 'SUCCESS',
    paid_at: quotation.paid_at,
    masked_card: `****-****-****-${cardDigits.slice(-4)}`,
  };

  if (idempotency_key) processedPayments.set(idempotency_key, result);

  return res.status(200).json(result);
});

// POST /api/v1/quotations/:id/milestones/:round/submit - seller submits work
app.post('/api/v1/quotations/:id/milestones/:round/submit', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  if (quotation.status !== 'paid' && quotation.status !== 'in_progress') {
    return res.status(409).json({ error: 'Quotation must be paid before submitting work' });
  }

  const round = parseInt(req.params.round);
  const milestone = quotation.milestones.find(m => m.round === round);
  if (!milestone) return res.status(404).json({ error: `Milestone round ${round} not found` });
  if (milestone.status !== 'pending') {
    return res.status(409).json({ error: `Milestone round ${round} is already ${milestone.status}` });
  }

  milestone.status = 'submitted';
  quotation.status = 'in_progress';
  return res.status(200).json({ quotation_id: quotation.id, round, status: 'submitted' });
});

// POST /api/v1/quotations/:id/milestones/:round/accept - buyer accepts work + triggers transfer
app.post('/api/v1/quotations/:id/milestones/:round/accept', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  const round = parseInt(req.params.round);
  const milestone = quotation.milestones.find(m => m.round === round);
  if (!milestone) return res.status(404).json({ error: `Milestone round ${round} not found` });
  if (milestone.status !== 'submitted') {
    return res.status(409).json({ error: `Milestone round ${round} must be submitted before acceptance` });
  }

  milestone.status = 'accepted';

  // Simulate fund transfer
  setTimeout(() => { milestone.status = 'transferred'; }, 100);

  // Mark completed only when every milestone is accepted or transferred
  const allAccepted = quotation.milestones.every(
    m => m.status === 'accepted' || m.status === 'transferred',
  );
  if (allAccepted) quotation.status = 'completed';

  return res.status(200).json({
    quotation_id: quotation.id,
    round,
    milestone_status: 'accepted',
    transfer_status: 'processing',
    transferred_amount: milestone.amount,
    quotation_status: quotation.status,
  });
});

// POST /api/v1/quotations/:id/milestones/:round/reject - buyer rejects work
app.post('/api/v1/quotations/:id/milestones/:round/reject', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  const round = parseInt(req.params.round);
  const milestone = quotation.milestones.find(m => m.round === round);
  if (!milestone) return res.status(404).json({ error: `Milestone round ${round} not found` });
  if (milestone.status !== 'submitted') {
    return res.status(409).json({ error: `Milestone round ${round} must be submitted before rejection` });
  }

  milestone.status = 'pending';
  const { reason } = req.body;
  return res.status(200).json({
    quotation_id: quotation.id,
    round,
    status: 'rejected',
    reason: reason || 'No reason provided',
  });
});

// POST /api/v1/quotations/:id/terminate - buyer terminates
app.post('/api/v1/quotations/:id/terminate', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  const terminalStatuses = ['completed', 'terminated'];
  if (terminalStatuses.includes(quotation.status)) {
    return res.status(409).json({ error: `Cannot terminate quotation in status: ${quotation.status}` });
  }

  const lastAccepted = quotation.milestones.filter(m => m.status === 'accepted' || m.status === 'transferred').length;
  quotation.status = 'terminated';

  return res.status(200).json({
    quotation_id: quotation.id,
    status: 'terminated',
    completed_rounds: lastAccepted,
    remaining_rounds: quotation.milestones.length - lastAccepted,
  });
});

// GET /api/v1/quotations/:id - get quotation state
app.get('/api/v1/quotations/:id', (req: Request, res: Response) => {
  const quotation = quotations.get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  // Cross-user authorization: only buyer or seller of this quotation may view it
  const userId = req.headers['x-user-id'] as string | undefined;
  if (userId && quotation.buyer_id !== userId && quotation.seller_id !== userId) {
    return res.status(403).json({ error: 'Forbidden: access to this quotation is denied' });
  }

  return res.status(200).json(quotation);
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});

export { app, quotations, processedPayments };

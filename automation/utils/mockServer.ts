import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../mock-ui')));

// In-memory store for idempotency
const processedPayments = new Map<string, object>();

// In-memory store for quotation state
const quotations = new Map<string, QuotationState>();

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
  status: 'draft' | 'accepted' | 'paid' | 'in_progress' | 'completed' | 'terminated';
  paid_at?: string;
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
    if (!m.description) errors.push(`Round ${round}: description is required`);
    if (!m.deliverables) errors.push(`Round ${round}: deliverables is required`);
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

  const id = `QUO-${Date.now()}`;
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

// POST /api/v1/payments - process payment
app.post('/api/v1/payments', (req: Request, res: Response) => {
  const { quotation_id, card_number, card_expiry, card_cvv, amount, currency, idempotency_key } = req.body;

  // Idempotency check
  if (idempotency_key && processedPayments.has(idempotency_key)) {
    return res.status(200).json(processedPayments.get(idempotency_key));
  }

  // Required fields
  const missing: string[] = [];
  if (!quotation_id) missing.push('quotation_id');
  if (!card_number) missing.push('card_number');
  if (!card_expiry) missing.push('card_expiry');
  if (!card_cvv) missing.push('card_cvv');
  if (amount === undefined || amount === null) missing.push('amount');
  if (!currency) missing.push('currency');
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing });
  }

  // Card number format: 16 digits
  const cardDigits = String(card_number).replace(/\s/g, '');
  if (!/^\d{16}$/.test(cardDigits)) {
    return res.status(400).json({ error: 'Invalid card number format. Must be 16 digits.' });
  }

  // Card expiry format: MM/YY
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card_expiry)) {
    return res.status(400).json({ error: 'Invalid card expiry format. Use MM/YY.' });
  }

  // Card CVV: 3-4 digits
  if (!/^\d{3,4}$/.test(String(card_cvv))) {
    return res.status(400).json({ error: 'Invalid CVV format. Must be 3-4 digits.' });
  }

  // Amount validation
  if (typeof amount !== 'number' || amount < 0.01) {
    return res.status(400).json({ error: 'Amount must be at least 0.01' });
  }
  if (amount > 1_000_000) {
    return res.status(402).json({ error: 'Insufficient funds or amount exceeds limit' });
  }

  // Currency validation
  const supportedCurrencies = ['THB', 'USD', 'EUR'];
  if (!supportedCurrencies.includes(String(currency).toUpperCase())) {
    return res.status(400).json({ error: `Unsupported currency: ${currency}. Supported: ${supportedCurrencies.join(', ')}` });
  }

  // Quotation state validation
  const quotation = quotations.get(quotation_id);
  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found' });
  }
  if (quotation.status !== 'accepted') {
    return res.status(409).json({ error: `Quotation must be accepted before payment. Current status: ${quotation.status}` });
  }

  // Simulate card ending in 0000 as declined
  if (cardDigits.endsWith('0000')) {
    return res.status(402).json({ error: 'Card declined: insufficient funds' });
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

  const allDone = quotation.milestones.every(m => m.round <= round ? true : true);
  const isLastRound = round === quotation.milestones.length;
  if (isLastRound) quotation.status = 'completed';

  return res.status(200).json({
    quotation_id: quotation.id,
    round,
    milestone_status: 'accepted',
    transfer_status: 'processing',
    transferred_amount: milestone.amount,
    quotation_status: quotation.status,
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

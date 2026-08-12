// ─── Business Logic (extracted for unit testing without DB) ──────────────────

interface Transaction {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  date: Date;
}

/**
 * Calculates a Profit & Loss summary from a list of transactions.
 */
function calculateProfitAndLoss(transactions: Transaction[]): {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
} {
  const totalRevenue = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const grossProfit = totalRevenue - totalExpenses;
  const netProfit = grossProfit; // In this model, gross = net (simplified)
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalExpenses: parseFloat(totalExpenses.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    profitMargin: parseFloat(profitMargin.toFixed(2)),
  };
}

/**
 * Filters transactions to a specific date range.
 */
function filterByDateRange(transactions: Transaction[], from: Date, to: Date): Transaction[] {
  return transactions.filter((t) => t.date >= from && t.date <= to);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Finance: Profit & Loss Summary Calculation', () => {
  const transactions: Transaction[] = [
    { type: 'INCOME', amount: 10000, category: 'Sales', date: new Date('2025-01-10') },
    { type: 'INCOME', amount: 5000, category: 'Services', date: new Date('2025-01-15') },
    { type: 'EXPENSE', amount: 3000, category: 'Rent', date: new Date('2025-01-05') },
    { type: 'EXPENSE', amount: 1500, category: 'Utilities', date: new Date('2025-01-20') },
  ];

  it('should correctly sum all INCOME transactions as total revenue', () => {
    const pnl = calculateProfitAndLoss(transactions);
    expect(pnl.totalRevenue).toBe(15000);
  });

  it('should correctly sum all EXPENSE transactions as total expenses', () => {
    const pnl = calculateProfitAndLoss(transactions);
    expect(pnl.totalExpenses).toBe(4500);
  });

  it('should correctly calculate gross profit as revenue minus expenses', () => {
    const pnl = calculateProfitAndLoss(transactions);
    expect(pnl.grossProfit).toBe(10500); // 15000 - 4500
  });

  it('should calculate the correct profit margin percentage', () => {
    const pnl = calculateProfitAndLoss(transactions);
    // (10500 / 15000) * 100 = 70%
    expect(pnl.profitMargin).toBe(70);
  });

  it('should return a negative gross profit when expenses exceed revenue', () => {
    const lossTransactions: Transaction[] = [
      { type: 'INCOME', amount: 1000, category: 'Sales', date: new Date() },
      { type: 'EXPENSE', amount: 5000, category: 'Operations', date: new Date() },
    ];
    const pnl = calculateProfitAndLoss(lossTransactions);
    expect(pnl.grossProfit).toBe(-4000);
  });

  it('should return zero profit margin when there is no revenue', () => {
    const noRevenue: Transaction[] = [
      { type: 'EXPENSE', amount: 2000, category: 'Rent', date: new Date() },
    ];
    const pnl = calculateProfitAndLoss(noRevenue);
    expect(pnl.profitMargin).toBe(0);
  });

  it('should return all zeros when there are no transactions', () => {
    const pnl = calculateProfitAndLoss([]);
    expect(pnl.totalRevenue).toBe(0);
    expect(pnl.totalExpenses).toBe(0);
    expect(pnl.grossProfit).toBe(0);
    expect(pnl.profitMargin).toBe(0);
  });
});

describe('Finance: Date Range Filtering', () => {
  const transactions: Transaction[] = [
    { type: 'INCOME', amount: 1000, category: 'Sales', date: new Date('2025-01-10') },
    { type: 'EXPENSE', amount: 500, category: 'Rent', date: new Date('2025-02-15') },
    { type: 'INCOME', amount: 2000, category: 'Services', date: new Date('2025-03-20') },
  ];

  it('should return only transactions within the specified date range', () => {
    const filtered = filterByDateRange(
      transactions,
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].amount).toBe(1000);
  });

  it('should return an empty array when no transactions fall within the date range', () => {
    const filtered = filterByDateRange(
      transactions,
      new Date('2024-01-01'),
      new Date('2024-12-31')
    );
    expect(filtered.length).toBe(0);
  });
});

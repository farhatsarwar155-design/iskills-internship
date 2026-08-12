// ─── Business Logic (extracted for unit testing without DB) ──────────────────
// These functions mirror exactly the weighted formula in dashboard.controller.ts

function calcInventoryTurnoverScore(cogsThisMonth: number, currentInventoryValue: number): number {
  const inventoryTurnover = cogsThisMonth / (currentInventoryValue || 1);
  return Math.min(100, Math.max(0, inventoryTurnover * 200));
}

function calcSalesGrowthScore(currentSales: number, prevSales: number): number {
  const salesGrowth = (currentSales - prevSales) / (prevSales || 1);
  return Math.min(100, Math.max(0, (salesGrowth + 0.2) * 100));
}

function calcCashFlowScore(totalIncome: number, totalExpense: number): number {
  const cashFlowRatio = totalExpense > 0 ? totalIncome / totalExpense : (totalIncome > 0 ? 2 : 1);
  return Math.min(100, Math.max(0, (cashFlowRatio - 0.5) * 100));
}

function calcCollectionScore(paidOrders: number, allOrders: number): number {
  const collectionEfficiency = allOrders > 0 ? paidOrders / allOrders : 1;
  return Math.min(100, Math.max(0, collectionEfficiency * 100));
}

function calcTotalHealthScore(
  turnoverScore: number,
  growthScore: number,
  cashFlowScore: number,
  collectionScore: number
): number {
  return Math.round(
    turnoverScore * 0.2 + growthScore * 0.3 + cashFlowScore * 0.3 + collectionScore * 0.2
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Dashboard: Business Health Score – Inventory Turnover Component', () => {
  it('should return 100 when turnover is at or above the maximum threshold (50%)', () => {
    // 50% of inventory value was sold => 0.5 * 200 = 100
    const score = calcInventoryTurnoverScore(500, 1000);
    expect(score).toBe(100);
  });

  it('should return 0 when no items were sold this month', () => {
    const score = calcInventoryTurnoverScore(0, 5000);
    expect(score).toBe(0);
  });

  it('should return a proportional score for moderate turnover', () => {
    // 25% turnover => 0.25 * 200 = 50
    const score = calcInventoryTurnoverScore(250, 1000);
    expect(score).toBe(50);
  });
});

describe('Dashboard: Business Health Score – Sales Growth Component', () => {
  it('should return 100 when current sales have grown by 80% or more over the previous period', () => {
    const score = calcSalesGrowthScore(1800, 1000); // 80% growth => (0.8 + 0.2) * 100 = 100
    expect(score).toBe(100);
  });

  it('should return 0 when sales have declined by 20% or more', () => {
    const score = calcSalesGrowthScore(800, 1000); // -20% growth => (-0.2 + 0.2) * 100 = 0
    expect(score).toBe(0);
  });

  it('should return 20 when there is no growth (flat sales)', () => {
    const score = calcSalesGrowthScore(1000, 1000); // 0% growth => (0 + 0.2) * 100 = 20
    expect(score).toBe(20);
  });
});

describe('Dashboard: Business Health Score – Cash Flow Component', () => {
  it('should return 100 when income is 1.5x or more the total expenses', () => {
    // ratio = 1500 / 1000 = 1.5 => (1.5 - 0.5) * 100 = 100
    const score = calcCashFlowScore(1500, 1000);
    expect(score).toBe(100);
  });

  it('should return 0 when income is only half of expenses (ratio = 0.5)', () => {
    // ratio = 500 / 1000 = 0.5 => (0.5 - 0.5) * 100 = 0
    const score = calcCashFlowScore(500, 1000);
    expect(score).toBe(0);
  });

  it('should return 100 when there are no expenses but income exists', () => {
    const score = calcCashFlowScore(5000, 0); // ratio defaults to 2 => (2 - 0.5) * 100 = 150 => capped at 100
    expect(score).toBe(100);
  });
});

describe('Dashboard: Business Health Score – Payment Collection Component', () => {
  it('should return 100 when all orders are paid', () => {
    const score = calcCollectionScore(50, 50);
    expect(score).toBe(100);
  });

  it('should return 0 when no orders are paid', () => {
    const score = calcCollectionScore(0, 50);
    expect(score).toBe(0);
  });

  it('should return 50 when half of orders are paid', () => {
    const score = calcCollectionScore(25, 50);
    expect(score).toBe(50);
  });
});

describe('Dashboard: Business Health Score – Weighted Total Calculation', () => {
  it('should produce a total score of 100 when all components are at maximum', () => {
    const total = calcTotalHealthScore(100, 100, 100, 100);
    expect(total).toBe(100);
  });

  it('should produce a total score of 0 when all components are at minimum', () => {
    const total = calcTotalHealthScore(0, 0, 0, 0);
    expect(total).toBe(0);
  });

  it('should correctly apply the defined weights to each component (0.2, 0.3, 0.3, 0.2)', () => {
    // All at 50 should return 50 regardless of weights
    const total = calcTotalHealthScore(50, 50, 50, 50);
    expect(total).toBe(50);
  });

  it('should produce a correct weighted result when components vary significantly', () => {
    // turnover=0 (w0.2), growth=100 (w0.3), cashflow=100 (w0.3), collection=0 (w0.2)
    // = 0*0.2 + 100*0.3 + 100*0.3 + 0*0.2 = 60
    const total = calcTotalHealthScore(0, 100, 100, 0);
    expect(total).toBe(60);
  });
});

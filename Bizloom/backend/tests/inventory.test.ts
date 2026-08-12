// ─── Business Logic (extracted for unit testing without DB) ──────────────────

interface OrderItem {
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  quantity: number;
  minStockLevel: number;
}

/**
 * Calculates how many units to deduct from stock when a sale is completed.
 */
function deductStockOnSale(product: Product, soldQty: number): number {
  if (soldQty <= 0) throw new Error('Sale quantity must be positive');
  if (soldQty > product.quantity) throw new Error('Insufficient stock');
  return product.quantity - soldQty;
}

/**
 * Calculates how many units to add to stock when a PO is marked received.
 */
function addStockOnPOReceived(product: Product, receivedQty: number): number {
  if (receivedQty <= 0) throw new Error('Received quantity must be positive');
  return product.quantity + receivedQty;
}

/**
 * Calculates stockout risk based on quantity and min stock level.
 */
function getStockoutRisk(quantity: number, minStockLevel: number): string {
  if (quantity === 0) return 'CRITICAL';
  if (quantity <= minStockLevel) return 'WARNING';
  return 'SAFE';
}

/**
 * Calculates the suggested reorder quantity using a simplified EOQ-like formula.
 */
function calculateSuggestedReorder(avgDailySales: number, minStockLevel: number, currentQty: number): number {
  return Math.max(0, Math.ceil((avgDailySales * 14) + minStockLevel - currentQty));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Inventory: Stock Deduction on Sale', () => {
  const product: Product = { id: 'prod-1', quantity: 100, minStockLevel: 10 };

  it('should correctly deduct stock quantity when a sale is completed', () => {
    const newQty = deductStockOnSale(product, 30);
    expect(newQty).toBe(70);
  });

  it('should deduct exactly 1 unit when a single item is sold', () => {
    const newQty = deductStockOnSale(product, 1);
    expect(newQty).toBe(99);
  });

  it('should throw an error when attempting to sell more than available stock', () => {
    expect(() => deductStockOnSale(product, 150)).toThrow('Insufficient stock');
  });

  it('should throw an error when sale quantity is zero or negative', () => {
    expect(() => deductStockOnSale(product, 0)).toThrow('Sale quantity must be positive');
    expect(() => deductStockOnSale(product, -5)).toThrow('Sale quantity must be positive');
  });

  it('should allow selling all remaining stock (reducing quantity to zero)', () => {
    const newQty = deductStockOnSale(product, 100);
    expect(newQty).toBe(0);
  });
});

describe('Inventory: Stock Addition on Purchase Order Received', () => {
  const product: Product = { id: 'prod-2', quantity: 20, minStockLevel: 5 };

  it('should correctly add stock quantity when a purchase order is marked as received', () => {
    const newQty = addStockOnPOReceived(product, 50);
    expect(newQty).toBe(70);
  });

  it('should correctly add stock to a product with zero current quantity', () => {
    const zeroProduct = { ...product, quantity: 0 };
    const newQty = addStockOnPOReceived(zeroProduct, 100);
    expect(newQty).toBe(100);
  });

  it('should throw an error when received quantity is zero or negative', () => {
    expect(() => addStockOnPOReceived(product, 0)).toThrow('Received quantity must be positive');
    expect(() => addStockOnPOReceived(product, -10)).toThrow('Received quantity must be positive');
  });
});

describe('Inventory: Stockout Risk Calculation', () => {
  it('should flag a product as CRITICAL when quantity is zero', () => {
    expect(getStockoutRisk(0, 10)).toBe('CRITICAL');
  });

  it('should flag a product as WARNING when quantity is at or below the minimum stock level', () => {
    expect(getStockoutRisk(10, 10)).toBe('WARNING');
    expect(getStockoutRisk(5, 10)).toBe('WARNING');
  });

  it('should flag a product as SAFE when quantity is above the minimum stock level', () => {
    expect(getStockoutRisk(50, 10)).toBe('SAFE');
  });
});

describe('Inventory: Predictive Reorder Suggestion', () => {
  it('should calculate a positive reorder quantity for a fast-moving item', () => {
    // Sells 5 units/day, min stock 10, currently has 20 units => (5*14) + 10 - 20 = 60
    const qty = calculateSuggestedReorder(5, 10, 20);
    expect(qty).toBe(60);
  });

  it('should return zero when stock is already sufficient for the reorder period', () => {
    // Sells 0 units/day, min stock 10, currently has 50 units => max(0, 0 + 10 - 50) = 0
    const qty = calculateSuggestedReorder(0, 10, 50);
    expect(qty).toBe(0);
  });
});

// ─── Business Logic (extracted for unit testing without DB) ──────────────────

interface Employee {
  salary: number; // Gross monthly salary in USD
  status: string;
}

/**
 * Calculates the net payroll salary after standard deductions.
 * Deductions: Income Tax (15%), Social Security (6.2%), Health Insurance (1.45%)
 */
function calculateNetSalary(grossSalary: number): {
  gross: number;
  incomeTax: number;
  socialSecurity: number;
  healthInsurance: number;
  net: number;
} {
  if (grossSalary < 0) throw new Error('Gross salary cannot be negative');

  const incomeTax = grossSalary * 0.15;
  const socialSecurity = grossSalary * 0.062;
  const healthInsurance = grossSalary * 0.0145;
  const totalDeductions = incomeTax + socialSecurity + healthInsurance;
  const net = grossSalary - totalDeductions;

  return {
    gross: grossSalary,
    incomeTax: parseFloat(incomeTax.toFixed(2)),
    socialSecurity: parseFloat(socialSecurity.toFixed(2)),
    healthInsurance: parseFloat(healthInsurance.toFixed(2)),
    net: parseFloat(net.toFixed(2)),
  };
}

/**
 * Calculates the total payroll cost for a list of active employees.
 */
function calculateTotalPayroll(employees: Employee[]): number {
  return employees
    .filter((e) => e.status === 'ACTIVE')
    .reduce((sum, e) => sum + e.salary, 0);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HR: Payroll Net Salary Calculation', () => {
  it('should correctly calculate net salary after all standard deductions', () => {
    // Gross: $5000 => Tax: $750, SS: $310, Health: $72.50 => Net: $3867.50
    const result = calculateNetSalary(5000);
    expect(result.gross).toBe(5000);
    expect(result.incomeTax).toBe(750);
    expect(result.socialSecurity).toBe(310);
    expect(result.healthInsurance).toBe(72.5);
    expect(result.net).toBe(3867.5);
  });

  it('should return zero net salary when gross salary is zero', () => {
    const result = calculateNetSalary(0);
    expect(result.net).toBe(0);
    expect(result.incomeTax).toBe(0);
  });

  it('should throw an error when gross salary is negative', () => {
    expect(() => calculateNetSalary(-1000)).toThrow('Gross salary cannot be negative');
  });

  it('should calculate net salary as a value less than gross salary', () => {
    const result = calculateNetSalary(8000);
    expect(result.net).toBeLessThan(result.gross);
  });

  it('should correctly proportionally scale deductions for higher salaries', () => {
    const low = calculateNetSalary(3000);
    const high = calculateNetSalary(6000);
    expect(high.incomeTax).toBe(low.incomeTax * 2);
    expect(high.net).toBe(low.net * 2);
  });
});

describe('HR: Total Payroll Calculation', () => {
  const employees: Employee[] = [
    { salary: 5000, status: 'ACTIVE' },
    { salary: 7500, status: 'ACTIVE' },
    { salary: 3000, status: 'INACTIVE' }, // Should be excluded
  ];

  it('should sum salaries of only ACTIVE employees for total payroll', () => {
    const total = calculateTotalPayroll(employees);
    expect(total).toBe(12500); // 5000 + 7500, excluding 3000
  });

  it('should return zero when there are no active employees', () => {
    const inactiveOnly: Employee[] = [{ salary: 5000, status: 'INACTIVE' }];
    expect(calculateTotalPayroll(inactiveOnly)).toBe(0);
  });
});

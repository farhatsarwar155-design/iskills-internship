import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

// ---------------- EMPLOYEES ----------------

export const getEmployees = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, department } = req.query;

    const whereClause: any = {};
    if (department && department !== 'all') {
      whereClause.department = { equals: department as string };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { position: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json({ employees });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve employees' });
  }
};

export const getEmployeeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 attendance records
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve employee details' });
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, position, department, salary, status } = req.body;

    if (!name || !email || !position || !department || salary === undefined) {
      return res.status(400).json({ message: 'Name, Email, Position, Department, and Salary are required' });
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'An employee with this email already exists' });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        position,
        department,
        salary: parseFloat(salary),
        status: status || 'ACTIVE',
      },
    });

    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, department, salary, status } = req.body;

    if (!name || !email || !position || !department || salary === undefined) {
      return res.status(400).json({ message: 'Name, Email, Position, Department, and Salary are required' });
    }

    const existing = await prisma.employee.findFirst({
      where: { email, NOT: { id } },
    });
    if (existing) {
      return res.status(400).json({ message: 'Another employee with this email already exists' });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        position,
        department,
        salary: parseFloat(salary),
        status,
      },
    });

    res.json({ message: 'Employee updated successfully', employee });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({ where: { id } });
    res.json({ message: 'Employee record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete employee' });
  }
};

// Helper: Find employee matching logged-in user email or fallback to first employee
const findMatchingEmployee = async (userEmail: string) => {
  let employee = await prisma.employee.findUnique({ where: { email: userEmail } });
  if (!employee) {
    // Try matching by name substring or fallback to first active employee
    employee = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
  }
  return employee;
};

// ---------------- ATTENDANCE ----------------

export const getTodayStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email || '';
    const employee = await findMatchingEmployee(email);
    if (!employee) {
      return res.json({ checkedIn: false, checkInTime: null, checkOutTime: null });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const record = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: startOfDay },
      },
    });

    if (!record) {
      return res.json({ checkedIn: false, checkInTime: null, checkOutTime: null, employeeId: employee.id });
    }

    res.json({
      checkedIn: record.checkOut === null,
      checkInTime: record.checkIn,
      checkOutTime: record.checkOut,
      status: record.status,
      employeeId: employee.id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get attendance status' });
  }
};

export const checkIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email || '';
    const employee = await findMatchingEmployee(email);
    if (!employee) {
      return res.status(404).json({ message: 'No employee record found to associate attendance' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Check if check-in already exists for today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: startOfDay },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    // Determine status (LATE if after 9:00 AM local time)
    const now = new Date();
    const isLate = now.getHours() >= 9 && now.getMinutes() > 0;
    const status = isLate ? 'LATE' : 'PRESENT';

    const record = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: now,
        checkIn: now,
        status,
      },
    });

    res.status(201).json({ message: `Successfully checked in at ${now.toLocaleTimeString()}!`, record });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Check-in failed' });
  }
};

export const checkOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email || '';
    const employee = await findMatchingEmployee(email);
    if (!employee) {
      return res.status(404).json({ message: 'No employee record found' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const record = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: startOfDay },
        checkOut: null,
      },
    });

    if (!record) {
      return res.status(400).json({ message: 'No active check-in found for today' });
    }

    const now = new Date();
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: now },
    });

    res.json({ message: `Successfully checked out at ${now.toLocaleTimeString()}!`, record: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Check-out failed' });
  }
};

export const getAttendanceHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.query;

    let whereClause: any = {};
    if (employeeId) {
      whereClause.employeeId = employeeId as string;
    } else {
      const email = req.user?.email || '';
      const employee = await findMatchingEmployee(email);
      if (employee) {
        whereClause.employeeId = employee.id;
      } else {
        return res.json({ attendance: [] });
      }
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { date: 'desc' },
      take: 50,
    });

    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve attendance history' });
  }
};

// ---------------- PAYROLL ----------------

export const generatePayslip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, bonuses, deductions, notes } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const baseSalary = employee.salary;
    const bonusVal = parseFloat(bonuses) || 0;
    const deductionVal = parseFloat(deductions) || 0;
    const netSalary = baseSalary + bonusVal - deductionVal;

    // Create a mock transaction in the ledger for this payroll expense automatically!
    await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        category: 'Payroll',
        amount: netSalary,
        description: `Salary payout to ${employee.name} for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        date: new Date(),
      },
    });

    res.json({
      payslip: {
        employee: {
          name: employee.name,
          email: employee.email,
          position: employee.position,
          department: employee.department,
        },
        payPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        baseSalary,
        bonuses: bonusVal,
        deductions: deductionVal,
        netSalary,
        notes: notes || 'Thank you for your hard work!',
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate payslip' });
  }
};

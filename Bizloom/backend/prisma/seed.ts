import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with ERP records...');

  // Clean existing data in reverse order of dependencies
  await prisma.transaction.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.stockHistory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Users
  const usersToSeed = [
    { name: 'Farhat Sarwar', email: 'admin@bizloom.com', password: 'Admin123!', role: 'ADMIN' },
    { name: 'Sarah Manager', email: 'manager@bizloom.com', password: 'Manager123!', role: 'MANAGER' },
    { name: 'John Employee', email: 'employee@bizloom.com', password: 'Employee123!', role: 'EMPLOYEE' },
    { name: 'Alice Accountant', email: 'accountant@bizloom.com', password: 'Accountant123!', role: 'ACCOUNTANT' },
  ];

  const seededUsers = [];
  for (const user of usersToSeed) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        isVerified: true,
      },
    });
    seededUsers.push(createdUser);
  }
  console.log(`Seeded ${seededUsers.length} users.`);

  // 2. Seed Products
  const productsData = [
    {
      name: 'Laptop Pro 16',
      sku: 'LP16-001',
      description: 'High performance developer laptop with 32GB RAM, 1TB SSD.',
      price: 1499.00,
      cost: 950.00,
      quantity: 12,
      minStockLevel: 5,
      category: 'Electronics',
    },
    {
      name: 'Wireless Mouse',
      sku: 'WM-202',
      description: 'Ergonomic rechargeable silent wireless mouse.',
      price: 49.99,
      cost: 15.00,
      quantity: 3, // Low stock (min is 5)
      minStockLevel: 5,
      category: 'Accessories',
    },
    {
      name: 'Ergonomic Chair',
      sku: 'EC-500',
      description: 'High-back mesh chair with adjustable lumbar support.',
      price: 299.99,
      cost: 120.00,
      quantity: 0, // Out of stock (min is 3)
      minStockLevel: 3,
      category: 'Furniture',
    },
    {
      name: 'LED Monitor 27',
      sku: 'MON-27A',
      description: '4K IPS office display with USB-C Hub.',
      price: 249.99,
      cost: 140.00,
      quantity: 20,
      minStockLevel: 5,
      category: 'Electronics',
    },
    {
      name: 'Mechanical Keyboard',
      sku: 'KB-RGB',
      description: 'Hot-swappable tactile blue switches with RGB backlight.',
      price: 99.99,
      cost: 45.00,
      quantity: 15,
      minStockLevel: 5,
      category: 'Accessories',
    },
  ];

  const seededProducts = [];
  for (const prod of productsData) {
    const createdProduct = await prisma.product.create({
      data: prod,
    });
    seededProducts.push(createdProduct);
  }
  console.log(`Seeded ${seededProducts.length} products.`);

  // 3. Seed Stock History logs
  // Create historical logs for Laptop Pro 16 to populate a chart
  const laptop = seededProducts[0];
  const historyLogs = [
    { productId: laptop.id, change: 10, type: 'RESTOCK', notes: 'Initial inventory load', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { productId: laptop.id, change: -2, type: 'SALE', notes: 'Order #SO-001', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
    { productId: laptop.id, change: 5, type: 'RESTOCK', notes: 'Supplier shipment', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { productId: laptop.id, change: -1, type: 'SALE', notes: 'Order #SO-002', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  ];

  // Also seed some initial stock logs for other products
  for (const prod of seededProducts.slice(1)) {
    historyLogs.push({
      productId: prod.id,
      change: prod.quantity === 0 ? 5 : prod.quantity,
      type: 'RESTOCK',
      notes: 'Initial restock load',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });
    if (prod.quantity === 0) {
      historyLogs.push({
        productId: prod.id,
        change: -5,
        type: 'ADJUSTMENT',
        notes: 'Inventory write-off (damaged goods)',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
    }
  }

  for (const log of historyLogs) {
    await prisma.stockHistory.create({ data: log });
  }
  console.log('Seeded stock history logs.');

  // 4. Seed Customers
  const customersData = [
    {
      name: 'TechCorp Solutions',
      email: 'info@techcorp.com',
      phone: '+1-555-0199',
      address: '123 Innovation Way, San Jose, CA 95134',
      company: 'TechCorp Solutions',
    },
    {
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1-555-0142',
      address: '456 Industrial Blvd, Chicago, IL 60609',
      company: 'Acme Corporation',
    },
    {
      name: 'Global Traders Ltd',
      email: 'contact@globaltraders.com',
      phone: '+1-555-0118',
      address: '789 Market St, New York, NY 10003',
      company: 'Global Traders Ltd',
    },
  ];

  const seededCustomers = [];
  for (const cust of customersData) {
    const createdCustomer = await prisma.customer.create({
      data: cust,
    });
    seededCustomers.push(createdCustomer);
  }
  console.log(`Seeded ${seededCustomers.length} customers.`);

  // 5. Seed Orders
  const ordersData = [
    {
      orderNumber: 'SO-2026-001',
      customerId: seededCustomers[0].id,
      status: 'PAID',
      subtotal: 3197.97, // (2 * 1499.00) + (2 * 99.99)
      tax: 255.84, // ~8% tax
      total: 3453.81,
      paymentTerms: 'DUE ON RECEIPT',
      items: {
        create: [
          { productId: seededProducts[0].id, quantity: 2, price: 1499.00 }, // Laptop
          { productId: seededProducts[4].id, quantity: 2, price: 99.99 },  // Keyboard
        ],
      },
    },
    {
      orderNumber: 'SO-2026-002',
      customerId: seededCustomers[1].id,
      status: 'PARTIAL',
      subtotal: 799.97, // (1 * 299.99) + (2 * 249.99)
      tax: 64.00,
      total: 863.97,
      paymentTerms: 'NET 30',
      items: {
        create: [
          { productId: seededProducts[2].id, quantity: 1, price: 299.99 }, // Ergonomic chair (price at sale)
          { productId: seededProducts[3].id, quantity: 2, price: 249.99 }, // LED Monitor
        ],
      },
    },
    {
      orderNumber: 'SO-2026-003',
      customerId: seededCustomers[2].id,
      status: 'UNPAID',
      subtotal: 149.97, // (3 * 49.99)
      tax: 12.00,
      total: 161.97,
      paymentTerms: 'NET 15',
      items: {
        create: [
          { productId: seededProducts[1].id, quantity: 3, price: 49.99 }, // Wireless Mouse
        ],
      },
    },
  ];

  for (const ord of ordersData) {
    await prisma.order.create({
      data: ord,
    });
  }
  console.log('Seeded orders and order items.');

  // 6. Seed Suppliers
  const suppliersData = [
    { name: 'ElectroWholesale Inc', email: 'sales@electrowholesale.com', phone: '+1-800-555-0101', company: 'ElectroWholesale Inc', address: '100 Distribution Dr, Dallas, TX 75201' },
    { name: 'Office Depot Logistics', email: 'business@officedepot.com', phone: '+1-800-555-0102', company: 'Office Depot Logistics', address: '200 Supply Chain Rd, Orlando, FL 32801' },
    { name: 'Apex Tech Parts', email: 'orders@apexparts.com', phone: '+1-800-555-0103', company: 'Apex Tech Parts', address: '300 Silicon Way, Austin, TX 78701' },
  ];

  const seededSuppliers = [];
  for (const supplier of suppliersData) {
    const createdSupplier = await prisma.supplier.create({
      data: supplier
    });
    seededSuppliers.push(createdSupplier);
  }
  console.log(`Seeded ${seededSuppliers.length} suppliers.`);

  // 7. Seed Purchase Orders
  const purchaseOrdersData = [
    {
      orderNumber: 'PO-2026-001',
      supplierId: seededSuppliers[0].id,
      status: 'RECEIVED',
      subtotal: 4750.00,
      tax: 380.00,
      total: 5130.00,
      paymentTerms: 'NET 30',
      items: {
        create: [
          { productId: seededProducts[0].id, quantity: 5, unitCost: 950.00 }, // Laptop Pro 16
        ]
      }
    },
    {
      orderNumber: 'PO-2026-002',
      supplierId: seededSuppliers[1].id,
      status: 'PENDING',
      subtotal: 350.00,
      tax: 28.00,
      total: 378.00,
      paymentTerms: 'DUE ON RECEIPT',
      items: {
        create: [
          { productId: seededProducts[2].id, quantity: 2, unitCost: 175.00 }, // Ergonomic Chair
        ]
      }
    }
  ];

  for (const po of purchaseOrdersData) {
    await prisma.purchaseOrder.create({
      data: po
    });
  }
  console.log('Seeded purchase orders.');

  // 8. Seed Employees
  const employeesData = [
    { name: 'John Doe', email: 'john.doe@bizloom.com', phone: '555-0121', position: 'Software Engineer', department: 'Engineering', salary: 7500.00, status: 'ACTIVE', hireDate: new Date('2025-01-15') },
    { name: 'Jane Smith', email: 'jane.smith@bizloom.com', phone: '555-0122', position: 'Product Manager', department: 'Product', salary: 8500.00, status: 'ACTIVE', hireDate: new Date('2024-06-01') },
    { name: 'Robert Johnson', email: 'robert.j@bizloom.com', phone: '555-0123', position: 'Sales Executive', department: 'Sales', salary: 4500.00, status: 'ACTIVE', hireDate: new Date('2025-03-10') },
  ];

  const seededEmployees = [];
  for (const emp of employeesData) {
    const createdEmployee = await prisma.employee.create({
      data: emp
    });
    seededEmployees.push(createdEmployee);
  }
  console.log(`Seeded ${seededEmployees.length} employees.`);

  // 9. Seed Attendance
  const attendanceData = [
    // John Doe's attendance
    { employeeId: seededEmployees[0].id, date: new Date('2026-08-10'), checkIn: new Date('2026-08-10T08:55:00Z'), checkOut: new Date('2026-08-10T17:05:00Z'), status: 'PRESENT' },
    { employeeId: seededEmployees[0].id, date: new Date('2026-08-11'), checkIn: new Date('2026-08-11T09:15:00Z'), checkOut: new Date('2026-08-11T17:30:00Z'), status: 'LATE' },
    { employeeId: seededEmployees[0].id, date: new Date('2026-08-12'), checkIn: new Date('2026-08-12T08:50:00Z'), checkOut: null, status: 'PRESENT' },
    
    // Jane Smith's attendance
    { employeeId: seededEmployees[1].id, date: new Date('2026-08-10'), checkIn: new Date('2026-08-10T08:45:00Z'), checkOut: new Date('2026-08-10T18:00:00Z'), status: 'PRESENT' },
    { employeeId: seededEmployees[1].id, date: new Date('2026-08-11'), checkIn: new Date('2026-08-11T08:50:00Z'), checkOut: new Date('2026-08-11T17:45:00Z'), status: 'PRESENT' },
    { employeeId: seededEmployees[1].id, date: new Date('2026-08-12'), checkIn: new Date('2026-08-12T08:40:00Z'), checkOut: null, status: 'PRESENT' },
  ];

  for (const att of attendanceData) {
    await prisma.attendance.create({
      data: att
    });
  }
  console.log('Seeded employee attendance history.');

  // 10. Seed Finance Transactions
  const transactionsData = [
    // Income
    { type: 'INCOME', category: 'Sales Revenue', amount: 3453.81, description: 'Sales Order SO-2026-001 invoice payment', date: new Date('2026-08-10') },
    { type: 'INCOME', category: 'Consulting', amount: 1500.00, description: 'Consulting services for TechCorp', date: new Date('2026-08-11') },
    
    // Expenses
    { type: 'EXPENSE', category: 'Cost of Goods Sold', amount: 5130.00, description: 'Purchase Order PO-2026-001 payment to ElectroWholesale', date: new Date('2026-08-05') },
    { type: 'EXPENSE', category: 'Rent', amount: 2000.00, description: 'Office rent for August 2026', date: new Date('2026-08-01') },
    { type: 'EXPENSE', category: 'Utilities', amount: 350.00, description: 'Electricity & Internet bills', date: new Date('2026-08-02') },
    { type: 'EXPENSE', category: 'Software Subscriptions', amount: 180.00, description: 'Vercel, GitHub & Slack licenses', date: new Date('2026-08-03') },
  ];

  for (const trans of transactionsData) {
    await prisma.transaction.create({
      data: trans
    });
  }
  console.log(`Seeded ${transactionsData.length} finance transactions.`);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

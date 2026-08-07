"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const getDashboardData = async (req, res) => {
    try {
        // 4 stat cards data
        const stats = {
            totalSales: {
                value: '$124,850.00',
                change: '+12.5%',
                trend: 'up',
                label: 'vs last month'
            },
            inventoryValue: {
                value: '$432,190.00',
                change: '-2.3%',
                trend: 'down',
                label: 'vs last week'
            },
            pendingOrders: {
                value: '42',
                change: '+18.2%',
                trend: 'up',
                label: 'vs yesterday'
            },
            activeEmployees: {
                value: '18',
                change: '0.0%',
                trend: 'neutral',
                label: 'no change'
            }
        };
        // 6-month sales trend data for Recharts Line Chart
        const salesTrend = [
            { month: 'Jan', sales: 12000, orders: 110 },
            { month: 'Feb', sales: 19000, orders: 150 },
            { month: 'Mar', sales: 15000, orders: 130 },
            { month: 'Apr', sales: 27000, orders: 210 },
            { month: 'May', sales: 22000, orders: 180 },
            { month: 'Jun', sales: 34000, orders: 250 },
            { month: 'Jul', sales: 31000, orders: 230 }
        ];
        // Recent activity list
        const activities = [
            {
                id: '1',
                type: 'sale',
                message: 'Invoice #INV-2026-089 paid by TechCorp Solutions',
                amount: '+$4,500.00',
                user: 'Alice Accountant',
                time: '5 minutes ago',
                status: 'success'
            },
            {
                id: '2',
                type: 'order',
                message: 'New purchase request generated for office supplies',
                amount: '-$120.00',
                user: 'John Employee',
                time: '32 minutes ago',
                status: 'pending'
            },
            {
                id: '3',
                type: 'inventory',
                message: 'Stock updated: 50x High-End Laptops received in Warehouse A',
                amount: '50 units',
                user: 'Sarah Manager',
                time: '2 hours ago',
                status: 'success'
            },
            {
                id: '4',
                type: 'auth',
                message: 'Admin settings modified: new tax configuration applied',
                amount: null,
                user: 'Farhat Sarwar (Admin)',
                time: '4 hours ago',
                status: 'warning'
            },
            {
                id: '5',
                type: 'sale',
                message: 'Subscription renewal from client Innovate Ltd',
                amount: '+$1,200.00',
                user: 'System Auto',
                time: '1 day ago',
                status: 'success'
            }
        ];
        // Response includes requested user role to demonstrate personalization
        res.json({
            role: req.user?.role,
            name: req.user?.name,
            stats,
            salesTrend,
            activities
        });
    }
    catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({ message: 'Error retrieving dashboard stats' });
    }
};
exports.getDashboardData = getDashboardData;

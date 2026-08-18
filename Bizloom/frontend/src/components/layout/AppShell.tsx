'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, User } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Package,
  Banknote,
  ScrollText,
  Contact,
  ShoppingCart,
  CheckSquare,
  CalendarDays,
  Receipt,
  Landmark,
  Menu,
  X,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  UserCheck,
  Wallet,
  BarChart3,
  RefreshCw,
  Info,
  HelpCircle,
  Plus,
  Clock,
  Coins,
  AlertTriangle,
  Pin,
  PinOff
} from 'lucide-react';
import AIChatbot from '@/components/dashboard/AIChatbot';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// All 4 valid roles — used for items visible to every authenticated user
const ALL_ROLES: User['role'][] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'];

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badgeKey?: 'sales' | 'inventory' | 'purchases';
  /**
   * Explicit allowlist of roles that can see this item.
   * Every item MUST have this set. Use ALL_ROLES for universal items.
   * This ensures filtering is never accidentally skipped.
   */
  roles: User['role'][];
}

interface SidebarGroup {
  sectionTitle: string;
  items: SidebarItem[];
}

/**
 * ROLE-BASED ACCESS MATRIX
 * ─────────────────────────────────────────────────────────────
 * ADMIN       → ALL items
 * MANAGER     → Dashboard, Calendar, Tasks, Inventory, Sales,
 *               Customers, Suppliers, Purchases, HR, Attendance,
 *               Settings, Help
 * EMPLOYEE    → Dashboard, Calendar, Tasks, Inventory (view),
 *               Sales (create), Attendance (self), Settings, Help
 * ACCOUNTANT  → Dashboard, Calendar, Tasks, Sales, Customers,
 *               Suppliers, Purchases, Finance, Analytics,
 *               Settings, Help
 * ─────────────────────────────────────────────────────────────
 */
const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    sectionTitle: 'MAIN',
    items: [
      { name: 'Dashboard',    href: '/dashboard',          icon: LayoutDashboard, roles: ALL_ROLES },
      { name: 'Calendar',     href: '/dashboard/calendar', icon: CalendarDays,    roles: ALL_ROLES },
      { name: 'Tasks / To-Do',href: '/dashboard/tasks',    icon: CheckSquare,     roles: ALL_ROLES },
    ]
  },
  {
    sectionTitle: 'OPERATIONS',
    items: [
      { name: 'Inventory Control',  href: '/dashboard/inventory', icon: Package,      badgeKey: 'inventory', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
      { name: 'Sales & Invoicing',  href: '/dashboard/sales',     icon: ShoppingCart, badgeKey: 'sales',     roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'] },
      { name: 'Customer Database',  href: '/dashboard/customers', icon: Users,                               roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { name: 'Suppliers',          href: '/dashboard/suppliers', icon: Contact,                             roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { name: 'Purchase Orders',    href: '/dashboard/purchases', icon: Truck,        badgeKey: 'purchases', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ]
  },
  {
    sectionTitle: 'HR',
    items: [
      { name: 'HR Directory', href: '/dashboard/hr',         icon: Users,      roles: ['ADMIN', 'MANAGER'] },
      { name: 'Attendance',   href: '/dashboard/attendance', icon: UserCheck,  roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    ]
  },
  {
    sectionTitle: 'FINANCE',
    items: [
      { name: 'Finance Ledger', href: '/dashboard/finance',   icon: Wallet,   roles: ['ADMIN', 'ACCOUNTANT'] },
      { name: 'Analytics',      href: '/dashboard/analytics', icon: BarChart3, roles: ['ADMIN', 'ACCOUNTANT'] },
    ]
  },
  {
    sectionTitle: 'SYSTEM',
    items: [
      { name: 'System Logs',     href: '/dashboard/logs',      icon: ScrollText, roles: ['ADMIN'] },
      { name: 'User Management', href: '/dashboard/users',     icon: ShieldCheck, roles: ['ADMIN'] },
      { name: 'Settings',        href: '/dashboard/settings',  icon: Settings,    roles: ALL_ROLES },
      { name: 'Help & Support',  href: '/dashboard/help',      icon: HelpCircle,  roles: ALL_ROLES },
    ]
  }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<any>({ products: [], customers: [], orders: [], suppliers: [], employees: [] });
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = React.useRef<any>(null);

  // Selected option index for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Onboarding Tour states
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourStyle, setTourStyle] = useState<React.CSSProperties>({});

  const triggerSearch = (query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    const trimmed = query.trim();
    if (!trimmed) {
      setGlobalResults({ products: [], customers: [], orders: [], suppliers: [], employees: [] });
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/search/global', { params: { q: trimmed } });
        setGlobalResults(response.data);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Close search on escape key or Dialog state change
  useEffect(() => {
    if (!isSearchOpen) {
      setGlobalQuery('');
      setGlobalResults({ products: [], customers: [], orders: [], suppliers: [], employees: [] });
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Command palette options list
  const getFocusableItems = () => {
    const items: any[] = [
      { type: 'action', label: 'Add Product', actionName: 'add-product', category: 'Quick Action', subLabel: '' },
      { type: 'action', label: 'New Sale', actionName: 'new-sale', category: 'Quick Action', subLabel: '' },
      { type: 'action', label: 'Add Employee', actionName: 'add-employee', category: 'Quick Action', subLabel: '' },
      { type: 'action', label: 'View Reports', url: '/dashboard/analytics', category: 'Quick Action', subLabel: '' },
    ];

    if (globalQuery) {
      globalResults.products?.forEach((p: any) => {
        items.push({ type: 'product', label: p.name, subLabel: p.sku, url: `/dashboard/inventory?search=${p.sku}`, category: 'Products' });
      });
      globalResults.customers?.forEach((c: any) => {
        items.push({ type: 'customer', label: c.name, subLabel: c.email, url: `/dashboard/customers?search=${c.email}`, category: 'Customers' });
      });
      globalResults.orders?.forEach((o: any) => {
        items.push({ type: 'order', label: o.orderNumber, subLabel: `$${o.total.toFixed(2)}`, url: `/dashboard/sales?search=${o.orderNumber}`, category: 'Sales Invoices' });
      });
      globalResults.suppliers?.forEach((s: any) => {
        items.push({ type: 'supplier', label: s.name, subLabel: s.email, url: `/dashboard/suppliers?search=${s.email}`, category: 'Suppliers' });
      });
      globalResults.employees?.forEach((e: any) => {
        items.push({ type: 'employee', label: e.name, subLabel: `${e.position} (${e.department})`, url: `/dashboard/hr/${e.id}`, category: 'Employees' });
      });
    }
    return items;
  };

  const focusableItems = getFocusableItems();

  useEffect(() => {
    setSelectedIndex(0);
  }, [globalQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % focusableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + focusableItems.length) % focusableItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusableItems[selectedIndex]) {
        handleItemSelect(focusableItems[selectedIndex]);
      }
    }
  };

  const handleItemSelect = (item: any) => {
    setIsSearchOpen(false);
    if (item.type === 'action') {
      if (item.actionName === 'add-product') {
        router.push('/dashboard/inventory?openDrawer=true');
      } else if (item.actionName === 'new-sale') {
        router.push('/dashboard/sales?openDrawer=true');
      } else if (item.actionName === 'add-employee') {
        router.push('/dashboard/hr?openDrawer=true');
      } else if (item.url) {
        router.push(item.url);
      }
    } else if (item.url) {
      router.push(item.url);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsShortcutsOpen(false);
      }
      if (e.key === '?') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true'
        );
        if (!isInput) {
          e.preventDefault();
          setIsShortcutsOpen(true);
        }
      }
      if (e.key === '/') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true'
        );
        if (!isInput) {
          e.preventDefault();
          const searchInput = document.querySelector('input[placeholder*="Filter this table"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      }
      if (e.key.toLowerCase() === 'n') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true'
        );
        if (!isInput) {
          e.preventDefault();
          if (pathname === '/dashboard/inventory') {
            router.push('/dashboard/inventory?openDrawer=true');
          } else if (pathname === '/dashboard/sales') {
            router.push('/dashboard/sales?openDrawer=true');
          } else if (pathname === '/dashboard/hr') {
            router.push('/dashboard/hr?openDrawer=true');
          } else if (pathname === '/dashboard/finance') {
            router.push('/dashboard/finance?openDrawer=true&type=EXPENSE');
          } else if (pathname === '/dashboard/suppliers') {
            router.push('/dashboard/suppliers?openDrawer=true');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname]);

  // Onboarding guided tour steps
  const tourSteps = [
    {
      targetId: 'tour-sidebar',
      title: 'Navigation Sidebar',
      content: 'Access all business modules here, including Inventory, Sales, HR, Purchases, and Finance.',
      placement: 'right'
    },
    {
      targetId: 'tour-search',
      title: 'Global Search & Command Palette',
      content: 'Query products, sales invoices, customer accounts, and suppliers instantly across the ERP, or trigger drawers.',
      placement: 'bottom'
    },
    {
      targetId: 'tour-notifications',
      title: 'Real-time Alerts',
      content: 'Stay informed on low stock, payment reminders, new orders, and system updates.',
      placement: 'bottom'
    },
    {
      targetId: 'tour-stats',
      title: 'Dashboard Metrics',
      content: 'Review quick aggregates of sales, inventory value, pending orders, and active staff.',
      placement: 'bottom'
    },
    {
      targetId: 'tour-chatbot',
      title: 'AI Agent Assistant',
      content: 'Ask natural language questions about your business and get instant data insights.',
      placement: 'left'
    }
  ];

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('bizloom_tour_completed');
    if (!hasCompletedTour && user && pathname === '/dashboard') {
      const timer = setTimeout(() => {
        setTourStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, pathname]);

  useEffect(() => {
    if (tourStep === null) return;
    const step = tourSteps[tourStep];
    const timer = setTimeout(() => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        let top = rect.top + window.scrollY;
        let left = rect.left + window.scrollX;
        
        if (step.placement === 'right') {
          left = rect.right + 12;
          top = rect.top + rect.height / 2 - 80;
        } else if (step.placement === 'bottom') {
          top = rect.bottom + 12;
          left = rect.left + rect.width / 2 - 140;
        } else if (step.placement === 'left') {
          left = rect.left - 300;
          top = rect.top + rect.height / 2 - 80;
        } else if (step.placement === 'top') {
          top = rect.top - 180;
          left = rect.left + rect.width / 2 - 140;
        }
        
        setTourStyle({
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTourStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [tourStep]);
  
  // Categorized notification lists
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'low_stock', title: 'Low Stock Alert', message: 'Mechanical Keyboard (SKU-KB90) is low (2 left).', time: '2h ago', unread: true, url: '/dashboard/inventory?search=SKU-KB90' },
    { id: '2', type: 'payment_due', title: 'Payment Overdue', message: 'Invoice #ORD-2026-102 payment is overdue.', time: '5h ago', unread: true, url: '/dashboard/sales?search=ORD-2026-102' },
    { id: '3', type: 'new_order', title: 'New Sale Received', message: 'Order #ORD-2026-103 created for $850.00.', time: '1d ago', unread: false, url: '/dashboard/sales?search=ORD-2026-103' },
    { id: '4', type: 'system_update', title: 'System Migration Sync', message: 'Prisma schema and SQLite dev.db sync success.', time: '2d ago', unread: false, url: '/dashboard/logs' },
  ]);

  // Pinned items & live badges state
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([]);
  const [badgeCounts, setBadgeCounts] = useState<{ sales: number; inventory: number; purchases: number }>({
    sales: 0,
    inventory: 0,
    purchases: 0,
  });

  useEffect(() => {
    try {
      const storedPins = localStorage.getItem('bizloom_pinned_hrefs');
      if (storedPins) setPinnedHrefs(JSON.parse(storedPins));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await api.get('/dashboard/widgets');
        const d = res.data;
        setBadgeCounts({
          sales: d.upcomingPayments?.length || 0,
          inventory: d.lowStockPriority?.length || 0,
          purchases: d.greetingSummary ? 1 : 0,
        });
      } catch (err) {
        // quiet error handle
      }
    };
    if (user) fetchBadges();
  }, [user, pathname]);

  const togglePin = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (pinnedHrefs.includes(href)) {
      updated = pinnedHrefs.filter(h => h !== href);
      toast.success('Removed from Favorites');
    } else {
      updated = [...pinnedHrefs, href];
      toast.success('Pinned to Favorites!');
    }
    setPinnedHrefs(updated);
    try {
      localStorage.setItem('bizloom_pinned_hrefs', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Returns true if the current user's role is in the item's explicit roles allowlist.
   * Logs the role in development so it can be observed in DevTools > Console.
   */
  const isRoleAllowed = (item: SidebarItem): boolean => {
    if (!user) return false;
    return item.roles.includes(user.role as User['role']);
  };

  // DEV: log role on first render so it's visible in browser DevTools console
  React.useEffect(() => {
    if (user) {
      console.log(`[AppShell] Sidebar rendering for role="${user.role}" email="${user.email}"`);
      const allowed = SIDEBAR_GROUPS.flatMap(g => g.items).filter(isRoleAllowed).map(i => i.name);
      console.log(`[AppShell] Visible items (${allowed.length}):`, allowed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Find all pinned items allowed for current user
  const allItemsFlat = SIDEBAR_GROUPS.flatMap(g => g.items);
  const pinnedItems = allItemsFlat.filter(item => pinnedHrefs.includes(item.href) && isRoleAllowed(item));

  const renderNavItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = item.href === '/dashboard' 
      ? pathname === item.href 
      : pathname.startsWith(item.href);
    const isPinned = pinnedHrefs.includes(item.href);
    const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

    return (
      <div key={item.href} className="relative group w-full">
        <Link
          href={item.href}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
            sidebarCollapsed ? 'pr-3' : 'pr-9'
          } ${
            isActive
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 dark:bg-indigo-500'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title={sidebarCollapsed ? item.name : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-105 duration-150 ${
                isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
              }`} />
              {/* Collapsed Badge Dot */}
              {sidebarCollapsed && badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-neutral-900" />
              )}
            </div>
            {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
          </div>

          {!sidebarCollapsed && badgeCount > 0 && (
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              isActive ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
            }`}>
              {badgeCount}
            </span>
          )}
        </Link>

        {/* Pin Toggle Button (Absolute Sibling to avoid nested interactive elements and click hijacking) */}
        {!sidebarCollapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePin(item.href, e);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:bg-black/10 dark:hover:bg-white/10 z-10 ${
              isPinned ? 'opacity-100 text-amber-400 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 text-neutral-400 pointer-events-none group-hover:pointer-events-auto'
            }`}
            title={isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
          >
            <Pin className={`h-3 w-3 ${isPinned ? 'fill-amber-400' : ''}`} />
          </button>
        )}
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('All marked as read');
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(x => x);
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Bizloom
        </Link>
        {segments.map((segment, idx) => {
          const path = `/${segments.slice(0, idx + 1).join('/')}`;
          const isLast = idx === segments.length - 1;
          const displaySegment = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');

          return (
            <React.Fragment key={path}>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              {isLast ? (
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{displaySegment}</span>
              ) : (
                <Link href={path} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {displaySegment}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-neutral-950 font-sans transition-colors duration-200">
      
      {/* 1. Desktop Sidebar */}
      <aside 
        id="tour-sidebar"
        className={`hidden md:flex flex-col border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/90 transition-all duration-300 shrink-0 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200/50 dark:border-neutral-800/50 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-600/10">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                Bizloom
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
          </Button>
        </div>

        {/* Sidebar Grouped Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {/* FAVORITES / PINNED SECTION */}
          {pinnedItems.length > 0 && (
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2 pb-1 text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <Pin className="h-3 w-3 fill-amber-400" /> Favorites
                </div>
              )}
              {pinnedItems.map(renderNavItem)}
              <div className="my-2 border-b border-neutral-100 dark:border-neutral-800/60" />
            </div>
          )}

          {/* GROUPED SECTIONS */}
          {SIDEBAR_GROUPS.map((group) => {
            const allowedItems = group.items.filter(isRoleAllowed);
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.sectionTitle} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-2 pb-1 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    {group.sectionTitle}
                  </div>
                )}
                {allowedItems.map(renderNavItem)}
              </div>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        {user && !sidebarCollapsed && (
          <div className="p-3.5 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-neutral-200 dark:border-neutral-800">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-neutral-800 dark:text-indigo-400 font-bold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{user.name}</p>
                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded px-1 py-0.5 inline-block capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 2. Mobile Navigation Overlay (Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-neutral-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-neutral-900 p-4 border-r border-neutral-200 dark:border-neutral-800 flex flex-col space-y-4 animate-in slide-in-from-left duration-200 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-md">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-extrabold tracking-tight dark:text-white">Bizloom</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 text-neutral-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1 space-y-4 pt-2">
              {SIDEBAR_GROUPS.map((group) => {
                const allowedItems = group.items.filter(isRoleAllowed);
                if (allowedItems.length === 0) return null;

                return (
                  <div key={group.sectionTitle} className="space-y-1">
                    <div className="px-2 pb-1 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      {group.sectionTitle}
                    </div>
                    {allowedItems.map(renderNavItem)}
                  </div>
                );
              })}
            </nav>

            {user && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-9 w-9 border border-neutral-200 dark:border-neutral-800">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-neutral-800 dark:text-indigo-400 font-bold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{user.name}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9 text-neutral-500 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              <Menu className="h-5.5 w-5.5" />
            </Button>

            {/* Interactive Search Bar Trigger */}
            <div className="relative hidden sm:block w-64 md:w-80 cursor-pointer" id="tour-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search across Bizloom..."
                readOnly
                onClick={() => setIsSearchOpen(true)}
                className="w-full h-9.5 pl-9.5 pr-14 rounded-xl border border-neutral-200 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-200 transition-all text-xs font-semibold focus-visible:outline-none cursor-pointer hover:bg-slate-100/70 dark:hover:bg-neutral-900/40"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-neutral-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded-lg border border-neutral-200/20 shadow-2xs pointer-events-none">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Search icon for mobile screen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="h-9.5 w-9.5 sm:hidden rounded-xl text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              <Search className="h-4.5 w-4.5" />
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9.5 w-9.5 rounded-xl text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>

            {/* Keyboard Shortcuts Help */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsShortcutsOpen(true)}
              className="h-9.5 w-9.5 rounded-xl text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              title="Keyboard Shortcuts Guide (?)"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    id="tour-notifications"
                    variant="ghost"
                    size="icon"
                    className="h-9.5 w-9.5 rounded-xl text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 relative transition-colors"
                  />
                }
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-indigo-650 dark:bg-indigo-500 animate-pulse" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl border-neutral-200 dark:border-neutral-800 p-2 shadow-xl bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400">
                      Mark all read
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                <div className="max-h-60 overflow-y-auto space-y-1.5 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
                          router.push(item.url);
                        }}
                        className={`flex gap-3 p-2.5 rounded-xl text-xs transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 relative group cursor-pointer ${
                          item.unread ? 'bg-indigo-50/10 dark:bg-indigo-950/10' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {item.type === 'low_stock' && <AlertTriangle className="h-4 w-4.5 text-rose-500 animate-bounce" />}
                          {item.type === 'payment_due' && <Clock className="h-4.5 w-4.5 text-amber-500" />}
                          {item.type === 'new_order' && <ShoppingCart className="h-4.5 w-4.5 text-emerald-500" />}
                          {item.type === 'system_update' && <Settings className="h-4.5 w-4.5 text-neutral-400" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex justify-between items-baseline font-bold text-neutral-800 dark:text-neutral-200">
                            <span className={item.unread ? 'text-indigo-600 dark:text-indigo-400' : ''}>{item.title}</span>
                            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium ml-2">{item.time}</span>
                          </div>
                          <p className="text-neutral-500 dark:text-neutral-405 leading-normal text-[10px] font-medium mt-0.5">{item.message}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(item.id);
                          }}
                          className="absolute right-2 top-2 h-4 w-4 rounded-md flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="h-9.5 flex items-center gap-2 pl-2 pr-1 sm:pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800" />
                  }
                >
                  <Avatar className="h-7 w-7 border border-neutral-200 dark:border-neutral-800">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-neutral-800 dark:text-indigo-400 font-bold text-xs">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {user.name.split(' ')[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-neutral-200 dark:border-neutral-800 p-1.5 shadow-xl bg-white dark:bg-neutral-900">
                  <DropdownMenuLabel className="px-2.5 py-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{user.email}</p>
                      {user.lastLogin && (
                        <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1">
                          Last login: {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                  <DropdownMenuItem className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer flex items-center gap-2 text-neutral-700 dark:text-neutral-300 focus:bg-slate-50 dark:focus:bg-neutral-800 focus:text-neutral-950 dark:focus:text-white">
                    <UserIcon className="h-4 w-4 text-neutral-400" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer flex items-center gap-2 text-neutral-700 dark:text-neutral-300 focus:bg-slate-50 dark:focus:bg-neutral-800 focus:text-neutral-950 dark:focus:text-white">
                    <Settings className="h-4 w-4 text-neutral-400" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer flex items-center gap-2 text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600 dark:focus:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </header>

        {/* Dynamic Breadcrumbs Area */}
        <div className="h-10 shrink-0 flex items-center px-4 sm:px-6 bg-slate-50 dark:bg-neutral-950 border-b border-neutral-200/30 dark:border-neutral-800/10">
          {getBreadcrumbs()}
        </div>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-neutral-950/50">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
        <AIChatbot />
      </div>

      {/* ── Global Command Palette ── */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Global Search & Command Palette</DialogTitle>
          </DialogHeader>
          {/* Header search input with keyboard navigation handler */}
          <div className="p-4 border-b border-neutral-150 dark:border-neutral-800 flex items-center gap-3">
            <Search className="h-5 w-5 text-neutral-400 dark:text-neutral-500 shrink-0" />
            <input
              type="text"
              placeholder="Search or type a command..."
              value={globalQuery}
              autoFocus
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                triggerSearch(e.target.value);
              }}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-450 font-bold focus:ring-0 focus:outline-none"
            />
            <kbd className="hidden sm:inline-block text-[10px] font-black text-neutral-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200/20">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
            
            {/* Quick Actions — filtered by current user role */}
            <div className="space-y-0.5">
              <div className="px-3 text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Quick Actions</div>
              {[
                { label: 'New Sale', icon: ShoppingCart, actionName: 'new-sale', url: '/dashboard/sales?action=new', color: 'text-emerald-500', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'] },
                { label: 'New Product', icon: Package, actionName: 'add-product', url: '/dashboard/inventory?action=new', color: 'text-indigo-500', roles: ['ADMIN', 'MANAGER'] },
                { label: 'New Employee', icon: UserCheck, actionName: 'add-employee', url: '/dashboard/hr?action=new', color: 'text-sky-500', roles: ['ADMIN', 'MANAGER'] },
                { label: 'View Reports', icon: BarChart3, url: '/dashboard/analytics', color: 'text-violet-500', roles: ['ADMIN', 'ACCOUNTANT'] },
              ].filter(action => user?.role && action.roles.includes(user.role)).map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => handleItemSelect(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                    selectedIndex === idx && !globalQuery
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  {item.label}
                </button>
              ))}
            </div>

            {searching ? (
              <div className="flex items-center justify-center py-8 gap-2 text-xs font-bold text-neutral-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Searching database...
              </div>
            ) : !globalQuery ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">Type to search products, customers, invoices, suppliers, or employees...</p>
              </div>
            ) : Object.values(globalResults).every((arr: any) => arr.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Info className="h-7 w-7 text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs font-bold text-neutral-500">No results found</p>
                <p className="text-[10px] text-neutral-400">No records matched your query. Try another term.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Products */}
                {globalResults.products?.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-3 text-[9px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Products</span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-full">{globalResults.products.length}</span>
                    </div>
                    {globalResults.products.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/inventory?search=${p.sku}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-neutral-400 bg-slate-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded-md">{p.sku}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Customers */}
                {globalResults.customers?.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-3 text-[9px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Customers</span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-full">{globalResults.customers.length}</span>
                    </div>
                    {globalResults.customers.map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/dashboard/customers?search=${c.email}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{c.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-semibold">{c.company || c.email}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {globalResults.orders?.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-3 text-[9px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Sales Invoices</span>
                      <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full">{globalResults.orders.length}</span>
                    </div>
                    {globalResults.orders.map((o: any) => (
                      <Link
                        key={o.id}
                        href={`/dashboard/sales?search=${o.orderNumber}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{o.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-neutral-400">{o.customer?.name}</span>
                          <span className="text-xs font-black text-neutral-800 dark:text-white">${o.total.toFixed(2)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Suppliers */}
                {globalResults.suppliers?.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-3 text-[9px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Suppliers</span>
                      <span className="bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 px-1.5 py-0.2 rounded-full">{globalResults.suppliers.length}</span>
                    </div>
                    {globalResults.suppliers.map((s: any) => (
                      <Link
                        key={s.id}
                        href={`/dashboard/suppliers?search=${s.email}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Contact className="h-4 w-4 text-sky-500 shrink-0" />
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{s.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-semibold">{s.company || s.email}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Employees */}
                {globalResults.employees?.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-3 text-[9px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Employees</span>
                      <span className="bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 px-1.5 py-0.2 rounded-full">{globalResults.employees.length}</span>
                    </div>
                    {globalResults.employees.map((e: any) => (
                      <Link
                        key={e.id}
                        href={`/dashboard/hr/${e.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{e.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-semibold">{e.position} · {e.department}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Keyboard Shortcuts Modal ── */}
      <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-neutral-900 dark:text-white">Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { keys: ['Ctrl', 'K'], action: 'Open Command Palette' },
              { keys: ['N'], action: 'Add New Record (on active page)' },
              { keys: ['/'], action: 'Focus Table Filter Search' },
              { keys: ['?'], action: 'Open Keyboard Shortcuts Guide' },
              { keys: ['Esc'], action: 'Close Drawers / Dialogs' },
              { keys: ['↑', '↓'], action: 'Navigate Command Palette' },
              { keys: ['Enter'], action: 'Select Highlighted Item' },
            ].map(({ keys, action }) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{action}</span>
                <div className="flex items-center gap-1">
                  {keys.map(k => (
                    <kbd key={k} className="px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-[10px] font-black text-neutral-700 dark:text-neutral-300 shadow-sm">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Quick Actions Floating Button (bottom-left) ── */}
      <div className="fixed bottom-6 left-6 z-40 print:hidden">
        <div className={`flex flex-col-reverse gap-2 items-start transition-all duration-300 ${isQuickActionsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {[
            { label: 'New Product', icon: Package, color: 'bg-indigo-600 hover:bg-indigo-500', path: '/dashboard/inventory?openDrawer=true' },
            { label: 'New Sale', icon: ShoppingCart, color: 'bg-emerald-600 hover:bg-emerald-500', path: '/dashboard/sales?openDrawer=true' },
            { label: 'New Employee', icon: UserCheck, color: 'bg-sky-600 hover:bg-sky-500', path: '/dashboard/hr?openDrawer=true' },
            { label: 'New Expense', icon: Wallet, color: 'bg-amber-600 hover:bg-amber-500', path: '/dashboard/finance?openDrawer=true&type=EXPENSE' },
          ].map(({ label, icon: Icon, color, path }) => (
            <button
              key={label}
              onClick={() => {
                setIsQuickActionsOpen(false);
                router.push(path);
              }}
              className={`${color} text-white flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all hover:scale-105 active:scale-95`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsQuickActionsOpen(prev => !prev)}
          className={`h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 border border-indigo-500/20 ${isQuickActionsOpen ? 'rotate-45' : ''}`}
          title="Quick Actions"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* ── Onboarding Tour Overlay ── */}
      {tourStep !== null && (
        <>
          {/* Dimming backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
            onClick={() => {
              localStorage.setItem('bizloom_tour_completed', 'true');
              setTourStep(null);
            }}
          />
          {/* Tour tooltip */}
          <div
            className="z-[70] w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-4"
            style={tourStyle}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Step {tourStep + 1} of {tourSteps.length}</div>
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">{tourSteps[tourStep]?.title}</h4>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('bizloom_tour_completed', 'true');
                  setTourStep(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">{tourSteps[tourStep]?.content}</p>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => {
                  localStorage.setItem('bizloom_tour_completed', 'true');
                  setTourStep(null);
                }}
                className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
              >
                Skip tour
              </button>
              <button
                onClick={() => {
                  if (tourStep < tourSteps.length - 1) {
                    setTourStep(tourStep + 1);
                  } else {
                    localStorage.setItem('bizloom_tour_completed', 'true');
                    setTourStep(null);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {tourStep < tourSteps.length - 1 ? 'Next →' : 'Finish 🎉'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

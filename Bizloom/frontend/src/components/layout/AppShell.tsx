'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ShieldCheck
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
}

const roleMenuMapping: Record<User['role'], MenuItem[]> = {
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/dashboard/users', icon: Users },
    { name: 'Inventory Control', href: '/dashboard/inventory', icon: Package },
    { name: 'Financial Auditing', href: '/dashboard/finance', icon: Banknote },
    { name: 'System Logs', href: '/dashboard/logs', icon: ScrollText },
  ],
  MANAGER: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory Status', href: '/dashboard/inventory', icon: Package },
    { name: 'Employee Staff', href: '/dashboard/employees', icon: Contact },
    { name: 'Pending Orders', href: '/dashboard/orders', icon: ShoppingCart },
  ],
  EMPLOYEE: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Work Schedule', href: '/dashboard/schedule', icon: CalendarDays },
  ],
  ACCOUNTANT: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Financial Ledger', href: '/dashboard/finance', icon: Banknote },
    { name: 'Client Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Payroll Sheet', href: '/dashboard/payroll', icon: Landmark },
  ]
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock notifications list
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Low Stock Alert', message: 'Warehouse A is low on high-end laptops.', time: '10m ago', unread: true },
    { id: '2', title: 'Invoice Paid', message: 'TechCorp paid Invoice #INV-2026-089.', time: '1h ago', unread: true },
    { id: '3', title: 'Schedule Updated', message: 'New shift assignment has been posted.', time: '4h ago', unread: false },
  ]);

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
  const menuItems = user ? roleMenuMapping[user.role] : [];

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle Breadcrumbs
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
        className={`hidden md:flex flex-col border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/90 transition-all duration-300 shrink-0 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
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

        {/* Sidebar Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 dark:bg-indigo-500'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 duration-150 ${
                  isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                }`} />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        {user && !sidebarCollapsed && (
          <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30">
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
            className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-neutral-900 p-4 border-r border-neutral-200 dark:border-neutral-800 flex flex-col space-y-4 animate-in slide-in-from-left duration-200"
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
            
            <nav className="flex-1 space-y-1 pt-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
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

            {/* Interactive Search Bar */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search resources, invoices, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9.5 pl-9.5 pr-4 rounded-xl border border-neutral-200 bg-slate-50/50 focus:bg-white text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-transparent dark:border-neutral-800 dark:bg-neutral-950/40 dark:focus:bg-neutral-950 dark:text-neutral-200 transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Search icon for mobile screen */}
            <Button variant="ghost" size="icon" className="h-9.5 w-9.5 sm:hidden rounded-xl text-neutral-500">
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

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9.5 w-9.5 rounded-xl text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 relative transition-colors"
                  />
                }
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-500 animate-pulse" />
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
                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-0.5 p-2 rounded-xl text-xs transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 relative group ${
                          item.unread ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                        }`}
                      >
                        <div className="flex justify-between font-semibold pr-4 text-neutral-800 dark:text-neutral-200">
                          <span className={item.unread ? 'text-indigo-600 dark:text-indigo-400' : ''}>{item.title}</span>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">{item.time}</span>
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 leading-normal">{item.message}</p>
                        <button
                          onClick={() => clearNotification(item.id)}
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

      </div>

    </div>
  );
}

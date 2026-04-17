import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, Settings, FileText, TrendingUp, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Daily Entries', href: '/entries', icon: BookOpen },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Weekly Reports', href: '/weekly', icon: Calendar },
    { name: 'Monthly Reports', href: '/monthly', icon: Calendar },
    { name: 'Export', href: '/export', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 h-16 shrink-0">
        <div className="text-2xl font-extrabold text-primary flex items-center gap-2">
          Narrative<span className="text-foreground">Sync</span>
        </div>
        <nav className="flex space-x-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-gray-100'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 bg-card px-4 py-1.5 rounded-full border border-border">
            <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
            <span className="font-medium text-sm text-foreground">Student</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <main className="max-w-5xl mx-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

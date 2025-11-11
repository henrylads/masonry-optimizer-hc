'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ClaritiLogo } from '@/components/clariti-logo';

const navigationItems = [
  {
    name: 'Support Designer',
    href: '/',
  },
  {
    name: 'Density Calculator',
    href: '/density-calculator',
  },
  {
    name: 'Run Layout',
    href: '/run-layout',
  },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container">
        {/* Logo Section */}
        <div className="flex justify-center py-6">
          <ClaritiLogo />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-6 py-3 text-sm font-medium transition-all rounded-t-lg',
                pathname === item.href
                  ? 'bg-background text-foreground shadow-sm border-t border-x'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

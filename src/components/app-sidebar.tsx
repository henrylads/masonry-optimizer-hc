'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ChevronLeft, ChevronRight, BookOpen, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active?: (pathname: string) => boolean
}

const navigationItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Projects',
    href: '/dashboard',
    active: (pathname) => pathname.startsWith('/dashboard') || pathname.startsWith('/project'),
  },
  {
    icon: BookOpen,
    label: 'Knowledge Base',
    href: '/knowledge-base',
    active: (pathname) => pathname.startsWith('/knowledge-base'),
  },
  {
    icon: Settings,
    label: 'Company Settings',
    href: '/settings',
    active: (pathname) => pathname.startsWith('/settings'),
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  // Default state is expanded (false = not collapsed)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage, defaulting to expanded
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    // Only collapse if explicitly saved as 'true', otherwise stay expanded
    if (savedState === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  return (
    <div
      className={cn(
        'bg-muted/30 border-r flex flex-col py-4 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Navigation items */}
      <div className={cn('flex flex-col gap-1', isCollapsed ? 'items-center px-2' : 'px-3')}>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = item.active ? item.active(pathname) : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Collapse/Expand button */}
      <div className={cn('mt-auto', isCollapsed ? 'px-2' : 'px-3')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={cn(
            'w-full transition-all',
            isCollapsed ? 'px-0 justify-center' : 'justify-start'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { ClaritiLogo } from '@/components/clariti-logo'

interface AuthHeaderProps {
  rightActions?: React.ReactNode
  leftContent?: React.ReactNode
}

export function AuthHeader({ rightActions, leftContent }: AuthHeaderProps = {}) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="w-full border-b bg-white z-50">
      <div className="h-16 flex items-center justify-between px-6 gap-4">
        {/* Left side: Logo and/or breadcrumb content */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          {/* Clariti Logo - always visible */}
          <Link href="/dashboard" className="flex-shrink-0">
            <ClaritiLogo />
          </Link>

          {/* Optional breadcrumb or other left content */}
          {leftContent && (
            <div className="flex items-center gap-2 min-w-0">
              {leftContent}
            </div>
          )}
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightActions}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
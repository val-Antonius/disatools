'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  BarChart3,
  FileText,
  Calendar,
  Settings
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/analytics',
    icon: LayoutDashboard
  },
  {
    name: 'Tools & Materials',
    href: '/tools-materials',
    icon: Package
  },
  {
    name: 'Aktivitas',
    href: '/activities',
    icon: ArrowRightLeft
  },
  {
    name: 'Reporting',
    href: '/reports',
    icon: FileText
  },
  {
    name: 'Kalender',
    href: '/calendar',
    icon: Calendar
  }
]

const Sidebar: React.FC = () => {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 z-40">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-white/80 backdrop-blur-md border-r border-white/20 shadow-lg" />

      <div className="relative flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DisaTools</h1>
              <p className="text-xs text-gray-500">Inventory Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isActive
                    ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:text-white hover:shadow-lg'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/60 hover:shadow-sm active:bg-white/80'
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors duration-200",
                  isActive ? "text-white" : "text-gray-500"
                )} />
                <span className="transition-colors duration-200">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center px-4 py-2 text-sm text-gray-500">
            <Settings className="mr-2 h-4 w-4" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

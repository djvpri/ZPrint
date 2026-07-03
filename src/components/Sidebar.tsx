'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

const menuItems = [
  { href: '/', label: 'Dashboard', icon: 'bi-speedometer2' },
  { href: '/orders', label: 'Pesanan', icon: 'bi-cart-check' },
  { href: '/produk', label: 'Produk', icon: 'bi-box-seam' },
  { href: '/pelanggan', label: 'Pelanggan', icon: 'bi-people' },
  { href: '/laporan', label: 'Laporan', icon: 'bi-bar-chart-line' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="bi bi-printer-fill text-white text-sm"></i>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">ZPrint</h1>
                <p className="text-xs text-gray-500 truncate">POS Percetakan</p>
              </div>
              <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-gray-600">
                <i className="bi bi-chevron-left"></i>
              </button>
            </>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-gray-600 ml-auto">
              <i className="bi bi-chevron-right"></i>
            </button>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <i className={`bi ${item.icon} text-lg ${isActive ? 'text-blue-600' : ''}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-gray-200">
        {session?.user ? (
          <div className="space-y-2">
            {!collapsed && (
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || session.user.email}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.role}</p>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <i className="bi bi-box-arrow-right text-lg"></i>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { href: '/orders', label: 'Pesanan', icon: 'bi-cart-check' },
  { href: '/produk', label: 'Produk', icon: 'bi-box-seam' },
  { href: '/pelanggan', label: 'Pelanggan', icon: 'bi-people' },
  { href: '/laporan', label: 'Laporan', icon: 'bi-bar-chart-line' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const navContent = (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="bi bi-printer-fill text-white text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">ZPrint</h1>
            <p className="text-xs text-gray-500">POS Percetakan</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <i className={`bi ${item.icon} text-lg ${isActive(item.href) ? 'text-blue-600' : ''}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        {session?.user && (
          <div className="space-y-2">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || session.user.email}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.role}</p>
              {session.user.tenantPlan && (
                <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                  session.user.tenantPlan === 'elite' ? 'bg-purple-100 text-purple-700' :
                  session.user.tenantPlan === 'pro' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {session.user.tenantPlan.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <i className="bi bi-box-arrow-right text-lg"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <i className="bi bi-list text-xl"></i>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="bi bi-printer-fill text-white text-xs"></i>
          </div>
          <span className="font-bold text-gray-900">ZPrint</span>
        </div>
        {session?.user?.tenantPlan && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            session.user.tenantPlan === 'elite' ? 'bg-purple-100 text-purple-700' :
            session.user.tenantPlan === 'pro' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {session.user.tenantPlan.toUpperCase()}
          </span>
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="bi bi-printer-fill text-white text-sm"></i>
            </div>
            <span className="font-bold text-gray-900">ZPrint</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <i className={`bi ${item.icon} text-xl ${isActive(item.href) ? 'text-blue-600' : ''}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          {session?.user && (
            <>
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || session.user.email}</p>
                <p className="text-xs text-gray-500">{session.user.role}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <i className="bi bi-box-arrow-right text-lg"></i>
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-gray-200 flex-col min-h-screen flex-shrink-0">
        {navContent}
      </aside>
    </>
  )
}

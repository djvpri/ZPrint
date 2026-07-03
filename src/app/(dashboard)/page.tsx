'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Silakan login terlebih dahulu')
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Memuat...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pesanan</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <i className="bi bi-cart-check text-xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendapatan Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">Rp 0</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <i className="bi bi-currency-dollar text-xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pesanan Baru</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <i className="bi bi-clock-history text-xl text-yellow-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pelanggan</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <i className="bi bi-people text-xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Selamat Datang, {session.user?.name || session.user?.email}
        </h2>
        <p className="text-gray-500">
          Role: <span className="font-medium text-gray-700">{session.user?.role}</span>
        </p>
        <p className="text-gray-500">
          Tenant: <span className="font-medium text-gray-700">{session.user?.tenantSlug}</span>
        </p>
      </div>
    </div>
  )
}

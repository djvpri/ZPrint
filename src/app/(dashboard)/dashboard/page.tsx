'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPlanLimits, getEffectivePlan } from '@/lib/plan'

interface Stats {
  totalOrders: number
  ordersHariIni: number
  pendapatanHariIni: number
  pendapatanBulanIni: number
  totalPelanggan: number
  ordersBelumSelesai: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/stats').then(r => r.json()).then(setStats)
    }
  }, [session])

  if (status === 'loading') return <div className="flex items-center justify-center h-full"><div className="text-gray-500">Memuat...</div></div>
  if (!session) return null

  const plan = getEffectivePlan(session.user.tenantPlan, session.user.tenantPlanExpires ? new Date(session.user.tenantPlanExpires) : null)
  const limits = getPlanLimits(plan)
  const isFree = plan === 'free'

  const cards = [
    { label: 'Pesanan Bulan Ini', value: stats?.totalOrders ?? '—', icon: 'bi-cart-check', color: 'blue' },
    { label: 'Pendapatan Hari Ini', value: stats ? `Rp${stats.pendapatanHariIni.toLocaleString()}` : '—', icon: 'bi-cash-coin', color: 'green' },
    { label: 'Dalam Proses', value: stats?.ordersBelumSelesai ?? '—', icon: 'bi-clock-history', color: 'yellow' },
    { label: 'Total Pelanggan', value: stats?.totalPelanggan ?? '—', icon: 'bi-people', color: 'purple' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${plan === 'pro' ? 'bg-blue-100 text-blue-700' : plan === 'elite' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
          Plan: {plan.toUpperCase()}
        </span>
      </div>

      {isFree && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-yellow-800">Anda menggunakan plan Free</p>
            <p className="text-sm text-yellow-700">Batas {limits.ordersPerMonth} order/bulan & {limits.produk} produk. Upgrade ke Pro untuk tak terbatas.</p>
          </div>
          <a href="https://zomet.my.id" target="_blank" rel="noopener noreferrer"
            className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 whitespace-nowrap">
            Upgrade
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${colorMap[c.color]}`}>
                <i className={`bi ${c.icon} text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Pendapatan Bulan Ini</h2>
          <p className="text-3xl font-bold text-green-600">
            Rp{stats?.pendapatanBulanIni.toLocaleString() ?? '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Dari {stats?.totalOrders ?? 0} order</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Selamat datang</h2>
          <p className="text-gray-700 font-medium">{session.user.name || session.user.email}</p>
          <p className="text-sm text-gray-500">Role: {session.user.role}</p>
          <p className="text-sm text-gray-500">Toko: {session.user.tenantSlug}</p>
          {session.user.tenantPlanExpires && (
            <p className="text-xs text-gray-400 mt-1">Plan aktif s/d {new Date(session.user.tenantPlanExpires).toLocaleDateString('id')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

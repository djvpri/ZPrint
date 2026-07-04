import { NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return unauthorized()

  const tenantId = session.user.tenantId
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalOrders, ordersHariIni, pendapatanHariIni, pendapatanBulanIni, totalPelanggan, ordersBelumSelesai] =
    await Promise.all([
      prisma.order.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId, createdAt: { gte: startOfDay } } }),
      prisma.pembayaran.aggregate({
        where: { tenantId, createdAt: { gte: startOfDay } },
        _sum: { jumlah: true },
      }),
      prisma.pembayaran.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth } },
        _sum: { jumlah: true },
      }),
      prisma.pelanggan.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId, status: { in: ['MENUNGGU', 'PROSES'] } } }),
    ])

  return NextResponse.json({
    totalOrders,
    ordersHariIni,
    pendapatanHariIni: pendapatanHariIni._sum.jumlah ?? 0,
    pendapatanBulanIni: pendapatanBulanIni._sum.jumlah ?? 0,
    totalPelanggan,
    ordersBelumSelesai,
  })
}

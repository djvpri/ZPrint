import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1))
  const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()))

  const startDate = new Date(tahun, bulan - 1, 1)
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59)
  const tenantId = session.user.tenantId

  const [pembayarans, orders, produkTerlaris] = await Promise.all([
    prisma.pembayaran.findMany({
      where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
      include: { order: { include: { pelanggan: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
      select: { status: true, total: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ['namaItem'],
      where: { order: { tenantId, createdAt: { gte: startDate, lte: endDate }, status: { not: 'BATAL' } } },
      _sum: { qty: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    }),
  ])

  const totalPendapatan = pembayarans.reduce((a, b) => a + b.jumlah, 0)
  const totalOrder = orders.length
  const orderSelesai = orders.filter(o => o.status === 'SELESAI').length
  const orderBatal = orders.filter(o => o.status === 'BATAL').length

  // Harian
  const harian: Record<string, number> = {}
  for (const p of pembayarans) {
    const tgl = p.createdAt.toISOString().split('T')[0]
    harian[tgl] = (harian[tgl] || 0) + p.jumlah
  }

  return NextResponse.json({
    totalPendapatan,
    totalOrder,
    orderSelesai,
    orderBatal,
    harian: Object.entries(harian).map(([tgl, jumlah]) => ({ tgl, jumlah })).sort((a, b) => a.tgl.localeCompare(b.tgl)),
    produkTerlaris: produkTerlaris.map(p => ({ nama: p.namaItem, qty: p._sum.qty ?? 0, total: p._sum.subtotal ?? 0 })),
    pembayarans,
  })
}

export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/demo/check — Cek status demo (untuk debugging)
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '')
    if (auth !== 'zprint-demo-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cari tenant demo
    const tenants = await prisma.tenant.findMany({
      where: { isDemo: true },
      select: { id: true, slug: true, name: true, email: true, demoExpiresAt: true },
    })

    // Cari user demo di semua tenant
    const users = await prisma.user.findMany({
      where: { email: 'demo@zomet.my.id' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    })

    // Hitung data per tenant
    const tenantStats: Record<string, any> = {}
    for (const t of tenants) {
      const [kategori, produk, pelanggan, pesanan] = await Promise.all([
        prisma.kategoriProduk.count({ where: { tenantId: t.id } }),
        prisma.produk.count({ where: { tenantId: t.id } }),
        prisma.pelanggan.count({ where: { tenantId: t.id } }),
        prisma.order.count({ where: { tenantId: t.id } }),
      ])
      tenantStats[t.id] = { kategori, produk, pelanggan, pesanan }
    }

    return NextResponse.json({
      tenantDemo: tenants,
      userDemo: users,
      tenantStats,
      userCount: users.length,
      tenantCount: tenants.length,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[DemoCheck]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

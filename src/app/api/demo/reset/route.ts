export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bersihkanDataToko, seedDataDemo } from '@/lib/demo-seed'

// POST /api/demo/reset — Reset manual (user pencet tombol)
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json()

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant?.isDemo) {
      return NextResponse.json({ error: 'Bukan tenant demo' }, { status: 400 })
    }

    // Bersihkan semua data
    await bersihkanDataToko(tenantId)

    // Seed ulang
    const result = await seedDataDemo(tenantId)

    // Update expiry: 2 jam dari sekarang
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { demoExpiresAt: expiresAt },
    })

    return NextResponse.json({
      success: true,
      message: 'Demo berhasil di-reset',
      expiresAt: expiresAt.toISOString(),
      ...result,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[DemoReset]', msg)
    return NextResponse.json({ error: 'Gagal reset demo' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bersihkanDataToko, seedDataDemo } from '@/lib/demo-seed'

// POST /api/demo/reset-daily — Called by cron job
export async function POST(req: NextRequest) {
  // Verifikasi secret
  const authHeader = req.headers.get('authorization')
  const secret = process.env.DEMO_RESET_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Cari semua tenant demo yang expired
    const expiredDemos = await prisma.tenant.findMany({
      where: {
        isDemo: true,
        demoExpiresAt: { lt: new Date() },
      },
    })

    if (expiredDemos.length === 0) {
      return NextResponse.json({ message: 'Tidak ada demo expired', reset: 0 })
    }

    let resetCount = 0
    for (const tenant of expiredDemos) {
      try {
        // Bersihkan data
        await bersihkanDataToko(tenant.id)

        // Seed ulang
        await seedDataDemo(tenant.id)

        // Update expiry: 2 jam dari sekarang
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { demoExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
        })

        resetCount++
        console.log(`[DemoReset] ✅ ${tenant.name} (${tenant.id})`)
      } catch (err: any) {
        console.error(`[DemoReset] ❌ ${tenant.name}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${resetCount} demo tenant di-reset`,
      reset: resetCount,
      total: expiredDemos.length,
    })
  } catch (error: any) {
    console.error('[DemoResetDaily]', error.message)
    return NextResponse.json({ error: 'Gagal reset demo' }, { status: 500 })
  }
}

// GET — untuk health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'zprint-demo-reset' })
}

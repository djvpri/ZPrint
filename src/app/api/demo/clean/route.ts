export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/demo/clean — Hapus user duplikat, sisakan 1 per email
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.DEMO_RESET_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Cari semua user yang emailnya duplikat
    const dupEmails = await prisma.user.groupBy({
      by: ['email'],
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } },
    })

    const results: { email: string; kept: string; removed: string[] }[] = []

    for (const { email, _count } of dupEmails) {
      const users = await prisma.user.findMany({
        where: { email },
        orderBy: [
          { role: 'desc' }, // ADMIN dipertahankan dulu
          { createdAt: 'asc' }, // yang paling lama
        ],
      })

      // Pertahankan user pertama (ADMIN + terlama), hapus sisanya
      const [keep, ...remove] = users

      for (const r of remove) {
        await prisma.user.delete({ where: { id: r.id } })
      }

      results.push({
        email,
        kept: `${keep.name} (${keep.id})`,
        removed: remove.map((r) => `${r.name} (${r.id})`),
      })
    }

    return NextResponse.json({
      success: true,
      cleaned: results.length,
      details: results,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[DemoCleanup]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

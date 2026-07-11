export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { bersihkanDataToko, seedDataDemo } from '@/lib/demo-seed'

// Hapus user duplikat (1 email = 1 user)
async function cleanupDuplicateUsers() {
  const dupEmails = await prisma.user.groupBy({
    by: ['email'],
    _count: { id: true },
    having: { id: { _count: { gte: 2 } } },
  })
  for (const { email } of dupEmails) {
    const users = await prisma.user.findMany({
      where: { email },
      orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
    })
    const [, ...remove] = users
    for (const r of remove) {
      await prisma.user.delete({ where: { id: r.id } })
    }
  }
}

// POST /api/demo/setup — setup tenant demo (butuh DEMO_RESET_SECRET)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.DEMO_RESET_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 0. Hapus user duplikat dulu
    await cleanupDuplicateUsers()

    // 1. Cari atau buat tenant demo
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Demo Percetakan',
          slug: 'demo',
          plan: 'demo',
          isDemo: true,
          demoExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      })
    } else {
      tenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          isDemo: true,
          demoExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      })
    }

    // 2. Cari atau buat user operator demo
    let user = await prisma.user.findFirst({
      where: { email: 'demo@zomet.my.id', tenantId: tenant.id },
    })
    if (!user) {
      const passwordHash = await hash('demo123', 12)
      user = await prisma.user.create({
        data: {
          name: 'Demo Percetakan',
          email: 'demo@zomet.my.id',
          password: passwordHash,
          role: 'ADMIN',
          tenantId: tenant.id,
          active: true,
        },
      })
    }

    // 3. Seed data demo
    await bersihkanDataToko(tenant.id)
    const result = await seedDataDemo(tenant.id)

    return NextResponse.json({
      success: true,
      tenant: { id: tenant.id, slug: tenant.slug },
      user: { id: user.id, email: user.email },
      ...result,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[DemoSetup]', msg)
    return NextResponse.json({ error: 'Gagal setup demo', detail: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const CROSS_APP_SECRET = process.env.CROSS_APP_SECRET || 'z-ecosystem-admin-2026'

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json()
    if (token !== CROSS_APP_SECRET) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })

    const user = await prisma.user.findFirst({
      where: { email, active: true },
      include: { tenant: true },
    })
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'secret')
    const ssoToken = await new SignJWT({
      id: user.id, email: user.email, name: user.name,
      role: user.role, tenantId: user.tenantId,
      tenantSlug: user.tenant.slug, tenantPlan: user.tenant.plan,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(secret)

    return NextResponse.json({ token: ssoToken })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

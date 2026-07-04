import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { getEffectivePlan } from '@/lib/plan'

const CROSS_APP_SECRET = process.env.CROSS_APP_SECRET || 'z-ecosystem-admin-2026'

function checkAuth(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${CROSS_APP_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, plan: true, planExpires: true },
    })
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, tenantId: true, role: true, active: true },
    })
    return NextResponse.json({
      tenants: tenants.map(t => ({
        id: t.id, name: t.name, slug: t.slug,
        plan: getEffectivePlan(t.plan, t.planExpires),
        active: true,
        expires_at: t.planExpires,
      })),
      users: users.map(u => ({
        id: u.id, name: u.name, email: u.email,
        tenantId: u.tenantId, role: u.role.toLowerCase(), active: u.active,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { action, email, data } = await req.json()

    if (action === 'create') {
      const name = String(data?.name || '').trim()
      const emailVal = String(data?.email || '').trim()
      const password = String(data?.password || '')
      if (!name || !emailVal || !password) return NextResponse.json({ error: 'name, email, password wajib' }, { status: 400 })

      const tenant = data?.tenantId
        ? await prisma.tenant.findUnique({ where: { id: data.tenantId } })
        : await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!tenant) return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 400 })

      const existing = await prisma.user.findFirst({ where: { email: emailVal, tenantId: tenant.id } })
      if (existing) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 })

      const passwordHash = await hash(password, 10)
      const user = await prisma.user.create({
        data: { name, email: emailVal, password: passwordHash, role: data?.role?.toUpperCase() || 'KASIR', tenantId: tenant.id },
      })
      return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } })
    }

    if (action === 'delete') {
      if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })
      await prisma.user.updateMany({ where: { email }, data: { active: false } })
      return NextResponse.json({ success: true, deactivated: true })
    }

    if (action === 'reactivate') {
      if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })
      await prisma.user.updateMany({ where: { email }, data: { active: true } })
      return NextResponse.json({ success: true, reactivated: true })
    }

    if (action === 'updateRole') {
      if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })
      const role = String(data?.role || 'KASIR').toUpperCase()
      if (!['KASIR', 'ADMIN', 'OWNER'].includes(role)) return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
      await prisma.user.updateMany({ where: { email }, data: { role } })
      return NextResponse.json({ success: true, role })
    }

    if (action === 'updatePlan') {
      if (!data?.tenantId) return NextResponse.json({ error: 'tenantId wajib' }, { status: 400 })
      const plan = String(data?.plan || 'free')
      const expiresAt = data?.planExpires ? new Date(data.planExpires) : undefined
      await prisma.tenant.update({ where: { id: data.tenantId }, data: { plan, planExpires: expiresAt } })
      return NextResponse.json({ success: true })
    }

    if (action === 'createTenant') {
      const name = String(data?.name || '').trim()
      if (!name) return NextResponse.json({ error: 'name wajib' }, { status: 400 })
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      const existing = await prisma.tenant.findUnique({ where: { slug } })
      if (existing) return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 })
      const tenant = await prisma.tenant.create({ data: { name, slug, plan: 'free' } })
      return NextResponse.json({ success: true, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } })
    }

    if (action === 'moveTenant') {
      if (!email || !data?.tenantId) return NextResponse.json({ error: 'email dan tenantId wajib' }, { status: 400 })
      const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } })
      if (!tenant) return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 })
      await prisma.user.updateMany({ where: { email }, data: { tenantId: data.tenantId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memproses aksi', detail: String(err) }, { status: 500 })
  }
}

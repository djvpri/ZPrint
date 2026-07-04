import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { getPlanLimits, getEffectivePlan } from '@/lib/plan'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const kategoriId = searchParams.get('kategoriId')

  const produk = await prisma.produk.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(kategoriId ? { kategoriId } : {}),
    },
    include: { kategori: true },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(produk)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
  const plan = getEffectivePlan(tenant?.plan ?? 'free', tenant?.planExpires ?? null)
  const limits = getPlanLimits(plan)

  const count = await prisma.produk.count({ where: { tenantId: session.user.tenantId } })
  if (count >= limits.produk) {
    return NextResponse.json({ error: `Batas produk plan ${plan} (${limits.produk}) tercapai. Upgrade ke Pro.` }, { status: 403 })
  }

  const { nama, kode, kategoriId, hargaSatuan, hargaPerMeter, hargaPerM2, satuan } = await req.json()
  if (!nama?.trim() || !kategoriId) return NextResponse.json({ error: 'nama dan kategoriId wajib' }, { status: 400 })

  const produk = await prisma.produk.create({
    data: {
      nama: nama.trim(),
      kode: kode?.trim() || null,
      kategoriId,
      tenantId: session.user.tenantId,
      hargaSatuan: hargaSatuan ? parseFloat(hargaSatuan) : null,
      hargaPerMeter: hargaPerMeter ? parseFloat(hargaPerMeter) : null,
      hargaPerM2: hargaPerM2 ? parseFloat(hargaPerM2) : null,
      satuan: satuan || 'pcs',
    },
    include: { kategori: true },
  })
  return NextResponse.json(produk, { status: 201 })
}

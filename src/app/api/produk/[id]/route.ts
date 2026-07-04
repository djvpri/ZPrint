import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nama, kode, kategoriId, hargaSatuan, hargaPerMeter, hargaPerM2, satuan } = await req.json()

  await prisma.produk.updateMany({
    where: { id: params.id, tenantId: session.user.tenantId },
    data: {
      ...(nama ? { nama: nama.trim() } : {}),
      ...(kode !== undefined ? { kode: kode || null } : {}),
      ...(kategoriId ? { kategoriId } : {}),
      ...(hargaSatuan !== undefined ? { hargaSatuan: hargaSatuan ? parseFloat(hargaSatuan) : null } : {}),
      ...(hargaPerMeter !== undefined ? { hargaPerMeter: hargaPerMeter ? parseFloat(hargaPerMeter) : null } : {}),
      ...(hargaPerM2 !== undefined ? { hargaPerM2: hargaPerM2 ? parseFloat(hargaPerM2) : null } : {}),
      ...(satuan ? { satuan } : {}),
    },
  })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.produk.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } })
  return NextResponse.json({ success: true })
}

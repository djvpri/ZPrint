import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()

  const data = await req.json()
  const pelanggan = await prisma.pelanggan.updateMany({
    where: { id: params.id, tenantId: session.user.tenantId },
    data: {
      nama: data.nama?.trim(),
      noHp: data.noHp?.trim() || null,
      alamat: data.alamat?.trim() || null,
    },
  })
  return NextResponse.json({ success: pelanggan.count > 0 })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.pelanggan.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } })
  return NextResponse.json({ success: true })
}

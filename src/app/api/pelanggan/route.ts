import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const pelanggan = await prisma.pelanggan.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(q ? { OR: [{ nama: { contains: q, mode: 'insensitive' } }, { noHp: { contains: q } }] } : {}),
    },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(pelanggan)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()

  const { nama, noHp, alamat } = await req.json()
  if (!nama?.trim()) return NextResponse.json({ error: 'nama wajib diisi' }, { status: 400 })

  const pelanggan = await prisma.pelanggan.create({
    data: { nama: nama.trim(), noHp: noHp?.trim() || null, alamat: alamat?.trim() || null, tenantId: session.user.tenantId },
  })
  return NextResponse.json(pelanggan, { status: 201 })
}

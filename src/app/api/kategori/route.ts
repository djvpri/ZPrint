import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return unauthorized()

  const kategoris = await prisma.kategoriProduk.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(kategoris)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nama } = await req.json()
  if (!nama?.trim()) return NextResponse.json({ error: 'nama wajib diisi' }, { status: 400 })

  const kategori = await prisma.kategoriProduk.create({
    data: { nama: nama.trim(), tenantId: session.user.tenantId },
  })
  return NextResponse.json(kategori, { status: 201 })
}

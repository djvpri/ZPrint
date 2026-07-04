import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

const STATUS_FLOW: Record<string, string[]> = {
  MENUNGGU: ['PROSES', 'BATAL'],
  PROSES: ['SELESAI', 'BATAL'],
  SELESAI: [],
  BATAL: [],
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()

  const order = await prisma.order.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
    include: { pelanggan: true, items: { include: { produk: true } }, pembayarans: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()

  const order = await prisma.order.findFirst({ where: { id: params.id, tenantId: session.user.tenantId } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status, catatan } = await req.json()

  if (status) {
    const allowed = STATUS_FLOW[order.status] ?? []
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Tidak bisa ubah status dari ${order.status} ke ${status}` }, { status: 400 })
    }
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(catatan !== undefined ? { catatan } : {}),
    },
    include: { pelanggan: true, items: { include: { produk: true } }, pembayarans: true },
  })
  return NextResponse.json(updated)
}

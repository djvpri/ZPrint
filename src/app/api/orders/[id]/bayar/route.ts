import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return unauthorized()

  const order = await prisma.order.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
    include: { pembayarans: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.status === 'BATAL') return NextResponse.json({ error: 'Order sudah dibatalkan' }, { status: 400 })

  const { jumlah, metode, tipe } = await req.json()
  const jml = parseFloat(jumlah)
  if (!jml || jml <= 0) return NextResponse.json({ error: 'Jumlah tidak valid' }, { status: 400 })
  if (jml > order.sisa + 1) return NextResponse.json({ error: `Jumlah melebihi sisa (Rp${order.sisa.toLocaleString()})` }, { status: 400 })

  const pembayaran = await prisma.pembayaran.create({
    data: {
      orderId: order.id,
      tenantId: session.user.tenantId,
      jumlah: jml,
      metode: metode || 'TUNAI',
      tipe: tipe || 'PELUNASAN',
    },
  })

  const newSisa = Math.max(0, order.sisa - jml)
  const newDp = order.dp + jml
  await prisma.order.update({
    where: { id: order.id },
    data: { dp: newDp, sisa: newSisa },
  })

  return NextResponse.json({ pembayaran, newSisa })
}

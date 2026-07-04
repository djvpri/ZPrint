import { NextRequest, NextResponse } from 'next/server'
import { auth, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { getPlanLimits, getEffectivePlan } from '@/lib/plan'

export const dynamic = 'force-dynamic'

function generateNoOrder(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PRT-${y}${m}${d}-${rand}`
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where = {
    tenantId: session.user.tenantId,
    ...(status ? { status } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { pelanggan: true, items: { include: { produk: true } }, pembayarans: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return unauthorized()

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
  const plan = getEffectivePlan(tenant?.plan ?? 'free', tenant?.planExpires ?? null)
  const limits = getPlanLimits(plan)

  if (limits.ordersPerMonth !== Infinity) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const countMonth = await prisma.order.count({
      where: { tenantId: session.user.tenantId, createdAt: { gte: startOfMonth } },
    })
    if (countMonth >= limits.ordersPerMonth) {
      return NextResponse.json({
        error: `Batas ${limits.ordersPerMonth} order/bulan untuk plan ${plan} tercapai. Upgrade ke Pro untuk order tak terbatas.`,
      }, { status: 403 })
    }
  }

  const { pelangganId, items, catatan, dp, diskon } = await req.json()

  if (!items?.length) return NextResponse.json({ error: 'Minimal 1 item' }, { status: 400 })

  let subtotal = 0
  const itemsData: {
    produkId: string; namaItem: string; qty: number; lebar: number | null; tinggi: number | null
    satuan: string; hargaSatuan: number; subtotal: number
  }[] = []

  for (const item of items) {
    const produk = await prisma.produk.findFirst({ where: { id: item.produkId, tenantId: session.user.tenantId } })
    if (!produk) return NextResponse.json({ error: `Produk tidak ditemukan: ${item.produkId}` }, { status: 400 })

    const satuan = item.satuan || produk.satuan || 'pcs'
    const hargaSatuan = parseFloat(item.hargaSatuan) || (produk.hargaPerM2 || produk.hargaPerMeter || produk.hargaSatuan || 0)
    const qty = parseFloat(item.qty) || 1
    const lebar = item.lebar ? parseFloat(item.lebar) : null
    const tinggi = item.tinggi ? parseFloat(item.tinggi) : null

    let sub: number
    if (satuan === 'm2' && lebar && tinggi) {
      sub = hargaSatuan * lebar * tinggi
    } else if (satuan === 'meter') {
      sub = hargaSatuan * qty
    } else {
      sub = hargaSatuan * qty
    }

    subtotal += sub
    itemsData.push({ produkId: produk.id, namaItem: produk.nama, qty, lebar, tinggi, satuan, hargaSatuan, subtotal: sub })
  }

  const disc = parseFloat(diskon) || 0
  const total = subtotal - disc
  const dpAmt = parseFloat(dp) || 0
  const sisa = total - dpAmt

  const order = await prisma.order.create({
    data: {
      noOrder: generateNoOrder(),
      pelangganId: pelangganId || null,
      tenantId: session.user.tenantId,
      status: 'MENUNGGU',
      subtotal,
      diskon: disc,
      total,
      dp: dpAmt,
      sisa,
      catatan: catatan?.trim() || null,
      items: { create: itemsData },
      ...(dpAmt > 0 ? {
        pembayarans: {
          create: { tenantId: session.user.tenantId, jumlah: dpAmt, metode: 'TUNAI', tipe: 'DP' },
        },
      } : {}),
    },
    include: { pelanggan: true, items: { include: { produk: true } }, pembayarans: true },
  })

  return NextResponse.json(order, { status: 201 })
}

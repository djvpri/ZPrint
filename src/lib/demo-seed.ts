import { prisma } from '@/lib/prisma'

// ============================================
// DEMO DATA ZPRINT — Sistem Kasir Percetakan
// ============================================

const DEMO_KATEGORI = [
  { nama: 'Percetakan Umum' },
  { nama: 'Spanduk & Banner' },
  { nama: 'Undangan & Kartu' },
  { nama: 'Merchandise' },
]

const DEMO_PRODUK: Array<{
  nama: string
  kategori: string
  harga: number
  satuan: string
}> = [
  // Percetakan Umum
  { nama: 'Kartu Nama', kategori: 'Percetakan Umum', harga: 25000, satuan: 'box' },
  { nama: 'Cetak Brosur A4', kategori: 'Percetakan Umum', harga: 1500, satuan: 'lembar' },
  { nama: 'Cetak Flyer A5', kategori: 'Percetakan Umum', harga: 800, satuan: 'lembar' },
  { nama: 'Cetak Poster A3', kategori: 'Percetakan Umum', harga: 5000, satuan: 'lembar' },
  { nama: 'Stiker Cutting', kategori: 'Percetakan Umum', harga: 3000, satuan: 'pcs' },
  { nama: 'Cetak Kop Surat', kategori: 'Percetakan Umum', harga: 500, satuan: 'lembar' },
  { nama: 'Cetak Map', kategori: 'Percetakan Umum', harga: 3500, satuan: 'pcs' },
  { nama: 'Sablon Mug', kategori: 'Merchandise', harga: 25000, satuan: 'pcs' },
  { nama: 'Sablon Totebag', kategori: 'Merchandise', harga: 18000, satuan: 'pcs' },

  // Spanduk & Banner
  { nama: 'Banner X-Banner', kategori: 'Spanduk & Banner', harga: 85000, satuan: 'pcs' },
  { nama: 'Roll Banner', kategori: 'Spanduk & Banner', harga: 120000, satuan: 'pcs' },
  { nama: 'Spanduk Biasa', kategori: 'Spanduk & Banner', harga: 15000, satuan: 'meter' },
  { nama: 'Banner Digital', kategori: 'Spanduk & Banner', harga: 20000, satuan: 'meter' },

  // Undangan & Kartu
  { nama: 'Undangan Biasa', kategori: 'Undangan & Kartu', harga: 2500, satuan: 'pcs' },
  { nama: 'Undangan Premium', kategori: 'Undangan & Kartu', harga: 5000, satuan: 'pcs' },
  { nama: 'Kartu Undangan Hardcover', kategori: 'Undangan & Kartu', harga: 8000, satuan: 'pcs' },
  { nama: 'Kartu Nama Premium', kategori: 'Undangan & Kartu', harga: 50000, satuan: 'box' },
]

const DEMO_PELANGGAN = [
  { nama: 'Toko Berkah', noHp: '081234567890', alamat: 'Jl. Merdeka No. 10' },
  { nama: 'Kantor Kecamatan', noHp: '085678901234', alamat: 'Jl. Pemerintahan No. 5' },
  { nama: 'Masjid Al-Hidayah', noHp: '087890123456', alamat: 'Jl. Pesantren No. 22' },
  { nama: 'Rumah Sakit Umum', noHp: '089012345678', alamat: 'Jl. Kesehatan No. 1' },
  { nama: 'SMA Negeri 1', noHp: '081122334455', alamat: 'Jl. Pendidikan No. 8' },
]

// Seed produk demo
async function seedProducts(tenantId: string, kategoriMap: Map<string, string>) {
  const produk = DEMO_PRODUK.map(p => ({
    nama: p.nama,
    kode: null as string | null,
    kategoriId: kategoriMap.get(p.kategori)!,
    tenantId,
    hargaSatuan: p.harga,
    hargaPerMeter: null as number | null,
    hargaPerM2: null as number | null,
    satuan: p.satuan,
  }))

  return prisma.produk.createMany({ data: produk })
}

// Seed 14 hari riwayat transaksi
async function seedOrders(tenantId: string, produkList: any[], pelangganList: any[]) {
  const now = new Date()

  for (let hari = 13; hari >= 0; hari--) {
    const tanggal = new Date(now)
    tanggal.setDate(tanggal.getDate() - hari)
    tanggal.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

    const jumlahOrder = 1 + Math.floor(Math.random() * 3)
    for (let o = 0; o < jumlahOrder; o++) {
      const pelanggan = pelangganList[Math.floor(Math.random() * pelangganList.length)]
      const jumlahItem = 1 + Math.floor(Math.random() * 3)
      let subtotal = 0

      const items: any[] = []
      const usedProduk = new Set<string>()

      for (let i = 0; i < jumlahItem; i++) {
        let produk: any
        do {
          produk = produkList[Math.floor(Math.random() * produkList.length)]
        } while (usedProduk.has(produk.id) && usedProduk.size < produkList.length)
        usedProduk.add(produk.id)

        const qty = 1 + Math.floor(Math.random() * 10)
        const itemSubtotal = produk.hargaSatuan * qty
        subtotal += itemSubtotal

        items.push({
          produkId: produk.id,
          namaItem: produk.nama,
          qty,
          lebar: null,
          tinggi: null,
          satuan: produk.satuan,
          hargaSatuan: produk.hargaSatuan,
          subtotal: itemSubtotal,
        })
      }

      const diskon = Math.random() > 0.8 ? Math.round(subtotal * 0.1) : 0
      const total = subtotal - diskon
      const dp = Math.random() > 0.6 ? Math.round(total * 0.5) : total
      const sisa = total - dp

      const statuses = ['DRAFT', 'PROSES', 'SELESAI']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const noOrder = `PRN-${String(tanggal.getMonth() + 1).padStart(2, '0')}${String(tanggal.getDate()).padStart(2, '0')}-${String(o + 1).padStart(3, '0')}`

      const order = await prisma.order.create({
        data: {
          noOrder: `${noOrder}-${Math.random().toString(36).slice(2, 6)}`,
          pelangganId: pelanggan.id,
          tenantId,
          status,
          subtotal,
          diskon,
          total,
          dp,
          sisa,
          catatan: Math.random() > 0.7 ? 'Cetak warna' : null,
          createdAt: tanggal,
          items: { create: items },
        },
      })

      // Pembayaran
      await prisma.pembayaran.create({
        data: {
          orderId: order.id,
          tenantId,
          jumlah: dp,
          metode: Math.random() > 0.5 ? 'TUNAI' : 'TRANSFER',
          tipe: 'DP',
        },
      })
    }
  }
}

// Bersihkan semua data toko (untuk reset)
export async function bersihkanDataToko(tenantId: string) {
  await prisma.pembayaran.deleteMany({ where: { tenantId } })
  await prisma.orderItem.deleteMany({ where: { order: { tenantId } } })
  await prisma.order.deleteMany({ where: { tenantId } })
  await prisma.produk.deleteMany({ where: { tenantId } })
  await prisma.kategoriProduk.deleteMany({ where: { tenantId } })
  await prisma.pelanggan.deleteMany({ where: { tenantId } })
}

// Seed data lengkap untuk toko demo
export async function seedDataDemo(tenantId: string) {
  // 1. Kategori
  const kategoriResult = await Promise.all(
    DEMO_KATEGORI.map(k =>
      prisma.kategoriProduk.create({ data: { nama: k.nama, tenantId } })
    )
  )
  const kategoriMap = new Map(kategoriResult.map((k, i) => [DEMO_KATEGORI[i].nama, k.id]))

  // 2. Produk
  await seedProducts(tenantId, kategoriMap)

  // 3. Pelanggan
  const pelangganResult = await Promise.all(
    DEMO_PELANGGAN.map(p =>
      prisma.pelanggan.create({ data: { ...p, tenantId } })
    )
  )

  // 4. Produk list (untuk seed orders)
  const produkList = await prisma.produk.findMany({ where: { tenantId } })

  // 5. Riwayat transaksi 14 hari
  await seedOrders(tenantId, produkList, pelangganResult)

  return { kategori: kategoriResult.length, produk: produkList.length, pelanggan: pelangganResult.length }
}

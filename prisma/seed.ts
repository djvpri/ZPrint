import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database...')

  const existingTenant = await prisma.tenant.findFirst()
  if (existingTenant) {
    console.log('Database already seeded, skipping.')
    return
  }

  console.log('Seeding database...')

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Percetakan Digital',
      slug: 'percetakan-digital',
      plan: 'pro',
    },
  })
  console.log('Tenant created:', tenant.slug)

  const adminPassword = await hash('admin123', 12)
  const kasirPassword = await hash('kasir123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@zprint.id',
      name: 'Admin Utama',
      password: adminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
      active: true,
    },
  })
  console.log('Admin created:', admin.email)

  const kasir = await prisma.user.create({
    data: {
      email: 'kasir@zprint.id',
      name: 'Kasir Toko',
      password: kasirPassword,
      role: 'KASIR',
      tenantId: tenant.id,
      active: true,
    },
  })
  console.log('Kasir created:', kasir.email)

  const kategoriData = [
    { nama: 'Cetak Digital', tenantId: tenant.id },
    { nama: 'Offset', tenantId: tenant.id },
    { nama: 'Stiker & Label', tenantId: tenant.id },
    { nama: 'Merchandise', tenantId: tenant.id },
    { nama: 'Spanduk & Banner', tenantId: tenant.id },
  ]

  const kategoris = await Promise.all(
    kategoriData.map((k) => prisma.kategoriProduk.create({ data: k }))
  )
  console.log(`Categories created: ${kategoris.length}`)

  const produkData = [
    { nama: 'Kartu Nama (Glossy)', kategoriId: kategoris[0].id, tenantId: tenant.id, hargaSatuan: 50000, satuan: 'pcs' },
    { nama: 'Kartu Nama (Doft)', kategoriId: kategoris[0].id, tenantId: tenant.id, hargaSatuan: 65000, satuan: 'pcs' },
    { nama: 'Flyer A4', kategoriId: kategoris[0].id, tenantId: tenant.id, hargaSatuan: 2500, satuan: 'pcs' },
    { nama: 'Flyer A5', kategoriId: kategoris[0].id, tenantId: tenant.id, hargaSatuan: 1500, satuan: 'pcs' },
    { nama: 'Brosur Lipat 3', kategoriId: kategoris[0].id, tenantId: tenant.id, hargaSatuan: 3500, satuan: 'pcs' },
    { nama: 'Poster A3', kategoriId: kategoris[0].id, tenantId: tenant.id, hargaSatuan: 15000, satuan: 'pcs' },
    { nama: 'Nota/Kwitansi', kategoriId: kategoris[1].id, tenantId: tenant.id, hargaSatuan: 35000, satuan: 'rim' },
    { nama: 'Amplop Perusahaan', kategoriId: kategoris[1].id, tenantId: tenant.id, hargaSatuan: 75000, satuan: 'box' },
    { nama: 'Stiker Vinyl', kategoriId: kategoris[2].id, tenantId: tenant.id, hargaPerM2: 25000, satuan: 'm2' },
    { nama: 'Stiker Chromo', kategoriId: kategoris[2].id, tenantId: tenant.id, hargaPerM2: 15000, satuan: 'm2' },
    { nama: 'Stiker Bening', kategoriId: kategoris[2].id, tenantId: tenant.id, hargaPerM2: 30000, satuan: 'm2' },
    { nama: 'Label (Custom)', kategoriId: kategoris[2].id, tenantId: tenant.id, hargaSatuan: 5000, satuan: 'pcs' },
    { nama: 'Mug Custom', kategoriId: kategoris[3].id, tenantId: tenant.id, hargaSatuan: 35000, satuan: 'pcs' },
    { nama: 'T-Shirt Sablon', kategoriId: kategoris[3].id, tenantId: tenant.id, hargaSatuan: 75000, satuan: 'pcs' },
    { nama: 'Topi Custom', kategoriId: kategoris[3].id, tenantId: tenant.id, hargaSatuan: 45000, satuan: 'pcs' },
    { nama: 'Gantungan Kunci', kategoriId: kategoris[3].id, tenantId: tenant.id, hargaSatuan: 8000, satuan: 'pcs' },
    { nama: 'Banner', kategoriId: kategoris[4].id, tenantId: tenant.id, hargaPerM2: 35000, satuan: 'm2' },
    { nama: 'Spanduk Flexi', kategoriId: kategoris[4].id, tenantId: tenant.id, hargaPerM2: 25000, satuan: 'm2' },
    { nama: 'X-Banner (termasuk cetak)', kategoriId: kategoris[4].id, tenantId: tenant.id, hargaSatuan: 65000, satuan: 'pcs' },
    { nama: 'Roll Banner', kategoriId: kategoris[4].id, tenantId: tenant.id, hargaSatuan: 150000, satuan: 'pcs' },
  ]

  await Promise.all(produkData.map((p) => prisma.produk.create({ data: p })))
  console.log(`Products created: ${produkData.length}`)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

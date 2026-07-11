const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  // 1. Cek operator/admin demo@zomet.my.id
  let operator = await prisma.user.findFirst({ where: { email: 'demo@zomet.my.id' } })

  if (operator) {
    console.log('User demo@zomet.my.id sudah ada:', operator.id)
  } else {
    // Cek apakah ada tenant dengan slug 'demo'
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Demo Percetakan', slug: 'demo', plan: 'demo', isDemo: true, demoExpiresAt: new Date(Date.now() + 2*60*60*1000) }
      })
      console.log('Tenant demo dibuat:', tenant.id)
    } else {
      await prisma.tenant.update({ where: { id: tenant.id }, data: { isDemo: true, demoExpiresAt: new Date(Date.now() + 2*60*60*1000) } })
      console.log('Tenant demo sudah ada, diupdate:', tenant.id)
    }

    const hashed = await bcrypt.hash('demo123', 12)
    operator = await prisma.user.create({
      data: { email: 'demo@zomet.my.id', name: 'Demo Percetakan', password: hashed, role: 'admin', tenantId: tenant.id }
    })
    console.log('User demo dibuat:', operator.id)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

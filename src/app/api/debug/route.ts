import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    // Test DB connection
    await prisma.$connect()
    results.db = "connected"

    // Count users
    const userCount = await prisma.user.count()
    results.users = userCount

    // Count tenants
    const tenantCount = await prisma.tenant.count()
    results.tenants = tenantCount

    await prisma.$disconnect()
    results.status = "ok"
  } catch (e) {
    results.status = "error"
    results.error = e instanceof Error ? e.message : String(e)
  }

  results.env = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    hasAuthSecret: !!process.env.AUTH_SECRET,
  }

  return Response.json(results)
}

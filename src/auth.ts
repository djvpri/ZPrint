import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: { email: credentials.email as string, active: true },
          include: { tenant: true },
        })

        if (!user) return null
        const valid = await compare(credentials.password as string, user.password as string)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          tenantPlan: user.tenant.plan,
          tenantPlanExpires: user.tenant.planExpires?.toISOString() ?? null,
          faceId: user.faceId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.tenantSlug = (user as any).tenantSlug
        token.tenantPlan = (user as any).tenantPlan
        token.tenantPlanExpires = (user as any).tenantPlanExpires
        token.faceId = (user as any).faceId
      }
      if (token.email) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: { email: token.email as string },
            select: {
              role: true, faceId: true, active: true,
              tenant: { select: { slug: true, plan: true, planExpires: true } },
            },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.faceId = dbUser.faceId
            token.tenantPlan = dbUser.tenant.plan
            token.tenantPlanExpires = dbUser.tenant.planExpires?.toISOString() ?? null
          }
        } catch (e) {
          console.error('JWT callback DB error:', e)
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.tenantId = token.tenantId as string
      session.user.tenantSlug = token.tenantSlug as string
      session.user.tenantPlan = token.tenantPlan as string
      session.user.tenantPlanExpires = token.tenantPlanExpires as string | null
      session.user.faceId = token.faceId as string
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.AUTH_SECRET,
})

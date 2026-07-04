/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const { handlers: { GET, POST } } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenant: { label: "Tenant", type: "text" },
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
          faceId: user.faceId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
        token.faceId = user.faceId
      }
      if (token.email) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: { email: token.email as string },
            select: { role: true, faceId: true, active: true, tenant: { select: { slug: true, plan: true, planExpires: true } } },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.faceId = dbUser.faceId
          }
        } catch (e) {
          console.error("JWT callback DB error:", e)
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.tenantId = token.tenantId as string
      session.user.tenantSlug = token.tenantSlug as string
      session.user.faceId = token.faceId as string
      return session
    },
  },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export { GET, POST }

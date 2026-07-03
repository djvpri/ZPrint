import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      tenantId: string
      tenantSlug: string
      faceId?: string | null
    }
  }

  interface User {
    role: string
    tenantId: string
    tenantSlug: string
    faceId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string
    tenantSlug: string
    faceId?: string | null
  }
}

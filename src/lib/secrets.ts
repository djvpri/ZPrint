// Helper fail-closed untuk secret lintas-aplikasi ekosistem Zomet.
// Tidak ada fallback hardcoded: kalau env belum di-set, langsung error
// supaya endpoint sensitif tidak bisa diakses dengan secret default.
export function getCrossAppSecret(): string {
  const secret = process.env.CROSS_APP_SECRET
  if (!secret) {
    throw new Error('CROSS_APP_SECRET belum di-set di environment')
  }
  return secret
}

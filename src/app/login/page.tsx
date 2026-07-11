'use client'

import { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => {
    // SSO-only: redirect langsung ke ZOne
    window.location.replace('https://zone.zomet.my.id?app=zprint&redirect=https://zprint.zomet.my.id/sso')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
        <div className="text-4xl mb-2">
          <i className="bi bi-printer-fill text-blue-600"></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ZPrint</h1>
        <p className="text-sm text-gray-500">POS Digital Printing &amp; Percetakan</p>
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-6" />
        <p className="text-sm text-gray-400 mt-2">Mengarahkan ke Z One untuk login...</p>
      </div>
    </div>
  )
}

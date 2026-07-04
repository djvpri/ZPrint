'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

function SsoContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMsg('Token tidak ditemukan. Buka ZPrint lewat Z One lagi.')
      return
    }

    signIn('sso', { token, redirect: false })
      .then((res) => {
        if (res?.error) {
          setStatus('error')
          setMsg('Login SSO gagal. Pastikan akun email Anda sudah terdaftar di ZPrint, atau hubungi admin.')
        } else {
          // Absolute URL supaya redirect ke ZPrint sendiri,
          // bukan ke domain Z One yang mungkin masih aktif di browser
          window.location.replace('https://zprint.zomet.my.id/dashboard')
        }
      })
      .catch(() => {
        setStatus('error')
        setMsg('Tidak dapat terhubung ke server ZPrint')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' ? (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Menghubungkan akun dari Z One...</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">
              <i className="bi bi-x-circle-fill text-red-500"></i>
            </div>
            <p className="text-red-600 font-medium mb-2">Gagal Login</p>
            <p className="text-gray-500 text-sm mb-4">{msg}</p>
            <a href="https://zone.zomet.my.id" className="text-blue-600 text-sm underline">
              Kembali ke Z One
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function SsoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SsoContent />
    </Suspense>
  )
}

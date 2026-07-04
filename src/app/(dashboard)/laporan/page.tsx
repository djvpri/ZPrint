'use client'

import { useEffect, useState } from 'react'

interface Harian { tgl: string; jumlah: number }
interface ProdukTerlaris { nama: string; qty: number; total: number }
interface LaporanData {
  totalPendapatan: number
  totalOrder: number
  orderSelesai: number
  orderBatal: number
  harian: Harian[]
  produkTerlaris: ProdukTerlaris[]
}

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function LaporanPage() {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [data, setData] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async (b = bulan, t = tahun) => {
    setLoading(true)
    const r = await fetch(`/api/laporan?bulan=${b}&tahun=${t}`)
    if (r.ok) setData(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleChange = (b: number, t: number) => { setBulan(b); setTahun(t); load(b, t) }

  const maxHarian = data ? Math.max(...data.harian.map(h => h.jumlah), 1) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <div className="flex gap-2">
          <select value={bulan} onChange={e => handleChange(Number(e.target.value), tahun)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={tahun} onChange={e => handleChange(bulan, Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Memuat data...</p>}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-600 mt-1">Rp{data.totalPendapatan.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500">Total Order</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.totalOrder}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500">Selesai</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{data.orderSelesai}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500">Dibatal</p>
              <p className="text-xl font-bold text-red-500 mt-1">{data.orderBatal}</p>
            </div>
          </div>

          {/* Harian bar chart (simple CSS) */}
          {data.harian.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Pendapatan Harian</h2>
              <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                {data.harian.map(h => {
                  const pct = Math.round((h.jumlah / maxHarian) * 100)
                  return (
                    <div key={h.tgl} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '2rem' }}>
                      <span className="text-xs text-gray-500 truncate" style={{ fontSize: '9px' }}>
                        Rp{(h.jumlah / 1000).toFixed(0)}k
                      </span>
                      <div className="w-6 bg-blue-500 rounded-t" style={{ height: `${Math.max(pct, 2)}%` }} title={`Rp${h.jumlah.toLocaleString()}`}></div>
                      <span className="text-xs text-gray-400" style={{ fontSize: '8px' }}>{h.tgl.split('-')[2]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Produk terlaris */}
          {data.produkTerlaris.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">Produk Terlaris</div>
              {data.produkTerlaris.map((p, i) => (
                <div key={p.nama} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.nama}</p>
                      <p className="text-xs text-gray-500">Qty: {p.qty}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600 text-sm">Rp{p.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {data.harian.length === 0 && data.produkTerlaris.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
              Belum ada data untuk periode ini.
            </div>
          )}
        </>
      )}
    </div>
  )
}

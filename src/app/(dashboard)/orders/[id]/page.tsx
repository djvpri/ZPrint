'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Pembayaran { id: string; jumlah: number; metode: string; tipe: string; createdAt: string }
interface OrderItem { id: string; namaItem: string; qty: number; lebar: number | null; tinggi: number | null; satuan: string; hargaSatuan: number; subtotal: number }
interface OrderDetail {
  id: string; noOrder: string; status: string; subtotal: number; diskon: number; total: number; dp: number; sisa: number; catatan: string | null; fileUrl: string | null; createdAt: string
  pelanggan: { nama: string; noHp: string | null } | null
  items: OrderItem[]
  pembayarans: Pembayaran[]
}

const STATUS_COLORS: Record<string, string> = {
  MENUNGGU: 'bg-yellow-100 text-yellow-700',
  PROSES: 'bg-blue-100 text-blue-700',
  SELESAI: 'bg-green-100 text-green-700',
  BATAL: 'bg-red-100 text-red-700',
}
const STATUS_FLOW: Record<string, string[]> = {
  MENUNGGU: ['PROSES', 'BATAL'],
  PROSES: ['SELESAI', 'BATAL'],
  SELESAI: [],
  BATAL: [],
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [bayarJumlah, setBayarJumlah] = useState('')
  const [bayarMetode, setBayarMetode] = useState('TUNAI')
  const [loadingStatus, setLoadingStatus] = useState('')
  const [loadingBayar, setLoadingBayar] = useState(false)

  const load = async () => {
    const r = await fetch(`/api/orders/${id}`)
    if (r.ok) setOrder(await r.json())
    else { toast.error('Order tidak ditemukan'); router.push('/orders') }
  }

  useEffect(() => { load() }, [id])

  const handleStatus = async (status: string) => {
    if (!confirm(`Ubah status ke ${status}?`)) return
    setLoadingStatus(status)
    const r = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    const d = await r.json()
    setLoadingStatus('')
    if (r.ok) { toast.success(`Status diubah ke ${status}`); load() }
    else { toast.error(d.error || 'Gagal ubah status') }
  }

  const handleBayar = async (e: React.FormEvent) => {
    e.preventDefault()
    const jumlah = parseFloat(bayarJumlah)
    if (!jumlah || jumlah <= 0) { toast.error('Jumlah tidak valid'); return }
    setLoadingBayar(true)
    const r = await fetch(`/api/orders/${id}/bayar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jumlah, metode: bayarMetode }),
    })
    const d = await r.json()
    setLoadingBayar(false)
    if (r.ok) { toast.success('Pembayaran dicatat'); setBayarJumlah(''); load() }
    else { toast.error(d.error || 'Gagal catat pembayaran') }
  }

  if (!order) return <div className="flex items-center justify-center h-full"><div className="text-gray-500">Memuat...</div></div>

  const nextStatuses = STATUS_FLOW[order.status] || []

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600"><i className="bi bi-arrow-left text-xl"></i></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.noOrder}</h1>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('id', { dateStyle: 'long' })}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status]}`}>{order.status}</span>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
        {order.pelanggan && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pelanggan</span>
            <span className="font-medium text-gray-900">{order.pelanggan.nama} {order.pelanggan.noHp ? `(${order.pelanggan.noHp})` : ''}</span>
          </div>
        )}
        {order.catatan && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Catatan</span>
            <span className="font-medium text-gray-900">{order.catatan}</span>
          </div>
        )}
        {order.fileUrl && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">File</span>
            <a href={order.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat File</a>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">Item Pesanan</div>
        {order.items.map(item => (
          <div key={item.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">{item.namaItem}</span>
              <span className="font-semibold text-gray-900">Rp{item.subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.satuan === 'm2' ? `${item.lebar}m × ${item.tinggi}m × Rp${item.hargaSatuan.toLocaleString()}/m²` :
               item.satuan === 'meter' ? `${item.qty}m × Rp${item.hargaSatuan.toLocaleString()}/m` :
               `${item.qty}pcs × Rp${item.hargaSatuan.toLocaleString()}`}
            </p>
          </div>
        ))}
        <div className="px-4 py-3 space-y-1 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>Rp{order.subtotal.toLocaleString()}</span>
          </div>
          {order.diskon > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Diskon</span>
              <span className="text-red-500">-Rp{order.diskon.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>Rp{order.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Sudah dibayar</span>
            <span>Rp{order.dp.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-red-600">
            <span>Sisa</span>
            <span>Rp{order.sisa.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Ubah Status:</p>
          <div className="flex gap-2">
            {nextStatuses.map(s => (
              <button key={s} onClick={() => handleStatus(s)} disabled={!!loadingStatus}
                className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${s === 'BATAL' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {loadingStatus === s ? 'Menyimpan...' : s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pembayaran */}
      {order.sisa > 0 && order.status !== 'BATAL' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Catat Pembayaran</h2>
          <form onSubmit={handleBayar} className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Jumlah (max Rp{order.sisa.toLocaleString()})</label>
              <input required type="number" min="1" max={order.sisa} value={bayarJumlah} onChange={e => setBayarJumlah(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Metode</label>
              <select value={bayarMetode} onChange={e => setBayarMetode(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="TUNAI">Tunai</option>
                <option value="TRANSFER">Transfer</option>
                <option value="QRIS">QRIS</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={loadingBayar}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {loadingBayar ? 'Mencatat...' : 'Catat Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Riwayat pembayaran */}
      {order.pembayarans.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">Riwayat Pembayaran</div>
          {order.pembayarans.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.metode} · {p.tipe}</p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('id')}</p>
              </div>
              <p className="font-semibold text-green-600">Rp{p.jumlah.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Pelanggan { id: string; nama: string }
interface Order {
  id: string
  noOrder: string
  status: string
  total: number
  dp: number
  sisa: number
  createdAt: string
  pelanggan: Pelanggan | null
}

const STATUS_COLORS: Record<string, string> = {
  MENUNGGU: 'bg-yellow-100 text-yellow-700',
  PROSES: 'bg-blue-100 text-blue-700',
  SELESAI: 'bg-green-100 text-green-700',
  BATAL: 'bg-red-100 text-red-700',
}

interface Produk { id: string; nama: string; kode: string | null; hargaSatuan: number | null; hargaPerMeter: number | null; hargaPerM2: number | null; kategori: { nama: string } }

interface OrderItem {
  produkId: string
  namaItem: string
  qty: number
  lebar?: number
  tinggi?: number
  satuan: string
  hargaSatuan: number
  subtotal: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([])
  const [produkList, setProdukList] = useState<Produk[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    pelangganId: '', catatan: '', diskon: '0', dp: '0',
  })
  const [items, setItems] = useState<OrderItem[]>([])

  const loadOrders = async (p = page, status = filterStatus) => {
    const url = `/api/orders?page=${p}&limit=20${status ? `&status=${status}` : ''}`
    const r = await fetch(url)
    if (r.ok) { const d = await r.json(); setOrders(d.orders); setTotal(d.total) }
  }

  const loadPelanggan = async () => {
    const r = await fetch('/api/pelanggan')
    if (r.ok) setPelangganList(await r.json())
  }

  const loadProduk = async () => {
    const r = await fetch('/api/produk')
    if (r.ok) setProdukList(await r.json())
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOrders() }, [])

  const handleFilterStatus = (s: string) => { setFilterStatus(s); setPage(1); loadOrders(1, s) }
  const handlePage = (p: number) => { setPage(p); loadOrders(p) }

  const openCreate = async () => {
    await Promise.all([loadPelanggan(), loadProduk()])
    setForm({ pelangganId: '', catatan: '', diskon: '0', dp: '0' })
    setItems([])
    setShowCreate(true)
  }

  const addItem = () => {
    if (produkList.length === 0) return
    const p = produkList[0]
    const satuan = p.hargaPerM2 ? 'm2' : p.hargaPerMeter ? 'meter' : 'pcs'
    setItems(prev => [...prev, {
      produkId: p.id, namaItem: p.nama, qty: 1, lebar: satuan === 'm2' ? 1 : undefined,
      tinggi: satuan === 'm2' ? 1 : undefined, satuan,
      hargaSatuan: p.hargaPerM2 || p.hargaPerMeter || p.hargaSatuan || 0,
      subtotal: p.hargaPerM2 || p.hargaPerMeter || p.hargaSatuan || 0,
    }])
  }

  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value }
      if (field === 'produkId') {
        const p = produkList.find(x => x.id === value)
        if (p) {
          const satuan = p.hargaPerM2 ? 'm2' : p.hargaPerMeter ? 'meter' : 'pcs'
          item.namaItem = p.nama
          item.satuan = satuan
          item.hargaSatuan = p.hargaPerM2 || p.hargaPerMeter || p.hargaSatuan || 0
        }
      }
      // Recalc subtotal
      const qty = Number(item.qty) || 1
      const lebar = Number(item.lebar) || 1
      const tinggi = Number(item.tinggi) || 1
      const h = Number(item.hargaSatuan) || 0
      item.subtotal = item.satuan === 'm2' ? h * lebar * tinggi : item.satuan === 'meter' ? h * qty : h * qty
      next[idx] = item
      return next
    })
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotalAll = items.reduce((a, b) => a + b.subtotal, 0)
  const diskon = parseFloat(form.diskon) || 0
  const totalFinal = subtotalAll - diskon
  const dp = parseFloat(form.dp) || 0

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Tambahkan minimal 1 item'); return }
    setLoading(true)
    const body = {
      pelangganId: form.pelangganId || null,
      catatan: form.catatan || null,
      diskon, dp,
      items: items.map(i => ({
        produkId: i.produkId, namaItem: i.namaItem, qty: Number(i.qty),
        lebar: i.lebar ? Number(i.lebar) : null,
        tinggi: i.tinggi ? Number(i.tinggi) : null,
        satuan: i.satuan, hargaSatuan: Number(i.hargaSatuan), subtotal: Number(i.subtotal),
      })),
    }
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    setLoading(false)
    if (r.ok) { toast.success(`Order ${d.noOrder} dibuat`); setShowCreate(false); loadOrders() }
    else { toast.error(d.error || 'Gagal buat order') }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pesanan</h1>
        <button onClick={openCreate} className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <i className="bi bi-plus-lg mr-1"></i> <span className="hidden sm:inline">Buat </span>Pesanan
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'MENUNGGU', 'PROSES', 'SELESAI', 'BATAL'].map(s => (
          <button key={s} onClick={() => handleFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {s || 'Semua'}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Buat Pesanan Baru</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Pelanggan</label>
                <select value={form.pelangganId} onChange={e => setForm(f => ({ ...f, pelangganId: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Tanpa pelanggan --</option>
                  {pelangganList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Catatan</label>
                <input value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Item Pesanan</label>
                <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Tambah Item</button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const isM2 = item.satuan === 'm2'
                  const isMeter = item.satuan === 'meter'
                  return (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                      <div className="col-span-2 md:col-span-2">
                        <label className="text-xs text-gray-500">Produk</label>
                        <select value={item.produkId} onChange={e => updateItem(idx, 'produkId', e.target.value)}
                          className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                          {produkList.map(pr => <option key={pr.id} value={pr.id}>{pr.nama}</option>)}
                        </select>
                      </div>
                      {isM2 ? (
                        <>
                          <div>
                            <label className="text-xs text-gray-500">Lebar (m)</label>
                            <input type="number" step="0.01" min="0.01" value={item.lebar || ''} onChange={e => updateItem(idx, 'lebar', e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Tinggi (m)</label>
                            <input type="number" step="0.01" min="0.01" value={item.tinggi || ''} onChange={e => updateItem(idx, 'tinggi', e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs text-gray-500">Qty {isMeter ? '(m)' : '(pcs)'}</label>
                            <input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Harga</label>
                            <input type="number" min="0" value={item.hargaSatuan} onChange={e => updateItem(idx, 'hargaSatuan', e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          </div>
                        </>
                      )}
                                  <div className="col-span-2 md:col-span-4 flex items-center justify-between pt-1 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Subtotal: Rp{item.subtotal.toLocaleString()}</span>
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-xs hover:underline flex items-center gap-1"><i className="bi bi-trash" /> Hapus</button>
                      </div>
                    </div>
                  )
                })}
                {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada item. Klik Tambah Item.</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Diskon (Rp)</label>
                <input type="number" min="0" value={form.diskon} onChange={e => setForm(f => ({ ...f, diskon: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">DP (Rp)</label>
                <input type="number" min="0" value={form.dp} onChange={e => setForm(f => ({ ...f, dp: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 bg-gray-50 rounded-lg px-3 py-2.5">
                <p className="text-sm text-gray-500">Subtotal: <span className="font-medium text-gray-900">Rp{subtotalAll.toLocaleString()}</span></p>
                <p className="text-base font-bold text-gray-900 mt-0.5">Total: Rp{Math.max(0, totalFinal).toLocaleString()}</p>
                {dp > 0 && <p className="text-sm text-green-600">Sisa: Rp{Math.max(0, totalFinal - dp).toLocaleString()}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Buat Pesanan'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {orders.length === 0
          ? <p className="text-center text-gray-500 py-10">Belum ada pesanan</p>
          : orders.map(o => (
            <Link key={o.id} href={`/orders/${o.id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-gray-900">{o.noOrder}</p>
                <p className="text-sm text-gray-500">{o.pelanggan?.nama || 'Umum'} · {new Date(o.createdAt).toLocaleDateString('id')}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">Rp{o.total.toLocaleString()}</p>
                {o.sisa > 0 && <p className="text-xs text-red-500">Sisa Rp{o.sisa.toLocaleString()}</p>}
              </div>
            </Link>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => handlePage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

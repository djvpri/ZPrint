'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface KategoriProduk { id: string; nama: string }
interface Produk {
  id: string
  nama: string
  kode: string | null
  hargaSatuan: number | null
  hargaPerMeter: number | null
  hargaPerM2: number | null
  kategori: KategoriProduk
}

type PricingMode = 'satuan' | 'meter' | 'm2'

const modeLabels: Record<PricingMode, string> = { satuan: 'Per Pcs', meter: 'Per Meter', m2: 'Per M²' }

function hargaDisplay(p: Produk): string {
  if (p.hargaPerM2) return `Rp${p.hargaPerM2.toLocaleString()}/m²`
  if (p.hargaPerMeter) return `Rp${p.hargaPerMeter.toLocaleString()}/m`
  if (p.hargaSatuan) return `Rp${p.hargaSatuan.toLocaleString()}/pcs`
  return '—'
}

export default function ProdukPage() {
  const [produk, setProduk] = useState<Produk[]>([])
  const [kategori, setKategori] = useState<KategoriProduk[]>([])
  const [filterKat, setFilterKat] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Produk | null>(null)
  const [mode, setMode] = useState<PricingMode>('satuan')
  const [form, setForm] = useState({ nama: '', kode: '', kategoriId: '', harga: '' })
  const [showKatForm, setShowKatForm] = useState(false)
  const [katNama, setKatNama] = useState('')

  const loadProduk = async (katId = filterKat) => {
    const url = katId ? `/api/produk?kategoriId=${katId}` : '/api/produk'
    const r = await fetch(url)
    if (r.ok) setProduk(await r.json())
  }
  const loadKategori = async () => {
    const r = await fetch('/api/kategori')
    if (r.ok) setKategori(await r.json())
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadKategori(); loadProduk() }, [])

  const handleFilterKat = (v: string) => { setFilterKat(v); loadProduk(v) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const harga = parseFloat(form.harga) || null
    const body = {
      nama: form.nama, kode: form.kode || null, kategoriId: form.kategoriId,
      hargaSatuan: mode === 'satuan' ? harga : null,
      hargaPerMeter: mode === 'meter' ? harga : null,
      hargaPerM2: mode === 'm2' ? harga : null,
    }
    const url = editing ? `/api/produk/${editing.id}` : '/api/produk'
    const method = editing ? 'PATCH' : 'POST'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (r.ok) {
      toast.success(editing ? 'Produk diupdate' : 'Produk ditambahkan')
      setShowForm(false); setEditing(null); setForm({ nama: '', kode: '', kategoriId: '', harga: '' }); loadProduk()
    } else { toast.error(d.error || 'Gagal') }
  }

  const handleEdit = (p: Produk) => {
    setEditing(p)
    const m: PricingMode = p.hargaPerM2 ? 'm2' : p.hargaPerMeter ? 'meter' : 'satuan'
    setMode(m)
    setForm({ nama: p.nama, kode: p.kode || '', kategoriId: p.kategori.id, harga: String(p.hargaPerM2 || p.hargaPerMeter || p.hargaSatuan || '') })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    const r = await fetch(`/api/produk/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Dihapus'); loadProduk() }
    else { const d = await r.json(); toast.error(d.error || 'Gagal hapus') }
  }

  const handleAddKat = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await fetch('/api/kategori', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: katNama }) })
    if (r.ok) { toast.success('Kategori ditambahkan'); setKatNama(''); setShowKatForm(false); loadKategori() }
    else { const d = await r.json(); toast.error(d.error || 'Gagal') }
  }

  const openAdd = () => { setEditing(null); setMode('satuan'); setForm({ nama: '', kode: '', kategoriId: kategori[0]?.id || '', harga: '' }); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Produk</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowKatForm(!showKatForm)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            <i className="bi bi-tag mr-1"></i> Kategori
          </button>
          <button onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <i className="bi bi-plus-lg mr-1"></i> Tambah
          </button>
        </div>
      </div>

      {showKatForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Tambah Kategori</h2>
          <form onSubmit={handleAddKat} className="flex gap-2">
            <input required value={katNama} onChange={e => setKatNama(e.target.value)} placeholder="Nama kategori..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Simpan</button>
            <button type="button" onClick={() => setShowKatForm(false)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Batal</button>
          </form>
          {kategori.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {kategori.map(k => <span key={k.id} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{k.nama}</span>)}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => handleFilterKat('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${!filterKat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
          Semua
        </button>
        {kategori.map(k => (
          <button key={k.id} onClick={() => handleFilterKat(k.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filterKat === k.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {k.nama}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Nama Produk *</label>
              <input required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Kode Produk</label>
              <input value={form.kode} onChange={e => setForm(f => ({ ...f, kode: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Kategori *</label>
              <select required value={form.kategoriId} onChange={e => setForm(f => ({ ...f, kategoriId: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Pilih kategori</option>
                {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Mode Harga *</label>
              <div className="mt-1 flex gap-1">
                {(Object.keys(modeLabels) as PricingMode[]).map(m => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${mode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                    {modeLabels[m]}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Harga ({modeLabels[mode]}) *</label>
              <input required type="number" min="0" value={form.harga} onChange={e => setForm(f => ({ ...f, harga: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {produk.length === 0
          ? <p className="text-center text-gray-500 py-10">Belum ada produk</p>
          : produk.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{p.nama} {p.kode && <span className="text-xs text-gray-400">({p.kode})</span>}</p>
                <p className="text-sm text-gray-500">{p.kategori.nama} · {hargaDisplay(p)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="bi bi-pencil"></i></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><i className="bi bi-trash"></i></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

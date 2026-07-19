'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Pelanggan { id: string; nama: string; noHp: string | null; alamat: string | null }

export default function PelangganPage() {
  const [list, setList] = useState<Pelanggan[]>([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ nama: '', noHp: '', alamat: '' })
  const [editing, setEditing] = useState<Pelanggan | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = async (search = '') => {
    const r = await fetch(`/api/pelanggan?q=${search}`)
    setList(await r.json())
  }

  useEffect(() => { load() }, [])

  const handleSearch = (v: string) => { setQ(v); load(v) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const r = await fetch(`/api/pelanggan/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (r.ok) { toast.success('Berhasil diupdate'); setEditing(null); setShowForm(false); load(q) }
    } else {
      const r = await fetch('/api/pelanggan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (r.ok) { toast.success('Pelanggan ditambahkan'); setShowForm(false); setForm({ nama: '', noHp: '', alamat: '' }); load(q) }
      else { const d = await r.json(); toast.error(d.error || 'Gagal') }
    }
  }

  const handleEdit = (p: Pelanggan) => { setEditing(p); setForm({ nama: p.nama, noHp: p.noHp || '', alamat: p.alamat || '' }); setShowForm(true) }
  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pelanggan ini?')) return
    const r = await fetch(`/api/pelanggan/${id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Dihapus'); load(q) }
    else { const d = await r.json(); toast.error(d.error || 'Gagal hapus') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pelanggan</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ nama: '', noHp: '', alamat: '' }) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <i className="bi bi-plus-lg mr-1"></i> Tambah
        </button>
      </div>

      <input value={q} onChange={e => handleSearch(e.target.value)} placeholder="Cari nama / no HP..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Nama *</label>
              <input required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">No HP</label>
              <input value={form.noHp} onChange={e => setForm(f => ({ ...f, noHp: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Alamat</label>
              <input value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {list.length === 0
          ? <p className="text-center text-gray-500 py-10">Belum ada pelanggan</p>
          : list.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{p.nama}</p>
                <p className="text-sm text-gray-500">{[p.noHp, p.alamat].filter(Boolean).join(' · ') || '—'}</p>
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

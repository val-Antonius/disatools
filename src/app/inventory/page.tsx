'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import { ItemStatus, Item, Category, Location } from '@/types'

const getStatusColor = (status: ItemStatus) => {
  switch (status) {
    case ItemStatus.AVAILABLE:
      return 'text-green-600 bg-green-100'
    case ItemStatus.OUT_OF_STOCK:
      return 'text-red-600 bg-red-100'
    case ItemStatus.DISCONTINUED:
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

const getStockColor = (stock: number, minStock: number) => {
  if (stock === 0) return 'text-red-600'
  if (stock <= minStock) return 'text-yellow-600'
  return 'text-green-600'
}

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock: 0,
    minStock: 5,
    categoryId: '',
    locationId: ''
  })

  useEffect(() => {
    fetchItems()
    fetchCategories()
    fetchLocations()
  }, [])

  const fetchItems = async () => {
    setIsLoadingData(true)
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddItem = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      stock: 0,
      minStock: 5,
      categoryId: '',
      locationId: ''
    })
    setIsModalOpen(true)
  }

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      stock: item.stock,
      minStock: item.minStock,
      categoryId: item.categoryId || '',
      locationId: item.locationId || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchItems()
          alert('Item berhasil dihapus')
        } else {
          const error = await response.json()
          alert(error.error || 'Gagal menghapus item')
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Gagal menghapus item')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchItems()
        setIsModalOpen(false)
        alert(editingItem ? 'Item berhasil diperbarui' : 'Item berhasil ditambahkan')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Gagal menyimpan item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Barang</h1>
            <p className="text-gray-600 mt-1">
              Kelola inventaris barang di gudang
            </p>
          </div>
          <Button onClick={handleAddItem} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Tambah Barang</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari barang, kategori, atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Barang ({filteredItems.length})
            </h3>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Memuat data...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada barang</h3>
                <p className="text-gray-600 mb-4">Mulai dengan menambahkan barang pertama</p>
                <Button onClick={handleAddItem} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah Barang</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nama Barang</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Kategori</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Lokasi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Stok</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{item.category?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-700">{item.location?.name || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${getStockColor(item.stock, item.minStock)}`}>
                              {item.stock}
                            </span>
                            <span className="text-gray-500 text-sm">/ min {item.minStock}</span>
                            {item.stock <= item.minStock && item.stock > 0 && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status === ItemStatus.AVAILABLE ? 'Tersedia' :
                             item.status === ItemStatus.OUT_OF_STOCK ? 'Habis' : 'Dihentikan'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              disabled={isLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Barang"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Deskripsi"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stok"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                required
              />
              <Input
                label="Minimum Stok"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  required
                >
                  <option value="">Pilih Lokasi</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : (editingItem ? 'Update' : 'Tambah')} Barang
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default InventoryPage

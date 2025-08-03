'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Search, Grid3X3, List, Eye, Edit2, Trash2, Package, AlertTriangle, X, Check, Calendar, User, ChevronRight } from 'lucide-react'
import { ItemStatus, Item, Category, Location, ItemFormData, BorrowingFormData } from '@/types'

// Enhanced status system with visual indicators
const getStatusConfig = (status: ItemStatus, isLoaned = false) => {
  if (isLoaned) {
    return {
      label: 'Dipinjam',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dotColor: 'bg-yellow-400',
      bgColor: '#facc15'
    }
  }

  switch (status) {
    case ItemStatus.AVAILABLE:
      return {
        label: 'Tersedia',
        color: 'bg-green-100 text-green-800 border-green-200',
        dotColor: 'bg-green-400',
        bgColor: '#22c55e'
      }
    case ItemStatus.OUT_OF_STOCK:
      return {
        label: 'Perbaikan',
        color: 'bg-red-100 text-red-800 border-red-200',
        dotColor: 'bg-red-400',
        bgColor: '#ef4444'
      }
    case ItemStatus.DISCONTINUED:
      return {
        label: 'Pensiun',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        dotColor: 'bg-gray-400',
        bgColor: '#6b7280'
      }
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        dotColor: 'bg-gray-400',
        bgColor: '#6b7280'
      }
  }
}

// View modes
type ViewMode = 'table' | 'card'

// Sidebar panel types
type SidebarPanel = 'none' | 'add-item' | 'item-detail' | 'borrowing'

interface SidebarState {
  isOpen: boolean
  panel: SidebarPanel
  data?: any
}

const InventoryPage: React.FC = () => {
  // Existing states
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // New states for enhanced functionality
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sidebar, setSidebar] = useState<SidebarState>({ isOpen: false, panel: 'none' })
  const [editingField, setEditingField] = useState<{ itemId: string, field: string } | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Form data states
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    stock: 0,
    minStock: 5,
    categoryId: '',
    locationId: ''
  })

  const [borrowingData, setBorrowingData] = useState<BorrowingFormData>({
    borrowerName: '',
    purpose: '',
    expectedReturnDate: '',
    notes: '',
    items: []
  })

  useEffect(() => {
    fetchItems()
    fetchCategories()
    fetchLocations()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close sidebar
      if (e.key === 'Escape' && sidebar.isOpen) {
        closeSidebar()
      }

      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !sidebar.isOpen) {
        e.preventDefault()
        handleSelectAll(true)
      }

      // Ctrl/Cmd + D to deselect all
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedItems.size > 0) {
        e.preventDefault()
        setSelectedItems(new Set())
      }

      // Ctrl/Cmd + N to add new item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !sidebar.isOpen) {
        e.preventDefault()
        openSidebar('add-item')
      }

      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Cari"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebar.isOpen, selectedItems.size])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems((data.data as Item[]) || [])
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
        setCategories((data.data as Category[]) || [])
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
        setLocations((data.data as Location[]) || [])
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

  // Multi-select handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  // Sidebar handlers
  const openSidebar = (panel: SidebarPanel, data?: any) => {
    setSidebar({ isOpen: true, panel, data })
  }

  const closeSidebar = () => {
    setSidebar({ isOpen: false, panel: 'none', data: null })
    setFormData({
      name: '',
      description: '',
      stock: 0,
      minStock: 5,
      categoryId: '',
      locationId: ''
    })
    setBorrowingData({
      borrowerName: '',
      purpose: '',
      expectedReturnDate: '',
      notes: '',
      items: []
    })
  }

  // Utility function to get item statistics
  const getItemStats = () => {
    const total = filteredItems.length
    const available = filteredItems.filter(item =>
      item.status === ItemStatus.AVAILABLE &&
      !(item.borrowingItems && item.borrowingItems.some((bi: any) => bi.status === 'ACTIVE'))
    ).length
    const loaned = filteredItems.filter(item =>
      item.borrowingItems && item.borrowingItems.some((bi: any) => bi.status === 'ACTIVE')
    ).length
    const lowStock = filteredItems.filter(item =>
      item.stock <= item.minStock && item.stock > 0
    ).length
    const outOfStock = filteredItems.filter(item => item.stock === 0).length

    return { total, available, loaned, lowStock, outOfStock }
  }

  // Get smart actions based on selected items
  const getSmartActions = () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id))
    const availableItems = selectedItemsData.filter(item => item.status === ItemStatus.AVAILABLE)

    if (selectedItems.size === 0) return []

    const actions = []

    if (selectedItems.size === 1) {
      const item = selectedItemsData[0]
      const isLoaned = item.borrowingItems && item.borrowingItems.some((bi: any) => bi.status === 'ACTIVE')

      if (item.status === ItemStatus.AVAILABLE && !isLoaned) {
        actions.push({ label: 'Pinjamkan', action: 'loan', variant: 'primary' as const })
        actions.push({ label: 'Atur Perbaikan', action: 'maintenance', variant: 'secondary' as const })
      } else if (isLoaned) {
        actions.push({ label: 'Tandai Kembali', action: 'return', variant: 'primary' as const })
        actions.push({ label: 'Perpanjang', action: 'extend', variant: 'secondary' as const })
      }
    } else {
      if (availableItems.length === selectedItems.size) {
        actions.push({ label: 'Pinjamkan Item Terpilih', action: 'multi-loan', variant: 'primary' as const })
      }
      actions.push({ label: 'Edit Massal', action: 'bulk-edit', variant: 'secondary' as const })
    }

    actions.push({ label: 'Hapus', action: 'delete', variant: 'danger' as const })
    return actions
  }

  // Edit item handler
  const handleEditItem = async (itemId: string, updatedData: Partial<ItemFormData>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        await fetchItems()
        closeSidebar()
        alert('Item berhasil diperbarui')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal memperbarui item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Gagal memperbarui item')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete item handler
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus item "${itemName}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchItems()
        closeSidebar()
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

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id))
    const itemNames = selectedItemsData.map(item => item.name).join(', ')

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedItems.size} item berikut?\n\n${itemNames}\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setIsLoading(true)
    try {
      const deletePromises = Array.from(selectedItems).map(itemId =>
        fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)

      if (failedDeletes.length === 0) {
        await fetchItems()
        setSelectedItems(new Set())
        alert(`${selectedItems.size} item berhasil dihapus`)
      } else {
        alert(`${results.length - failedDeletes.length} item berhasil dihapus, ${failedDeletes.length} item gagal dihapus`)
        await fetchItems()
        setSelectedItems(new Set())
      }
    } catch (error) {
      console.error('Error bulk deleting items:', error)
      alert('Gagal menghapus item')
    } finally {
      setIsLoading(false)
    }
  }

  // Action handlers
  const handleAction = (action: string) => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id))

    switch (action) {
      case 'loan':
      case 'multi-loan':
        setBorrowingData({
          borrowerName: '',
          purpose: '',
          expectedReturnDate: '',
          notes: '',
          items: selectedItemsData.map(item => ({
            itemId: item.id,
            quantity: 1,
            notes: ''
          }))
        })
        openSidebar('borrowing', { items: selectedItemsData, type: 'loan' })
        break
      case 'return':
        // Handle return logic
        break
      case 'extend':
        // Handle extend logic
        break
      case 'maintenance':
        // Handle maintenance logic
        break
      case 'bulk-edit':
        // Handle bulk edit logic
        break
      case 'delete':
        handleBulkDelete()
        break
    }
  }

  // Card View Component
  const CardView: React.FC<{
    items: Item[]
    selectedItems: Set<string>
    onSelectItem: (itemId: string, checked: boolean) => void
    onOpenDetail: (item: Item) => void
  }> = ({ items, selectedItems, onSelectItem, onOpenDetail }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {items.map((item) => {
          const statusConfig = getStatusConfig(item.status,
            item.borrowingItems && item.borrowingItems.some((bi: any) => bi.status === 'ACTIVE')
          )
          const isSelected = selectedItems.has(item.id)

          return (
            <Card
              key={item.id}
              className={`glass hover:shadow-xl transition-all duration-300 relative group cursor-pointer transform hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => onSelectItem(item.id, !isSelected)}
            >
              <CardContent className="p-0">
                {/* Checkbox - Top Left */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      onSelectItem(item.id, e.target.checked)
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </div>

                {/* Status Indicator - Top Right */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Item Image */}
                <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl flex items-center justify-center overflow-hidden">
                  <Package className="h-16 w-16 text-gray-400 group-hover:text-gray-500 transition-colors" />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenDetail(item)
                        }}
                        className="bg-white/90 hover:bg-white shadow-lg"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-4 space-y-3">
                  {/* Item Name */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {item.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  {/* Category & Location */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-gray-600 font-medium">
                        {item.category?.name || 'Kategori tidak diketahui'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {item.location?.name || 'Lokasi tidak diketahui'}
                      </span>
                    </div>
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Stok:</span>
                      <span className={`text-sm font-semibold ${
                        item.stock === 0 ? 'text-red-600' :
                        item.stock <= item.minStock ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {item.stock}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Min: {item.minStock}
                    </div>
                  </div>

                  {/* Borrowing Info (if applicable) */}
                  {item.borrowingItems && item.borrowingItems.some((bi: any) => bi.status === 'ACTIVE') && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs text-yellow-800 font-medium">Sedang Dipinjam</span>
                      </div>
                      {item.borrowingItems
                        .filter((bi: any) => bi.status === 'ACTIVE')
                        .slice(0, 1)
                        .map((bi: any) => (
                          <div key={bi.id} className="mt-1">
                            <p className="text-xs text-yellow-700">
                              {bi.borrowing?.borrowerName || 'Peminjam tidak diketahui'}
                            </p>
                            <p className="text-xs text-yellow-600">
                              {bi.quantity} unit • {bi.borrowing?.purpose || 'Tujuan tidak diketahui'}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-5 rounded-xl pointer-events-none">
                    <div className="absolute bottom-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Table View Component
  const TableView: React.FC<{
    items: Item[]
    selectedItems: Set<string>
    onSelectAll: (checked: boolean) => void
    onSelectItem: (itemId: string, checked: boolean) => void
    onOpenDetail: (item: Item) => void
    editingField: { itemId: string, field: string } | null
    setEditingField: (field: { itemId: string, field: string } | null) => void
    hoveredItem: string | null
    setHoveredItem: (itemId: string | null) => void
    categories: Category[]
    onUpdateItem: () => void
  }> = ({
    items, selectedItems, onSelectAll, onSelectItem, onOpenDetail,
    editingField, setEditingField, hoveredItem, setHoveredItem,
    categories, onUpdateItem
  }) => {
    const allSelected = items.length > 0 && items.every(item => selectedItems.has(item.id))
    const someSelected = items.some(item => selectedItems.has(item.id))

    const handleInlineEdit = async (itemId: string, field: string, value: string) => {
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value })
        })
        if (response.ok) {
          onUpdateItem()
        }
      } catch (error) {
        console.error('Error updating item:', error)
      }
      setEditingField(null)
    }

    return (
      <Card className="glass">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected
                      }}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nama Item</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Kategori</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusConfig = getStatusConfig(item.status,
                    item.borrowingItems && item.borrowingItems.some((bi: any) => bi.status === 'ACTIVE')
                  )

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors relative"
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => onSelectItem(item.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            {editingField?.itemId === item.id && editingField?.field === 'name' ? (
                              <input
                                type="text"
                                defaultValue={item.name}
                                autoFocus
                                onBlur={(e) => handleInlineEdit(item.id, 'name', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInlineEdit(item.id, 'name', e.currentTarget.value)
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingField(null)
                                  }
                                }}
                                className="font-medium text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => setEditingField({ itemId: item.id, field: 'name' })}
                              >
                                {item.name}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {editingField?.itemId === item.id && editingField?.field === 'category' ? (
                          <select
                            defaultValue={item.categoryId}
                            autoFocus
                            onBlur={(e) => handleInlineEdit(item.id, 'categoryId', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineEdit(item.id, 'categoryId', e.currentTarget.value)
                              }
                              if (e.key === 'Escape') {
                                setEditingField(null)
                              }
                            }}
                            className="bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => setEditingField({ itemId: item.id, field: 'category' })}
                          >
                            {item.category?.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenDetail(item)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Detail</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Quick Preview on Hover - Outside table for proper HTML structure */}
        {hoveredItem && (
          <div className="fixed z-50 pointer-events-none">
            {(() => {
              const hoveredItemData = items.find(item => item.id === hoveredItem)
              if (!hoveredItemData) return null

              const statusConfig = getStatusConfig(hoveredItemData.status,
                hoveredItemData.borrowingItems && hoveredItemData.borrowingItems.some((bi: any) => bi.status === 'ACTIVE')
              )

              return (
                <div
                  className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-64 max-w-80"
                  style={{
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{hoveredItemData.name}</h4>
                      <p className="text-sm text-gray-500">{hoveredItemData.category?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{hoveredItemData.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                        <span className="text-xs text-gray-600">{statusConfig.label}</span>
                        <span className="text-xs text-gray-400">• Stok: {hoveredItemData.stock}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Card>
    )
  }

  // Contextual Sidebar Component
  const ContextualSidebar: React.FC<{
    sidebar: SidebarState
    onClose: () => void
    formData: ItemFormData
    setFormData: (data: ItemFormData) => void
    borrowingData: BorrowingFormData
    setBorrowingData: (data: BorrowingFormData) => void
    categories: Category[]
    locations: Location[]
    onSubmit: () => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    selectedItems: Set<string>
    setSelectedItems: (items: Set<string>) => void
  }> = ({
    sidebar, onClose, formData, setFormData, borrowingData, setBorrowingData,
    categories, locations, onSubmit, isLoading, setIsLoading, selectedItems, setSelectedItems
  }) => {
    // Local state untuk edit mode
    const [editFormData, setEditFormData] = useState<ItemFormData>({
      name: '',
      description: '',
      stock: 0,
      minStock: 5,
      categoryId: '',
      locationId: ''
    })

    const [isEditMode, setIsEditMode] = useState(false)

    // Initialize edit form data when sidebar opens with item detail
    useEffect(() => {
      if (sidebar.panel === 'item-detail' && sidebar.data) {
        setEditFormData({
          name: sidebar.data.name || '',
          description: sidebar.data.description || '',
          stock: sidebar.data.stock || 0,
          minStock: sidebar.data.minStock || 5,
          categoryId: sidebar.data.categoryId || '',
          locationId: sidebar.data.locationId || ''
        })
        setIsEditMode(false)
      }
    }, [sidebar.panel, sidebar.data])

    if (!sidebar.isOpen) return null

    const handleSubmitItem = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          onSubmit()
          onClose()
          alert('Item berhasil ditambahkan')
        } else {
          const error = await response.json()
          alert(error.error || 'Gagal menambahkan item')
        }
      } catch (error) {
        console.error('Error adding item:', error)
        alert('Gagal menambahkan item')
      } finally {
        setIsLoading(false)
      }
    }

    const handleSubmitBorrowing = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        const response = await fetch('/api/borrowings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(borrowingData)
        })

        if (response.ok) {
          onSubmit()
          onClose()
          setSelectedItems(new Set()) // Clear selection
          alert('Peminjaman berhasil dibuat')
        } else {
          const error = await response.json()
          alert(error.error || 'Gagal membuat peminjaman')
        }
      } catch (error) {
        console.error('Error creating borrowing:', error)
        alert('Gagal membuat peminjaman')
      } finally {
        setIsLoading(false)
      }
    }

    const handleSubmitEdit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!sidebar.data?.id) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/items/${sidebar.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        })

        if (response.ok) {
          onSubmit()
          setIsEditMode(false)
          alert('Item berhasil diperbarui')
        } else {
          const error = await response.json()
          alert(error.error || 'Gagal memperbarui item')
        }
      } catch (error) {
        console.error('Error updating item:', error)
        alert('Gagal memperbarui item')
      } finally {
        setIsLoading(false)
      }
    }

    const handleCancelEdit = () => {
      setIsEditMode(false)
      // Reset form data
      if (sidebar.data) {
        setEditFormData({
          name: sidebar.data.name || '',
          description: sidebar.data.description || '',
          stock: sidebar.data.stock || 0,
          minStock: sidebar.data.minStock || 5,
          categoryId: sidebar.data.categoryId || '',
          locationId: sidebar.data.locationId || ''
        })
      }
    }

    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300 animate-slide-up">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {sidebar.panel === 'add-item' && 'Tambah Item Baru'}
              {sidebar.panel === 'item-detail' && 'Detail Item'}
              {sidebar.panel === 'borrowing' && 'Pinjam Barang'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sidebar.panel === 'add-item' && 'Tambahkan item baru ke inventaris'}
              {sidebar.panel === 'item-detail' && 'Informasi lengkap tentang item'}
              {sidebar.panel === 'borrowing' && 'Buat transaksi peminjaman baru'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto h-full pb-20">
          {sidebar.panel === 'add-item' && (
            <div className="p-6">
              <form onSubmit={handleSubmitItem} className="space-y-6">
                {/* Item Image Upload Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Item</label>
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Klik untuk upload gambar</p>
                      <p className="text-xs text-gray-400">PNG, JPG hingga 5MB</p>
                    </div>
                  </div>
                </div>

                <Input
                  key="add-item-name"
                  label="Nama Item"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Masukkan nama item"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    key="add-item-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi item (opsional)"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    key="add-item-stock"
                    label="Stok"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    placeholder="0"
                  />
                  <Input
                    key="add-item-minstock"
                    label="Minimum Stok"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    key="add-item-category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                  <select
                    key="add-item-location"
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    loading={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                </div>
              </form>
            </div>
          )}

          {sidebar.panel === 'item-detail' && sidebar.data && (
            <div className="p-6 space-y-6">
              {/* Item Image */}
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>

              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? 'Edit Item' : 'Detail Item'}
                </h3>
                {!isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center space-x-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </Button>
                )}
              </div>

              {isEditMode ? (
                /* Edit Form */
                <form onSubmit={handleSubmitEdit} className="space-y-4">
                  <Input
                    key={`edit-item-name-${sidebar.data?.id}`}
                    label="Nama Item"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    placeholder="Masukkan nama item"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Deskripsi item (opsional)"
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Stok"
                      type="number"
                      value={editFormData.stock}
                      onChange={(e) => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                    />
                    <Input
                      label="Minimum Stok"
                      type="number"
                      value={editFormData.minStock}
                      onChange={(e) => setEditFormData({ ...editFormData, minStock: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      value={editFormData.categoryId}
                      onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                    <select
                      value={editFormData.locationId}
                      onChange={(e) => setEditFormData({ ...editFormData, locationId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Lokasi</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      type="submit"
                      loading={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{sidebar.data.name}</h3>
                    <p className="text-gray-600 mt-1">{sidebar.data.description || 'Tidak ada deskripsi'}</p>
                  </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">ID Item</span>
                    <span className="text-gray-900 font-mono text-xs">{sidebar.data.id}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Kategori</span>
                    <span className="text-gray-900">{sidebar.data.category?.name}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Lokasi</span>
                    <span className="text-gray-900">{sidebar.data.location?.name}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Stok</span>
                    <span className={`font-semibold ${
                      sidebar.data.stock === 0 ? 'text-red-600' :
                      sidebar.data.stock <= sidebar.data.minStock ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {sidebar.data.stock} / Min: {sidebar.data.minStock}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <span className="font-medium text-gray-700 block mb-2">Status Saat Ini</span>
                  {(() => {
                    const statusConfig = getStatusConfig(sidebar.data.status,
                      sidebar.data.borrowingItems && sidebar.data.borrowingItems.some((bi: any) => bi.status === 'ACTIVE')
                    )
                    return (
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${statusConfig.dotColor}`}></div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Borrowing Info */}
                {sidebar.data.borrowingItems && sidebar.data.borrowingItems.some((bi: any) => bi.status === 'ACTIVE') && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Informasi Peminjaman</h4>
                    {sidebar.data.borrowingItems
                      .filter((bi: any) => bi.status === 'ACTIVE')
                      .map((bi: any) => (
                        <div key={bi.id} className="space-y-1">
                          <p className="text-sm text-yellow-700">
                            <span className="font-medium">Peminjam:</span> {bi.borrowing?.borrowerName || 'Tidak diketahui'}
                          </p>
                          <p className="text-sm text-yellow-700">
                            <span className="font-medium">Tujuan:</span> {bi.borrowing?.purpose || 'Tidak diketahui'}
                          </p>
                          <p className="text-sm text-yellow-700">
                            <span className="font-medium">Jumlah:</span> {bi.quantity} unit
                          </p>
                          <p className="text-sm text-yellow-700">
                            <span className="font-medium">Jatuh Tempo:</span> {
                              bi.borrowing?.expectedReturnDate ?
                              new Date(bi.borrowing.expectedReturnDate).toLocaleDateString('id-ID') :
                              'Tidak diketahui'
                            }
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Action Buttons - Only show in view mode */}
              {!isEditMode && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="danger"
                    className="w-full"
                    loading={isLoading}
                    onClick={() => handleDeleteItem(sidebar.data.id, sidebar.data.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Item
                  </Button>
                </div>
              )}
            )}
            </div>
          )}

          {sidebar.panel === 'borrowing' && (
            <div className="p-6">
              <form onSubmit={handleSubmitBorrowing} className="space-y-6">
                {/* Items to borrow */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Item yang akan dipinjam
                  </h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {sidebar.data?.items?.map((item: Item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category?.name} • Stok: {item.stock}</div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">1 unit</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Input
                  key="borrowing-borrower-name"
                  label="Nama Peminjam"
                  value={borrowingData.borrowerName}
                  onChange={(e) => setBorrowingData({ ...borrowingData, borrowerName: e.target.value })}
                  required
                  placeholder="Masukkan nama peminjam"
                />

                <Input
                  key="borrowing-purpose"
                  label="Tujuan Peminjaman"
                  value={borrowingData.purpose}
                  onChange={(e) => setBorrowingData({ ...borrowingData, purpose: e.target.value })}
                  required
                  placeholder="Untuk apa item ini dipinjam?"
                />

                <Input
                  key="borrowing-return-date"
                  label="Tanggal Pengembalian"
                  type="date"
                  value={borrowingData.expectedReturnDate}
                  onChange={(e) => setBorrowingData({ ...borrowingData, expectedReturnDate: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    key="borrowing-notes"
                    value={borrowingData.notes}
                    onChange={(e) => setBorrowingData({ ...borrowingData, notes: e.target.value })}
                    placeholder="Catatan tambahan untuk peminjaman ini"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    loading={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Konfirmasi Peminjaman
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebar.isOpen ? 'mr-96' : ''}`}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Inventaris</h1>
              <p className="text-gray-600 mt-1">
                Kelola inventaris barang dengan sistem yang terintegrasi
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="px-3 py-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="px-3 py-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={() => openSidebar('add-item')}
                className="flex items-center space-x-2"
                title="Tambah Item Baru (Ctrl+N)"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Item</span>
              </Button>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {(() => {
                  const stats = getItemStats()
                  return (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Total: <span className="font-semibold text-gray-900">{stats.total}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Tersedia: <span className="font-semibold text-green-600">{stats.available}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Dipinjam: <span className="font-semibold text-yellow-600">{stats.loaned}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Stok Rendah: <span className="font-semibold text-orange-600">{stats.lowStock}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Habis: <span className="font-semibold text-red-600">{stats.outOfStock}</span></span>
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="text-sm text-gray-500">
                {selectedItems.size > 0 && `${selectedItems.size} item terpilih`}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 bg-white">
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
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
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
                <Button onClick={() => openSidebar('add-item')} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah Barang</span>
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'table' ? (
                  <TableView
                    items={filteredItems}
                    selectedItems={selectedItems}
                    onSelectAll={handleSelectAll}
                    onSelectItem={handleSelectItem}
                    onOpenDetail={(item) => openSidebar('item-detail', item)}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    hoveredItem={hoveredItem}
                    setHoveredItem={setHoveredItem}
                    categories={categories}
                    onUpdateItem={fetchItems}
                  />
                ) : (
                  <CardView
                    items={filteredItems}
                    selectedItems={selectedItems}
                    onSelectItem={handleSelectItem}
                    onOpenDetail={(item) => openSidebar('item-detail', item)}
                  />
                )}
              </>
            )}
          </div>

          {/* Floating Action Panel */}
          {selectedItems.size > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 floating-panel">
              <Card className="glass shadow-2xl border-gray-300 selection-ring">
                <CardContent className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-white">{selectedItems.size}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          {selectedItems.size} item terpilih
                        </span>
                        <div className="text-xs text-gray-500">
                          {getSmartActions().length} aksi tersedia
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getSmartActions().map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant}
                          size="sm"
                          onClick={() => handleAction(action.action)}
                          className="shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          {action.action === 'loan' && <User className="h-4 w-4 mr-1" />}
                          {action.action === 'multi-loan' && <User className="h-4 w-4 mr-1" />}
                          {action.action === 'return' && <Check className="h-4 w-4 mr-1" />}
                          {action.action === 'maintenance' && <AlertTriangle className="h-4 w-4 mr-1" />}
                          {action.action === 'bulk-edit' && <Edit2 className="h-4 w-4 mr-1" />}
                          {action.action === 'delete' && <Trash2 className="h-4 w-4 mr-1" />}
                          {action.label}
                        </Button>
                      ))}

                      <div className="w-px h-6 bg-gray-300 mx-2"></div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItems(new Set())}
                        className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Batal pilih semua"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Contextual Sidebar */}
        <ContextualSidebar
          sidebar={sidebar}
          onClose={closeSidebar}
          formData={formData}
          setFormData={setFormData}
          borrowingData={borrowingData}
          setBorrowingData={setBorrowingData}
          categories={categories}
          locations={locations}
          onSubmit={fetchItems}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
      </div>
    </AppLayout>
  )
}

export default InventoryPage

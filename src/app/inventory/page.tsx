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
type SidebarPanel = 'none' | 'add-item' | 'item-detail' | 'borrowing' | 'edit-item';

interface SidebarState {
  isOpen: boolean;
  panel: SidebarPanel;
  data?: any;
}

// Combined and Enhanced Contextual Sidebar
const ContextualSidebar = ({
  sidebar,
  onClose,
  formData,
  setFormData,
  categories,
  locations,
  handleCreateItem,
  handleEditItem,
  borrowingData,
  setBorrowingData,
  handleSubmitBorrowing,
  handleDeleteItem,
  isLoading,
  openSidebar,
}: {
  sidebar: SidebarState;
  onClose: () => void;
  openSidebar: (panel: SidebarPanel, data?: any) => void;
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  categories: Category[];
  locations: Location[];
  handleCreateItem: (e: React.FormEvent) => void;
  handleEditItem: (e: React.FormEvent) => void;
  borrowingData: BorrowingFormData;
  setBorrowingData: React.Dispatch<React.SetStateAction<BorrowingFormData>>;
  handleSubmitBorrowing: (e: React.FormEvent) => void;
  handleDeleteItem: (itemId: string, itemName: string) => void;
  isLoading: boolean;
}) => {
  if (!sidebar.isOpen) return null;

  const isEditMode = sidebar.panel === 'edit-item';
  const panelTitle = {
    'add-item': 'Tambah Item Baru',
    'edit-item': 'Edit Item',
    'item-detail': 'Detail Item',
    'borrowing': 'Pinjam Item',
    'none': '',
  };

  const renderPanelContent = () => {
    switch (sidebar.panel) {
      case 'add-item':
      case 'edit-item':
        return (
          <form onSubmit={isEditMode ? handleEditItem : handleCreateItem} className="space-y-4">
            <Input label="Nama Item" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <Input label="Stok" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })} required />
            <Input label="Stok Minimum" type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })} required />
            {/* Select for Category and Location would be here */}
            <Button type="submit" loading={isLoading} className="w-full">{isEditMode ? 'Simpan Perubahan' : 'Tambah Item'}</Button>
          </form>
        );
      case 'item-detail':
        const item = sidebar.data as Item;
        if (!item) return null;
        const isLoaned = item.borrowings && item.borrowings.some(b => b.status === 'ACTIVE');
        const statusConfig = getStatusConfig(item.status, isLoaned);
        return (
          <div>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <div className="mt-4 space-y-2">
                <p><strong>Kategori:</strong> {item.category?.name}</p>
                <p><strong>Lokasi:</strong> {item.location?.name}</p>
                <p><strong>Stok:</strong> {item.stock} / {item.minStock}</p>
                <p><strong>Status:</strong> <span className={statusConfig.color}>{statusConfig.label}</span></p>
            </div>
            <div className="mt-4 pt-4 border-t">
                <Button onClick={() => openSidebar('edit-item', item)} className="w-full mb-2">Edit</Button>
                <Button variant="danger" onClick={() => handleDeleteItem(item.id, item.name)} className="w-full">Hapus</Button>
            </div>
          </div>
        );
      case 'borrowing':
        return (
          <form onSubmit={handleSubmitBorrowing} className="space-y-4">
            <Input label="Nama Peminjam" value={borrowingData.borrowerName} onChange={(e) => setBorrowingData({ ...borrowingData, borrowerName: e.target.value })} required />
            <Input label="Tujuan" value={borrowingData.purpose} onChange={(e) => setBorrowingData({ ...borrowingData, purpose: e.target.value })} required />
            <Input label="Tanggal Kembali" type="date" value={borrowingData.expectedReturnDate} onChange={(e) => setBorrowingData({ ...borrowingData, expectedReturnDate: e.target.value })} required />
            <Button type="submit" loading={isLoading} className="w-full">Konfirmasi Peminjaman</Button>
          </form>
        );
      default:
        return <p>Pilih item untuk melihat detail atau melakukan aksi.</p>;
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">{panelTitle[sidebar.panel]}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
            {renderPanelContent()}
        </div>
    </div>
  );
};



const InventoryPage: React.FC<{}> = () => {
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

  // Form Submission Handlers
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Gagal membuat item');
      await fetchItems();
      closeSidebar();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Gagal membuat item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebar.data?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/items/${sidebar.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui item');
      }

      await fetchItems();
      closeSidebar();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Gagal memperbarui item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // This assumes your API can handle multiple borrowings in one call
      const response = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(borrowingData),
      });
      if (!response.ok) throw new Error('Gagal meminjam item');
      await fetchItems();
      closeSidebar();
    } catch (error) {
      console.error('Error submitting borrowing:', error);
      alert('Gagal meminjam item');
    } finally {
      setIsLoading(false);
    }
  };

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
      !(item.borrowings && item.borrowings.some((bi: any) => bi.status === 'ACTIVE'))
    ).length
    const loaned = filteredItems.filter(item =>
      item.borrowings && item.borrowings.some((bi: any) => bi.status === 'ACTIVE')
    ).length
    const lowStock = filteredItems.filter(item =>
      item.stock <= item.minStock && item.stock > 0
    ).length
    const outOfStock = filteredItems.filter(item => item.stock === 0).length

    return { total, available, loaned, lowStock, outOfStock }
  }

  // Get smart actions based on selected items
  const getSmartActions = () => {
    const selected = Array.from(selectedItems)
      .map(id => items.find(item => item.id === id))
      .filter(Boolean) as Item[]

    if (selected.length === 0) return []

    const allLoaned = selected.every(item => item.borrowings && item.borrowings.length > 0)
    const noneLoaned = selected.every(item => !item.borrowings || item.borrowings.length === 0);

    const actions = []

    if (selected.length === 1) {
      const item = selected[0]
      const isLoaned = item.borrowings && item.borrowings.some((bi: any) => bi.status === 'ACTIVE')

      if (item.status === ItemStatus.AVAILABLE && !isLoaned) {
        actions.push({ label: 'Pinjamkan', action: 'loan', variant: 'primary' as const })
      }

      if (isLoaned) {
        actions.push({ label: 'Kembalikan', action: 'return', variant: 'primary' as const })
      }

      actions.push({ label: 'Perbaikan', action: 'maintenance', variant: 'secondary' as const })
    }

    if (selected.length > 1 && noneLoaned) {
      actions.push({ label: 'Pinjamkan Semua', action: 'multi-loan', variant: 'primary' as const })
    }

    actions.push({ label: 'Edit', action: 'bulk-edit', variant: 'secondary' as const })
    actions.push({ label: 'Hapus', action: 'delete', variant: 'danger' as const });

    return actions
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
    items: Item[];
    selectedItems: Set<string>;
    onSelectItem: (itemId: string, checked: boolean) => void;
    onOpenDetail: (item: Item) => void;
  }> = ({ items, selectedItems, onSelectItem, onOpenDetail }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {items.map((item) => {
          const isLoaned = item.borrowings && item.borrowings.some((b: any) => b.status === 'ACTIVE');
          const statusConfig = getStatusConfig(item.status, isLoaned);
          const isSelected = selectedItems.has(item.id);

          return (
            <Card
              key={item.id}
              className={`transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-start justify-between p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={isSelected}
                    onChange={(e) => onSelectItem(item.id, e.target.checked)}
                  />
                  <div
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onOpenDetail(item)}><Eye className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</p>
                <div className="text-sm text-gray-500 mt-2">Stok: <span className="font-medium text-gray-700">{item.stock}</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Table View Component
  const TableView: React.FC<{
    items: Item[];
    selectedItems: Set<string>;
    onSelectAll: (checked: boolean) => void;
    onSelectItem: (itemId: string, checked: boolean) => void;
    onOpenDetail: (item: Item) => void;
  }> = ({ items, selectedItems, onSelectAll, onSelectItem, onOpenDetail }) => {
    const allSelected = selectedItems.size === items.length && items.length > 0;

    return (
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 text-left w-10">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Nama</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Kategori</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Lokasi</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Stok</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isLoaned = item.borrowings && item.borrowings.some((b: any) => b.status === 'ACTIVE');
            const statusConfig = getStatusConfig(item.status, isLoaned);
            const isSelected = selectedItems.has(item.id);

            return (
              <tr key={item.id} className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={isSelected}
                    onChange={(e) => onSelectItem(item.id, e.target.checked)}
                  />
                </td>
                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.category?.name || '-'}</td>
                <td className="p-4 text-gray-600">{item.location?.name || '-'}</td>
                <td className="p-4 text-gray-600">{item.stock}</td>
                <td className="p-4">
                  <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                    <span className={`h-2 w-2 mr-2 rounded-full ${statusConfig.dotColor}`}></span>
                    {statusConfig.label}
                  </div>
                </td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" onClick={() => onOpenDetail(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

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
                  const stats = getItemStats();
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
                  );
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
                          variant={action.variant as any}
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

        {/* Contextual Sidebar: Now this is handled by the main ContextualSidebar component */}
        <ContextualSidebar
          sidebar={sidebar}
          onClose={closeSidebar}
          // Pass all necessary props for different panels
          // For Add/Edit Panel
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          locations={locations}
          handleCreateItem={handleCreateItem}
          handleEditItem={handleEditItem}
          openSidebar={openSidebar}
          // For Borrowing Panel
          borrowingData={borrowingData}
          setBorrowingData={setBorrowingData}
          handleSubmitBorrowing={handleSubmitBorrowing}
          // For Deleting
          handleDeleteItem={handleDeleteItem}
          // General
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
};

export default InventoryPage;

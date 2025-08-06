'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Search, Grid3X3, List, Eye, Edit2, Trash2, Package, AlertTriangle, X, Check, User } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import AutocompleteInput from '@/components/ui/AutocompleteInput'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { ItemStatus, Item, Category, Location, ItemFormData, BorrowingFormData, CategoryType, TransactionFormData, MaterialRequestFormData, ToolBorrowingFormData, TransactionType, ItemCondition } from '@/types'
import { useNotifications } from '@/components/ui/NotificationProvider'

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

// Tab types for Materials vs Tools
type InventoryTab = 'materials' | 'tools'

// Sidebar panel types
type SidebarPanel = 'none' | 'add-item' | 'item-detail' | 'material-request' | 'tool-borrowing' | 'edit-item' | 'transaction';

interface SidebarState {
  isOpen: boolean;
  panel: SidebarPanel;
  data?: Item | { items: Item[] };
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
  materialRequestData,
  setMaterialRequestData,
  handleSubmitMaterialRequest,
  toolBorrowingData,
  setToolBorrowingData,
  handleSubmitToolBorrowing,
  unifiedTransactionData,
  setUnifiedTransactionData,
  handleUnifiedTransactionSubmit,
  transactionTab,
  setTransactionTab,
  handleDeleteItem,
  isLoading,
  openSidebar,
}: {
  sidebar: SidebarState;
  onClose: () => void;
  openSidebar: (panel: SidebarPanel, data?: Item | { items: Item[] }) => void;
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  categories: Category[];
  locations: Location[];
  handleCreateItem: (e: React.FormEvent) => void;
  handleEditItem: (e: React.FormEvent) => void;
  borrowingData: BorrowingFormData;
  setBorrowingData: React.Dispatch<React.SetStateAction<BorrowingFormData>>;
  handleSubmitBorrowing: (e: React.FormEvent) => void;
  materialRequestData: MaterialRequestFormData;
  setMaterialRequestData: React.Dispatch<React.SetStateAction<MaterialRequestFormData>>;
  handleSubmitMaterialRequest: (e: React.FormEvent) => void;
  toolBorrowingData: ToolBorrowingFormData;
  setToolBorrowingData: React.Dispatch<React.SetStateAction<ToolBorrowingFormData>>;
  handleSubmitToolBorrowing: (e: React.FormEvent) => void;
  unifiedTransactionData: TransactionFormData;
  setUnifiedTransactionData: React.Dispatch<React.SetStateAction<TransactionFormData>>;
  handleUnifiedTransactionSubmit: () => void;
  transactionTab: 'materials' | 'tools';
  setTransactionTab: React.Dispatch<React.SetStateAction<'materials' | 'tools'>>;
  handleDeleteItem: (itemId: string, itemName: string) => void;
  isLoading: boolean;
}) => {
  if (!sidebar.isOpen) return null;

  const _isEditMode = sidebar.panel === 'edit-item';
  const panelTitle = {
    'add-item': 'Tambah Item Baru',
    'edit-item': 'Edit Item',
    'item-detail': 'Detail Item',
    'borrowing': 'Pinjam Item',
    'material-request': 'Permintaan Material',
    'tool-borrowing': 'Peminjaman Tool',
    'transaction': 'Proses Transaksi',
    'none': '',
  };

  const renderPanelContent = () => {
    switch (sidebar.panel) {
      case 'add-item':
        return (
          <form onSubmit={handleCreateItem} className="space-y-4">
            <Input label="Nama Item" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              onRemove={() => setFormData({ ...formData, imageUrl: '' })}
            />

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Kategori *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.filter(cat => cat.type === CategoryType.MATERIAL || cat.type === CategoryType.TOOL).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type === CategoryType.MATERIAL ? 'Material' : 'Tool'})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Lokasi *</label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Lokasi</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <Input label="Stok" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} required />
            <Input label="Stok Minimum" type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} required />

            {/* Condition Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Kondisi Item *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={ItemCondition.GOOD}>Baik</option>
                <option value={ItemCondition.DAMAGED}>Rusak</option>
                <option value={ItemCondition.LOST}>Hilang</option>
                <option value={ItemCondition.INCOMPLETE}>Tidak Lengkap</option>
              </select>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">Tambah Item</Button>
          </form>
        );
      case 'edit-item':
        const editItem = sidebar.data as Item;
        const originalStock = editItem?.stock || 0;
        const stockDifference = formData.stock - originalStock;

        return (
          <form onSubmit={handleEditItem} className="space-y-4">
            <Input label="Nama Item" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              onRemove={() => setFormData({ ...formData, imageUrl: '' })}
            />

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Kategori *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.filter(cat => cat.type === CategoryType.MATERIAL || cat.type === CategoryType.TOOL).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type === CategoryType.MATERIAL ? 'Material' : 'Tool'})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Lokasi *</label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Lokasi</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock with difference indicator */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Stok</label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                required
              />
              {stockDifference !== 0 && (
                <div className={`text-sm p-2 rounded ${stockDifference > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {stockDifference > 0 ? (
                    <>📈 Restok: +{stockDifference} unit</>
                  ) : (
                    <>📉 Pengurangan: {stockDifference} unit</>
                  )}
                </div>
              )}
            </div>

            <Input label="Stok Minimum" type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} required />

            {/* Condition Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Kondisi Item *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={ItemCondition.GOOD}>Baik</option>
                <option value={ItemCondition.DAMAGED}>Rusak</option>
                <option value={ItemCondition.LOST}>Hilang</option>
                <option value={ItemCondition.INCOMPLETE}>Tidak Lengkap</option>
              </select>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">Simpan Perubahan</Button>
          </form>
        );
      case 'item-detail':
        const item = sidebar.data as Item;
        if (!item) return null;
        const isLoaned = item.borrowings && item.borrowings.some(b => b.status === 'ACTIVE');
        const statusConfig = getStatusConfig(item.status, isLoaned);
        return (
          <div>
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={400}
                height={192}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
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

      case 'material-request':
        const materialItems = (sidebar.data as { items: Item[] })?.items || [];
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900">Material yang Diminta</h4>
              <div className="mt-2 space-y-1">
                {materialItems.map((item: Item, index: number) => (
                  <div key={index} className="text-sm text-blue-700">
                    • {item.name} (Stok: {item.stock})
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmitMaterialRequest} className="space-y-4">
              <Input
                label="Nama Peminta"
                value={materialRequestData.requesterName}
                onChange={(e) => setMaterialRequestData({ ...materialRequestData, requesterName: e.target.value })}
                required
              />
              <Input
                label="Tujuan Penggunaan"
                value={materialRequestData.purpose}
                onChange={(e) => setMaterialRequestData({ ...materialRequestData, purpose: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Catatan</label>
                <textarea
                  value={materialRequestData.notes || ''}
                  onChange={(e) => setMaterialRequestData({ ...materialRequestData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
              <Button type="submit" loading={isLoading} className="w-full">Proses Permintaan Material</Button>
            </form>
          </div>
        );
      case 'tool-borrowing':
        const toolItems = (sidebar.data as { items: Item[] })?.items || [];
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900">Tool yang Dipinjam</h4>
              <div className="mt-2 space-y-1">
                {toolItems.map((item: Item, index: number) => (
                  <div key={index} className="text-sm text-green-700">
                    • {item.name} (Tersedia)
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmitToolBorrowing} className="space-y-4">
              <Input
                label="Nama Peminjam"
                value={toolBorrowingData.borrowerName}
                onChange={(e) => setToolBorrowingData({ ...toolBorrowingData, borrowerName: e.target.value })}
                required
              />
              <Input
                label="Tujuan Peminjaman"
                value={toolBorrowingData.purpose}
                onChange={(e) => setToolBorrowingData({ ...toolBorrowingData, purpose: e.target.value })}
                required
              />
              <Input
                label="Tanggal Pengembalian"
                type="date"
                value={toolBorrowingData.expectedReturnDate}
                onChange={(e) => setToolBorrowingData({ ...toolBorrowingData, expectedReturnDate: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Catatan</label>
                <textarea
                  value={toolBorrowingData.notes || ''}
                  onChange={(e) => setToolBorrowingData({ ...toolBorrowingData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
              <Button type="submit" loading={isLoading} className="w-full">Proses Peminjaman Tool</Button>
            </form>
          </div>
        );
      case 'transaction':
        const transactionItems = (sidebar.data as { items: Item[] })?.items || [];
        const selectedMaterials = transactionItems.filter((item: Item) => item.category?.type === CategoryType.MATERIAL);
        const selectedTools = transactionItems.filter((item: Item) => item.category?.type === CategoryType.TOOL);

        return (
          <div className="space-y-6">
            {/* Common fields */}
            <div className="space-y-4">
              <AutocompleteInput
                label="Nama Peminjam/Peminta"
                value={unifiedTransactionData.requesterName}
                onChange={(value) => setUnifiedTransactionData({ ...unifiedTransactionData, requesterName: value })}
                placeholder="Masukkan nama peminjam/peminta..."
                required
              />
              <Input
                label="Tujuan"
                value={unifiedTransactionData.purpose}
                onChange={(e) => setUnifiedTransactionData({ ...unifiedTransactionData, purpose: e.target.value })}
                required
              />
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-1">
                {selectedMaterials.length > 0 && (
                  <button
                    onClick={() => setTransactionTab('materials')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      transactionTab === 'materials'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Materials ({selectedMaterials.length})
                  </button>
                )}
                {selectedTools.length > 0 && (
                  <button
                    onClick={() => setTransactionTab('tools')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      transactionTab === 'tools'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Tools ({selectedTools.length})
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {transactionTab === 'materials' && selectedMaterials.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900">Material yang Diminta</h4>
                    <div className="mt-2 space-y-1">
                      {selectedMaterials.map((item: Item, index: number) => (
                        <div key={index} className="text-sm text-blue-700">
                          • {item.name} (Stok: {item.stock})
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Catatan Material</label>
                    <textarea
                      value={unifiedTransactionData.notes || ''}
                      onChange={(e) => setUnifiedTransactionData({ ...unifiedTransactionData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Catatan untuk permintaan material (opsional)"
                    />
                  </div>
                </div>
              )}

              {transactionTab === 'tools' && selectedTools.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900">Tool yang Dipinjam</h4>
                    <div className="mt-2 space-y-1">
                      {selectedTools.map((item: Item, index: number) => (
                        <div key={index} className="text-sm text-green-700">
                          • {item.name} (Tersedia)
                        </div>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="Tanggal Pengembalian"
                    type="date"
                    value={unifiedTransactionData.expectedReturnDate}
                    onChange={(e) => setUnifiedTransactionData({ ...unifiedTransactionData, expectedReturnDate: e.target.value })}
                    required
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Catatan Tool</label>
                    <textarea
                      value={unifiedTransactionData.notes || ''}
                      onChange={(e) => setUnifiedTransactionData({ ...unifiedTransactionData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Catatan untuk peminjaman tool (opsional)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleUnifiedTransactionSubmit}
              loading={isLoading}
              className="w-full"
            >
              Proses Transaksi
            </Button>
          </div>
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



const InventoryPage: React.FC = () => {
  // Notification system
  const { success, error, warning } = useNotifications()

  // Existing states
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // New states for enhanced functionality
  const [activeTab, setActiveTab] = useState<InventoryTab>('materials')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sidebar, setSidebar] = useState<SidebarState>({ isOpen: false, panel: 'none' })
  const [_editingField, _setEditingField] = useState<{ itemId: string, field: string } | null>(null)
  const [_hoveredItem, _setHoveredItem] = useState<string | null>(null)

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning'
  })


  // Form data states
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    imageUrl: '',
    stock: 0,
    minStock: 5,
    condition: ItemCondition.GOOD,
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

  // New form data for unified transaction system
  const [materialRequestData, setMaterialRequestData] = useState<MaterialRequestFormData>({
    requesterName: '',
    purpose: '',
    notes: '',
    items: []
  })

  const [toolBorrowingData, setToolBorrowingData] = useState<ToolBorrowingFormData>({
    borrowerName: '',
    purpose: '',
    expectedReturnDate: '',
    notes: '',
    items: []
  })

  // Unified transaction form data
  const [unifiedTransactionData, setUnifiedTransactionData] = useState<TransactionFormData>({
    requesterName: '',
    purpose: '',
    type: TransactionType.REQUEST,
    expectedReturnDate: '',
    notes: '',
    items: []
  })

  // Transaction form tab state
  const [transactionTab, setTransactionTab] = useState<'materials' | 'tools'>('materials')

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
      const response = await fetch('/api/tools-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Gagal membuat item');
      await fetchItems();
      closeSidebar();
      success('Item berhasil ditambahkan', `${formData.name} telah ditambahkan ke inventori`);
    } catch (err) {
      console.error('Error creating item:', err);
      error('Gagal membuat item', err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebar.data || !('id' in sidebar.data)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tools-materials/${sidebar.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui item');
      }

      await fetchItems();
      closeSidebar();
      success('Item berhasil diperbarui', `Perubahan pada ${formData.name} telah disimpan`);
    } catch (err) {
      console.error('Error updating item:', err);
      error('Gagal memperbarui item', err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui item');
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
    } catch (err) {
      console.error('Error submitting borrowing:', err);
      error('Gagal meminjam item', err instanceof Error ? err.message : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  // New handlers for unified transaction system
  const handleSubmitMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const transactionData: TransactionFormData = {
        requesterName: materialRequestData.requesterName,
        purpose: materialRequestData.purpose,
        type: TransactionType.REQUEST,
        notes: materialRequestData.notes,
        items: materialRequestData.items
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal meminta material');
      }

      await fetchItems();
      closeSidebar();
      success('Permintaan material berhasil diproses');
    } catch (err) {
      console.error('Error submitting material request:', err);
      error('Gagal meminta material', err instanceof Error ? err.message : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitToolBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const transactionData: TransactionFormData = {
        requesterName: toolBorrowingData.borrowerName,
        purpose: toolBorrowingData.purpose,
        type: TransactionType.BORROWING,
        expectedReturnDate: toolBorrowingData.expectedReturnDate,
        notes: toolBorrowingData.notes,
        items: toolBorrowingData.items
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal meminjam tools');
      }

      await fetchItems();
      closeSidebar();
      success('Peminjaman tools berhasil diproses');
    } catch (err) {
      console.error('Error submitting tool borrowing:', err);
      error('Gagal meminjam tools', err instanceof Error ? err.message : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  // Unified transaction handler
  const handleUnifiedTransactionSubmit = async () => {
    if (!unifiedTransactionData.requesterName || !unifiedTransactionData.purpose) {
      warning('Data tidak lengkap', 'Nama peminjam/peminta dan tujuan harus diisi');
      return;
    }

    const transactionItems = (sidebar.data as { items: Item[] })?.items || [];
    const materialsToProcess = transactionItems.filter((item: Item) => item.category?.type === CategoryType.MATERIAL);
    const toolsToProcess = transactionItems.filter((item: Item) => item.category?.type === CategoryType.TOOL);

    setIsLoading(true);

    try {
      // Process materials if any
      if (materialsToProcess.length > 0) {
        const materialTransactionData: TransactionFormData = {
          requesterName: unifiedTransactionData.requesterName,
          purpose: unifiedTransactionData.purpose,
          type: TransactionType.REQUEST,
          notes: unifiedTransactionData.notes,
          items: materialsToProcess.map((item: Item) => ({
            itemId: item.id,
            quantity: 1,
            notes: ''
          }))
        };

        const materialResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(materialTransactionData),
        });

        if (!materialResponse.ok) {
          const error = await materialResponse.json();
          throw new Error(error.error || 'Gagal memproses material');
        }
      }

      // Process tools if any
      if (toolsToProcess.length > 0) {
        if (!unifiedTransactionData.expectedReturnDate) {
          warning('Tanggal pengembalian diperlukan', 'Tanggal pengembalian harus diisi untuk peminjaman tool');
          return;
        }

        const toolTransactionData: TransactionFormData = {
          requesterName: unifiedTransactionData.requesterName,
          purpose: unifiedTransactionData.purpose,
          type: TransactionType.BORROWING,
          expectedReturnDate: unifiedTransactionData.expectedReturnDate,
          notes: unifiedTransactionData.notes,
          items: toolsToProcess.map((item: Item) => ({
            itemId: item.id,
            quantity: 1,
            notes: ''
          }))
        };

        const toolResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toolTransactionData),
        });

        if (!toolResponse.ok) {
          const error = await toolResponse.json();
          throw new Error(error.error || 'Gagal memproses tool');
        }
      }

      // Update frequent borrower
      await updateFrequentBorrower(unifiedTransactionData.requesterName);

      await fetchItems();
      setSelectedItems(new Set());
      closeSidebar();
      success('Transaksi berhasil diproses', `${materialsToProcess.length + toolsToProcess.length} item telah diproses`);
    } catch (err) {
      console.error('Error processing transaction:', err);
      error('Gagal memproses transaksi', err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  // Update frequent borrower
  const updateFrequentBorrower = async (name: string) => {
    try {
      await fetch('/api/frequent-borrowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      console.error('Error updating frequent borrower:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/tools-materials')
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoriesData = (data.data as Category[]) || []
        setCategories(categoriesData)

        // Set default category to Materials if form is empty
        if (!formData.categoryId && categoriesData.length > 0) {
          const materialsCategory = categoriesData.find(cat => cat.name === 'Materials')
          if (materialsCategory) {
            setFormData(prev => ({ ...prev, categoryId: materialsCategory.id }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [formData.categoryId])

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        const locationsData = (data.data as Location[]) || []
        setLocations(locationsData)

        // Set default location to Gudang if form is empty
        if (!formData.locationId && locationsData.length > 0) {
          const gudangLocation = locationsData.find(loc => loc.name === 'Gudang')
          if (gudangLocation) {
            setFormData(prev => ({ ...prev, locationId: gudangLocation.id }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }, [formData.locationId])

  // Filter items based on active tab and search
  const filteredItems = items.filter(item => {
    // Filter by tab (materials vs tools)
    const tabFilter = activeTab === 'materials'
      ? item.category?.type === CategoryType.MATERIAL
      : item.category?.type === CategoryType.TOOL

    // Filter by search term
    const searchFilter = !searchTerm || (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return tabFilter && searchFilter
  })

  // Separate materials and tools for statistics
  const materialItems = items.filter(item => item.category?.type === CategoryType.MATERIAL)
  const toolItems = items.filter(item => item.category?.type === CategoryType.TOOL)

  // Tab switching handler
  const handleTabSwitch = (tab: InventoryTab) => {
    setActiveTab(tab)
    // Keep selection when switching tabs to allow mixed processing
  }



  // Multi-select handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }, [filteredItems])

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
  const openSidebar = useCallback((panel: SidebarPanel, data?: Item | { items: Item[] }) => {
    // Set default values when opening add-item form
    if (panel === 'add-item') {
      const materialsCategory = categories.find(cat => cat.name === 'Materials')
      const gudangLocation = locations.find(loc => loc.name === 'Gudang')

      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        stock: 0,
        minStock: 5,
        condition: ItemCondition.GOOD,
        categoryId: materialsCategory?.id || '',
        locationId: gudangLocation?.id || ''
      })
    }

    // Set form data when opening edit-item form
    if (panel === 'edit-item' && data && 'id' in data) {
      setFormData({
        name: data.name || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        stock: data.stock || 0,
        minStock: data.minStock || 5,
        condition: data.condition || ItemCondition.GOOD,
        categoryId: data.categoryId || '',
        locationId: data.locationId || ''
      })
    }

    // Set default values when opening transaction form
    if (panel === 'transaction') {
      const transactionItems = (data as { items: Item[] })?.items || [];
      const selectedMaterialsInTransaction = transactionItems.filter((item: Item) => item.category?.type === CategoryType.MATERIAL);
      const selectedToolsInTransaction = transactionItems.filter((item: Item) => item.category?.type === CategoryType.TOOL);

      setUnifiedTransactionData({
        requesterName: '',
        purpose: '',
        type: TransactionType.REQUEST,
        expectedReturnDate: '',
        notes: '',
        items: transactionItems.map(item => ({
          itemId: item.id,
          quantity: 1,
          notes: ''
        }))
      });

      // Set default tab based on what items are selected
      if (selectedMaterialsInTransaction.length > 0 && selectedToolsInTransaction.length === 0) {
        setTransactionTab('materials');
      } else if (selectedToolsInTransaction.length > 0 && selectedMaterialsInTransaction.length === 0) {
        setTransactionTab('tools');
      } else {
        setTransactionTab('materials'); // Default to materials if mixed
      }
    }

    setSidebar({ isOpen: true, panel, data })
  }, [categories, locations])

  const closeSidebar = () => {
    setSidebar({ isOpen: false, panel: 'none', data: undefined })
    // Form data will be reset when opening add-item form with defaults
    setBorrowingData({
      borrowerName: '',
      purpose: '',
      expectedReturnDate: '',
      notes: '',
      items: []
    })
    setMaterialRequestData({
      requesterName: '',
      purpose: '',
      notes: '',
      items: []
    })
    setToolBorrowingData({
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
      !(item.borrowings && item.borrowings.some((bi: { status: string }) => bi.status === 'ACTIVE'))
    ).length
    const loaned = filteredItems.filter(item =>
      item.borrowings && item.borrowings.some((bi: { status: string }) => bi.status === 'ACTIVE')
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

    const actions = []

    // Main process action - always available for any selection
    actions.push({
      label: 'Proses',
      action: 'process',
      variant: 'primary' as const
    })

    // Edit action
    actions.push({
      label: 'Edit',
      action: 'bulk-edit',
      variant: 'secondary' as const
    })

    // Delete action
    actions.push({
      label: 'Hapus',
      action: 'delete',
      variant: 'danger' as const
    })

    return actions
  }

  // Delete item handler with smart protection
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    // Find the item to check if it's currently borrowed
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Check if it's a tool that's currently being borrowed
    const isCurrentlyBorrowed = item.borrowings && item.borrowings.some((b: { status: string }) => b.status === 'ACTIVE');
    const isTool = item.category?.type === CategoryType.TOOL;

    if (isTool && isCurrentlyBorrowed) {
      warning('Tool sedang dipinjam', `Tool "${itemName}" sedang dipinjam dan tidak dapat dihapus. Silakan tunggu hingga tool dikembalikan terlebih dahulu.`);
      return;
    }

    const confirmMessage = isTool
      ? `Apakah Anda yakin ingin menghapus tool "${itemName}"?\n\n⚠️ Tool ini akan dihapus dari daftar, namun riwayat peminjaman akan tetap tersimpan.\n\nTindakan ini tidak dapat dibatalkan.`
      : `Apakah Anda yakin ingin menghapus material "${itemName}"?\n\n⚠️ Material ini akan dihapus dari daftar, namun riwayat penggunaan akan tetap tersimpan.\n\nTindakan ini tidak dapat dibatalkan.`;

    const onConfirm = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/tools-materials/${itemId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await fetchItems()
          closeSidebar()
          success(`${isTool ? 'Tool' : 'Material'} berhasil dihapus`, 'Riwayat aktivitas tetap tersimpan untuk keperluan audit')
        } else {
          const errorData = await response.json()
          error('Gagal menghapus item', errorData.error || 'Terjadi kesalahan saat menghapus item')
        }
      } catch (err) {
        console.error('Error deleting item:', err)
        error('Gagal menghapus item', 'Terjadi kesalahan saat menghapus item')
      } finally {
        setIsLoading(false)
      }
    };

    setConfirmationModal({
      isOpen: true,
      title: `Hapus ${isTool ? 'Tool' : 'Material'}`,
      message: confirmMessage,
      onConfirm,
      variant: 'danger'
    });
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    // selectedItems is always a Set<string>
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));

    // Identify borrowed tools (legacy and new system)
    const borrowedTools = selectedItemsData.filter(item => {
      const isTool = item.category?.type === CategoryType.TOOL;
      // Legacy check
      const isLegacyBorrowed = item.borrowings && item.borrowings.some((b: { status: string }) => b.status === 'ACTIVE');
      // New system check
      const isTransactionBorrowed = item.transactionItems && item.transactionItems.some(
        (ti: any) => ti.status === 'ACTIVE' && ti.transaction && ti.transaction.type === 'BORROWING'
      );
      return isTool && (isLegacyBorrowed || isTransactionBorrowed);
    });

    if (borrowedTools.length > 0) {
      const names = borrowedTools.map(item => item.name).join(', ');
      warning('Tidak dapat menghapus', `Beberapa tools sedang dipinjam dan tidak dapat dihapus: ${names}`);
      return;
    }

    const itemNames = selectedItemsData.map(item => item.name).join(', ');

    const onConfirm = async () => {
      setIsLoading(true);
      try {
        const deletePromises = Array.from(selectedItems).map(itemId =>
          fetch(`/api/tools-materials/${itemId}`, { method: 'DELETE' })
        );

        const results = await Promise.all(deletePromises);
        const failedDeletes = results.filter(response => !response.ok);

        if (failedDeletes.length === 0) {
          await fetchItems();
          setSelectedItems(new Set());
          success('Penghapusan berhasil', `${selectedItems.size} item berhasil dihapus`);
        } else {
          warning('Penghapusan sebagian berhasil', `${selectedItems.size - failedDeletes.length} item berhasil dihapus, ${failedDeletes.length} item gagal dihapus`);
          await fetchItems();
          setSelectedItems(new Set());
        }
      } catch (err) {
        console.error('Error bulk deleting items:', err);
        error('Gagal menghapus item', 'Terjadi kesalahan saat menghapus item');
      } finally {
        setIsLoading(false);
      }
    };

    setConfirmationModal({
      isOpen: true,
      title: `Hapus ${selectedItems.size} Item`,
      message: `Apakah Anda yakin ingin menghapus ${selectedItems.size} item berikut?\n\n${itemNames}\n\nTindakan ini tidak dapat dibatalkan.`,
      onConfirm,
      variant: 'danger'
    });
  }

  // Action handlers
  const handleAction = (action: string) => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id))

    switch (action) {
      case 'process':
        // Open unified transaction form
        openSidebar('transaction', { items: selectedItemsData } as { items: Item[] })
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
      <div className={`grid gap-6 ${
        sidebar.isOpen
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
      }`}>
        {items.map((item) => {
          const isLoaned = item.borrowings && item.borrowings.some((b: { status: string }) => b.status === 'ACTIVE');
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
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={300}
                    height={128}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
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
            const isLoaned = item.borrowings && item.borrowings.some((b: { status: string }) => b.status === 'ACTIVE');
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

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      variant: 'warning'
    });
  };

  const handleConfirmAction = () => {
    confirmationModal.onConfirm();
    closeConfirmationModal();
  };

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebar.isOpen ? 'mr-96' : ''}`}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tools & Materials</h1>
              <p className="text-gray-600 text-sm">
                Kelola materials (sekali pakai) dan tools (pinjam) dengan sistem terintegrasi
              </p>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white">
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
                      <span className="text-sm text-gray-600">{activeTab === 'materials' ? 'Terpakai' : 'Dipinjam'}: <span className="font-semibold text-yellow-600">{stats.loaned}</span></span>
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
          </div>

          {/* Content Area with integrated tabs and search */}
          <Card className="mx-6 mt-6 mb-6 flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation with Search */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleTabSwitch('materials')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'materials'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="h-4 w-4 mr-2 inline" />
                  Materials ({materialItems.length})
                </button>
                <button
                  onClick={() => handleTabSwitch('tools')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'tools'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="h-4 w-4 mr-2 inline" />
                  Tools ({toolItems.length})
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-80">
                  <Input
                    placeholder="Cari barang, kategori, atau lokasi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
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

            {/* Table Content */}
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
          </Card>

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
                          variant={action.variant as "primary" | "secondary" | "outline" | "ghost"}
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
          // For Transaction Panel
          materialRequestData={materialRequestData}
          setMaterialRequestData={setMaterialRequestData}
          handleSubmitMaterialRequest={handleSubmitMaterialRequest}
          toolBorrowingData={toolBorrowingData}
          setToolBorrowingData={setToolBorrowingData}
          handleSubmitToolBorrowing={handleSubmitToolBorrowing}
          unifiedTransactionData={unifiedTransactionData}
          setUnifiedTransactionData={setUnifiedTransactionData}
          handleUnifiedTransactionSubmit={handleUnifiedTransactionSubmit}
          transactionTab={transactionTab}
          setTransactionTab={setTransactionTab}
          // For Deleting
          handleDeleteItem={handleDeleteItem}
          // General
          isLoading={isLoading}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
        variant={confirmationModal.variant}
        confirmText="Konfirmasi"
        cancelText="Batal"
        isLoading={isLoading}
      />
    </AppLayout>
  );
};

export default InventoryPage;

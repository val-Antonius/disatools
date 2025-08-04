'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Search, ArrowLeft, Clock, CheckCircle, Package, Calendar, User, FileText, AlertTriangle, Eye, RotateCcw, X, Download, Trash2, Filter, List, Grid3X3 } from 'lucide-react'
import { BorrowingStatus, Borrowing, Item, BorrowingFormData, ReturnData, ItemCondition } from '@/types'

// Enhanced status system with visual indicators
const getStatusConfig = (status: BorrowingStatus, isOverdue = false) => {
  if (isOverdue) {
    return {
      label: 'Terlambat',
      color: 'bg-red-100 text-red-800 border-red-200',
      dotColor: 'bg-red-500',
      bgColor: '#ef4444'
    }
  }

  switch (status) {
    case BorrowingStatus.ACTIVE:
      return {
        label: 'Sedang Dipinjam',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        bgColor: '#3b82f6'
      }
    case BorrowingStatus.RETURNED:
      return {
        label: 'Dikembalikan',
        color: 'bg-green-100 text-green-800 border-green-200',
        dotColor: 'bg-green-500',
        bgColor: '#22c55e'
      }
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        dotColor: 'bg-gray-500',
        bgColor: '#6b7280'
      }
  }
}

// Tab types
type TabType = 'active' | 'history'

// Sidebar panel types
type SidebarPanel = 'none' | 'borrowing-detail' | 'return-form' | 'report-generator'

interface SidebarState {
  isOpen: boolean
  panel: SidebarPanel
  data?: any
}

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const isOverdue = (expectedReturnDate: Date | string, status: BorrowingStatus) => {
  return status === BorrowingStatus.ACTIVE && new Date() > new Date(expectedReturnDate)
}

const BorrowingPage: React.FC = () => {
  // Existing states
  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // New states for enhanced functionality
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sidebar, setSidebar] = useState<SidebarState>({ isOpen: false, panel: 'none' })
  const [statusFilter, setStatusFilter] = useState<BorrowingStatus | 'ALL'>('ALL')

  useEffect(() => {
    fetchBorrowings()
  }, [])

  const fetchBorrowings = async () => {
    try {
      const response = await fetch('/api/borrowings')
      if (response.ok) {
        const data = await response.json()
        setBorrowings((data.data as Borrowing[]) || [])
      }
    } catch (error) {
      console.error('Error fetching borrowings:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Filter borrowings based on active tab
  const activeBorrowings = borrowings.filter(b =>
    b.status === BorrowingStatus.ACTIVE ||
    (b.status === BorrowingStatus.OVERDUE)
  )

  const historyBorrowings = borrowings.filter(b =>
    b.status === BorrowingStatus.RETURNED
  )

  const currentBorrowings = activeTab === 'active' ? activeBorrowings : historyBorrowings

  const filteredBorrowings = currentBorrowings.filter(borrowing => {
    const matchesSearch = borrowing.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         borrowing.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         borrowing.items?.some(item =>
                           item.item?.name.toLowerCase().includes(searchTerm.toLowerCase())
                         )

    const matchesStatus = statusFilter === 'ALL' || borrowing.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Statistics
  const stats = {
    active: activeBorrowings.length,
    overdue: borrowings.filter(b =>
      b.status === BorrowingStatus.ACTIVE &&
      isOverdue(b.expectedReturnDate, b.status)
    ).length,
    monthlyTotal: borrowings.filter(b => {
      const borrowDate = new Date(b.borrowDate)
      const now = new Date()
      return borrowDate.getMonth() === now.getMonth() &&
             borrowDate.getFullYear() === now.getFullYear()
    }).length
  }

  // Multi-select handlers (only for history tab)
  const handleSelectAll = (checked: boolean) => {
    if (activeTab === 'history') {
      if (checked) {
        setSelectedItems(new Set(filteredBorrowings.map(b => b.id)))
      } else {
        setSelectedItems(new Set())
      }
    }
  }

  const handleSelectItem = (borrowingId: string, checked: boolean) => {
    if (activeTab === 'history') {
      const newSelected = new Set(selectedItems)
      if (checked) {
        newSelected.add(borrowingId)
      } else {
        newSelected.delete(borrowingId)
      }
      setSelectedItems(newSelected)
    }
  }

  // Sidebar handlers
  const openSidebar = (panel: SidebarPanel, data?: any) => {
    setSidebar({ isOpen: true, panel, data })
  }

  const closeSidebar = () => {
    setSidebar({ isOpen: false, panel: 'none', data: null })
  }

  // Action handlers
  const handleReturnItem = (borrowing: Borrowing) => {
    openSidebar('return-form', borrowing)
  }

  const handleViewDetail = (borrowing: Borrowing) => {
    openSidebar('borrowing-detail', borrowing)
  }

  const handleExtendBorrowing = async (borrowingId: string) => {
    // Implementation for extending borrowing
    console.log('Extend borrowing:', borrowingId)
  }

  const handleBulkExport = () => {
    if (selectedItems.size > 0) {
      openSidebar('report-generator', { selectedIds: Array.from(selectedItems) })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedItems.size} riwayat peminjaman?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setIsLoading(true)
    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/borrowings/${id}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)

      if (failedDeletes.length === 0) {
        await fetchBorrowings()
        setSelectedItems(new Set())
        alert(`${selectedItems.size} riwayat berhasil dihapus`)
      } else {
        alert(`${results.length - failedDeletes.length} riwayat berhasil dihapus, ${failedDeletes.length} riwayat gagal dihapus`)
        await fetchBorrowings()
        setSelectedItems(new Set())
      }
    } catch (error) {
      console.error('Error bulk deleting borrowings:', error)
      alert('Gagal menghapus riwayat')
    } finally {
      setIsLoading(false)
    }
  }

  // Borrowing List Component
  const BorrowingList: React.FC<{
    borrowings: Borrowing[]
    activeTab: TabType
    selectedItems: Set<string>
    onSelectAll: (checked: boolean) => void
    onSelectItem: (borrowingId: string, checked: boolean) => void
    onViewDetail: (borrowing: Borrowing) => void
    onReturnItem: (borrowing: Borrowing) => void
    onExtendBorrowing: (borrowingId: string) => void
  }> = ({
    borrowings, activeTab, selectedItems, onSelectAll, onSelectItem,
    onViewDetail, onReturnItem, onExtendBorrowing
  }) => {
    const allSelected = borrowings.length > 0 && borrowings.every(b => selectedItems.has(b.id))
    const someSelected = borrowings.some(b => selectedItems.has(b.id))

    return (
      <Card className="glass">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {activeTab === 'history' && (
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
                  )}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Peminjam</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Barang</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {borrowings.map((borrowing) => {
                  const overdue = isOverdue(borrowing.expectedReturnDate, borrowing.status)
                  const statusConfig = getStatusConfig(borrowing.status, overdue)

                  return (
                    <tr
                      key={borrowing.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {activeTab === 'history' && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(borrowing.id)}
                            onChange={(e) => onSelectItem(borrowing.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{borrowing.borrowerName}</div>
                            <div className="text-sm text-gray-500">{borrowing.purpose}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {borrowing.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Package className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-900">{item.item?.name}</span>
                              <span className="text-xs text-gray-500">({item.quantity} unit)</span>
                            </div>
                          ))}
                          {borrowing.items && borrowing.items.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{borrowing.items.length - 2} barang lainnya
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(borrowing.borrowDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Jatuh tempo: {formatDate(borrowing.expectedReturnDate)}
                            </span>
                          </div>
                          {borrowing.returnDate && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-green-600">
                                Kembali: {formatDate(borrowing.returnDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {overdue && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(borrowing)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Detail</span>
                          </Button>

                          {activeTab === 'active' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onReturnItem(borrowing)}
                                className="flex items-center space-x-1"
                              >
                                <RotateCcw className="h-4 w-4" />
                                <span>Kembalikan</span>
                              </Button>

                              {!overdue && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onExtendBorrowing(borrowing.id)}
                                  className="flex items-center space-x-1"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span>Perpanjang</span>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Peminjaman</h1>
              <p className="text-gray-600 mt-1">
                Kelola pengembalian dan riwayat peminjaman barang
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sedang Dipinjam</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Terlambat</p>
                      <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Bulan Ini</p>
                      <p className="text-3xl font-bold text-green-600">{stats.monthlyTotal}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === 'active' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('active')
                    setSelectedItems(new Set())
                  }}
                  className="px-4 py-2"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Sedang Dipinjam ({stats.active})
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('history')
                    setSelectedItems(new Set())
                  }}
                  className="px-4 py-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Riwayat ({historyBorrowings.length})
                </Button>
              </div>

              {/* Tab-specific actions */}
              {activeTab === 'history' && selectedItems.size > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export ({selectedItems.size})
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleBulkDelete}
                    loading={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus ({selectedItems.size})
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari peminjam, tujuan, atau nama barang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              {activeTab === 'active' && (
                <div className="w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BorrowingStatus | 'ALL')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value={BorrowingStatus.ACTIVE}>Aktif</option>
                    <option value={BorrowingStatus.OVERDUE}>Terlambat</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {isLoadingData ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Memuat data...</span>
              </div>
            ) : filteredBorrowings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'active' ? 'Tidak ada peminjaman aktif' : 'Tidak ada riwayat'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'active'
                    ? 'Semua barang sudah dikembalikan'
                    : 'Belum ada riwayat peminjaman yang selesai'
                  }
                </p>
              </div>
            ) : (
              <BorrowingList
                borrowings={filteredBorrowings}
                activeTab={activeTab}
                selectedItems={selectedItems}
                onSelectAll={handleSelectAll}
                onSelectItem={handleSelectItem}
                onViewDetail={handleViewDetail}
                onReturnItem={handleReturnItem}
                onExtendBorrowing={handleExtendBorrowing}
              />
            )}
          </div>

          {/* Floating Action Panel for History Tab */}
          {activeTab === 'history' && selectedItems.size > 0 && (
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
                          {selectedItems.size} riwayat terpilih
                        </span>
                        <div className="text-xs text-gray-500">
                          Siap untuk export atau hapus
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleBulkExport}
                        className="shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleBulkDelete}
                        loading={isLoading}
                        className="shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>

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
          onSubmit={fetchBorrowings}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>
    </AppLayout>
  )

  // Contextual Sidebar Component
  function ContextualSidebar({
    sidebar, onClose, onSubmit, isLoading, setIsLoading
  }: {
    sidebar: SidebarState
    onClose: () => void
    onSubmit: () => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
  }) {
    const [returnData, setReturnData] = useState<{
      items: Array<{
        borrowingItemId: string
        returnQuantity: number
        damagedQuantity: number
        lostQuantity: number
        condition: ItemCondition
        returnNotes: string
      }>
      notes: string
    }>({
      items: [],
      notes: ''
    })

    // Initialize return data when sidebar opens
    useEffect(() => {
      if (sidebar.panel === 'return-form' && sidebar.data) {
        const borrowing = sidebar.data as Borrowing
        setReturnData({
          items: borrowing.items?.map(item => ({
            borrowingItemId: item.id,
            returnQuantity: item.quantity - item.returnedQuantity,
            damagedQuantity: 0,
            lostQuantity: 0,
            condition: ItemCondition.GOOD,
            returnNotes: ''
          })) || [],
          notes: ''
        })
      }
    }, [sidebar.panel, sidebar.data])

    const handleSubmitReturn = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!sidebar.data?.id) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/borrowings/${sidebar.data.id}/return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(returnData)
        })

        if (response.ok) {
          onSubmit()
          onClose()
          alert('Barang berhasil dikembalikan')
        } else {
          const error = await response.json()
          alert(error.error || 'Gagal mengembalikan barang')
        }
      } catch (error) {
        console.error('Error returning items:', error)
        alert('Gagal mengembalikan barang')
      } finally {
        setIsLoading(false)
      }
    }

    const updateReturnItem = (index: number, field: string, value: any) => {
      setReturnData(prev => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }))
    }

    const getConditionColor = (condition: ItemCondition) => {
      switch (condition) {
        case ItemCondition.GOOD:
          return 'text-green-600 bg-green-100'
        case ItemCondition.DAMAGED:
          return 'text-orange-600 bg-orange-100'
        case ItemCondition.LOST:
          return 'text-red-600 bg-red-100'
        case ItemCondition.INCOMPLETE:
          return 'text-yellow-600 bg-yellow-100'
        default:
          return 'text-gray-600 bg-gray-100'
      }
    }

    const getConditionLabel = (condition: ItemCondition) => {
      switch (condition) {
        case ItemCondition.GOOD:
          return 'Baik'
        case ItemCondition.DAMAGED:
          return 'Rusak'
        case ItemCondition.LOST:
          return 'Hilang'
        case ItemCondition.INCOMPLETE:
          return 'Tidak Lengkap'
        default:
          return 'Unknown'
      }
    }

    if (!sidebar.isOpen) return null

    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-40 transform transition-transform duration-300 animate-slide-up">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {sidebar.panel === 'borrowing-detail' && 'Detail Peminjaman'}
              {sidebar.panel === 'return-form' && 'Form Pengembalian'}
              {sidebar.panel === 'report-generator' && 'Generate Report'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sidebar.panel === 'borrowing-detail' && 'Informasi lengkap peminjaman'}
              {sidebar.panel === 'return-form' && 'Kembalikan barang dengan kondisi'}
              {sidebar.panel === 'report-generator' && 'Export data terpilih'}
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
          {sidebar.panel === 'return-form' && sidebar.data && (
            <div className="p-6">
              <form onSubmit={handleSubmitReturn} className="space-y-6">
                {/* Borrowing Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informasi Peminjaman</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Peminjam:</span>
                      <span className="ml-2 text-gray-900">{sidebar.data.borrowerName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tujuan:</span>
                      <span className="ml-2 text-gray-900">{sidebar.data.purpose}</span>
                    </div>
                  </div>
                </div>

                {/* Return Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Barang yang Dikembalikan</h4>
                  <div className="space-y-4">
                    {returnData.items.map((returnItem, index) => {
                      const borrowingItem = sidebar.data.items?.find((item: { id: string; quantity: number; returnedQuantity: number }) => item.id === returnItem.borrowingItemId)
                      if (!borrowingItem) return null

                      const maxReturn = borrowingItem.quantity - borrowingItem.returnedQuantity

                      return (
                        <div key={returnItem.borrowingItemId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Package className="h-5 w-5 text-gray-400" />
                            <div>
                              <h5 className="font-medium text-gray-900">{borrowingItem.item?.name}</h5>
                              <p className="text-sm text-gray-500">
                                Dipinjam: {borrowingItem.quantity} | Tersisa: {maxReturn}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Dikembalikan</label>
                              <input
                                type="number"
                                min="0"
                                max={maxReturn}
                                value={returnItem.returnQuantity}
                                onChange={(e) => updateReturnItem(index, 'returnQuantity', parseInt(e.target.value) || 0)}
                                className="w-full text-sm rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Rusak</label>
                              <input
                                type="number"
                                min="0"
                                max={maxReturn}
                                value={returnItem.damagedQuantity}
                                onChange={(e) => updateReturnItem(index, 'damagedQuantity', parseInt(e.target.value) || 0)}
                                className="w-full text-sm rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Hilang</label>
                              <input
                                type="number"
                                min="0"
                                max={maxReturn}
                                value={returnItem.lostQuantity}
                                onChange={(e) => updateReturnItem(index, 'lostQuantity', parseInt(e.target.value) || 0)}
                                className="w-full text-sm rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Kondisi Umum</label>
                            <select
                              value={returnItem.condition}
                              onChange={(e) => updateReturnItem(index, 'condition', e.target.value as ItemCondition)}
                              className="w-full text-sm rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {Object.values(ItemCondition).map(condition => (
                                <option key={condition} value={condition}>
                                  {getConditionLabel(condition)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Item</label>
                            <textarea
                              value={returnItem.returnNotes}
                              onChange={(e) => updateReturnItem(index, 'returnNotes', e.target.value)}
                              placeholder="Kondisi spesifik, kerusakan, dll..."
                              rows={2}
                              className="w-full text-sm rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* General Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Umum</label>
                  <textarea
                    value={returnData.notes}
                    onChange={(e) => setReturnData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Catatan tambahan untuk pengembalian ini..."
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
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Pengembalian
                  </Button>
                </div>
              </form>
            </div>
          )}

          {sidebar.panel === 'borrowing-detail' && sidebar.data && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Detail Peminjaman</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Peminjam:</span> {sidebar.data.borrowerName}</div>
                    <div><span className="font-medium">Tujuan:</span> {sidebar.data.purpose}</div>
                    <div><span className="font-medium">Tanggal Pinjam:</span> {formatDate(sidebar.data.borrowDate)}</div>
                    <div><span className="font-medium">Jatuh Tempo:</span> {formatDate(sidebar.data.expectedReturnDate)}</div>
                    {sidebar.data.returnDate && (
                      <div><span className="font-medium">Tanggal Kembali:</span> {formatDate(sidebar.data.returnDate)}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Daftar Barang</h4>
                  <div className="space-y-2">
                    {sidebar.data.items?.map((item: any) => (
                      <div key={item.id} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{item.item?.name}</h5>
                            <p className="text-sm text-gray-500">
                              Dipinjam: {item.quantity} | Dikembalikan: {item.returnedQuantity}
                            </p>
                            {item.condition && (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getConditionColor(item.condition)}`}>
                                {getConditionLabel(item.condition)}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.returnNotes && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{item.returnNotes}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebar.panel === 'report-generator' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Report</h3>
                <p className="text-gray-600 mb-4">Export {sidebar.data?.selectedIds?.length} riwayat terpilih</p>
                <Button variant="primary" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
  )
  }}
export default BorrowingPage;
'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Package, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle, 
  Eye, 
  RotateCcw, 
  X, 
  Download, 
  Trash2, 
  Filter,
  Clock,
  CheckCircle,
  Search
} from 'lucide-react'
import { 
  TransactionStatus, 
  Transaction, 
  TransactionType, 
  CategoryType,
  ItemCondition 
} from '@/types'

// Enhanced status system with visual indicators
const getStatusConfig = (status: TransactionStatus, isOverdue = false, condition?: ItemCondition) => {
  if (isOverdue) {
    return {
      label: 'Terlambat',
      color: 'bg-red-100 text-red-800 border-red-200',
      dotColor: 'bg-red-500',
      bgColor: '#ef4444'
    }
  }

  switch (status) {
    case TransactionStatus.ACTIVE:
      return {
        label: 'Aktif',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        bgColor: '#3b82f6'
      }
    case TransactionStatus.RETURNED:
      // Check if returned with damaged condition
      if (condition === ItemCondition.DAMAGED) {
        return {
          label: 'Dikembalikan (Rusak)',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          dotColor: 'bg-orange-500',
          bgColor: '#f97316'
        }
      }
      return {
        label: 'Dikembalikan',
        color: 'bg-green-100 text-green-800 border-green-200',
        dotColor: 'bg-green-500',
        bgColor: '#22c55e'
      }
    case TransactionStatus.CONSUMED:
      return {
        label: 'Terpakai',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        dotColor: 'bg-purple-500',
        bgColor: '#8b5cf6'
      }
    case TransactionStatus.CANCELLED:
      return {
        label: 'Dibatalkan',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        dotColor: 'bg-gray-500',
        bgColor: '#6b7280'
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
type ActivityTab = 'tools' | 'materials' | 'history'

// Sidebar panel types
type SidebarPanel = 'none' | 'transaction-detail' | 'return-form'

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

const isOverdue = (expectedReturnDate: Date | string, status: TransactionStatus) => {
  return status === TransactionStatus.ACTIVE && new Date() > new Date(expectedReturnDate)
}

const ActivitiesPage: React.FC = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // New states for enhanced functionality
  const [activeTab, setActiveTab] = useState<ActivityTab>('tools')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sidebar, setSidebar] = useState<SidebarState>({ isOpen: false, panel: 'none' })
  
  // Date filters
  const [dateFilters, setDateFilters] = useState({
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions((data.data as Transaction[]) || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Filter transactions based on active tab
  const toolTransactions = transactions.filter(t => 
    t.type === TransactionType.BORROWING &&
    (t.status === TransactionStatus.ACTIVE || t.status === TransactionStatus.OVERDUE)
  )

  const materialTransactions = transactions.filter(t => 
    t.type === TransactionType.REQUEST &&
    t.status === TransactionStatus.CONSUMED
  )

  const historyTransactions = transactions.filter(t =>
    t.status === TransactionStatus.RETURNED || 
    t.status === TransactionStatus.CONSUMED ||
    t.status === TransactionStatus.CANCELLED
  )

  const getCurrentTransactions = () => {
    switch (activeTab) {
      case 'tools':
        return toolTransactions
      case 'materials':
        return materialTransactions
      case 'history':
        return historyTransactions
      default:
        return []
    }
  }

  const filteredTransactions = getCurrentTransactions().filter(transaction => {
    const matchesSearch = transaction.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.items?.some(item =>
                           item.item?.name.toLowerCase().includes(searchTerm.toLowerCase())
                         )

    // Date filter
    let matchesDate = true
    if (dateFilters.dateFrom || dateFilters.dateTo) {
      const transactionDate = new Date(transaction.transactionDate)
      if (dateFilters.dateFrom) {
        matchesDate = matchesDate && transactionDate >= new Date(dateFilters.dateFrom)
      }
      if (dateFilters.dateTo) {
        matchesDate = matchesDate && transactionDate <= new Date(dateFilters.dateTo)
      }
    }

    return matchesSearch && matchesDate
  })

  // Tab switching handler
  const handleTabSwitch = (tab: ActivityTab) => {
    setActiveTab(tab)
    setSelectedItems(new Set()) // Clear selection when switching tabs
  }

  // Multi-select handlers (only for history tab)
  const handleSelectAll = (checked: boolean) => {
    if (activeTab === 'history') {
      if (checked) {
        setSelectedItems(new Set(filteredTransactions.map(t => t.id)))
      } else {
        setSelectedItems(new Set())
      }
    }
  }

  const handleSelectItem = (transactionId: string, checked: boolean) => {
    if (activeTab === 'history') {
      const newSelected = new Set(selectedItems)
      if (checked) {
        newSelected.add(transactionId)
      } else {
        newSelected.delete(transactionId)
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
  const handleReturnTool = (transaction: Transaction) => {
    openSidebar('return-form', transaction)
  }

  const handleViewDetail = (transaction: Transaction) => {
    openSidebar('transaction-detail', transaction)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedItems.size} riwayat aktivitas?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setIsLoading(true)
    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)

      if (failedDeletes.length === 0) {
        await fetchTransactions()
        setSelectedItems(new Set())
        alert(`${selectedItems.size} riwayat berhasil dihapus`)
      } else {
        alert(`${results.length - failedDeletes.length} riwayat berhasil dihapus, ${failedDeletes.length} riwayat gagal dihapus`)
        await fetchTransactions()
        setSelectedItems(new Set())
      }
    } catch (error) {
      console.error('Error bulk deleting transactions:', error)
      alert('Gagal menghapus riwayat')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aktivitas</h1>
              <p className="text-gray-600 text-sm">
                Kelola peminjaman tools, permintaan materials, dan riwayat aktivitas
              </p>
            </div>
          </div>

          {/* Content Area with integrated tabs and search */}
          <Card className="mx-6 mt-6 mb-6 flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation with Search */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === 'tools' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabSwitch('tools')}
                  className="px-4 py-2"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Tools ({toolTransactions.length})
                </Button>
                <Button
                  variant={activeTab === 'materials' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabSwitch('materials')}
                  className="px-4 py-2"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Materials ({materialTransactions.length})
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabSwitch('history')}
                  className="px-4 py-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Riwayat ({historyTransactions.length})
                </Button>
              </div>

              {/* Search and Actions */}
              <div className="flex items-center space-x-3">
                <div className="w-64">
                  <Input
                    placeholder="Cari nama, tujuan, atau barang..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>

                {/* Tab-specific actions */}
                {activeTab === 'history' && selectedItems.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Handle export */}}
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
                  </>
                )}
              </div>
            </div>

            {/* Date filters for Materials and History tabs - Right aligned below search */}
            {(activeTab === 'materials' || activeTab === 'history') && (
              <div className="flex justify-end px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tanggal Mulai:</label>
                    <Input
                      type="date"
                      value={dateFilters.dateFrom}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tanggal Akhir:</label>
                    <Input
                      type="date"
                      value={dateFilters.dateTo}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="w-40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Table Content */}
            <div className="flex-1 overflow-auto p-6">
              {isLoadingData ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Memuat data...</span>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'tools' ? 'Tidak ada peminjaman tools aktif' :
                     activeTab === 'materials' ? 'Tidak ada permintaan materials' :
                     'Tidak ada riwayat aktivitas'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'tools'
                      ? 'Semua tools sudah dikembalikan'
                      : activeTab === 'materials'
                      ? 'Belum ada permintaan materials yang diproses'
                      : 'Belum ada riwayat aktivitas yang selesai'
                    }
                  </p>
                </div>
              ) : (
                <TransactionList
                  transactions={filteredTransactions}
                  activeTab={activeTab}
                  selectedItems={selectedItems}
                  onSelectAll={handleSelectAll}
                  onSelectItem={handleSelectItem}
                  onViewDetail={handleViewDetail}
                  onReturnTool={handleReturnTool}
                />
              )}
            </div>
          </Card>

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
                        onClick={() => {/* Handle export */}}
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
        {sidebar.isOpen && (
          <div className="w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto flex-shrink-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {sidebar.panel === 'return-form' ? 'Kembalikan Tool' : 'Detail Transaksi'}
                </h2>
                <Button variant="ghost" size="sm" onClick={closeSidebar}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {sidebar.panel === 'return-form' && (
                <ReturnForm
                  transaction={sidebar.data}
                  onClose={closeSidebar}
                  onSuccess={() => {
                    fetchTransactions()
                    closeSidebar()
                  }}
                />
              )}

              {sidebar.panel === 'transaction-detail' && (
                <TransactionDetail
                  transaction={sidebar.data}
                  onClose={closeSidebar}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )

  // Transaction List Component
  function TransactionList({
    transactions, activeTab, selectedItems, onSelectAll, onSelectItem,
    onViewDetail, onReturnTool
  }: {
    transactions: Transaction[]
    activeTab: ActivityTab
    selectedItems: Set<string>
    onSelectAll: (checked: boolean) => void
    onSelectItem: (transactionId: string, checked: boolean) => void
    onViewDetail: (transaction: Transaction) => void
    onReturnTool: (transaction: Transaction) => void
  }) {
    const allSelected = transactions.length > 0 && transactions.every(t => selectedItems.has(t.id))
    const someSelected = transactions.some(t => selectedItems.has(t.id))

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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    {activeTab === 'materials' ? 'Peminta' : 'Peminjam'}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Barang</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const overdue = transaction.expectedReturnDate && isOverdue(transaction.expectedReturnDate, transaction.status)
                  // Check if any item was returned with damaged condition
                  const hasDamagedItems = transaction.items?.some(item => item.condition === ItemCondition.DAMAGED) || false
                  const statusConfig = getStatusConfig(transaction.status, overdue, hasDamagedItems ? ItemCondition.DAMAGED : undefined)

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {activeTab === 'history' && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(transaction.id)}
                            onChange={(e) => onSelectItem(transaction.id, e.target.checked)}
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
                            <div className="font-medium text-gray-900">{transaction.requesterName}</div>
                            <div className="text-sm text-gray-500">{transaction.purpose}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {transaction.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Package className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-900">{item.item?.name}</span>
                              <span className="text-xs text-gray-500">({item.quantity} unit)</span>
                            </div>
                          ))}
                          {transaction.items && transaction.items.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{transaction.items.length - 2} barang lainnya
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(transaction.transactionDate)}
                            </span>
                          </div>
                          {transaction.expectedReturnDate && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                Jatuh tempo: {formatDate(transaction.expectedReturnDate)}
                              </span>
                            </div>
                          )}
                          {transaction.returnDate && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-green-600">
                                Kembali: {formatDate(transaction.returnDate)}
                              </span>
                            </div>
                          )}
                          {transaction.consumedDate && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-purple-500" />
                              <span className="text-sm text-purple-600">
                                Terpakai: {formatDate(transaction.consumedDate)}
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
                            onClick={() => onViewDetail(transaction)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Detail</span>
                          </Button>

                          {activeTab === 'tools' && transaction.status === TransactionStatus.ACTIVE && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onReturnTool(transaction)}
                              className="flex items-center space-x-1"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>Kembalikan</span>
                            </Button>
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
}

// Return Form Component
const ReturnForm = ({ transaction, onClose, onSuccess }: {
  transaction: Transaction
  onClose: () => void
  onSuccess: () => void
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare items data for return
      const items = transaction.items?.map(item => ({
        transactionItemId: item.id,
        returnQuantity: item.quantity - (item.returnedQuantity || 0), // Return all remaining quantity
        damagedQuantity: 0,
        lostQuantity: 0,
        condition: 'GOOD',
        returnNotes: notes
      })) || []

      const response = await fetch(`/api/transactions/${transaction.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, notes })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal mengembalikan tool')
      }

      alert('Tool berhasil dikembalikan')
      onSuccess()
    } catch (error) {
      console.error('Error returning tool:', error)
      alert(error instanceof Error ? error.message : 'Gagal mengembalikan tool')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Detail Peminjaman</h3>
        <div className="space-y-1 text-sm text-blue-700">
          <p><strong>Peminjam:</strong> {transaction.requesterName}</p>
          <p><strong>Tujuan:</strong> {transaction.purpose}</p>
          <p><strong>Tanggal Pinjam:</strong> {formatDate(transaction.createdAt)}</p>
          {transaction.expectedReturnDate && (
            <p><strong>Jadwal Kembali:</strong> {formatDate(transaction.expectedReturnDate)}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Items yang Dikembalikan</h4>
        <div className="space-y-1">
          {transaction.items?.map((item, index) => (
            <div key={index} className="text-sm text-gray-700">
              • {item.item?.name} (Qty: {item.quantity})
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Catatan Pengembalian (Opsional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Kondisi barang, kerusakan, atau catatan lainnya..."
        />
      </div>

      <div className="flex space-x-3">
        <Button type="submit" loading={isLoading} className="flex-1">
          Konfirmasi Pengembalian
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}

// Transaction Detail Component
const TransactionDetail = ({ transaction, onClose }: {
  transaction: Transaction
  onClose: () => void
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Informasi Transaksi</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">ID Transaksi:</span>
            <span className="font-mono text-xs">{transaction.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Nama:</span>
            <span>{transaction.requesterName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tujuan:</span>
            <span>{transaction.purpose}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tanggal:</span>
            <span>{formatDate(transaction.createdAt)}</span>
          </div>
          {transaction.expectedReturnDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Jadwal Kembali:</span>
              <span>{formatDate(transaction.expectedReturnDate)}</span>
            </div>
          )}
          {transaction.returnedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Dikembalikan:</span>
              <span>{formatDate(transaction.returnedAt)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            {(() => {
              const hasDamagedItems = transaction.items?.some(item => item.condition === ItemCondition.DAMAGED) || false
              const statusConfig = getStatusConfig(transaction.status, false, hasDamagedItems ? ItemCondition.DAMAGED : undefined)
              return (
                <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              )
            })()}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Items</h3>
        <div className="space-y-2">
          {transaction.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
              <div>
                <div className="font-medium text-sm">{item.item?.name}</div>
                <div className="text-xs text-gray-500">
                  {item.item?.category?.name} • {item.item?.location?.name}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Qty: {item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {transaction.notes && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Catatan</h3>
          <p className="text-sm text-gray-700">{transaction.notes}</p>
        </div>
      )}

      <Button onClick={onClose} variant="secondary" className="w-full">
        Tutup
      </Button>
    </div>
  )
}

export default ActivitiesPage

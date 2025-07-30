'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import EnhancedBorrowingForm from '@/components/borrowing/EnhancedBorrowingForm'
import PartialReturnModal from '@/components/borrowing/PartialReturnModal'
import { Plus, Search, ArrowLeft, Clock, CheckCircle, Package, Calendar, User, FileText, AlertTriangle } from 'lucide-react'
import { BorrowingStatus, Borrowing, Item, BorrowingFormData, ReturnData } from '@/types'

const getStatusColor = (status: BorrowingStatus) => {
  switch (status) {
    case BorrowingStatus.ACTIVE:
      return 'text-blue-600 bg-blue-100'
    case BorrowingStatus.RETURNED:
      return 'text-green-600 bg-green-100'
    case BorrowingStatus.OVERDUE:
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

const getStatusText = (status: BorrowingStatus) => {
  switch (status) {
    case BorrowingStatus.ACTIVE:
      return 'Aktif'
    case BorrowingStatus.RETURNED:
      return 'Dikembalikan'
    case BorrowingStatus.OVERDUE:
      return 'Terlambat'
    default:
      return 'Unknown'
  }
}

const isOverdue = (expectedReturnDate: Date, status: BorrowingStatus) => {
  return status === BorrowingStatus.ACTIVE && new Date() > expectedReturnDate
}

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const BorrowingPage: React.FC = () => {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null)
  const [statusFilter, setStatusFilter] = useState<BorrowingStatus | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Fetch borrowings data
  useEffect(() => {
    fetchBorrowings()
    fetchAvailableItems()
  }, [])

  const fetchBorrowings = async () => {
    setIsLoadingData(true)
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

  const fetchAvailableItems = async () => {
    try {
      const response = await fetch('/api/items?status=AVAILABLE')
      if (response.ok) {
        const data = await response.json()
        setAvailableItems((data.data as Item[]) || [])
      }
    } catch (error) {
      console.error('Error fetching available items:', error)
    }
  }

  const filteredBorrowings = borrowings.filter(borrowing => {
    const matchesSearch =
      borrowing.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowing.items?.some(item =>
        item.item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      borrowing.purpose.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || borrowing.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddBorrowing = () => {
    setIsModalOpen(true)
  }

  const handleReturnItem = (borrowingId: string) => {
    const borrowing = borrowings.find(b => b.id === borrowingId)
    if (borrowing) {
      setSelectedBorrowing(borrowing)
      setIsReturnModalOpen(true)
    }
  }

  const handlePartialReturn = async (borrowingId: string, returnData: ReturnData) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/borrowings/${borrowingId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      })

      if (response.ok) {
        const result = await response.json()
        // Refresh borrowings data
        await fetchBorrowings()
        setIsReturnModalOpen(false)
        setSelectedBorrowing(null)
        alert(result.message || 'Barang berhasil dikembalikan')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal mengembalikan barang')
      }
    } catch (error) {
      console.error('Error returning items:', error)
      alert('Gagal mengembalikan barang. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: BorrowingFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/borrowings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const _result = await response.json()
        // Refresh borrowings data
        await fetchBorrowings()
        setIsModalOpen(false)
        alert('Peminjaman berhasil dibuat')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat peminjaman')
      }
    } catch (error) {
      console.error('Error creating borrowing:', error)
      alert('Gagal membuat peminjaman. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const activeBorrowings = borrowings.filter(b => b.status === BorrowingStatus.ACTIVE).length
  const overdueBorrowings = borrowings.filter(b => b.status === BorrowingStatus.OVERDUE).length

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Peminjaman</h1>
            <p className="text-gray-600 mt-1">
              Kelola peminjaman barang inventaris
            </p>
          </div>
          <Button onClick={handleAddBorrowing} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Pinjam Barang</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sedang Dipinjam</p>
                  <p className="text-3xl font-bold text-blue-600">{activeBorrowings}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowLeft className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terlambat</p>
                  <p className="text-3xl font-bold text-red-600">{overdueBorrowings}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Peminjaman</p>
                  <p className="text-3xl font-bold text-green-600">{borrowings.length}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari peminjam, barang, atau tujuan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <div>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BorrowingStatus | 'ALL')}
                >
                  <option value="ALL">Semua Status</option>
                  <option value={BorrowingStatus.ACTIVE}>Aktif</option>
                  <option value={BorrowingStatus.OVERDUE}>Terlambat</option>
                  <option value={BorrowingStatus.RETURNED}>Dikembalikan</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrowings List */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Peminjaman ({filteredBorrowings.length})
            </h3>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Memuat data...</span>
              </div>
            ) : filteredBorrowings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada peminjaman</h3>
                <p className="text-gray-600 mb-4">Mulai dengan membuat peminjaman baru</p>
                <Button onClick={handleAddBorrowing} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Pinjam Barang</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBorrowings.map((borrowing) => (
                  <div key={borrowing.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{borrowing.borrowerName}</h4>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <FileText className="h-4 w-4 mr-1" />
                            {borrowing.purpose}
                          </p>
                          {borrowing.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{borrowing.notes}&rdquo;</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(borrowing.status)}`}>
                          {getStatusText(borrowing.status)}
                        </span>
                        {borrowing.status === BorrowingStatus.ACTIVE && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnItem(borrowing.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Kembalikan
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Barang yang Dipinjam ({borrowing.items?.length || 0} jenis)
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {borrowing.items?.map((item) => (
                          <div key={item.id} className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{item.item?.name || 'Unknown Item'}</p>
                                <p className="text-xs text-gray-500">{item.item?.category?.name || 'Unknown Category'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {item.quantity} unit
                                </p>
                                {item.returnedQuantity > 0 && (
                                  <p className="text-xs text-green-600">
                                    {item.returnedQuantity} dikembalikan
                                  </p>
                                )}
                              </div>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">&ldquo;{item.notes}&rdquo;</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Tanggal Pinjam</p>
                          <p className="font-medium text-gray-900">{formatDate(borrowing.borrowDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Batas Kembali</p>
                          <p className={`font-medium ${isOverdue(borrowing.expectedReturnDate, borrowing.status) ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(borrowing.expectedReturnDate)}
                          </p>
                          {isOverdue(borrowing.expectedReturnDate, borrowing.status) && (
                            <div className="flex items-center text-red-600 mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span className="text-xs">Terlambat</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {borrowing.returnDate && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-gray-500">Tanggal Kembali</p>
                            <p className="font-medium text-gray-900">{formatDate(borrowing.returnDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Borrowing Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Pinjam Barang Baru"
          size="xl"
        >
          <EnhancedBorrowingForm
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            availableItems={availableItems}
            isLoading={isLoading}
          />
        </Modal>

        {/* Partial Return Modal */}
        <PartialReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => {
            setIsReturnModalOpen(false)
            setSelectedBorrowing(null)
          }}
          borrowing={selectedBorrowing}
          onReturn={handlePartialReturn}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  )
}

export default BorrowingPage

'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Package, CheckCircle, AlertCircle } from 'lucide-react'
import { BorrowingStatus } from '@/types'

interface BorrowingItem {
  id: string
  item: {
    id: string
    name: string
    category: { name: string }
  }
  quantity: number
  returnedQuantity: number
  status: BorrowingStatus
}

interface Borrowing {
  id: string
  borrowerName: string
  purpose: string
  borrowDate: Date
  expectedReturnDate: Date
  status: BorrowingStatus
  items: BorrowingItem[]
}

interface PartialReturnModalProps {
  isOpen: boolean
  onClose: () => void
  borrowing: Borrowing | null
  onReturn: (borrowingId: string, returnData: any) => void
  isLoading?: boolean
}

const PartialReturnModal: React.FC<PartialReturnModalProps> = ({
  isOpen,
  onClose,
  borrowing,
  onReturn,
  isLoading = false
}) => {
  const [returnItems, setReturnItems] = useState<Array<{
    borrowingItemId: string
    returnQuantity: number
  }>>([])
  const [notes, setNotes] = useState('')
  const [returnAll, setReturnAll] = useState(true)

  // Initialize return items when borrowing changes
  React.useEffect(() => {
    if (borrowing) {
      const initialReturnItems = borrowing.items
        .filter(item => item.status === BorrowingStatus.ACTIVE)
        .map(item => ({
          borrowingItemId: item.id,
          returnQuantity: item.quantity - item.returnedQuantity
        }))
      setReturnItems(initialReturnItems)
    }
  }, [borrowing])

  if (!borrowing) return null

  const activeItems = borrowing.items.filter(item => item.status === BorrowingStatus.ACTIVE)
  const totalItemsToReturn = returnItems.reduce((sum, item) => sum + item.returnQuantity, 0)

  const updateReturnQuantity = (borrowingItemId: string, quantity: number) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.borrowingItemId === borrowingItemId 
          ? { ...item, returnQuantity: Math.max(0, quantity) }
          : item
      )
    )
  }

  const getMaxReturnQuantity = (borrowingItemId: string) => {
    const item = borrowing.items.find(i => i.id === borrowingItemId)
    return item ? item.quantity - item.returnedQuantity : 0
  }

  const getItemDetails = (borrowingItemId: string) => {
    return borrowing.items.find(i => i.id === borrowingItemId)
  }

  const handleReturnAll = () => {
    if (returnAll) {
      // Set all quantities to maximum returnable
      setReturnItems(prev => 
        prev.map(item => ({
          ...item,
          returnQuantity: getMaxReturnQuantity(item.borrowingItemId)
        }))
      )
    } else {
      // Set all quantities to 0
      setReturnItems(prev => 
        prev.map(item => ({ ...item, returnQuantity: 0 }))
      )
    }
  }

  React.useEffect(() => {
    handleReturnAll()
  }, [returnAll])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0)
    
    if (itemsToReturn.length === 0) {
      alert('Pilih minimal satu barang untuk dikembalikan')
      return
    }

    onReturn(borrowing.id, {
      items: itemsToReturn,
      notes
    })
  }

  const isOverdue = new Date() > new Date(borrowing.expectedReturnDate)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kembalikan Barang - ${borrowing.borrowerName}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Borrowing Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Peminjam:</span>
              <span className="ml-2 text-gray-900">{borrowing.borrowerName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tujuan:</span>
              <span className="ml-2 text-gray-900">{borrowing.purpose}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tanggal Pinjam:</span>
              <span className="ml-2 text-gray-900">
                {new Date(borrowing.borrowDate).toLocaleDateString('id-ID')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tanggal Kembali:</span>
              <span className={`ml-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                {new Date(borrowing.expectedReturnDate).toLocaleDateString('id-ID')}
                {isOverdue && ' (Terlambat)'}
              </span>
            </div>
          </div>
        </div>

        {/* Return Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">
              Barang yang Akan Dikembalikan
            </h4>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={returnAll}
                  onChange={(e) => setReturnAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Kembalikan Semua</span>
              </label>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {activeItems.map((item) => {
              const returnItem = returnItems.find(ri => ri.borrowingItemId === item.id)
              const maxReturn = item.quantity - item.returnedQuantity
              
              return (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">{item.item.name}</h5>
                        <p className="text-sm text-gray-500">{item.item.category.name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-gray-600">
                            Dipinjam: <strong>{item.quantity}</strong>
                          </span>
                          {item.returnedQuantity > 0 && (
                            <span className="text-green-600">
                              Sudah dikembalikan: <strong>{item.returnedQuantity}</strong>
                            </span>
                          )}
                          <span className="text-blue-600">
                            Tersisa: <strong>{maxReturn}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        Kembalikan:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxReturn}
                        value={returnItem?.returnQuantity || 0}
                        onChange={(e) => updateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">/ {maxReturn}</span>
                    </div>
                  </div>
                  
                  {returnItem && returnItem.returnQuantity > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {returnItem.returnQuantity} unit akan dikembalikan
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h5 className="font-medium text-blue-900">Ringkasan Pengembalian</h5>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Total barang yang akan dikembalikan: <strong>{totalItemsToReturn} unit</strong></p>
            <p>Dari <strong>{activeItems.length} jenis barang</strong> yang masih dipinjam</p>
            {totalItemsToReturn === activeItems.reduce((sum, item) => sum + (item.quantity - item.returnedQuantity), 0) && (
              <p className="text-green-700 font-medium">✓ Semua barang akan dikembalikan</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <Input
          label="Catatan Pengembalian (Opsional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Kondisi barang, catatan tambahan..."
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            loading={isLoading}
            disabled={totalItemsToReturn === 0}
          >
            Kembalikan ({totalItemsToReturn} unit)
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default PartialReturnModal

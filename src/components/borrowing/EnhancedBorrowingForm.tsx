'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Minus, Search } from 'lucide-react'
import { BorrowingItemForm, FrequentBorrower, BorrowingFormData } from '@/types'

interface AvailableItem {
  id: string;
  name: string;
  stock: number;
  category?: { name: string };
}

interface EnhancedBorrowingFormProps {
  onSubmit: (data: BorrowingFormData) => void
  onCancel: () => void
  availableItems: AvailableItem[]
  isLoading?: boolean
}

const EnhancedBorrowingForm: React.FC<EnhancedBorrowingFormProps> = ({
  onSubmit,
  onCancel,
  availableItems,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    borrowerName: '',
    purpose: '',
    expectedReturnDate: '',
    notes: '',
    items: [{ itemId: '', quantity: 1, notes: '' }] as BorrowingItemForm[]
  })

  const [frequentBorrowers, setFrequentBorrowers] = useState<FrequentBorrower[]>([])
  const [showBorrowerDropdown, setShowBorrowerDropdown] = useState(false)
  const [borrowerSearch, setBorrowerSearch] = useState('')

  // Fetch frequent borrowers
  useEffect(() => {
    const fetchFrequentBorrowers = async () => {
      try {
        const response = await fetch('/api/frequent-borrowers')
        if (response.ok) {
          const data = await response.json()
          setFrequentBorrowers((data.data as FrequentBorrower[]) || [])
        }
      } catch (error) {
        console.error('Error fetching frequent borrowers:', error)
      }
    }

    fetchFrequentBorrowers()
  }, [])

  // Filter frequent borrowers based on search
  const filteredBorrowers = frequentBorrowers.filter(borrower =>
    borrower.name.toLowerCase().includes(borrowerSearch.toLowerCase())
  )

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', quantity: 1, notes: '' }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const updateItem = (index: number, field: keyof BorrowingItemForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleBorrowerNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, borrowerName: value }))
    setBorrowerSearch(value)
    setShowBorrowerDropdown(value.length > 0 && filteredBorrowers.length > 0)
  }

  const selectBorrower = (borrower: FrequentBorrower) => {
    setFormData(prev => ({ ...prev, borrowerName: borrower.name }))
    setBorrowerSearch(borrower.name)
    setShowBorrowerDropdown(false)
  }

  const getAvailableStock = (itemId: string) => {
    const item = availableItems.find(i => i.id === itemId)
    return item?.stock || 0
  }

  const getItemName = (itemId: string) => {
    const item = availableItems.find(i => i.id === itemId)
    return item ? `${item.name} (${item.category?.name || 'Unknown'})` : ''
  }

  const validateForm = () => {
    if (!formData.borrowerName || !formData.purpose || !formData.expectedReturnDate) {
      return false
    }

    return formData.items.every(item =>
      item.itemId &&
      item.quantity > 0 &&
      item.quantity <= getAvailableStock(item.itemId)
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Mohon lengkapi semua field yang diperlukan dan periksa jumlah barang')
      return
    }

    // Filter out items that are already selected to prevent duplicates
    const uniqueItems = formData.items.filter((item, index, self) =>
      item.itemId && self.findIndex(i => i.itemId === item.itemId) === index
    )

    onSubmit({
      ...formData,
      items: uniqueItems
    })
  }

  const totalItems = formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Borrower Name with Autocomplete */}
      <div className="relative">
        <Input
          label="Nama Peminjam"
          value={formData.borrowerName}
          onChange={(e) => handleBorrowerNameChange(e.target.value)}
          placeholder="Ketik nama peminjam..."
          required
          rightIcon={<Search className="h-4 w-4" />}
        />

        {/* Frequent Borrowers Dropdown */}
        {showBorrowerDropdown && filteredBorrowers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredBorrowers.map((borrower) => (
              <div
                key={borrower.id}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => selectBorrower(borrower)}
              >
                <div className="font-medium text-gray-900">{borrower.name}</div>
                <div className="text-sm text-gray-500">
                  {borrower.borrowCount} kali peminjaman • Terakhir: {new Date(borrower.lastBorrow).toLocaleDateString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purpose */}
      <Input
        label="Tujuan Peminjaman"
        value={formData.purpose}
        onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
        placeholder="Contoh: Presentasi klien, Meeting tim, Work from home"
        required
      />

      {/* Expected Return Date */}
      <Input
        label="Tanggal Kembali"
        type="date"
        value={formData.expectedReturnDate}
        onChange={(e) => setFormData(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
        required
      />

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-900">
            Barang yang Dipinjam ({formData.items.length} jenis, {totalItems} total)
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Barang</span>
          </Button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <h5 className="font-medium text-gray-700">Barang #{index + 1}</h5>
              {formData.items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Barang
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={item.itemId}
                  onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                  required
                >
                  <option value="">Pilih Barang</option>
                  {availableItems
                    .filter(availableItem =>
                      availableItem.stock > 0 &&
                      !formData.items.some((formItem, formIndex) =>
                        formIndex !== index && formItem.itemId === availableItem.id
                      )
                    )
                    .map((availableItem) => (
                      <option key={availableItem.id} value={availableItem.id}>
                        {availableItem.name} ({availableItem.category?.name || 'Unknown'}) - Stok: {availableItem.stock}
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah
                </label>
                <input
                  type="number"
                  min="1"
                  max={getAvailableStock(item.itemId)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  required
                />
                {item.itemId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maksimal: {getAvailableStock(item.itemId)} unit
                  </p>
                )}
              </div>
            </div>

            {/* Item Notes */}
            <Input
              label="Catatan untuk Barang Ini (Opsional)"
              value={item.notes || ''}
              onChange={(e) => updateItem(index, 'notes', e.target.value)}
              placeholder="Catatan khusus untuk barang ini..."
            />

            {/* Item Preview */}
            {item.itemId && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>{getItemName(item.itemId)}</strong> - {item.quantity} unit
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* General Notes */}
      <Input
        label="Catatan Umum (Opsional)"
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        placeholder="Catatan tambahan untuk peminjaman ini..."
      />

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Ringkasan Peminjaman</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Peminjam:</strong> {formData.borrowerName || '-'}</p>
          <p><strong>Tujuan:</strong> {formData.purpose || '-'}</p>
          <p><strong>Total Barang:</strong> {formData.items.length} jenis, {totalItems} unit</p>
          <p><strong>Tanggal Kembali:</strong> {formData.expectedReturnDate ? new Date(formData.expectedReturnDate).toLocaleDateString('id-ID') : '-'}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={!validateForm()}
        >
          Pinjam Barang ({totalItems} unit)
        </Button>
      </div>
    </form>
  )
}

export default EnhancedBorrowingForm

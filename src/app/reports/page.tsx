'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FileText, Download, Calendar, Filter, AlertCircle } from 'lucide-react'
import { Activity } from '@/types'
import {
  exportToPDF,
  exportToExcel,
  prepareBorrowingDataForExport,
  exportActivitiesToPDF,
  exportActivitiesToExcel,
  prepareActivityDataForExport
} from '@/lib/exportUtils'

// Types for report data
interface ReportData {
  id: string
  borrowerName: string
  itemName: string
  category: string
  borrowDate: string
  returnDate: string | null
  purpose: string
  status: string
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
const ReportsContent: React.FC = () => {
  const searchParams = useSearchParams()
  const [reportType, setReportType] = useState<'borrowings' | 'activities'>('borrowings')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: '',
    activityType: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [activitiesData, setActivitiesData] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  // Pre-fill filters from URL params (from Calendar integration)
  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    if (dateFrom || dateTo || category || status || type) {
      setFilters({
        dateFrom: dateFrom || '',
        dateTo: dateTo || '',
        category: category || '',
        status: status || '',
        activityType: type || ''
      })

      // If coming from calendar with activity type, switch to activities report
      if (type) {
        setReportType('activities')
      }
    }
  }, [searchParams])

  // Fetch activities data when needed
  const fetchActivities = async () => {
    setIsLoadingActivities(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.activityType) params.append('type', filters.activityType)

      const response = await fetch(`/api/activities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivitiesData((data.data as Activity[]) || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivitiesData([])
    } finally {
      setIsLoadingActivities(false)
    }
  }

  // Fetch activities when report type changes to activities or filters change
  useEffect(() => {
    if (reportType === 'activities') {
      fetchActivities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, filters.dateFrom, filters.dateTo, filters.activityType])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReportTypeChange = (type: 'borrowings' | 'activities') => {
    setReportType(type)
    setExportMessage(null)
  }

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true)
    setExportMessage(null)

    try {
      let result

      if (reportType === 'borrowings') {
        // Convert ReportData to BorrowingForExport format
        const borrowingExportData = filteredData.map(item => ({
          id: item.id,
          borrowerName: item.borrowerName,
          borrowDate: item.borrowDate,
          returnDate: item.returnDate,
          purpose: item.purpose,
          status: item.status,
          items: [{
            item: {
              name: item.itemName,
              category: { name: item.category }
            },
            quantity: 1, // Default quantity since ReportData doesn't have this
            returnedQuantity: item.status === 'Dikembalikan' ? 1 : 0
          }]
        }))

        // Generate borrowings report
        const exportData = prepareBorrowingDataForExport(borrowingExportData)

        if (format === 'pdf') {
          result = await exportToPDF(exportData, filters)
        } else {
          result = await exportToExcel(exportData, filters)
        }
      } else {
        // Convert Activity to ActivityForExport format
        const activityExportData = activitiesData.map(activity => ({
          ...activity,
          createdAt: activity.createdAt.toISOString()
        }))

        // Generate activities report
        const exportData = prepareActivityDataForExport(activityExportData)

        if (format === 'pdf') {
          result = await exportActivitiesToPDF(exportData, filters)
        } else {
          result = await exportActivitiesToExcel(exportData, filters)
        }
      }

      if (result.success) {
        setExportMessage({
          type: 'success',
          message: `Laporan ${reportType === 'borrowings' ? 'Peminjaman' : 'Aktivitas'} ${format.toUpperCase()} berhasil diunduh: ${result.filename}`
        })
      } else {
        setExportMessage({
          type: 'error',
          message: result.error || `Gagal generate laporan ${format.toUpperCase()}`
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportMessage({
        type: 'error',
        message: `Terjadi kesalahan saat generate laporan ${format.toUpperCase()}`
      })
    } finally {
      setIsGenerating(false)

      // Clear message after 5 seconds
      setTimeout(() => {
        setExportMessage(null)
      }, 5000)
    }
  }

  // State for borrowings data
  const [borrowingsData, setBorrowingsData] = useState<ReportData[]>([])
  const [isLoadingBorrowings, setIsLoadingBorrowings] = useState(false)

  // Fetch borrowings data
  const fetchBorrowings = async () => {
    setIsLoadingBorrowings(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/borrowings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Transform data for report format
        const transformedData = data.data?.map((borrowing: {
          id: string;
          borrowerName: string;
          items?: Array<{ item: { name: string; category?: { name: string } } }>;
          borrowDate: string;
          returnDate?: string;
          purpose: string;
          status: string;
        }) => ({
          id: borrowing.id,
          borrowerName: borrowing.borrowerName,
          itemName: borrowing.items?.map((item) => item.item.name).join(', ') || '',
          category: borrowing.items?.[0]?.item.category?.name || '',
          borrowDate: borrowing.borrowDate,
          returnDate: borrowing.returnDate || null,
          purpose: borrowing.purpose,
          status: borrowing.status === 'ACTIVE' ? 'Aktif' :
                  borrowing.status === 'RETURNED' ? 'Dikembalikan' : 'Terlambat'
        })) || []
        setBorrowingsData(transformedData)
      }
    } catch (error) {
      console.error('Error fetching borrowings:', error)
      setBorrowingsData([])
    } finally {
      setIsLoadingBorrowings(false)
    }
  }

  // Fetch borrowings when report type changes to borrowings or filters change
  useEffect(() => {
    if (reportType === 'borrowings') {
      fetchBorrowings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, filters.dateFrom, filters.dateTo, filters.category, filters.status])

  const filteredData = borrowingsData

  const summary = {
    totalBorrowings: filteredData.length,
    totalReturned: filteredData.filter(item => item.status === 'Dikembalikan').length,
    totalActive: filteredData.filter(item => item.status === 'Aktif').length,
    totalOverdue: filteredData.filter(item => item.status === 'Terlambat').length
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
          <p className="text-gray-600 mt-1">
            Generate dan unduh laporan aktivitas inventaris
          </p>

          {/* Pre-filled indicator */}
          {(searchParams.get('dateFrom') || searchParams.get('dateTo')) && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Filter otomatis dari Calendar
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Data telah difilter berdasarkan tanggal yang dipilih di halaman Calendar
              </p>
            </div>
          )}
        </div>

        {/* Report Type Selection */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Jenis Laporan</h3>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="reportType"
                  value="borrowings"
                  checked={reportType === 'borrowings'}
                  onChange={(e) => handleReportTypeChange(e.target.value as 'borrowings')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Laporan Peminjaman</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="reportType"
                  value="activities"
                  checked={reportType === 'activities'}
                  onChange={(e) => handleReportTypeChange(e.target.value as 'activities')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Laporan Aktivitas</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {reportType === 'borrowings'
                ? 'Laporan khusus data peminjaman dan pengembalian barang'
                : 'Laporan semua aktivitas inventaris (tambah barang, update stok, peminjaman, dll)'
              }
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Laporan
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
              <Input
                label="Tanggal Akhir"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />

              {reportType === 'borrowings' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="">Semua Kategori</option>
                      <option value="Elektronik">Elektronik</option>
                      <option value="Aksesoris">Aksesoris</option>
                      <option value="Furniture">Furniture</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">Semua Status</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Dikembalikan">Dikembalikan</option>
                      <option value="Terlambat">Terlambat</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Aktivitas
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={filters.activityType}
                      onChange={(e) => handleFilterChange('activityType', e.target.value)}
                    >
                      <option value="">Semua Aktivitas</option>
                      <option value="ITEM_ADDED">Barang Ditambahkan</option>
                      <option value="ITEM_UPDATED">Barang Diperbarui</option>
                      <option value="ITEM_DELETED">Barang Dihapus</option>
                      <option value="ITEM_BORROWED">Peminjaman</option>
                      <option value="ITEM_RETURNED">Pengembalian</option>
                      <option value="STOCK_UPDATED">Update Stok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori Barang
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="">Semua Kategori</option>
                      <option value="Elektronik">Elektronik</option>
                      <option value="Aksesoris">Aksesoris</option>
                      <option value="Furniture">Furniture</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.totalBorrowings}</p>
                <p className="text-sm text-gray-600">Total Peminjaman</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary.totalReturned}</p>
                <p className="text-sm text-gray-600">Dikembalikan</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{summary.totalActive}</p>
                <p className="text-sm text-gray-600">Aktif</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{summary.totalOverdue}</p>
                <p className="text-sm text-gray-600">Terlambat</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Message */}
        {exportMessage && (
          <div className={`p-4 rounded-lg border ${
            exportMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{exportMessage.message}</span>
            </div>
          </div>
        )}

        {/* Generate Reports */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Generate Laporan
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleGenerateReport('pdf')}
                loading={isGenerating}
                disabled={
                  (reportType === 'borrowings' && filteredData.length === 0) ||
                  (reportType === 'activities' && (activitiesData.length === 0 || isLoadingActivities))
                }
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>{isGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
              </Button>
              <Button
                onClick={() => handleGenerateReport('excel')}
                loading={isGenerating}
                disabled={
                  (reportType === 'borrowings' && filteredData.length === 0) ||
                  (reportType === 'activities' && (activitiesData.length === 0 || isLoadingActivities))
                }
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>{isGenerating ? 'Generating Excel...' : 'Download Excel'}</span>
              </Button>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-gray-500">
                {reportType === 'borrowings'
                  ? `Laporan peminjaman akan mencakup ${filteredData.length} record`
                  : `Laporan aktivitas akan mencakup ${activitiesData.length} record`
                }
                {isLoadingActivities && reportType === 'activities' && ' (Loading...)'}
              </p>
              {((reportType === 'borrowings' && filteredData.length === 0) ||
                (reportType === 'activities' && activitiesData.length === 0 && !isLoadingActivities)) && (
                <p className="text-sm text-red-600">
                  Tidak ada data untuk diekspor. Silakan sesuaikan filter.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Data */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Preview Data Laporan
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Peminjam</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Barang</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Kategori</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Pinjam</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Kembali</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tujuan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{item.borrowerName}</td>
                      <td className="py-3 px-4 text-gray-700">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-700">{item.category}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(item.borrowDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {item.returnDate
                          ? new Date(item.returnDate).toLocaleDateString('id-ID')
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-700">{item.purpose}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Dikembalikan' ? 'text-green-600 bg-green-100' :
                          item.status === 'Aktif' ? 'text-blue-600 bg-blue-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(isLoadingBorrowings || (reportType === 'borrowings' && filteredData.length === 0)) && (
                <div className="text-center py-8 text-gray-500">
                  {isLoadingBorrowings ? 'Memuat data...' : 'Tidak ada data yang sesuai dengan filter yang dipilih'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Template Laporan
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-medium text-gray-900 mb-2">📊 Laporan Bulanan</h4>
                <p className="text-sm text-gray-600">
                  Ringkasan aktivitas peminjaman dalam satu bulan terakhir
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-medium text-gray-900 mb-2">🔍 Laporan Detail</h4>
                <p className="text-sm text-gray-600">
                  Laporan lengkap dengan semua detail peminjaman dan pengembalian
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-medium text-gray-900 mb-2">⚠️ Laporan Overdue</h4>
                <p className="text-sm text-gray-600">
                  Daftar peminjaman yang terlambat dikembalikan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

// Loading component for Suspense fallback
const ReportsLoading: React.FC = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
          <p className="text-gray-600 mt-1">
            Generate dan unduh laporan aktivitas inventaris
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    </AppLayout>
  )
}

// Main component with Suspense boundary
const ReportsPage: React.FC = () => {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent />
    </Suspense>
  )
}

export default ReportsPage

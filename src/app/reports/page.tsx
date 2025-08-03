'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FileText, Download, Calendar, Filter, AlertCircle, AlertTriangle, Package, BarChart3, Activity as ActivityIcon, CheckCircle } from 'lucide-react'
import { Activity, ItemCondition } from '@/types'
import {
  exportToPDF,
  exportToExcel,
  prepareBorrowingDataForExport,
  exportActivitiesToPDF,
  exportActivitiesToExcel,
  prepareActivityDataForExport
} from '@/lib/exportUtils'

// Enhanced types for report data
interface ConditionReportData {
  itemId: string
  itemName: string
  category: string
  totalBorrowings: number
  goodReturns: number
  damagedReturns: number
  lostItems: number
  damageRate: number
  lossRate: number
  lastCondition?: ItemCondition
  maintenanceNeeded: boolean
  estimatedValue: number
  totalLoss: number
}

interface DamageReportData {
  borrowingId: string
  borrowerName: string
  itemName: string
  category: string
  damageDate: string
  condition: ItemCondition
  damagedQuantity: number
  lostQuantity: number
  returnNotes: string
  estimatedCost: number
  severity: 'minor' | 'major' | 'total'
}

interface UtilizationReportData {
  itemId: string
  itemName: string
  category: string
  totalBorrowings: number
  totalDays: number
  utilizationRate: number
  averageBorrowDuration: number
  popularityScore: number
  lastBorrowed?: string
  roi: number
  recommendation: string
}

// Basic report data for borrowings and activities
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

type ReportType = 'borrowings' | 'activities' | 'conditions' | 'damages' | 'utilization'

const ReportsContent: React.FC = () => {
  const searchParams = useSearchParams()
  const [reportType, setReportType] = useState<ReportType>('borrowings')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: '',
    activityType: '',
    condition: '',
    damageLevel: '',
    utilizationLevel: ''
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Data states
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [activitiesData, setActivitiesData] = useState<Activity[]>([])
  const [conditionData, setConditionData] = useState<ConditionReportData[]>([])
  const [damageData, setDamageData] = useState<DamageReportData[]>([])
  const [utilizationData, setUtilizationData] = useState<UtilizationReportData[]>([])

  // Pre-fill filters from URL params (from Calendar integration)
  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      setFilters(prev => ({
        ...prev,
        dateFrom: dateFrom || '',
        dateTo: dateTo || ''
      }))
    }
  }, [searchParams])

  // Fetch data based on report type
  useEffect(() => {
    fetchReportData()
  }, [reportType, filters.dateFrom, filters.dateTo, filters.category, filters.status, filters.activityType, filters.condition, filters.damageLevel, filters.utilizationLevel, fetchReportData])

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      let endpoint = ''
      switch (reportType) {
        case 'borrowings':
          endpoint = `/api/borrowings?${queryParams}`
          break
        case 'activities':
          endpoint = `/api/activities?${queryParams}`
          break
        case 'conditions':
          endpoint = `/api/reports/conditions?${queryParams}`
          break
        case 'damages':
          endpoint = `/api/reports/damages?${queryParams}`
          break
        case 'utilization':
          endpoint = `/api/reports/utilization?${queryParams}`
          break
        default:
          return
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()

        switch (reportType) {
          case 'borrowings':
            // Transform borrowing data to report format
            const borrowings = data.data || []
            const transformedData = borrowings.flatMap((borrowing: Record<string, unknown>) =>
              borrowing.items?.map((item: Record<string, unknown>) => ({
                id: borrowing.id,
                borrowerName: borrowing.borrowerName,
                itemName: item.item?.name || 'Unknown',
                category: item.item?.category?.name || 'Unknown',
                borrowDate: borrowing.borrowDate,
                returnDate: borrowing.returnDate,
                purpose: borrowing.purpose,
                status: borrowing.status
              })) || []
            )
            setReportData(transformedData)
            break
          case 'activities':
            setActivitiesData(data.data || [])
            break
          case 'conditions':
            setConditionData(data.data || [])
            break
          case 'damages':
            setDamageData(data.data || [])
            break
          case 'utilization':
            setUtilizationData(data.data || [])
            break
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type)
    setExportMessage(null)
  }

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true)
    setExportMessage(null)

    try {
      let result

      if (reportType === 'borrowings') {
        const exportData = prepareBorrowingDataForExport(reportData.map(item => ({
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
            quantity: 1,
            returnedQuantity: item.status === 'RETURNED' ? 1 : 0
          }]
        })))

        if (format === 'pdf') {
          result = await exportToPDF(exportData, filters)
        } else {
          result = await exportToExcel(exportData, filters)
        }
      } else if (reportType === 'activities') {
        const exportData = prepareActivityDataForExport(activitiesData.map(activity => ({
          ...activity,
          createdAt: activity.createdAt.toString()
        })))

        if (format === 'pdf') {
          result = await exportActivitiesToPDF(exportData, filters)
        } else {
          result = await exportActivitiesToExcel(exportData, filters)
        }
      } else {
        // For enhanced reports, create simple export
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `${reportType}-report-${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`

        // Simple implementation - in production, you'd want proper PDF/Excel generation
        let dataToExport: Record<string, unknown>[] = []
        switch (reportType) {
          case 'conditions':
            dataToExport = conditionData
            break
          case 'damages':
            dataToExport = damageData
            break
          case 'utilization':
            dataToExport = utilizationData
            break
        }

        // Create and download JSON for now (in production, implement proper PDF/Excel)
        const jsonData = JSON.stringify(dataToExport, null, 2)
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename.replace('.pdf', '.json').replace('.xlsx', '.json')
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        result = { success: true, filename: a.download }
      }

      if (result && result.success) {
        setExportMessage({
          type: 'success',
          message: `Laporan ${reportType} berhasil diunduh: ${result.filename}`
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      setExportMessage({
        type: 'error',
        message: `Gagal generate laporan ${format.toUpperCase()}`
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting & Export</h1>
          <p className="text-gray-600 mt-1">
            Generate dan export laporan inventaris dalam berbagai format
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
            <p className="text-sm text-gray-600">Pilih jenis laporan yang ingin dibuat dan diexport</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Basic Reports */}
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'borrowings'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="borrowings"
                  checked={reportType === 'borrowings'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Peminjaman</span>
                <p className="text-xs text-gray-600 text-center mt-1">Data peminjaman & pengembalian</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'activities'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="activities"
                  checked={reportType === 'activities'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <ActivityIcon className="h-8 w-8 text-green-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Aktivitas</span>
                <p className="text-xs text-gray-600 text-center mt-1">Log semua aktivitas sistem</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'conditions'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="conditions"
                  checked={reportType === 'conditions'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <Package className="h-8 w-8 text-purple-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Kondisi Barang</span>
                <p className="text-xs text-gray-600 text-center mt-1">Analisis kondisi & maintenance</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'damages'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="damages"
                  checked={reportType === 'damages'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Kerusakan</span>
                <p className="text-xs text-gray-600 text-center mt-1">Laporan kerusakan & biaya</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'utilization'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="utilization"
                  checked={reportType === 'utilization'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Utilisasi</span>
                <p className="text-xs text-gray-600 text-center mt-1">Tingkat penggunaan barang</p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Laporan</span>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Kendaraan">Kendaraan</option>
                  <option value="Alat Tulis">Alat Tulis</option>
                  <option value="Peralatan">Peralatan</option>
                </select>
              </div>

              {/* Report-specific filters */}
              {reportType === 'borrowings' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua Status</option>
                    <option value="ACTIVE">Sedang Dipinjam</option>
                    <option value="RETURNED">Dikembalikan</option>
                    <option value="OVERDUE">Terlambat</option>
                  </select>
                </div>
              )}

              {reportType === 'activities' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Aktivitas</label>
                  <select
                    value={filters.activityType}
                    onChange={(e) => handleFilterChange('activityType', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua Aktivitas</option>
                    <option value="ITEM_ADDED">Barang Ditambah</option>
                    <option value="ITEM_UPDATED">Barang Diupdate</option>
                    <option value="ITEM_BORROWED">Barang Dipinjam</option>
                    <option value="ITEM_RETURNED">Barang Dikembalikan</option>
                    <option value="ITEM_DAMAGED">Barang Rusak</option>
                    <option value="ITEM_LOST">Barang Hilang</option>
                    <option value="STOCK_UPDATED">Stok Diupdate</option>
                  </select>
                </div>
              )}

              {reportType === 'conditions' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua Kondisi</option>
                    <option value="GOOD">Baik</option>
                    <option value="DAMAGED">Rusak</option>
                    <option value="LOST">Hilang</option>
                    <option value="INCOMPLETE">Tidak Lengkap</option>
                  </select>
                </div>
              )}

              {reportType === 'damages' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Kerusakan</label>
                  <select
                    value={filters.damageLevel}
                    onChange={(e) => handleFilterChange('damageLevel', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua Tingkat</option>
                    <option value="minor">Kerusakan Ringan</option>
                    <option value="major">Kerusakan Berat</option>
                    <option value="total">Rusak Total</option>
                    <option value="lost">Hilang</option>
                  </select>
                </div>
              )}

              {reportType === 'utilization' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Utilisasi</label>
                  <select
                    value={filters.utilizationLevel}
                    onChange={(e) => handleFilterChange('utilizationLevel', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua Tingkat</option>
                    <option value="high">Tinggi (&gt;80%)</option>
                    <option value="medium">Sedang (40-80%)</option>
                    <option value="low">Rendah (&lt;40%)</option>
                    <option value="unused">Tidak Pernah Dipinjam</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate Reports */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Generate & Export Laporan
            </h3>
            <p className="text-sm text-gray-600">Export laporan dalam format PDF atau Excel</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleGenerateReport('pdf')}
                loading={isGenerating}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
              >
                <FileText className="h-4 w-4" />
                <span>Download PDF</span>
              </Button>

              <Button
                onClick={() => handleGenerateReport('excel')}
                loading={isGenerating}
                disabled={isLoading}
                variant="outline"
                className="flex items-center space-x-2 border-green-600 text-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4" />
                <span>Download Excel</span>
              </Button>
            </div>

            {exportMessage && (
              <div className={`mt-4 p-3 rounded-lg ${
                exportMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {exportMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{exportMessage.message}</span>
                </div>
              </div>
            )}

            {/* Data Preview */}
            {!isLoading && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Preview Data</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Records:</span>
                    <span className="ml-2 font-medium">
                      {reportType === 'borrowings' ? reportData.length :
                       reportType === 'activities' ? activitiesData.length :
                       reportType === 'conditions' ? conditionData.length :
                       reportType === 'damages' ? damageData.length :
                       reportType === 'utilization' ? utilizationData.length : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Report Type:</span>
                    <span className="ml-2 font-medium capitalize">{reportType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date Range:</span>
                    <span className="ml-2 font-medium">
                      {filters.dateFrom || 'All'} - {filters.dateTo || 'All'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{filters.category || 'All'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

// Loading component
const ReportsLoading: React.FC = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting & Export</h1>
          <p className="text-gray-600 mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading reports...</span>
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

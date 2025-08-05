'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FileText, Download, Calendar, AlertCircle, Package, BarChart3, CheckCircle, Activity as ActivityIcon } from 'lucide-react'
import { Activity, ItemCondition } from '@/types'
import {
  exportToPDF,
  exportToExcel,
  prepareBorrowingDataForExport,
  exportActivitiesToPDF,
  exportActivitiesToExcel,
  prepareActivityDataForExport,
  exportEnhancedReportToPDF,
  exportEnhancedReportToExcel
} from '@/lib/exportUtils'

// Enhanced types for report data
interface _ConditionReportData {
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

interface _DamageReportData {
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

interface _UtilizationReportData {
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
  id?: string
  borrowerName?: string
  requesterName?: string
  itemName?: string
  name?: string
  category?: string
  borrowDate?: string
  returnDate?: string | null
  purpose?: string
  status?: string
  transactionDate?: string
  items?: any[]
  condition?: string
  utilizationRate?: number
  damageRate?: number
  [key: string]: any
}

type ReportType = 'all-activities' | 'tools' | 'materials' | 'conditions-damage-utilization' | 'borrowings' | 'activities'

const ReportsContent: React.FC = () => {
  const searchParams = useSearchParams()
  const [reportType, setReportType] = useState<ReportType>('all-activities')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: ''
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Data states
  const [allActivitiesData, setAllActivitiesData] = useState<Activity[]>([])
  const [toolsData, setToolsData] = useState<ReportData[]>([])
  const [materialsData, setMaterialsData] = useState<ReportData[]>([])
  const [conditionsData, setConditionsData] = useState<ReportData[]>([])
  const [previewData, setPreviewData] = useState<ReportData[]>([])

  // Pre-fill filters from URL params (from Calendar integration)
  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const reportTypeParam = searchParams.get('reportType')

    if (dateFrom || dateTo) {
      setFilters(prev => ({
        ...prev,
        dateFrom: dateFrom || '',
        dateTo: dateTo || ''
      }))
    }

    // Set report type based on calendar selection
    if (reportTypeParam) {
      switch (reportTypeParam) {
        case 'tools':
          setReportType('tools')
          break
        case 'materials':
          setReportType('materials')
          break
        case 'conditions':
          setReportType('conditions-damage-utilization')
          break
        default:
          setReportType('all-activities')
      }
    }
  }, [searchParams])

  // Fetch data based on report type
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      let endpoint = ''
      switch (reportType) {
        case 'all-activities':
          endpoint = `/api/transactions?${queryParams}`
          break
        case 'tools':
          endpoint = `/api/transactions?type=BORROWING&${queryParams}`
          break
        case 'materials':
          endpoint = `/api/transactions?type=REQUEST&${queryParams}`
          break
        case 'conditions-damage-utilization':
          endpoint = `/api/reports/comprehensive?${queryParams}`
          break
        default:
          return
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result

        switch (reportType) {
          case 'all-activities':
            setAllActivitiesData(data)
            setPreviewData(data.slice(0, 10)) // Show first 10 for preview
            break
          case 'tools':
            setToolsData(data)
            setPreviewData(data.slice(0, 10))
            break
          case 'materials':
            setMaterialsData(data)
            setPreviewData(data.slice(0, 10))
            break
          case 'conditions-damage-utilization':
            setConditionsData(data)
            setPreviewData(data.slice(0, 10))
            break
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  fetchReportData()
}, [reportType, filters])

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
        const exportData = prepareBorrowingDataForExport(previewData.map((item: any) => ({
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
        const exportData = prepareActivityDataForExport(allActivitiesData.map((activity: any) => ({
          ...activity,
          createdAt: activity.createdAt.toString()
        })))

        if (format === 'pdf') {
          result = await exportActivitiesToPDF(exportData, filters)
        } else {
          result = await exportActivitiesToExcel(exportData, filters)
        }
      } else {
        // For enhanced reports, use proper export functions
        let dataToExport: ReportData[] = []
        switch (reportType) {
          case 'tools':
            dataToExport = toolsData
            break
          case 'materials':
            dataToExport = materialsData
            break
          case 'conditions-damage-utilization':
            dataToExport = conditionsData
            break
          default:
            dataToExport = []
        }

        if (format === 'pdf') {
          result = await exportEnhancedReportToPDF(dataToExport, reportType, filters)
        } else {
          result = await exportEnhancedReportToExcel(dataToExport, reportType, filters)
        }
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
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Reporting & Export</h1>
          <p className="text-gray-600 text-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* New Report Types */}
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'all-activities'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="all-activities"
                  checked={reportType === 'all-activities'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <ActivityIcon className="h-8 w-8 text-blue-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Semua Aktivitas</span>
                <p className="text-xs text-gray-600 text-center mt-1">Semua transaksi tools & materials</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'tools'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="tools"
                  checked={reportType === 'tools'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <Package className="h-8 w-8 text-green-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Tools</span>
                <p className="text-xs text-gray-600 text-center mt-1">Peminjaman & pengembalian tools</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'materials'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="materials"
                  checked={reportType === 'materials'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <Package className="h-8 w-8 text-purple-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Materials</span>
                <p className="text-xs text-gray-600 text-center mt-1">Permintaan & konsumsi materials</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reportType === 'conditions-damage-utilization'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="conditions-damage-utilization"
                  checked={reportType === 'conditions-damage-utilization'}
                  onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                  className="sr-only"
                />
                <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                <span className="font-medium text-gray-900 text-center">Kondisi & Utilisasi</span>
                <p className="text-xs text-gray-600 text-center mt-1">Gabungan kondisi, kerusakan & utilisasi</p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Generate Reports */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Generate & Export Laporan
                </h3>
                <p className="text-sm text-gray-600">Export laporan dalam format PDF atau Excel</p>
              </div>

              {/* Integrated Date Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tanggal Mulai:</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tanggal Akhir:</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </div>
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
            {!isLoading && previewData.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Preview Data</h4>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-gray-600">Total Records:</span>
                    <span className="ml-2 font-medium">
                      {reportType === 'all-activities' ? allActivitiesData.length :
                       reportType === 'tools' ? toolsData.length :
                       reportType === 'materials' ? materialsData.length :
                       reportType === 'conditions-damage-utilization' ? conditionsData.length : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Report Type:</span>
                    <span className="ml-2 font-medium capitalize">{reportType.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date Range:</span>
                    <span className="ml-2 font-medium">
                      {filters.dateFrom || 'All'} - {filters.dateTo || 'All'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Preview:</span>
                    <span className="ml-2 font-medium">First {previewData.length} records</span>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {reportType === 'all-activities' || reportType === 'tools' || reportType === 'materials' ? (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tujuan</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kondisi</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisasi</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kerusakan</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {reportType === 'all-activities' || reportType === 'tools' || reportType === 'materials' ? (
                              <>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.requesterName || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.purpose || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {item.transactionDate ? new Date(item.transactionDate).toLocaleDateString('id-ID') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                                    item.status === 'RETURNED' ? 'bg-green-100 text-green-800' :
                                    item.status === 'CONSUMED' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {item.status || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {item.items ? `${item.items.length} items` : 'N/A'}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.itemName || item.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.condition || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.utilizationRate || 'N/A'}%</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.damageRate || 'N/A'}%</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
          <h1 className="text-2xl font-bold text-gray-900">Reporting & Export</h1>
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

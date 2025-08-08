'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FileText, Download, Calendar, AlertCircle, Package, BarChart3, CheckCircle, Activity as ActivityIcon } from 'lucide-react'
import { ItemCondition } from '@/types'
import {
  prepareBorrowingDataForExport,
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
  items?: Record<string, unknown>[]
  condition?: string
  utilizationRate?: number
  damageRate?: number
  [key: string]: unknown
}

type ReportType = 'all-activities' | 'tools' | 'materials' | 'conditions-damage-utilization' | 'borrowings' | 'activities'

interface ReportTypeOptionProps {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
  currentType: ReportType;
  onClick: (type: ReportType) => void;
}

const ReportTypeOption: React.FC<ReportTypeOptionProps> = ({ type, label, description, icon, currentType, onClick }) => {
  const colorClasses = {
    'all-activities': 'border-blue-500 bg-blue-50 text-blue-800',
    'tools': 'border-green-500 bg-green-50 text-green-800',
    'materials': 'border-purple-500 bg-purple-50 text-purple-800',
    'conditions-damage-utilization': 'border-orange-500 bg-orange-50 text-orange-800',
    'borrowings': 'border-yellow-500 bg-yellow-50 text-yellow-800',
    'activities': 'border-cyan-500 bg-cyan-50 text-cyan-800',
  };

  const selectedClass = colorClasses[type] || 'border-gray-200';

  return (
    <label
      className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
        currentType === type ? selectedClass : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        name="reportType"
        value={type}
        checked={currentType === type}
        onChange={() => onClick(type)}
        className="sr-only"
      />
      {icon}
      <span className="font-medium text-gray-900 text-center">{label}</span>
      <p className="text-xs text-gray-600 text-center mt-1">{description}</p>
    </label>
  );
};

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
  const [previewData, setPreviewData] = useState<ReportData[]>([])

  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      setFilters(prev => ({ ...prev, dateFrom: dateFrom || '', dateTo: dateTo || '' }))
    }
  }, [searchParams])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type)
    setExportMessage(null)
  }

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true)
    setIsLoading(true)
    setExportMessage(null)
    setPreviewData([])

    try {
      const queryParams = new URLSearchParams({
        type: reportType,
        ...filters,
      }).toString()

      const response = await fetch(`/api/reports?${queryParams}`)
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      if (result.data.length === 0) {
        setExportMessage({ type: 'error', message: 'No data found for the selected criteria.' })
        return
      }

      setPreviewData(result.data)

      let preparedData: Array<Record<string, unknown>> = []

      switch (reportType) {
        case 'all-activities':
          preparedData = prepareActivityDataForExport(result.data) as unknown as Array<Record<string, unknown>>
          break
        case 'tools':
          preparedData = prepareBorrowingDataForExport(result.data) as unknown as Array<Record<string, unknown>>
          break
        case 'materials':
          preparedData = prepareBorrowingDataForExport(result.data) as unknown as Array<Record<string, unknown>>
          break
        case 'conditions-damage-utilization':
          preparedData = result.data as unknown as Array<Record<string, unknown>>
          break
      }

      if (format === 'pdf') {
        exportEnhancedReportToPDF(preparedData, reportType, filters)
      } else {
        exportEnhancedReportToExcel(preparedData, reportType, filters)
      }

      setExportMessage({ type: 'success', message: `Successfully generated ${format.toUpperCase()} report.` })
    } catch (error: unknown) {
      console.error('Error generating report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report.'
      setExportMessage({ type: 'error', message: errorMessage })
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
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
              <ReportTypeOption
                type="all-activities"
                label="Semua Aktivitas"
                description="Semua transaksi tools & materials"
                icon={<ActivityIcon className="h-8 w-8 text-blue-600 mb-2" />}
                currentType={reportType}
                onClick={handleReportTypeChange}
              />
              <ReportTypeOption
                type="tools"
                label="Tools"
                description="Peminjaman & pengembalian tools"
                icon={<Package className="h-8 w-8 text-green-600 mb-2" />}
                currentType={reportType}
                onClick={handleReportTypeChange}
              />
              <ReportTypeOption
                type="materials"
                label="Materials"
                description="Permintaan & konsumsi materials"
                icon={<Package className="h-8 w-8 text-purple-600 mb-2" />}
                currentType={reportType}
                onClick={handleReportTypeChange}
              />
              <ReportTypeOption
                type="conditions-damage-utilization"
                label="Kondisi & Utilisasi"
                description="Gabungan kondisi, kerusakan & utilisasi"
                icon={<BarChart3 className="h-8 w-8 text-orange-600 mb-2" />}
                currentType={reportType}
                onClick={handleReportTypeChange}
              />
            </div>
          </CardContent>
        </Card>

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
                  {exportMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span className="text-sm font-medium">{exportMessage.message}</span>
                </div>
              </div>
            )}
            {previewData.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800">Data Preview</h4>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {reportType === 'all-activities' || reportType === 'tools' || reportType === 'materials' ? (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
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
                                <td className="px-4 py-3 text-sm text-gray-900">{item.requesterName || item.borrowerName || 'N/A'}</td>
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

'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { BarChart3, PieChart, TrendingUp, Package, Activity, Wrench, AlertTriangle, Clock } from 'lucide-react'
import { AnalyticsResponse, CategoryDistribution, MostBorrowedItem, LowStockItem } from '@/types'

// KPI Slider Component
const KPISlider: React.FC<{
  totalItems: number;
  totalTools: number;
  totalMaterials: number;
  activeBorrowings: number;
  damagedItems: number;
  damagedReturns: number;
  materialsUsedLastMonth: number; // <-- add this prop
}> = ({ totalItems, totalTools, totalMaterials, activeBorrowings, damagedItems, damagedReturns, materialsUsedLastMonth }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const kpiCards = [
    {
      title: 'Total Semua Item',
      value: totalItems,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Tools',
      value: totalTools,
      icon: Wrench,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-600'
    },
    {
      title: 'Total Materials',
      value: totalMaterials,
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Tools Aktif Dipinjam',
      value: activeBorrowings,
      icon: Activity,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Materials Dipakai (1 Bulan)',
      value: materialsUsedLastMonth, // <-- use real value
      icon: Clock,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Items Rusak',
      value: damagedItems,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-600'
    },
    {
      title: 'Pengembalian Rusak',
      value: damagedReturns,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-600'
    }
  ]

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % (kpiCards.length - 3))
    }, 5000)

    return () => clearInterval(interval)
  }, [kpiCards.length])

  const visibleCards = kpiCards.slice(currentIndex, currentIndex + 4)

  return (
    <div className="relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 transition-all duration-500 ease-in-out">
        {visibleCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Card key={`${currentIndex}-${index}`} className={`glass ${card.bgColor} border-${card.color}-200 transform transition-all duration-500 hover:scale-105`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Slider Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: kpiCards.length - 3 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const CategoryChart: React.FC<{ data: CategoryDistribution[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada data kategori</p>
      </div>
    )
  }

  const maxCount = Math.max(...data.map(item => item.itemCount))

  return (
    <div className="space-y-4">
      {data.map((item, _index) => (
        <div key={item.categoryName} className="flex items-center space-x-4">
          <div className="w-24 text-sm font-medium text-gray-700">
            {item.categoryName}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
            <div
              className="bg-blue-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${(item.itemCount / maxCount) * 100}%` }}
            >
              <span className="text-white text-xs font-medium">
                {item.itemCount}
              </span>
            </div>
          </div>
          <div className="w-12 text-sm text-gray-600">
            {item.percentage}%
          </div>
        </div>
      ))}
    </div>
  )
}

const MostBorrowedChart: React.FC<{ data: MostBorrowedItem[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada data peminjaman</p>
      </div>
    )
  }

  const maxCount = Math.max(...data.map(item => item.borrowCount))

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.itemName} className="flex items-center space-x-4">
          <div className="w-8 text-center">
            <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
          </div>
          <div className="w-32 text-sm font-medium text-gray-700">
            {item.itemName}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
            <div
              className="bg-green-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${(item.borrowCount / maxCount) * 100}%` }}
            >
              <span className="text-white text-xs font-medium">
                {item.borrowCount}x
              </span>
            </div>
          </div>
          <div className="w-20 text-xs text-gray-500">
            {item.categoryName}
          </div>
        </div>
      ))}
    </div>
  )
}

interface MonthlyTrendData {
  month: string;
  toolsBorrowed: number;
  materialsConsumed: number;
}

const TrendChart: React.FC<{ data: MonthlyTrendData[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada data trend</p>
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map(item => Math.max(item.toolsBorrowed, item.materialsConsumed))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Alat Dipinjam</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Material Dipakai</span>
        </div>
      </div>

      <div className="flex items-end justify-between h-48 space-x-2">
        {data.map((item) => (
          <div key={item.month} className="flex flex-col items-center space-y-2 flex-1">
            <div className="flex items-end space-x-1 h-40">
              <div
                className="bg-blue-500 rounded-t transition-all duration-500 w-6"
                style={{ height: `${(item.toolsBorrowed / maxValue) * 100}%` }}
              />
              <div
                className="bg-green-500 rounded-t transition-all duration-500 w-6"
                style={{ height: `${(item.materialsConsumed / maxValue) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 font-medium">
              {item.month}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyActivityTrend, setMonthlyActivityTrend] = useState<MonthlyTrendData[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.data as AnalyticsResponse)
        setMonthlyActivityTrend(data.monthlyActivityTrend || [])
        setLowStockItems(data.lowStockItems || [])
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Memuat data analitik...</span>
        </div>
      </AppLayout>
    )
  }

  const categoryDistribution = analyticsData?.categoryDistribution || []
  const mostBorrowedItems = analyticsData?.mostBorrowedItems || []
  const summary = analyticsData?.summary || {
    totalItems: 0,
    totalTools: 0,
    totalMaterials: 0,
    totalBorrowings: 0,
    activeBorrowings: 0,
    damagedItems: 0,
    damagedReturns: 0,
    materialsUsedLastMonth: 0
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Analitik, visualisasi data dan insight inventaris
          </p>
        </div>

        {/* KPI Cards Slider */}
        <KPISlider
          totalItems={summary.totalItems}
          totalTools={summary.totalTools}
          totalMaterials={summary.totalMaterials}
          activeBorrowings={summary.activeBorrowings}
          damagedItems={summary.damagedItems}
          damagedReturns={summary.damagedReturns}
          materialsUsedLastMonth={summary.materialsUsedLastMonth}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card className="glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                Distribusi Kategori
              </h3>
              <p className="text-sm text-gray-600">
                Jumlah barang per kategori
              </p>
            </CardHeader>
            <CardContent>
              <CategoryChart data={categoryDistribution} />
            </CardContent>
          </Card>

          {/* Most Borrowed Items */}
          <Card className="glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Barang Paling Sering Dipinjam
              </h3>
              <p className="text-sm text-gray-600">
                Top 5 item dengan peminjaman terbanyak
              </p>
            </CardHeader>
            <CardContent>
              <MostBorrowedChart data={mostBorrowedItems} />
            </CardContent>
          </Card>
        </div>

        {/* Monthly Activity Trend */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Trend Aktivitas Bulanan
            </h3>
            <p className="text-sm text-gray-600">
              Perbandingan peminjaman alat dan pemakaian material per bulan
            </p>
          </CardHeader>
          <CardContent>
            <TrendChart data={monthlyActivityTrend} />
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Stok Segera Habis
            </h3>
            <p className="text-sm text-gray-600">
              Barang yang stoknya di bawah batas minimum
            </p>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {lowStockItems.map(item => (
                  <li key={item.id} className="py-3 flex justify-between items-center">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-sm text-red-600">
                      Sisa: {item.stock} (Min: {item.minStock})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">Stok semua barang aman.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default AnalyticsPage

'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { BarChart3, PieChart, TrendingUp, Package, Activity } from 'lucide-react'
import { AnalyticsResponse, CategoryDistribution, MostBorrowedItem } from '@/types'

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
  borrowCount: number;
  returnCount: number;
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
    ...data.map(item => Math.max(item.borrowCount, item.returnCount))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Peminjaman</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Pengembalian</span>
        </div>
      </div>

      <div className="flex items-end justify-between h-48 space-x-2">
        {data.map((item) => (
          <div key={item.month} className="flex flex-col items-center space-y-2 flex-1">
            <div className="flex items-end space-x-1 h-40">
              <div
                className="bg-blue-500 rounded-t transition-all duration-500 w-6"
                style={{ height: `${(item.borrowCount / maxValue) * 100}%` }}
              />
              <div
                className="bg-green-500 rounded-t transition-all duration-500 w-6"
                style={{ height: `${(item.returnCount / maxValue) * 100}%` }}
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
  const monthlyTrend = analyticsData?.monthlyTrend || []

  const totalItems = categoryDistribution.reduce((sum: number, item: CategoryDistribution) => sum + item.itemCount, 0)
  const totalBorrowings = mostBorrowedItems.reduce((sum: number, item: MostBorrowedItem) => sum + item.borrowCount, 0)
  const avgBorrowingPerMonth = monthlyTrend.length > 0 ? Math.round(
    monthlyTrend.reduce((sum: number, item: MonthlyTrendData) => sum + item.borrowCount, 0) / monthlyTrend.length
  ) : 0

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analitik</h1>
          <p className="text-gray-600 mt-1">
            Visualisasi data dan insight inventaris
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Item</p>
                  <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Peminjaman</p>
                  <p className="text-2xl font-bold text-green-600">{totalBorrowings}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rata-rata/Bulan</p>
                  <p className="text-2xl font-bold text-purple-600">{avgBorrowingPerMonth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kategori</p>
                  <p className="text-2xl font-bold text-orange-600">{categoryDistribution.length}</p>
                </div>
                <PieChart className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Monthly Trend */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Trend Peminjaman Bulanan
            </h3>
            <p className="text-sm text-gray-600">
              Perbandingan peminjaman dan pengembalian per bulan
            </p>
          </CardHeader>
          <CardContent>
            <TrendChart data={monthlyTrend} />
          </CardContent>
        </Card>

        {/* Dynamic Insights */}
        {analyticsData?.insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analyticsData.insights.map((insight, index: number) => (
              <Card key={index} className={`glass border-l-4 ${
                index === 0 ? 'border-l-blue-500' :
                index === 1 ? 'border-l-green-500' : 'border-l-purple-500'
              }`}>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Default insights when no data */}
        {(!analyticsData?.insights || analyticsData.insights.length === 0) && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada insight</h3>
            <p className="text-gray-600">Data insight akan muncul setelah ada aktivitas inventaris</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default AnalyticsPage

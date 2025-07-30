'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Package, AlertTriangle, ArrowRightLeft, Clock, Activity } from 'lucide-react'
import { Activity as ActivityType, DashboardData } from '@/types'

const KPICard: React.FC<{
  title: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
}> = ({ title, value, icon, color, bgColor }) => {
  return (
    <Card className="glass hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ActivityItem: React.FC<{
  activity: ActivityType
}> = ({ activity }) => {
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'ITEM_BORROWED':
        return 'text-blue-600 bg-blue-100'
      case 'ITEM_RETURNED':
        return 'text-green-600 bg-green-100'
      case 'ITEM_ADDED':
        return 'text-purple-600 bg-purple-100'
      case 'STOCK_UPDATED':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type).split(' ')[1]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{activity.description}</p>
        <p className="text-xs text-gray-500">{formatTime(activity.createdAt)}</p>
      </div>
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.data as DashboardData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Memuat dashboard...</span>
        </div>
      </AppLayout>
    )
  }

  const kpi = dashboardData?.kpi || {
    totalItems: 0,
    lowStockItems: 0,
    totalBorrowedItems: 0,
    overdueItems: 0
  }

  const recentActivities = dashboardData?.recentActivities || []
  const quickStats = dashboardData?.quickStats || {
    topCategory: null,
    topLocation: null,
    todayBorrowings: 0,
    todayReturns: 0
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang di DisaTools - Sistem Manajemen Inventaris
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Barang"
            value={kpi.totalItems}
            icon={<Package className="h-6 w-6 text-blue-600" />}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <KPICard
            title="Stok Rendah"
            value={kpi.lowStockItems}
            icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
          />
          <KPICard
            title="Sedang Dipinjam"
            value={kpi.totalBorrowedItems}
            icon={<ArrowRightLeft className="h-6 w-6 text-green-600" />}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <KPICard
            title="Terlambat"
            value={kpi.overdueItems}
            icon={<Clock className="h-6 w-6 text-red-600" />}
            color="text-red-600"
            bgColor="bg-red-100"
          />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Aktivitas Terbaru
              </h3>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada aktivitas terbaru</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivities.map((activity: ActivityType) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Ringkasan Cepat
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kategori Terbanyak</span>
                  <span className="text-sm font-medium">
                    {quickStats.topCategory ?
                      `${quickStats.topCategory.name} (${quickStats.topCategory.count})` :
                      'Belum ada data'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lokasi Terpadat</span>
                  <span className="text-sm font-medium">
                    {quickStats.topLocation ?
                      `${quickStats.topLocation.name} (${quickStats.topLocation.count})` :
                      'Belum ada data'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Peminjaman Hari Ini</span>
                  <span className="text-sm font-medium">{quickStats.todayBorrowings || 0} item</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pengembalian Hari Ini</span>
                  <span className="text-sm font-medium">{quickStats.todayReturns || 0} item</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export default DashboardPage

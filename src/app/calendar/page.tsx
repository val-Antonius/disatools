'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Package, ArrowRightLeft, RotateCcw, FileText, Activity } from 'lucide-react'
import { ActivityType, Activity as ActivityInterface } from '@/types'

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case ActivityType.ITEM_ADDED:
      return 'bg-green-500'
    case ActivityType.ITEM_BORROWED:
      return 'bg-blue-500'
    case ActivityType.ITEM_RETURNED:
      return 'bg-orange-500'
    case ActivityType.STOCK_UPDATED:
      return 'bg-purple-500'
    default:
      return 'bg-gray-500'
  }
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case ActivityType.ITEM_ADDED:
      return <Plus className="h-3 w-3" />
    case ActivityType.ITEM_BORROWED:
      return <ArrowRightLeft className="h-3 w-3" />
    case ActivityType.ITEM_RETURNED:
      return <RotateCcw className="h-3 w-3" />
    case ActivityType.STOCK_UPDATED:
      return <Package className="h-3 w-3" />
    default:
      return <CalendarIcon className="h-3 w-3" />
  }
}

const CalendarPage: React.FC = () => {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<ActivityInterface[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Fetch activities data
  useEffect(() => {
    fetchActivities()
  }, [currentDate])

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      // Get first and last day of current month for API call
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const params = new URLSearchParams({
        dateFrom: firstDay.toISOString().split('T')[0],
        dateTo: lastDay.toISOString().split('T')[0]
      })

      const response = await fetch(`/api/activities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.createdAt)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDateClick = (date: Date) => {
    const events = getEventsForDate(date)
    if (events.length > 0) {
      setSelectedDate(date)
      setIsModalOpen(true)
    }
  }

  const handleCreateReport = (activityType?: string) => {
    if (!selectedDate) return

    // Format dates for URL params
    const dateStr = selectedDate.toISOString().split('T')[0]

    // Navigate to reports page with pre-filled date and activity type
    const params = new URLSearchParams({
      dateFrom: dateStr,
      dateTo: dateStr
    })

    if (activityType) {
      params.append('type', activityType)
    }

    router.push(`/reports?${params.toString()}`)
  }

  const handleCreateMonthReport = () => {
    // Get first and last day of current month
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const params = new URLSearchParams({
      dateFrom: firstDay.toISOString().split('T')[0],
      dateTo: lastDay.toISOString().split('T')[0]
    })

    router.push(`/reports?${params.toString()}`)
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const days = getDaysInMonth(currentDate)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
            <p className="text-gray-600 mt-1">
              Lihat aktivitas inventaris berdasarkan tanggal
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleCreateMonthReport}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Laporan Bulan Ini</span>
            </Button>
            <Button onClick={() => setCurrentDate(new Date())} variant="outline">
              Hari Ini
            </Button>
          </div>
        </div>

        {/* Legend */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Barang Ditambahkan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Peminjaman</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Pengembalian</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Update Stok</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="glass">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Memuat kalender...</span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="p-2 h-24"></div>
                  }

                  const events = getEventsForDate(day)
                  const isToday = day.toDateString() === new Date().toDateString()
                  const hasEvents = events.length > 0

                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-2 h-24 border border-gray-100 cursor-pointer transition-colors relative ${
                        isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      } ${hasEvents ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                      onClick={() => hasEvents && handleDateClick(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>

                      <div className="space-y-1">
                        {events.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded text-white flex items-center space-x-1 ${getActivityColor(event.type)}`}
                          >
                            {getActivityIcon(event.type)}
                            <span className="truncate">{event.description?.split(' ').slice(0, 2).join(' ') || 'Aktivitas'}</span>
                          </div>
                        ))}

                        {events.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{events.length - 2} lainnya
                          </div>
                        )}
                      </div>

                    {/* Report indicator */}
                    {hasEvents && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full opacity-60" title="Klik untuk detail dan buat laporan" />
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            )}

            {/* Empty state when no events in month */}
            {!isLoading && events.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada aktivitas</h3>
                <p className="text-gray-600">Aktivitas inventaris akan muncul di kalender ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedDate ? `Aktivitas - ${selectedDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}` : ''}
          size="md"
        >
          <div className="space-y-4">
            {selectedDateEvents.map(event => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full text-white ${getActivityColor(event.type)}`}>
                    {getActivityIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.description}</h4>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">Waktu:</span>
                      <span className="text-xs font-medium text-gray-700">
                        {new Date(event.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {event.itemName && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">Item:</span>
                        <span className="text-xs font-medium text-gray-700">{event.itemName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {selectedDateEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada aktivitas pada tanggal ini
              </div>
            )}

            {/* Action Buttons */}
            {selectedDateEvents.length > 0 && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {/* Activity Type Filter for Report */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buat Laporan Berdasarkan:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateReport()}
                      className="flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Semua Aktivitas</span>
                    </Button>

                    {/* Show specific activity type buttons if they exist */}
                    {selectedDateEvents.some(e => e.type === 'ITEM_BORROWED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateReport('ITEM_BORROWED')}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Peminjaman</span>
                      </Button>
                    )}

                    {selectedDateEvents.some(e => e.type === 'ITEM_RETURNED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateReport('ITEM_RETURNED')}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Pengembalian</span>
                      </Button>
                    )}

                    {selectedDateEvents.some(e => e.type === 'STOCK_UPDATED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateReport('STOCK_UPDATED')}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Update Stok</span>
                      </Button>
                    )}

                    {selectedDateEvents.some(e => e.type === 'ITEM_ADDED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateReport('ITEM_ADDED')}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Barang Ditambahkan</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Recent Activities */}
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Aktivitas Terbaru
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockEvents.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full text-white ${getActivityColor(event.type)}`}>
                    {getActivityIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.description}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default CalendarPage

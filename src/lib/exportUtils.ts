// Export utilities for PDF and Excel generation
import { formatDate, formatDateTime, formatTime } from './utils'

// Types for export data
interface BorrowingItemForExport {
  item: {
    name: string
    category: { name: string }
  }
  quantity: number
  returnedQuantity: number
}

interface BorrowingForExport {
  id: string
  borrowerName: string
  borrowDate: string
  returnDate?: string | null
  purpose: string
  status: string
  items: BorrowingItemForExport[]
}

interface ActivityForExport {
  id: string
  type: string
  description: string
  item?: {
    name: string
    category?: { name: string }
  } | null
  createdAt: string
  metadata?: Record<string, unknown>
}
interface ExportBorrowingData {
  id: string
  borrowerName: string
  itemName: string
  category: string
  borrowDate: string
  returnDate: string | null
  purpose: string
  status: string
  quantity?: number
}

interface ExportActivityData {
  id: string
  type: string
  description: string
  itemName: string
  category: string
  date: string
  time: string
  metadata?: Record<string, unknown>
}

interface ExportFilters {
  dateFrom?: string
  dateTo?: string
  category?: string
  status?: string
}

// PDF Export Function
export const exportToPDF = async (data: ExportBorrowingData[], filters: ExportFilters) => {
  try {
    // Dynamic import to avoid SSR issues
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(74, 144, 226) // Blue color
    doc.text('DisaTools - Laporan Peminjaman', 20, 20)

    // Subtitle with filters
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    let subtitle = 'Laporan Aktivitas Peminjaman'
    if (filters.dateFrom && filters.dateTo) {
      subtitle += ` (${formatDate(new Date(filters.dateFrom))} - ${formatDate(new Date(filters.dateTo))})`
    }
    doc.text(subtitle, 20, 30)

    // Filter info
    let yPos = 40
    doc.setFontSize(10)
    if (filters.category) {
      doc.text(`Kategori: ${filters.category}`, 20, yPos)
      yPos += 7
    }
    if (filters.status) {
      doc.text(`Status: ${filters.status}`, 20, yPos)
      yPos += 7
    }

    // Summary
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total Records: ${data.length}`, 20, yPos + 5)

    // Table
    const tableColumns = [
      'No',
      'Peminjam',
      'Barang',
      'Kategori',
      'Tanggal Pinjam',
      'Tanggal Kembali',
      'Tujuan',
      'Status'
    ]

    const tableRows = data.map((item, index) => [
      (index + 1).toString(),
      item.borrowerName,
      item.itemName,
      item.category,
      item.borrowDate,
      item.returnDate || '-',
      item.purpose,
      item.status
    ])

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: yPos + 15,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [74, 144, 226],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 15 }, // No
        1: { cellWidth: 25 }, // Peminjam
        2: { cellWidth: 30 }, // Barang
        3: { cellWidth: 20 }, // Kategori
        4: { cellWidth: 25 }, // Tanggal Pinjam
        5: { cellWidth: 25 }, // Tanggal Kembali
        6: { cellWidth: 30 }, // Tujuan
        7: { cellWidth: 20 }  // Status
      }
    })

    // Footer
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Generated on ${formatDateTime(new Date())} | Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      )
      doc.text(
        'DisaTools - Inventory Management System',
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      )
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `laporan-peminjaman-${timestamp}.pdf`

    // Save file
    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Error generating PDF:', error)
    return { success: false, error: 'Failed to generate PDF' }
  }
}

// Excel Export Function
export const exportToExcel = async (data: ExportBorrowingData[], filters: ExportFilters) => {
  try {
    // Dynamic import to avoid SSR issues
    const XLSX = await import('xlsx')

    // Prepare data for Excel
    const excelData = data.map((item, index) => ({
      'No': index + 1,
      'Peminjam': item.borrowerName,
      'Barang': item.itemName,
      'Kategori': item.category,
      'Tanggal Pinjam': item.borrowDate,
      'Tanggal Kembali': item.returnDate || '-',
      'Tujuan': item.purpose,
      'Status': item.status,
      ...(item.quantity && { 'Jumlah': item.quantity })
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create main worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 5 },  // No
      { wch: 20 }, // Peminjam
      { wch: 25 }, // Barang
      { wch: 15 }, // Kategori
      { wch: 15 }, // Tanggal Pinjam
      { wch: 15 }, // Tanggal Kembali
      { wch: 30 }, // Tujuan
      { wch: 12 }, // Status
      { wch: 8 }   // Jumlah
    ]
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Peminjaman')

    // Create summary worksheet
    const summaryData = [
      { 'Keterangan': 'Total Records', 'Nilai': data.length },
      { 'Keterangan': 'Tanggal Generate', 'Nilai': formatDateTime(new Date()) },
      ...(filters.dateFrom && filters.dateTo ? [
        { 'Keterangan': 'Periode', 'Nilai': `${formatDate(new Date(filters.dateFrom))} - ${formatDate(new Date(filters.dateTo))}` }
      ] : []),
      ...(filters.category ? [{ 'Keterangan': 'Filter Kategori', 'Nilai': filters.category }] : []),
      ...(filters.status ? [{ 'Keterangan': 'Filter Status', 'Nilai': filters.status }] : [])
    ]

    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `laporan-peminjaman-${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Error generating Excel:', error)
    return { success: false, error: 'Failed to generate Excel' }
  }
}

// Helper function to prepare borrowing data for export
export const prepareBorrowingDataForExport = (borrowings: BorrowingForExport[]): ExportBorrowingData[] => {
  const exportData: ExportBorrowingData[] = []

  borrowings.forEach(borrowing => {
    if (borrowing.items && borrowing.items.length > 0) {
      // Multi-item borrowing - create row for each item
      borrowing.items.forEach((borrowingItem: BorrowingItemForExport) => {
        exportData.push({
          id: borrowing.id,
          borrowerName: borrowing.borrowerName,
          itemName: borrowingItem.item.name,
          category: borrowingItem.item.category.name,
          borrowDate: formatDate(new Date(borrowing.borrowDate)),
          returnDate: borrowing.returnDate ? formatDate(new Date(borrowing.returnDate)) : null,
          purpose: borrowing.purpose,
          status: getStatusText(borrowing.status),
          quantity: borrowingItem.quantity
        })
      })
    } else {
      // Legacy single-item borrowing (fallback) - use first item if available
      const firstItem = borrowing.items?.[0]
      exportData.push({
        id: borrowing.id,
        borrowerName: borrowing.borrowerName,
        itemName: firstItem?.item?.name || 'Unknown Item',
        category: firstItem?.item?.category?.name || 'Unknown Category',
        borrowDate: formatDate(new Date(borrowing.borrowDate)),
        returnDate: borrowing.returnDate ? formatDate(new Date(borrowing.returnDate)) : null,
        purpose: borrowing.purpose,
        status: getStatusText(borrowing.status)
      })
    }
  })

  return exportData
}

// Export Activities to PDF
export const exportActivitiesToPDF = async (data: ExportActivityData[], filters: ExportFilters) => {
  try {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(74, 144, 226)
    doc.text('DisaTools - Laporan Aktivitas', 20, 20)

    // Subtitle with filters
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    let subtitle = 'Laporan Aktivitas Inventaris'
    if (filters.dateFrom && filters.dateTo) {
      subtitle += ` (${formatDate(new Date(filters.dateFrom))} - ${formatDate(new Date(filters.dateTo))})`
    }
    doc.text(subtitle, 20, 30)

    // Filter info
    let yPos = 40
    doc.setFontSize(10)
    if (filters.category) {
      doc.text(`Kategori: ${filters.category}`, 20, yPos)
      yPos += 7
    }

    // Summary
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total Aktivitas: ${data.length}`, 20, yPos + 5)

    // Table
    const tableColumns = [
      'No',
      'Tanggal',
      'Waktu',
      'Jenis Aktivitas',
      'Deskripsi',
      'Item',
      'Kategori'
    ]

    const tableRows = data.map((item, index) => [
      (index + 1).toString(),
      item.date,
      item.time,
      getActivityTypeText(item.type),
      item.description,
      item.itemName || '-',
      item.category || '-'
    ])

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: yPos + 15,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [74, 144, 226],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 15 }, // No
        1: { cellWidth: 25 }, // Tanggal
        2: { cellWidth: 20 }, // Waktu
        3: { cellWidth: 25 }, // Jenis
        4: { cellWidth: 40 }, // Deskripsi
        5: { cellWidth: 30 }, // Item
        6: { cellWidth: 20 }  // Kategori
      }
    })

    // Footer
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Generated on ${formatDateTime(new Date())} | Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      )
      doc.text(
        'DisaTools - Inventory Management System',
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      )
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `laporan-aktivitas-${timestamp}.pdf`

    // Save file
    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Error generating activities PDF:', error)
    return { success: false, error: 'Failed to generate activities PDF' }
  }
}

// Export Activities to Excel
export const exportActivitiesToExcel = async (data: ExportActivityData[], filters: ExportFilters) => {
  try {
    const XLSX = await import('xlsx')

    // Prepare data for Excel
    const excelData = data.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.date,
      'Waktu': item.time,
      'Jenis Aktivitas': getActivityTypeText(item.type),
      'Deskripsi': item.description,
      'Item': item.itemName || '-',
      'Kategori': item.category || '-'
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create main worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 5 },  // No
      { wch: 15 }, // Tanggal
      { wch: 10 }, // Waktu
      { wch: 20 }, // Jenis Aktivitas
      { wch: 40 }, // Deskripsi
      { wch: 25 }, // Item
      { wch: 15 }  // Kategori
    ]
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Aktivitas')

    // Create summary worksheet
    const summaryData = [
      { 'Keterangan': 'Total Aktivitas', 'Nilai': data.length },
      { 'Keterangan': 'Tanggal Generate', 'Nilai': formatDateTime(new Date()) },
      ...(filters.dateFrom && filters.dateTo ? [
        { 'Keterangan': 'Periode', 'Nilai': `${formatDate(new Date(filters.dateFrom))} - ${formatDate(new Date(filters.dateTo))}` }
      ] : []),
      ...(filters.category ? [{ 'Keterangan': 'Filter Kategori', 'Nilai': filters.category }] : [])
    ]

    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `laporan-aktivitas-${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Error generating activities Excel:', error)
    return { success: false, error: 'Failed to generate activities Excel' }
  }
}

// Helper function to prepare activity data for export
export const prepareActivityDataForExport = (activities: ActivityForExport[]): ExportActivityData[] => {
  return activities.map(activity => ({
    id: activity.id,
    type: activity.type,
    description: activity.description,
    itemName: activity.item?.name || 'N/A',
    category: activity.item?.category?.name || 'N/A',
    date: formatDate(new Date(activity.createdAt)),
    time: formatTime(new Date(activity.createdAt)),
    metadata: activity.metadata
  }))
}

// Helper function to get activity type text in Indonesian
const getActivityTypeText = (type: string): string => {
  switch (type) {
    case 'ITEM_ADDED':
      return 'Barang Ditambahkan'
    case 'ITEM_UPDATED':
      return 'Barang Diperbarui'
    case 'ITEM_DELETED':
      return 'Barang Dihapus'
    case 'ITEM_BORROWED':
      return 'Peminjaman'
    case 'ITEM_RETURNED':
      return 'Pengembalian'
    case 'STOCK_UPDATED':
      return 'Update Stok'
    default:
      return type
  }
}

// Helper function to get status text in Indonesian
const getStatusText = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Aktif'
    case 'RETURNED':
      return 'Dikembalikan'
    case 'OVERDUE':
      return 'Terlambat'
    default:
      return status
  }
}



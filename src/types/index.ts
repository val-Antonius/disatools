// Enum types matching Prisma schema
export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export enum BorrowingStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
}

export enum ActivityType {
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_DELETED = 'ITEM_DELETED',
  ITEM_BORROWED = 'ITEM_BORROWED',
  ITEM_RETURNED = 'ITEM_RETURNED',
  STOCK_UPDATED = 'STOCK_UPDATED'
}

// Base types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: Item[];
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: Item[];
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  stock: number;
  minStock: number;
  status: ItemStatus;
  categoryId: string;
  locationId: string;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  location?: Location;
  borrowings?: Borrowing[];
  activities?: Activity[];
}

export interface Borrowing {
  id: string;
  borrowerName: string;
  purpose: string;
  borrowDate: Date;
  returnDate?: Date;
  expectedReturnDate: Date;
  status: BorrowingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: BorrowingItem[];
  activities?: Activity[];
}

export interface BorrowingItem {
  id: string;
  borrowingId: string;
  itemId: string;
  quantity: number;
  returnedQuantity: number;
  status: BorrowingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  borrowing?: Borrowing;
  item?: Item;
}

export interface FrequentBorrower {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  borrowCount: number;
  lastBorrow: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  itemId?: string;
  borrowingId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  item?: Item;
  borrowing?: Borrowing;
}

// Form types
export interface CreateItemForm {
  name: string;
  description?: string;
  stock: number;
  minStock: number;
  categoryId: string;
  locationId: string;
}

export interface UpdateItemForm extends Partial<CreateItemForm> {
  id: string;
  status?: ItemStatus;
}

export interface CreateBorrowingForm {
  borrowerName: string;
  purpose: string;
  expectedReturnDate: Date;
  notes?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    notes?: string;
  }>;
}

export interface BorrowingItemForm {
  itemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateCategoryForm {
  name: string;
  description?: string;
}

export interface CreateLocationForm {
  name: string;
  description?: string;
}

// Dashboard KPI types
export interface DashboardKPI {
  totalItems: number;
  lowStockItems: number;
  totalBorrowedItems: number;
  overdueItems: number;
}

// Analytics types
export interface CategoryDistribution {
  categoryName: string;
  itemCount: number;
  percentage: number;
}

export interface MostBorrowedItem {
  itemName: string;
  borrowCount: number;
  categoryName: string;
}

export interface AnalyticsData {
  categoryDistribution: CategoryDistribution[];
  mostBorrowedItems: MostBorrowedItem[];
  monthlyBorrowingTrend: {
    month: string;
    borrowCount: number;
    returnCount: number;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search and filter types
export interface ItemFilters {
  search?: string;
  categoryId?: string;
  locationId?: string;
  status?: ItemStatus;
  lowStock?: boolean;
}

export interface BorrowingFilters {
  search?: string;
  status?: BorrowingStatus;
  itemId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

// Report types
export interface ReportFilters {
  dateFrom: Date;
  dateTo: Date;
  categoryId?: string;
  locationId?: string;
  itemId?: string;
}

export interface BorrowingReport {
  borrowings: Borrowing[];
  summary: {
    totalBorrowings: number;
    totalReturned: number;
    totalActive: number;
    totalOverdue: number;
    mostBorrowedItems: MostBorrowedItem[];
  };
}

// UI Component types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

// Dashboard activity type (simplified for dashboard display)
export interface DashboardActivity {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: Date | string;
  itemName?: string;
  borrowerName?: string;
}

// Dashboard types
export interface DashboardData {
  kpi: DashboardKPI;
  recentActivities: DashboardActivity[];
  quickStats: {
    topCategory?: { name: string; count: number };
    topLocation?: { name: string; count: number };
    todayBorrowings: number;
    todayReturns: number;
  };
}

// Analytics response types
export interface AnalyticsResponse {
  categoryDistribution: CategoryDistribution[];
  mostBorrowedItems: MostBorrowedItem[];
  monthlyTrend: {
    month: string;
    borrowCount: number;
    returnCount: number;
  }[];
  insights?: {
    title: string;
    description: string;
  }[];
}

// Form data types
export interface BorrowingFormData {
  borrowerName: string;
  purpose: string;
  expectedReturnDate: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    notes?: string;
  }>;
}

export interface ItemFormData {
  name: string;
  description: string;
  stock: number;
  minStock: number;
  categoryId: string;
  locationId: string;
}

// Return data types
export interface ReturnData {
  items: Array<{
    borrowingItemId: string;
    returnQuantity: number;
  }>;
  notes?: string;
}

// Report data types
export interface ReportData {
  id: string;
  borrowerName: string;
  itemName: string;
  category: string;
  borrowDate: string;
  returnDate: string | null;
  purpose: string;
  status: string;
}

export interface ApiResponseMeta {
  requestId: string;
  timestamp?: string;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
  meta: ApiResponseMeta;
  pagination?: {
    nextCursor?: string;
    pageSize?: number;
    hasNextPage?: boolean;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  rule?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  errors: ApiErrorDetail[];
  timestamp: string;
  requestId: string;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export interface HealthSnapshot {
  name: string;
  environment: string;
  version: string;
  timestamp: string;
  uptimeInSeconds: number;
  database: {
    status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting';
  };
  memory: {
    rssInBytes: number;
    heapTotalInBytes: number;
    heapUsedInBytes: number;
  };
}

export type PermissionScope = 'own' | 'branch' | 'restaurant' | 'tenant' | 'platform';

export interface Permission {
  _id: string;
  code: string;
  module: string;
  action: string;
  scope: PermissionScope;
  status: 'active' | 'inactive';
  description?: string;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  _id: string;
  tenantId?: string;
  name: string;
  code: string;
  description?: string;
  permissionIds: string[];
  permissions?: Permission[];
  status: 'active' | 'inactive';
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  _id: string;
  tenantId?: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuthorizationContext {
  userId: string;
  sessionId: string;
  tenantId?: string;
  branchIds?: string[];
  roles: Role[];
  permissions: string[];
}

export type UserAccountStatus =
  'active' | 'inactive' | 'suspended' | 'pending_verification' | 'locked';

export interface AvatarMeta {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface Address {
  _id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationChannelPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  marketingPreferences: NotificationChannelPreferences;
  orderNotifications: NotificationChannelPreferences;
  reservationNotifications: NotificationChannelPreferences;
  dietaryPreferences: string[];
}

export interface UserProfileDetails {
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  accountStatus: UserAccountStatus;
  statusReason?: string;
  profile?: UserProfileDetails;
  avatar?: AvatarMeta;
  addresses?: Address[];
  preferences?: UserPreferences;
  roleIds?: string[];
  roles?: Role[];
  permissions?: string[];
  tenantId?: string;
  branchIds?: string[];
  locale?: string;
  timezone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserQueryFilters {
  search?: string;
  role?: string;
  accountStatus?: UserAccountStatus;
  emailVerified?: boolean;
  tenantId?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUserResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RestaurantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ONBOARDING';
export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TEMPORARILY_CLOSED';

export interface BusinessHoursInterval {
  open: string; // HH:mm format e.g. "09:00"
  close: string; // HH:mm format e.g. "23:00" or "02:00" (overnight)
  isClosed?: boolean;
}

export interface DayBusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isClosed: boolean;
  intervals: BusinessHoursInterval[];
}

export type WeeklyBusinessHours = DayBusinessHours[];

export interface TaxConfig {
  gstNumber?: string;
  panNumber?: string;
  taxRate?: number;
}

export interface Restaurant {
  _id: string;
  tenantId: string;
  name: string;
  legalName: string;
  description?: string;
  logo?: AvatarMeta;
  email: string;
  phone: string;
  website?: string;
  address: Address;
  cuisineTypes: string[];
  taxConfig?: TaxConfig;
  currency: string;
  timezone: string;
  status: RestaurantStatus;
  businessHours?: WeeklyBusinessHours;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface Branch {
  _id: string;
  restaurantId: string;
  tenantId: string;
  name: string;
  code: string;
  address: Address;
  phone: string;
  email?: string;
  managerId?: string;
  businessHours?: WeeklyBusinessHours;
  timezone: string;
  status: BranchStatus;
  statusReason?: string;
  capacity?: number;
  coordinates?: BranchCoordinates;
  serviceModes: Array<'dine_in' | 'takeaway' | 'delivery'>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Setting {
  _id: string;
  tenantId: string;
  scope: 'tenant' | 'branch';
  branchId?: string;
  key: string;
  value: unknown;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// PHASE 13 — INVENTORY TYPES
// ----------------------------------------------------
export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'unit' | 'pack';
export type IngredientStatus = 'active' | 'inactive' | 'archived';

export interface Ingredient {
  _id: string;
  tenantId: string;
  name: string;
  sku: string;
  baseUnit: IngredientUnit;
  category?: string;
  preferredSupplierId?: string;
  reorderUnit?: IngredientUnit;
  allergenInfo?: string[];
  yieldFactor?: number;
  status: IngredientStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryStockState = 'HEALTHY' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' | 'EXPIRED';

export interface Inventory {
  _id: string;
  tenantId: string;
  branchId: string;
  ingredientId: string | Ingredient;
  currentQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  minQuantity?: number;
  maxQuantity?: number;
  unit: IngredientUnit;
  averageUnitCost?: number;
  lastCountedAt?: string;
  lastTransactionAt?: string;
  storageLocation?: string;
  expirySummary?: string;
  status: 'active' | 'out_of_stock' | 'inactive';
  stockState?: InventoryStockState;
  createdAt?: string;
  updatedAt?: string;
}

export type StockTransactionType =
  | 'stock_in'
  | 'stock_out'
  | 'purchase_receipt'
  | 'order_consumption'
  | 'waste'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'return_to_supplier'
  | 'transfer_in'
  | 'transfer_out'
  | 'stock_count';

export interface StockTransaction {
  _id: string;
  tenantId: string;
  branchId: string;
  ingredientId: string;
  transactionType: StockTransactionType;
  quantityDelta: number;
  unit: IngredientUnit;
  occurredAt: string;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  unitCost?: number;
  reason?: string;
  purchaseOrderId?: string;
  orderId?: string;
  performedBy?: string;
  createdAt?: string;
}

export interface SupplierContact {
  name: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
}

export interface Supplier {
  _id: string;
  tenantId: string;
  name: string;
  supplierCode?: string;
  status: 'active' | 'inactive' | 'blocked';
  contacts: SupplierContact[];
  taxRegistration?: string;
  address?: Address;
  paymentTermsDays?: number;
  ingredientIds?: string[];
  rating?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'cancelled'
  | 'closed';

export interface PurchaseOrderItem {
  ingredientId: string;
  ingredientName?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: IngredientUnit;
  unitCost: number;
  taxRate?: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  _id: string;
  tenantId: string;
  branchId: string;
  supplierId: string | Supplier;
  poNumber: string;
  status: PurchaseOrderStatus;
  currency: string;
  items: PurchaseOrderItem[];
  createdByEmployeeId?: string;
  orderedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  expectedDeliveryAt?: string;
  receivedAt?: string;
  notes?: string;
  taxTotal?: number;
  discountTotal?: number;
  grandTotal: number;
  createdAt?: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// PHASE 14 — EMPLOYEE MANAGEMENT TYPES
// ----------------------------------------------------
export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Employee {
  _id: string;
  tenantId: string;
  userId: string | UserProfile;
  employeeNumber: string;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  primaryBranchId: string;
  branchIds: string[];
  jobTitle?: string;
  department?: string;
  managerEmployeeId?: string;
  emergencyContact?: EmergencyContact;
  joinedAt: string;
  terminatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shift {
  _id: string;
  tenantId: string;
  branchId: string;
  employeeId: string | Employee;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus =
  'scheduled' | 'present' | 'late' | 'absent' | 'on_leave' | 'completed';

export interface Attendance {
  _id: string;
  tenantId: string;
  employeeId: string | Employee;
  branchId: string;
  workDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  clockInAt?: string;
  clockOutAt?: string;
  breakMinutes?: number;
  notes?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// PHASE 15 — NOTIFICATION TYPES
// ----------------------------------------------------
export type NotificationType =
  | 'ORDER'
  | 'RESERVATION'
  | 'PAYMENT'
  | 'INVENTORY'
  | 'SYSTEM'
  | 'ACCOUNT'
  | 'EMPLOYEE'
  | 'SECURITY';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Notification {
  _id: string;
  tenantId: string;
  recipientUserId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  branchId?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

// ----------------------------------------------------
// PHASE 16 — CUSTOMER ENGAGEMENT TYPES
// ----------------------------------------------------
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'rejected';

export interface Review {
  _id: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  customerName?: string;
  orderId: string;
  title?: string;
  content: string;
  rating?: number;
  status: ReviewStatus;
  moderationReason?: string;
  submittedAt: string;
  response?: string;
  respondedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RatingDimensions {
  food?: number;
  service?: number;
  ambience?: number;
  delivery?: number;
}

export interface Rating {
  _id: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  orderId: string;
  overallScore: number;
  dimensions?: RatingDimensions;
  status: 'active' | 'hidden' | 'withdrawn';
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CouponDiscountType = 'percentage' | 'fixed_amount';

export interface Coupon {
  _id: string;
  tenantId: string;
  code: string;
  discountType: CouponDiscountType;
  value: number;
  startsAt: string;
  endsAt: string;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  perCustomerLimit?: number;
  branchIds?: string[];
  status: 'draft' | 'active' | 'inactive' | 'expired';
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponUsage {
  _id: string;
  tenantId: string;
  couponId: string;
  orderId: string;
  customerId: string;
  codeSnapshot: string;
  discountAmount: number;
  usedAt: string;
  status: 'applied' | 'reversed' | 'voided';
}

export interface LoyaltyTransaction {
  _id: string;
  tenantId: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjustment';
  points: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  reason?: string;
  createdAt: string;
}

export interface Favorite {
  _id: string;
  tenantId: string;
  customerId: string;
  menuItemId: string;
  branchId?: string;
  createdAt: string;
}

// ----------------------------------------------------
// PHASE 17 & 18 — ANALYTICS, BI, REPORTS & EXPORT TYPES
// ----------------------------------------------------
export type AnalyticsTimePeriod =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'previous_month'
  | 'this_year'
  | 'custom';

export interface KPIMetricSummary {
  grossRevenue: number;
  discounts: number;
  taxes: number;
  serviceCharge: number;
  refunds: number;
  netRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  activeEmployeesCount: number;
  periodLabel: string;
  comparisonPeriodLabel?: string;
  revenueChangePercentage?: number;
  ordersChangePercentage?: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface CategoryRevenueItem {
  categoryName: string;
  revenue: number;
  itemCount: number;
  percentageShare: number;
}

export interface TopSellingItem {
  menuItemId: string;
  itemName: string;
  quantitySold: number;
  totalRevenue: number;
  averageRating?: number;
}

export interface TaxReportSummary {
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  serviceCharge: number;
  totalTax: number;
  refunds: number;
  netRevenue: number;
}

export type ReportType =
  | 'sales'
  | 'revenue'
  | 'orders'
  | 'payments'
  | 'taxes'
  | 'menu'
  | 'inventory'
  | 'attendance'
  | 'branches';

export type ReportExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ReportPreviewResult {
  reportType: ReportType;
  title: string;
  generatedAt: string;
  tenantId: string;
  branchId?: string;
  timezone: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: Record<string, unknown>;
  columns: Array<{ key: string; label: string; type?: 'string' | 'number' | 'currency' | 'date' }>;
  rows: Array<Record<string, unknown>>;
  totalRows: number;
}

export interface ReportHistoryRecord {
  _id: string;
  tenantId: string;
  branchId?: string;
  userId: string;
  reportType: ReportType;
  format: ReportExportFormat;
  dateRangeLabel: string;
  rowCount: number;
  status: 'completed' | 'failed';
  generatedAt: string;
}

// ----------------------------------------------------
// PHASE 19 — RECOMMENDATION TYPES
// ----------------------------------------------------
export type RecommendationContext =
  'personalized' | 'popular' | 'frequently_ordered' | 'trending' | 'similar' | 'cart_addons';

export interface RecommendationItem {
  menuItemId: string;
  itemName: string;
  categoryName: string;
  price: number;
  imageUrl?: string;
  normalizedScore: number; // 0.0 to 1.0
  explanationSignal: string; // e.g. "Popular at this branch", "Frequently ordered together"
  isAvailable: boolean;
}

export type RecommendationEventType =
  'impression' | 'click' | 'add_to_cart' | 'purchased' | 'dismissed';

export interface RecommendationEventPayload {
  recommendationId?: string;
  context: RecommendationContext;
  menuItemId: string;
  eventType: RecommendationEventType;
  branchId?: string;
  timestamp?: string;
}

export interface StaffRecommendationInsight {
  metricCategory: string;
  factualSummary: string; // Calculated analytics facts
  aiInterpretation: string; // Pluggable AI interpretation
  confidenceScore: number; // 0.0 to 1.0
  suggestedAction: string;
}

// ----------------------------------------------------
// PHASE 20 & 21 — TABLE, ORDER, QR & DELIVERY TYPES
// ----------------------------------------------------
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
export type QRTokenStatus = 'active' | 'inactive';
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled'
  | 'ready_for_pickup'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'rejected';
export type OrderSource = 'qr' | 'waiter' | 'pos' | 'online';
export type ServiceMode = 'dine_in' | 'takeaway' | 'delivery';

export interface TableRecord {
  _id: string;
  tenantId: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  section: string;
  status: TableStatus;
  qrToken: string;
  qrStatus: QRTokenStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemPayload {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
  selectedAddOns?: Array<{ name: string; price: number }>;
  specialInstructions?: string;
}

export interface DeliveryAddressData {
  _id?: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderRecord {
  _id: string;
  tenantId: string;
  branchId: string;
  tableId?: string;
  orderNumber: string;
  source: OrderSource;
  serviceMode?: ServiceMode;
  customerId?: string;
  guestName?: string;
  guestPhone?: string;
  items: OrderItemPayload[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee?: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'online' | 'cod' | 'card' | 'cash';
  sessionId?: string;
  deliveryAddress?: DeliveryAddressData;
  deliveryInstructions?: string;
  assignedEmployeeId?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PublicQRContext {
  token: string;
  isValid: boolean;
  restaurantName: string;
  branchName: string;
  branchCode: string;
  tableNumber: string;
  section: string;
  currency: string;
}

export interface QROrderCheckoutInput {
  token: string;
  guestName?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    variant?: string;
    selectedAddOns?: Array<{ name: string; price: number }>;
    specialInstructions?: string;
  }>;
}

export interface DeliveryServiceabilityResult {
  isServiceable: boolean;
  reason?: string;
  deliveryFee: number;
  estimatedTimeMinutes: number;
  freeDeliveryThreshold?: number;
  minimumOrderAmount?: number;
}


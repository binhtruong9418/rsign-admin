/**
 * TypeScript Type Definitions for Admin Statistics API
 *
 * Copy these types to your Frontend project for type safety
 * Usage: import { DashboardStatistics, TimeSeriesData } from './types/admin-statistics'
 */

// ============================================================================
// DASHBOARD STATISTICS TYPES
// ============================================================================

export interface DashboardStatistics {
  overview: OverviewMetrics;
  documents: DocumentMetrics;
  recentActivity: RecentActivityMetrics;
  signingProgress: SigningProgressMetrics;
  users: UserMetrics;
  topMetrics: TopMetrics;
}

export interface OverviewMetrics {
  /** Tổng số documents (không tính template) */
  totalDocuments: number;
  /** Tổng số users */
  totalUsers: number;
  /** Tổng số chữ ký đã ký */
  totalSignatures: number;
  /** Tổng số templates */
  totalTemplates: number;
}

export interface DocumentMetrics {
  /** Số documents ở trạng thái DRAFT */
  draft: number;
  /** Số documents ở trạng thái PENDING */
  pending: number;
  /** Số documents ở trạng thái IN_PROGRESS */
  inProgress: number;
  /** Số documents ở trạng thái COMPLETED */
  completed: number;
  /** Số documents ở trạng thái CANCELLED */
  cancelled: number;
  /** Tỷ lệ hoàn thành (%) */
  completionRate: number;
}

export interface RecentActivityMetrics {
  last24Hours: ActivityPeriod;
  last7Days: ActivityPeriod;
  last30Days: ActivityPeriod;
}

export interface ActivityPeriod {
  /** Số documents được tạo trong khoảng thời gian */
  documentsCreated: number;
  /** Số documents được ký xong trong khoảng thời gian */
  documentsSigned: number;
  /** Số users mới đăng ký trong khoảng thời gian */
  newUsers: number;
}

export interface SigningProgressMetrics {
  /** Tổng số chữ ký đang chờ (status = PENDING) */
  awaitingSignature: number;
  /** Số chữ ký được ký hôm nay */
  signedToday: number;
  /** Thời gian ký trung bình (giờ), từ lúc tạo đến hoàn thành */
  averageSigningTime: number;
}

export interface UserMetrics {
  /** Số users active */
  active: number;
  /** Số users inactive */
  inactive: number;
  /** Số users bị suspended */
  suspended: number;
  /** Tổng số admins */
  totalAdmins: number;
}

export interface TopMetrics {
  /** Top 5 users có nhiều chữ ký nhất */
  mostActiveUsers: MostActiveUser[];
  /** Top 5 documents sắp hết hạn (trong vòng 3 ngày) */
  documentsNearDeadline: DocumentNearDeadline[];
  /** Top 5 documents vừa hoàn thành gần đây */
  recentCompletedDocuments: RecentCompletedDocument[];
  /** Top 5 documents mới nhất (tất cả trạng thái) */
  recentDocuments: RecentDocument[];
}

export interface MostActiveUser {
  /** UUID của user */
  userId: string;
  /** Tên đầy đủ của user */
  userName: string;
  /** Email của user */
  email: string;
  /** Số chữ ký đã thực hiện */
  signaturesCount: number;
}

export interface DocumentNearDeadline {
  /** UUID của document */
  documentId: string;
  /** Tiêu đề document */
  title: string;
  /** ISO 8601 datetime */
  deadline: string;
  /** Số ngày còn lại (1, 2, 3) */
  daysRemaining: number;
  /** Status hiện tại: PENDING hoặc IN_PROGRESS */
  status: DocumentStatus;
}

export interface RecentCompletedDocument {
  /** UUID của document */
  documentId: string;
  /** Tiêu đề document */
  title: string;
  /** ISO 8601 datetime khi hoàn thành */
  completedAt: string;
  /** Tổng số người ký trên document này */
  totalSigners: number;
}

export interface RecentDocument {
  /** UUID của document */
  documentId: string;
  /** Tiêu đề document */
  title: string;
  /** Document status */
  status: DocumentStatus;
  /** Signing mode */
  signingMode: SigningMode;
  /** ISO 8601 datetime khi tạo */
  createdAt: string;
  /** Thông tin người tạo */
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  /** Tiến độ ký (optional, chỉ có khi có signers) */
  progress?: {
    totalSigners: number;
    completedSigners: number;
    completionPercentage: number;
  };
}

// ============================================================================
// TIME SERIES TYPES
// ============================================================================

export interface TimeSeriesData {
  /** YYYY-MM-DD format */
  date: string;
  /** Số documents được tạo trong ngày */
  documentsCreated: number;
  /** Số documents hoàn thành trong ngày */
  documentsCompleted: number;
  /** Số chữ ký được tạo trong ngày */
  signaturesCreated: number;
}

// ============================================================================
// ENUMS
// ============================================================================

export enum DocumentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum SigningMode {
  INDIVIDUAL = "INDIVIDUAL",
  SHARED = "SHARED",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

// ============================================================================
// API RESPONSE WRAPPERS (Optional)
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Helper type for chart data */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/** Helper type for status colors */
export const STATUS_COLORS: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: "#3B82F6",      // Blue
  [DocumentStatus.PENDING]: "#F59E0B",    // Yellow
  [DocumentStatus.IN_PROGRESS]: "#F97316", // Orange
  [DocumentStatus.COMPLETED]: "#10B981",   // Green
  [DocumentStatus.CANCELLED]: "#EF4444",   // Red
};

/** Helper type for metric cards */
export interface MetricCard {
  title: string;
  value: number | string;
  icon?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

// ============================================================================
// EXAMPLE USAGE IN REACT/VUE
// ============================================================================

/*
// React Example with TypeScript
import { DashboardStatistics, TimeSeriesData } from './types/admin-statistics';

async function fetchDashboardStats(): Promise<DashboardStatistics> {
  const response = await fetch('/api/admin/statistics/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

async function fetchTimeSeriesData(days: number): Promise<TimeSeriesData[]> {
  const response = await fetch(`/api/admin/statistics/time-series?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Vue 3 Composable Example
import { ref, Ref } from 'vue';

export function useDashboardStats() {
  const stats: Ref<DashboardStatistics | null> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStats = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/admin/statistics/dashboard');
      stats.value = await response.json();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}
*/

// ============================================================================
// VALIDATION HELPERS (Optional)
// ============================================================================

export function isValidDocumentStatus(status: string): status is DocumentStatus {
  return Object.values(DocumentStatus).includes(status as DocumentStatus);
}

export function isValidSigningMode(mode: string): mode is SigningMode {
  return Object.values(SigningMode).includes(mode as SigningMode);
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString();
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export function getStatusColor(status: DocumentStatus): string {
  return STATUS_COLORS[status] || "#6B7280"; // Gray as default
}

export function calculatePercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

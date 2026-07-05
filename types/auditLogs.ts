export interface AuditLogQueryFilters {
  businessId: string;
  tab?: string;
  shopId?: string | null;
  userId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface NormalizedLogEntry {
  id: string;
  createdAt: Date;
  user: string;
  role: string;
  action: string;
  module: string;
  logType: string;
  description: string;
  ipAddress: string;
  branch: string;
}

export interface AuditLogDashboardData {
  metrics: {
    allLogs: number;
    userActivity: number;
    dataChanges: number;
    systemEvents: number;
    stockLogs: number;
    userSessions: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  logs: NormalizedLogEntry[];
}
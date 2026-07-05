import { create } from "zustand";
import apiClient from "@/lib/api-client";

interface AuditMetrics {
  allLogs: number;
  userActivity: number;
  dataChanges: number;
  systemEvents: number;
  stockLogs: number;
  userSessions: number;
}

interface LogEntry {
  id: string;
  createdAt: string;
  user: string;
  role: string;
  action: string;
  module: string;
  logType: string;
  description: string;
  ipAddress: string;
  branch: string;
}

interface AuditLogState {
  logs: LogEntry[];
  metrics: AuditMetrics | null;
  loading: boolean;
  totalPages: number;
  
  fetchLogs: (filters: {
    tab?: string;
    shopId?: string;
    search?: string;
    page?: number;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
}

export const useAuditLogStore = create<AuditLogState>((set) => ({
  logs: [],
  metrics: null,
  loading: false,
  totalPages: 1,

  fetchLogs: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await apiClient.get(`/business/audit-logs?${params.toString()}`);
      
      set({
        logs: response.data.data,
        metrics: response.data.metrics,
        totalPages: response.data.pagination.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load audit logs", error);
      set({ loading: false });
    }
  }
}));
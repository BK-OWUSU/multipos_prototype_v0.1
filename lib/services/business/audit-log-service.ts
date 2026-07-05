import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { AuditLogQueryFilters, AuditLogDashboardData, NormalizedLogEntry } from "@/types/auditLogs";
import { Prisma } from "@/generated/prisma/client";

export class AuditLogService {
  /**
   * Fetches unified system audit logs, tracking logs, metrics, and pagination.
   */
  static async getDashboardLogs(filters: AuditLogQueryFilters): Promise<AppResponse> {
    try {
      const { 
        businessId, 
        tab = "all", 
        shopId, 
        userId, 
        search = "", 
        page = 1, 
        limit = 10, 
        startDate, 
        endDate 
      } = filters;

      const skip = (page - 1) * limit;

      // 1. Structural Date Criteria Mapping
      const dateQuery: Prisma.DateTimeFilter = startDate || endDate ? {
        ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
        ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
      } : {};

      const baseWhere: Prisma.AuditLogWhereInput = { 
        businessId,
        ...(Object.keys(dateQuery).length > 0 && { createdAt: dateQuery })
      };

      // 2. PART A: METRICS DISPATCH (POWERS THE TOP METRIC WRAPPER CARDS)
      const [totalAuditCount, totalSessionCount, totalStockCount] = await Promise.all([
        prisma.auditLog.count({ where: baseWhere }),
        prisma.userSessionLog.count({ where: baseWhere }),
        prisma.stockLog.count({ where: baseWhere }),
      ]);

      const userActivityCount = await prisma.auditLog.count({
        where: { ...baseWhere, entity: "Auth" }
      });
      const dataChangesCount = totalAuditCount - userActivityCount;

      // 3. PART B: TABLE RECORDS DISPATCH
      let normalizedLogs: NormalizedLogEntry[] = [];
      let totalLogsCount = 0;

      const commonFilter = {
        businessId,
        ...(shopId && { shopId }),
        ...(userId && { userId }),
        ...(Object.keys(dateQuery).length > 0 && { createdAt: dateQuery })
      };

      // Tab Filtering Core Logic
      if (tab === "all" || tab === "data_changes" || tab === "user_activity" || tab === "system_events") {
        const auditWhere: Prisma.AuditLogWhereInput = {
          ...commonFilter,
          ...(tab === "user_activity" && { entity: "Auth" }),
          ...(tab === "system_events" && { entity: "System" }),
          ...(tab === "data_changes" && { entity: { notIn: ["Auth", "System"] } }),
          ...(search && {
            OR: [
              { action: { contains: search, mode: "insensitive" } },
              { details: { contains: search, mode: "insensitive" } },
              { user: { firstName: { contains: search, mode: "insensitive" } } },
              { user: { lastName: { contains: search, mode: "insensitive" } } },
            ]
          })
        };

        const [auditRecords, count] = await Promise.all([
          prisma.auditLog.findMany({
            where: auditWhere,
            include: { 
              user: { select: { firstName: true, lastName: true, role: { select: { name: true } } } }, 
              shop: { select: { name: true } } 
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.auditLog.count({ where: auditWhere })
        ]);

        totalLogsCount = count;
        normalizedLogs = auditRecords.map((l) => ({
          id: l.id,
          createdAt: l.createdAt,
          user: `${l.user.firstName} ${l.user.lastName}`,
          role: l.user.role?.name || "Staff",
          action: l.action,
          module: l.entity,
          logType: l.entity === "Auth" ? "User Session" : "Data Change",
          description: l.details || `${l.action} updated on ${l.entity}`,
          ipAddress: "N/A",
          branch: l.shop?.name || "Main Branch"
        }));

      } else if (tab === "user_sessions") {
        const sessionWhere: Prisma.UserSessionLogWhereInput = {
          ...commonFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } }
              ]
            }
          })
        };

        const [sessionRecords, count] = await Promise.all([
          prisma.userSessionLog.findMany({
            where: sessionWhere,
            include: { user: { select: { firstName: true, lastName: true, role: { select: { name: true } } } } },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.userSessionLog.count({ where: sessionWhere })
        ]);

        totalLogsCount = count;
        normalizedLogs = sessionRecords.map((s) => ({
          id: s.id,
          createdAt: s.createdAt,
          user: `${s.user.firstName} ${s.user.lastName}`,
          role: s.user.role?.name || "Staff",
          action: s.reason?.toUpperCase() || "LOGIN",
          module: "Auth",
          logType: "User Session",
          description: `Authentication Event Trace: ${s.reason || "Session registered"}`,
          ipAddress: s.ipAddress || "Unknown",
          branch: "Main Branch"
        }));

      } else if (tab === "stock_logs") {
        const stockWhere: Prisma.StockLogWhereInput = {
          ...commonFilter,
          ...(search && {
            OR: [
              { reason: { contains: search, mode: "insensitive" } },
              { variant: { name: { contains: search, mode: "insensitive" } } }
            ]
          })
        };

        const [stockRecords, count] = await Promise.all([
          prisma.stockLog.findMany({
            where: stockWhere,
            include: {
              employee: { include: { user: { select: { firstName: true, lastName: true } } } },
              shop: { select: { name: true } },
              variant: { select: { name: true } }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.stockLog.count({ where: stockWhere })
        ]);

        totalLogsCount = count;
        normalizedLogs = stockRecords.map((sl) => ({
          id: sl.id,
          createdAt: sl.createdAt,
          user: `${sl.employee.user.firstName} ${sl.employee.user.lastName}`,
          role: "Inventory Handler",
          action: sl.change > 0 ? "STOCK_IN" : "STOCK_OUT",
          module: "Inventory",
          logType: "Stock Log",
          description: sl.reason || `Adjusted stock variant parameters [${sl.variant.name}] count by: ${sl.change}`,
          ipAddress: "N/A",
          branch: sl.shop?.name || "Warehouse"
        }));
      }

      const dashboardPayload: AuditLogDashboardData = {
        metrics: {
          allLogs: totalAuditCount + totalSessionCount + totalStockCount,
          userActivity: userActivityCount,
          dataChanges: dataChangesCount,
          systemEvents: 0,
          stockLogs: totalStockCount,
          userSessions: totalSessionCount,
        },
        pagination: {
          total: totalLogsCount,
          page,
          limit,
          totalPages: Math.ceil(totalLogsCount / limit),
        },
        logs: normalizedLogs,
      };

      return {
        success: true,
        data: dashboardPayload,
        status: 200,
      } as AppResponse;

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected execution crash occurred inside the auditing service controller.",
        status: 500,
      } as AppResponse;
    }
  }
}
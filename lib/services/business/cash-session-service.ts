import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { CloseSessionInput, closeSessionSchema, OpenSessionInput, openSessionSchema } from "@/types/schema/pos";
import { z } from "zod";



export class CashSessionService {
  /**
   * 🟢 OPENS A NEW CASH SESSION REGISTER LINE
   * Rejects if a branch terminal already has an active open session.
   */
  static async openSession(
    data: OpenSessionInput,
    businessId: string,
    shopId: string,
    userId: string,
    employeeId: string,
  ) {
    try {
      // 1. Validate incoming form shape data
      const validatedData = openSessionSchema.parse(data);

      // 2. Guard: Verify if there is already a running active register open in this shop
      const activeSession = await prisma.cashSession.findFirst({
        where: {
          shopId,
          businessId,
          status: "OPEN",
        },
      });

      if (activeSession) {
        return {
          success: false,
          error: "There is already an active running cash register session open for this shop branch. Close it first.",
          status: 400,
        };
      }

     // 3 & 4. ATOMIC TRANSACTION: Instantiate CashSession and write Audit Log
      const session = await prisma.$transaction(async (tx) => {
        // Step A: Create the cash session row
        const newSession = await tx.cashSession.create({
          data: {
            businessId,
            shopId,
            openedById: employeeId,
            status: "OPEN",
            startFloat: validatedData.startFloat,
            notes: validatedData.notes || null,
          },
        });

        // Step B: Write to the Audit Trail Log using the new session's ID
        await tx.auditLog.create({
          data: {
            action: "OPEN_CASH_SESSION",
            entity: "CASH_SESSION",
            entityId: newSession.id,
            userId: userId,
            businessId,
          },
        });

        return newSession;
      });

      return {
        success: true,
        data: session,
        message: "Cash register drawer session initialized successfully.",
        status: 201,
      };
    } catch (error: unknown) {
      console.error("CRITICAL_OPEN_SESSION_ERROR:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected system error occurred opening register drawer.",
        status: 500,
      };
    }
  }

  /**
   * 🔴 CLOSES AND BALANCES AN ACTIVE CASH SESSION SHIFT
   * Automatically aggregates startFloat and related cash collections to compute expectations.
   */
  static async closeSession(
    sessionId: string,
    data: CloseSessionInput,
    businessId: string,
    shopId: string,
    userId: string,
    employeeId: string
  ) {
    try {
      // 1. Validate closing count data
      const validatedData = closeSessionSchema.parse(data);

      // 2. Target the existing active session
      const targetSession = await prisma.cashSession.findUnique({
        where: { id: sessionId },
      });

      if (!targetSession || targetSession.status === "CLOSED" || targetSession.shopId !== shopId) {
        return {
          success: false,
          error: "Target open register session record could not be found or is already closed.",
          status: 404,
        };
      }

      // 3. START TRANSACTION BLOCK: Calculate expected cash and commit variables atomically
      const updatedSession = await prisma.$transaction(async (tx) => {
        
        // Step A: Aggregate all successful CASH balances processed during this shift line
        const cashPaymentsAggregate = await tx.payment.aggregate({
          where: {
            sale: { cashSessionId: sessionId },
            method: "CASH",
            status: "COMPLETED",
          },
          _sum: {
            amount: true,
          },
        });

        const totalCashCollected = Number(cashPaymentsAggregate._sum.amount || 0);
        const floatStartingWeight = Number(targetSession.startFloat);
        
        // Formula: Calculated Expected Cash = startFloat + totalCashCollected
        const expectedCashAmount = floatStartingWeight + totalCashCollected;

        // Step B: Update the primary CashSession row ledger with final values
        const sessionClosed = await tx.cashSession.update({
          where: { id: sessionId },
          data: {
            status: "CLOSED",
            closedById: employeeId,
            closedAt: new Date(),
            endFloat: validatedData.actualCash, // Ending physical balance counted
            expectedCash: expectedCashAmount,
            actualCash: validatedData.actualCash,
            notes: validatedData.notes 
              ? `${targetSession.notes || ""}\n[Closure Notes]: ${validatedData.notes}`
              : targetSession.notes,
          },
        });

        // Step C: Audit log recording who completed the balance check
        await tx.auditLog.create({
          data: {
            action: "CLOSE_CASH_SESSION",
            entity: "CASH_SESSION",
            entityId: sessionId,
            userId: userId,
            businessId,
          },
        });

        return sessionClosed;
      });

      // 4. Calculate final variance overview metrics for user warning alerts
      const variance = Number(updatedSession.actualCash) - Number(updatedSession.expectedCash);
      let statusMessage = "Register shift balanced out cleanly.";
      
      if (variance < 0) {
        statusMessage = `Register closed with a SHORTAGE of GHS ${Math.abs(variance).toFixed(2)}.`;
      } else if (variance > 0) {
        statusMessage = `Register closed with an OVERAGE of GHS ${variance.toFixed(2)}.`;
      }

      return {
        success: true,
        data: {
          id: updatedSession.id,
          expectedCash: updatedSession.expectedCash,
          actualCash: updatedSession.actualCash,
          variance: Number(variance.toFixed(2)),
        },
        message: statusMessage,
        status: 200,
      };
    } catch (error: unknown) {
      console.error("CRITICAL_CLOSE_SESSION_ERROR:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected system error occurred while sealing the drawer lines.",
        status: 500,
      };
    }
  }

  /**
   * 🔍 UTILITY: CHECK FOR CURRENT ACTIVE SHOP SESSION STATE
   */
  static async getCurrentActiveSession(shopId: string, businessId: string): Promise<AppResponse> {
    try {
      const activeSession = await prisma.cashSession.findFirst({
        where: {
          shopId,
          businessId,
          status: "OPEN",
        },
        include: {
          openedBy: {
            select: { name: true, email: true },
          },
        },
      });

      if (!activeSession) {
        return {
          success: false,
          error: "No active register session is currently open for this shop location.",
          status: 404,
        };
      }

      return {
        success: true,
        data: activeSession,
        status: 200,
      };
    } catch (error: unknown) {

       console.error("CRITICAL_GET_ACTIVE_SESSION_ERROR: ",error) 
      return {
        success: false,
        error: "Failed fetching active registers status mapping details.",
        status: 500,
      };
    }
  }


}
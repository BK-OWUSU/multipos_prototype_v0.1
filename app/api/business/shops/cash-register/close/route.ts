import { NextResponse } from "next/server";
import { CashSessionService } from "@/lib/services/business/cash-session-service";
import { clearPOSCashSessionCookie, getPOSCashSession } from "@/lib/auths-functions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Grab the active session properties directly from secure client cookie storage
    const currentSession = await getPOSCashSession();
    
    if (!currentSession) {
      return NextResponse.json({ error: "No active cash token session context found." }, { status: 400 });
    }

    // 1. Terminate service database lines and calculate variances
    const serviceResult = await CashSessionService.closeSession(
      currentSession.cashSessionId,
      body,
      currentSession.businessId,
      currentSession.shopId,
      currentSession.userId,
      currentSession.employeeId
    );

    if (!serviceResult.success) {
      return NextResponse.json({ error: serviceResult.error }, { status: serviceResult.status });
    }

    // 2. Clear out the cookie to lock down terminal access points until next open sequence
    const response = NextResponse.json(serviceResult, { status: serviceResult.status });
    clearPOSCashSessionCookie(response);
    return response;
  } catch (error: unknown) {
    return NextResponse.json({ error: "Fatal router gateway error." }, { status: 500 });
  }
}
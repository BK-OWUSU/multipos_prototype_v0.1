import { getSession } from "@/lib/auths-functions";
import { CashSessionService } from "@/lib/services/business/cash-session-service";
import { CashSession } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { shopId,businessId, } = session;
        const response = await  CashSessionService.getCurrentActiveSession(shopId || "", businessId);
        
        if (response.success && response.data) {
            const activeSession = response.data
            return NextResponse.json({success: response.success, data: activeSession as CashSession  }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}
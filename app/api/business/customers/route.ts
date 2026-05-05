import { getSession } from "@/lib/auths";
import { NextRequest, NextResponse } from "next/server";
import { createCustomer, getCustomers } from "@/lib/services/business/customer-service";

export async function POST(request: NextRequest) {
        // 1. Get and verify the session cookie
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }
        const { userId, businessId, businessSlug } = session;
        const body = await request.json();

        const response = await createCustomer(body,userId,businessId, businessSlug)

        if (response.status && response.message) {
            return NextResponse.json({ success: true, message: response.message },{ status: response.status });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}

export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { businessId } = session;
        const response = await getCustomers(businessId)
        
        if (response.status && response.customers) {
            const customers = response.customers; 
            return NextResponse.json({success: response.success, customers }, { status: response.status });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}
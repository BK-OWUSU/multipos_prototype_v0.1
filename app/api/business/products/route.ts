import { getSession } from "@/lib/auths";
import { NextRequest, NextResponse } from "next/server";
import { createProductService, getAllProductsService } from "@/lib/services/business/product-service";

export async function POST(request: NextRequest) {
        // 1. Get and verify the session cookie
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }
        const { userId,employeeId, businessId } = session;
        const body = await request.json();

        const response = await createProductService(body,userId, employeeId || "",businessId)

        if (response.status && response.message) {
            return NextResponse.json({ success: true, message: `Product ${response.product.name} created successfully`, product: response.product },{ status: 201 });
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
        const response = await getAllProductsService(businessId)
        
        if (response.status && response.products) {
            const products = response.products 
            return NextResponse.json({success: response.success, products }, { status: response.status });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}
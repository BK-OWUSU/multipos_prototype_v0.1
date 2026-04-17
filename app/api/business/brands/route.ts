import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
});

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }
        const decoded = verifyPOSToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid or expired session", success: false }, { status: 401 });
        }
        const { userId, businessId } = decoded;
        const body = await request.json();
        const validatedData = createBrandSchema.parse(body);

        // Check if brand name is unique within business
        const existingBrand = await prisma.brand.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId
            }
        });
        if (existingBrand) {
            return NextResponse.json(
                { error: "A brand with this name already exists in your business.", success: false },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const newBrand = await tx.brand.create({
                data: {
                    name: validatedData.name,
                    businessId: businessId,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE_BRAND",
                    entity: "BRAND",
                    entityId: newBrand.id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return newBrand;
        });

        return NextResponse.json(
            { success: true, message: `Brand ${result.name} created successfully`, brand: result },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Brand creation error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const decoded = verifyPOSToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid session", success: false }, { status: 401 });
        }

        const { businessId } = decoded;

        const brands = await prisma.brand.findMany({
            where: {
                businessId: businessId,
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            brands
        }, { status: 200 });

    } catch (error) {
        console.error("GET_BRANDS_ERROR:", error);
        return NextResponse.json({
            error: "Failed to fetch brands",
            success: false
        }, { status: 500 });
    }
}
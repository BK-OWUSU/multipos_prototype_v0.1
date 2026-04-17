import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createDiscountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "Value cannot be negative"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
        const validatedData = createDiscountSchema.parse(body);

        // Check if discount name is unique within business
        const existingDiscount = await prisma.discount.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId
            }
        });
        if (existingDiscount) {
            return NextResponse.json(
                { error: "A discount with this name already exists in your business.", success: false },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const newDiscount = await tx.discount.create({
                data: {
                    name: validatedData.name,
                    type: validatedData.type,
                    value: validatedData.value,
                    isActive: validatedData.isActive,
                    startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                    endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                    businessId: businessId,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE_DISCOUNT",
                    entity: "DISCOUNT",
                    entityId: newDiscount.id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return newDiscount;
        });

        return NextResponse.json(
            { success: true, message: `Discount ${result.name} created successfully`, discount: result },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Discount creation error:", error);
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

        const discounts = await prisma.discount.findMany({
            where: {
                businessId: businessId,
            },
            select: {
                id: true,
                name: true,
                type: true,
                value: true,
                isActive: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            discounts
        }, { status: 200 });

    } catch (error) {
        console.error("GET_DISCOUNTS_ERROR:", error);
        return NextResponse.json({
            error: "Failed to fetch discounts",
            success: false
        }, { status: 500 });
    }
}
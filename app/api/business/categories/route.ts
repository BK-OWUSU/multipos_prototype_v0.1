import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
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
        const validatedData = createCategorySchema.parse(body);

        // Check if category name is unique within business
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId
            }
        });
        if (existingCategory) {
            return NextResponse.json(
                { error: "A category with this name already exists in your business.", success: false },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const newCategory = await tx.category.create({
                data: {
                    name: validatedData.name,
                    businessId: businessId,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE_CATEGORY",
                    entity: "CATEGORY",
                    entityId: newCategory.id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return newCategory;
        });

        return NextResponse.json(
            { success: true, message: `Category ${result.name} created successfully`, category: result },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Category creation error:", error);
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

        const categories = await prisma.category.findMany({
            where: {
                businessId: businessId,
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            categories
        }, { status: 200 });

    } catch (error) {
        console.error("GET_CATEGORIES_ERROR:", error);
        return NextResponse.json({
            error: "Failed to fetch categories",
            success: false
        }, { status: 500 });
    }
}
import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;
        const decoded = verifyPOSToken(token || "");

        if (!decoded) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

        const category = await prisma.category.findFirst({
            where: { id, businessId: decoded.businessId },
            select: {
                id: true,
                name: true,
                createdAt: true,
            }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found", success: false }, { status: 404 });
        }

        return NextResponse.json({ success: true, category }, { status: 200 });
    } catch (error) {
        console.error("GET_CATEGORY_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch category", success: false }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;
        const decoded = verifyPOSToken(token || "");

        if (!decoded) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

        const { userId, businessId } = decoded;
        const body = await request.json();
        const validatedData = updateCategorySchema.parse(body);

        // Check if category name is unique within business (excluding current category)
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId,
                NOT: { id }
            }
        });
        if (existingCategory) {
            return NextResponse.json(
                { error: "A category with this name already exists in your business.", success: false },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedCategory = await tx.category.update({
                where: { id, businessId },
                data: {
                    name: validatedData.name,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE_CATEGORY",
                    entity: "CATEGORY",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return updatedCategory;
        });

        return NextResponse.json(
            { success: true, message: `Category ${result.name} updated successfully`, category: result },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Category update error:", error);
        return NextResponse.json({ error: "Update failed", success: false }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;
        const decoded = verifyPOSToken(token || "");

        if (!decoded) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

        const { userId, businessId } = decoded;

        const currentCategory = await prisma.category.findFirst({
            where: { id, businessId },
            select: { name: true }
        });

        if (!currentCategory) {
            return NextResponse.json({ error: "Category not found", success: false }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    action: "DELETE_CATEGORY",
                    entity: "CATEGORY",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            await tx.category.delete({
                where: { id, businessId }
            });
        });

        return NextResponse.json(
            { success: true, message: `Category deleted successfully` },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Category delete error:", error);
        if (error instanceof Error && 'code' in error && error.code === 'P2003') {
            return NextResponse.json({
                error: "Cannot delete category with associated products. Remove products first.",
                success: false
            }, { status: 400 });
        }
        return NextResponse.json({ error: "Delete failed", success: false }, { status: 500 });
    }
}
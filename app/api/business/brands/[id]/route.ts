import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;
        const decoded = verifyPOSToken(token || "");

        if (!decoded) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

        const brand = await prisma.brand.findFirst({
            where: { id, businessId: decoded.businessId },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!brand) {
            return NextResponse.json({ error: "Brand not found", success: false }, { status: 404 });
        }

        return NextResponse.json({ success: true, brand }, { status: 200 });
    } catch (error) {
        console.error("GET_BRAND_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch brand", success: false }, { status: 500 });
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
        const validatedData = updateBrandSchema.parse(body);

        // Check if brand name is unique within business (excluding current brand)
        const existingBrand = await prisma.brand.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId,
                NOT: { id }
            }
        });
        if (existingBrand) {
            return NextResponse.json(
                { error: "A brand with this name already exists in your business.", success: false },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedBrand = await tx.brand.update({
                where: { id, businessId },
                data: {
                    name: validatedData.name,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE_BRAND",
                    entity: "BRAND",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return updatedBrand;
        });

        return NextResponse.json(
            { success: true, message: `Brand ${result.name} updated successfully`, brand: result },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Brand update error:", error);
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

        const currentBrand = await prisma.brand.findFirst({
            where: { id, businessId },
            select: { name: true }
        });

        if (!currentBrand) {
            return NextResponse.json({ error: "Brand not found", success: false }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    action: "DELETE_BRAND",
                    entity: "BRAND",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            await tx.brand.delete({
                where: { id, businessId }
            });
        });

        return NextResponse.json(
            { success: true, message: `Brand deleted successfully` },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Brand delete error:", error);
        if (error instanceof Error && 'code' in error && error.code === 'P2003') {
            return NextResponse.json({
                error: "Cannot delete brand with associated products. Remove products first.",
                success: false
            }, { status: 400 });
        }
        return NextResponse.json({ error: "Delete failed", success: false }, { status: 500 });
    }
}
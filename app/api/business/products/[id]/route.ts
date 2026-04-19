import { prisma } from "@/lib/dbHelper";
import { getSession } from "@/lib/auths";
import { productSchema } from "@/schema/inventory.schema";
import { NextRequest, NextResponse } from "next/server";
import { deleteUTFile } from "@/lib/actions/uploadthing";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const product = await prisma.product.findFirst({
            where: { id, businessId: session.businessId },
            select: {
                id: true,
                name: true,
                description: true,
                sku: true,
                price: true,
                costPrice: true,
                stock: true,
                lowStockAlert: true,
                isActive: true,
                imageUrl: true,
                fileKey: true,
                createdAt: true,
                updatedAt: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                brand: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                discount: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        value: true,
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found", success: false }, { status: 404 });
        }

        return NextResponse.json({ success: true, product }, { status: 200 });
    } catch (error) {
        console.error("GET_PRODUCT_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch product", success: false }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId, businessId } = session;
        const body = await request.json();
        
        // Use partial() so we only validate what's sent
        const validatedData = productSchema.partial().parse(body);

        // 1. Fetch current product ONCE for SKU check, Stock check, and Image check
        const currentProduct = await prisma.product.findFirst({
            where: { id, businessId },
            select: { stock: true, name: true, fileKey: true }
        });

        if (!currentProduct) {
            return NextResponse.json({ error: "Product not found", success: false }, { status: 404 });
        }

        // 2. SKU Unique Check
        if (validatedData.sku) {
            const existingProduct = await prisma.product.findFirst({
                where: {
                    sku: validatedData.sku,
                    businessId: businessId,
                    NOT: { id }
                }
            });
            if (existingProduct) {
                return NextResponse.json(
                    { error: "A product with this SKU already exists.", success: false },
                    { status: 400 }
                );
            }
        }

        // 3. Calculate Stock Change
        let stockChange = 0;
        if (validatedData.stock !== undefined) {
            stockChange = validatedData.stock - currentProduct.stock;
        }

        // 4. TRANSACTION
        const result = await prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id, businessId },
                data: validatedData 
            });

            if (stockChange !== 0) {
                await tx.stockLog.create({
                    data: {
                        productId: id,
                        userId,
                        businessId,
                        change: stockChange,
                        reason: "Stock updated manually",
                    }
                });
            }

            await tx.auditLog.create({
                data: {
                    action: "UPDATE_PRODUCT",
                    entity: "PRODUCT",
                    entityId: id,
                    userId,
                    businessId,
                }
            });

            return updatedProduct;
        });

        // 5. POST-TRANSACTION: Image Cleanup
        // If a new fileKey was provided and it's different from the old one, delete the old one
        if (validatedData.fileKey && currentProduct.fileKey && validatedData.fileKey !== currentProduct.fileKey) {
            // We do this AFTER the transaction so we don't delete the file if the DB update fails
            await deleteUTFile(currentProduct.fileKey); 
        }

        return NextResponse.json(
            { success: true, message: `Product ${result.name} updated successfully`, product: result },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("Product update error:", error);
        return NextResponse.json({ error: "Update failed", success: false }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || typeof session === "string"){
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId, businessId } = session;

        // Get current product to log stock removal
        const currentProduct = await prisma.product.findFirst({
            where: { id, businessId },
            select: { stock: true, name: true }
        });

        if (!currentProduct) {
            return NextResponse.json({ error: "Product not found", success: false }, { status: 404 });
        }

        // Use transaction to delete product and log stock removal
        await prisma.$transaction(async (tx) => {
            // Log stock removal if stock > 0
            if (currentProduct.stock > 0) {
                await tx.stockLog.create({
                    data: {
                        productId: id,
                        userId: userId,
                        businessId: businessId,
                        change: -currentProduct.stock,
                        reason: "Product deleted - stock removed",
                    }
                });
            }

            // Create audit log
            await tx.auditLog.create({
                data: {
                    action: "DELETE_PRODUCT",
                    entity: "PRODUCT",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            // Delete product
            await tx.product.delete({
                where: { id, businessId }
            });
        });

        return NextResponse.json({ success: true, message: `Product deleted successfully` },{ status: 200 });
    } catch (error: unknown) {
        console.error("Product delete error:", error);
        // Check for foreign key constraint
        if (error instanceof Error && 'code' in error && error.code === 'P2003') {
            return NextResponse.json({
                error: "Cannot delete product with transaction history. Deactivate it instead.",
                success: false
            }, { status: 400 });
        }
        return NextResponse.json({ error: "Delete failed", success: false }, { status: 500 });
    }
}
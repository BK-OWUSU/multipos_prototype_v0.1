import { prisma } from "@/lib/dbHelper";
import { getSession } from "@/lib/auths";
import { productSchema } from "@/schema/inventory.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // 1. Get and verify the session cookie
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }

        const { userId, businessId } = session;
        const body = await request.json();
        const validatedData = productSchema.parse(body);

        // Check if SKU is unique within business
        if (validatedData.sku) {
            const existingProduct = await prisma.product.findFirst({
                where: {
                    sku: validatedData.sku,
                    businessId: businessId
                }
            });
            if (existingProduct) {
                return NextResponse.json(
                    { error: "A product with this SKU already exists in your business.", success: false },
                    { status: 400 }
                );
            }
        }

        // Use transaction to create product and log stock if initial stock > 0
        const result = await prisma.$transaction(async (tx) => {
            // Create product
            const newProduct = await tx.product.create({
                data: {
                    name: validatedData.name,
                    description: validatedData.description,
                    sku: validatedData.sku,
                    price: validatedData.price,
                    costPrice: validatedData.costPrice,
                    stock: validatedData.stock,
                    lowStockAlert: validatedData.lowStockAlert,
                    categoryId: validatedData.categoryId,
                    brandId: validatedData.brandId,
                    discountId: validatedData.discountId,
                    imageUrl: validatedData.imageUrl,
                    fileKey: validatedData.fileKey,
                    isActive: validatedData.isActive,
                    businessId: businessId,
                }
            });

            // Log initial stock if > 0
            if (validatedData.stock > 0) {
                await tx.stockLog.create({
                    data: {
                        productId: newProduct.id,
                        userId: userId,
                        businessId: businessId,
                        change: validatedData.stock,
                        reason: "Product created with initial stock",
                    }
                });
            }

            // Create audit log
            await tx.auditLog.create({
                data: {
                    action: "CREATE_PRODUCT",
                    entity: "PRODUCT",
                    entityId: newProduct.id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return newProduct;
        });

        return NextResponse.json(
            { success: true, message: `Product ${result.name} created successfully`, product: result },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Product creation error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { businessId } = session;

        // 2. Fetch products with relations
        const products = await prisma.product.findMany({
            where: {
                businessId: businessId,
            },
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
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            products
        }, { status: 200 });

    } catch (error) {
        console.error("GET_PRODUCTS_ERROR:", error);
        return NextResponse.json({error: "Failed to fetch products",success: false}, { status: 500 });
    }
}
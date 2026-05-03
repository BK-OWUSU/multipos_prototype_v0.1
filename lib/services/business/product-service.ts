import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { productSchema,ProductFormValues } from "@/schema/inventory.schema";
import { ProductImportPayload, ProductsValidateArray } from "@/lib/configs/product-config";



export async function createProductService(data: ProductFormValues,userId:string, employeeId: string, businessId: string) {
  try {
          const validatedData = productSchema.parse(data);
  
          // Check if SKU is unique within business
          if (validatedData.sku) {
              const existingProduct = await prisma.product.findFirst({
                  where: {
                      sku: validatedData.sku,
                      businessId: businessId
                  }
              });
              if (existingProduct) {
                  return { error: "A product with this SKU already exists in your business.", success: false, status: 400 }
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
                          employeeId: employeeId,
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
  
          return{ success: true, message: `Product ${result.name} created successfully`, product: result, status: 201 }
  
      } catch (error: unknown) {
          console.error("Product creation error:", error);
          return{ error: "Internal Server Error", success: false, status: 500 }
      } 
}
export async function createBulkProductService(
    payload: { data: ProductImportPayload[]; [key: string]: unknown },
    userId: string,
    employeeId: string,
    businessId: string,
    businessSlug: string
) {
    try {
        const validatedData = ProductsValidateArray.parse(payload.data);

        if (validatedData.length === 0) {
            return { error: "No products data provided.", success: false, status: 400 };
        }

        // 1. Unique lookups
        const categoryNames = [...new Set(validatedData.map((p) => p.category).filter(Boolean))];
        const brandNames = [...new Set(validatedData.map((p) => p.brand).filter(Boolean))];

        const [categoriesInDB, brandsInDB] = await Promise.all([
            prisma.category.findMany({
                where: { businessId, name: { in: categoryNames as string[] } },
                select: { id: true, name: true }
            }),
            prisma.brand.findMany({
                where: { businessId, name: { in: brandNames as string[] } },
                select: { id: true, name: true }
            }),
        ]);

        // FIX: Map Name -> ID (The key must be the name from CSV)
        const categoryMap = new Map(categoriesInDB.map((cat) => [cat.name, cat.id]));
        const brandMap = new Map(brandsInDB.map((brand) => [brand.name, brand.id]));

        // 2. SKU De-duplication
        const skusToImport = validatedData.map((p) => p.sku).filter(Boolean) as string[];
        const existingProducts = await prisma.product.findMany({
            where: { businessId, sku: { in: skusToImport } },
            select: { sku: true }
        });
        const existingSKUSet = new Set(existingProducts.map((p) => p.sku));

        // 3. Prepare Data
        const newProductsData = validatedData
            .filter((prod) => !existingSKUSet.has(prod.sku || ""))
            .map((prod) => {
                const categoryId = prod.category ? categoryMap.get(prod.category) : null;
                const brandId = prod.brand ? brandMap.get(prod.brand) : null;

                // Optional: Validation if category/brand MUST exist
                // if (prod.category && !categoryId) throw new Error(`Category "${prod.category}" not found.`);

                return {
                    name: prod.name,
                    price: prod.price,
                    costPrice: prod.costPrice,
                    stock: prod.stock || 0,
                    lowStockAlert: prod.lowStockAlert,
                    isActive: prod.isActive ?? true,
                    sku: prod.sku || null,
                    businessId: businessId,
                    description: prod.description || "",
                    categoryId: categoryId, // Assuming field name is categoryId in DB
                    brandId: brandId,       // Assuming field name is brandId in DB
                    discountId: null,
                    imageUrl: null,
                    fileKey: null
                };
            });

        if (newProductsData.length === 0) {
            return { error: "All products already exist (SKU match).", success: false, status: 400 };
        }

        // 4. Execution Transaction
        const finalResult = await prisma.$transaction(async (tx) => {
            const createdProducts = await tx.product.createManyAndReturn({
                data: newProductsData,
                skipDuplicates: true
            });

            // Bulk Create Stock Logs (Performance Optimization)
            const stockLogsData = createdProducts
                .filter(p => p.stock > 0)
                .map(p => ({
                    productId: p.id,
                    employeeId: employeeId,
                    businessId: businessId,
                    change: p.stock,
                    reason: "Initial import stock"
                }));

            if (stockLogsData.length > 0) {
                await tx.stockLog.createMany({ data: stockLogsData });
            }

            // Bulk Create Audit Logs
            await tx.auditLog.createMany({
                data: createdProducts.map((p) => ({
                    action: "CREATE_PRODUCT",
                    entity: "PRODUCT",
                    entityId: p.id,
                    userId: userId,
                    businessId: businessId,
                    newValue: `Imported SKU: ${p.sku}`
                }))
            });

            return createdProducts;
        });

        return {
            success: true,
            message: `Successfully imported ${finalResult.length} products.`,
            redirectTo: `/${businessSlug}/product_list`,
            status: 200
        };

    } catch (error: unknown) {
        console.error("Bulk Import Error:", error);
        return { 
            error: (error as Error).message || "Internal Server Error", 
            success: false, 
            status: 500 
        };
    }
}

export async function getAllProductsService(businessId: string) {
  try {
    // 2. Fetch products with relations
        const products = await prisma.product.findMany({
            where: {
                businessId: businessId,
                isDeleted: false
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

        return {success: true, products: products, status: 200 };
        

  } catch (error) {
    console.error("GET_PRODUCTS_ERROR:", error);
    return {error: "Failed to fetch products",success: false, status: 500 };
  }
}

export async function getProductByIdService(productId: string, businessId: string) { 
  try {
          const product = await prisma.product.findFirst({
              where: { id: productId, businessId: businessId },
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
              return { error: "Product not found", success: false ,status: 404 };
          }
  
          return { success: true, product: product, status: 200 };
      } catch (error) {
          console.error("GET_PRODUCT_ERROR:", error);
          return{ error: "Failed to fetch product", success: false,  status: 500 };
      }
}

export async function updateProductService(productId: string, data: ProductFormValues, userId: string, employeeId: string, businessId: string) { 
  try {
          // Use partial() so we only validate what's sent
          const validatedData = productSchema.partial().parse(data);
  
          // 1. Fetch current product ONCE for SKU check, Stock check, and Image check
          const currentProduct = await prisma.product.findFirst({
              where: { id: productId, businessId },
              select: { stock: true, name: true, fileKey: true }
          });
  
          if (!currentProduct) {
              return{ error: "Product not found", success: false, status: 404 } ;
          }
  
          // 2. SKU Unique Check
          if (validatedData.sku) {
              const existingProduct = await prisma.product.findFirst({
                  where: {
                      sku: validatedData.sku,
                      businessId: businessId,
                      NOT: { id: productId }
                  }
              });
              if (existingProduct) {
                  return { error: "A product with this SKU already exists.", success: false,status: 400 };
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
                  where: { id: productId, businessId },
                  data: validatedData 
              });
  
              if (stockChange !== 0) {
                  await tx.stockLog.create({
                      data: {
                          productId: productId,
                          employeeId,
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
                      entityId: productId,
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
  
          return { success: true, message: `Product ${result.name} updated successfully`, product: result,status: 200 };  
      } catch (error: unknown) {
          console.error("Product update error:", error);
          return { error: "Update failed", success: false ,status: 500 };
      }
}



export async function softProductDeleteService(productId: string, userId: string, employeeId: string, businessId: string) {
   try {  
          // Get current product to log stock removal
          const currentProduct = await prisma.product.findFirst({
              where: { id: productId, businessId, isDeleted: false },
              select: { stock: true, name: true }
          });
  
          if (!currentProduct) {
              return { error: "Product not found", success: false, status: 404 };
          }
  
          // Use transaction to delete product and log stock removal
          await prisma.$transaction(async (tx) => {
              // Log stock removal if stock > 0
              console.log("removal Started")
              if (currentProduct.stock > 0) {
                  await tx.stockLog.create({
                      data: {
                          productId: productId,
                          employeeId: employeeId,
                          businessId: businessId,
                          change: -currentProduct.stock,
                          reason: "Product deleted - stock removed",
                      }
                  });
              }
  
              // Create audit log
              await tx.auditLog.create({
                  data: {
                      action: "SOFT_DELETE_PRODUCT",
                      entity: "PRODUCT",
                      entityId: productId,
                      userId: userId,
                      businessId: businessId,
                  }
              });
  
              // Delete product
              await tx.product.update({
                  where: { id: productId, businessId },
                  data: {isDeleted: true, deletedAt: new Date()}
              });
          });
  
          return { success: true, message: `Product deleted successfully` ,status: 200 };
      } catch (error: unknown) {
          console.error("Product delete error:", error);
          // Check for foreign key constraint
          if (error instanceof Error && 'code' in error && error.code === 'P2003') {
              return {error: "Cannot delete product with transaction history. Deactivate it instead.",success: false, status: 400 };
          }
          return { error: "Delete failed", success: false ,status: 500 };
      }
}

export async function hardProductDeleteService(productId: string, userId: string,employeeId:string, businessId: string) {
   try {  
          // Get current product to log stock removal
          const currentProduct = await prisma.product.findFirst({
              where: { id: productId, businessId, isDeleted: false },
              select: { stock: true, name: true, fileKey: true }
          });
  
          if (!currentProduct) {
              return { error: "Product not found", success: false, status: 404 };
          }
  
          // Use transaction to delete product and log stock removal
         const fileToDelete = await prisma.$transaction(async (tx) => {
              // Log stock removal if stock > 0
              console.log("removal Started")
              if (currentProduct.stock > 0) {
                  await tx.stockLog.create({
                      data: {
                          productId: productId,
                          employeeId: employeeId,
                          businessId: businessId,
                          change: -currentProduct.stock,
                          reason: "Product deleted - stock removed",
                      }
                  });
              }
  
              // Create audit log
              await tx.auditLog.create({
                  data: {
                      action: "HARD_DELETE_PRODUCT",
                      entity: "PRODUCT",
                      entityId: productId,
                      userId: userId,
                      businessId: businessId,
                  }
                
                });
                
                // Delete product
                await tx.product.delete({
                  where: { id: productId, businessId }
                });

                return currentProduct;
          });

          if (fileToDelete.fileKey) {
            await deleteUTFile(fileToDelete.fileKey);
          }
  
          return { success: true, message: `Product deleted successfully` ,status: 200 };
      } catch (error: unknown) {
          console.error("Product delete error:", error);
          // Check for foreign key constraint
          if (error instanceof Error && 'code' in error && error.code === 'P2003') {
              return {error: "Cannot delete product with transaction history. Deactivate it instead.",success: false, status: 400 };
          }
          return { error: "Delete failed", success: false ,status: 500 };
      }
}



  export async function performBulkProductDeleteService(ids: string[], userId: string, businessId: string, businessSlug:string ) { 

  try {
    // 1. Database Transaction
    const productsWithFiles = await prisma.$transaction(async (tx) => {
      const productsToDelete = await tx.product.findMany({
        where: { id: { in: ids }, businessId: businessId },
      });

      if (productsToDelete.length === 0) throw new Error("No products found.");

      await tx.auditLog.createMany({
        data: productsToDelete.map((product) => ({
          action: "DELETE",
          entity: "PRODUCT",
          entityId: product.id,
          oldValue: JSON.stringify(product),
          userId: userId,
          businessId: businessId,
        })),
      });

      await tx.product.deleteMany({
        where: { id: { in: productsToDelete.map((p) => p.id) }, businessId: businessId },
      });

      // Return the file keys so we can delete them AFTER the transaction succeeds
      return productsToDelete
        .map((p) => p.fileKey)
        .filter((key): key is string => !!key); 
    });

    // 2. Cleanup UploadThing (Now that the DB is definitely updated)
    if (productsWithFiles.length > 0) {
      await Promise.all(productsWithFiles.map((key) => deleteUTFile(key)));
    }

    return {
      success: true,
      message: `Deleted ${ids.length} items and cleaned up storage.`,
      redirectTo: `/${businessSlug}/product_list`
    } as AppResponse;

  } catch (error) {
    console.error("BULK_DELETE_ERROR:", error);
    return { success: false, error: "An error occurred." } as AppResponse;
  }
}



export async function toggleBulkProductsStatusService(ids: string[], userId: string, businessId: string, businessSlug:string ) {

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch current status of these products
      const products = await tx.product.findMany({
        where: { id: { in: ids }, businessId: businessId },
        select: { id: true, isActive: true, name: true }
      });

      if (products.length === 0) throw new Error("No products found.");

      // 2. Perform updates individually or via a loop if logic is complex
      await Promise.all(
        products.map((product) =>
          tx.product.update({
            where: { id: product.id },
            data: { isActive: !product.isActive },
          })
        )
      );

      // 3. Audit Log
      await tx.auditLog.createMany({
        data: products.map((p) => ({
          action: "UPDATE",
          entity: "PRODUCT",
          entityId: p.id,
          oldValue: JSON.stringify({ isActive: p.isActive }),
          newValue: JSON.stringify({ isActive: !p.isActive }),
          userId: userId,
          businessId: businessId,
        })),
      });
    });



    return {
      success: true,
      message: `Successfully updated status for ${ids.length} products.`,
      redirectTo: `/${businessSlug}/product_list`
    } as AppResponse;
  } catch (error) {
    console.error("BULK_STATUS_TOGGLE_ERROR:", error);
    return { success: false, error: "Failed to update products." } as AppResponse;
  }
}
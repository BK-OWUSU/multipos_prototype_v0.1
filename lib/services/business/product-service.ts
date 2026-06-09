import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { productSchema,ProductFormValues } from "@/types/schema/inventory.schema";
import { Product, ProductsVariants } from "@/types/schema/inventory";
import { GroupedProductImportPayload } from "@/lib/configs/product-config";




export class ProductService {

// CREATE SINGLE PRODUCT METHOD
static async createProduct(
  data: ProductFormValues,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    // 1. Validate Input Shape
    const validatedData = productSchema.parse(data);

    // 2. DUPLICATE CHECK: Verify ALL new SKUs are unique within the business.
    const newSkus = validatedData.variants.map((v) => v.sku);
    const existingVariantSkus = await prisma.productVariant.findMany({
      where: {
        sku: { in: newSkus },
        product: { businessId: businessId },
        isDeleted: false,
      },
      select: { sku: true },
    });

    if (existingVariantSkus.length > 0) {
      const duplicateSkus = existingVariantSkus.map((v) => v.sku).join(", ");
      return {
        error: `These SKUs already exist in your business: ${duplicateSkus}`,
        success: false,
        status: 400,
      };
    }

    // 3. START TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // ── STEP A: Create the Parent Product ─────────────────
      const newProduct = await tx.product.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          baseSku: validatedData.baseSku.trim().toUpperCase(),
          hasVariant: validatedData.hasVariant,
          isActive: validatedData.isActive,
          businessId: businessId,
          categoryId: validatedData.categoryId === "none" ? null : validatedData.categoryId,
          brandId: validatedData.brandId === "none" ? null : validatedData.brandId,
        },
      });

      const attributeValueMap: Record<string, string> = {};

      // ── STEP B: Resolve Attributes & Predefined Values ───
      if (validatedData.hasVariant && validatedData.attributes && validatedData.attributes.length > 0) {
        for (const attrRule of validatedData.attributes) {
          if (!attrRule.name) continue;

          const attributeGroup = await tx.variantAttribute.upsert({
            where: {
              businessId_name: {
                businessId: businessId,
                name: attrRule.name.trim(),
              },
            },
            update: {
              sortOrder: attrRule.sortOrder,
            },
            create: {
              name: attrRule.name.trim(),
              businessId: businessId,
              sortOrder: attrRule.sortOrder,
            },
          });

          const tagsArray = attrRule.matrixSplitValues
            ? attrRule.matrixSplitValues.split(",").map((v) => v.trim()).filter(Boolean)
            : [];

          for (const tagValue of tagsArray) {
            const valueRecord = await tx.variantAttributeValue.upsert({
              where: {
                attributeId_value: {
                  attributeId: attributeGroup.id,
                  value: tagValue,
                },
              },
              update: {},
              create: {
                attributeId: attributeGroup.id,
                value: tagValue,
              },
            });

            const compositeKey = `${attributeGroup.name}:${tagValue}`;
            attributeValueMap[compositeKey] = valueRecord.id;
          }
        }
      }

      // ── STEP C: Create Product Variants & Inventories per Branch ───
      for (const variantData of validatedData.variants) {
        
        // 1. Build the variant write step (stock/lowStock removed from here)
        const newVariant = await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            sku: variantData.sku,
            barcode: variantData.barcode || null,
            price: variantData.price,
            costPrice: variantData.costPrice,
            weight: variantData.weight !== undefined ? variantData.weight : null,
            length: variantData.length !== undefined ? variantData.length : null,
            width: variantData.width !== undefined ? variantData.width : null,
            height: variantData.height !== undefined ? variantData.height : null,
            sortOrder: variantData.sortOrder,
            isActive: variantData.isActive,
          },
        });

        // 2. Link variant image records
        if (variantData.imageUrl) {
          await tx.variantImage.create({
            data: {
              variantId: newVariant.id,
              imageUrl: variantData.imageUrl,
              imageKey: variantData.fileKey || null,
              isPrimary: true,
              sortOrder: 0,
            },
          });
        }

        // 3. Populate product variant option junctions (Many-to-Many Linking)
        if (validatedData.hasVariant && variantData.options && variantData.options.length > 0) {
          const junctionData = variantData.options
            .map((opt) => {
              const compositeKey = `${opt.attributeName}:${opt.value}`;
              const attributeValueId = attributeValueMap[compositeKey];
              
              if (!attributeValueId) return null;

              return {
                variantId: newVariant.id,
                attributeValueId: attributeValueId,
              };
            })
            .filter(Boolean) as { variantId: string; attributeValueId: string }[];

          if (junctionData.length > 0) {
            await tx.productVariantOption.createMany({
              data: junctionData,
            });
          }
        }

        // 4. 🟢 THE MIGRATION FIX: Create entries inside individual branches
        if (variantData.branchInventories && variantData.branchInventories.length > 0) {
          for (const inv of variantData.branchInventories) {
            // Only create inventory records if stock is allocated or lowStockAlert is explicitly set
            const createdInventory = await tx.shopInventory.create({
              data: {
                businessId: businessId,
                shopId: inv.shopId,
                productVariantId: newVariant.id,
                stock: inv.stock,
                lowStockAlert: inv.lowStockAlert,
              }
            });

            // 5. 🟢 FIX STOCK LOGS: Write structural branch history records
            if (inv.stock > 0) {
              await tx.stockLog.create({
                data: {
                  productVariantId: newVariant.id,
                  shopInventoryId: createdInventory.id,
                  employeeId: employeeId,
                  businessId: businessId,
                  shopId: inv.shopId, // Required by your schema update
                  change: inv.stock,
                  reason: `Initial stock allocation for branch during creation of SKU: ${newVariant.sku}.`,
                },
              });
            }
          }
        }
      }

      // ── STEP D: Final Auditing ────────────────────────────
      await tx.auditLog.create({
        data: {
          action: "CREATE_PRODUCT_WITH_VARIANTS",
          entity: "PRODUCT",
          entityId: newProduct.id,
          userId: userId,
          businessId: businessId,
        },
      });

      return newProduct;
    });

    return {
      success: true,
      message: `Product "${result.name}" saved and variations mapped successfully.`,
      product: result,
      status: 201,
    };
      
  } catch (error: unknown) {
    console.error("Critical transactional API write loop error:", error);
    return { 
      error: (error as Error).message || "An unexpected system error occurred while adding the product.", 
      success: false, 
      status: 500 
    };    
  }
}

// CREATE BULK PRODUCT SERVICE (GLOBAL CATALOG ONLY)
static async createBulkProductsService(
    payload: { data: GroupedProductImportPayload[] },
    userId: string,
    employeeId: string,
    businessId: string,
    businessSlug: string
  ) {
    try {
      const productItems = payload.data;

      if (!productItems || productItems.length === 0) {
        return { success: false, error: "No product data found in payload.", status: 400 };
      }

      // ── EXECUTE TRANSACTION ───────────────────────────────────
      const transactionResult = await prisma.$transaction(async (tx) => {
        let savedProductsCount = 0;
        let savedVariantsCount = 0;

        for (const item of productItems) {
          // A. Upsert the parent product container using its unique business + baseSku combo
          const parentProduct = await tx.product.upsert({
            where: {
              businessId_baseSku: {
                businessId: businessId,
                baseSku: item.baseSku.trim().toUpperCase(),
              }
            },
            update: {
              name: item.name.trim(),
              description: item.description,
              hasVariant: item.hasVariant,
              isActive: item.isActive,
              categoryId: item.categoryId,
              brandId: item.brandId,
              isDeleted: false // Restores if previously soft-deleted
            },
            create: {
              name: item.name.trim(),
              description: item.description,
              baseSku: item.baseSku.trim().toUpperCase(),
              hasVariant: item.hasVariant,
              isActive: item.isActive,
              businessId: businessId,
              categoryId: item.categoryId,
              brandId: item.brandId,
            },
          });

          savedProductsCount++;
          const attributeValueIdMap: Record<string, string> = {};

          // B. Upsert Variant Attributes & Dynamic Attribute Values
          if (item.hasVariant && item.attributes && item.attributes.length > 0) {
            for (const attr of item.attributes) {
              if (!attr.name) continue;

              const attributeGroup = await tx.variantAttribute.upsert({
                where: {
                  businessId_name: {
                    businessId: businessId,
                    name: attr.name.trim(),
                  },
                },
                update: { sortOrder: attr.sortOrder },
                create: {
                  name: attr.name.trim(),
                  businessId: businessId,
                  sortOrder: attr.sortOrder,
                },
              });

              const distinctValuesForAttribute = new Set<string>();
              item.variants.forEach((v) => {
                v.options.forEach((opt) => {
                  if (opt.attributeName.trim().toLowerCase() === attr.name.trim().toLowerCase() && opt.value) {
                    distinctValuesForAttribute.add(opt.value.trim());
                  }
                });
              });

              for (const tagValue of distinctValuesForAttribute) {
                const valueRecord = await tx.variantAttributeValue.upsert({
                  where: {
                    attributeId_value: {
                      attributeId: attributeGroup.id,
                      value: tagValue,
                    },
                  },
                  update: {},
                  create: {
                    attributeId: attributeGroup.id,
                    value: tagValue,
                  },
                });

                const compositeMapKey = `${attributeGroup.name}:${tagValue}`;
                attributeValueIdMap[compositeMapKey] = valueRecord.id;
              }
            }
          }

          // C. Map Product Variants (Catalog Matrix Only - No Stocks Tracked Here)
          if (item.variants && item.variants.length > 0) {
            for (const variantData of item.variants) {
              
             const variantRecord = await tx.productVariant.upsert({
                where: {
                  productId_sku: {
                    productId: parentProduct.id,
                    sku: variantData.sku.trim(),
                  }
                },
                update: {
                  barcode: variantData.barcode,
                  price: variantData.price,
                  costPrice: variantData.costPrice,
                  weight: variantData.weight,
                  length: variantData.length,
                  width: variantData.width,
                  height: variantData.height,
                  isActive: variantData.isActive,
                },
                create: {
                  productId: parentProduct.id,
                  sku: variantData.sku.trim(),
                  barcode: variantData.barcode,
                  price: variantData.price,
                  costPrice: variantData.costPrice,
                  weight: variantData.weight,
                  length: variantData.length,
                  width: variantData.width,
                  height: variantData.height,
                  sortOrder: variantData.sortOrder,
                  isActive: variantData.isActive,
                },
              });

              savedVariantsCount++;

              // Note: If you need variant choices mapped via productVariantOption, 
              // you can perform that block here cleanly using a find/create query pattern.
              // 2. 🟢 SAFE OPTION JUNCTION MAPPING (Handles both creates & safe updates)
              if (item.hasVariant && variantData.options && variantData.options.length > 0) {
                const junctionsToInsert = variantData.options
                  .map((opt) => {
                    const lookupKey = `${opt.attributeName.trim()}:${opt.value.trim()}`;
                    const targetValueId = attributeValueIdMap[lookupKey];

                    if (!targetValueId) return null;

                    return {
                      variantId: variantRecord.id,
                      attributeValueId: targetValueId,
                    };
                  })
                  .filter(Boolean) as { variantId: string; attributeValueId: string }[];

                  if (junctionsToInsert.length > 0) {
                // skipDuplicates ensures it won't crash if the relation already exists
                await tx.productVariantOption.createMany({
                  data: junctionsToInsert,
                  skipDuplicates: true, 
                });
              }
            }
            }
          }
        }

        // D. Batch summary Audit Log entry
        await tx.auditLog.create({
          data: {
            action: "BULK_IMPORT_PRODUCTS_CATALOG",
            entity: "PRODUCT",
            entityId: "BULK_BATCH",
            userId: userId,
            businessId: businessId,
            details: JSON.stringify({
              productsProcessedCount: savedProductsCount,
              variantsProcessedCount: savedVariantsCount,
            }),
          },
        });

        return { productsCount: savedProductsCount, variantsCount: savedVariantsCount };
      });

      return {
        success: true,
        message: `Successfully imported ${transactionResult.productsCount} products and ${transactionResult.variantsCount} variants into your global product catalog blueprint.`,
        status: 201,
        redirectTo: `/${businessSlug}/products`
      };

    } catch (error: unknown) {
      console.error("Critical catalog bulk upload configuration engine crash:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected error occurred processing your catalog configuration file.",
        status: 500,
      };
    }
  }

  // GET ALL PRODUCTS SERVICE - FULL DETAIL WITH VARIANTS & IMAGES
static async getAllProductsService(businessId: string): Promise<AppResponse> {
  try {
    // 1. Fetch Products Optimized for List/Grid Views with the new multi-tenant layout
    const products = await prisma.product.findMany({
      where: {
        businessId: businessId,
        isDeleted: false, 
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },

        // ── VARIANT RELATION FETCH ─────────────────
        variants: {
          where: { isDeleted: false }, 
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            productId: true,
            sku: true,
            barcode: true,
            price: true,     
            costPrice: true,
            isActive: true,
            sortOrder: true,
            // stock and lowStockAlert have been removed from here! ❌

            // 🟢 NEW: Fetch stock levels assigned across all branches for this business
            shopInventories: {
              where: { businessId: businessId },
              select: {
                id: true,
                shopId: true,
                stock: true,
                lowStockAlert: true,
              }
            },

            // Fetch images from isolated VariantImage table
            images: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                imageUrl: true,
                imageKey: true,
                isPrimary: true,
              },
            },

            // Resolve many-to-many options link
            variantOptions: {
              select: {
                attributeValue: {
                  select: {
                    id: true,
                    value: true, 
                    attribute: {
                      select: {
                        id: true,
                        name: true, 
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Frontend Shape Transformer 
    const transformedProducts = products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => {
        // Flatten the relation: variantOptions -> attributeValue -> attribute
        const flattenedOptions = variant.variantOptions.map((vo) => ({
          attributeId: vo.attributeValue.attribute.id,
          attributeName: vo.attributeValue.attribute.name,
          valueId: vo.attributeValue.id,
          value: vo.attributeValue.value,
        }));

        // Find the primary image or fall back to the first available one
        const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

        // 🟢 AGGREGATION: Calculate total combined stock across all branches for this catalog layout
        const totalStock = variant.shopInventories.reduce((acc, current) => acc + current.stock, 0);

        // Fallback or use alert configs from inventories (taking the highest or first available config)
        const lowStockAlertFallback = variant.shopInventories[0]?.lowStockAlert ?? 0;

        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku,
          barcode: variant.barcode,

          price: variant.price, 
          costPrice: variant.costPrice,
          isActive: variant.isActive,
          sortOrder: variant.sortOrder,

          stock: totalStock, 
          lowStockAlert: lowStockAlertFallback,
          shopInventories: variant.shopInventories,
          
          images: variant.images,
          variantOptions: flattenedOptions, 
          primaryImage: primaryImage,
          imageUrl: primaryImage ? primaryImage.imageUrl : null, 
        }; 
      }),
    })) as Product[];

    return { 
      success: true, 
      data: transformedProducts, 
      status: 200 
    } as unknown as AppResponse;

  } catch (error: unknown) {
    console.error("GET_ALL_PRODUCTS_ERROR:", error);
    return { success: false, error: "Internal Server Error", status: 500 } as AppResponse;
  }
}


//GET ALL PRODUCT VIA PRODUCT-VARIANT
static async getAllProductVariantsService(businessId: string) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        isDeleted: false,
        product: {
          businessId: businessId, // Scopes safely to tenant
          isDeleted: false,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            hasVariant: true,
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        },
        // 🟢 NEW: Fetch the branch-specific stocks to calculate aggregates
        shopInventories: {
          where: { businessId: businessId },
          select: {
            id: true,
            shopId: true,
            stock: true,
            lowStockAlert: true,
          }
        },
        images: {
          orderBy: {
            sortOrder: "asc", 
          },
          select: {
            id: true,
            imageUrl: true,
            imageKey: true,
            isPrimary: true,
          },
        },
        variantOptions: {
          select: {
            attributeValue: {
              select: {
                id: true,
                value: true,
                attribute: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: "asc", 
      },
    });

    // Flattening layer
    const transformedVariants = variants.map((variant) => {
      const options = variant.variantOptions.map((vo) => ({
        attributeId: vo.attributeValue.attribute.id,
        attributeName: vo.attributeValue.attribute.name,
        valueId: vo.attributeValue.id,
        value: vo.attributeValue.value,
      }));

      const optionString = options.map((o) => o.value).join(" - ");
      const displayName = optionString 
        ? `${variant.product.name} (${optionString})` 
        : variant.product.name;

      const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

      // 🟢 AGGREGATION FIX: Calculate cross-branch totals dynamically
      const totalStock = variant.shopInventories.reduce((acc, current) => acc + current.stock, 0);
      const lowStockAlertFallback = variant.shopInventories[0]?.lowStockAlert ?? 0;

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,
        price: Number(variant.price), 
        costPrice: Number(variant.costPrice),
        
        // 🟢 FIXED PROPERTIES: Maps aggregate totals seamlessly back to your frontend type layout
        stock: totalStock,
        lowStockAlert: lowStockAlertFallback,
        shopInventories: variant.shopInventories, 
        
        isActive: variant.isActive,
        weight: variant.weight ? Number(variant.weight) : null,
        length: variant.length ? Number(variant.length) : null,
        height: variant.height ? Number(variant.height) : null,
        width: variant.width ? Number(variant.width) : null,
        
        productName: variant.product.name,
        displayName: displayName, 
        description: variant.product.description,
        category: variant.product.category,
        brand: variant.product.brand,
        hasMultipleVariants: variant.product.hasVariant,

        options: options,
        imageUrl: primaryImage ? primaryImage.imageUrl : null,
        images: variant.images,
        createdAt: variant.createdAt,
        sortOrder: variant.sortOrder
      }; 
    });

    return { 
      success: true, 
      data: transformedVariants as unknown as ProductsVariants[], 
      status: 200 
    } as AppResponse;

  } catch (error: unknown) {
    console.error("GET_ALL_PRODUCT_VARIANTS_ERROR:", error);
    return { error: "Internal Server Error", success: false, status: 500 } as AppResponse;
  }
}


// GET ALL PRODUCTS FOR A SPECIFIC SHOP'S POS TERMINAL
static async getShopProductsForPOS(businessId: string, shopId: string): Promise<AppResponse> {
  try {
    // 1. Query from the perspective of the target shop's localized shelves
    const shopProducts = await prisma.product.findMany({
      where: {
        businessId: businessId,
        isDeleted: false,
        isActive: true, // Only display sellable products in the POS terminal
        variants: {
          some: {
            isDeleted: false,
            isActive: true,
            // Ensure the variant is assigned to this shop's layout profile
            shopInventories: {
              some: { shopId: shopId }
            }
          }
        }
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },

        // ── FETCH ONLY THE VARIANTS WITH THEIR LOCAL QUANTITIES ──
        variants: {
          where: { 
            isDeleted: false,
            isActive: true,
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            productId: true,
            sku: true,
            barcode: true,
            price: true,     
            costPrice: true,
            isActive: true,
            sortOrder: true,

            // 🟢 Target ONLY this exact shop's storage row
            shopInventories: {
              where: { shopId: shopId },
              select: {
                id: true,
                stock: true,
                lowStockAlert: true,
              }
            },

            images: {
              orderBy: { sortOrder: 'asc' },
              where: { isPrimary: true }, // Optimization: POS grid usually only needs the primary thumbnail
              select: { id: true, imageUrl: true },
            },

            variantOptions: {
              select: {
                attributeValue: {
                  select: {
                    id: true,
                    value: true, 
                    attribute: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' } // Alphabetical order is typically preferred for fast cash grid scanning
    });

    // 2. Flatten and transform directly for the terminal grid components
    const posTerminalProducts = shopProducts.map((product) => {
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        hasVariant: product.hasVariant,
        category: product.category,
        brand: product.brand,
        
        // Map child variations
        variants: product.variants.map((variant) => {
          const flattenedOptions = variant.variantOptions.map((vo) => ({
            attributeName: vo.attributeValue.attribute.name,
            value: vo.attributeValue.value,
          }));

          // Pull local shelf storage values
          const localInventory = variant.shopInventories[0];
          const localStock = localInventory ? localInventory.stock : 0;
          const localAlert = localInventory ? localInventory.lowStockAlert : 0;

          return {
            id: variant.id,
            sku: variant.sku,
            barcode: variant.barcode,
            price: Number(variant.price), // Essential for processing sales totals math safely 
            costPrice: Number(variant.costPrice),
            
            // 🟢 CRITICAL: This is strictly this shop's local stock count!
            stock: localStock, 
            lowStockAlert: localAlert,
            
            variantOptions: flattenedOptions,
            imageUrl: variant.images[0]?.imageUrl || null,
          };
        })
        // 🟢 OPTIONAL FILTER: If you want to completely hide out-of-stock items 
        // from the cash register layout screen, uncomment the filter line below:
        // .filter(v => v.stock > 0)
      };
    });

    return { 
      success: true, 
      data: posTerminalProducts, 
      status: 200 
    } as unknown as AppResponse;

  } catch (error: unknown) {
    console.error("POS_SHOP_PRODUCTS_FETCH_ERROR:", error);
    return { success: false, error: "Internal Server Error", status: 500 } as AppResponse;
  }
}

} 
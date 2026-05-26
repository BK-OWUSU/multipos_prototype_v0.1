import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { productSchema,ProductFormValues } from "@/types/schema/inventory.schema";
import { Product } from "@/types/schema/inventory";
import { GroupedProductImportPayload } from "@/lib/configs/product-config";




export class ProductService {

  //CREATE SINGLE PRODUCT METHOD
  static async createProduct(
    data: ProductFormValues,
    userId: string,
    employeeId: string,
    businessId: string
  ) {
    try {
      // 1. Validate Input Shape
      const validatedData = productSchema.parse(data)
      // 2. DUPLICATE CHECK: Verify ALL new SKUs are unique within the business.
      const newSkus = data.variants.map((v) => v.sku);
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
    const result = await prisma.$transaction(async(tx)=> {
      // ── STEP A: Create the Parent Product ─────────────────
      const newProduct = await tx.product.create({
          data: {
          name: validatedData.name,
          description: validatedData.description,
          baseSku: validatedData.baseSku.trim().toUpperCase(), // Enforce SKU prefix formatting
          hasVariant: validatedData.hasVariant,
          isActive: validatedData.isActive,
          businessId: businessId,
          // Handle 'none' value state safely from select tags
          categoryId: validatedData.categoryId === "none" ? null : data.categoryId,
          brandId: validatedData.brandId === "none" ? null : data.brandId,
        },
      });
      // A dictionary tracking option value strings linked to their Database record primary IDs
      // Format: Record<"AttributeName:ValueString", valueCuidId>
      // e.g., { "Color:Blue": "cl...123", "Size:M": "cl...456" }
      const attributeValueMap: Record<string, string> = {};
      //STEP B: Resolve Attributes & Predefined Values ───
      if (validatedData.hasVariant && validatedData.attributes && validatedData.attributes.length > 0) {
        for (const attrRule of validatedData.attributes) {
          if (!attrRule.name) continue;

          // 1. Ensure Attribute Group exists for this business (e.g., "Color")
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

          // 2. Parse tags out from matrixSplitValues comma string
          const tagsArray = attrRule.matrixSplitValues
            ? attrRule.matrixSplitValues.split(",").map((v) => v.trim()).filter(Boolean)
            : [];

          // 3. Process every tag option value item safely
          for (const tagValue of tagsArray) {
            const valueRecord = await tx.variantAttributeValue.upsert({
              where: {
                attributeId_value: {
                  attributeId: attributeGroup.id,
                  value: tagValue,
                },
              },
              update: {}, // No updates needed if it already exists
              create: {
                attributeId: attributeGroup.id,
                value: tagValue,
              },
            });

            // Map unique lookup key string directly to the DB relational ID record
            const compositeKey = `${attributeGroup.name}:${tagValue}`;
            attributeValueMap[compositeKey] = valueRecord.id;
          }
        }
      }

      // ── STEP C: Create Product Variants & Junction Matrix Items ───
      for (const variantData of validatedData.variants) {
        
        // 1. Build the variant write step with safe structure formatting
        const newVariant = await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            sku: variantData.sku,
            barcode: variantData.barcode || null,
            price: variantData.price,
            costPrice: variantData.costPrice,
            stock: variantData.stock,
            lowStockAlert: variantData.lowStockAlert,
            weight: variantData.weight !== null ? variantData.weight : null,
            length: variantData.length !== null ? variantData.length : null,
            width: variantData.width !== null ? variantData.width : null,
            height: variantData.height !== null ? variantData.height : null,
            sortOrder: variantData.sortOrder,
            isActive: variantData.isActive,
          },
        });

        // 2. Link UploadThing variant image records if metadata exists
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
              
              if (!attributeValueId) return null; // Safe fallback validation check

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

        // 4. Log initial stock activity records if inventory > 0
        if (variantData.stock > 0) {
          await tx.stockLog.create({
            data: {
              productVariantId: newVariant.id,
              employeeId: employeeId,
              businessId: businessId,
              change: variantData.stock,
              reason: `Initial stock for SKU: ${newVariant.sku} during product configuration matrix save.`,
            },
          });
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
    })

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


// CREATE BULK PRODUCT SERVICE
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

      // ── STEP 1: REMOVED GLOBAL ABORT ABILITY FOR SMOOTH UPSERTS ───────────────────

      // ── STEP 2: EXECUTE TRANSACTION ───────────────────────────────────
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
              isDeleted: false // Restores the parent product if it was previously marked as soft-deleted
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

              // 1. Upsert the primary Attribute Group (e.g., "Color")
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

              // 2. Dynamically scan all variants to gather every real option value
              const distinctValuesForAttribute = new Set<string>();
              item.variants.forEach((v) => {
                v.options.forEach((opt) => {
                  if (opt.attributeName.trim().toLowerCase() === attr.name.trim().toLowerCase() && opt.value) {
                    distinctValuesForAttribute.add(opt.value.trim());
                  }
                });
              });

              // 3. Secure option value configurations directly in your database maps
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

          // C. Map Product Variants (With Smart Inventory Influx Management)
          if (item.variants && item.variants.length > 0) {
            for (const variantData of item.variants) {
              
              // 1. Look to see if the variant already exists in this specific business profile
              const existingVariant = await tx.productVariant.findFirst({
                where: {
                  sku: variantData.sku.trim(),
                  product: { businessId: businessId },
                  isDeleted: false
                }
              });

              let variantRecord;

              if (existingVariant) {
                // UPDATE: Maintain stock aggregation history safely
                variantRecord = await tx.productVariant.update({
                  where: { id: existingVariant.id },
                  data: {
                    barcode: variantData.barcode,
                    price: variantData.price,
                    costPrice: variantData.costPrice,
                    stock: { increment: variantData.stock }, // Increments current storage with new excel imports
                    lowStockAlert: variantData.lowStockAlert,
                    weight: variantData.weight,
                    length: variantData.length,
                    width: variantData.width,
                    height: variantData.height,
                    isActive: variantData.isActive,
                  }
                });
              } else {
                // CREATE: Standard clean insert layout
                variantRecord = await tx.productVariant.create({
                  data: {
                    productId: parentProduct.id,
                    sku: variantData.sku.trim(),
                    barcode: variantData.barcode,
                    price: variantData.price,
                    costPrice: variantData.costPrice,
                    stock: variantData.stock,
                    lowStockAlert: variantData.lowStockAlert,
                    weight: variantData.weight,
                    length: variantData.length,
                    width: variantData.width,
                    height: variantData.height,
                    sortOrder: variantData.sortOrder,
                    isActive: variantData.isActive,
                  },
                });
              }

              savedVariantsCount++;

              // Map options relational junction rows (Only necessary for brand new variations)
              if (!existingVariant && item.hasVariant && variantData.options && variantData.options.length > 0) {
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
                  await tx.productVariantOption.createMany({
                    data: junctionsToInsert,
                  });
                }
              }

              // Create stock activity log entry if incoming file inventory quantity > 0
              if (variantData.stock > 0) {
                await tx.stockLog.create({
                  data: {
                    productVariantId: variantRecord.id,
                    employeeId: employeeId,
                    businessId: businessId,
                    change: variantData.stock,
                    reason: existingVariant 
                      ? `Stock replenishment via Excel template bulk-upload adjustments for SKU: ${variantRecord.sku}.`
                      : `Initial inventory balance imported via Excel template for SKU: ${variantRecord.sku}.`,
                  },
                });
              }
            }
          }
        }

        // D. Create a single execution batch summary Audit Log entry
        await tx.auditLog.create({
          data: {
            action: "BULK_IMPORT_PRODUCTS",
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
        message: `Successfully processed ${transactionResult.productsCount} products and configured ${transactionResult.variantsCount} stock item modifications/additions.`,
        status: 201,
        redirectTo: `/${businessSlug}/product_list`
      };

    } catch (error: unknown) {
      console.error("Critical error inside createBulkProductsService execution pipeline:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected error occurred processing your file bulk upload configuration.",
        status: 500,
      };
    }
  }

//GET ALL PRODUCTS SERVICE - FULL DETAIL WITH VARIANTS & IMAGES
static async getAllProductsService(businessId: string): Promise<AppResponse> {
  try {
    // 1. Fetch Products Optimized for List/Grid Views with the new explicit relational schema
    const products = await prisma.product.findMany({
      where: {
        businessId: businessId,
        isDeleted: false, // Soft-delete filter for products
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },

        // ── NEW VARIANT RELATION FETCH ─────────────────
        variants: {
          where: { isDeleted: false }, // Soft-delete filter for individual variants
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            productId: true,
            sku: true,
            barcode: true,
            price: true,     
            costPrice: true,
            stock: true,
            lowStockAlert: true,
            isActive: true,
            sortOrder: true,

            // Fetch images from the new isolated VariantImage table
            images: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                imageUrl: true,
                imageKey: true,
                isPrimary: true,
              },
            },

            // Resolve the many-to-many options link to get actual attributes & values
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
    // Flatten arrays safely to match your structural layout requirements without inner casting bugs
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

        return {
          ...variant,
          variantOptions: flattenedOptions, 
          primaryImage: primaryImage,
          imageUrl: primaryImage ? primaryImage.imageUrl : null, 
        }; 
      }),
    })) as Product[]; // Explicitly type assert the outer mapping array directly

    return { 
      success: true, 
      data: transformedProducts, 
      status: 200 
    } as AppResponse;

  } catch (error: unknown) {
    console.error("GET_ALL_PRODUCTS_ERROR:", error);
    return {success: false, error: "Internal Server Error", status: 500 } as AppResponse;
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
            hasVariant: true, // Run npx prisma generate if this red-lines!
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc", // Properly references VariantImage.sortOrder
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
        sortOrder: "asc", // Sorts variants by their internal layout order
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

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,
        price: Number(variant.price), // Map Decimal to standard JS Number safely
        costPrice: Number(variant.costPrice),
        stock: variant.stock,
        lowStockAlert: variant.lowStockAlert,
        isActive: variant.isActive,
        weight: variant.weight ? Number(variant.weight) : null,
        
        productName: variant.product.name,
        displayName: displayName, 
        description: variant.product.description,
        category: variant.product.category,
        brand: variant.product.brand,
        hasMultipleVariants: variant.product.hasVariant,

        options: options,
        imageUrl: primaryImage ? primaryImage.imageUrl : null,
        images: variant.images,
      };
    });

    return { success: true, data: transformedVariants, status: 200 } as AppResponse;

  } catch (error: unknown) {
    console.error("GET_ALL_PRODUCT_VARIANTS_ERROR:", error);
    return { error: "Internal Server Error", success: false, status: 500 } as AppResponse;
  }
}


//UPDATING PRODUCT


static async  updateProductService(
  productId: string,
  data: ProductFormValues,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {

    const validatedData = productSchema.parse(data);
    // 1. Fetch current database snapshot for comparison
    const currentProduct = await prisma.product.findFirst({
      where: { id: productId, businessId, isDeleted: false },
      include: {
        variants: {
          where: { isDeleted: false },
          include: {
            images: true,
            variantOptions: {
              include: {
                attributeValue: {
                  include: { attribute: true }
                }
              }
            }
          },
        },
      },
    });

    if (!currentProduct) {
      return { error: "Product not found or access denied.", success: false, status: 404 };
    }

    // 2. SKU Uniqueness Verification across the business
    const cleanSkus = validatedData.variants.map((v) => v.sku.trim()).filter(Boolean);
    if (cleanSkus.length > 0) {
      const duplicateSkusCheck = await prisma.productVariant.findMany({
        where: {
          sku: { in: cleanSkus },
          product: { businessId },
          isDeleted: false,
          NOT: { productId: productId }, // Exclude current product variants
        },
        select: { sku: true },
      });

      if (duplicateSkusCheck.length > 0) {
        const structuralDups = duplicateSkusCheck.map((v) => v.sku).join(", ");
        return {
          error: `These SKUs already exist on other products within your inventory: ${structuralDups}`,
          success: false,
          status: 400,
        };
      }
    }

    // Track cloud file images marked for clean up execution post-transaction
    const oldFileKeysToDelete: string[] = [];

    // 3. EXECUTE ACROSS AN ISOLATED TRANSACTION DB CONTEXT
    const result = await prisma.$transaction(async (tx) => {
      
      // ── STEP A: Update Parent Base Product Structure ──
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          baseSku: validatedData.baseSku.trim().toUpperCase(),
          hasVariant: validatedData.hasVariant,
          isActive: validatedData.isActive,
          categoryId: validatedData.categoryId === "none" ? null : validatedData.categoryId,
          brandId: validatedData.brandId === "none" ? null : validatedData.brandId,
        },
      });

      // A lookup map tracking dynamic runtime parameters: "Attribute:Value" -> ValueCuid ID
      const attributeValueMap: Record<string, string> = {};

      // ── STEP B: Re-Evaluate and Upsert Variant Attributes & Values ──
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
            update: { sortOrder: attrRule.sortOrder || 0 },
            create: {
              name: attrRule.name.trim(),
              businessId,
              sortOrder: attrRule.sortOrder || 0,
            },
          });

          // Extract unique tags out of form comma string input split context
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

      // ── STEP C: Process Variant Synchronization Loop ──
      const processedVariantIds: string[] = [];
      const currentVariantMap = new Map(currentProduct.variants.map((v) => [v.id, v]));

      for (const variantData of validatedData.variants) {
        const isExisting = variantData.id && currentVariantMap.has(variantData.id);
        const matchVariant = isExisting ? currentVariantMap.get(variantData.id!) : null;

        // Calculate delta stock deviations for logs tracking
        let stockChange = 0;
        if (matchVariant) {
          stockChange = variantData.stock - matchVariant.stock;
        } else if (variantData.stock > 0) {
          stockChange = variantData.stock;
        }

        // Evaluate image mutation paths if key mismatch is observed
        if (matchVariant?.images?.[0]) {
      
          const mainImg = matchVariant.images.find(i => i.isPrimary) || matchVariant.images[0];
          if (variantData.fileKey && mainImg?.imageKey && variantData.fileKey !== mainImg.imageKey) {
            oldFileKeysToDelete.push(mainImg.imageKey);
          }
        }

        // Build base variant payload structure mapping fields explicit definitions
        const variantPayload = {
          sku: variantData.sku.trim(),
          barcode: variantData.barcode || null,
          price: variantData.price,
          costPrice: variantData.costPrice,
          stock: variantData.stock,
          lowStockAlert: variantData.lowStockAlert ?? 5,
          weight: variantData.weight !== null ? variantData.weight : null,
          length: variantData.length !== null ? variantData.length : null,
          width: variantData.width !== null ? variantData.width : null,
          height: variantData.height !== null ? variantData.height : null,
          sortOrder: variantData.sortOrder || 0,
          isActive: variantData.isActive ?? true,
        };

        let activeVariantId: string;

        if (matchVariant) {
          // Perform isolated update operations
          const updatedVar = await tx.productVariant.update({
            where: { id: matchVariant.id },
            data: variantPayload,
          });
          activeVariantId = updatedVar.id;
          processedVariantIds.push(activeVariantId);
          
          // Wipe old options configurations to refresh matrix bindings cleanly
          await tx.productVariantOption.deleteMany({
            where: { variantId: activeVariantId }
          });
        } else {
          // Run creation execution operations
          const createdVar = await tx.productVariant.create({
            data: {
              ...variantPayload,
              productId: productId,
            },
          });
          activeVariantId = createdVar.id;
          processedVariantIds.push(activeVariantId);
        }

        // Link Images tracking context modifications
        if (variantData.imageUrl) {
          // Purge pre-existing references to eliminate conflicts
          await tx.variantImage.deleteMany({ where: { variantId: activeVariantId } });
          await tx.variantImage.create({
            data: {
              variantId: activeVariantId,
              imageUrl: variantData.imageUrl,
              imageKey: variantData.fileKey || null,
              isPrimary: true,
            },
          });
        }

        // Reconnect updated intermediate structural many-to-many lookup rows
        if (validatedData.hasVariant && variantData.options && variantData.options.length > 0) {
          const junctionEntries = variantData.options
            .map((opt) => {
              const compositeKey = `${opt.attributeName}:${opt.value}`;
              const valId = attributeValueMap[compositeKey];
              return valId ? { variantId: activeVariantId, attributeValueId: valId } : null;
            })
            .filter(Boolean) as { variantId: string; attributeValueId: string }[];

          if (junctionEntries.length > 0) {
            await tx.productVariantOption.createMany({ data: junctionEntries });
          }
        }

        // ── STEP D: Delta Audit Log Logging Updates ──
        if (stockChange !== 0) {
          await tx.stockLog.create({
            data: {
              productVariantId: activeVariantId,
              employeeId,
              businessId,
              change: stockChange,
              reason: `Inventory count synchronized manually during product variant update adjustments.`,
            },
          });
        }
      }

      // ── STEP E: Handle Removal Cascade via Soft Deletes ──
      const activeDbVariantIds = currentProduct.variants.map((v) => v.id);
      const omittedVariantIds = activeDbVariantIds.filter((id) => !processedVariantIds.includes(id));

      if (omittedVariantIds.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: omittedVariantIds } },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }

      // ── STEP F: Log System Changes into History Audits ──
      await tx.auditLog.create({
        data: {
          action: "UPDATE_PRODUCT_WITH_VARIANTS",
          entity: "PRODUCT",
          entityId: productId,
          userId,
          businessId,
          newValue: `Synchronized product specifications and tracked mutations across (${processedVariantIds.length}) variants matrix records.`,
        },
      });

      return updatedProduct;
    });

    // 4. POST-TRANSACTION ASYNC FILE HOUSEKEEPING CLEANUP RUN
    if (oldFileKeysToDelete.length > 0) {
      // Execute outside transactional timeline block bounds preventing delays
      for (const storageKey of oldFileKeysToDelete) {
        try {
          // Replace with your specific UploadThing / Cloudinary execution handler function
          // await deleteUTFile(storageKey);
        } catch (fileErr) {
          console.error(`Non-blocking issue cleaning isolated asset index: ${storageKey}`, fileErr);
        }
      }
    }

    return { success: true, message: "Inventory record matrices reconciled successfully.", product: result, status: 200 };

  } catch (error: unknown) {
    console.error("CRITICAL_PRODUCT_MUTATION_SYNC_ERROR:", error);
    return {
      error: (error as Error).message || "An unresolved exception blocked updating records data structures transaction sets.",
      success: false,
      status: 500,
    };
  }
}



//SOFT DELETE PRODUCT
static async softDeleteSingleProduct(
  productId: string, 
  userId: string, 
  employeeId: string, 
  businessId: string
) {
  try {
    // 1. Fetch the parent product along with its active variants to map the inventory logs
    const currentProduct = await prisma.product.findFirst({
      where: { 
        id: productId, 
        businessId: businessId, 
        isDeleted: false 
      },
      include: {
        variants: {
          where: { isDeleted: false },
          select: { id: true, stock: true, sku: true }
        }
      }
    });

    if (!currentProduct) {
      return { error: "Product not found or has already been removed.", success: false, status: 404 };
    }

    // 2. START ISOLATED TRANSACTION
    await prisma.$transaction(async (tx) => {
      
      // ── STEP A: Reconcile Inventory Ledgers Per SKU ──
      for (const variant of currentProduct.variants) {
        if (variant.stock > 0) {
          await tx.stockLog.create({
            data: {
              productVariantId: variant.id,
              employeeId: employeeId,
              businessId: businessId,
              change: -variant.stock, // Zero out the remaining inventory balances
              reason: `Parent product soft-deleted. Clearing active ledger stock for SKU: ${variant.sku}`,
            }
          });
        }
      }

      // ── STEP B: Soft-delete Child Matrix Variants ──
      await tx.productVariant.updateMany({
        where: { 
          productId: productId, 
          isDeleted: false 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date() 
        }
      });

      // ── STEP C: Soft-delete the Parent Product ──
      // Note: totalStock has been removed here because it's no longer on your Product model schema
      const deletedProduct = await tx.product.update({
        where: { 
          id: productId, 
          businessId: businessId 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date(),
        }
      });

      // ── STEP D: Record Operational Tenant Audits ──
      await tx.auditLog.create({
        data: {
          action: "SOFT_DELETE_PRODUCT_WITH_VARIANTS",
          entity: "PRODUCT",
          entityId: productId,
          userId: userId,
          businessId: businessId,
          newValue: `Soft-deleted product "${deletedProduct.name}" along with (${currentProduct.variants.length}) associated variation SKU records.`
        }
      });
    });

    return { 
      success: true, 
      message: `Product and its variations were successfully marked as deleted.`, 
      status: 200 
    };

  } catch (error: unknown) {
    console.error("PRODUCT_SOFT_DELETE_ERROR:", error);
    
    // Safety guard for Prisma Foreign Key constraint checks (P2003)
    // Even though we soft-delete, if a hard dependency expects an active entity context, catch it here.
    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return { 
        error: "This item cannot be modified due to dependencies across your historical transactions records.", 
        success: false, 
        status: 400 
      };
    }

    return { 
      error: "An unexpected database exception blocked the soft-deletion process.", 
      success: false, 
      status: 500 
    };
  }
}

//SOFT DELETE VARIANT
static async softDeleteSingleVariant(
  variantId: string,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    if (!variantId) {
      return { error: "Variant ID is required", success: false, status: 400 };
    }

    // 1. Fetch the targeted variant and its siblings under the same product
    const variantToKill = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        isDeleted: false,
        product: { businessId: businessId }, // Multi-tenant ownership verification
      },
      include: {
        product: {
          include: {
            variants: { where: { isDeleted: false } }, // Get all active variations
          },
        },
      },
    });

    if (!variantToKill) {
      return { error: "Variant not found or already deleted.", success: false, status: 404 };
    }

    const parentProduct = variantToKill.product;

    // 2. START ISOLATED TRANSACTION
    await prisma.$transaction(async (tx) => {
      
      // STEP A: Reconcile Ledger Balance for this specific SKU
      if (variantToKill.stock > 0) {
        await tx.stockLog.create({
          data: {
            productVariantId: variantToKill.id,
            employeeId: employeeId,
            businessId: businessId,
            change: -variantToKill.stock, // Zero out inventory balance
            reason: `Variant SKU: ${variantToKill.sku} individually soft-deleted. Clearing active ledger stock.`,
          },
        });
      }

      // STEP B: Soft-delete this specific variant
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // STEP C: Edge-Case Handling (The Last Variant Check)
      // If this variant was the ONLY active variant left, soft-delete the parent product too.
      const remainingVariantsCount = parentProduct.variants.filter(v => v.id !== variantId).length;

      if (remainingVariantsCount === 0) {
        await tx.product.update({
          where: { id: parentProduct.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // Log parent deletion audit alongside variant
        await tx.auditLog.create({
          data: {
            action: "SOFT_DELETE_PRODUCT_WITH_VARIANTS",
            entity: "PRODUCT",
            entityId: parentProduct.id,
            userId: userId,
            businessId: businessId,
            newValue: `Automatically soft-deleted parent product "${parentProduct.name}" because its last remaining variation SKU (${variantToKill.sku}) was deleted.`,
          },
        });
      }

      // STEP D: Create System Audit Log for the Variant Removal
      await tx.auditLog.create({
        data: {
          action: "SOFT_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: variantId,
          userId: userId,
          businessId: businessId,
          newValue: `Soft-deleted variant SKU: ${variantToKill.sku} from product: ${parentProduct.name}.`,
        },
      });
    });

    return {
      success: true,
      message: `Variant SKU "${variantToKill.sku}" was successfully removed.`,
      status: 200,
    };

  } catch (error: unknown) {
    console.error("VARIANT_SOFT_DELETE_ERROR:", error);

     if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return {
        error: "This variant has existing historical sales records. Deactivate it instead of deleting it.",
        success: false,
        status: 400,
      };
    }

    return {
      error: "An internal server error occurred while deleting the variation.",
      success: false,
      status: 500,
    };
  }
}

// SOFT BULK- PRODUCT DELETE SERVICE
static async softDeleteBulkProducts(
  ids: string[], 
  userId: string, 
  employeeId: string,
  businessId: string, 
  businessSlug: string 
) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No product IDs provided.", status: 400 };
    }

    // 1. Fetch targeted products along with ALL their currently active variants
    const productsToSoftDelete = await prisma.product.findMany({
      where: { 
        id: { in: ids }, 
        businessId: businessId,
        isDeleted: false
      },
      include: {
        variants: {
          where: { isDeleted: false },
          select: { id: true, stock: true, sku: true }
        }
      }
    });

    if (productsToSoftDelete.length === 0) {
      return { success: false, error: "No active products found to delete.", status: 404 };
    }

    // 2. DATABASE TRANSACTION (Keeps ledger balances and status updates completely atomic)
    await prisma.$transaction(async (tx) => {
      
      const dynamicStockLogs: {
        productVariantId: string;
        employeeId: string;
        businessId: string;
        change: number;
        reason: string;
      }[] = [];

      // A. Scan through all variants to construct zeroing stock balances arrays
      for (const product of productsToSoftDelete) {
        for (const variant of product.variants) {
          if (variant.stock > 0) {
            dynamicStockLogs.push({
              productVariantId: variant.id,
              employeeId: employeeId,
              businessId: businessId,
              change: -variant.stock, // Invert balance to zero out ledger tracking
              reason: `Bulk parent product soft-delete sweep - clearing active warehouse stock for SKU: ${variant.sku}`,
            });
          }
        }
      }

      // Write stock adjustments simultaneously if entries exist
      if (dynamicStockLogs.length > 0) {
        await tx.stockLog.createMany({
          data: dynamicStockLogs,
        });
      }

      // B. Soft-delete all variants tied to these products simultaneously
      await tx.productVariant.updateMany({
        where: { 
          productId: { in: ids },
          isDeleted: false 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date() 
        }
      });

      // C. Soft-delete the Parent Products
      await tx.product.updateMany({
        where: { 
          id: { in: ids }, 
          businessId: businessId 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date(),
        }
      });

      // D. Generate Audit Logs for operational tracking
      await tx.auditLog.createMany({
        data: productsToSoftDelete.map((product) => ({
          action: "BULK_SOFT_DELETE",
          entity: "PRODUCT",
          entityId: product.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk soft-deleted product line "${product.name}" along with (${product.variants.length}) item variation SKUs.`
        })),
      });
    });

    return {
      success: true,
      message: `Successfully soft-deleted ${productsToSoftDelete.length} products and archived their stock metrics.`,
      redirectTo: `/${businessSlug}/product_list`,
      status: 200
    };

  } catch (error: unknown) {
    console.error("BULK_SOFT_DELETE_ERROR:", error);
    
    if (error instanceof Error && 'code' in error && error?.code === 'P2003') {
      return { 
        success: false, 
        error: "Database constraint protection conflict. Consider deactivating these products manually.",
        status: 400
      };
    }
    
    return { success: false, error: "An internal exception blocked archiving these items.", status: 500 };
  }
}


//SOFT DELETE VARIANT - PRODUCT
static async softDeleteBulkProductVariant(
  variantIds: string[],
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return { success: false, error: "No variant IDs provided.", status: 400 };
    }

    // 1. Fetch all targeted variants to confirm multi-tenant ownership and check stock status
    const variantsToSoftDelete = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isDeleted: false,
        product: { businessId: businessId }, // Strict tenant scoping
      },
      select: {
        id: true,
        sku: true,
        stock: true,
        productId: true,
      },
    });

    if (variantsToSoftDelete.length === 0) {
      return { success: false, error: "No active variants found to delete.", status: 404 };
    }

    // Extract the unique product IDs that are affected by this variant purge
    const affectedProductIds = [...new Set(variantsToSoftDelete.map((v) => v.productId))];

    // 2. START DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      
      // A. Reconcile Stock Ledgers for each individual variant SKU
      const stockLogEntries = variantsToSoftDelete
        .filter((v) => v.stock > 0)
        .map((variant) => ({
          productVariantId: variant.id,
          employeeId: employeeId,
          businessId: businessId,
          change: -variant.stock, // Zero out inventory balance
          reason: `Bulk variant soft-delete sweep - clearing active warehouse stock for SKU: ${variant.sku}`,
        }));

      if (stockLogEntries.length > 0) {
        await tx.stockLog.createMany({
          data: stockLogEntries,
        });
      }

      // B. Update the targeted variants to a soft-deleted state
      await tx.productVariant.updateMany({
        where: { id: { in: variantIds } },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // C. System Audit Logs for each deleted variant SKU
      await tx.auditLog.createMany({
        data: variantsToSoftDelete.map((variant) => ({
          action: "SOFT_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: variant.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk soft-deleted variant SKU: ${variant.sku}.`,
        })),
      });

      // D. Edge-Case Handling: Check for empty parent product shells
      // For every affected product, count how many active variants are left in the system
      for (const productId of affectedProductIds) {
        const remainingActiveVariantsCount = await tx.productVariant.count({
          where: {
            productId: productId,
            isDeleted: false,
          },
        });

        // If no active variants remain for this product, soft-delete the parent product too!
        if (remainingActiveVariantsCount === 0) {
          const autoDeletedProduct = await tx.product.update({
            where: { id: productId },
            data: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          });

          // Log the automated parent cascade deletion audit entry
          await tx.auditLog.create({
            data: {
              action: "SOFT_DELETE_PRODUCT_WITH_VARIANTS",
              entity: "PRODUCT",
              entityId: productId,
              userId: userId,
              businessId: businessId,
              newValue: `Automatically archived parent product "${autoDeletedProduct.name}" because all of its variation matrix SKUs were soft-deleted.`,
            },
          });
        }
      }
    });

    return {
      success: true,
      message: `Successfully soft-deleted ${variantsToSoftDelete.length} variations and reconciled local inventory records.`,
      status: 200,
    };

  } catch (error: unknown) {
    console.error("BULK_VARIANT_SOFT_DELETE_ERROR:", error);

    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return {
        success: false,
        error: "Some variants are locked by active transaction histories. Consider deactivating them instead.",
        status: 400,
      };
    }

    return { success: false, error: "An internal database exception blocked bulk archiving these items.", status: 500 };
  }
}

//SINGLE HARD - PRODUCT DELETE 
 static async singleHardProductDelete(
  productId: string,
  userId: string,
  businessId: string
) {
  try {
    if (!productId) {
      return { error: "Product ID is required", success: false, status: 400 };
    }

    // 1. Fetch product with images to collect files for cloud cleanup
    const productToDelete = await prisma.product.findFirst({
      where: { id: productId, businessId },
      include: {
        variants: {
          include: { images: { select: { imageKey: true } } }
        }
      }
    });

    if (!productToDelete) {
      return { error: "Product not found or access denied.", status: 404, success: false };
    }

    // 2. TRANSACTION - Execute downstream purging manually
    const fileKeys = await prisma.$transaction(async (tx) => {
      
      // Step A: Audit Log entry
      await tx.auditLog.create({
        data: {
          action: "HARD_DELETE_PRODUCT",
          entity: "PRODUCT",
          entityId: productId,
          userId,
          businessId,
          newValue: `Permanently hard deleted product "${productToDelete.name}" and all of its variations.`,
        },
      });

      // Step B: Clear all relational child constraints
      await tx.variantImage.deleteMany({ where: { variant: { productId } } });
      await tx.productVariantOption.deleteMany({ where: { variant: { productId } } });
      await tx.productVariant.deleteMany({ where: { productId } });

      // Step C: Delete the Parent Product
      await tx.product.delete({ where: { id: productId } });

      // Step D: Extract files to delete from storage
      const imagesToClear = productToDelete.variants.flatMap(v => v.images.map(img => img.imageKey)).filter(Boolean);
      return [...new Set(imagesToClear)] as string[];
    });

    // 3. Post-transaction asset cleanup
    if (fileKeys.length > 0) {
      await Promise.allSettled(fileKeys.map(key => deleteUTFile(key)));
    }

    return { success: true, message: "Product and structural sub-nodes completely purged.", status: 200 };

  } catch (error: unknown) {
    console.error("HARD_DELETE_PRODUCT_ERROR:", error);
    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return { success: false, error: "Cannot hard delete an item containing sales history. Soft delete or archive it instead.", status: 400 };
    }
    return { success: false, error: "Internal server error during permanent removal.", status: 500 };
  }
}


//HARD SINGLE VARIANT
static async singleHardProductVariantDelete(
  variantId: string,
  userId: string,
  businessId: string
) {
  try {
    if (!variantId) {
      return { error: "Variant ID is required", success: false, status: 400 };
    }

    // 1. Locate variant and check multi-tenant ownership
    const variantToDelete = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        product: { businessId }
      },
      include: {
        images: { select: { imageKey: true } },
        product: { include: { variants: { where: { isDeleted: false } } } }
      }
    });

    if (!variantToDelete) {
      return { error: "Variant not found or access denied.", status: 404, success: false };
    }

    // 2. TRANSACTION
    const fileKeys = await prisma.$transaction(async (tx) => {
      
      // Step A: Log the action
      await tx.auditLog.create({
        data: {
          action: "HARD_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: variantId,
          userId,
          businessId,
          newValue: `Permanently hard deleted variant SKU: ${variantToDelete.sku} from product: ${variantToDelete.product.name}.`,
        },
      });

      // Step B: Purge join tables targeting this variant explicitly
      await tx.variantImage.deleteMany({ where: { variantId } });
      await tx.productVariantOption.deleteMany({ where: { variantId } });
      
      // Step C: Delete the Variant
      await tx.productVariant.delete({ where: { id: variantId } });

      // Step D: Last variant protective shell cleanup check
      const remainingActiveVariants = variantToDelete.product.variants.filter(v => v.id !== variantId).length;
      if (remainingActiveVariants === 0) {
        // If no active variations remain, safely toggle the parent tracking profile
        await tx.product.update({
          where: { id: variantToDelete.productId },
          data: { isDeleted: true, deletedAt: new Date() } // Soft-archive parent so it safely leaves the active list views
        });
      }

      return variantToDelete.images.map(i => i.imageKey).filter(Boolean) as string[];
    });

    // 3. Storage asset cleanup
    if (fileKeys.length > 0) {
      await Promise.allSettled(fileKeys.map(key => deleteUTFile(key)));
    }

    return { success: true, message: `Variant SKU "${variantToDelete.sku}" permanently erased.`, status: 200 };

  } catch (error: unknown) {
    console.error("HARD_DELETE_VARIANT_ERROR:", error);
    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return { success: false, error: "Variant is locked by past invoice logs. Deactivate it instead.", status: 400 };
    }
    return { success: false, error: "Permanent deletion pipeline encountered an exception.", status: 500 };
  }
}

//HARD BULK PRODUCT-VARIANT DELETE 
 static async bulkHardVariantDeleteService(
  variantIds: string[],
  userId: string,
  businessId: string
) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return { success: false, error: "No variant IDs provided.", status: 400 };
    }

    // 1. Gather all active targeted variants to capture unique file keys across multi-tenant bounds
    const variantsToDelete = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { businessId }
      },
      include: {
        images: { select: { imageKey: true } }
      }
    });

    if (variantsToDelete.length === 0) {
      return { success: false, error: "No variations found matching selection params.", status: 404 };
    }

    const affectedProductIds = [...new Set(variantsToDelete.map(v => v.productId))];

    // 2. RUN BULK PURGE TRANSACTION
    const storageKeysToPurge = await prisma.$transaction(async (tx) => {
      
      // Step A: Create Batch System Audit Log tracks
      await tx.auditLog.createMany({
        data: variantsToDelete.map(v => ({
          action: "BULK_HARD_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: v.id,
          userId,
          businessId,
          newValue: `Bulk permanently deleted variant SKU: ${v.sku}.`,
        }))
      });

      // Step B: Wipe all downstream structural relation bindings matching selected IDs
      await tx.variantImage.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.productVariantOption.deleteMany({ where: { variantId: { in: variantIds } } });

      // Step C: Execute structural bulk deletion
      await tx.productVariant.deleteMany({ where: { id: { in: variantIds } } });

      // Step D: Re-evaluate empty parent product matrix states
      for (const prodId of affectedProductIds) {
        // Count how many variations (active or soft-deleted) remain attached
        const totalRemainingVariantsCount = await tx.productVariant.count({
          where: { productId: prodId }
        });

        // If completely empty of physical variant entities, soft-archive parent row to protect history
        if (totalRemainingVariantsCount === 0) {
          await tx.product.update({
            where: { id: prodId },
            data: { isDeleted: true, deletedAt: new Date() }
          });
        }
      }

      // Step E: Consolidate storage tracking links
      const files = variantsToDelete.flatMap(v => v.images.map(img => img.imageKey)).filter(Boolean);
      return [...new Set(files)] as string[];
    });

    // 3. Post-transaction asset cleanup
    if (storageKeysToPurge.length > 0) {
      await Promise.allSettled(storageKeysToPurge.map(key => deleteUTFile(key)));
    }

    return { success: true, message: `Successfully hard deleted ${variantsToDelete.length} variants and swept related resources.`, status: 200 };

  } catch (error: unknown) {
    console.error("BULK_HARD_DELETE_VARIANTS_ERROR:", error);
    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return { success: false, error: "Some variants cannot be permanently deleted because they are referenced in sales invoices.", status: 400 };
    }
    return { success: false, error: "An explicit constraint exception blocked batch deletion workflows.", status: 500 };
  }
}

//HARD BULK - PRODUCT DELETE
static async bulkHardProductDelete(
  ids: string[], 
  userId: string, 
  businessId: string, 
  businessSlug: string 
) {
  try {
    // 1. Fetch products along with their variants and image arrays to capture cloud storage keys
    const productsToDelete = await prisma.product.findMany({
      where: { 
        id: { in: ids }, 
        businessId: businessId 
      },
      include: {
        variants: {
          include: {
            images: {
              select: { imageKey: true }
            }
          }
        }
      }
    });

    if (productsToDelete.length === 0) {
      return { success: false, error: "No products found to delete.", status: 404 };
    }

    // 2. DATABASE TRANSACTION (Order of execution safeguards foreign key cascades)
    const allFileKeys = await prisma.$transaction(async (tx) => {
      
      // A. Create Audit Logs for each targeted product row
      await tx.auditLog.createMany({
        data: productsToDelete.map((product) => ({
          action: "BULK_HARD_DELETE",
          entity: "PRODUCT",
          entityId: product.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk permanently deleted product: ${product.name} with ${product.variants.length} variations.`
        })),
      });

      // B. Purge variant-dependent join records first
      
      // 1. Delete Variant Images associated with these products
      await tx.variantImage.deleteMany({
        where: {
          variant: {
            productId: { in: ids }
          }
        }
      });

      // 2. Delete Variant Option intermediate matrix allocations
      await tx.productVariantOption.deleteMany({
        where: { 
          variant: { 
            productId: { in: ids } 
          } 
        } 
      });

      // 3. Delete the Product Variants
      await tx.productVariant.deleteMany({
        where: { productId: { in: ids } }
      });

      // NOTE: We DO NOT delete VariantAttributes or VariantAttributeValues here.
      // Because they belong to the businessId, deleting them would break other items in the inventory.

      // C. Delete the Parent Product Rows
      await tx.product.deleteMany({
        where: { 
          id: { in: ids }, 
          businessId: businessId 
        },
      });

      // D. Collect all unique file storage keys from the isolated VariantImage collections
      const structuralImageKeys = productsToDelete.flatMap((product) => 
        product.variants.flatMap((variant) => 
          variant.images.map((img) => img.imageKey)
        )
      ).filter(Boolean) as string[];

      // Return a unique array of strings to avoid double-deleting duplicates
      return [...new Set(structuralImageKeys)];
    });

    // 3. CLEAN UP CLOUD STORAGE (COMPREHENSIVE & NON-BLOCKING)
    if (allFileKeys.length > 0) {
      // Promise.allSettled guarantees one bad token link won't cancel the entire array run
      await Promise.allSettled(allFileKeys.map((key) => deleteUTFile(key)));
    }

    return {
      success: true,
      message: `Successfully deleted ${productsToDelete.length} products and cleaned up ${allFileKeys.length} images from storage.`,
      redirectTo: `/${businessSlug}/product_list`,
      status: 200
    };

  } catch (error: unknown) {
    console.error("BULK_DELETE_ERROR:", error);
    
    // Intercept database constraint errors (e.g., product linked to historical sales invoices)
     if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return { 
        success: false, 
        error: "Some selected items have historical sales or active orders recorded and cannot be permanently removed. Try archiving them instead.",
        status: 400
      };
    }
    
    return { success: false, error: "An unexpected system error occurred during bulk deletion.", status: 500 };
  }
}



//SINGLE TOGGLE PRODUCT
static async toggleSingleProductStatus(
  productId: string,
  userId: string,
  businessId: string
) {
  try {
    if (!productId) {
      return { error: "Product ID is required", success: false, status: 400 };
    }

    // 1. Fetch current status
    const product = await prisma.product.findFirst({
      where: { id: productId, businessId, isDeleted: false },
      select: { id: true, name: true, isActive: true },
    });

    if (!product) {
      return { error: "Product not found", success: false, status: 404 };
    }

    const nextStatus = !product.isActive;

    // 2. Update within an atomic block
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { isActive: nextStatus },
      });

      // If disabling the parent product, cascadingly disable all its child variants too
      if (!nextStatus) {
        await tx.productVariant.updateMany({
          where: { productId, isDeleted: false },
          data: { isActive: false },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "TOGGLE_PRODUCT_STATUS",
          entity: "PRODUCT",
          entityId: productId,
          userId,
          businessId,
          newValue: `Toggled product "${product.name}" visibility to ${nextStatus ? "ACTIVE" : "INACTIVE"}.`,
        },
      });

      return updated;
    });

    return { 
      success: true, 
      message: `Product ${updatedProduct.name} is now ${nextStatus ? "active" : "inactive"}.`, 
      isActive: nextStatus,
      status: 200 
    };

  } catch (error) {
    console.error("TOGGLE_PRODUCT_STATUS_ERROR:", error);
    return { error: "Failed to toggle product status", success: false, status: 500 };
  }
}


//SINGLE VARIANT TOGGLE
 static async toggleSingleVariantStatus(
  variantId: string,
  userId: string,
  businessId: string
) {
  try {
    if (!variantId) {
      return { error: "Variant ID is required", success: false, status: 400 };
    }

    // 1. Fetch current variant state and parent context
    const variant = await prisma.productVariant.findFirst({
      where: { 
        id: variantId, 
        isDeleted: false,
        product: { businessId } 
      },
      select: { id: true, sku: true, isActive: true, productId: true },
    });

    if (!variant) {
      return { error: "Variant not found", success: false, status: 404 };
    }

    const nextStatus = !variant.isActive;

    await prisma.$transaction(async (tx) => {
      // Step A: Update the targeted variation status
      await tx.productVariant.update({
        where: { id: variantId },
        data: { isActive: nextStatus },
      });

      // Step B: Hierarchy Intelligence Safecheck
      if (nextStatus) {
        // If a variant is activated, we must force the parent product to be active,
        // otherwise this SKU will remain invisible on the POS front/store catalogs.
        await tx.product.update({
          where: { id: variant.productId },
          data: { isActive: true },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "TOGGLE_VARIANT_STATUS",
          entity: "PRODUCT_VARIANT",
          entityId: variantId,
          userId,
          businessId,
          newValue: `Toggled variant SKU "${variant.sku}" status to ${nextStatus ? "ACTIVE" : "INACTIVE"}.`,
        },
      });
    });

    return { 
      success: true, 
      message: `Variant SKU "${variant.sku}" is now ${nextStatus ? "active" : "inactive"}.`, 
      isActive: nextStatus,
      status: 200 
    };

  } catch (error) {
    console.error("TOGGLE_VARIANT_STATUS_ERROR:", error);
    return { error: "Failed to toggle variant status", success: false, status: 500 };
  }
}

//BULK PRODUCT TOGGLE
static async  toggleBulkProductsStatus(
  productIds: string[],
  userId: string,
  businessId: string,
) {
  try {
    if (!productIds || productIds.length === 0) {
      return { error: "No product IDs provided", success: false, status: 400 };
    }

    // 1. Fetch the ID AND the current status of matching records
    const validProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds }, 
        businessId, 
        isDeleted: false 
      },
      select: { 
        id: true, 
        name: true,
        isActive: true // Critical: determine the current state to flip it
      },
    });

    if (validProducts.length === 0) {
      return { error: "No matching items found", success: false, status: 404 };
    }

    // 2. Separate into activation and deactivation batch tracking buckets
    const idsToActivate: string[] = [];
    const idsToDeactivate: string[] = [];

    validProducts.forEach((product) => {
      if (product.isActive) {
        idsToDeactivate.push(product.id); // Was active, so flip to inactive
      } else {
        idsToActivate.push(product.id);   // Was inactive, so flip to active
      }
    });

    // 3. EXECUTE THE TOGGLE ATOMICALLY
    await prisma.$transaction(async (tx) => {
      
      // Step A: Handle Deactivations (and cascade down to child variants)
      if (idsToDeactivate.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false },
        });

        // Cascadingly deactivate variants if their parent product is turned off
        await tx.productVariant.updateMany({
          where: { productId: { in: idsToDeactivate }, isDeleted: false },
          data: { isActive: false },
        });
      }

      // Step B: Handle Activations
      if (idsToActivate.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: idsToActivate } },
          data: { isActive: true },
        });
        
        // Note: We deliberately do NOT auto-activate all child variants here.
        // It's safer to let merchants explicitly decide which variations are available for sale.
      }

      // Step C: Bulk construct audit logs for tracking transparency
      await tx.auditLog.createMany({
        data: validProducts.map((p) => ({
          action: "BULK_TOGGLE_PRODUCT_STATUS",
          entity: "PRODUCT",
          entityId: p.id,
          userId,
          businessId,
          newValue: `Inverted status configuration. Switched item from ${p.isActive ? "ACTIVE to INACTIVE" : "INACTIVE to ACTIVE"}.`,
        })),
      });
    });

    return { 
      success: true, 
      message: `Successfully processed status toggles for ${validProducts.length} items.`, 
      status: 200 
    };

  } catch (error) {
    console.error("BULK_PRODUCT_TOGGLE_STATUS_ERROR:", error);
    return { error: "Batch status modification failed", success: false, status: 500 };
  }
}


//BULK VARIANT TOGGLE
static async toggleBulkVariantStatus(
  variantIds: string[],
  userId: string,
  businessId: string
) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return { error: "No variant IDs provided", success: false, status: 400 };
    }

    // 1. Fetch cross-tenant valid variant matrices along with their current status
    const validVariants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isDeleted: false,
        product: { businessId },
      },
      select: { 
        id: true, 
        sku: true, 
        productId: true,
        isActive: true // Select current status to handle true toggling
      },
    });

    if (validVariants.length === 0) {
      return { error: "No matching variations located", success: false, status: 404 };
    }

    // 2. Separate into distinct array buckets for bulk processing sequences
    const idsToActivate: string[] = [];
    const idsToDeactivate: string[] = [];
    const parentIdsToForceActivate: string[] = [];

    validVariants.forEach((variant) => {
      if (variant.isActive) {
        idsToDeactivate.push(variant.id); // Active -> Inactive
      } else {
        idsToActivate.push(variant.id);   // Inactive -> Active
        parentIdsToForceActivate.push(variant.productId); // Track parent product to wake it up
      }
    });

    // Deduplicate parent product IDs to optimize database operation
    const uniqueParentIdsToActivate = [...new Set(parentIdsToForceActivate)];

    // 3. TRANSACTION CONTEXT - Batch update based on explicit target states
    await prisma.$transaction(async (tx) => {
      
      // Step A: Handle batch deactivations
      if (idsToDeactivate.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false },
        });
      }

      // Step B: Handle batch activations
      if (idsToActivate.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: idsToActivate } },
          data: { isActive: true },
        });
      }

      // Step C: Hierarchy Intelligence Guard
      // Wake up parent products for any variants that were enabled during this cycle
      if (uniqueParentIdsToActivate.length > 0) {
        await tx.product.updateMany({
          where: { 
            id: { in: uniqueParentIdsToActivate },
            isActive: false // Only affect currently disabled parents to limit row locks
          },
          data: { isActive: true },
        });
      }

      // Step D: Construct fine-grained audit footprint indexes
      await tx.auditLog.createMany({
        data: validVariants.map((v) => ({
          action: "BULK_TOGGLE_VARIANT_STATUS",
          entity: "PRODUCT_VARIANT",
          entityId: v.id,
          userId,
          businessId,
          newValue: `Inverted variant configuration state. Switched SKU "${v.sku}" from ${v.isActive ? "ACTIVE to INACTIVE" : "INACTIVE to ACTIVE"}.`,
        })),
      });
    });

    return { 
      success: true, 
      message: `Successfully toggled status flags across ${validVariants.length} variations.`, 
      status: 200 
    };

  } catch (error) {
    console.error("BULK_VARIANT_TOGGLE_STATUS_ERROR:", error);
    return { error: "Batch modification processing sequence hit an issue", success: false, status: 500 };
  }
}

} 
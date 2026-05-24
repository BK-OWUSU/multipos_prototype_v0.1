// // lib/bulk-import/configs/product-config.ts
// import { z } from 'zod';
// import { BulkImportConfig } from '@/schema/bulkupload.schema';
// import { createBulkProductsAction } from '../actions/business/productsActions';

// export const productCSVSchema = z.object({
//   name: z.string().min(2, "Product name is required"),
//   sku: z.string().optional().nullable(),
//   description: z.string().optional().nullable(),
//   price: z.coerce.number().min(0, "Price must be positive"),
//   costPrice: z.coerce.number().min(0, "Cost price must be positive"),
//   stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
//   lowStockAlert: z.coerce.number().int().min(0).default(5),
//   category: z.string().optional().nullable(),
//   brand: z.string().optional().nullable(),
//   isActive: z
//     .union([z.string(), z.boolean()])
//     .transform((val) => {
//       if (typeof val === 'boolean') return val;
//       return val.toLowerCase() === 'true' || val === '1';
//     })
//     .default(true),
// });

// export type ProductCSVRow = z.infer<typeof productCSVSchema>;
// export const ProductsValidateArray = z.array(productCSVSchema);

// export interface ProductImportPayload {
//   name: string;
//   sku: string | null;
//   description: string | null;
//   price: number;
//   costPrice: number;
//   stock: number;
//   lowStockAlert: number;
//   category: string | null;
//   brand: string | null;
//   isActive: boolean;
// }

// export const productImportConfig: BulkImportConfig<typeof productCSVSchema, ProductImportPayload> = {
//   entityName: 'Product',
//   entityNamePlural: 'Products',
//   schema: productCSVSchema,
//   apiEndpoint: createBulkProductsAction,
//   // apiEndpoint: '/api/products/bulk-import',
  
//   templateHeaders: [
//     'name',
//     'sku',
//     'description',
//     'price',
//     'costPrice',
//     'stock',
//     'lowStockAlert',
//     'category',
//     'brand',
//     'isActive',
//   ],
  
//   templateExample: [
//     'Nike Air Max',
//     'SKU-001',
//     'Premium running shoes',
//     '150.00',
//     '80.00',
//     '50',
//     '10',
//     'null',
//     'null',
//     'true',
//   ],
  
//   transformData: (row: ProductCSVRow): ProductImportPayload => ({
//     name: row.name,
//     sku: row.sku || null,
//     description: row.description || null,
//     price: row.price,
//     costPrice: row.costPrice,
//     stock: row.stock,
//     lowStockAlert: row.lowStockAlert,
//     category: row.category && row.category !== 'none' ? row.category : null,
//     brand: row.brand && row.brand !== 'none' ? row.brand : null,
//     isActive: row.isActive,
//   }),
  
//   validateRow: (row: ProductCSVRow): { valid: boolean; error?: string } => {
//     if (row.price < row.costPrice) {
//       return {
//         valid: false,
//         error: 'Selling price cannot be less than cost price',
//       };
//     }
//     return { valid: true };
//   },
// };


// lib/bulk-import/configs/product-config.ts
import { z } from 'zod';
import { BulkImportConfig } from '@/types/schema/bulkupload.schema';
import { createBulkProductsAction } from '../actions/business/productsActions';

// Updated CSV schema to support variant imports
export const productCSVSchema = z.object({
  // Parent Product Info
  parentName: z.string().min(2, "Product name is required"),
  parentBaseSku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  
  // Variant-Specific Info (THE SOURCE OF TRUTH)
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be positive"),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  
  // Optional: Variant Attributes (for future enhancement)
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  
  isActive: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val.toLowerCase() === 'true' || val === '1';
    })
    .default(true),
});

export type ProductCSVRow = z.infer<typeof productCSVSchema>;
export const ProductsValidateArray = z.array(productCSVSchema);

export interface ProductImportPayload {
  // Parent Product Data
  parentName: string;
  parentBaseSku: string | null;
  description: string | null;
  category: string | null;
  brand: string | null;
  
  // Variant Data
  sku: string;
  barcode: string | null;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
  
  // Optional Attributes
  color: string | null;
  size: string | null;
  material: string | null;
  weight: number | null;
  
  isActive: boolean;
}

export const productImportConfig: BulkImportConfig<typeof productCSVSchema, ProductImportPayload> = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  schema: productCSVSchema,
  apiEndpoint: createBulkProductsAction,
  
  templateHeaders: [
    'parentName',
    'parentBaseSku',
    'description',
    'category',
    'brand',
    'sku',
    'barcode',
    'price',
    'costPrice',
    'stock',
    'lowStockAlert',
    'color',
    'size',
    'material',
    'weight',
    'isActive',
  ],
  
  templateExample: [
    // Example 1: Simple product (no variants, just one SKU)
    ['Coca Cola 500ml', 'COKE', 'Refreshing soda', 'Beverages', 'Coca-Cola', 'COKE-500ML', '123456789', '5.00', '3.00', '100', '10', '', '', '', '0.5', 'true'],
    
    // Example 2: Product with variants (multiple rows, same parent)
    ['Nike T-Shirt', 'NIKE-TEE', 'Premium cotton t-shirt', 'Clothing', 'Nike', 'NIKE-TEE-RED-M', '111111111', '50.00', '30.00', '10', '5', 'Red', 'M', 'Cotton', '0.25', 'true'],
    ['Nike T-Shirt', 'NIKE-TEE', 'Premium cotton t-shirt', 'Clothing', 'Nike', 'NIKE-TEE-RED-L', '222222222', '55.00', '32.00', '5', '5', 'Red', 'L', 'Cotton', '0.28', 'true'],
    ['Nike T-Shirt', 'NIKE-TEE', 'Premium cotton t-shirt', 'Clothing', 'Nike', 'NIKE-TEE-BLUE-M', '333333333', '50.00', '30.00', '8', '5', 'Blue', 'M', 'Cotton', '0.25', 'true'],
  ],
  
  transformData: (row: ProductCSVRow): ProductImportPayload => ({
    parentName: row.parentName,
    parentBaseSku: row.parentBaseSku || null,
    description: row.description || null,
    category: row.category && row.category !== 'none' ? row.category : null,
    brand: row.brand && row.brand !== 'none' ? row.brand : null,
    
    sku: row.sku,
    barcode: row.barcode || null,
    price: row.price,
    costPrice: row.costPrice,
    stock: row.stock,
    lowStockAlert: row.lowStockAlert,
    
    color: row.color || null,
    size: row.size || null,
    material: row.material || null,
    weight: row.weight || null,
    
    isActive: row.isActive,
  }),
  
  validateRow: (row: ProductCSVRow): { valid: boolean; error?: string } => {
    if (row.price < row.costPrice) {
      return {
        valid: false,
        error: `SKU ${row.sku}: Selling price (${row.price}) cannot be less than cost price (${row.costPrice})`,
      };
    }
    
    if (!row.sku || row.sku.trim() === '') {
      return {
        valid: false,
        error: 'Variant SKU is required for every row',
      };
    }
    
    if (!row.parentName || row.parentName.trim() === '') {
      return {
        valid: false,
        error: `SKU ${row.sku}: Parent product name is required`,
      };
    }
    
    return { valid: true };
  },
};
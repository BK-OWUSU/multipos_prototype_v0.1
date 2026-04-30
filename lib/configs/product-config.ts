// lib/bulk-import/configs/product-config.ts
import { z } from 'zod';
import { BulkImportConfig } from '@/schema/bulkupload.schema';

export const productCSVSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be positive"),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  isActive: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val.toLowerCase() === 'true' || val === '1';
    })
    .default(true),
});

export type ProductCSVRow = z.infer<typeof productCSVSchema>;

export interface ProductImportPayload {
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
  categoryId: string | null;
  brandId: string | null;
  isActive: boolean;
}

export const productImportConfig: BulkImportConfig<typeof productCSVSchema> = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  schema: productCSVSchema,
  apiEndpoint: '/api/products/bulk-import',
  
  templateHeaders: [
    'name',
    'sku',
    'description',
    'price',
    'costPrice',
    'stock',
    'lowStockAlert',
    'categoryId',
    'brandId',
    'isActive',
  ],
  
  templateExample: [
    'Nike Air Max',
    'SKU-001',
    'Premium running shoes',
    '150.00',
    '80.00',
    '50',
    '10',
    'category_id_here',
    'brand_id_here',
    'true',
  ],
  
  transformData: (row: ProductCSVRow): ProductImportPayload => ({
    name: row.name,
    sku: row.sku || null,
    description: row.description || null,
    price: row.price,
    costPrice: row.costPrice,
    stock: row.stock,
    lowStockAlert: row.lowStockAlert,
    categoryId: row.categoryId && row.categoryId !== 'none' ? row.categoryId : null,
    brandId: row.brandId && row.brandId !== 'none' ? row.brandId : null,
    isActive: row.isActive,
  }),
  
  validateRow: (row: ProductCSVRow): { valid: boolean; error?: string } => {
    if (row.price < row.costPrice) {
      return {
        valid: false,
        error: 'Selling price cannot be less than cost price',
      };
    }
    return { valid: true };
  },
};
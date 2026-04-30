import { z } from "zod";

export const productSchema = z.object({
  // id: z.string().optional().nullable(),
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  
  // Use min(0) instead of positive() if you want to allow 0.00 temporarily
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative").default(0),
  
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockAlert: z.coerce.number().int().nonnegative().default(5),
  
  categoryId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),
  brandId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),
  discountId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),
  
  // A bit more flexible for empty strings
  imageUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  fileKey: z.string().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});


export type ProductFormValues = z.input<typeof productSchema>;


//Category Schema
export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(), 
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
  fileKey: z.string().optional(), 
});

export type CategoryFormValues = z.infer<typeof categorySchema>;



//BRAND SCHEMA
export const brandSchema = z.object({
  name: z.string().min(2, "Brand name is required"),
  description: z.string().optional(), 
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
  fileKey: z.string().optional(), 
});

export type BrandFormValues = z.infer<typeof brandSchema>;

//DISCOUNT SCHEMA
export const createDiscountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "Value cannot be negative"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CreateDiscountSchema = z.infer<typeof createDiscountSchema>;
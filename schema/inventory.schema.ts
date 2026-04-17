import { z } from "zod";

export const productSchema = z.object({
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

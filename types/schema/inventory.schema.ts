import { z } from "zod";

// ── 1. INDIVIDUAL OPTION VALUE SELECTION ───────────────────
// Maps to: VariantAttributeValue linked through ProductVariantOption
export const variantOptionSchema = z.object({
  attributeName: z.string().min(1, "Attribute name is required"), // e.g., "Color"
  
  // Optional if creating a brand new value on the fly, populated if selecting existing
  attributeValueId: z.string().optional().nullable(), 
  value: z.string().min(1, "Option value is required"), // e.g., "Blue"
});

// ── 2. ROOT ATTRIBUTE RULES DEFINITION ──────────────────────
// Maps to: VariantAttribute
export const productAttributeSchema = z.object({
  id: z.string().optional(), // Existing ID if editing
  name: z.string().min(1, "Attribute name is required (e.g., Size, Color)"),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  matrixSplitValues: z.string().optional().default(""),
});

// ── 3. PRODUCT VARIANT CONFIGURATION (The SKUs) ────────────
// Maps to: ProductVariant & VariantImage
export const productVariantSchema = z.object({
  id: z.string().optional(), // Existing ID if editing
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  barcode: z.string().optional().nullable().transform(v => v === "" ? null : v),
  
  // Coercion automatically converts string form-inputs into floats/ints
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  costPrice: z.coerce.number().min(0, "Cost Price cannot be negative").default(0),
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockAlert: z.coerce.number().int().nonnegative().default(5),
  
  // Physical Dimensions matching database decimals
  weight: z.coerce.number().nonnegative().optional().nullable(), 
  length: z.coerce.number().nonnegative().optional().nullable(), 
  width: z.coerce.number().nonnegative().optional().nullable(), 
  height: z.coerce.number().nonnegative().optional().nullable(),
  
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  
  // Array of selections for this specific variant (e.g., Color: Blue, Size: XL)
  options: z.array(variantOptionSchema).default([]),
  
  // Variant Image link helper fields (maps to VariantImage table on save)
  imageUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  fileKey: z.string().optional().nullable().or(z.literal("")),
});

// ── 4. THE MAIN PRODUCT SCHEMA (The Parent Container) ─────
// Maps to: Product
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional().nullable().transform(v => v === "" ? null : v),
  baseSku: z.string().min(2, "Base SKU prefix is required").toUpperCase(),
  hasVariant: z.boolean().default(false),
  isActive: z.boolean().default(true),
  
  // Clean lookups handling empty dropdown fields
  categoryId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),
  brandId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),

  // Attributes defined once at the root level of the product
  attributes: z.array(productAttributeSchema).default([]), 

  // The collection of configured variation rows
  variants: z.array(productVariantSchema).min(1, "Product must have at least one variant configuration"), 
});
export type ProductFormValues = z.input<typeof productSchema>;


// ── 5. CORE AUXILIARY SCHEMAS (Unchanged) ─────────────────
export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional().nullable(), 
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(), 
});
export type CategoryFormValues = z.input<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().min(2, "Brand name is required"),
  description: z.string().optional().nullable(), 
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(), 
});
export type BrandFormValues = z.input<typeof brandSchema>;

export const createDiscountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "Value cannot be negative"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});
export type CreateDiscountSchema = z.infer<typeof createDiscountSchema>;
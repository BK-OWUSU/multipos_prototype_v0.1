import { Product as PrismaProduct } from "@/generated/prisma/client";

// 1. Core Lookup Interfaces
export interface LookUpField {
  id: string;
  name: string;
}

// 2. Transformed Variant Option Structure
export interface FormattedVariantOption {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
}

// 3. Isolated Variant Image Structure
export interface TransformedVariantImage {
  id: string;
  imageUrl: string;
  imageKey: string | null;
  isPrimary: boolean;
}

// 4. Fully Transformed Child Variant Shape
export interface TransformedProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  price: unknown;          
  costPrice: unknown;      
  stock: number;
  lowStockAlert: number | null;
  isActive: boolean;
  sortOrder: number;
  
  // Custom transformed frontend additions
  images: TransformedVariantImage[];
  variantOptions: FormattedVariantOption[];
  primaryImage: TransformedVariantImage | null;
  imageUrl: string | null;
}

// 5. THE FINAL EXPORTED PRODUCT TYPE
// Extends base schema fields while replacing variants with your clean matrix array
export type Product = Omit<PrismaProduct, 'createdAt' | 'updatedAt'> & {
  category: LookUpField | null;
  brand: LookUpField | null;
  variants: TransformedProductVariant[];
};





export type Brand = {
  id: string;
  name: string;
  businessId: string;
  description?: string | null;
  imageUrl?: string | null;
  fileKey?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  _count?: {
    products: number;
  };
};

// Discount
export type Discount = {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  isActive: boolean;
  startDate: string | Date | null;
  endDate: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

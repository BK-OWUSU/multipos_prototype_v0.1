// Product
export type Product = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  imageUrl: string | null;
  fileKey: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: {
    id: string;
    name: string;
  } | null;
  brand: {
    id: string;
    name: string;
  } | null;
  discount: {
    id: string;
    name: string;
    type: string;
    value: number;
  } | null;
};

// Category
export type  Category = {
  id: string;
  name: string;
  businessId: string; 
  description?: string | null;
  imageUrl?: string | null;
  fileKey?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  // Optional: To track product counts in the table
  _count?: {
    products: number;
  };
}

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

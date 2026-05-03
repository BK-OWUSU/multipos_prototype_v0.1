import { Prisma } from "@/lib/generated/prisma/client";


//Role
export type Role = {
  id: string;
  name: string;
  permissions: string[];
  access: string[];
  businessId: string;
  isSystem: boolean;
  _count?: {
    users: number;
  };
};

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    employee: {
      include: {
        business: true,
        role: true,
        shop: true
      }
    }
  }
}>

//User  
export type User = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    name: string;
    permissions: string[];
    access: string[];
  };
  business: {
    id: string;
    name: string;
    slug: string;
    currencyCode: string;
    currencySymbol: string;
    locale: string;
    countryCode?: string;
  };
  shopId?: string | null;
}

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string | null;
  fileKey: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  designation: string | null;
  hasSystemAccess: boolean;
  isActive: boolean;
  createdAt: Date | string;

  roleId: string;
  shopId: string | null;

  role: {
    id: string;
    name: string;
  };
  
  shop: {
    id: string;
    name: string;
  } | null;

  user: {
    id: string;
    isVerified: boolean;
    needsPasswordChange: boolean;
  } | null; 
};


export type JwtPayload = {
  userId: string;
  businessId: string;
  businessSlug: string;
  employeeId?: string;
  roleName: string;
  firstName: string;
  lastName: string;
  email: string;
  access: string[];
  needsPasswordChange?: boolean;
  shopId?: string;
};

//Token
export type Token = {
  userId: string;
  businessId: string;
  email?: string
}



export type OTPResponse = {
    valid?: boolean;
    message?: string;
    success?: boolean;
    redirectTo?: string;
    error?: string;
    status?: number;
    businessesSlug?: string;
    requiresPasswordChange?: boolean;
}


export type LoginResponse = {
    success?: boolean;
    redirectTo?: string;
    isVerified?: boolean;
    error?: string;
    status: number;
    multipleBusinesses?: boolean;
    requiresPasswordChange?: boolean;
    businesses?: {
        name: string;
        slug: string;
    }[];
}

export type SignUpResponse = {
    success?: boolean;
    redirectTo?: string;
    message?: string;
    error?: string;
    status?: number;
}

export type AppResponse = {
    success?: boolean;
    redirectTo?: string;
    message?: string;
    error?: string;
    status?: number;
}


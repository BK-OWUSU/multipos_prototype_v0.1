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

//Users  
export type User = {
  id: string;
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
  };
}

//Employee  
export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;        // Important: Can they log in?
  isVerified: boolean;      // Important: Have they finished OTP?
  needsPasswordChange: boolean;  // Important: have they reset their password
  createdAt: string | Date;
  role: {
    id: string;
    name: string;
  };
  shop: {
    id: string;
    name: string;
  } | null; // Nullable because some admins might not be tied to one shop
};

// export type EmployeeWithRelations = Prisma.UserGetPayload<{
//    include: {
//     role: true,
//     business: true,
//     shop: true
//    } 
// }>

export type JwtPayload = {
  userId: string;
  businessId: string;
  businessSlug: string;
  roleName: string;
  firstName: string;
  lastName: string;
  email: string;
  access: string[];
  needsPasswordChange: boolean;
};

//Token
export type Token = {
  userId: string;
  businessId: string;
  email?: string
}

export type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        business: true,
        role: true
    }
}>

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


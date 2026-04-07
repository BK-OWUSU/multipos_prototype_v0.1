import { Prisma } from "@/lib/generated/prisma/client";

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

export type JwtPayload = {
  userId: string;
  businessId: string;
  businessSlug: string;
  roleName: string;
  firstName: string;
  lastName: string;
  email: string;
  access: string[];
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
}

export type LoginResponse = {
    success?: boolean;
    redirectTo?: string;
    isVerified?: boolean;
    error?: string;
    status: number;
    multipleBusinesses?: boolean;
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


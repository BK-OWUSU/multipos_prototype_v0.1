import { User, UserWithRelations } from "@/types/auth";

export function mapUserToResponse(user: UserWithRelations): User {
  const emp = user.employee; // Shortening for readability

  return {
    id: user.id,
    employeeId: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,

    role: {
      name: emp.role.name,
      permissions: emp.role.permissions,
      access: emp.role.access,
    },

    business: {
      id: emp.business.id,
      name: emp.business.name,
      slug: emp.business.slug,
      currencyCode: emp.business.currencyCode,
      currencySymbol: emp.business.currencySymbol,
      locale: emp.business.locale,
      countryCode: emp.business.countryCode || undefined,
    },
    
    shopId: emp.shopId,
  };
}
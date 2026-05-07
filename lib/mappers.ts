import { User, UserWithRelations } from "@/types/auth";

export function mapUserToResponse(user: UserWithRelations): User {
  const emp = user.employee;
  const currentSession = user.userSessionLogs?.[0];
  const previousSession = user.userSessionLogs?.[1];
  const shop = user.employee.shop;

  return {
    id: user.id,
    employeeId: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    fullName:  `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    imageUrl: emp.imageUrl,
    fileKey: emp.fileKey,

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
  
    shop: shop 
      ? {
        id: shop.id,
        name: shop.name,
        address: shop.address,
        phone: shop.phone  
      }
      : undefined,

    session: currentSession
      ? {
          currentLoginAt: currentSession.loginAt,
          lastLoginAt: previousSession?.loginAt || null,
          logoutAt: previousSession?.logoutAt || null,
          ipAddress: previousSession?.ipAddress || null,
          userAgent: previousSession?.userAgent || null,
        }
      : undefined,
  };
}

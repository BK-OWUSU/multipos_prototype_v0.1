import { User, UserWithRelations } from "@/types/auth";

export function mapUserToResponse(user: UserWithRelations): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,

    role: {
      name: user.role.name,
      permissions: user.role.permissions,
      access: user.role.access,
    },

    business: {
      id: user.business.id,
      name: user.business.name,
      slug: user.business.slug,
    },
  };
}
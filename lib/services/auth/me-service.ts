import { prisma } from "@/lib/dbHelper";
import { mapUserToResponse } from "@/lib/mappers";
import { UserWithRelations } from "@/types/auth/auth";

export class MeService {
  static async getCurrentUser(userId: string, businessId: string) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { 
          id: userId, 
          employee: { 
            businessId: businessId,
            isActive: true, 
            isDeleted: false
          } 
        },
        include: {
          employee: {
            include: {
              business: true,
              role: true,
              shop: true,
              // Fetch the multi-tenant relation junction records
              assignedShops: {
                include: {
                  shop: true // Pull full shop details out of the join table
                }
              }
            },
          },
          userSessionLogs: {
            orderBy: {
              loginAt: "desc",
            },
            take: 2,
          },
        }
      });

      if (!dbUser || !dbUser.employee) {
        return { success: false, error: "User or Employee record not found", status: 404 };
      }
      
      // Clean, straight cast since the include query perfectly matches UserWithRelations now
      const userData = mapUserToResponse(dbUser as UserWithRelations);
      return { success: true, user: userData, status: 200 };
    } catch (error) {
      console.error("Auth me error:", error);
      return { success: false, error: "Internal Server Error", status: 500 };
    }
  }
}
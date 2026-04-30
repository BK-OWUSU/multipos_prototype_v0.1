import { prisma } from "@/lib/dbHelper";
import { mapUserToResponse } from "@/lib/mappers";
import { UserWithRelations } from "@/types/auth";

export async function getCurrentUser(userId: string, businessId: string) {
    try {
        // Change findUnique to findFirst
        const dbUser = await prisma.user.findFirst({
            where: { 
                id: userId, 
                employee: { 
                    businessId: businessId,
                    isActive: true, // check if the user are still active
                    isDeleted: false
                } 
            },
            include: {
                employee: {
                    include: {
                        business: true,
                        role: true,
                        shop: true
                    }
                }
            }
        });

        if (!dbUser || !dbUser.employee) {
            return { success: false, error: "User or Employee record not found" , status: 404 };
        }
        
        // Use the updated mapper
        const userData = mapUserToResponse(dbUser as UserWithRelations);
        return { success: true, user: userData, status: 200 };
    } catch (error) {
        console.error("Auth me error:", error);
        return { success: false, error: "Internal Server Error", status: 500 };
    }
}
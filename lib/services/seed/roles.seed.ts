import { Prisma, RoleName } from "@/lib/generated/prisma/client";


export async function seedRoles(businessId:string, transaction: Prisma.TransactionClient) {
    const rolesData = [
        { name: RoleName.MANAGER, permissions: ["*"], access: ["pos", "sales_terminal","transactions","invoices"], isSystem:false },
        { name: RoleName.ADMIN, permissions: ["*"], access: ["pos", "sales_terminal","transactions","invoices"], isSystem:false },
        { name: RoleName.CASHIER, permissions: ["process_sales"], access: ["pos", "sales_terminal"], isSystem:false },
        { name: RoleName.CUSTOM_A, permissions: [""], access: [""], isSystem:false },
        { name: RoleName.CUSTOM_B, permissions: [""], access: [""], isSystem:false },
        { name: RoleName.CUSTOM_C, permissions: [""], access: [""], isSystem:false },
    ];

    try {
        for (const roleData of rolesData) {
        await transaction.role.create({
            data: {
                name: roleData.name,
                permissions: roleData.permissions,
                access: roleData.access,
                businessId: businessId,
                isSystem: roleData.isSystem
            }
        });
    }
    } catch (error) {
        console.error("Error seeding roles:", error);
        throw error; // Rethrow to ensure transaction is rolled back
    }
}
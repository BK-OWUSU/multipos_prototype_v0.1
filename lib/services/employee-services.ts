import { AppResponse } from "@/types/auth";
import { prisma } from "@/lib/dbHelper";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { AccountType } from "../generated/prisma/enums";
import { NextRequest } from "next/server";
import { createEmployeeSchema } from "@/schema/auth.schema";
import { generateRandomPassword } from "../utils";
import { hashPassword } from "@/lib/auths";
import { sendTempPasswordEmail } from "@/lib/email";


export async function deleteMultipleUserService(ids: string[], userId: string, businessId: string, businessSlug: string) {
  
    try {
        //Using Transaction
        const usersToDeleteWithFiles = await prisma.$transaction( async(tx)=> {
            const usersToDelete = await tx.user.findMany({
                where: {id: {in: ids}, businessId: businessId} 
            });
            
            //Audit Log Creation
            await tx.auditLog.createMany({
                data: usersToDelete.map((user) => ({
                action: "DELETE",
                entity: "EMPLOYEE",
                entityId: user.id,
                oldValue: JSON.stringify(user),
                userId: userId,
                businessId: businessId,
                })),
            });

            //Employees Deletion

            await tx.user.deleteMany({
                where: {id: {in: usersToDelete.map((u)=> u.id)} , businessId: businessId}
            })

            return usersToDelete
            .map((user)=> user.fileKey)
            .filter((key): key is string => !!key)
        });

        if (usersToDeleteWithFiles.length > 0) {
            await Promise.all(usersToDeleteWithFiles.map((key) => deleteUTFile(key)));
        }

        return {
        success: true,
        message: `Deleted ${ids.length} items and cleaned up storage.`,
        redirectTo: `/${businessSlug}/employees_list`
        } as AppResponse;
        
    } catch (error) {
        console.log("EMPLOYEE BULK_DELETION_ERROR: ", error)
        return {success: false , error: "Could not delete employees. They may have active transaction records."} as AppResponse;
    }
}


export async function toggleBulkEmployeeStatusService(ids: string[], userId: string, businessId: string, businessSlug:string ) {
  try {

    await prisma.$transaction(async (tx) => {
      // 1. Fetch current status of these employee
      const employees = await tx.user.findMany({
        where: { id: { in: ids }, businessId: businessId, accountType: AccountType.EMPLOYEE },
        select: { id: true, isActive: true}
      });

      if (employees.length === 0) throw new Error("No employee found.");

      await Promise.all(
        employees.map((employee) => 
            tx.user.update({
                where: {id: employee.id},
                data: {isActive: !employee.isActive},
            })
        )
    );

      // 3. Audit Log
      await tx.auditLog.createMany({
        data: employees.map((u) => ({
          action: "UPDATE",
          entity: "EMPLOYEE",
          entityId: u.id,
          oldValue: JSON.stringify({ isActive: u.isActive }),
          newValue: JSON.stringify({ isActive: !u.isActive }),
          userId: userId,
          businessId: businessId,
        })),
      });
    });



    return {
      success: true,
      message: `Successfully updated status for ${ids.length} employees.`,
      redirectTo: `/${businessSlug}/employees_list`
    } as AppResponse;
  } catch (error) {
    console.error("BULK_STATUS_EMPLOYEES_ERROR:", error);
    return { success: false, error: "Failed to update employees." } as AppResponse;
  }
}


export async function createEmployee(request: NextRequest, userId : string, businessId: string) {
    try {
 
        const body = await request.json();
        const validatedData = createEmployeeSchema.parse(body);

        //Checking id user already exist or not
        const existingUser = await prisma.user.findFirst({
            where: {
                email: validatedData.email,
                businessId: businessId
            }
        });

        if (existingUser) {
            return { 
                error: "An employee with this email is already registered in your business.", 
                success: false, 
                status: 400 
            } as AppResponse;
        }

        // 1. Generate temp password
        const tempPassword = generateRandomPassword();
        const hashTempPassword = await hashPassword(tempPassword);
        //using transaction to save use details
        const results = await prisma.$transaction(async(transact)=> {
            //Creating user
            const newEmployee = await transact.user.create({
                data: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    email: validatedData.email,
                    phone: validatedData.phone,
                    roleId: validatedData.roleId,
                    shopId: validatedData.shopId || null,
                    password: hashTempPassword,
                    businessId: businessId,
                    isVerified: false, 
                    needsPasswordChange: true,
                }
            });

            //Creating audit logs
            await transact.auditLog.create({
                data: {
                    action: "CREATE_EMPLOYEE",
                    entity: "USER",
                    entityId: newEmployee.id,
                    userId: userId,
                    businessId: businessId,
                }
            })

            //Getting business slug
            const business = await transact.business.findUnique({
                 where: { id: businessId } 
            });

            // Handling case where business somehow isn't found
            if (!business) throw new Error("Business not found");

            return {newEmployee, business};
        }); 
        // End of transaction
        const {newEmployee, business} = results;

        console.log(
            `Name:  ${newEmployee.firstName} || Email:  ${newEmployee.email} || Password: ${tempPassword}`)

        // 2. Send email
        try {
            await sendTempPasswordEmail(
                newEmployee.email, 
                tempPassword, 
                newEmployee.firstName,
                business.slug
            );   
        } catch (err) {
            console.error("Email sending failed:", err);
        }

        return { 
            success: true, 
            message: `Employee ${newEmployee.firstName} created and email sent`, 
            status: 200
        } as AppResponse

    } catch (error: unknown) {
        console.error("Employee registration error:", error);
    }

    return { 
        error: "Internal Server Error", 
        success: false, 
        status: 500 
    } as AppResponse
}


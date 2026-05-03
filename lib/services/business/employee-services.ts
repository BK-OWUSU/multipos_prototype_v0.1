import { AppResponse } from "@/types/auth";
import { prisma } from "@/lib/dbHelper";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { AccountType } from "@/lib/generated/prisma/enums";
import { NextRequest } from "next/server";
import { createEmployeeSchema } from "@/schema/auth.schema";
import { generateRandomPassword } from "@/lib/utils";
import { hashPassword } from "@/lib/auths";
import { sendTempPasswordEmail } from "@/lib/email";
import { EmployeeValidatedArray, EmployeeImportPayload } from "@/lib/configs/employee-config";
import { UserCreateManyInput } from "@/lib/generated/prisma/models";

export async function createEmployee(request: NextRequest, userId: string, employeeId: string, businessId: string) {
    try {
        const body = await request.json();
        const validatedData = createEmployeeSchema.parse(body);

        // Verify if employee already exists in this business
        const existingEmployee = await prisma.employee.findUnique({
            where: {
                email_businessId: {
                    email: validatedData.email,
                    businessId: businessId
                }
            }
        });

        if (existingEmployee) {
            return { 
                error: "This email is already registered to an employee in your business.", 
                success: false, 
                status: 400 
            } as AppResponse;
        }

        const tempPassword = generateRandomPassword();
        const hashed = await hashPassword(tempPassword);

        const {employee, businessSlug} = await prisma.$transaction(async (tx) => {
            const employee = await tx.employee.create({
                data: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    email: validatedData.email,
                    phone: validatedData.phone,
                    imageUrl: validatedData.imageUrl || null,
                    fileKey: validatedData.fileKey || null,
                    designation: validatedData.designation || null,
                    address: validatedData.address || null,
                    dateOfBirth: validatedData.dateOfBirth || null,
                    roleId: validatedData.roleId,
                    shopId: validatedData.shopId || null,
                    businessId: businessId,
                    hasSystemAccess: false, // Defaulting to false
                }
            });

            // 2. ONLY create a User record if system access is granted
            let newUser = null;
            if (validatedData.hasSystemAccess) {
                newUser = await tx.user.create({
                data: {
                    employeeId: employee.id, // Linking back to Employee
                    password: hashed,
                    isVerified: false,
                    accountType: AccountType.EMPLOYEE,
                    needsPasswordChange: true,
                    accessGrantedBy: employeeId,
                    accessGrantedAt: new Date(),
                    createdAt: new Date(),
                },
                });

                await prisma.employee.update({
                    where: { id: employee.id },
                    data: { hasSystemAccess: true }
                });
            }

            await tx.auditLog.create({
                data: {
                    action: "CREATE_EMPLOYEE",
                    entity: "EMPLOYEE",
                    entityId: employee.id,
                    userId: userId,
                    businessId: businessId,
                }
            });
            
            const business = await tx.business.findUnique({ where: { id: businessId } });
            if (!business) throw new Error("Business not found");

            return {employee, businessSlug: business.slug, newUser};
        });

        if (validatedData.hasSystemAccess) {
            //Sending onboarding email
            try {
                await sendTempPasswordEmail(
                    employee.email, 
                    tempPassword, 
                    employee.firstName,
                    businessSlug
                );
            } catch (err) {
                console.error("Email sending failed:", err);
            }
        }

        return { 
            success: true, 
            message: validatedData.hasSystemAccess ? 
            `Employee ${employee.firstName} created successfully and Onboarding email sent!` : 
            `Employee ${employee.firstName} created successfully!`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Employee registration error:", error);
        return { error: "Internal Server Error", success: false, status: 500 } as AppResponse;
    }
}


export async function createBulkEmployeesService(
  payload: { data: EmployeeImportPayload[]; [key: string]: unknown },
  userId: string,
  employeeId: string,
  businessId: string,
  businessSlug: string
) {
  try {
    // 1. Validating the incoming data array first
    const validatedData = EmployeeValidatedArray.parse(payload.data);

    if (validatedData.length === 0) {
      return { error: "No employee data provided.", success: false, status: 400 } as AppResponse;
    }

    // 1. Collecting unique Role and Shop names from the CSV data
    const roleNamesToLookup = [...new Set(validatedData.map((emp) => emp.role))];
    const shopNamesToLookup = [...new Set(validatedData.map(e => e.shop).filter(Boolean))];

    // 2. Batch fetch Roles AND Shops using Names
    const [rolesInDb, shopsInDb] = await Promise.all([
    prisma.role.findMany({
        where: { 
            businessId, 
            name: { in: roleNamesToLookup as string[] } 
        },
        select: { id: true, name: true },
    }),
    prisma.shop.findMany({
        where: { 
            businessId, 
            name: { in: shopNamesToLookup as string[] } // Looking up by NAME
        },
        select: { id: true, name: true },
    })
    ]);
    
    
    // 3. Create Lookup Maps
    const roleMap = new Map(rolesInDb.map((r) => [r.name, r.id]));
    const shopMap = new Map(shopsInDb.map((s) => [s.name, s.id]));
    
    // 5. Check for existing emails in this business to prevent unique constraint errors
    const existingEmails = await prisma.employee.findMany({
      where: {
        businessId: businessId,
        email: { in: validatedData.map((emp) => emp.email) },
      },
      select: { email: true },
    });

    const existingEmailSet = new Set(existingEmails.map((e) => e.email));
  

    // 4. Transform validated data
    const newEmployeesData = validatedData
    .filter((emp) => !existingEmailSet.has(emp.email))
    .map((emp) => {
        const roleIdFromName = roleMap.get(emp.role);
        // Find the Shop ID based on the Name provided in the CSV
        // We use .get(emp.shop) to find the UUID linked to that name
        const shopIdFromName = (emp.shop && emp.shop !== "" && emp.shop !== "null") ? shopMap.get(emp.shop) : null;
        if (!roleIdFromName) {
        throw new Error(`Role "${emp.role}" does not exist in this business.`);
        }
        // Optional: Throw error if shop name was provided but not found in DB
        // if (emp.shop && !shopIdFromName) {
        //     console.log(`Shop "${emp.shop}" not found. Please check the spelling.`);
        //     throw new Error(`Shop "${emp.shop}" not found. Please check the spelling.`);
        // }

        return {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone || null,
        designation: emp.designation || null,
        address: emp.address || null,
        dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : null,
        businessId: businessId,
        roleId: roleIdFromName,
        shopId: shopIdFromName,
        hasSystemAccess: emp.hasSystemAccess || false, 
        };
    });

    if (newEmployeesData.length === 0) {
      return { 
        error: "All provided employees already exist or have invalid roles.", 
        success: false, 
        status: 400 
      } as AppResponse;
    }
  
    const employeesWithAccess = newEmployeesData.filter(emp => emp.hasSystemAccess);
    const UserAccountsRequests = await Promise.all(employeesWithAccess.map(async (emp) => {
        const tempPassword = generateRandomPassword();
        const hashed = await hashPassword(tempPassword);
        return {
            password: hashed,
            firstName: emp.firstName,
            email: emp.email,
            tempPassword
        };
    }));

    // 5. Execute Transaction: Insert Employees and Create Audit Logs
    const result = await prisma.$transaction(async (tx) => {
      // Bulk Insert
      const createdEmployees = await tx.employee.createManyAndReturn({
        data: newEmployeesData,
        skipDuplicates: true,
      });

      // Create Audit Logs
      await tx.auditLog.createMany({
        data: createdEmployees.map((emp) => ({
          action: "CREATE_EMPLOYEE",
          entity: "EMPLOYEE",
          entityId: emp.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk imported: ${emp.firstName} ${emp.lastName} as ${emp.roleId}`,
        })),
      });

        // Create a Map of Email -> EmployeeID for reliable lookup
        const emailToIdMap = new Map(createdEmployees.map(e => [e.email, e.id]));
        // Standard Audit Logs for the import
        await tx.auditLog.createMany({
            data: createdEmployees.map((emp) => ({
            action: "CREATE_EMPLOYEE",
            entity: "EMPLOYEE",
            entityId: emp.id,
            userId: userId, 
            businessId: businessId,
            newValue: `Bulk imported staff`,
            })),
        });

    
    type UserCreateManyInputWithoutID = Omit<UserCreateManyInput, "id">;

    if (UserAccountsRequests.length > 0) {
    // 6. Create User records using the Email-to-ID Map (SAFE)
    const userData = UserAccountsRequests.map((req) => {
      const empId = emailToIdMap.get(req.email);
      if (!empId) return null;

      return {
        employeeId: empId,
        password: req.password,
        needsPasswordChange: true,
        isVerified: false,
        accessGrantedBy: employeeId, 
        accessGrantedAt: new Date(),
      };
    }).filter(Boolean) as UserCreateManyInputWithoutID[];


    await tx.user.createMany({ data: userData });

    // 7. Updating Employee hasSystemAccess status
    const employeeIdsToUpdate = userData.map(u => u.employeeId);
    await tx.employee.updateMany({
      where: { id: { in: employeeIdsToUpdate } },
      data: { hasSystemAccess: true }
    });

    // 8. Log Access Grants
    await tx.auditLog.createMany({
      data: employeeIdsToUpdate.map(id => ({
        action: "GRANT_ACCESS_BULK",
        entity: "USER",
        entityId: id,
        userId: userId,
        businessId: businessId,
        newValue: `System access granted via bulk import.`
      }))
    });
  }
   //     // 4. Send Emails (Asynchronous)
    //     // In a real production app, you'd use a Queue (like BullMQ)
    return createdEmployees;
});

    Promise.allSettled(UserAccountsRequests.map(req => 
        sendTempPasswordEmail(req.email, req.tempPassword, req.firstName, businessSlug)
    )).catch(err => console.error("Bulk Email Error:", err));

    return {
      success: true,
      message: UserAccountsRequests.length > 0 ? 
        `Successfully imported ${result.length} employees. Accounts created and emails sent to ${UserAccountsRequests.length} employees.` :
        `Successfully imported ${result.length} employees.`,
      status: 200,
      redirectTo: `/${businessSlug}/employees_list`,
    } as AppResponse;

  } catch (error: unknown) {
    console.error("BULK_EMPLOYEE_IMPORT_ERROR:", error);
    if (error instanceof Error) {
        return { error: error.message, success: false, status: 400 } as AppResponse;
    }
    return { error: "Failed to import employees. Check your file format.", success: false, status: 500 } as AppResponse;
  }
}

//GET EMPLOYEES SERVICE
export async function getAllEmployeesService(businessId: string, userId: string, employeeId: string) {
    try {
        const employees = await prisma.employee.findMany({
            where: {
                businessId: businessId,
                isDeleted: false,
                // Use AND with NOT to ensure we exclude based on multiple specific criteria
                AND: [
                    {
                        NOT: { id: employeeId } // Exclude the specific Employee record of the requester
                    },
                    {
                        NOT: {
                            user: {
                                id: userId,
                                accountType: AccountType.OWNER
                            }
                        }
                    }
                ]
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        isVerified: true,
                        needsPasswordChange: true,
                        accountType: true, 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { 
            success: true, 
            employees 
        };

    } catch (error) {
        console.error("GET_EMPLOYEES_SERVICE_ERROR:", error);
        return { 
            success: false, 
            error: "Failed to fetch employees list" 
        };
    }
}


export async function hardDeleteMultipleUserService(ids: string[], userId: string, businessId: string, businessSlug: string) {
  
    try {
        //Using Transaction
        const employeesToDeleteWithFiles = await prisma.$transaction( async(tx)=> {
            const employeesToDeleteWithFiles = await tx.employee.findMany({
                where: {id: {in: ids}, businessId: businessId} 
            });
            
            //Audit Log Creation
            await tx.auditLog.createMany({
                data: employeesToDeleteWithFiles.map((employee) => ({
                action: "DELETE",
                entity: "EMPLOYEE",
                entityId: employee.id,
                oldValue: JSON.stringify(employee),
                userId: userId,
                businessId: businessId,
                })),
            });

            //Employees Deletion
            await tx.employee.deleteMany({
                where: {id: {in: employeesToDeleteWithFiles.map((e)=> e.id)} , businessId: businessId}
            })

            return employeesToDeleteWithFiles
            .map((employee)=> employee.fileKey)
            .filter((key): key is string => !!key)
        });

        if (employeesToDeleteWithFiles.length > 0) {
            await Promise.all(employeesToDeleteWithFiles.map((key) => deleteUTFile(key)));
        }

        return {
        success: true,
        message: `Deleted ${ids.length} items and cleaned up storage.`,
        redirectTo: `/${businessSlug}/employees_list`
        } as AppResponse;
        
    } catch (error) {
        console.log("EMPLOYEE BULK_HARD_DELETION_ERROR: ", error)
        return {success: false , error: "Could not delete employees. They may have active transaction records."} as AppResponse;
    }
}

//Soft Delete
export async function softDeleteMultipleUserService(ids: string[], userId: string, businessId: string, businessSlug: string) {
  
    try {
        //Using Transaction
         await prisma.$transaction( async(tx)=> {
            const employeesToDeleteWithFiles = await tx.employee.findMany({
                where: {id: {in: ids}, businessId: businessId} 
            });
            
            //Audit Log Creation
            await tx.auditLog.createMany({
                data: employeesToDeleteWithFiles.map((employee) => ({
                action: "DELETE",
                entity: "EMPLOYEE",
                entityId: employee.id,
                oldValue: JSON.stringify(employee),
                userId: userId,
                businessId: businessId,
                })),
            });

            //Employees Deletion
            await Promise.all(
                employeesToDeleteWithFiles.map((employee) => 
                    tx.employee.update({
                        where: {id: employee.id},
                        data: {isDeleted: true},
                    })
                )
            )
            return employeesToDeleteWithFiles;
        });

        return {
        success: true,
        message: `Deleted ${ids.length} employees and cleaned up storage.`,
        redirectTo: `/${businessSlug}/employees_list`
        } as AppResponse;
        
    } catch (error) {
        console.log("EMPLOYEE BULK_SOFT_DELETION_ERROR: ", error)
        return {success: false , error: "Could not delete employees. They may have active transaction records."} as AppResponse;
    }
}


export async function toggleBulkEmployeeStatusService(ids: string[], userId: string, businessId: string, businessSlug:string ) {
  try {

    await prisma.$transaction(async (tx) => {
      // 1. Fetch current status of these employee
      const employees = await tx.employee.findMany({
        where: { id: { in: ids }, businessId: businessId, user:{accountType: AccountType.EMPLOYEE}},
        select: { id: true, isActive: true}
      });

      if (employees.length === 0) throw new Error("No employee found.");

      await Promise.all(
        employees.map((employee) => 
            tx.employee.update({
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



export async function grantEmployeeSystemAccess(empId: string, userId: string, employeeId: string, businessId: string, businessSlug: string) {
    try {
        const tempPassword = generateRandomPassword();
        const hashTempPassword = await hashPassword(tempPassword);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch employee and business slug
            const employee = await tx.employee.findFirst({
                where: { id: empId, businessId: businessId },
                include: { business: true, user: true }
            });

            if (!employee) throw new Error("Employee not found.");

            if (employee.user) throw new Error("This employee already has system access.");

            // 2. Create the User record
            const newUser = await tx.user.create({
                data: {
                    employeeId: employee.id,
                    password: hashTempPassword,
                    accountType: AccountType.EMPLOYEE,
                    needsPasswordChange: true,
                    isVerified: false,
                    accessGrantedBy: employeeId, // The employee performing the action
                    accessGrantedAt: new Date(),
                    createdAt: new Date(),
                }
            });

            // 3. Update the Employee status flag
            await tx.employee.update({
                where: { id: empId },
                data: { hasSystemAccess: true }
            });

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    action: "GRANT_ACCESS",
                    entity: "USER",
                    entityId: newUser.id,
                    userId: userId,
                    businessId: businessId,
                    newValue: "System access granted to employee"
                }
            });

            return { employee};
        });

        // 5. Send onboarding email
        try {
            await sendTempPasswordEmail(
                result.employee.email, 
                tempPassword, 
                result.employee.firstName,
                businessSlug
            );
        } catch (err) {
            console.error("Email sending failed:", err);
            // We don't throw here because the DB record is already created successfully
        }

        return { 
            success: true, 
            message: `Access granted to ${result.employee.firstName}. Credentials sent to email.`,
            redirectTo: `/${businessSlug}/employees_list`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Grant access error:", error);
        return { success: false, error: (error as Error).message || "Failed to grant access.", status: 400 } as AppResponse;
    }
}


export async function revokeEmployeeSystemAccess(empId: string, userId: string, businessId: string, businessSlug: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Verify employee exists and has a user account
            const employee = await tx.employee.findFirst({
                where: { id: empId, businessId: businessId },
                include: { user: true }
            });

            if (!employee) throw new Error("Employee not found.");
            if (!employee.user) throw new Error("This employee does not have system access.");

            // 2. Delete the User record (This kills their ability to log in)
            await tx.user.delete({
                where: { employeeId: empId }
            });

            // 3. Update the Employee flag
            await tx.employee.update({
                where: { id: empId },
                data: { hasSystemAccess: false }
            });

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    action: "REVOKE_ACCESS",
                    entity: "EMPLOYEE",
                    entityId: empId,
                    userId: userId,
                    businessId: businessId,
                    newValue: "System access revoked; user record deleted."
                }
            });
        });

        return { 
            success: true, 
            message: "Access revoked successfully. The employee can no longer log in.",
            redirectTo: `/${businessSlug}/employees_list`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Revoke access error:", error);
        return { success: false, error: (error as Error).message || "Failed to revoke access.", status: 400 } as AppResponse;
    }
}


export async function grantBulkEmployeesSystemAccess(employeeIds: string[], userId: string, employeeId: string, businessId: string) {
    try {
        if (!employeeIds || employeeIds.length === 0) {
            return { error: "No employees selected.", success: false, status: 400 } as AppResponse;
        }

        // 1. Fetch all eligible employees in one query
        const employees = await prisma.employee.findMany({
            where: { 
                id: { in: employeeIds }, 
                businessId: businessId,
                user: null // Only those who don't already have an account
            },
            include: { business: true }
        });

        if (employees.length === 0) {
            return { error: "Selected employees already have accounts or do not exist.", success: false, status: 400 } as AppResponse;
        }

        const businessSlug = employees[0].business.slug;

        // 2. Preparing User data and Passwords
        // We map through to generate unique passwords for each
        const accountRequests = await Promise.all(employees.map(async (emp) => {
            const tempPassword = generateRandomPassword();
            const hashed = await hashPassword(tempPassword);
            return {
                employeeId: emp.id,
                password: hashed,
                firstName: emp.firstName,
                email: emp.email,
                tempPassword // Store temporarily to send in email after transaction
            };
        }));

        // 3. Executing DB updates in a Transaction
        await prisma.$transaction(async (tx) => {
            // Create User records
            await tx.user.createMany({
                data: accountRequests.map(req => ({
                    employeeId: req.employeeId,
                    password: req.password,
                    needsPasswordChange: true,
                    isVerified: false,
                    accessGrantedBy: employeeId, // The employee performing the action
                    accessGrantedAt: new Date(),
                    createdAt: new Date(),
                }))
            });

            // Mark Employees as having system access
            await tx.employee.updateMany({
                where: { id: { in: employees.map(e => e.id) } },
                data: { hasSystemAccess: true }
            });

            // Create Audit Logs
            await tx.auditLog.createMany({
                data: employees.map(emp => ({
                    action: "GRANT_ACCESS_BULK",
                    entity: "USER",
                    entityId: emp.id,
                    userId: userId,
                    businessId: businessId,
                    newValue: `System access granted via bulk action.`
                }))
            });
        });

        // 4. Send Emails (Asynchronous)
        // In a real production app, you'd use a Queue (like BullMQ)
        Promise.allSettled(accountRequests.map(req => 
            sendTempPasswordEmail(req.email, req.tempPassword, req.firstName, businessSlug)
        )).catch(err => console.error("Bulk Email Error:", err));

        return { 
            success: true, 
            message: `Successfully created accounts and sent emails to ${accountRequests.length} employees.`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("BULK_ACCESS_GRANT_ERROR:", error);
        return { error: "Internal Server Error during bulk grant.", success: false, status: 500 } as AppResponse;
    }
}

export async function revokeBulkEmployeesSystemAccess(employeeIds: string[], userId: string, businessId: string) {
    try {
        if (!employeeIds || employeeIds.length === 0) {
            return { error: "No employees selected.", success: false, status: 400 } as AppResponse;
        }

        await prisma.$transaction(async (tx) => {
            // 1. Verify that these employees belong to this business and have accounts
            const employeesToRevoke = await tx.employee.findMany({
                where: { 
                    id: { in: employeeIds }, 
                    businessId: businessId,
                    hasSystemAccess: true 
                },
                select: { id: true, firstName: true, lastName: true }
            });

            if (employeesToRevoke.length === 0) {
                throw new Error("None of the selected employees have active system access.");
            }

            const validIds = employeesToRevoke.map(emp => emp.id);

            // 2. Delete the User records (The Login Credentials)
            // Note: Our schema uses employeeId as the link
            await tx.user.deleteMany({
                where: { employeeId: { in: validIds } }
            });

            // 3. Update the Employee flags back to false
            await tx.employee.updateMany({
                where: { id: { in: validIds } },
                data: { hasSystemAccess: false }
            });

            // 4. Create Audit Logs for the bulk action
            await tx.auditLog.createMany({
                data: employeesToRevoke.map(emp => ({
                    action: "REVOKE_ACCESS_BULK",
                    entity: "EMPLOYEE",
                    entityId: emp.id,
                    userId: userId,
                    businessId: businessId,
                    newValue: `System access revoked via bulk action by admin.`
                }))
            });
        });

        return { 
            success: true, 
            message: `Successfully revoked access for ${employeeIds.length} employees.`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("BULK_ACCESS_REVOKE_ERROR:", error);
        return { 
            success: false, 
            error: (error as Error).message || "Failed to revoke access in bulk.", 
            status: 400 
        } as AppResponse;
    }
}
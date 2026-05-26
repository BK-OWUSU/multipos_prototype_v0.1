import { CustomerImportPayload, CustomerValidatedArray } from "@/lib/configs/customer-config";
import { prisma } from "@/lib/dbHelper";
import { CreateCustomerSchema, createCustomerSchema } from "@/types/schema/auth.schema";
import { AppResponse } from "@/types/auth/auth";


export class CustomerService {
    static async createCustomer(data: CreateCustomerSchema, userId: string, businessId: string, businessSlug: string) {
        try {
            const validatedData = createCustomerSchema.parse(data);

        // 1. Check for duplicates (Phone or Email) within this business
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                businessId: businessId,
                isDeleted: false,
                OR: [
                    validatedData.email ? { email: validatedData.email } : {},
                    validatedData.phone ? { phone: validatedData.phone } : {},
                ].filter(condition => Object.keys(condition).length > 0)
            }
        });

        if (existingCustomer) {
            return { 
                error: "A customer with this email or phone number already exists.", 
                success: false, 
                status: 400 
            } as AppResponse;
        }

        const result = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    email: validatedData.email || null,
                    phone: validatedData.phone || null,
                    address: validatedData.address || null,
                    isCreditCustomer: validatedData.isCreditCustomer || false,
                    creditLimit: validatedData.creditLimit || 0,
                    registeredAtShopId: validatedData.registeredAtShopId || null,
                    businessId: businessId,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE_CUSTOMER",
                    entity: "CUSTOMER",
                    entityId: customer.id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return customer;
        });

        return { 
            success: true, 
            message: `Customer ${result.firstName} registered successfully!`, 
            redirectTo: `/${businessSlug}/customer_base`,
            status: 200, 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Customer registration error:", error);
        return { error: "Internal Server Error", success: false, status: 500 } as AppResponse;
    }
}

//CREATE BULK CUSTOMERS 
static async createBulkCustomersService(
    payload: { data: CustomerImportPayload[]; [key: string]: unknown },
    userId: string,
    businessId: string,
    businessSlug: string
) {
    try {
        const validatedData = CustomerValidatedArray.parse(payload.data);

        if (validatedData.length === 0) {
            return { error: "No customer data provided.", success: false, status: 400 } as AppResponse;
        }

        // 1. Lookup unique shop names from the data
        const shopNamesToLookup = [...new Set(validatedData.map(e => e.shop).filter(Boolean))];
        const shopsInDb = await prisma.shop.findMany({
            where: { 
                businessId, 
                name: { in: shopNamesToLookup as string[] } 
            },
            select: { id: true, name: true },
        });
        const shopMap = new Map(shopsInDb.map((s) => [s.name.toLowerCase(), s.id]));

        // 2. Fetch existing identifiers to avoid unique constraint crashes
        const existingEntries = await prisma.customer.findMany({
            where: {
                businessId: businessId,
                isDeleted: false,
                OR: [
                    { email: { in: validatedData.map(c => c.email).filter(Boolean) as string[] } },
                    { phone: { in: validatedData.map(c => c.phone).filter(Boolean) as string[] } }
                ]
            },
            select: { email: true, phone: true }
        });

        const existingEmails = new Set(existingEntries.map(e => e.email?.toLowerCase()));
        const existingPhones = new Set(existingEntries.map(e => e.phone));

        // 3. Filter and Transform
        const newCustomersData = validatedData
            .filter(cust => {
                const emailExists = cust.email && existingEmails.has(cust.email.toLowerCase());
                const phoneExists = cust.phone && existingPhones.has(cust.phone);
                return !emailExists && !phoneExists;
            })
            .map(cust => ({
                firstName: cust.firstName,
                lastName: cust.lastName,
                email: cust.email || null,
                phone: cust.phone || null,
                address: cust.address || null,
                firstVisit: cust.firstVisit,
                lastVisit: cust.lastVisit,
                totalVisit: cust.totalVisit || 0,
                isCreditCustomer: cust.isCreditCustomer || false,
                creditLimit: cust.creditLimit || 0,
                businessId: businessId,
                registeredAtShopId: cust.shop ? shopMap.get(cust.shop.toLowerCase()) : null,
            }));

        if (newCustomersData.length === 0) {
            return { 
                error: "All customers in the file already exist in the database.", 
                success: false, 
                status: 400 
            } as AppResponse;
        }

        // 4. Transactional Bulk Insert
        const count = await prisma.$transaction(async (tx) => {
            const created = await tx.customer.createManyAndReturn({
                data: newCustomersData,
                skipDuplicates: true,
            });

            await tx.auditLog.createMany({
                data: created.map((cust) => ({
                    action: "CREATE_CUSTOMER_BULK",
                    entity: "CUSTOMER",
                    entityId: cust.id,
                    userId: userId,
                    businessId: businessId,
                    newValue: `Bulk imported customer: ${cust.firstName} ${cust.lastName}`,
                })),
            });

            return created.length;
        });

        return {
            success: true,
            message: `Successfully imported ${count} customers.`,
            status: 200,
            redirectTo: `/${businessSlug}/customer_base`,
        } as AppResponse;

    } catch (error: unknown) {
        console.error("BULK_CUSTOMER_IMPORT_ERROR:", error);
        return { 
            error: error instanceof Error ? error.message : "Failed to import customers.", 
            success: false, 
            status: 500 
        } as AppResponse;
    }
}

//FETCH ALL CUSTOMERS
static async getCustomers(businessId: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        businessId: businessId,
        isDeleted: false,
      },
      // Sorting by most recently created
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        registeredAtShop: {
          select: {
            id: true,
            name: true,
          }
        },
        loyalty: true, // Fetches the entire loyalty
        _count: {
          select: { sales: true } // Useful for showing "Total Orders" in table
        }
      }
    });

    return { 
      success: true, 
      data: customers, 
      status: 200 
    } as AppResponse;
  } catch (error) {
    console.error("GET_CUSTOMERS_ERROR:", error);
    return { error: "Failed to fetch customers", success: false, status: 500 } as AppResponse;
  }
}

// FETCH SINGLE CUSTOMER BY ID
static async getCustomerById(customerId: string, businessId: string) {
  try {
    if (!customerId || !businessId) {
      return { 
        success: false, 
        error: "Customer ID and Business ID are required.", 
        status: 400 
      } as AppResponse;
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId, // 🔒 Crucial for tenant boundary security
        isDeleted: false,
      },
      include: {
        registeredAtShop: {
          select: {
            id: true,
            name: true,
          }
        },
        loyalty: true,
        _count: {
          select: { sales: true }
        }
      }
    });

    if (!customer) {
      return { 
        success: false, 
        error: "Customer not found.", 
        status: 404 
      } as AppResponse;
    }

    return { 
      success: true, 
      data: customer, 
      status: 200 
    } as AppResponse;

  } catch (error) {
    console.error(`GET_CUSTOMER_BY_ID_ERROR [ID: ${customerId}]:`, error);
    return { 
      success: false, 
      error: "Failed to fetch customer details", 
      status: 500 
    } as AppResponse;
  }
}

//UPDATE CUSTOMER
static async  updateCustomer(
  data: Partial<CustomerImportPayload>,
  customerId: string, 
  businessId: string, 
  userId: string 
) {
  try {

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { 
          id: customerId,
          businessId: businessId // Security: ensure customer belongs to business
        },
        data: {
          ...data,
          // If shop name was provided in an update, you'd map it to ID here as well
        }
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE_CUSTOMER",
          entity: "CUSTOMER",
          entityId: customer.id,
          userId: userId,
          businessId: businessId,
          newValue: `Updated details for ${customer.firstName}`,
        }
      });

      return customer;
    });

    return { success: true, message: `Customer ${updatedCustomer.firstName} ${updatedCustomer.lastName} updated successfully`, data: updatedCustomer, status: 200 } as AppResponse;
  } catch (error) {
    console.error("UPDATE_CUSTOMER_ERROR:", error);
    return { error: "Failed to update customer", success: false, status: 500 } as AppResponse;
  }
}

// SOFT DELETE SINGLE CUSTOMER
static async softDeleteCustomer(
  customerId: string, 
  userId: string,
  businessId: string, 
  businessSlug: string
) {
  try {
    if (!customerId) {
      return { error: "Customer ID is required", success: false, status: 400 } as AppResponse;
    }

    // First check if the customer exists and belongs to this business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId,
        isDeleted: false
      }
    });

    if (!existingCustomer) {
      return { error: "Customer not found or already deleted", success: false, status: 404 };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Perform Soft Delete
      await tx.customer.update({
        where: {
          id: customerId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // 2. Create Audit Log for the single entity action
      await tx.auditLog.create({
        data: {
          action: "SOFT_DELETE_CUSTOMER",
          entity: "CUSTOMER",
          entityId: customerId,
          userId: userId,
          businessId: businessId,
          newValue: `Customer (${existingCustomer.firstName + " " + existingCustomer.lastName || customerId}) moved to trash/deleted.`
        }
      });
    });

    return { 
      success: true, 
      message: `Successfully deleted customer.`, 
      redirectTo: `/${businessSlug}/customer_base`,
      status: 200, 
    } as AppResponse;
  } catch (error) {
    console.error(`SOFT_DELETE_CUSTOMER_ERROR [ID: ${customerId}]:`, error);
    return { error: "Failed to delete customer", success: false, status: 500 } as AppResponse;
  }
}

//SOFT DELETE MULTIPLE CUSTOMERS
static async  softDeleteBulkCustomers(
  customerIds: string[], 
  businessId: string, 
  userId: string,
  businessSlug: string
) {
  try {
    if (!customerIds.length) {
      return { error: "No customers selected", success: false, status: 400 };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Perform Soft Delete
      const updateCount = await tx.customer.updateMany({
        where: {
          id: { in: customerIds },
          businessId: businessId
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // 2. Create Audit Logs for each deleted customer
      await tx.auditLog.createMany({
        data: customerIds.map(id => ({
          action: "SOFT_DELETE_CUSTOMER",
          entity: "CUSTOMER",
          entityId: id,
          userId: userId,
          businessId: businessId,
          newValue: "Customer moved to trash/deleted."
        }))
      });

      return updateCount;
    });

    return { 
      success: true, 
      message: `Successfully deleted ${result.count} customer(s).`, 
      redirectTo: `/${businessSlug}/customer_base`,
      status: 200, 
    };
  } catch (error) {
    console.error("SOFT_DELETE_CUSTOMERS_ERROR:", error);
    return { error: "Failed to delete customers", success: false, status: 500 };
  }
 }
}
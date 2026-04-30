// lib/bulk-import/configs/employee-config.ts
import { z } from 'zod';
import { BulkImportConfig } from '@/schema/bulkupload.schema';

export const employeeCSVSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  roleId: z.string().min(1, "Role ID is required"),
  shopId: z.string().optional().nullable(),
  hasSystemAccess: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val.toLowerCase() === 'true' || val === '1';
    }),
});

export type EmployeeCSVRow = z.infer<typeof employeeCSVSchema>;

export interface EmployeeImportPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  designation: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  roleId: string;
  shopId: string | null;
  hasSystemAccess: boolean;
}

export const employeeImportConfig: BulkImportConfig<typeof employeeCSVSchema, EmployeeImportPayload> = {
  entityName: 'Employee',
  entityNamePlural: 'Employees',
  schema: employeeCSVSchema,
  apiEndpoint: '/api/employees/bulk-import',
  
  templateHeaders: [
    'firstName',
    'lastName',
    'email',
    'phone',
    'designation',
    'address',
    'dateOfBirth',
    'roleId',
    'shopId',
    'hasSystemAccess',
  ],
  
  templateExample: [
    'John',
    'Doe',
    'john.doe@example.com',
    '0241234567',
    'Sales Manager',
    '123 Main St',
    '1990-01-15',
    'role_id_here',
    'shop_id_here',
    'true',
  ],
  
  transformData: (row: EmployeeCSVRow): EmployeeImportPayload => ({
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone || null,
    designation: row.designation || null,
    address: row.address || null,
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
    roleId: row.roleId,
    shopId: row.shopId && row.shopId !== '' ? row.shopId : null,
    hasSystemAccess: row.hasSystemAccess,
  }),
};
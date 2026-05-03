// lib/bulk-import/configs/employee-config.ts
import { z } from 'zod';
import { BulkImportConfig } from '@/schema/bulkupload.schema';
import { createBulkEmployees } from '@/lib/actions/business/employeesActions';

export const employeeCSVSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  role: z.string().min(1, "Role is required"),
  shop: z.string().optional().nullable(),
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
  role: string;
  shop: string | null;
  hasSystemAccess: boolean;
}

export const employeeImportConfig: BulkImportConfig<typeof employeeCSVSchema, EmployeeImportPayload> = {
  entityName: 'Employee',
  entityNamePlural: 'Employees',
  schema: employeeCSVSchema,
  apiEndpoint: createBulkEmployees,
  // apiEndpoint: '/api/employees/bulk-import',
  
  templateHeaders: [
    'firstName',
    'lastName',
    'email',
    'phone',
    'designation',
    'address',
    'dateOfBirth',
    'role',
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
    'CASHIER',
    'null',
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
    role: row.role,
    shop: row.shop && row.shop !== '' ? row.shop : null,
    hasSystemAccess: row.hasSystemAccess,
  }),
};


export const EmployeeValidatedSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  
  // FIX: Change string() to date() since the payload contains Date objects
  dateOfBirth: z.date().optional().nullable(), 
  
  role: z.string().min(1), 
  shop: z.string().optional().nullable(),
  hasSystemAccess: z.boolean(),
});

export const EmployeeValidatedArray = z.array(EmployeeValidatedSchema);
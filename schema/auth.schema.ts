import {z} from "zod"

export const signupSchema = z.object({
    businessName: z.string().min(2,"Business name is required"),
    firstName: z.string().min(2,"First name must be at least 2 characters"),
    lastName: z.string().min(2,"Last name cannot be empty"),
    email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
    password: z.string().min(8,"Password must be at least 8 characters"),
    confirmPassword: z.string(),
    termsAgreement: z.boolean().refine((val)=> val === true, {
        message: "You must agree to the terms and conditions"
    })
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]});

export type SignUpFormSchema = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  // email is a method of string, not a top-level function
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
    
  // Use .min(1) to prevent empty strings
  password: z
    .string()
    .min(1, "Password field cannot be empty")
});
export type LoginSchema = z.infer<typeof loginSchema>;

//OTP SCHEMA
export const otpSchema = z.object({
  pin: z.string().length(6, "Verification code must be 6 digits"),
});
export type OTPFormSchema = z.infer<typeof otpSchema>;

//EMPLOYEE SCHEMA
export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  fileKey: z.string().optional().nullable().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  shopId: z.string().optional().nullable(),
  // New fields from your full model
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  hasSystemAccess: z.boolean(),
});

export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
// Wrap your existing schema in an array
export const CreateBulkEmployeeSchema = z.array(createEmployeeSchema);

//PASSWORD CHANGE
export const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type PasswordSchema = z.infer<typeof passwordSchema>;


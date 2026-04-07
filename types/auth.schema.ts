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
  firstName: z.string().min(2,"First name must be at least 2 characters"),
  lastName: z.string().min(2,"Last name cannot be empty"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  roleId: z.string(),
  phone: z.string().optional(),
  shopId: z.string().optional()
});
export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
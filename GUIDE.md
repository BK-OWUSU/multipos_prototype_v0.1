// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Get a free hosted Postgres database in seconds: `npx create-db`

generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}


// ── BUSINESS (Tenant) ──────────────────────────────
model Business {
  id          String     @id @default(cuid())
  name        String
  email       String     @unique
  phone       String?
  address     String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // relations
  users       User[]
  shops       Shop[]
  products    Product[]
  customers   Customer[]
  sales       Sale[]
  categories  Category[]
  roles       Role[]
  discounts   Discount[]
  auditLogs   AuditLog[]

  @@map("businesses")
}

// ── SHOP (Branch) ──────────────────────────────────
model Shop {
  id         String    @id @default(cuid())
  name       String
  address    String?
  phone      String?
  isActive   Boolean   @default(true)
  businessId String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  // relations
  business   Business  @relation(fields: [businessId], references: [id])
  users      User[]
  sales      Sale[]

  @@map("shops")
}

// ── ROLE ───────────────────────────────────────────
model Role {
  id          String   @id @default(cuid())
  name        String
  permissions String[] // e.g ["pos:view", "product:view"]
  businessId  String
  createdAt   DateTime @default(now())

  // relations
  business    Business @relation(fields: [businessId], references: [id])
  users       User[]

  @@map("roles")
}

// ── USER (Employee) ────────────────────────────────
model User {
  id         String     @id @default(cuid())
  firstName  String
  lastName   String
  email      String     @unique
  password   String
  phone      String?
  businessId String
  roleId     String
  shopId     String?
  isActive   Boolean    @default(true)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  // relations
  business   Business   @relation(fields: [businessId], references: [id])
  role       Role       @relation(fields: [roleId], references: [id])
  shop       Shop?      @relation(fields: [shopId], references: [id])
  sales      Sale[]
  stockLogs  StockLog[]
  timeCards  TimeCard[]
  auditLogs  AuditLog[]

  @@map("users")
}

// ── TIME CARD ──────────────────────────────────────
model TimeCard {
  id         String    @id @default(cuid())
  userId     String
  clockIn    DateTime
  clockOut   DateTime?
  totalHours Float?
  date       DateTime  @default(now())
  createdAt  DateTime  @default(now())

  // relations
  user       User      @relation(fields: [userId], references: [id])

  @@map("time_cards")
}

// ── CATEGORY ───────────────────────────────────────
model Category {
  id         String    @id @default(cuid())
  name       String
  businessId String
  createdAt  DateTime  @default(now())

  // relations
  business   Business  @relation(fields: [businessId], references: [id])
  products   Product[]

  @@map("categories")
}

// ── DISCOUNT ───────────────────────────────────────
model Discount {
  id         String       @id @default(cuid())
  name       String
  type       DiscountType @default(PERCENTAGE)
  value      Decimal    @db.Decimal(10, 2)
  isActive   Boolean      @default(true)
  startDate  DateTime?
  endDate    DateTime?
  businessId String
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  // relations
  business   Business     @relation(fields: [businessId], references: [id])
  products   Product[]
  sales      Sale[]

  @@map("discounts")
}

// ── PRODUCT ────────────────────────────────────────
model Product {
  id            String     @id @default(cuid())
  name          String
  price         Decimal    @db.Decimal(10, 2)
  costPrice     Decimal    @db.Decimal(10, 2)
  stock         Int        @default(0)
  lowStockAlert Int        @default(5)
  isActive      Boolean    @default(true)
  businessId    String
  categoryId    String?
  discountId    String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // relations
  business      Business   @relation(fields: [businessId], references: [id])
  category      Category?  @relation(fields: [categoryId], references: [id])
  discount      Discount?  @relation(fields: [discountId], references: [id])
  saleItems     SaleItem[]
  stockLogs     StockLog[]

  @@map("products")
}

// ── STOCK LOG ──────────────────────────────────────
model StockLog {
  id        String   @id @default(cuid())
  productId String
  userId    String
  change    Int
  reason    String?
  createdAt DateTime @default(now())

  // relations
  product   Product  @relation(fields: [productId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@map("stock_logs")
}

// ── CUSTOMER ───────────────────────────────────────
model Customer {
  id               String   @id @default(cuid())
  firstName        String
  lastName         String
  email            String?
  phone            String?
  address          String?
  isCreditCustomer Boolean  @default(false)
  creditLimit      Decimal    @db.Decimal(10, 2)    @default(0)
  businessId       String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // relations
  business         Business  @relation(fields: [businessId], references: [id])
  sales            Sale[]
  loyalty          Loyalty?

  @@map("customers")
}

// ── LOYALTY ────────────────────────────────────────
model Loyalty {
  id          String   @id @default(cuid())
  customerId  String   @unique
  points      Int      @default(0)
  totalEarned Int      @default(0)
  totalSpent  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // relations
  customer    Customer @relation(fields: [customerId], references: [id])

  @@map("loyalty")
}

// ── SALE ───────────────────────────────────────────
model Sale {
  id                String      @id @default(cuid())
  totalAmount       Decimal    @db.Decimal(10, 2)
  discountAmount    Decimal    @db.Decimal(10, 2)       @default(0)
  paymentType       PaymentType @default(CASH)
  status            SaleStatus  @default(COMPLETED)
  businessId        String
  shopId            String?
  userId            String
  customerId        String?
  discountId        String?
  createdAt         DateTime    @default(now())

  // relations
  business          Business    @relation(fields: [businessId], references: [id])
  shop              Shop?       @relation(fields: [shopId], references: [id])
  user              User        @relation(fields: [userId], references: [id])
  customer          Customer?   @relation(fields: [customerId], references: [id])
  discount          Discount?   @relation(fields: [discountId], references: [id])
  items             SaleItem[]
  invoice           Invoice?

  @@map("sales")
}

// ── SALE ITEM ──────────────────────────────────────
model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Int
  unitPrice Decimal    @db.Decimal(10, 2)
  subtotal  Decimal    @db.Decimal(10, 2)

  // relations
  sale      Sale    @relation(fields: [saleId], references: [id])
  product   Product @relation(fields: [productId], references: [id])

  @@map("sale_items")
}

// ── INVOICE ────────────────────────────────────────
model Invoice {
  id        String   @id @default(cuid())
  invoiceNo String   @unique
  issuedAt  DateTime @default(now())
  saleId    String   @unique

  // relations
  sale      Sale     @relation(fields: [saleId], references: [id])

  @@map("invoices")
}

// ── AUDIT LOG ──────────────────────────────────────
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // e.g "CREATED_PRODUCT", "UPDATED_STOCK"
  entity     String   // e.g "Product", "User", "Sale"
  entityId   String   // id of the affected record
  oldValue   String?  // JSON string of old data
  newValue   String?  // JSON string of new data
  userId     String
  businessId String
  createdAt  DateTime @default(now())

  // relations
  user       User     @relation(fields: [userId], references: [id])
  business   Business @relation(fields: [businessId], references: [id])

  @@map("audit_logs")
}

// ── ENUMS ──────────────────────────────────────────
enum PaymentType {
  CASH
  MOBILE_MONEY
  CREDIT
}

enum SaleStatus {
  COMPLETED
  REFUNDED
  PENDING
}

enum DiscountType {
  PERCENTAGE
  FIXED
}



//OTP//
-------
import { OTPResponse } from "@/types/auth";
import { prisma } from "./dbHelper";

// Generate a random 6 digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save OTP to database
export async function saveOTP(userId: string, code: string): Promise<void> {
    // Delete any existing unused OTPs for this user
    await prisma.oTPVerification.deleteMany({
        where: {userId, isUsed: false}
    })
    // Create new OTP (expires in 10 minutes)
    await prisma.oTPVerification.create({
        data: {
            userId,
            code,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) //10 minutes
        }
    })
}

//Verify OTP
export async function verifyOTP(userId: string, code: string): Promise<OTPResponse> {
    const otp = await prisma.oTPVerification.findFirst({
        where: {
            userId,
            code,
            isUsed: false
        }
    });
    //If otp not found
    if (!otp) {
        return { valid: false, message: "Invalid OTP" }
    }
    // OTP expired
    if (otp.expiresAt < new Date()) {
    return { valid: false, message: "OTP has expired. Please request a new one" }
    }
    // Mark OTP as used
    await prisma.oTPVerification.update({
        where: { id: otp.id },
        data: { isUsed: true }
    })
    
    return { valid: true, message: "OTP verified successfully" }
}



USEFORM (SIGN UP)
"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card"
import {Field,FieldDescription,FieldGroup,FieldContent} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SignUpFormSchema, signupSchema } from "@/types/auth.schema"
import { Checkbox } from "@/components/ui/checkbox"
import {SubmitHandler, useForm } from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const {
    register, 
    handleSubmit,
    setError,
    setValue,
    formState: {errors, isSubmitting}
    } = useForm<SignUpFormSchema>({
      resolver: zodResolver(signupSchema as never)
    });
 
  //Onsubmit function to handle submit
  const onSubmit: SubmitHandler<SignUpFormSchema> = async(data) => {
    await new Promise((resolve)=> setTimeout(resolve, 2000))
    console.log(data)
  }
  return (
    <Card {...props}>
      <CardHeader className="text-center">  
        <CardTitle>Create Your Free MultiPOS Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <Input id="businessName" type="text" placeholder="Enter Business name" required
              {...register("businessName")}
              />
              {errors.businessName && <FieldDescription className="text-red-500">{errors.businessName?.message}</FieldDescription>}
            </Field> 
            <Field>
              <Input id="firstName" type="text" placeholder="Enter firstname" required
              {...register("firstName")}  
              />
               {errors.firstName && <FieldDescription className="text-red-500">{errors.firstName?.message}</FieldDescription>} 
            </Field>
            <Field>
              <Input id="lastName" type="text" placeholder="Enter lastname" required
               {...register("lastName")} 
              />
               {errors.lastName && <FieldDescription className="text-red-500">{errors.lastName?.message}</FieldDescription>}
            </Field>
            <Field>
              <Input id="email" type="email" placeholder="Enter your email" required
                {...register("email")}
              />
               {errors.email && <FieldDescription className="text-red-500">{errors.email?.message}</FieldDescription>}
              <FieldDescription>
                {/* We&apos;ll use this to contact you. We will not share your email
                with anyone else. */}
              </FieldDescription>
            </Field>
            <Field>
              <Input id="password" placeholder="Enter password" type="password" required
               {...register("password")} 
              />
               {errors.password 
               ? 
               <FieldDescription className="text-red-500">{errors.password?.message}</FieldDescription>
               :
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
               }
            </Field>
            <Field>
              {/* <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel> */}
              <Input id="confirm-password" placeholder="Confirm password" type="password" required
              {...register("confirmPassword")}
              />
               {errors.confirmPassword && <FieldDescription className="text-red-500">{errors.confirmPassword?.message}</FieldDescription>}
              </Field>
                  <FieldGroup className="mx-auto">
                    <Field orientation="horizontal">
                      <Checkbox id="terms-checkbox-desc" name="terms-checkbox-desc"
                        className="border-black size-4.5"
                        onCheckedChange={(checked) => setValue("termsAgreement", checked as boolean)}
                      />
                      <FieldContent>
                        <FieldDescription>
                          I agree to MultiPos <a href="">Terms of Use</a> and have read and acknowledged <a href="">Privacy Policy</a> 
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                      {errors.termsAgreement && <FieldDescription className="text-red-500">{errors.termsAgreement?.message}</FieldDescription>}
                  </FieldGroup>
              <FieldGroup>
              <Field>
                <Button type="submit" disabled = {isSubmitting} className="p-5">{isSubmitting ? "Loading..." : "Create Account"}</Button>
                {errors.root && <p className="text-red-500">{errors.root?.message}</p>}
                <FieldDescription className="px-6 text-center flex justify-between">
                   <span>Already have an account?</span> <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup> 
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

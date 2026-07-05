import { Paystack } from "paystack-sdk";
import { prisma } from "@/lib/dbHelper";
import { paystackReferenceGenerator } from "@/lib/utils";
import { POSCheckoutInput, posCheckoutSchema } from "@/types/schema/pos";
import { AppResponse } from "@/types/auth/auth";

const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY ?? "");

export class SaleService {

/**
   * Processes an order checkout, balances ledger cash drawers, 
   * accounts for inventory deductions, and initializes gateway triggers.
   */
  static async processCheckout(
    data: POSCheckoutInput,
    shopId: string,
    employeeId: string,
    userId: string,
    businessId: string,
    cashSessionId: string
  ) {
    try {
      // 1. Validate Input Shape using the Zod Schema
      const validatedData = posCheckoutSchema.parse(data);
      console.log("PAYMENT METHOD: ", validatedData.paymentMethod)

      // 2. Generate a secure audit reference if an online payment path is required
      const paystackReference = paystackReferenceGenerator(validatedData.paymentMethod)

      // Pure cash payments complete instantly; MoMo starts out as PENDING
      const finalSaleStatus = validatedData.paymentMethod === "CASH" ? "COMPLETED" : "PENDING";

      // 3. START TRANSACTION BLOCK
      const result = await prisma.$transaction(async (tx) => {
        
        // ── STEP A: Create the Parent Sale Record ─────────────────
        const sale = await tx.sale.create({
          data: {
            totalAmount: validatedData.totalAmount,
            discountAmount: validatedData.discountAmount,
            paymentType: validatedData.paymentMethod,
            status: finalSaleStatus,
            businessId: businessId,
            shopId: shopId,
            employeeId: employeeId,
            customerId: validatedData.customerId || null,
            discountId: validatedData.discountId || null,
            cashSessionId: cashSessionId,
          }
        });

        // ── STEP B: Loop Through Cart Items & Manage Stocks ─────────────────
        for (const item of validatedData.cartItems) {
          const lineSubtotal = Number(item.quantity) * Number(item.unitPrice);

          // Instantiate invoice item rows
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productVariantId: item.productVariantId,
              businessId: businessId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              subtotal: lineSubtotal
            }
          });

          // Core Retail Rule: Deduct physical branch stock *instantly* only if it's a cash sale
          if (validatedData.paymentMethod === "CASH") {
            const updatedInventory = await tx.shopInventory.update({
            where: { 
                shopId_productVariantId: { 
                shopId: shopId, 
                productVariantId: item.productVariantId 
                } 
            },
            data: { stock: { decrement: item.quantity } }
            });

            // Write structural branch stock history logs
            await tx.stockLog.create({
            data: {
                productVariantId: item.productVariantId,
                shopInventoryId: updatedInventory.id,
                employeeId: employeeId,
                businessId: businessId,
                shopId: shopId,
                change: -item.quantity,
                reason: `POS Checkout Stock Outflow (${validatedData.paymentMethod}) - Sale ID: ${sale.id}`
            }
            });
          }
        }

        // ── STEP C: Split Payments Ledger Distribution ─────────────────
        if (validatedData.paymentMethod === "CASH" || validatedData.paymentMethod === "SPLIT") {
          await tx.payment.create({
            data: {
              saleId: sale.id,
              businessId: businessId,
              shopId: shopId,
              amount: validatedData.paymentMethod === "CASH" ? validatedData.totalAmount : validatedData.cashPaid,
              method: "CASH",
              status: "COMPLETED"
            }
          });
        }

        if (validatedData.paymentMethod === "MOMO" || validatedData.paymentMethod === "SPLIT") {
          await tx.payment.create({
            data: {
              saleId: sale.id,
              businessId: businessId,
              shopId: shopId,
              amount: validatedData.paymentMethod === "MOMO" ? validatedData.totalAmount : validatedData.momoPaid,
              method: "MOMO",
              status: "PENDING",
              reference: paystackReference
            }
          });
        }

        // ── STEP D: Auditing Trail ─────────────────
        await tx.auditLog.create({
          data: {
            action: `CREATE_SALE_${validatedData.paymentMethod}`,
            entity: "SALE",
            entityId: sale.id,
            userId: userId, // Maps the performing agent
            businessId: businessId,
          }
        });

        return { saleId: sale.id, reference: paystackReference };
      });

        // 4. STEP E: Post-Transaction Paystack Processing
        if (validatedData.paymentMethod !== "CASH" && result.reference) {
        const activeMomoCharge = validatedData.paymentMethod === "MOMO" ? validatedData.totalAmount : validatedData.momoPaid;
        const amountInPesewas = Math.round(Number(activeMomoCharge) * 100);
        
        console.log("CUSTOMER EMAIL: ", validatedData.customerEmail)
        const paystackResponse = await paystack.transaction.initialize({
            // email: validatedData.customerEmail || "walkin-customer@multiPos.com",
            email: validatedData.customerEmail || "bismarko416@gmal.com",
            amount: amountInPesewas.toString(),
            reference: result.reference,
            channels: ["mobile_money"],
            metadata: {
            saleId: result.saleId,
            businessId,
            shopId,
            employeeId
          }
        });

        // 1. Guard against a false status flag
        if (!paystackResponse.status) {
            throw new Error(`Paystack Gateway Error: ${paystackResponse.message}`);
        }

        // 2. 🟢 FIX: Guard against a null data body to satisfy TypeScript
        if (!paystackResponse.data) {
            throw new Error("Paystack gateway returned a success status but missing checkout initialization tokens.");
        }

          const dataResult = {
                paymentMethod: validatedData.paymentMethod,
                saleId: result.saleId,
                reference: result.reference,
                authorizationUrl: paystackResponse.data.authorization_url,
                access_code: paystackResponse.data.access_code,
            }

            return {
                success: true,
                message: "Paystack mobile money gateway checkout initialized successfully.",
                data: dataResult,
                status: 200,
            } as AppResponse;
        }

        const dataResult = {
            paymentMethod: "CASH",
            saleId: result.saleId,
        }

      return {
        success: true,
        data: dataResult,
        message: "Sale processed and cash register drawer logged successfully.",
        status: 201,
      };

    } catch (error: unknown) {
      console.error("Critical transactional checkout loop error:", error);
      return {
        error: (error as Error).message || "An unexpected system error occurred while generating your order.",
        success: false,
        status: 500
      };
    }
  }

}
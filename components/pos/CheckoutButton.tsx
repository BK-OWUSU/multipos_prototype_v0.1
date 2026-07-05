"use client";

import { useState } from "react";
import { POSCheckoutInput } from "@/types/schema/pos";
import { PaystackResponse } from "@paystack/inline-js";
import { toast } from "sonner";

interface CheckoutButtonProps {
  checkoutPayload: POSCheckoutInput;
  onSuccess: (saleId: string) => void;
  disabled?: boolean;
}

export default function CheckoutButton({ checkoutPayload, onSuccess, disabled }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/business/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const responseData = await res.json();

      if (!res.ok || !responseData.success) {
        toast.error(responseData.error || "Checkout initial tracking failed.");
        setIsProcessing(false);
        return;
      }

      console.log("=== POS CHECKOUT API FULL RESPONSE DATA ===");
      console.log(responseData);
      console.log("===========================================");

      // 1. Dig down into the payload data layer
      const dataLayer = responseData.data || responseData.sale || responseData.order;
      
      // 2. High-resiliency ID lookup mapping
      const verifiedSaleId = 
        responseData.saleId ||
        responseData.id ||
        dataLayer?.saleId || 
        dataLayer?.id || 
        dataLayer?.sale?.id;

      const explicitPaymentMethod = 
        responseData.paymentMethod || 
        dataLayer?.paymentMethod || 
        checkoutPayload.paymentMethod;

      // 🟢 THE FIX: For resumeTransaction to work, we MUST pass the Paystack Access Code
      const paystackAccessCode = 
        dataLayer?.access_code || 
        responseData.access_code || 
        dataLayer?.paystackResponse?.data?.access_code;

      // 3. Gate validation
      if (!verifiedSaleId) {
        console.error("MAPPING_CRITICAL_FAILURE - Server Response Payload Structure:", responseData);
        toast.error("Transaction resolved, but no valid Sale ID was found.");
        setIsProcessing(false);
        return;
      }

      // Action A: If purely a completed cash balance, finish instantly
      if (explicitPaymentMethod === "CASH") {
        onSuccess(verifiedSaleId);
        setIsProcessing(false);
        return;
      }

      // Action B: Resume transaction using Paystack's official Access Code string signature
      if (!paystackAccessCode) {
        console.error("MAPPING_CRITICAL_FAILURE - Missing Access Code in response:", responseData);
        toast.error("Could not locate payment gateway access token.");
        setIsProcessing(false);
        return;
      }
      
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop() as any;


      // Pass the access code to resume the exact session initialized by your backend
      popup.resumeTransaction(paystackAccessCode, {
        onSuccess: (response: any) => {
          onSuccess(verifiedSaleId);
          setIsProcessing(false);
        },
        onCancel: () => {
          toast.info("Payment channel exited by cashier.");
          setIsProcessing(false);
        },
      });

    } catch (error) {
      console.error("FRONTEND_PAYMENT_TRIGGER_ERROR:", error);
      toast.error("Error initializing payment flow framework.");
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={executeCheckout}
      disabled={isProcessing || disabled}
      className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Processing Transaction...</span>
        </>
      ) : (
        <span>Complete Order & Charge</span>
      )}
    </button>
  );
}
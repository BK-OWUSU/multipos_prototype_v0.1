declare module "@paystack/inline-js" {
  export interface PaystackPopOptions {
    key: string;
    email: string;
    amount: number;
    ref: string;
    onCancel?: () => void;
    callback: (response: PaystackResponse) => void;
  }

  export interface PaystackResponse {
    reference: string;
    status: "success" | "ongoing" | "failed";
    trans: string;
    transaction: string;
    message: string;
  }

  export default class PaystackPop {
    constructor();
    loadIframe(options: PaystackPopOptions): void;
  }
}
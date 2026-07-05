"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, User, CreditCard, ShoppingCart } from "lucide-react";
import { Sale } from "@/types/sale.type";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { formatStandardDateTime } from "@/lib/utils";


interface SaleDetailsDrawerProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SaleDetailsDrawer({
  sale,
  isOpen,
  onClose,
}: SaleDetailsDrawerProps) {
  if (!sale) return null;

  // Status styling map helper
  const statusColors: Record<Sale["status"], string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    REFUNDED: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl! w-200 overflow-y-auto bg-white p-6">
      {/* <SheetContent className="sm:max-w-175! overflow-y-auto bg-white p-6"> */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Transaction Ledger</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="text-xl font-bold text-gray-900 font-mono">
              {sale.customId}
            </SheetTitle>
            <Badge className={`border px-2.5 py-0.5 text-xs font-semibold ${statusColors[sale.status]}`}>
              {sale.status}
            </Badge>
          </div>
          <SheetDescription className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            {formatStandardDateTime(sale.createdAt)}
          </SheetDescription>
        </SheetHeader>

        {/* ─── META OVERVIEW SECTION ───────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Served By</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-700 font-medium">
              <User className="h-4 w-4 text-slate-400" />
              {sale.employee ? `${sale.employee.firstName} ${sale.employee.lastName}` : "System Terminal"}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Customer Type</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-700 font-medium">
              <User className="h-4 w-4 text-slate-400" />
              {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "Walk-in Customer"}
            </div>
          </div>
        </div>

        {/* ─── PURCHASED ITEM MATRIX LIST ──────────────────────────────── */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-tight border-b pb-2">
            <ShoppingCart className="h-4 w-4 text-slate-500" />
            <span>Items Summary ({sale.items?.length || 0})</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sale.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {item.variant?.name || "Unlinked Product Variant Line"}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {item.variant?.sku || "No SKU"} • {item.quantity} x <CurrencyFormatter amount={item.unitPrice} />
                  </p>
                </div>
                <div className="text-sm font-bold text-slate-900 tracking-tight shrink-0 pt-0.5">
                  <CurrencyFormatter amount={item.subtotal} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── TRANSACTION LEDGER CALCULATION SUMMARY ─────────────────── */}
        <div className="mt-6 border-t pt-4 space-y-2.5">
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Total Markdown Discount</span>
              <span className="text-rose-600 font-medium">
                -<CurrencyFormatter amount={sale.discountAmount} />
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-1 border-t border-dashed">
            <span>Grand Gross Total</span>
            <span className="text-lg tracking-tight">
              <CurrencyFormatter amount={sale.totalAmount} />
            </span>
          </div>
        </div>

        {/* ─── CHANNEL ALLOCATION PAYMENT BREAKDOWN ──────────────────── */}
        <div className="mt-6 space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <span>Payment Breakdown Channel ({sale.paymentType})</span>
          </div>
          
          <div className="space-y-2">
            {sale.payments && sale.payments.length > 0 ? (
              sale.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 font-mono">{payment.method}</span>
                    {payment.reference && <span className="text-slate-400 truncate max-w-[140px]">Ref: {payment.reference}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900"><CurrencyFormatter amount={payment.amount} /></span>
                    <span className={`text-[10px] font-bold uppercase tracking-normal ${payment.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                      ({payment.status})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="font-bold text-slate-700 font-mono">{sale.paymentType}</span>
                <span className="font-semibold text-slate-900"><CurrencyFormatter amount={sale.totalAmount} /></span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Or your preferred notification library
import { Loader2 } from "lucide-react";

interface BranchInventoryItem {
  shopId: string;
  shopName: string;
  stock: number;
  lowStockAlert: number;
}

interface UpdateStockFormProps {
  productVariantId: string;
  sku: string;
  // Pass current assigned values from your table row row data
  initialBranches: BranchInventoryItem[]; 
  onSuccess?: () => void;
  onClose?: () => void;
}

export function UpdateStockForm({
  productVariantId,
  sku,
  initialBranches,
  onSuccess,
  onClose,
}: UpdateStockFormProps) {
  const [branches, setBranches] = useState<BranchInventoryItem[]>(initialBranches);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueChange = (
    index: number,
    field: "stock" | "lowStockAlert",
    value: string
  ) => {
    const numericValue = value === "" ? 0 : Math.max(0, parseInt(value, 10));
    setBranches((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: numericValue } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/business/products/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productVariantId,
          branchInventories: branches.map(({ shopId, stock, lowStockAlert }) => ({
            shopId,
            stock,
            lowStockAlert,
          })),
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Something went wrong saving stock layout.");
      }

      toast.success(resData.message || "Branch allocations saved successfully!");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Internal network failure updating distribution logs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
          Target SKU Matrix Variant
        </span>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{sku}</p>
      </div>

      {/* Grid Allocation Layout Sections matching design standards */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
            BRANCH STOCK ALLOCATIONS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branches.map((branch, index) => (
              <div
                key={`stock-${branch.shopId}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-xl"
              >
                <span className="text-xs font-medium text-gray-600 truncate max-w-[140px]">
                  {branch.shopName}...
                </span>
                <Input
                  type="number"
                  min="0"
                  value={branch.stock}
                  onChange={(e) => handleValueChange(index, "stock", e.target.value)}
                  className="w-24 text-right h-9"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
            LOW STOCK THRESHOLDS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branches.map((branch, index) => (
              <div
                key={`alert-${branch.shopId}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-xl"
              >
                <span className="text-xs font-medium text-gray-600 truncate max-w-[140px]">
                  {branch.shopName}...
                </span>
                <Input
                  type="number"
                  min="0"
                  value={branch.lowStockAlert}
                  onChange={(e) => handleValueChange(index, "lowStockAlert", e.target.value)}
                  className="w-24 text-right h-9 text-amber-600 focus-visible:ring-amber-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[110px]">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
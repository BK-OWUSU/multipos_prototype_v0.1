"use client";

import { useState, useEffect, useMemo } from "react";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import { Package, CheckCircle2, AlertCircle, XCircle, BadgeCent, Upload } from "lucide-react";
import { useProductStore } from "@/store/productsStore";
import { productsColumnDef } from "@/components/tablesColumnDef/business/productsColumnDef";
import TableMain from "@/components/reusables/table/TableMain";
import GenericExcelBulkImport from "@/components/reusables/GenericExcelBulkImport";
import { productExcelImportConfig } from "@/lib/configs/product-config";
import { useAuthStore } from "@/store/useAuthStore";
import { softDeleteBulkProductsAction, toggleBulkProductsStatusAction } from "@/lib/actions/business/productsActions";
import { Product } from "@/types/schema/inventory";
import ProductVariantsDrawer from "./ProductVariantsDrawer";

// Shadcn UI Components
import { Card } from "@/components/ui/card";

export default function ProductList() {
  const user = useAuthStore((state) => state.user);
  const { products, fetchProducts, loading } = useProductStore();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [width, setWidth] = useState("sm:max-w-137.5");
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [isVariantDrawerOpen, setIsVariantDrawerOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Updated Logic for the Stat Cards to handle relational variant fields
  const stats = useMemo(() => {
    const initialStats = { 
      total: 0, 
      active: 0, 
      lowStock: 0, 
      outOfStock: 0, 
      totalValue: 0 
    };
    if (!products) return { ...initialStats, formattedTotalValue: "..." };

    const result = products.reduce((acc, p) => {
      acc.total++;
      if (p.isActive) acc.active++;
      
      // Safety guard check: if backend didn't include or map variants array, treat as 0
      const variants = p.variants || [];
      
      // Calculate total aggregated stock across variations for this product line
      const productTotalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      // Evaluate stock metrics safely using variant thresholds
      if (productTotalStock === 0) {
        acc.outOfStock++;
      } else {
        // Check if ANY variation under this product line has tripped its low-stock alert threshold
        const hasLowStockVariant = variants.some(v => (v.stock || 0) <= (v.lowStockAlert || 0));
        if (hasLowStockVariant) {
          acc.lowStock++;
        }
      }

      // Add financial valuation metrics by mapping variants cost metrics
      variants.forEach((v) => {
        acc.totalValue += Number(v.price || 0) * (v.stock || 0);
      });

      return acc;
    }, { ...initialStats });

    // Accessing the business data safely
    const business = user?.business;
    const symbol = business?.currencySymbol || "GH₵"; 
    const locale = business?.locale || "en-GH";

    return {
      ...result,
      formattedTotalValue: `${symbol} ${result.totalValue.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    };
  }, [products, user?.business]);

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ── 1. RESPONSIVE HEADER ACTION REGION ─────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Products</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Manage your centralized product catalog</p>
          </div>
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            {/* Bulk Import Modal Button Wrapper */}
            <GenericModal
              width={width}
              header="Bulk Product Import"
              description="Import multiple products from an Excel file"
              isOpen={isBulkImportOpen}
              onOpenChange={() => {
                setIsBulkImportOpen(prev => !prev);
                setWidth("sm:max-w-137.5");
              }}
              triggerBtn={
                <CustomButton
                  text="Create Bulk Products"
                  customVariant="primary"
                  icon={<Upload className="mr-2 h-4 w-4" />}
                />
              }
            >
              <GenericExcelBulkImport
                config={productExcelImportConfig}
                onSuccess={(result) => {
                  setIsBulkImportOpen(false);
                  fetchProducts();
                  setWidth("sm:max-w-137.5");
                }}
                onCancel={() => {
                  setIsBulkImportOpen(false);
                  setWidth("sm:max-w-137.5");
                }}
                onImportParsedSuccess={() => {
                  setWidth("sm:max-w-max");                  
                }}
              />
            </GenericModal>          
          </div>
        </div>

        {/* ── 2. SHADCN SCORECARD STAT CARDS SECTION ─────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <StatCard 
            title="Total Products" 
            value={stats.total} 
            icon={<Package className="w-4.5 h-4.5 stroke-[2.2]" />} 
            subtitle="All Products" 
            iconBg="bg-indigo-50 text-indigo-600"
          />
          
          <StatCard 
            title="Active Products" 
            value={stats.active} 
            icon={<CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />} 
            subtitle={`${((stats.active / stats.total) * 100 || 0).toFixed(1)}% of total`} 
            iconBg="bg-emerald-50 text-emerald-600"
          />
          
          <StatCard 
            title="Low Stock" 
            value={stats.lowStock} 
            icon={<AlertCircle className="w-4.5 h-4.5 stroke-[2.2]" />} 
            subtitle="Need attention" 
            iconBg="bg-amber-50 text-amber-600"
          />
          
          <StatCard 
            title="Out of Stock" 
            value={stats.outOfStock} 
            icon={<XCircle className="w-4.5 h-4.5 stroke-[2.2]" />} 
            subtitle="Not available" 
            iconBg="bg-rose-50 text-rose-600"
          />
          
          <StatCard 
            title="Total Value" 
            value={stats.formattedTotalValue} 
            icon={<BadgeCent className="w-4.5 h-4.5 stroke-[2.2]" />} 
            subtitle="Inventory value" 
            iconBg="bg-blue-50 text-blue-600"
            isMono={true}
          />

        </div>

        {/* ── 3. DATA TABLE CONTAINER ────────────────────────────── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-white">
             <TableMain 
              data={products || []} 
              columns={productsColumnDef}
              checkBoxVisibility={true}
              columnVisibilityFilter={true}
              tableFilterButtonVisible={true}
              tableExportButtonVisible={true}
              searchKey="name"
              placeholder="Search by name, SKU or barcode..."
              loading={loading}
              handleMultipleDelete={softDeleteBulkProductsAction}
              handleMultipleToggleStatus={toggleBulkProductsStatusAction}
              onActionSuccess={() => fetchProducts()}
              meta={{
                onViewVariants: (product: Product) => {
                  setSelectedProductForVariants(product);
                  setIsVariantDrawerOpen(true);
                }
              }}
            />
          </div>
        </Card>

      </div>

      {/* Slide-out Variants Context panel drawer */}
      <ProductVariantsDrawer
        product={selectedProductForVariants}
        isOpen={isVariantDrawerOpen}
        onClose={() => {
          setIsVariantDrawerOpen(false);
          setSelectedProductForVariants(null);
        }}
      />
    </div>
  );
}

// ── REFACTORED INLINE SHADCN STAT CARD COMPONENT ─────────────────
function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  iconBg,
  isMono = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  subtitle: string;
  iconBg: string;
  isMono?: boolean;
}) {
  return (
    <Card className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 block tracking-normal uppercase">{title}</span>
        <h3 className={`text-lg font-black text-blue-950 mt-0.5 ${isMono ? "font-mono" : ""}`}>
          {value}
        </h3>
        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </Card>
  );
}
"use client";

import { useState, useEffect, useMemo } from "react";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import { Package, CheckCircle2, AlertCircle, XCircle, BadgeCent } from "lucide-react";
import { useProductStore } from "@/store/productsStore";
import { productsColumnDef } from "@/components/tablesColumnDef/productsColumnDef";
import TableMain from "@/components/reusables/table/TableMain";
import { Upload } from "lucide-react";
import GenericBulkImport from "@/components/reusables/GenericBulkImport";
import { productImportConfig } from "@/lib/configs/product-config";
import { useAuthStore } from "@/store/useAuthStore";
import { toggleBulkProductsStatusAction } from "@/lib/actions/business/productsActions";
import { Product } from "@/types/schema/inventory";
import ProductVariantsDrawer from "./ProductVariantsDrawer";

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
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* 1. Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your products</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 items-center">          
          {/* Bulk Import Modal */}
          <GenericModal
            width={width}
            header="Bulk Product Import"
            description="Import multiple products from a CSV file"
            isOpen={isBulkImportOpen}
            onOpenChange={() => {
              setIsBulkImportOpen(prev => !prev);
              setWidth("sm:max-w-137.5");
            }}
            triggerBtn={
              <CustomButton
                text="Bulk Import"
                customVariant="primary"
                icon={<Upload className="mr-2 h-4 w-4" />}
              />
            }
          >
            <GenericBulkImport
              config={productImportConfig}
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
          
      </header>

      {/* 2. Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Products" value={stats.total} icon={<Package className="text-indigo-600" />} subtitle="All Products" />
        <StatCard title="Active Products" value={stats.active} icon={<CheckCircle2 className="text-green-600" />} subtitle={`${((stats.active / stats.total) * 100 || 0).toFixed(1)}% of total`} />
        <StatCard title="Low Stock" value={stats.lowStock} icon={<AlertCircle className="text-orange-500" />} subtitle="Need attention" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={<XCircle className="text-red-500" />} subtitle="Not available" />
        <StatCard title="Total Value" value={stats.formattedTotalValue} icon={<BadgeCent className="text-blue-600" />} subtitle="Inventory value" />
      </div>

      {/* 3. The Table Container */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-white">
           <TableMain 
            data={products || []} 
            columns={productsColumnDef}
            columnVisibilityFilter={true}
            searchKey="name"
            placeholder="Search by name, SKU or barcode..."
            loading={loading}
            handleMultipleDelete={toggleBulkProductsStatusAction} // Passed through class method cleanly now
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
      </div>
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

function StatCard({ title, value, icon, subtitle }: { title: string, value: string | number, icon: React.ReactNode, subtitle: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        {icon}
      </div>
    </div>
  );
}


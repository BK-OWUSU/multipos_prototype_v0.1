"use client";

import { useState, useEffect, useMemo } from "react";
import { GenericModal } from "@/components/reusables/GenericModal";
import AddProductForm from "./AddProductForm";
import CustomButton from "@/components/reusables/CustomButton";
import { Plus, Package, CheckCircle2, AlertCircle, XCircle, BadgeCent } from "lucide-react";
import { useCategoryStore } from "@/store/categoryStore";
import { useBrandStore } from "@/store/brandStore";
import { useProductStore } from "@/store/productsStore";
import { productsColumnDef } from "@/components/tablesColumnDef/productsColumnDef";
import TableMain from "@/components/reusables/table/TableMain";
import { deleteProductsAction, toggleProductsStatusAction } from "@/lib/actions/productsActions";

export default function ProductList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { fetchCategories, categories } = useCategoryStore();
  const { fetchBrands } = useBrandStore();
  const { products, fetchProducts, loading } = useProductStore();

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts();
  }, [fetchCategories, fetchBrands, fetchProducts]);

  // Logic for the Stat Cards
  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
    
    return {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      totalValue: products.reduce((acc, p) => acc + (Number(p.price) * p.stock), 0)
    };
  }, [products]);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* 1. Refined Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manager you products</p>
        </div>

        <GenericModal
          header="Add New Product"
          description="Create a new item in your inventory. Provide details to keep your stock organized."
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          triggerBtn={
            <CustomButton
              text="Add Product"
              customVariant="primary"
              icon={<Plus className="h-4 w-4" />}
            />
          }
        >
          <AddProductForm 
            categories={categories || []} 
            brands={[]}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchProducts();
            }} 
            onCancel={() => setIsModalOpen(false)}
          />
        </GenericModal>
      </header>

      {/* 2. Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Products" value={stats.total} icon={<Package className="text-indigo-600" />} subtitle="All Products" />
        <StatCard title="Active Products" value={stats.active} icon={<CheckCircle2 className="text-green-600" />} subtitle={`${((stats.active / stats.total) * 100 || 0).toFixed(1)}% of total`} />
        <StatCard title="Low Stock" value={stats.lowStock} icon={<AlertCircle className="text-orange-500" />} subtitle="Need attention" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={<XCircle className="text-red-500" />} subtitle="Not available" />
        <StatCard title="Total Value" value={`₵ ${stats.totalValue.toLocaleString()}`} icon={<BadgeCent className="text-blue-600" />} subtitle="Inventory value" />
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
            handleMultipleDelete={deleteProductsAction}
            handleMultipleToggleStatus={toggleProductsStatusAction}
            onActionSuccess={() => fetchProducts()}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-component for the stats
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
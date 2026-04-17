"use client";

import { useState, useEffect } from "react";
import { GenericModal } from "@/components/reusables/GenericModal";
import AddProductForm from "./AddProductForm";
import CustomButton from "@/components/reusables/CustomButton";
import { Plus, PackageSearch } from "lucide-react";
import { useCategoryStore } from "@/store/categoryStore"; // 
import { useBrandStore } from "@/store/brandStore";
import { useProductStore } from "@/store/productsStore";
import { productsColumnDef } from "@/components/tablesColumnDef/productsColumnDef";
import TableMain from "@/components/reusables/table/TableMain";

export default function ProductList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 1. Get data from your stores
  const { categories, fetchCategories } = useCategoryStore();
  const { brands, fetchBrands } = useBrandStore();
  const { products, fetchProducts, loading } = useProductStore();

  // 2. Fetch dependencies on mount
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts();
  }, [fetchCategories, fetchBrands, fetchProducts]);

  console.log("Categories : ",categories, categories?.length)
  console.log("Brands : ",brands, brands?.length)

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Products <PackageSearch className="h-6 w-6" />
          </h1>
          <p className="text-gray-500">Manage your inventory and pricing</p>
        </div>

        {/* 3. The Add Product Modal */}
        <GenericModal
          header="Add New Product"
          description="Create a new item in your inventory. SKU and Category are optional but recommended."
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
            categories={[]} 
            brands={[]}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchProducts(); // Refresh the list
            }} 
            onCancel={()=> {
              setIsModalOpen(false)
            }}
          />
        </GenericModal>
      </header>

      {/* 4. The Table Section (Add your TanStack Table here later) */}
      <div className="bg-white rounded-xl border p-4">
        <TableMain 
          data={products ? products : []} 
          columns={productsColumnDef}
          columnVisibilityFilter = {true}
          searchKey="name"
          placeholder="search product name..."
          loading={loading} />
        <p className="text-center text-gray-400 py-10">Product Table will appear here...</p>
      </div>
    </div>
  );
}
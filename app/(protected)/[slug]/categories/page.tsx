"use client"
import { useState, useMemo, useEffect } from "react";
import { Package, CheckCircle2, XCircle, Layers, Plus, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import TableMain from "@/components/reusables/table/TableMain";
import CategoryForm from "./AddCategoryForm";
import { categoriesColumnDef } from "@/components/tablesColumnDef/categoriesColumnDef";
import { useCategoryStore } from "@/store/categoryStore";

// Mock Data - Replace with your actual store/fetching logic
const mockCategories = [
  { id: "1", name: "Electronics", description: "Gadgets and devices", products: 120, isActive: true, createdAt: "12 Mar 2025" },
  { id: "2", name: "Beverages", description: "Drinks and liquids", products: 45, isActive: true, createdAt: "10 Mar 2025" },
  { id: "3", name: "Pharmacy", description: "Medicine", products: 15, isActive: false, createdAt: "28 Feb 2025" },
];

export default function CategoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {fetchCategories, categories} = useCategoryStore();

   useEffect(()=>{
    fetchCategories();
  },[fetchCategories])

  const stats = useMemo(() => {
    const categoryList = categories || [];
    const active = categoryList.filter(c => c.isActive).length;
    const inactive = categoryList.filter(c => !c.isActive).length;
    console.log("Categories")
    console.log(categoryList)
  return [  
    { label: "Total Categories", value: categoryList.length, icon: Layers, color: "bg-indigo-50 text-indigo-600" },
    { label: "Active Categories", value: active, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Inactive Categories", value: inactive, icon: XCircle, color: "bg-red-50 text-red-600" },
    { label: "Total Products", value: 245, icon: Package, color: "bg-blue-50 text-blue-600" },
    ]
}, [categories]);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">Manage product categories to organize your inventory.</p>
        </div>
        
        <GenericModal
          header="Add Category"
          description="Create a new category to organize your products."
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          triggerBtn={
            <CustomButton
              customVariant="primary"
              text="Add Category" 
              icon={<Plus className="w-4 h-4 mr-2" />} 
            />
          }
        >
          <CategoryForm 
            onSuccess={() =>{ 
              setIsModalOpen(false)
              fetchCategories();
            }}
            onCancel={()=>setIsModalOpen(false)} 
            />
        </GenericModal>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <TableMain 
                data={ categories || []}
                columns={categoriesColumnDef} // Use your defined categoryColumns here
                searchKey="name"
                placeholder="Search category..."
              />
           </div>
        </div>

        {/* Tips Section (Sidebar from your image) */}
        <div className="hidden lg:block">
           <Card className="bg-indigo-50/50 border-none shadow-none p-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold mb-4">
                <Lightbulb className="w-5 h-5" />
                Tips
              </div>
              <ul className="space-y-3 text-sm text-indigo-900/80">
                <li className="flex gap-2"><span>✓</span> Create clear and specific categories.</li>
                <li className="flex gap-2"><span>✓</span> Categories help you organize products better.</li>
                <li className="flex gap-2"><span>✓</span> You can manage category order in settings.</li>
              </ul>
           </Card>
        </div>
      </div>
    </div>
  );
}
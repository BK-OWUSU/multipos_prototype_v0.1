"use client"
import { useState, useMemo } from "react";
import { Package, CheckCircle2, XCircle, Award, Plus, Lightbulb, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import TableMain from "@/components/reusables/table/TableMain";
import BrandForm from "./AddBrandForm";
import { brandsColumnDef } from "@/components/tablesColumnDef/brandsColumnDef"; // Ensure this is created

// Mock Data updated for Brands
const mockBrands = [
  { id: "1", name: "Nike", description: "Sportswear and equipment", products: 85, isActive: true, createdAt: "12 Mar 2025" },
  { id: "2", name: "Apple", description: "Consumer electronics", products: 40, isActive: true, createdAt: "10 Mar 2025" },
  { id: "3", name: "Samsung", description: "Global electronics", products: 120, isActive: false, createdAt: "28 Feb 2025" },
];

export default function BrandPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = useMemo(() => [
    { label: "Total Brands", value: mockBrands.length, icon: Award, color: "bg-purple-50 text-purple-600" },
    { label: "Active Brands", value: mockBrands.filter(b => b.isActive).length, icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Inactive Brands", value: mockBrands.filter(b => !b.isActive).length, icon: XCircle, color: "bg-rose-50 text-rose-600" },
    { label: "Total Products", value: 245, icon: Package, color: "bg-blue-50 text-blue-600" },
  ], []);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Brands</h1>
          <p className="text-slate-500 text-sm">Manage product brands and manufacturer labels.</p>
        </div>
        
        <GenericModal
          header="Add Brand"
          description="Create a new brand label for your product inventory."
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          triggerBtn={
            <CustomButton
              customVariant="primary"
              text="Add Brand" 
              icon={<Plus className="w-4 h-4 mr-2" />} 
              className="shadow-md hover:shadow-lg transition-all"
            />
          }
        >
          <BrandForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
        </GenericModal>
      </div>

      {/* Stats Grid - Subtle color shift to Purple/Emerald for differentiation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-default">
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

      {/* Table and Sidebar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table Area */}
        <div className="lg:col-span-3">
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 overflow-hidden">
              <TableMain 
                data={[]} // Plug in actual data here
                columns={brandsColumnDef} 
                searchKey="name"
                placeholder="Search brands..."
              />
           </div>
        </div>

        {/* Brand Tips Sidebar */}
        <div className="hidden lg:block">
           <Card className="bg-purple-50/40 border-dashed border-2 border-purple-100 shadow-none p-5">
              <div className="flex items-center gap-2 text-purple-700 font-bold mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Brand Tips
              </div>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">✓</span> 
                  Upload high-quality logos for better POS visibility.
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">✓</span> 
                  {/* Active brands will appear in the "Add Product" dropdown. */}
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">✓</span> 
                  Use descriptions to note manufacturer contact or origin.
                </li>
              </ul>
           </Card>
        </div>
      </div>
    </div>
  );
}
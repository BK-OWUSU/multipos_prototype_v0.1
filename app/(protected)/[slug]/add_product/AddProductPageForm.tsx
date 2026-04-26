"use client";

import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/schema/inventory.schema";
import { FormInput } from "@/components/reusables/FormInput";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea"
import { Package, Save, X, Plus, Info, LayoutGrid, DollarSign, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ImageSection } from "@/components/reusables/ImageSection";
import { useEffect, useState } from "react";
import CustomButton from "@/components/reusables/CustomButton";
import { useProductStore } from "@/store/productsStore";
import { Badge } from "@/components/ui/badge";
import { GenericModal } from "@/components/reusables/GenericModal";
import AddCategoryForm from "../categories/AddCategoryForm";

interface AddProductPageFormProps {
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddProductPageForm({ categories = [], brands = [], onSuccess, onCancel }: AddProductPageFormProps) {
  const { createProduct } = useProductStore();
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: 0,
      costPrice: 0,
      stock: 0,
      lowStockAlert: 5,
      categoryId: "none",
      brandId: "none",
      imageUrl: "",
      isActive: true,
    },
  });

  const { formState: { isSubmitting }, control, handleSubmit, setValue, reset } = methods;

  // Watch values for the real-time Summary Card
  const watchedValues = useWatch({ control });

  useEffect(() => {
    return () => {
      if (uploadedFileKey && !isSuccessfullySubmitted) {
        fetch("/api/uploadthing/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey: uploadedFileKey }),
          keepalive: true,
        }).catch(console.error);
      }
    };
  }, [uploadedFileKey, isSuccessfullySubmitted]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSuccessfullySubmitted(true);
      const response = await createProduct(data);
      if (response.success) {
        toast.success(response.message || "Product added successfully!");
        setUploadedFileKey(null);
        reset();
        if (onSuccess) onSuccess();
      } else {
        setIsSuccessfullySubmitted(false);
        toast.error(response.error || "Failed to add product");
      }
    } catch (error) {
      setIsSuccessfullySubmitted(false);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-[80vw] mx-auto space-y-6 pb-10">
        
        {/* --- Top Action Bar --- */}
        <div className="flex items-center justify-between  top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Add Product</h1>
            <p className="text-xs text-muted-foreground">Add a new product</p>
          </div>
          <div className="flex items-center gap-3">
            <CustomButton 
             text="Cancel" 
             type="button" 
             onClick={()=>{
                 reset()
                 if (uploadedFileKey){
                    fetch("/api/uploadthing/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileKey: uploadedFileKey }),
                        keepalive: true,
                    }).catch(console.error);
                 }                 
             }} 
             customVariant="secondary" 
             icon={<X size={16}/>} />
            <CustomButton text="Save Product" type="submit" customVariant="primary" icon={<Save size={16}/>} isLoading={isSubmitting} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- LEFT COLUMN: Forms --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Basic Information */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 pb-3">
                <span className="bg-indigo-100 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs">1</span>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="name" label="Product Name *" placeholder="Enter product name" />
                <FormInput name="sku" label="SKU / Barcode" placeholder="Enter SKU or scan barcode" />
              </div>
              <FormInput textArea name="description" label="Description" placeholder="Enter product description (optional)" />
            </section>

            {/* 2. Category & Organization */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 pb-3">
                <span className="bg-indigo-100 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs">2</span>
                Category & Organization
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Category *</FieldLabel>
                  <div className="flex gap-2">
                    <Controller
                      control={control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Select Category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Uncategorized</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {/* <CustomButton icon={<Plus size={16}/>} customVariant="primary" className="px-3" text="Add New Category"/> */}
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
                            <AddCategoryForm 
                                onSuccess={() => setIsModalOpen(false)} 
                                onCancel={()=> setIsModalOpen(false)} 
                            />
                        </GenericModal>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Brand</FieldLabel>
                  <Controller
                    control={control}
                    name="brandId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                        <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Brand</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </section>

            {/* 3. Pricing */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 pb-3">
                <span className="bg-indigo-100 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs">3</span>
                Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="costPrice" label="Cost Price" type="number" placeholder="0.00" />
                <FormInput name="price" label="Selling Price *" type="number" placeholder="0.00" />
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div>
                      <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Profit</p>
                      <p className="font-bold text-green-600">${(Number(watchedValues.price || 0) - Number(watchedValues.costPrice || 0)).toFixed(2)}</p>
                   </div>
                   <div className="h-8 w-px bg-gray-200" />
                   <div>
                      <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Margin</p>
                      <p className="font-bold text-indigo-600">
                        {watchedValues.price ? (((Number(watchedValues.price) - Number(watchedValues.costPrice)) / Number(watchedValues.price)) * 100).toFixed(0) : 0}%
                      </p>
                   </div>
                </div>
              </div>
            </section>

            {/* 4. Inventory */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 pb-3">
                <span className="bg-indigo-100 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs">4</span>
                Inventory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="stock" label="Stock Quantity *" type="number" placeholder="0" />
                <FormInput name="lowStockAlert" label="Low Stock Alert" type="number" placeholder="5" />
              </div>
            </section>
          </div>

          {/* --- RIGHT COLUMN: Image & Summary --- */}
          <div className="space-y-6">
            {/* Product Image Section */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-bold text-gray-800">Product Image</h2>
              <ImageSection 
                control={control} 
                setValue={setValue} 
                name="imageUrl" 
                endpoint="imageUploader" 
                label="" 
                onImageUpload={(key) => {
                  setUploadedFileKey(key);
                  setValue("fileKey", key);
                }}
                onImageRemove={() => {
                  setUploadedFileKey(null);
                  setValue("fileKey", "");
                }}
              />
            </section>

            {/* Summary Card */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-bold text-gray-800">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between  pb-2"><span className="text-gray-500">Product Name</span> <span className="font-medium">{watchedValues.name || "-"}</span></div>
                <div className="flex justify-between  pb-2"><span className="text-gray-500">SKU</span> <span className="font-medium">{watchedValues.sku || "-"}</span></div>
                <div className="flex justify-between  pb-2"><span className="text-gray-500">Category</span> <span className="font-medium text-indigo-600">
                  {categories.find(c => c.id === watchedValues.categoryId)?.name || "Uncategorized"}
                </span></div>
                <div className="flex justify-between pb-2"><span className="text-gray-500">Selling Price</span> <span className="font-bold text-gray-900">${Number(watchedValues.price || 0).toFixed(2)}</span></div>
                <div className="flex justify-between pb-2"><span className="text-gray-500">Stock</span> <span className="font-medium">{watchedValues.stock || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Status</span> 
                  <Badge className={watchedValues.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                    {watchedValues.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </section>

            {/* Status Selector */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-bold text-gray-800">Status</h2>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <RadioGroup onValueChange={(val) => field.onChange(val === "active")} value={field.value ? "active" : "inactive"} className="space-y-3">
                    <div className="flex items-center space-x-3 space-y-0 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="active" id="active" />
                      <label htmlFor="active" className="flex-1 cursor-pointer">
                        <p className="text-sm font-semibold text-gray-900">Active</p>
                        <p className="text-[10px] text-gray-500">Product will be available for sale</p>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="inactive" id="inactive" />
                      <label htmlFor="inactive" className="flex-1 cursor-pointer">
                        <p className="text-sm font-semibold text-gray-900">Inactive</p>
                        <p className="text-[10px] text-gray-500">Product will be hidden from sales</p>
                      </label>
                    </div>
                  </RadioGroup>
                )}
              />
            </section>

            {/* Tips Card */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-3">
              <h3 className="flex items-center gap-2 font-bold text-indigo-900 text-sm"><Info size={16}/> Tips</h3>
              <ul className="text-xs text-indigo-700 space-y-2 list-disc pl-4">
                <li>Use a unique SKU or barcode for easy tracking.</li>
                <li>Set low stock alert to avoid running out of stock.</li>
                <li>High quality images increase sales by 40%.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
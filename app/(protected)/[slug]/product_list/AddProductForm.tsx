"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/schema/inventory.schema";
import { FormInput } from "@/components/reusables/FormInput";
import { Field, FieldLabel } from "@/components/ui/field";
import { Package} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ImageSection } from "@/components/reusables/ImageSection";
import { useEffect, useState } from "react";
import CustomButton from "@/components/reusables/CustomButton";
import { useProductStore } from "@/store/productsStore";
import { AppResponse } from "@/types/auth";

interface AddProductFormProps {
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddProductForm({categories = [],brands = [],onSuccess,onCancel}: AddProductFormProps) {
  const {createProduct} = useProductStore();

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
  const { formState: { isSubmitting }, control, handleSubmit, setValue } = methods;
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);

  useEffect(() => {
    return () => {
      // Because this is a cleanup function, it will use the values 
      // from the last render before unmounting
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
      // 3. Update state instead of ref
      setIsSuccessfullySubmitted(true);
      
      console.log("Submitting Product Data:", data);
      
      try {
        const response = await createProduct(data) as AppResponse;
          if (response.success && response.message) {
            toast.success(response.message);
            if (onSuccess) onSuccess();
          } else {
            toast.error(response.error || "Failed to add employee");
          }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.log("Error from products form: ",error)
        }

      setUploadedFileKey(null);
      toast.success("Product added successfully!");
      if (onSuccess) onSuccess();
      methods.reset();
    } catch (error) {
      setIsSuccessfullySubmitted(false);
      toast.error("Failed to add product");
    }
  };

  const handleCancel = () => {
    if(onCancel) onCancel();
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ImageSection 
          control={control} 
          setValue={setValue} 
          name="imageUrl" 
          endpoint="imageUploader" 
          label="Product Image"
          onImageUpload={(key)=>{
            setUploadedFileKey(key)
            setValue("fileKey", key)
          }}
          onImageRemove={()=> {
            setUploadedFileKey(null)
            setValue("fileKey","")
          }}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="name" label="Product Name" placeholder="e.g. Nike Air Max" />
          <FormInput name="sku" label="SKU / Barcode" placeholder="Scan or type..." />
        </div>

        <FormInput name="description" label="Description" placeholder="Brief details about the product" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="price" label="Selling Price" type="number" />
          <FormInput name="costPrice" label="Cost Price" type="number" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="stock" label="Initial Stock" type="number" />
          <FormInput name="lowStockAlert" label="Low Stock Alert Level" type="number" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="none">None / Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field>
            <FieldLabel>Brand</FieldLabel>
            <Controller
              control={control}
              name="brandId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                  <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                  <SelectContent position="popper">
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

        <div className="flex items-center justify-between p-2 border rounded-md px-4 bg-white shadow-sm">
          <div className="space-y-0.5">
            <FieldLabel className="text-sm">Product Status</FieldLabel>
            <p className="text-xs text-gray-500">Visible to customers in the POS</p>
          </div>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        {/* Updated Actions Section */}
        <div className="pt-4 flex items-center gap-3">
          <CustomButton
            text="Cancel"
            type="button" // Important: keep this as "button" so it doesn't trigger onSubmit
            onClick={handleCancel}
            className="flex-1"
            customVariant="secondary"
          />
          <CustomButton
            text="Save Product"
            type="submit"
            className="flex-1"
            customVariant="primary"
            icon={<Package className="mr-2 h-4 w-4" />}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </FormProvider>
  );
}
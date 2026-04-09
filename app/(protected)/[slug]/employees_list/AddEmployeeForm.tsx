"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateEmployeeSchema, createEmployeeSchema } from "@/types/auth.schema";
import { useState } from "react";
import { FormInput } from "@/components/reusables/FormInput";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEmployeeStore } from "@/store/employeeStore";
import { AppResponse } from "@/types/auth";
import CustomButton from "@/components/reusables/CustomButton";

interface AddEmployeeFormProps {
  roles?: { id: string; name: string }[];
  shops?: { id: string; name: string }[];
  onSuccess?: ()=> void
}

export default function AddEmployeeForm({ roles = [], shops = [],onSuccess}: AddEmployeeFormProps) {
  const {addEmployee} = useEmployeeStore();

  const methods = useForm<CreateEmployeeSchema>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleId: "",
      shopId: undefined, // Using undefined instead of empty string
    },
  });
   const {formState: {isSubmitting}} = methods;

  const onSubmit = async (data: CreateEmployeeSchema) => {
    console.log(data)
    // Convert "floating" string back to undefined/null if that's what Prisma expects
  const payload = {
    ...data,
    shopId: data.shopId === "floating" ? undefined : data.shopId,
  };

  try {
    const response = await addEmployee(payload) as AppResponse;
    if (response.success && response.message) {
      toast.success(response.message);
      if (onSuccess) onSuccess();
    } else {
      toast.error(response.error || "Failed to add employee");
    }
  } catch (error) {
      toast.error("An unexpected error occurred");
  }
    
  };

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={methods.handleSubmit(onSubmit)} 
        className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow border"
      > 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="firstName" label="First Name" placeholder="Isaac" />
          <FormInput name="lastName" label="Last Name" placeholder="Mensah" />
        </div>

        <FormInput name="email" label="Email Address" type="email" placeholder="staff@business.com" />
        <FormInput name="phone" label="Phone Number" placeholder="Optional" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ROLE SELECT */}
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Controller
              control={methods.control}
              name="roleId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  {/* position="popper" keeps the dropdown attached to the trigger! */}
                  <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                    <SelectGroup>
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="null_role" disabled>No roles available</SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* SHOP SELECT */}
          <Field>
            <FieldLabel>Shop (Optional)</FieldLabel>
            <Controller
              control={methods.control}
              name="shopId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Floating / All Shops" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                    <SelectGroup>
                      {/* Using a non-empty string for the 'Unassigned' option */}
                      <SelectItem value="floating">Floating / All Shops</SelectItem>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <CustomButton
        text="Add Employee"
        type="submit"
        customVariant="primary"
        isLoading = {isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
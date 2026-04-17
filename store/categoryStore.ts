import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth";
import { Category } from "@/types/inventory";
import { CreateCategorySchema } from "@/schema/auth.schema";
import { toast } from "sonner";

type CategoryStore = {
    categories: Category[] | null;
    loading: boolean;
    fetchCategories: () => Promise<void>;
    addCategory: (data: CreateCategorySchema) => Promise<AppResponse>;
    updateCategory: (id: string, data: CreateCategorySchema) => Promise<AppResponse>;
    deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get)=>({
    categories: null,
    loading: false,
    fetchCategories: async() => {
        try {
            set({loading: true})
            const response = await apiClient.get("/business/categories");
            set({
                categories: response.data.categories as Category[],
                loading: false
            });
        } catch (error) {
            console.log("Error fetching categories: ", error);
            set({categories: null, loading: false})
        }
    },

    addCategory: async (data: CreateCategorySchema) => {
        set({ loading: true });
        try {
            const response = await apiClient.post("/business/categories", data);
            if (response.data.success) {
                await get().fetchCategories();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({loading: false})
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error creating category";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    updateCategory: async (id: string, data: CreateCategorySchema) => {
        set({ loading: true });
        try {
            const response = await apiClient.patch(`/business/categories/${id}`, data);
            if (response.data.success) {
                await get().fetchCategories();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({loading: false})
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error updating category";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    deleteCategory: async (id: string) => {
        try {
            const response = await apiClient.delete(`/business/categories/${id}`);

            if (response.data.success) {
                set((state) => ({
                    categories: state.categories
                        ? state.categories.filter((category) => category.id !== id)
                        : null,
                }));
                toast.success("Category removed successfully");
            }
        } catch (error: unknown) {
             if (error instanceof AxiosError) {
                const message = error.response?.data?.error || "Cannot delete category with associated products";
                toast.error(message);
            }
            const message = "Cannot delete category with associated products";
            toast.error(message);
        }
    },
}));
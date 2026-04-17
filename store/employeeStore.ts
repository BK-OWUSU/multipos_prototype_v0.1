import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { AxiosError } from "axios";
import { AppResponse, Employee } from "@/types/auth";
import { CreateEmployeeSchema } from "@/schema/auth.schema";
import { toast } from "sonner";

type AuthStore = {
    employees: Employee[] | null;
    loading: boolean;
    fetchEmployees: () => Promise<void>;
    addEmployee: (data: CreateEmployeeSchema) => Promise<AppResponse>;
    toggleEmployeeStatus: (employeeId: string, currentStatus: boolean) => Promise<void>;
    deleteEmployee: (employeeId: string) => Promise<void>;
}

export const useEmployeeStore = create<AuthStore>((set, get)=>({
    employees: null,
    loading: false,
    fetchEmployees: async() => {
        try {
            set({loading: true})
            const response = await apiClient.get("/business/employees");
            set({
                employees: response.data.employees as Employee[],
                loading: false
            });
        } catch (error) {
            console.log("Error fetching user: ", error);
            set({employees: null, loading: false})
        }
    },

    addEmployee: async (data: CreateEmployeeSchema) => {
        set({ loading: true });
        try {
            const response = await apiClient.post("/business/employees", data);
            if (response.data.success) {
                await get().fetchEmployees(); 
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
                const errorMessage = error.response?.data?.error || "Error creating employee";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    toggleEmployeeStatus: async (employeeId: string, currentStatus: boolean) => {
        try {
            const response = await apiClient.patch(`/business/employees/${employeeId}`, {
                isActive: !currentStatus 
            });

            if (response.data.success) {
                // Update local state map
                set((state) => ({
                    employees: state.employees 
                        ? state.employees.map((emp) => emp.id === employeeId ? { ...emp, isActive: !currentStatus } : emp)
                        : null,
                }));
                toast.success(`Employee ${!currentStatus ? 'activated' : 'deactivated'}`);
            }
        } catch (error: unknown) {
            toast.error("Failed to update employee status");
            console.log(error)
        }
    },

    deleteEmployee: async (employeeId: string) => {
        try {
            const response = await apiClient.delete(`/business/employees/${employeeId}`);

            if (response.data.success) {
                set((state) => ({
                    employees: state.employees 
                        ? state.employees.filter((emp) => emp.id !== employeeId)
                        : null,
                }));
                toast.success("Employee removed successfully");
            }
        } catch (error: unknown) {
             if (error instanceof AxiosError) {
                const message = error.response?.data?.error || "Cannot delete employee with transaction history";       
                toast.error(message);
            }
            const message = "Cannot delete employee with transaction history";
            toast.error(message);
        }
    },
}));
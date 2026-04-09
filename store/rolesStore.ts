import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { AppResponse, Role } from "@/types/auth"; // Using your existing response type
import { AxiosError } from "axios";



type RoleStore = {
  roles: Role[];
  loading: boolean;
  fetchRoles: () => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
};

export const useRoleStore = create<RoleStore>((set, get) => ({
  roles: [],
  loading: false,

  fetchRoles: async () => {
    set({ loading: true });
    try {
      console.log("ROLE IN STORE")
      const response = await apiClient.get("/business/roles");
      // Mapping the response.data.roles to the state
      set({ 
        roles: response.data.roles, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      set({ roles: [], loading: false });
    }
  },

  deleteRole: async (roleId: string) => {
    // 1. Guard check: Don't allow deleting system roles
    const roleToDelete = get().roles.find(r => r.id === roleId);
    if (roleToDelete?.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }

    try {
      const response = await apiClient.delete(`/business/roles/${roleId}`);
      if (response.data.success) {
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== roleId),
        }));
        toast.success("Role removed successfully");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
          const message = error.response?.data?.error || "Cannot delete role while users are assigned to it";
          toast.error(message);  
        }else {
          const message = "Cannot delete role while users are assigned to it";
          toast.error(message);
      }  
    }
  },
}));
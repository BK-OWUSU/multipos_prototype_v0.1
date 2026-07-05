import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
// Assuming you have or will add a Shop type to your types directory
import { Shop } from "@/types/types"; 

type ShopStore = {
  shops: Shop[];
  loading: boolean;
  fetchStores: () => Promise<void>;
};

export const useShopStore = create<ShopStore>((set) => ({
  shops: [],
  loading: false,

  fetchStores: async () => {
    set({ loading: true });
    try {
      console.log("SHOP IN STORE");
      // Calling your endpoint to get the multi-tenant shop branches
      const response = await apiClient.get("/business/shops");
      
      // Mapping the response backend array cleanly to the state
      set({ 
        shops: response.data.shops  ?? [], 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching stores:", error);
      set({ shops: [], loading: false });
    }
  },
}));
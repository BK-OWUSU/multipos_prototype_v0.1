import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { LoginResponse, User } from "@/types/auth"
import { LoginSchema } from "@/types/auth.schema";
import { AxiosError } from "axios";

type AuthStore = {
    user: User| null;
    currentSlug: string | null;
    loading: boolean;
    login: (data: LoginSchema)=> Promise<LoginResponse>;
    logout: () => Promise<void>;
    // register: (data: ) => Promise<void>;
    fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get)=>({
    user: null,
    loading: true,
    currentSlug: null,

    fetchUser: async() => {
        try {
            const response = await apiClient.get("/auth/me");
            set({
                user: response.data.user as User,
                currentSlug: response.data.user.business.slug || null, 
                loading: false
            });
        } catch (error) {
            console.log("Error fetching user: ", error);
            set({user: null, loading: false})
        }
    },

    login: async(data) => {
        try {
            const response = await apiClient.post("/auth/login", data);
            //Hydrate user data in the store after successful login
            await get().fetchUser();
            return {
                success: response.data?.success ?? true,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                multipleBusinesses: response.data?.multipleBusinesses,
                businesses: response.data?.businesses
            }
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as LoginResponse;   
                console.log("Login error: ", error);
                return {
                        success: response?.success || false,
                        isVerified: response?.isVerified,
                        redirectTo: response?.redirectTo,
                        error: response?.error,
                        status: error.response?.status || 500
                    };
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as LoginResponse;
        }
    },

    logout: async() => {
        try {
            const response =  await apiClient.post("/auth/logout");
            set({user: null})
            console.log("Response Logout: ", response)
        } catch (error) {
            console.log("Error during logout: ", error);
        }
    }
}));
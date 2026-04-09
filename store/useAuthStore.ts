import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { LoginResponse, OTPResponse, SignUpResponse, User } from "@/types/auth"
import { LoginSchema, OTPFormSchema, PasswordSchema, SignUpFormSchema } from "@/types/auth.schema";
import { AxiosError } from "axios";

type AuthStore = {
    user: User| null;
    currentSlug: string | null;
    loading: boolean;
    login: (data: LoginSchema)=> Promise<LoginResponse>;
    signup: (data: SignUpFormSchema) => Promise<SignUpResponse>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    verifyOtp: (data: OTPFormSchema)=> Promise<OTPResponse>;
    resendOtp: ()=> Promise<OTPResponse>;
    resetPassword: (data: PasswordSchema )=> Promise<SignUpResponse>; //This is similar to signUp response Data structure
}

export const useAuthStore = create<AuthStore>((set, get)=>({
    user: null,
    loading: false,
    currentSlug: null,

    fetchUser: async() => {
        try {
            set({loading: true})
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
                success: response.data?.success,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                multipleBusinesses: response.data?.multipleBusinesses,
                businesses: response.data?.businesses
            } as LoginResponse;
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as LoginResponse;   
                console.log("Login error: ", error);
                return {
                        success: response?.success || false,
                        isVerified: response?.isVerified,
                        redirectTo: response?.redirectTo,
                        error: response?.error,
                        requiresPasswordChange: response?.requiresPasswordChange,
                        status: error.response?.status || 500
                    } as LoginResponse;
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as LoginResponse;
        }
    }, 
    
    signup: async(data) => {
        try {
            const response = await apiClient.post("/auth/signup", data) ;
            return {
                success: response.data?.success,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                message: response.data?.message
            } as SignUpResponse;
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as SignUpResponse;   
                console.log("Registration error: ", error);
                return {
                        success: response?.success || false,
                        redirectTo: response?.redirectTo,
                        error: response?.error,
                        status: error.response?.status || 500
                    } as SignUpResponse;
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as SignUpResponse;
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
    },

    verifyOtp: async (data) => {
        try {
            const response =  await apiClient.post("/auth/verify-otp", {code: data.pin});
            return {
                success: response.data?.success,
                message: response.data?.message,
                businessesSlug: response.data?.businessesSlug,
                requiresPasswordChange: response.data?.requiresPasswordChange,
                status: response.status,
            } as OTPResponse;
        } catch (error) {
             if(error instanceof AxiosError) {
                const response = error.response?.data as OTPResponse;   
                console.log("Verify OTP error: ", error);
                return {
                    success: response?.success || false,
                    error: response?.error,
                    requiresPasswordChange: response?.requiresPasswordChange,
                    status: error.response?.status || 500
                } as OTPResponse;
             }
            return {
                success: false,
                error: "Network error. Please try again.",
                status: 500
            } as OTPResponse
        }
    },

    resendOtp: async () => {
        try {
            const response =  await apiClient.post("/auth/resend-otp") ;
            return {
                success: response.data?.success,
                message: response.data?.message,
                status: response.status,
            } as OTPResponse;
        } catch (error) {
             if(error instanceof AxiosError) {
                const response = error.response?.data as OTPResponse;   
                console.log("Resend OPT error: ", error);
                return {
                    success: response?.success || false,
                    error: response?.error,
                    requiresPasswordChange: response?.requiresPasswordChange,
                    redirectTo: response?.redirectTo,
                    status: error.response?.status || 500
                } as OTPResponse;
             }
            return {
                success: false,
                error: "Network error. Please try again.",
                status: 500
            } as OTPResponse
        }
    },

 resetPassword: async(data) => {
        try {
            const response = await apiClient.post("/auth/reset-password", data) ;
            return {
                success: response.data?.success,
                redirectTo: response.data?.redirectTo,
                status: response?.status,
                message: response.data?.message
            } as SignUpResponse;
        } catch (error: unknown) {
            if(error instanceof AxiosError) {
                const response = error.response?.data as SignUpResponse;   
                console.log("Password reset error: ", error);
                return {
                        success: response?.success || false,
                        error: response?.error,
                        status: error.response?.status || 500
                    } as SignUpResponse;
            }
            return {
            success: false,
            error: "Network error. Please try again.",
            status: 500
        } as SignUpResponse;
        }
    },    
    
}));
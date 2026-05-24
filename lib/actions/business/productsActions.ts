"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths";
import { AppResponse } from "@/types/auth/auth";
// import { createBulkProductService, performBulkProductDeleteService, toggleBulkProductsStatusService } from "@/lib/services/business/product-service";
import { BulkImportResult } from "@/types/schema/bulkupload.schema";
import { ProductImportPayload } from "@/lib/configs/product-config";
import { ProductService } from "@/lib/services/business/product-service";



export async function toggleSingleProductsStatusAction(ids: string) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug } = session;

      const response = await ProductService.toggleSingleProductStatus(ids,userId, businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
    }
  
export async function toggleSingleProductVariantStatusAction(ids: string) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug } = session;

      const response = await ProductService.toggleSingleVariantStatus(ids,userId, businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
    } 


export async function toggleBulkProductsStatusAction(ids: string[]) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug } = session;

      const response = await ProductService.toggleBulkProductsStatus(ids,userId, businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
    }  
    
export async function toggleBulkProductVariantsStatusAction(ids: string[]) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug } = session;

      const response = await ProductService.toggleBulkVariantStatus(ids,userId, businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
    }
    
export async function softDeleteBulkProductsAction(ids: string[]) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug, employeeId } = session;

      const response = await ProductService.softDeleteBulkProducts(ids, userId, employeeId || "", businessId, businessSlug)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
    }
    
export async function softDeleteBulkVariantsAction(ids: string[]) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug, employeeId } = session;

      const response = await ProductService.softDeleteBulkProductVariant(ids, userId, employeeId || "", businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
  }


export async function softDeleteSingleProductAction(id: string) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug, employeeId } = session;

      const response = await ProductService.softDeleteSingleProduct(id, userId, employeeId || "", businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
  } 

export async function softDeleteSingleVariantAction(id: string) {
      const session = await getSession();
      if (!session || typeof session === "string") {
        return { success: false, error: "Unauthorized access." } as AppResponse;
      }
      const { userId, businessId, businessSlug, employeeId } = session;

      const response = await ProductService.softDeleteSingleVariant(id, userId, employeeId || "", businessId)
        if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/product_list`)
        return response;
      }else {
        return response;
      } 
  }  


export async function createBulkProductsAction(payload: { data: ProductImportPayload[]; [key: string]: unknown }) {
    //     const session = await getSession();

    //     // 1. Check Session
    //     if(!session || typeof session === "string") {
    //         return { 
    //             success: false, 
    //             total: 0, 
    //             success_count: 0, 
    //             failed_count: 0, 
    //             error: "Unauthorized session" 
    //         } as BulkImportResult;
    //     }

    //     const { userId, employeeId, businessId, businessSlug } = session;
        
    //     // 2. Call your existing service
    //     const response = await createBulkProductService(
    //         payload, 
    //         userId,
    //         employeeId || "", 
    //         businessId, 
    //         businessSlug
    //     );

    //     // 3. Transform AppResponse to BulkImportResult
    //     if (response.success) {
    //         if (response.redirectTo) revalidatePath(response.redirectTo);
            
    //         return {
    //             success: true,
    //             total: payload.data.length,
    //             success_count: payload.data.length, 
    //             failed_count: 0,
    //             message: response.message
    //         } as BulkImportResult;
    //     }

    //     // 4. Handle Failure
    //     return {
    //         success: false,
    //         total: payload.data.length,
    //         success_count: 0,
    //         failed_count: payload.data.length,
    //         error: response.error
    //     } as BulkImportResult;
    // }


    // export async function deleteProductsAction(ids: string[]) {
    //   const session = await getSession();
    //   if (!session || typeof session === "string") {
    //     return { success: false, error: "Unauthorized access." } as AppResponse;
    //   }

    //   const { userId, businessId, businessSlug } = session;
    //   const response = await performBulkProductDeleteService(ids,userId,businessId, businessSlug);

    //   if (response.success && response.message && response.redirectTo) {
    //     revalidatePath(response.redirectTo)
    //     return response;
    //   }else {
    //     return response;
    //   } 
    }
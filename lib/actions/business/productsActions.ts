"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths";
import { AppResponse } from "@/types/auth/auth";
// import { createBulkProductService, performBulkProductDeleteService, toggleBulkProductsStatusService } from "@/lib/services/business/product-service";
import { BulkImportResult } from "@/types/schema/bulkImport";
import { ProductService } from "@/lib/services/business/product-service";
import { GroupedProductImportPayload } from "@/lib/configs/product-config";



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


export async function createBulkProductsAction(payload: { data: GroupedProductImportPayload[][]; [key: string]: unknown }) {
  // 1. Flatten the data out from the importer's nested structure matrix

  const flatProductItems = payload.data.flat();
  console.log("Received Payload for Bulk Product Creation:");
  console.dir({ flatProductItems }, { depth: null });
  
  // Safely extract optional tracking keys if your base bulk structure sends them
  const trackingKey = typeof payload.key === 'string' ? payload.key : undefined;
  const finalData = { data: flatProductItems, key: trackingKey };

  const session = await getSession();

  // 2. Validate Session Authenticity
  if (!session || typeof session === "string") {
    return { 
      success: false, 
      total: flatProductItems.length, 
      success_count: 0, 
      failed_count: flatProductItems.length, 
      error: "Unauthorized session" 
    } as BulkImportResult;
  }

  const { userId, employeeId, businessId, businessSlug } = session;
  
  // 3. Fire database transaction execution layer 
  const response = await ProductService.createBulkProductsService(
    finalData, 
    userId,
    employeeId || "", 
    businessId,
    businessSlug,
  );

  // 4. Calculate proper item metric balances
  const totalItemsCount = flatProductItems.length;

  // 5. Build and send responses back to the importer engine
  if (response.success) {
    if (response.redirectTo) revalidatePath(response.redirectTo);
    
    return {
      success: true,
      total: totalItemsCount,
      success_count: totalItemsCount, 
      failed_count: 0,
      message: response.message
    } as BulkImportResult;
  }

  // 6. Handle failure outcomes accurately
  return {
    success: false,
    total: totalItemsCount,
    success_count: 0,
    failed_count: totalItemsCount,
    error: response.error
  } as BulkImportResult;
}

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
    
    // return { success: false, error: "Bulk product creation not implemented." } as BulkImportResult;
    // }
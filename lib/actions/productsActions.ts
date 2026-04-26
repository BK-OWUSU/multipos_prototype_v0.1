"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths";
import { AppResponse } from "@/types/auth";
import { performBulkProductDeleteService, toggleBulkProductsStatusService } from "../services/product-service";


export async function deleteProductsAction(ids: string[]) {
  const session = await getSession();
  if (!session || typeof session === "string") {
    return { success: false, error: "Unauthorized access." } as AppResponse;
  }

  const { userId, businessId, businessSlug } = session;
  const response = await performBulkProductDeleteService(ids,userId,businessId, businessSlug);

  if (response.success && response.message && response.redirectTo) {
    revalidatePath(response.redirectTo)
    return response;
  }else {
    return response;
  } 
}



export async function toggleProductsStatusAction(ids: string[]) {
  const session = await getSession();
  if (!session || typeof session === "string") {
    return { success: false, error: "Unauthorized access." } as AppResponse;
  }
  const { userId, businessId, businessSlug } = session;

  const response = await toggleBulkProductsStatusService(ids,userId, businessId, businessSlug);
    if (response.success && response.message && response.redirectTo) {
    revalidatePath(response.redirectTo)
    return response;
  }else {
    return response;
  } 
}
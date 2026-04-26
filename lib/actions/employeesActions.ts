"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths";
import { AppResponse } from "@/types/auth";
import { deleteMultipleUserService, toggleBulkEmployeeStatusService } from "../services/employee-services";



export async function deleteMultipleUser(ids: string[]) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const {userId, businessId, businessSlug} = session;
    
    const response = await deleteMultipleUserService(ids, userId, businessId, businessSlug);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    } 
}

export async function toggleMultipleUser(ids: string[]) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const {userId, businessId, businessSlug} = session;
    
    const response = await toggleBulkEmployeeStatusService(ids, userId, businessId, businessSlug);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    }
}
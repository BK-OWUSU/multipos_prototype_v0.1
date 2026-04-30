"use server"
import { CreateBulkEmployeeSchema } from './../../schema/auth.schema';

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths";
import { AppResponse } from "@/types/auth";
import { softDeleteMultipleUserService, toggleBulkEmployeeStatusService, createBulkEmployeesService } from "../services/employee-services";



export async function deleteMultipleUser(ids: string[]) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const {userId, businessId, businessSlug} = session;
    
    const response = await softDeleteMultipleUserService(ids, userId, businessId, businessSlug);

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

export async function createBulkEmployees(data: typeof CreateBulkEmployeeSchema) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const { employeeId, businessId, businessSlug} = session;
    

    const response = await createBulkEmployeesService(data, employeeId || "", businessId, businessSlug);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    }
}
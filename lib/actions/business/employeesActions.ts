"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths";
import { AppResponse } from "@/types/auth";
import { softDeleteMultipleUserService, toggleBulkEmployeeStatusService, createBulkEmployeesService, grantEmployeeSystemAccess, revokeEmployeeSystemAccess } from "@/lib/services/business/employee-services";
import { EmployeeImportPayload } from '@/lib/configs/employee-config';
import { BulkImportResult } from '@/schema/bulkupload.schema';



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

export async function createBulkEmployees(payload: { data: EmployeeImportPayload[]; [key: string]: unknown }) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { 
            success: false, 
            total: 0, 
            success_count: 0, 
            failed_count: 0, 
            error: "Unauthorized session" 
        } as BulkImportResult;
    }

    const { userId, employeeId, businessId, businessSlug } = session;
    
    // 2. Call your existing service
    const response = await createBulkEmployeesService(
        payload, 
        userId,
        employeeId || "", 
        businessId, 
        businessSlug
    );

    // 3. Transform AppResponse to BulkImportResult
    if (response.success) {
        if (response.redirectTo) revalidatePath(response.redirectTo);
        
        return {
            success: true,
            total: payload.data.length,
            success_count: payload.data.length, 
            failed_count: 0,
            message: response.message
        } as BulkImportResult;
    }

    // 4. Handle Failure
    return {
        success: false,
        total: payload.data.length,
        success_count: 0,
        failed_count: payload.data.length,
        error: response.error
    } as BulkImportResult;
}

export async function grantEmployeeAccess(empId: string) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    const { userId, businessId, employeeId,businessSlug } = session;

    // 2. Call your existing service
    const response = await grantEmployeeSystemAccess(empId, userId, employeeId || "", businessId, businessSlug);

    // 3. Handle Response
    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo);
        return response;
    } else {
        return response;
    }
   
}

export async function revokeEmployeeAccess(employeeId: string) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    const { userId, businessId, businessSlug } = session;

    // 2. Call your existing service
    const response = await revokeEmployeeSystemAccess(employeeId, userId, businessId, businessSlug);

    // 3. Handle Response
    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo);
        return response;
    } else {
        return response;
    }
   
}
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../dbHelper";
import { getSession } from "../auths";
import { AppResponse } from "@/types/auth";
import { deleteUTFile } from "./uploadthing";


export async function deleteProductsAction(ids: string[]) {
  const session = await getSession();
  if (!session || typeof session === "string") {
    return { success: false, error: "Unauthorized access." } as AppResponse;
  }

  const { userId, businessId, businessSlug } = session;

  try {
    // 1. Database Transaction
    const productsWithFiles = await prisma.$transaction(async (tx) => {
      const productsToDelete = await tx.product.findMany({
        where: { id: { in: ids }, businessId: businessId },
      });

      if (productsToDelete.length === 0) throw new Error("No products found.");

      await tx.auditLog.createMany({
        data: productsToDelete.map((product) => ({
          action: "DELETE",
          entity: "PRODUCT",
          entityId: product.id,
          oldValue: JSON.stringify(product),
          userId: userId,
          businessId: businessId,
        })),
      });

      await tx.product.deleteMany({
        where: { id: { in: productsToDelete.map((p) => p.id) }, businessId: businessId },
      });

      // Return the file keys so we can delete them AFTER the transaction succeeds
      return productsToDelete
        .map((p) => p.fileKey)
        .filter((key): key is string => !!key); 
    });

    // 2. Cleanup UploadThing (Now that the DB is definitely updated)
    if (productsWithFiles.length > 0) {
      await Promise.all(productsWithFiles.map((key) => deleteUTFile(key)));
    }

    revalidatePath(`/${businessSlug}/product_list`);

    return {
      success: true,
      message: `Deleted ${ids.length} items and cleaned up storage.`,
    } as AppResponse;

  } catch (error) {
    console.error("BULK_DELETE_ERROR:", error);
    return { success: false, error: "An error occurred." } as AppResponse;
  }
}




export async function toggleProductsStatusAction(ids: string[]) {
  const session = await getSession();
  if (!session || typeof session === "string") {
    return { success: false, error: "Unauthorized access." } as AppResponse;
  }

  const { userId, businessId, businessSlug } = session;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch current status of these products
      const products = await tx.product.findMany({
        where: { id: { in: ids }, businessId: businessId },
        select: { id: true, isActive: true, name: true }
      });

      if (products.length === 0) throw new Error("No products found.");

      // 2. Perform updates individually or via a loop if logic is complex
      // For a simple toggle, we can use Promise.all with individual updates 
      // to ensure each one flips its own boolean
      await Promise.all(
        products.map((product) =>
          tx.product.update({
            where: { id: product.id },
            data: { isActive: !product.isActive },
          })
        )
      );

      // 3. Audit Log
      await tx.auditLog.createMany({
        data: products.map((p) => ({
          action: "UPDATE",
          entity: "PRODUCT",
          entityId: p.id,
          oldValue: JSON.stringify({ isActive: p.isActive }),
          newValue: JSON.stringify({ isActive: !p.isActive }),
          userId: userId,
          businessId: businessId,
        })),
      });
    });

    revalidatePath(`/${businessSlug}/product_list`);

    return {
      success: true,
      message: `Successfully updated status for ${ids.length} products.`,
    } as AppResponse;
  } catch (error) {
    console.error("BULK_STATUS_TOGGLE_ERROR:", error);
    return { success: false, error: "Failed to update products." } as AppResponse;
  }
}
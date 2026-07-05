import { prisma } from "@/lib/dbHelper";
import { getSession } from "@/lib/auths-functions";
import { NextRequest } from "next/server";
import { generateUniqueShopSlug } from "@/lib/slugGenerator";
import { Shop } from "@/types/types"; 
import { AppResponse } from "@/types/auth/auth";

export class ShopService {

static async getShops(businessId: string): Promise<AppResponse> {
  try {

    const shops = await prisma.shop.findMany({
      where: { 
        businessId: businessId,
        isDeleted: false // 🟢 Guard against soft-deleted shop locations
      },
      include: {
        _count: {
          select: { 
            employee: true,
            inventories: true,
            sales: true 
          } 
        }
      },
      orderBy: { name: 'asc' }
    });

    // Keeping your custom property wrapper key plural to match useShopStore
    return { success: true, data: shops as Shop[] } as AppResponse;
  } catch (error) {
    console.error("Fetching Shops Error :", error);
    return { error: "Failed to fetch stores", success: false } as AppResponse;
  }
}

static async postShop(request: NextRequest) {
  try {
    // Get Current user session
    const session = await getSession();
    
    if (!session || typeof session === "string") {
      return { error: "Unauthorized", success: false } as AppResponse;
    }

    

    const body = await request.json();
    const { 
      name, 
      address, 
      phone, 
      city, 
      region, 
      country, 
      gpsAddress, 
      latitude, 
      longitude, 
      openingTime, 
      closingTime 
    } = body;

    if (!name) {
      return { error: "Shop name is required", success: false } as AppResponse;
    }

    const { businessId } = session;
    const shopSlug = await generateUniqueShopSlug(name, businessId);

   
    const newShop = await prisma.shop.create({
      data: {
        name,
        slug: shopSlug,
        address,
        phone,
        city,
        region,
        country,
        gpsAddress,
        latitude,
        longitude,
        openingTime,
        closingTime,
        businessId: businessId,
        isActive: true,
        isDeleted: false
      }
    });

    return { success: true, data: newShop } as AppResponse;
  } catch (error) {
    console.error("Shop Addition Error:", error);
    return { error: "Failed to create shop", success: false } as AppResponse;
  }
}



//End of class
}
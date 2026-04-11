import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(POS_COOKIE_NAME)?.value;
    const decoded = verifyPOSToken(token || "");

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    console.log("From Roles ", decoded)

    const roles = await prisma.role.findMany({
      where: { 
        businessId: decoded.businessId,
        NOT: {
          isSystem: true
        } 
      },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.log("Fetching Roles Error :", error)
    return NextResponse.json({ error: "Failed to fetch roles", success: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(POS_COOKIE_NAME)?.value;
    const decoded = verifyPOSToken(token || "");
    
    
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, permissions, access } = await request.json();

    const newRole = await prisma.role.create({
      data: {
        name,
        permissions, // Array of strings from your Prisma model
        access,      // Array of strings from your Prisma model
        businessId: decoded.businessId,
        isSystem: false // User-created roles are never system roles
      }
    });

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    console.log("Role Addition:" ,error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
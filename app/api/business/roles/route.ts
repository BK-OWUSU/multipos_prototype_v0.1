import { prisma } from "@/lib/dbHelper";
import { getSession} from "@/lib/auths";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
     //Get Current user session
      const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }
    const {businessId} = session
    const roles = await prisma.role.findMany({
      where: { 
        businessId: businessId,
        NOT: {
          isSystem: true
        } 
      },
      include: {
        _count: {
          select: { employee: true }
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
    //Get Current user session
      const session = await getSession();
    
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { name, permissions, access } = await request.json();

    const { businessId } = session;

    const newRole = await prisma.role.create({
      data: {
        name,
        permissions, // Array of strings from  Prisma model
        access,      // Array of strings from  Prisma model
        businessId: businessId,
        isSystem: false // User-created roles are never system roles
      }
    });

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    console.log("Role Addition:" ,error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
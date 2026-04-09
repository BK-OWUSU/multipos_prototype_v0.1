import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(POS_COOKIE_NAME)?.value;
    const decoded = verifyPOSToken(token || "");

    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { isActive } = await request.json();

    await prisma.user.update({
      where: { id, businessId: decoded.businessId },
      data: { isActive }
    });

    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(POS_COOKIE_NAME)?.value;
    const decoded = verifyPOSToken(token || "");

    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use a transaction if you want to log the deletion before it happens
    await prisma.user.delete({
      where: { id, businessId: decoded.businessId }
    });

    return NextResponse.json({ success: true, message: "Employee deleted" });
  } catch (error: unknown) {
    // Prisma error P2003 is usually a Foreign Key constraint (e.g. they have sales)
    // if (error.code === 'P2003') {
    //    return NextResponse.json({ 
    //      error: "Cannot delete employee with transaction history. Deactivate them instead.", 
    //      success: false 
    //    }, { status: 400 });
    // }
    return NextResponse.json({ error: "Delete failed", success: false }, { status: 500 });
  }
}
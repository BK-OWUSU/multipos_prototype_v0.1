import { prisma } from "@/lib/dbHelper";
import { getSession} from "@/lib/auths";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    //Get current user session
    const session = await getSession();
    const { id } = await params;
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } 
    const { isActive } = await request.json();

    await prisma.user.update({
      where: { id, businessId: session.businessId },
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
    //Get current user session
    const session  = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use a transaction if you want to log the deletion before it happens
    await prisma.user.delete({
      where: { id, businessId: session.businessId }
    });

    return NextResponse.json({ success: true, message: "Employee deleted" });
  } catch (error: unknown) {
    // Prisma error P2003 is usually a Foreign Key constraint (e.g. they have sales)
      if (error instanceof Error && 'code' in error && error.code === 'P2003') {
                return NextResponse.json({
                    error: "Cannot delete employee with transaction history. Deactivate it instead.",
                    success: false
                }, { status: 400 });
            }   
    return NextResponse.json({ error: "Delete failed", success: false }, { status: 500 });
  }
}
import { getSession } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { mapUserToResponse } from "@/lib/mappers";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        console.log("EIIIII")
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const {userId} = session;
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: true,
                business: true
            }
        });

        console.log(dbUser)

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        const user = mapUserToResponse(dbUser);
        return NextResponse.json({success: true, user }, { status: 200 });
    } catch (error) {
        console.error("Auth me error:", error);
        return NextResponse.json({error: "Internal Server Error" },{ status: 500 });
    }
}
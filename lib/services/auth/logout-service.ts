import { prisma } from "@/lib/dbHelper";
import { AppResponse, JwtPayload } from "@/types/auth/auth";

export class LogoutService {
    static async logout( session: JwtPayload): Promise<AppResponse> {

        if (!session || typeof session === "string") {
                return { error: "User already logout", success: false ,status: 401 } as AppResponse;
        }

        const {sessionLogId} = session; 

        await prisma.userSessionLog.update({
            where: {id: sessionLogId},
            data: {
            logoutAt: new Date()
            } 
        })

    return {success: true, message: "Logged out successfully" , status: 200 }
    }

}
import { getSession} from "@/lib/auths";
import { NextRequest, NextResponse } from "next/server";
import { deleteBrandService, getBrandByIdService, updateBrandService } from "@/lib/services/business/brand-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        //Get Current user session
        const session = await getSession();
        const { id } = await params;
        
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 }); 
        }

        const { businessId } = session;
        const response = await getBrandByIdService(id, businessId);

        if (!response.success || !response.brands) {
            return NextResponse.json({ success: false, error: response.error }, { status: response.status });
        }

        const brandsData = response.brands;
        return NextResponse.json({ success: true, brands: brandsData }, { status: 200 });        
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        //Get Current user session
        const session = await getSession();
        const { id } = await params;

        if (!session || typeof session === "string"){
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId, businessId } = session;
        const body = await request.json();
        const response = await updateBrandService(id, body, userId, businessId, session.businessSlug);
        if (response.success && response.message) {
           return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
           return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }     

}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
         //Get Current user session
        const session = await getSession();
        const { id } = await params;
        
        if (!session || typeof session === "string"){
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId, businessId } = session;
        const response = await deleteBrandService(id, userId, businessId, session.businessSlug);
        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }   
       
}
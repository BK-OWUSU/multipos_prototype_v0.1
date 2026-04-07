"use client"
import {useEffect} from "react"
import { AppSidebar } from "@/components/app-sidebar"
// import ProtectedRoute from "@/components/auth/ProtectedRoute"
import LogoutButton from "@/components/LogoutButton"
import {Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,BreadcrumbPage,BreadcrumbSeparator,} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {SidebarInset,SidebarProvider,SidebarTrigger,} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
//
import { 
  usePathname, 
  // useRouter 
} from "next/navigation"
import { Toaster } from "sonner"

export default function MainLayout({children}:{children: React.ReactNode}) {
  const pathname = usePathname();
  const {user, currentSlug, fetchUser, loading } = useAuthStore();
  const slug = pathname.split("/")[1]
  const router = useRouter();
  
  const title = pathname.split("/")[1];
  const pageTitle = title.includes("_") ? title.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : title.charAt(0).toUpperCase() + title.slice(1);
  //Hydration: Fetch user
  useEffect(()=> {
    if (!user) {
      fetchUser();
    } 
  }, [user,fetchUser,])

  // TENANT PROTECTION: Ensure user belongs to this slug
  useEffect(() => {
    if (!loading && user && slug && currentSlug !== slug) {
      router.push(`/${currentSlug}/dashboard`);
    }
  }, [user, loading, slug, currentSlug, router]);

  // LOADING GUARD: Prevent UI flicker while fetching user
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-900"></div>
          <p className="animate-pulse text-sm text-muted-foreground  italic">Syncing your workspace...</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      {/* <ProtectedRoute> */}
      <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-50 flex h-16 justify-between shrink-0 items-center gap-2 border-b px-4">
        <div className="flex gap-5 items-center">
          <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">multiPOS</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          </div>
          <div className="p-5">
            {/* {Some codes here for Future analysis} */}
          </div>
        </div>
        <LogoutButton /> 
        </header>
       {/* Content — changes per route */}
        <main className="flex flex-1 flex-col gap-4 p-4">
          {children}
          {/* Toaster */}
          <Toaster position="top-right" richColors /> 
        </main>
      </SidebarInset>
     </SidebarProvider>
      {/* </ProtectedRoute> */}
    </div>
  )
}

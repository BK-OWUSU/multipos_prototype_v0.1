"use client"
import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import LogoutButton from "@/components/LogoutButton"
import {Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,BreadcrumbPage,BreadcrumbSeparator,} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {SidebarInset,SidebarProvider,SidebarTrigger} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter, usePathname } from "next/navigation"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, currentSlug, fetchUser, loading } = useAuthStore();
  const router = useRouter();

  // // Determine toast position dynamically
  // const getToastPosition = () => {
  //   if (pathname.endsWith("/reset-password")) return "bottom-center";
  //   if (pathname.includes("/sales")) return "top-center"; // Example for specific modules
  //   return "top-right"; // Default
  // };

  // Extract slug and determine if this is a system route
  
  const slug = pathname.split("/")[1];
  const isResetPasswordPage = pathname.endsWith("/reset-password");

  // Dynamic Page Title logic
  const title = pathname.split("/")[2] || slug;
  const pageTitle = title.includes("_") 
    ? title.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") 
    : title.charAt(0).toUpperCase() + title.slice(1);

  // 1. HYDRATION: Fetch user only if NOT on reset-password page
  useEffect(() => {
    if (!user && !isResetPasswordPage) {
      fetchUser();
    }
  }, [user, fetchUser, isResetPasswordPage]);

  // 2. TENANT PROTECTION: Ensure user belongs to this slug
  useEffect(() => {
    if (!loading && user && slug && currentSlug !== slug && !isResetPasswordPage) {
      router.push(`/${currentSlug}/dashboard`);
    }
  }, [user, loading, slug, currentSlug, router, isResetPasswordPage]);

  // 3. LOADING GUARD: Bypass for reset-password page
  // We don't show the "Syncing" spinner if the user is here to reset their password
  if (!isResetPasswordPage && (loading || !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-900"></div>
          <p className="animate-pulse text-sm text-muted-foreground italic">Syncing your workspace...</p>
        </div>
      </div>
    );
  }

  // 4. CLEAN LAYOUT FOR RESET PASSWORD
  // Since they don't have a POS token yet, they shouldn't see the sidebar/header
  if (isResetPasswordPage) {
    return (
      <main className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" richColors />
      </main>
    );
  }

  // 5. STANDARD DASHBOARD LAYOUT
  return (
     <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex p-2 h-16 shrink-0 items-center gap-2 transition-[width,height] justify-between ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                 <BreadcrumbLink href={`/${slug}/dashboard`}>multiPOS</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
           <LogoutButton />
        </header>
         <main className="flex flex-1 flex-col gap-4 p-4">
            <TooltipProvider>
               {children}
              </TooltipProvider>
            <Toaster position="top-right" richColors />
          </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
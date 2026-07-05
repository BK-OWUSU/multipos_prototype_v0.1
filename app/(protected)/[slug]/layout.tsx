"use client"
import { useEffect, useRef } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,BreadcrumbPage,BreadcrumbSeparator,} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {SidebarInset,SidebarProvider,SidebarTrigger} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter, usePathname } from "next/navigation"
import { toast, Toaster } from "sonner"
import { SessionInfo } from "@/components/formatSessionDate"
import { NavbarNotifications } from "@/components/NavbarNotifications"
import { NavbarUser } from "@/components/NavbarUser"


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, currentSlug, fetchUser, loading } = useAuthStore();
  const router = useRouter();
  const hasToasted = useRef(false);


  //Rendering User Session Details
  useEffect(()=> {
    // 1. Guard Clause: If anything is missing or we already toasted, stop here.
    if (loading || !user?.session || hasToasted.current) {
        return
      }
      // Create a constant to satisfy
      const session = user.session;

      const sessionNotify = localStorage.getItem("sessionNotify");
      if (sessionNotify === "true") {
        return;
      }

      localStorage.setItem("sessionNotify", "true")

      toast.custom((t) => (
        <div className="bg-white border shadow-lg rounded-lg p-4 w-87.5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <h4 className="font-bold text-sm text-slate-900">Security Snapshot</h4>
          </div>
          
          {/* Use the SessionInfo component inside the toast */}
          <SessionInfo 
            currentLoginAt={session.currentLoginAt}
            lastLoginAt={session.lastLoginAt}
            logoutAt={session.logoutAt}
            ipAddress={session.ipAddress}
            userAgent={session.userAgent}
          />
          
          <button 
            onClick={() => toast.dismiss(t)}
            className="mt-3 w-full bg-slate-900 text-white py-2 rounded-md text-[11px] font-bold uppercase hover:bg-slate-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      ), {
        duration: Infinity,
        // duration: 15000, //15 seconds
        position: "bottom-right",
      });

      hasToasted.current = true;
    
  },[loading, user])

  
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
      if (user.role.access.includes("dashboard")){
        console.log(user.role.access)
        router.push(`/${currentSlug}/dashboard`);
      }else {
        console.log(user.role.access)
        const access = user.role.access;
        router.push(`/${currentSlug}/${access[0]}`)
      }
    }
  }, [user, loading, slug, currentSlug, router, isResetPasswordPage]);

  // 3. LOADING GUARD: Bypass for reset-password page
  // We don't show the "Syncing" spinner if the user is here to reset their password
  if (!isResetPasswordPage && (loading || !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-900"></div>
          <p className="animate-pulse text-2xl text-muted-foreground italic">Syncing your workspace...</p>
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
        <header className="flex bg-transparent z-10  backdrop-blur-md sticky top-0  border-b p-2 h-16 shrink-0 items-center gap-2 transition-[width,height] justify-between ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
           {/* Top Right NavBar Section */}
           <div className="flex items-center gap-6">
            <NavbarNotifications />
            <NavbarUser />
          </div>
        </header>
         <main className="flex flex-1 flex-col gap-4 p-4">
               {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
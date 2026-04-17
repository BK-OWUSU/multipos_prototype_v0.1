"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useAuthStore } from "@/store/useAuthStore"
import { getNavData, filterNavData } from "@/lib/nav-data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentSlug, user, } = useAuthStore();

  const businessName = user?.business.name;
  // 1. Get and Filter Navigation Data based on user permissions
  const filteredNavData = React.useMemo(() => {
    if (!user || !currentSlug) return [];
    const rawData = getNavData(currentSlug);
    return filterNavData(rawData, user);
  }, [user, currentSlug]);

  // 2. Map User data to the format NavUser expects
  const userData = {
    name: user ? `${user.firstName} ${user.lastName}` : "User",
    email: user?.email || "",
    avatar: "", // Add avatar URL if available in your User model
  };

  // 3. Map Business data to the format TeamSwitcher expects
  const teamsData = [
    {
      name: businessName || "MultiPOS",
      logo: GalleryVerticalEnd, // You can make this dynamic later
      plan: user?.role?.name || "Member",
    },
  ];

  return (
    <Sidebar collapsible="icon" className=" bg-blue-950" {...props}>
      <SidebarHeader className="bg-blue-950 text-white border-b border-blue-900/50">
        <TeamSwitcher teams={teamsData} />
      </SidebarHeader>
      
      <SidebarContent className="bg-blue-950 text-white">
        <NavMain items={filteredNavData} />
      </SidebarContent>

      <SidebarFooter className="bg-blue-950 text-white border-t border-blue-900/50">
        <NavUser user={userData} />
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}
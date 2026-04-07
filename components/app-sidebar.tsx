"use client"
import * as React from "react"
// import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {Collapsible,CollapsibleContent,CollapsibleTrigger} from "@/components/ui/collapsible"
import {Sidebar,SidebarContent,SidebarGroup,SidebarGroupContent,SidebarGroupLabel,SidebarHeader,SidebarMenu,SidebarMenuButton,SidebarMenuItem,SidebarRail,} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { NavItem } from "@/types/types"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { filterNavData, getNavData } from "@/lib/nav-data"
import { useAuthStore } from "@/store/useAuthStore"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const {currentSlug, user} = useAuthStore();
  const businesses: string[] = ["Business A", "Business B", "Business C"];
  const navData = React.useMemo(() => 
      currentSlug ? getNavData(currentSlug) : [],
      [currentSlug]
  );
  const filteredNavData = React.useMemo(() => 
      user ? filterNavData(navData, user) : [],
      [user, navData]
  );

  const storageKey = `sidebar_open_group_${currentSlug}`;
  const [openGroup, setOpenGroup] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
    }
    // On first load, open the group whose child matches current route
    const activeGroup = filteredNavData.find((group) =>
      group.items.some((child) => child.url === pathname)
    )
    return activeGroup ? activeGroup.title : null
  });

  // 2. Persist to LocalStorage whenever openGroup changes
  React.useEffect(() => {
    if (openGroup) {
      localStorage.setItem(storageKey, openGroup);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [openGroup, storageKey]);

  //Updating the open group, when route changes
  React.useEffect(() => {
    const activeGroup = filteredNavData.find((group) =>
      group.items.some((child) => child.url === pathname)
    )
    setOpenGroup(activeGroup ? activeGroup.title : null)
  }, [pathname,filteredNavData])
  
  return (
<Sidebar {...props}>
      <SidebarHeader className="bg-blue-950 text-white">
        <VersionSwitcher
          versions={businesses}
          defaultVersion={businesses[0]}
        />
      
      </SidebarHeader>
      <SidebarContent className="gap-0 bg-blue-950">
        {filteredNavData.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            open={openGroup === item.title}  // ← controlled open state
            onOpenChange={(isOpen) => {
              // if opening this group, close others by setting only this one
              // if closing, set to null
              setOpenGroup(isOpen ? item.title : null)
            }}
            className="group/collapsible text-white"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className={`group/label bg-blue-950 text-white  hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm`}
              >
                <CollapsibleTrigger className={`flex mb-1 items-center gap-2 ${openGroup === item.title ? "animate-pulse" : ""}`}>
                  {item.icon &&  <item.icon size={20} />}
                  {item.title}
                  <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((child: NavItem) => (
                      <SidebarMenuItem key={child.title}>
                        <SidebarMenuButton asChild isActive={child.url === pathname}>
                          {child.isExternal ? (
                            <a href={child.url} target="_blank" rel="noopener noreferrer">
                              {child.icon &&  <child.icon size={20} />}
                              {child.title}
                            </a>
                          ) : (
                            <Link href={child.url} className="flex items-center gap-2">
                               {child.icon &&  <child.icon size={20} />}
                              <span>{child.title}</span>
                            </Link>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { NavGroup } from "@/types/types"

export function NavMain({ items }: { items: NavGroup[] }) {
  const pathname = usePathname();

  // 1. Manage state for which group is currently expanded
  const [openGroup, setOpenGroup] = React.useState<string | null>(() => {
    const activeGroup = items.find((group) =>
      group.items?.some((sub) => sub.url === pathname)
    );
    return activeGroup ? activeGroup.title : null;
  });

  // 2. Keep sidebar expanded if user navigates via breadcrumbs/URL
  React.useEffect(() => {
    const activeGroup = items.find((group) =>
      group.items?.some((sub) => sub.url === pathname)
    );
    if (activeGroup) {
      setOpenGroup(activeGroup.title);
    }
  }, [pathname, items]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((group) => {
          const isChildActive = group.items?.some((sub) => sub.url === pathname);
          const isOpen = openGroup === group.title;

          return (
            <Collapsible
              key={group.title}
              asChild
              open={isOpen} // Controlling the state
              onOpenChange={(open) => {
                // If opening this group, it becomes the ONLY one open
                setOpenGroup(open ? group.title : null);
              }}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild
                  className={`mb-2 ${isChildActive ? "font-extrabold animate-pulse" : ""}`}
                >
                  <SidebarMenuButton 
                  // tooltip={group.title}
                  >
                    {group.icon && <group.icon className="h-4 w-4" />}
                    <span>{group.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          className="text-white"
                          asChild 
                          isActive={pathname === subItem.url}
                        >
                          {subItem.isExternal ? (
                            <a href={subItem.url} target="_blank" rel="noopener noreferrer">
                              {subItem.icon && <subItem.icon className="h-4 w-4 text-white" />}
                              <span>{subItem.title}</span>
                            </a>
                          ) : (
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon className="h-4 w-4 text-white" />}
                              <span>{subItem.title}</span>
                            </Link>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
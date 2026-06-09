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
  const pathname = usePathname()

  // Manage which group is expanded (only one at a time)
  const [openGroup, setOpenGroup] = React.useState<string | null>(() => {
    const activeGroup = items.find((group) =>
      group.items?.some((sub) => sub.url === pathname) || group.url === pathname
    )
    return activeGroup ? activeGroup.title : null
  })

  // Auto-expand the correct group when URL changes (supports direct navigation)
  React.useEffect(() => {
    const activeGroup = items.find((group) =>
      group.items?.some((sub) => sub.url === pathname) || group.url === pathname
    )
    if (activeGroup) {
      setOpenGroup(activeGroup.title)
    }
  }, [pathname, items])

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((group) => {
          const isActive = 
            group.url === pathname || 
            group.items?.some((sub) => sub.url === pathname)

          const hasSubItems = group.items && group.items.length > 0
          const isOpen = openGroup === group.title

          // --- CONDITION 1: MENU ITEM HAS SUB-ITEMS (COLLAPSIBLE DRAWER) ---
          if (hasSubItems) {
            return (
              <Collapsible
                key={group.title}
                asChild
                open={isOpen}
                onOpenChange={(open) => {
                  setOpenGroup(open ? group.title : null)
                }}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      tooltip={group.title}
                      className={isActive ? "font-extrabold animate-pulse" : ""}
                    >
                      {group.icon && <group.icon className="h-4 w-4" />}
                      <span>{group.title}</span>
                      <ChevronRightIcon 
                        className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" 
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {group.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            className="text-white hover:text-blue-950 transition-colors" 
                            asChild 
                            isActive={pathname === subItem.url}
                          >
                            {subItem.isExternal ? (
                              <a 
                                href={subItem.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                {subItem.icon && <subItem.icon className="h-4 w-4 transition-colors" />}
                                <span>{subItem.title}</span>
                              </a>
                            ) : (
                              <Link href={subItem.url}>
                                {subItem.icon && <subItem.icon className="h-4 w-4 transition-colors" />}
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
            )
          }

          // --- CONDITION 2: STANDALONE LINK (E.G. DASHBOARD PAGE) ---
          return (
            <SidebarMenuItem key={group.title}>
              <SidebarMenuButton
                tooltip={group.title}
                className={isActive ? "font-extrabold animate-pulse" : ""}
                asChild
              >
                {group.url.startsWith('http') ? (
                  <a href={group.url} target="_blank" rel="noopener noreferrer">
                    {group.icon && <group.icon className="h-4 w-4" />}
                    <span>{group.title}</span>
                  </a>
                ) : (
                  <Link href={group.url || "#"}>
                    {group.icon && <group.icon className="h-4 w-4" />}
                    <span>{group.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
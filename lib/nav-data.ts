// lib/nav-data.ts
import { User } from "@/types/auth";
import { NavGroup } from "@/types/types";
import hasAccess from "./accessPermissionSecurity";

import {
   ChartNetwork,ShoppingBasket,Settings,HelpCircle,Users,FileUser,PackageSearch
  } from "lucide-react";

export const getNavData = (slug: string): NavGroup[] => [
  {
    title: "Reports",
    url: "#",
    accessKey: "reports",
    items: [
      { title: "Dashboard", url: `/${slug}/dashboard`, accessKey: "dashboard" },
      { title: "Sales Summary", url: `/${slug}/sale_summary`, accessKey: "sale_summary" },
      { title: "Sale By Category", url: `/${slug}/sale_category`, accessKey: "sale_category" },
      { title: "Sale By Employee", url: `/${slug}/sale_employee`, accessKey: "sale_employee" },
      { title: "Sale By Payment", url: `/${slug}/sale_payment-type`, accessKey: "sale_payment-type" },
    ],
    icon: ChartNetwork
  },
  {
    title: "POS",
    url: "#",
    accessKey: "pos",
    items: [
      { title: "Sales Terminal", url: `/${slug}/sales-terminal`, accessKey: "sales-terminal" },
      { title: "Transactions", url: `/${slug}/transactions`, accessKey: "transactions" },
      { title: "Invoices", url: `/${slug}/invoices`, accessKey: "invoices" },
    ],
    icon: ShoppingBasket
  },
  {
    title: "Product",
    url: "#",
    accessKey: "product",
    items: [
      { title: "Product List", url: `/${slug}/product_list`, accessKey: "product_list" },
      { title: "Categories", url: `/${slug}/categories`, accessKey: "categories" },
      { title: "Discount", url: `/${slug}/discount`, accessKey: "discount" },
    ],
    icon: PackageSearch
  },
  {
    title: "Employee",
    url: "#",
    accessKey: "employee",
    items: [
      { title: "Employee List", url: `/${slug}/employees_list`, accessKey: "employees_list" },
      { title: "Time Cards", url: `/${slug}/time_cards`, accessKey: "time_cards" },
      { title: "Total Hours Worked", url: `/${slug}/total_hours_worked`, accessKey: "total_hours_worked" },
    ],
    icon: Users
  },
  {
    title: "Customers",
    url: "#",
    accessKey: "customers",
    items: [
      { title: "Customer Base", url: `/${slug}/customers_base`, accessKey: "customers_base" },
      { title: "Loyalty", url: `/${slug}/loyalty`, accessKey: "loyalty" },
    ],
    icon: FileUser
  },
  {
    title: "Settings",
    url: "#",
    accessKey: "settings",
    items: [
      { title: "Access Controls", url: `/${slug}/access_controls`, accessKey: "access_controls" },
      { title: "Shops", url: `/${slug}/shops`, accessKey: "shops" },
    ],
    icon: Settings
  },
  {
    title: "Help",
    url: "#",
    accessKey: "help",
    items: [
      { title: "Community", url: "#", isExternal: true, accessKey: "community" },
      { title: "Chat", url: "#", isExternal: true, accessKey: "chat" },
    ],
    icon: HelpCircle
  },
];


export function filterNavData(navData: NavGroup[], user: User): NavGroup[] {
  return navData
    .map((group) => {
      // Filter items inside group
      const filteredItems = group.items?.filter((item) =>
        hasAccess(user, item.accessKey)
      );

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => group.items && group.items.length > 0); // remove empty groups
}
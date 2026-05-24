// lib/nav-data.ts
import { User } from "@/types/auth/auth";
import { NavGroup } from "@/types/types";
import hasAccess from "./accessPermissionSecurity";

import {
  ChartNetwork, ShoppingBasket, Settings, HelpCircle, Users, FileUser, PackageSearch,
  LayoutDashboard, HandCoins, ChartColumnStacked, BookUser, Banknote,
  Monitor, ArrowRightLeft, FileText, List, Layers, Percent, PackagePlus,
  UserRoundCog, Clock, Hourglass, Contact2, Trophy, ShieldCheck,
  Store, MessageSquare, Globe,Dices,
  icons
} from "lucide-react";


export const navConfig = [
  {
    title: "Dashboard",
    accessKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Reports",
    accessKey: "reports",
    icon: ChartNetwork,
    items: [
      { title: "Sales Summary", accessKey: "sale_summary", icon: Banknote },
      { title: "Sale By Category", accessKey: "sale_category", icon: ChartColumnStacked },
      { title: "Sale By Employee", accessKey: "sale_employee", icon: BookUser },
      { title: "Sale By Payment", accessKey: "sale_payment-type", icon: HandCoins },
    ],
  },
  {
    title: "POS",
    accessKey: "pos",
    icon: ShoppingBasket,
    items: [
      { title: "Sales Terminal", accessKey: "sales_terminal", icon: Monitor },
      { title: "Transactions", accessKey: "transactions", icon: ArrowRightLeft },
      { title: "Invoices", accessKey: "invoices", icon: FileText },
    ],
  },
  {
    title: "Product",
    accessKey: "product",
    icon: PackageSearch,
    items: [
      { title: "Product List", accessKey: "product_list", icon: List },
      { title: "Add Product", accessKey: "add_product", icon: PackagePlus },
      { title: "Categories", accessKey: "categories", icon: Layers },
      { title: "Brands", accessKey: "brands", icon: Dices },
      { title: "Discount", accessKey: "discount", icon: Percent },
    ],
  },
  {
    title: "Employee",
    accessKey: "employee",
    icon: Users,
    items: [
      { title: "Employee List", accessKey: "employees_list", icon: UserRoundCog },
      { title: "Time Cards", accessKey: "time_cards", icon: Clock },
      { title: "Total Hours Worked", accessKey: "total_hours_worked", icon: Hourglass },
    ],
  },
  {
    title: "Customers",
    accessKey: "customers",
    icon: FileUser,
    items: [
      { title: "Customer Base", accessKey: "customers_base", icon: Contact2 },
      { title: "Loyalty", accessKey: "loyalty", icon: Trophy },
    ],
  },
  {
    title: "Settings",
    accessKey: "settings",
    icon: Settings,
    items: [
      { title: "Access Controls", accessKey: "access_controls", icon: ShieldCheck },
      { title: "Shops", accessKey: "shops", icon: Store },
    ],
  },
  {
    title: "Help",
    accessKey: "help",
    icon: HelpCircle,
    items: [
      { title: "Community", accessKey: "community", icon: Globe },
      { title: "Chat", accessKey: "chat", icon: MessageSquare },
    ],
  },
];

export const getNavData = (slug: string): NavGroup[] => {
  return navConfig.map((group) => ({
    ...group,
    url: group.accessKey === "dashboard"
      ? `/${slug}/dashboard`
      : "#",
    items: group.items?.map((item) => ({
      ...item,
      url: `/${slug}/${item.accessKey}`,
    })),
  }));
};


export function filterNavData(navData: NavGroup[], user: User): NavGroup[] {
  return navData
    .map((group) => {
      if (group.items?.length) {
        const hasParentAccess = hasAccess(user, group.accessKey);

        const filteredItems = group.items.filter((item) =>
          hasAccess(user, item.accessKey)
        );
        // Show group if:
        // - parent allowed OR
        // - at least one child allowed
        if (hasParentAccess || filteredItems.length > 0) {
          return {
            ...group,
            items: filteredItems,
          };
        }

        return null;
      } else {
        return hasAccess(user, group.accessKey) ? group : null;
      }
    })
    .filter((group): group is NavGroup => group !== null);
}


export const getAccessOnly = () => {
  return navConfig.map(group => ({
    title: group.title,
    accessKey: group.accessKey,
    icon: group.icon,
    items: group.items?.map(item => ({
      title: item.title,
      accessKey: item.accessKey,
      icon: item.icon
    })),
  }));
};

export const getAllAccessKeys = () => {
  return navConfig.flatMap(group => [
    group.accessKey,
    ...(group.items?.map(item => item.accessKey) || [])
  ]);
};
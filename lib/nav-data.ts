// lib/nav-data.ts
import { User } from "@/types/auth";
import { NavGroup } from "@/types/types";
import hasAccess from "./accessPermissionSecurity";

import {
  ChartNetwork, ShoppingBasket, Settings, HelpCircle, Users, FileUser, PackageSearch,
  LayoutDashboard, HandCoins, ChartColumnStacked, BookUser, Banknote,
  Monitor, ArrowRightLeft, FileText, List, Layers, Percent, PackagePlus,
  UserRoundCog, Clock, Hourglass, Contact2, Trophy, ShieldCheck,
  Store, MessageSquare, Globe,Dices
} from "lucide-react";

export const getNavData = (slug: string): NavGroup[] => [
  { title: "Dashboard", url: `/${slug}/dashboard`, accessKey: "dashboard", icon: LayoutDashboard 

},
  {
    title: "Reports",
    url: "#",
    accessKey: "reports",
    icon: ChartNetwork,
    items: [
      { title: "Sales Summary", url: `/${slug}/sale_summary`, accessKey: "sale_summary", icon: Banknote },
      { title: "Sale By Category", url: `/${slug}/sale_category`, accessKey: "sale_category", icon: ChartColumnStacked },
      { title: "Sale By Employee", url: `/${slug}/sale_employee`, accessKey: "sale_employee", icon: BookUser },
      { title: "Sale By Payment", url: `/${slug}/sale_payment-type`, accessKey: "sale_payment-type", icon: HandCoins },
    ],
  },
  {
    title: "POS",
    url: "#",
    accessKey: "pos",
    icon: ShoppingBasket,
    items: [
      { title: "Sales Terminal", url: `/${slug}/sales_terminal`, accessKey: "sales_terminal", icon: Monitor },
      { title: "Transactions", url: `/${slug}/transactions`, accessKey: "transactions", icon: ArrowRightLeft },
      { title: "Invoices", url: `/${slug}/invoices`, accessKey: "invoices", icon: FileText },
    ],
  },
  {
    title: "Product",
    url: "#",
    accessKey: "product",
    icon: PackageSearch,
    items: [
      { title: "Product List", url: `/${slug}/product_list`, accessKey: "product_list", icon: List },
      { title: "Add Product", url: `/${slug}/add_product`, accessKey: "add_product", icon: PackagePlus },
      { title: "Categories", url: `/${slug}/categories`, accessKey: "categories", icon: Layers },
      { title: "Brands", url: `/${slug}/brands`, accessKey: "brands", icon: Dices },
      { title: "Discount", url: `/${slug}/discount`, accessKey: "discount", icon: Percent },
    ],
  },
  {
    title: "Employee",
    url: "#",
    accessKey: "employee",
    icon: Users,
    items: [
      { title: "Employee List", url: `/${slug}/employees_list`, accessKey: "employees_list", icon: UserRoundCog },
      { title: "Time Cards", url: `/${slug}/time_cards`, accessKey: "time_cards", icon: Clock },
      { title: "Total Hours Worked", url: `/${slug}/total_hours_worked`, accessKey: "total_hours_worked", icon: Hourglass },
    ],
  },
  {
    title: "Customers",
    url: "#",
    accessKey: "customers",
    icon: FileUser,
    items: [
      { title: "Customer Base", url: `/${slug}/customers_base`, accessKey: "customers_base", icon: Contact2 },
      { title: "Loyalty", url: `/${slug}/loyalty`, accessKey: "loyalty", icon: Trophy },
    ],
  },
  {
    title: "Settings",
    url: "#",
    accessKey: "settings",
    icon: Settings,
    items: [
      { title: "Access Controls", url: `/${slug}/access_controls`, accessKey: "access_controls", icon: ShieldCheck },
      { title: "Shops", url: `/${slug}/shops`, accessKey: "shops", icon: Store },
    ],
  },
  {
    title: "Help",
    url: "#",
    accessKey: "help",
    icon: HelpCircle,
    items: [
      { title: "Community", url: "#", isExternal: true, accessKey: "community", icon: Globe },
      { title: "Chat", url: "#", isExternal: true, accessKey: "chat", icon: MessageSquare },
    ],
  },
];


export function filterNavData(navData: NavGroup[], user: User): NavGroup[] {
  return navData
    .map((group) => {
      if (group.items?.length) {
        // Group with children
        const filteredItems = group.items.filter((item) =>
          hasAccess(user, item.accessKey)
        );

        return filteredItems.length > 0
          ? { ...group, items: filteredItems }
          : null;
      } else {
        // Top-level item (e.g., Dashboard)
        return hasAccess(user, group.accessKey) ? { ...group } : null;
      }
    })
    .filter((group): group is NavGroup => group !== null);
}
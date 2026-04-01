// lib/nav-data.ts
import { NavGroup } from "@/types/types";

export const getNavData = (slug: string): NavGroup[] => [
  {
    title: "Reports",
    url: "#",
    items: [
      { title: "Dashboard", url: `/${slug}/dashboard` },
      { title: "Sales Summary", url: `/${slug}/sale_summary` },
      { title: "Sale By Category", url: `/${slug}/sale_category` },
      { title: "Sale By Employee", url: `/${slug}/sale_employee` },
      { title: "Sale By Payment", url: `/${slug}/sale_payment-type` },
    ],
  },
  {
    title: "POS",
    url: "#",
    items: [
      { title: "Sales Terminal", url: `/${slug}/sales-terminal` },
      { title: "Transactions", url: `/${slug}/transactions` },
      { title: "Invoices", url: `/${slug}/invoices` },
    ],
  },
  {
    title: "Product",
    url: "#",
    items: [
      { title: "Product List", url: `/${slug}/product_list` },
      { title: "Categories", url: `/${slug}/categories` },
      { title: "Discount", url: `/${slug}/discount` },
    ],
  },
  {
    title: "Employee",
    url: "#",
    items: [
      { title: "Employee List", url: `/${slug}/employees_list` },
      { title: "Time Cards", url: `/${slug}/time_cards` },
      { title: "Total Hours Worked", url: `/${slug}/total_hours_worked` },
    ],
  },
  {
    title: "Customers",
    url: "#",
    items: [
      { title: "Customer Base", url: `/${slug}/customers_base` },
      { title: "Loyalty", url: `/${slug}/loyalty` },
    ],
  },
  {
    title: "Settings",
    url: "#",
    items: [
      { title: "Access Controls", url: `/${slug}/access_controls` },
      { title: "Shops", url: `/${slug}/shops` },
    ],
  },
  {
    title: "Help",
    url: "#",
    items: [
      { title: "Community", url: "#", isExternal: true },
      { title: "Chat", url: "#", isExternal: true },
    ],
  },
];
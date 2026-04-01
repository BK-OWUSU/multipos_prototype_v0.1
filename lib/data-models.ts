import { NavGroup } from "@/types/types"

export const versions: string[] = ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"];
export const navData: NavGroup[] = [
    {
      title: "Reports", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Sales Summary",
          url: "/sale_summary",
        },
        {
          title: "Sale By Category",
          url: "/sale_category",
        },
        {
          title: "Sale By Employee",
          url: "/sale_employee",
        },
        {
          title: "Sale By Payment",
          url: "/sale_payment-type",
        },
      ],
    },
    {
      title: "POS", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Sales Terminal", 
          url: "/sales-terminal",
        },
        {
          title: "Transactions",
          url: "/transactions",
        },
        {
          title: "Invoices",
          url: "/invoices",
        },
      ],
    },
    {
      title: "Product", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Product List",
          url: "/product_list",
        },
        {
          title: "Categories",
          url: "/categories",
        },
        {
          title: "Discount",
          url: "/discount",
        },
      ],
    },
    {
      title: "Employee", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Employee List",
          url: "/employees_list",
        },
        {
          title: "Time Cards",
          url: "/time_cards",
        },
        {
          title: "Total Hours Worked",
          url: "/total_hours_worked",
        },
      ],
    },
    {
      title: "Customers", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Customer Base",
          url: "/customers_base",
        },
        {
          title: "Loyalty",
          url: "/loyalty",
        },
      ],
    },
    {
      title: "Settings", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Access Controls",
          url: "/access_controls",
        },
        {
          title: "Shops",
          url: "/shops",
        },
      ],
    },
    {
      title: "Help", //(Not Route, Just Group name)
      url: "#",
      items: [
        {
          title: "Community",
          url: "#",
          isExternal: true,
        },
        {
          title: "Chat",
          url: "#",
          isExternal: true,
        },
      ],
    },
  ];


export const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]
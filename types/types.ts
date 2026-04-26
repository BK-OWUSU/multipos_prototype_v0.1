import { type LucideIcon } from "lucide-react";

// Sidebar Navigation Items interface
export interface NavItem {
  title: string;
  url: string;
  accessKey: string; 
  isExternal?: boolean;
  icon?: LucideIcon;
}

export interface NavGroup {
  title: string;
  url: string;
  accessKey: string;
  items?: NavItem[];
  isExternal?: boolean;
  icon?: LucideIcon;
}



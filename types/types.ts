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
  items: NavItem[];
  isExternal?: boolean;
  icon?: LucideIcon;
}

//Alert interface
export interface AlertWithDiagProps {
    buttonText: string
    buttonVariant?: "default" | "outline" | "destructive" | "ghost" | "link" | "secondary"
    customVariant?: "primary" | "secondary" | "primary-outline" | "secondary-outline"
    title?: string
    message?: string
    cancelText?: string 
    confirmText: string,
    className ?: string,
    cancelFunction?: ()=> void;
    confirmFunction?: ()=> void;
}

// export type SignUpFormData = {
//     businessName: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     password: string;
//     confirmPassword: string;
//     termsAgreement?: boolean;
// }


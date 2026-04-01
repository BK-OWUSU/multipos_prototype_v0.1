// Sidebar Navigation Items interface
export interface NavItem {
  title: string;
  url: string;
  isExternal?: boolean;
}

export interface NavGroup {
  title: string;
  url: string;
  items: NavItem[];
}

//Alert interface
export interface AlertWithDiagProps {
    buttonText: string
    buttonVariant: "default" | "outline" | "destructive" | "ghost" | "link" | "secondary"
    title?: string
    message?: string
    cancelText?: string 
    confirmText: string
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


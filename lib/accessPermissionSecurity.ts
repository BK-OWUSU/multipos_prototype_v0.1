import { User } from "@/types/auth";

export default function hasAccess(user: User | null, key: string): boolean { 
    if (!user) return false;

    // Full access (OWNER / SUPER ADMIN)
    if (user?.role?.access.includes("*")) return true;

    // Check specific access key
    return user?.role?.access.includes(key);
}

// export default function hasPermission_(user: User | null, key: string): boolean { 
//     if (!user) return false;

//     // Full permission (OWNER / SUPER ADMIN)
//     if (user?.role?.permissions.includes("*")) return true;

//     // Check specific permission key
//     return user?.role?.permissions.includes(key);
// }